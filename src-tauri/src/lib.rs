mod commands;
mod db;
mod error;
mod mcp;
mod models;

use commands::mcp::McpState;
use db::Database;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let app_data_dir = app
                .path()
                .app_data_dir()
                .expect("Failed to resolve app data directory");
            std::fs::create_dir_all(&app_data_dir)?;

            let db_path = app_data_dir.join("hiveapi.db");
            let database =
                Database::new(db_path.to_str().expect("Invalid DB path"))
                    .expect("Failed to open database");

            {
                let conn = database.conn.lock().unwrap();
                db::schema::initialize_database(&conn)
                    .expect("Failed to initialize database schema");
            }

            app.manage(database);
            app.manage(McpState::new());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::http::execute_request,
            commands::collections::get_collections,
            commands::collections::save_collection,
            commands::collections::delete_collection,
            commands::requests::get_requests,
            commands::requests::save_request,
            commands::environments::get_environments,
            commands::environments::get_env_variables,
            commands::environments::save_environment,
            commands::environments::delete_environment,
            commands::environments::save_env_variable,
            commands::environments::delete_env_variable,
            commands::history::get_history,
            commands::import_export::import_postman_collection,
            commands::import_export::export_postman_collection,
            // MCP commands
            commands::mcp::mcp_get_servers,
            commands::mcp::mcp_save_server,
            commands::mcp::mcp_delete_server,
            commands::mcp::mcp_connect,
            commands::mcp::mcp_disconnect,
            commands::mcp::mcp_tools_list,
            commands::mcp::mcp_tools_call,
            commands::mcp::mcp_resources_list,
            commands::mcp::mcp_resources_read,
            commands::mcp::mcp_prompts_list,
            commands::mcp::mcp_prompts_get,
            commands::mcp::mcp_get_history,
        ])
        .run(tauri::generate_context!())
        .expect("error while running HiveAPI");
}
