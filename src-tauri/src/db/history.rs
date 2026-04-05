use crate::error::AppError;
use crate::models::history::HistoryItem;
use rusqlite::Connection;

pub fn get_history(conn: &Connection, limit: i64, offset: i64) -> Result<Vec<HistoryItem>, AppError> {
    let mut stmt = conn.prepare(
        "SELECT id, request_id, method, url, request_raw, response_status, response_time_ms,
                response_size_bytes, response_headers, response_body, executed_at
         FROM history ORDER BY executed_at DESC LIMIT ?1 OFFSET ?2",
    )?;
    let rows = stmt.query_map(rusqlite::params![limit, offset], |row| {
        Ok(HistoryItem {
            id: row.get(0)?,
            request_id: row.get(1)?,
            method: row.get(2)?,
            url: row.get(3)?,
            request_raw: row.get(4)?,
            response_status: row.get(5)?,
            response_time_ms: row.get(6)?,
            response_size_bytes: row.get(7)?,
            response_headers: row.get(8)?,
            response_body: row.get(9)?,
            executed_at: row.get(10)?,
        })
    })?;
    let mut result = Vec::new();
    for row in rows {
        result.push(row?);
    }
    Ok(result)
}
