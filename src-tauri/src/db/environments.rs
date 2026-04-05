use crate::error::AppError;
use crate::models::environment::{EnvVariable, Environment};
use rusqlite::Connection;

pub fn get_all(conn: &Connection) -> Result<Vec<Environment>, AppError> {
    let mut stmt = conn.prepare("SELECT id, name FROM environments")?;
    let rows = stmt.query_map([], |row| {
        Ok(Environment {
            id: row.get(0)?,
            name: row.get(1)?,
        })
    })?;
    let mut result = Vec::new();
    for row in rows {
        result.push(row?);
    }
    Ok(result)
}

pub fn get_variables(conn: &Connection, environment_id: &str) -> Result<Vec<EnvVariable>, AppError> {
    let mut stmt = conn.prepare(
        "SELECT id, environment_id, key, value, is_secret FROM env_variables WHERE environment_id = ?1",
    )?;
    let rows = stmt.query_map([environment_id], |row| {
        Ok(EnvVariable {
            id: row.get(0)?,
            environment_id: row.get(1)?,
            key: row.get(2)?,
            value: row.get(3)?,
            is_secret: row.get::<_, i32>(4)? != 0,
        })
    })?;
    let mut result = Vec::new();
    for row in rows {
        result.push(row?);
    }
    Ok(result)
}
