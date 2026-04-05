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

#[tauri::command]
pub fn save_environment(db: State<'_, Database>, environment: Environment) -> Result<(), AppError> {
    let conn = db.conn.lock().unwrap();
    crate::db::environments::upsert_environment(&conn, &environment)
}

#[tauri::command]
pub fn delete_environment(db: State<'_, Database>, id: String) -> Result<(), AppError> {
    let conn = db.conn.lock().unwrap();
    crate::db::environments::delete_environment(&conn, &id)
}

#[tauri::command]
pub fn save_env_variable(db: State<'_, Database>, variable: EnvVariable) -> Result<(), AppError> {
    let conn = db.conn.lock().unwrap();
    crate::db::environments::upsert_variable(&conn, &variable)
}

#[tauri::command]
pub fn delete_env_variable(db: State<'_, Database>, id: String) -> Result<(), AppError> {
    let conn = db.conn.lock().unwrap();
    crate::db::environments::delete_variable(&conn, &id)
}
