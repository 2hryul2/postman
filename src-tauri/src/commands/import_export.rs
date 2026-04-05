use crate::db::Database;
use crate::error::AppError;
use crate::models::collection::Collection;
use crate::models::request::ApiRequest;
use tauri::State;

#[tauri::command]
pub fn import_postman_collection(db: State<'_, Database>, file_path: String) -> Result<(), AppError> {
    let content = std::fs::read_to_string(&file_path)?;
    let json: serde_json::Value = serde_json::from_str(&content)?;

    let info = json.get("info").ok_or(AppError::Custom("Invalid Postman collection: missing 'info'".into()))?;
    let collection_name = info.get("name")
        .and_then(|n| n.as_str())
        .unwrap_or("Imported Collection");

    let collection_id = uuid::Uuid::new_v4().to_string();
    let col = Collection {
        id: collection_id.clone(),
        name: collection_name.to_string(),
        parent_id: None,
        sort_order: 0,
        created_at: None,
    };

    let conn = db.conn.lock().unwrap();
    crate::db::collections::upsert(&conn, &col)?;

    // Parse items (requests)
    if let Some(items) = json.get("item").and_then(|i| i.as_array()) {
        for (idx, item) in items.iter().enumerate() {
            parse_postman_item(&conn, &collection_id, item, idx as i32)?;
        }
    }

    Ok(())
}

fn parse_postman_item(
    conn: &rusqlite::Connection,
    collection_id: &str,
    item: &serde_json::Value,
    sort_order: i32,
) -> Result<(), AppError> {
    let name = item.get("name").and_then(|n| n.as_str()).unwrap_or("Unnamed");

    // If item has "item" array, it's a folder — flatten into same collection
    if let Some(sub_items) = item.get("item").and_then(|i| i.as_array()) {
        for (idx, sub) in sub_items.iter().enumerate() {
            parse_postman_item(conn, collection_id, sub, (sort_order * 100) + idx as i32)?;
        }
        return Ok(());
    }

    // It's a request
    if let Some(request) = item.get("request") {
        let method = request.get("method")
            .and_then(|m| m.as_str())
            .unwrap_or("GET")
            .to_uppercase();

        let url = match request.get("url") {
            Some(serde_json::Value::String(s)) => s.clone(),
            Some(obj) => obj.get("raw").and_then(|r| r.as_str()).unwrap_or("").to_string(),
            None => String::new(),
        };

        // Parse headers
        let headers_json = request.get("header")
            .and_then(|h| h.as_array())
            .map(|arr| {
                let kvs: Vec<serde_json::Value> = arr.iter().map(|h| {
                    serde_json::json!({
                        "key": h.get("key").and_then(|k| k.as_str()).unwrap_or(""),
                        "value": h.get("value").and_then(|v| v.as_str()).unwrap_or(""),
                        "enabled": !h.get("disabled").and_then(|d| d.as_bool()).unwrap_or(false),
                    })
                }).collect();
                serde_json::to_string(&kvs).unwrap_or_default()
            });

        // Parse body
        let (body_type, body_content) = match request.get("body") {
            Some(body) => {
                let mode = body.get("mode").and_then(|m| m.as_str()).unwrap_or("raw");
                let content = match mode {
                    "raw" => body.get("raw").and_then(|r| r.as_str()).map(|s| s.to_string()),
                    _ => Some(body.to_string()),
                };
                let bt = match mode {
                    "raw" => {
                        // Check if JSON content type
                        let opts = body.get("options").and_then(|o| o.get("raw")).and_then(|r| r.get("language")).and_then(|l| l.as_str());
                        if opts == Some("json") { "json" } else { "raw" }
                    },
                    "formdata" => "form",
                    _ => "raw",
                };
                (Some(bt.to_string()), content)
            }
            None => (None, None),
        };

        let req = ApiRequest {
            id: uuid::Uuid::new_v4().to_string(),
            collection_id: Some(collection_id.to_string()),
            name: name.to_string(),
            method,
            url,
            headers: headers_json,
            params: None,
            body_type,
            body: body_content,
            auth_type: None,
            auth_config: None,
            sort_order,
            created_at: None,
            updated_at: None,
        };

        crate::db::requests::upsert(conn, &req)?;
    }

    Ok(())
}

#[tauri::command]
pub fn export_postman_collection(
    db: State<'_, Database>,
    collection_id: String,
    file_path: String,
) -> Result<(), AppError> {
    let conn = db.conn.lock().unwrap();

    // Get collection
    let collections = crate::db::collections::get_all(&conn)?;
    let col = collections.iter().find(|c| c.id == collection_id)
        .ok_or(AppError::Custom("Collection not found".into()))?;

    // Get requests
    let requests = crate::db::requests::get_by_collection(&conn, &collection_id)?;

    // Build Postman Collection v2.1 format
    let items: Vec<serde_json::Value> = requests.iter().map(|req| {
        let mut request_obj = serde_json::json!({
            "method": req.method,
            "url": { "raw": req.url },
        });

        // Add headers
        if let Some(ref h) = req.headers {
            if let Ok(headers) = serde_json::from_str::<Vec<serde_json::Value>>(h) {
                let postman_headers: Vec<serde_json::Value> = headers.iter().map(|kv| {
                    serde_json::json!({
                        "key": kv.get("key").and_then(|k| k.as_str()).unwrap_or(""),
                        "value": kv.get("value").and_then(|v| v.as_str()).unwrap_or(""),
                    })
                }).collect();
                request_obj["header"] = serde_json::json!(postman_headers);
            }
        }

        // Add body
        if let Some(ref body) = req.body {
            let mode = match req.body_type.as_deref() {
                Some("json") | Some("raw") => "raw",
                Some("form") => "formdata",
                _ => "raw",
            };
            request_obj["body"] = serde_json::json!({
                "mode": mode,
                "raw": body,
            });
        }

        serde_json::json!({
            "name": req.name,
            "request": request_obj,
        })
    }).collect();

    let postman_collection = serde_json::json!({
        "info": {
            "name": col.name,
            "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
        },
        "item": items,
    });

    let output = serde_json::to_string_pretty(&postman_collection)?;
    std::fs::write(&file_path, output)?;

    Ok(())
}
