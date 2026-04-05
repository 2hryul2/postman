use crate::db::Database;
use crate::error::AppError;
use crate::models::request::ApiRequest;
use tauri::State;

#[tauri::command]
pub fn get_requests(db: State<'_, Database>, collection_id: String) -> Result<Vec<ApiRequest>, AppError> {
    let conn = db.conn.lock().unwrap();
    crate::db::requests::get_by_collection(&conn, &collection_id)
}

#[tauri::command]
pub fn save_request(db: State<'_, Database>, request: ApiRequest) -> Result<(), AppError> {
    let conn = db.conn.lock().unwrap();
    crate::db::requests::upsert(&conn, &request)
}
