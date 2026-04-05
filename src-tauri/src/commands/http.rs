use crate::db::Database;
use crate::error::AppError;
use crate::models::history::HistoryItem;
use crate::models::http::ResponsePayload;
use std::collections::HashMap;
use std::time::Instant;
use tauri::State;

#[tauri::command]
pub async fn execute_request(
    db: State<'_, Database>,
    method: String,
    url: String,
    headers: HashMap<String, String>,
    body: Option<String>,
    tls_skip_verify: bool,
    timeout_ms: u64,
) -> Result<ResponsePayload, AppError> {
    let start = Instant::now();

    let client = {
        let mut builder = reqwest::Client::builder()
            .timeout(std::time::Duration::from_millis(timeout_ms));
        if tls_skip_verify {
            builder = builder.danger_accept_invalid_certs(true);
        }
        builder.build()?
    };

    let mut req_builder = match method.to_uppercase().as_str() {
        "GET" => client.get(&url),
        "POST" => client.post(&url),
        "PUT" => client.put(&url),
        "DELETE" => client.delete(&url),
        "PATCH" => client.patch(&url),
        "HEAD" => client.head(&url),
        "OPTIONS" => client.request(reqwest::Method::OPTIONS, &url),
        _ => return Err(AppError::Custom(format!("Unsupported method: {}", method))),
    };

    for (key, value) in &headers {
        req_builder = req_builder.header(key.as_str(), value.as_str());
    }

    let request_raw = serde_json::json!({
        "method": method,
        "url": url,
        "headers": headers,
        "body": body,
    }).to_string();

    if let Some(body_str) = body {
        req_builder = req_builder.body(body_str);
    }

    let response = req_builder.send().await?;
    let elapsed = start.elapsed().as_millis() as u64;

    let status = response.status().as_u16();
    let status_text = response
        .status()
        .canonical_reason()
        .unwrap_or("Unknown")
        .to_string();

    let resp_headers: HashMap<String, String> = response
        .headers()
        .iter()
        .map(|(k, v)| (k.to_string(), v.to_str().unwrap_or("").to_string()))
        .collect();

    let body_bytes = response.bytes().await?;
    let size_bytes = body_bytes.len() as u64;
    let body_text = String::from_utf8_lossy(&body_bytes).to_string();

    // Save to history
    let history_item = HistoryItem {
        id: uuid::Uuid::new_v4().to_string(),
        request_id: None,
        method: Some(method),
        url: Some(url),
        request_raw: Some(request_raw),
        response_status: Some(status as i32),
        response_time_ms: Some(elapsed as i64),
        response_size_bytes: Some(size_bytes as i64),
        response_headers: Some(serde_json::to_string(&resp_headers).unwrap_or_default()),
        response_body: Some(body_text.clone()),
        executed_at: None,
    };

    // Non-blocking history save
    if let Ok(conn) = db.conn.lock() {
        let _ = crate::db::history::insert(&conn, &history_item);
    }

    Ok(ResponsePayload {
        status,
        status_text,
        headers: resp_headers,
        body: body_text,
        time_ms: elapsed,
        size_bytes,
    })
}
