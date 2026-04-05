use crate::models::mcp::{JsonRpcRequest, JsonRpcResponse};
use std::sync::atomic::{AtomicU64, Ordering};

static REQUEST_ID: AtomicU64 = AtomicU64::new(1);

pub fn next_id() -> u64 {
    REQUEST_ID.fetch_add(1, Ordering::SeqCst)
}

pub fn make_request(method: &str, params: Option<serde_json::Value>) -> JsonRpcRequest {
    JsonRpcRequest {
        jsonrpc: "2.0".to_string(),
        id: Some(serde_json::Value::Number(next_id().into())),
        method: method.to_string(),
        params,
    }
}

pub fn make_notification(method: &str, params: Option<serde_json::Value>) -> JsonRpcRequest {
    JsonRpcRequest {
        jsonrpc: "2.0".to_string(),
        id: None,
        method: method.to_string(),
        params,
    }
}

pub fn parse_response(data: &str) -> Result<JsonRpcResponse, serde_json::Error> {
    serde_json::from_str(data)
}
