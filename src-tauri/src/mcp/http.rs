use crate::error::AppError;
use crate::models::mcp::{JsonRpcRequest, JsonRpcResponse};
use std::collections::HashMap;

pub struct HttpTransport {
    client: reqwest::Client,
    endpoint: String,
    headers: HashMap<String, String>,
    session_id: tokio::sync::Mutex<Option<String>>,
}

impl HttpTransport {
    pub fn new(endpoint: &str, headers: &HashMap<String, String>) -> Result<Self, AppError> {
        let client = reqwest::Client::builder()
            .danger_accept_invalid_certs(true)
            .timeout(std::time::Duration::from_secs(30))
            .build()?;
        Ok(Self {
            client,
            endpoint: endpoint.to_string(),
            headers: headers.clone(),
            session_id: tokio::sync::Mutex::new(None),
        })
    }

    pub async fn send_and_receive(&self, request: &JsonRpcRequest) -> Result<JsonRpcResponse, AppError> {
        let mut req = self.client
            .post(&self.endpoint)
            .header("Content-Type", "application/json")
            .header("Accept", "application/json, text/event-stream")
            .header("MCP-Protocol-Version", "2025-03-26");

        // Add custom headers (auth etc.)
        for (k, v) in &self.headers {
            req = req.header(k.as_str(), v.as_str());
        }

        // Add session id if present
        {
            let session = self.session_id.lock().await;
            if let Some(ref sid) = *session {
                req = req.header("Mcp-Session-Id", sid.as_str());
            }
        }

        let body = serde_json::to_string(request)?;
        let response = req.body(body).send().await?;

        // Capture session id from response
        if let Some(sid) = response.headers().get("mcp-session-id") {
            if let Ok(sid_str) = sid.to_str() {
                let mut session = self.session_id.lock().await;
                *session = Some(sid_str.to_string());
            }
        }

        let content_type = response
            .headers()
            .get("content-type")
            .and_then(|v| v.to_str().ok())
            .unwrap_or("")
            .to_string();

        if content_type.contains("text/event-stream") {
            // Parse SSE stream — get last data event as the response
            let text = response.text().await?;
            let mut last_data = String::new();
            for line in text.lines() {
                if let Some(data) = line.strip_prefix("data: ") {
                    last_data = data.to_string();
                }
            }
            if last_data.is_empty() {
                return Err(AppError::Custom("Empty SSE response".to_string()));
            }
            let resp: JsonRpcResponse = serde_json::from_str(&last_data)?;
            Ok(resp)
        } else {
            // JSON response
            let text = response.text().await?;
            let resp: JsonRpcResponse = serde_json::from_str(&text)?;
            Ok(resp)
        }
    }
}
