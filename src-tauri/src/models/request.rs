use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApiRequest {
    pub id: String,
    pub collection_id: Option<String>,
    pub name: String,
    pub method: String,
    pub url: String,
    pub headers: Option<String>,
    pub params: Option<String>,
    pub body_type: Option<String>,
    pub body: Option<String>,
    pub auth_type: Option<String>,
    pub auth_config: Option<String>,
    pub sort_order: i32,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}
