use crate::error::AppError;
use crate::models::mcp::{McpHistoryItem, McpServer};
use rusqlite::Connection;

pub fn get_servers(conn: &Connection) -> Result<Vec<McpServer>, AppError> {
    let mut stmt = conn.prepare(
        "SELECT id, name, transport, command, args, env, url, headers, auto_connect, created_at FROM mcp_servers ORDER BY created_at",
    )?;
    let rows = stmt.query_map([], |row| {
        Ok(McpServer {
            id: row.get(0)?,
            name: row.get(1)?,
            transport: row.get(2)?,
            command: row.get(3)?,
            args: row.get(4)?,
            env: row.get(5)?,
            url: row.get(6)?,
            headers: row.get(7)?,
            auto_connect: row.get::<_, i32>(8)? != 0,
            created_at: row.get(9)?,
        })
    })?;
    let mut result = Vec::new();
    for row in rows {
        result.push(row?);
    }
    Ok(result)
}

pub fn upsert_server(conn: &Connection, server: &McpServer) -> Result<(), AppError> {
    conn.execute(
        "INSERT INTO mcp_servers (id, name, transport, command, args, env, url, headers, auto_connect)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
         ON CONFLICT(id) DO UPDATE SET name=?2, transport=?3, command=?4, args=?5, env=?6, url=?7, headers=?8, auto_connect=?9",
        rusqlite::params![
            server.id, server.name, server.transport, server.command,
            server.args, server.env, server.url, server.headers,
            server.auto_connect as i32
        ],
    )?;
    Ok(())
}

pub fn delete_server(conn: &Connection, id: &str) -> Result<(), AppError> {
    conn.execute("DELETE FROM mcp_history WHERE server_id = ?1", [id])?;
    conn.execute("DELETE FROM mcp_servers WHERE id = ?1", [id])?;
    Ok(())
}

pub fn insert_history(conn: &Connection, item: &McpHistoryItem) -> Result<(), AppError> {
    conn.execute(
        "INSERT INTO mcp_history (id, server_id, method, params, result, is_error, time_ms)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        rusqlite::params![
            item.id, item.server_id, item.method, item.params,
            item.result, item.is_error as i32, item.time_ms
        ],
    )?;
    Ok(())
}

pub fn get_history(conn: &Connection, server_id: &str, limit: i64) -> Result<Vec<McpHistoryItem>, AppError> {
    let mut stmt = conn.prepare(
        "SELECT id, server_id, method, params, result, is_error, time_ms, executed_at
         FROM mcp_history WHERE server_id = ?1 ORDER BY executed_at DESC LIMIT ?2",
    )?;
    let rows = stmt.query_map(rusqlite::params![server_id, limit], |row| {
        Ok(McpHistoryItem {
            id: row.get(0)?,
            server_id: row.get(1)?,
            method: row.get(2)?,
            params: row.get(3)?,
            result: row.get(4)?,
            is_error: row.get::<_, i32>(5)? != 0,
            time_ms: row.get(6)?,
            executed_at: row.get(7)?,
        })
    })?;
    let mut result = Vec::new();
    for row in rows {
        result.push(row?);
    }
    Ok(result)
}
