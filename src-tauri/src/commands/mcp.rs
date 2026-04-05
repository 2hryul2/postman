use crate::db::Database;
use crate::error::AppError;
use crate::mcp::client::McpClient;
use crate::models::mcp::*;
use std::collections::HashMap;
use std::sync::Arc;
use tauri::State;
use tokio::sync::Mutex;

pub struct McpState {
    pub clients: Mutex<HashMap<String, Arc<Mutex<McpClient>>>>,
}

impl McpState {
    pub fn new() -> Self {
        Self {
            clients: Mutex::new(HashMap::new()),
        }
    }
}

// Server CRUD
#[tauri::command]
pub fn mcp_get_servers(db: State<'_, Database>) -> Result<Vec<McpServer>, AppError> {
    let conn = db.conn.lock().unwrap();
    crate::db::mcp::get_servers(&conn)
}

#[tauri::command]
pub fn mcp_save_server(db: State<'_, Database>, server: McpServer) -> Result<(), AppError> {
    let conn = db.conn.lock().unwrap();
    crate::db::mcp::upsert_server(&conn, &server)
}

#[tauri::command]
pub async fn mcp_delete_server(
    db: State<'_, Database>,
    mcp_state: State<'_, McpState>,
    id: String,
) -> Result<(), AppError> {
    // Disconnect if connected
    {
        let mut clients = mcp_state.clients.lock().await;
        clients.remove(&id);
    }
    let conn = db.conn.lock().unwrap();
    crate::db::mcp::delete_server(&conn, &id)
}

// Connection management
#[tauri::command]
pub async fn mcp_connect(
    db: State<'_, Database>,
    mcp_state: State<'_, McpState>,
    server_id: String,
) -> Result<McpConnectionInfo, AppError> {
    // Get server config
    let server = {
        let conn = db.conn.lock().unwrap();
        let servers = crate::db::mcp::get_servers(&conn)?;
        servers.into_iter().find(|s| s.id == server_id)
            .ok_or(AppError::Custom("Server not found".into()))?
    };

    // Connect based on transport
    let client = match server.transport.as_str() {
        "stdio" => {
            let command = server.command.as_deref()
                .ok_or(AppError::Custom("Missing command for stdio transport".into()))?;
            let args: Vec<String> = server.args.as_deref()
                .and_then(|a| serde_json::from_str(a).ok())
                .unwrap_or_default();
            let env: HashMap<String, String> = server.env.as_deref()
                .and_then(|e| serde_json::from_str(e).ok())
                .unwrap_or_default();
            McpClient::connect_stdio(command, &args, &env).await?
        }
        "http" => {
            let url = server.url.as_deref()
                .ok_or(AppError::Custom("Missing URL for HTTP transport".into()))?;
            let headers: HashMap<String, String> = server.headers.as_deref()
                .and_then(|h| serde_json::from_str(h).ok())
                .unwrap_or_default();
            McpClient::connect_http(url, &headers).await?
        }
        _ => return Err(AppError::Custom(format!("Unknown transport: {}", server.transport))),
    };

    // Discover capabilities
    let tools = client.tools_list().await.unwrap_or_default();
    let resources = client.resources_list().await.unwrap_or_default();
    let prompts = client.prompts_list().await.unwrap_or_default();

    let info = McpConnectionInfo {
        tools,
        resources,
        prompts,
        protocol_version: client.protocol_version.clone(),
        server_name: client.server_name.clone(),
    };

    // Store client
    {
        let mut clients = mcp_state.clients.lock().await;
        clients.insert(server_id, Arc::new(Mutex::new(client)));
    }

    Ok(info)
}

#[tauri::command]
pub async fn mcp_disconnect(
    mcp_state: State<'_, McpState>,
    server_id: String,
) -> Result<(), AppError> {
    let client = {
        let mut clients = mcp_state.clients.lock().await;
        clients.remove(&server_id)
    };
    if let Some(client_arc) = client {
        let client = Arc::try_unwrap(client_arc)
            .map_err(|_| AppError::Custom("Client still in use".into()))?
            .into_inner();
        client.disconnect().await?;
    }
    Ok(())
}

// Tool operations
#[tauri::command]
pub async fn mcp_tools_list(
    mcp_state: State<'_, McpState>,
    server_id: String,
) -> Result<Vec<McpTool>, AppError> {
    let client = get_client(&mcp_state, &server_id).await?;
    let client = client.lock().await;
    client.tools_list().await
}

#[tauri::command]
pub async fn mcp_tools_call(
    db: State<'_, Database>,
    mcp_state: State<'_, McpState>,
    server_id: String,
    name: String,
    arguments: serde_json::Value,
) -> Result<serde_json::Value, AppError> {
    let start = std::time::Instant::now();

    let client = get_client(&mcp_state, &server_id).await?;
    let client = client.lock().await;
    let result = client.tools_call(&name, arguments.clone()).await;
    let elapsed = start.elapsed().as_millis() as i64;

    // Save to history
    let history_item = McpHistoryItem {
        id: uuid::Uuid::new_v4().to_string(),
        server_id: Some(server_id),
        method: format!("tools/call:{}", name),
        params: Some(serde_json::to_string(&arguments).unwrap_or_default()),
        result: result.as_ref().ok().and_then(|r| serde_json::to_string(r).ok()),
        is_error: result.is_err(),
        time_ms: Some(elapsed),
        executed_at: None,
    };
    if let Ok(conn) = db.conn.lock() {
        let _ = crate::db::mcp::insert_history(&conn, &history_item);
    }

    result
}

// Resource operations
#[tauri::command]
pub async fn mcp_resources_list(
    mcp_state: State<'_, McpState>,
    server_id: String,
) -> Result<Vec<McpResource>, AppError> {
    let client = get_client(&mcp_state, &server_id).await?;
    let client = client.lock().await;
    client.resources_list().await
}

#[tauri::command]
pub async fn mcp_resources_read(
    mcp_state: State<'_, McpState>,
    server_id: String,
    uri: String,
) -> Result<serde_json::Value, AppError> {
    let client = get_client(&mcp_state, &server_id).await?;
    let client = client.lock().await;
    client.resources_read(&uri).await
}

// Prompt operations
#[tauri::command]
pub async fn mcp_prompts_list(
    mcp_state: State<'_, McpState>,
    server_id: String,
) -> Result<Vec<McpPrompt>, AppError> {
    let client = get_client(&mcp_state, &server_id).await?;
    let client = client.lock().await;
    client.prompts_list().await
}

#[tauri::command]
pub async fn mcp_prompts_get(
    mcp_state: State<'_, McpState>,
    server_id: String,
    name: String,
    arguments: serde_json::Value,
) -> Result<serde_json::Value, AppError> {
    let client = get_client(&mcp_state, &server_id).await?;
    let client = client.lock().await;
    client.prompts_get(&name, arguments).await
}

// History
#[tauri::command]
pub fn mcp_get_history(
    db: State<'_, Database>,
    server_id: String,
    limit: i64,
) -> Result<Vec<McpHistoryItem>, AppError> {
    let conn = db.conn.lock().unwrap();
    crate::db::mcp::get_history(&conn, &server_id, limit)
}

// Helper
async fn get_client(
    mcp_state: &State<'_, McpState>,
    server_id: &str,
) -> Result<Arc<Mutex<McpClient>>, AppError> {
    let clients = mcp_state.clients.lock().await;
    clients.get(server_id)
        .cloned()
        .ok_or(AppError::Custom("Server not connected. Please connect first.".into()))
}
