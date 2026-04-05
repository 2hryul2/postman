use crate::error::AppError;
use crate::models::request::ApiRequest;
use rusqlite::Connection;

pub fn get_by_collection(conn: &Connection, collection_id: &str) -> Result<Vec<ApiRequest>, AppError> {
    let mut stmt = conn.prepare(
        "SELECT id, collection_id, name, method, url, headers, params, body_type, body, auth_type, auth_config, sort_order, created_at, updated_at
         FROM requests WHERE collection_id = ?1 ORDER BY sort_order",
    )?;
    let rows = stmt.query_map([collection_id], |row| {
        Ok(ApiRequest {
            id: row.get(0)?,
            collection_id: row.get(1)?,
            name: row.get(2)?,
            method: row.get(3)?,
            url: row.get(4)?,
            headers: row.get(5)?,
            params: row.get(6)?,
            body_type: row.get(7)?,
            body: row.get(8)?,
            auth_type: row.get(9)?,
            auth_config: row.get(10)?,
            sort_order: row.get(11)?,
            created_at: row.get(12)?,
            updated_at: row.get(13)?,
        })
    })?;
    let mut result = Vec::new();
    for row in rows {
        result.push(row?);
    }
    Ok(result)
}

pub fn upsert(conn: &Connection, req: &ApiRequest) -> Result<(), AppError> {
    conn.execute(
        "INSERT INTO requests (id, collection_id, name, method, url, headers, params, body_type, body, auth_type, auth_config, sort_order)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)
         ON CONFLICT(id) DO UPDATE SET
           collection_id=?2, name=?3, method=?4, url=?5, headers=?6, params=?7,
           body_type=?8, body=?9, auth_type=?10, auth_config=?11, sort_order=?12,
           updated_at=CURRENT_TIMESTAMP",
        rusqlite::params![
            req.id, req.collection_id, req.name, req.method, req.url,
            req.headers, req.params, req.body_type, req.body,
            req.auth_type, req.auth_config, req.sort_order
        ],
    )?;
    Ok(())
}
