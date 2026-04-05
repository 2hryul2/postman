use crate::error::AppError;
use crate::models::collection::Collection;
use rusqlite::Connection;

pub fn get_all(conn: &Connection) -> Result<Vec<Collection>, AppError> {
    let mut stmt =
        conn.prepare("SELECT id, name, parent_id, sort_order, created_at FROM collections ORDER BY sort_order")?;
    let rows = stmt.query_map([], |row| {
        Ok(Collection {
            id: row.get(0)?,
            name: row.get(1)?,
            parent_id: row.get(2)?,
            sort_order: row.get(3)?,
            created_at: row.get(4)?,
        })
    })?;
    let mut result = Vec::new();
    for row in rows {
        result.push(row?);
    }
    Ok(result)
}

pub fn upsert(conn: &Connection, collection: &Collection) -> Result<(), AppError> {
    conn.execute(
        "INSERT INTO collections (id, name, parent_id, sort_order) VALUES (?1, ?2, ?3, ?4)
         ON CONFLICT(id) DO UPDATE SET name=?2, parent_id=?3, sort_order=?4",
        rusqlite::params![collection.id, collection.name, collection.parent_id, collection.sort_order],
    )?;
    Ok(())
}

pub fn delete(conn: &Connection, id: &str) -> Result<(), AppError> {
    conn.execute("DELETE FROM collections WHERE id = ?1", [id])?;
    Ok(())
}
