use crate::db::Database;
use crate::error::AppError;
use crate::models::collection::Collection;
use tauri::State;

#[tauri::command]
pub fn get_collections(db: State<'_, Database>) -> Result<Vec<Collection>, AppError> {
    let conn = db.conn.lock().unwrap();
    crate::db::collections::get_all(&conn)
}

#[tauri::command]
pub fn save_collection(db: State<'_, Database>, collection: Collection) -> Result<(), AppError> {
    let conn = db.conn.lock().unwrap();
    crate::db::collections::upsert(&conn, &collection)
}

#[tauri::command]
pub fn delete_collection(db: State<'_, Database>, id: String) -> Result<(), AppError> {
    let conn = db.conn.lock().unwrap();
    crate::db::collections::delete(&conn, &id)
}
