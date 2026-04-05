use crate::error::AppError;

#[tauri::command]
pub fn import_postman_collection(file_path: String) -> Result<(), AppError> {
    Err(AppError::Custom(format!(
        "Postman import not yet implemented: {}",
        file_path
    )))
}

#[tauri::command]
pub fn export_postman_collection(collection_id: String, file_path: String) -> Result<(), AppError> {
    Err(AppError::Custom(format!(
        "Postman export not yet implemented: {} -> {}",
        collection_id, file_path
    )))
}
