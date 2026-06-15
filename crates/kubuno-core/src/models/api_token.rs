use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use validator::Validate;

#[derive(Debug, Clone, Serialize, FromRow)]
pub struct ApiToken {
    pub id:           Uuid,
    pub user_id:      Uuid,
    pub name:         String,
    #[serde(skip_serializing)]
    pub token_hash:   String,
    pub expires_at:   Option<DateTime<Utc>>,
    pub created_at:   DateTime<Utc>,
    pub last_used_at: Option<DateTime<Utc>>,
    pub revoked_at:   Option<DateTime<Utc>>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct CreateApiTokenDto {
    #[validate(length(min = 1, max = 255, message = "Nom: 1-255 caractères"))]
    pub name:       String,
    /// Expiration en jours. None = sans expiration.
    pub expires_in_days: Option<u32>,
}
