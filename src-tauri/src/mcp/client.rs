use crate::error::AppError;
use crate::mcp::http::HttpTransport;
use crate::mcp::jsonrpc;
use crate::mcp::stdio::StdioTransport;
use crate::models::mcp::*;
use std::collections::HashMap;

enum Transport {
    Stdio(StdioTransport),
    Http(HttpTransport),
}

pub struct McpClient {
    transport: Transport,
    pub server_name: String,
    pub protocol_version: String,
}

impl McpClient {
    pub async fn connect_stdio(
        command: &str,
        args: &[String],
        env: &HashMap<String, String>,
    ) -> Result<Self, AppError> {
        let transport = StdioTransport::spawn(command, args, env).await?;
        let mut client = Self {
            transport: Transport::Stdio(transport),
            server_name: String::new(),
            protocol_version: String::new(),
        };
        client.initialize().await?;
        Ok(client)
    }

    pub async fn connect_http(
        endpoint: &str,
        headers: &HashMap<String, String>,
    ) -> Result<Self, AppError> {
        let transport = HttpTransport::new(endpoint, headers)?;
        let mut client = Self {
            transport: Transport::Http(transport),
            server_name: String::new(),
            protocol_version: String::new(),
        };
        client.initialize().await?;
        Ok(client)
    }

    async fn send_request(
        &self,
        method: &str,
        params: Option<serde_json::Value>,
    ) -> Result<JsonRpcResponse, AppError> {
        let request = jsonrpc::make_request(method, params);
        match &self.transport {
            Transport::Stdio(t) => t.send_and_receive(&request).await,
            Transport::Http(t) => t.send_and_receive(&request).await,
        }
    }

    async fn send_notification(
        &self,
        method: &str,
        params: Option<serde_json::Value>,
    ) -> Result<(), AppError> {
        let notification = jsonrpc::make_notification(method, params);
        match &self.transport {
            Transport::Stdio(t) => t.send(&notification).await,
            Transport::Http(_) => {
                // For HTTP, notifications are POSTed and expect 202
                Ok(())
            }
        }
    }

    async fn initialize(&mut self) -> Result<(), AppError> {
        let params = serde_json::json!({
            "protocolVersion": "2025-03-26",
            "capabilities": {},
            "clientInfo": {
                "name": "HiveAPI",
                "version": "0.1.0"
            }
        });

        let resp = self.send_request("initialize", Some(params)).await?;

        if let Some(ref error) = resp.error {
            return Err(AppError::Custom(format!(
                "MCP initialize error: {}",
                error.message
            )));
        }

        if let Some(ref result) = resp.result {
            self.protocol_version = result
                .get("protocolVersion")
                .and_then(|v| v.as_str())
                .unwrap_or("unknown")
                .to_string();
            self.server_name = result
                .get("serverInfo")
                .and_then(|s| s.get("name"))
                .and_then(|v| v.as_str())
                .unwrap_or("unknown")
                .to_string();
        }

        // Send initialized notification
        self.send_notification("notifications/initialized", None)
            .await?;

        Ok(())
    }

    pub async fn tools_list(&self) -> Result<Vec<McpTool>, AppError> {
        let resp = self.send_request("tools/list", None).await?;
        if let Some(ref error) = resp.error {
            return Err(AppError::Custom(format!("tools/list error: {}", error.message)));
        }
        let tools = resp.result
            .as_ref()
            .and_then(|r| r.get("tools"))
            .and_then(|t| serde_json::from_value::<Vec<McpTool>>(t.clone()).ok())
            .unwrap_or_default();
        Ok(tools)
    }

    pub async fn tools_call(
        &self,
        name: &str,
        arguments: serde_json::Value,
    ) -> Result<serde_json::Value, AppError> {
        let params = serde_json::json!({
            "name": name,
            "arguments": arguments,
        });
        let resp = self.send_request("tools/call", Some(params)).await?;
        if let Some(ref error) = resp.error {
            return Err(AppError::Custom(format!("tools/call error: {}", error.message)));
        }
        Ok(resp.result.unwrap_or(serde_json::Value::Null))
    }

    pub async fn resources_list(&self) -> Result<Vec<McpResource>, AppError> {
        let resp = self.send_request("resources/list", None).await?;
        if let Some(ref error) = resp.error {
            return Err(AppError::Custom(format!("resources/list error: {}", error.message)));
        }
        let resources = resp.result
            .as_ref()
            .and_then(|r| r.get("resources"))
            .and_then(|t| serde_json::from_value::<Vec<McpResource>>(t.clone()).ok())
            .unwrap_or_default();
        Ok(resources)
    }

    pub async fn resources_read(&self, uri: &str) -> Result<serde_json::Value, AppError> {
        let params = serde_json::json!({ "uri": uri });
        let resp = self.send_request("resources/read", Some(params)).await?;
        if let Some(ref error) = resp.error {
            return Err(AppError::Custom(format!("resources/read error: {}", error.message)));
        }
        Ok(resp.result.unwrap_or(serde_json::Value::Null))
    }

    pub async fn prompts_list(&self) -> Result<Vec<McpPrompt>, AppError> {
        let resp = self.send_request("prompts/list", None).await?;
        if let Some(ref error) = resp.error {
            return Err(AppError::Custom(format!("prompts/list error: {}", error.message)));
        }
        let prompts = resp.result
            .as_ref()
            .and_then(|r| r.get("prompts"))
            .and_then(|t| serde_json::from_value::<Vec<McpPrompt>>(t.clone()).ok())
            .unwrap_or_default();
        Ok(prompts)
    }

    pub async fn prompts_get(
        &self,
        name: &str,
        arguments: serde_json::Value,
    ) -> Result<serde_json::Value, AppError> {
        let params = serde_json::json!({
            "name": name,
            "arguments": arguments,
        });
        let resp = self.send_request("prompts/get", Some(params)).await?;
        if let Some(ref error) = resp.error {
            return Err(AppError::Custom(format!("prompts/get error: {}", error.message)));
        }
        Ok(resp.result.unwrap_or(serde_json::Value::Null))
    }

    pub async fn disconnect(self) -> Result<(), AppError> {
        if let Transport::Stdio(t) = &self.transport {
            t.kill().await?;
        }
        Ok(())
    }
}
