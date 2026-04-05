use crate::db::Database;
use crate::error::AppError;
use crate::models::history::HistoryItem;
use tauri::State;

#[tauri::command]
pub fn get_history(db: State<'_, Database>, limit: i64, offset: i64) -> Result<Vec<HistoryItem>, AppError> {
    let conn = db.conn.lock().unwrap();
    crate::db::history::get_history(&conn, limit, offset)
}
