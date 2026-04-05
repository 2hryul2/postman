use crate::db::Database;
use crate::error::AppError;
use crate::models::environment::{EnvVariable, Environment};
use tauri::State;

#[tauri::command]
pub fn get_environments(db: State<'_, Database>) -> Result<Vec<Environment>, AppError> {
    let conn = db.conn.lock().unwrap();
    crate::db::environments::get_all(&conn)
}

#[tauri::command]
pub fn get_env_variables(
    db: State<'_, Database>,
    environment_id: String,
) -> Result<Vec<EnvVariable>, AppError> {
    let conn = db.conn.lock().unwrap();
    crate::db::environments::get_variables(&conn, &environment_id)
}
