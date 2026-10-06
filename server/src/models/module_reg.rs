use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct RegisteredModule {
    pub id:             String,
    pub display_name:   String,
    pub version:        String,
    pub description:    Option<String>,
    pub author:         Option<String>,
    pub license:        Option<String>,
    pub homepage_url:   Option<String>,
    pub runtime:        String,
    pub dependencies:   Vec<String>,
    pub is_enabled:     bool,
    pub is_core_module: bool,
    pub config:         serde_json::Value,
    pub installed_at:   DateTime<Utc>,
    pub updated_at:     DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModuleHealth {
    pub module_id:      String,
    pub status:         String,
    pub last_heartbeat: Option<DateTime<Utc>>,
}
