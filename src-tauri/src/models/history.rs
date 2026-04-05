use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HistoryItem {
    pub id: String,
    pub request_id: Option<String>,
    pub method: Option<String>,
    pub url: Option<String>,
    pub request_raw: Option<String>,
    pub response_status: Option<i32>,
    pub response_time_ms: Option<i64>,
    pub response_size_bytes: Option<i64>,
    pub response_headers: Option<String>,
    pub response_body: Option<String>,
    pub executed_at: Option<String>,
}
