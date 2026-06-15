use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, FromRow)]
pub struct RefreshToken {
    pub id:            Uuid,
    pub user_id:       Uuid,
    #[serde(skip_serializing)]
    pub token_hash:    String,
    pub device_name:   Option<String>,
    pub device_type:   Option<String>,
    pub ip_address:    Option<String>,
    pub user_agent:    Option<String>,
    pub expires_at:    DateTime<Utc>,
    pub created_at:    DateTime<Utc>,
    pub last_used_at:  DateTime<Utc>,
    pub revoked_at:    Option<DateTime<Utc>>,
    pub revoke_reason: Option<String>,
}

#[derive(Debug, Clone, Serialize, FromRow)]
pub struct VerificationToken {
    pub id:         Uuid,
    pub user_id:    Uuid,
    #[serde(skip_serializing)]
    pub token_hash: String,
    pub purpose:    String,
    pub expires_at: DateTime<Utc>,
    pub used_at:    Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct LoginDto {
    /// Email ou nom d'utilisateur.
    pub login:    String,
    pub password: String,
    pub device_name: Option<String>,
    pub device_type: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct LoginResponse {
    pub access_token: String,
    pub user:         crate::models::user::User,
}
