use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use utoipa::ToSchema;
use uuid::Uuid;
use validator::{Validate, ValidationError};

#[derive(Debug, Clone, Serialize, FromRow, ToSchema)]
pub struct User {
    pub id:             Uuid,
    pub email:          String,
    pub username:       String,
    #[serde(skip_serializing)]
    pub password_hash:  Option<String>,
    pub display_name:   Option<String>,
    pub avatar_url:     Option<String>,
    pub role:           String,
    pub quota_bytes:    i64,
    pub used_bytes:     i64,
    pub is_active:      bool,
    pub email_verified: bool,
    pub oauth_provider: Option<String>,
    pub oauth_id:       Option<String>,
    pub preferences:    serde_json::Value,
    pub created_at:     DateTime<Utc>,
    pub updated_at:     DateTime<Utc>,
    pub last_login_at:  Option<DateTime<Utc>>,
    pub totp_enabled:        bool,
    #[serde(skip_serializing)]
    pub totp_secret:         Option<String>,
    #[serde(skip_serializing)]
    pub totp_pending_secret: Option<String>,
}

#[derive(Debug, Deserialize, Validate, ToSchema)]
pub struct CreateUserDto {
    #[validate(email(message = "Email invalide"))]
    pub email:    String,
    #[validate(length(min = 3, max = 100, message = "Username: 3-100 caractères"))]
    pub username: String,
    #[validate(length(min = 8, message = "Mot de passe: 8 caractères minimum"))]
    pub password: String,
    pub display_name: Option<String>,
}

fn validate_http_url(url: &str) -> Result<(), ValidationError> {
    if url.starts_with("https://") || url.starts_with("http://") {
        Ok(())
    } else {
        let mut e = ValidationError::new("url");
        e.message = Some(std::borrow::Cow::Borrowed("L'URL doit utiliser le schéma http ou https"));
        Err(e)
    }
}

#[derive(Debug, Deserialize, Validate)]
pub struct UpdateUserDto {
    #[validate(length(max = 255))]
    pub display_name: Option<String>,
    #[validate(custom(function = "validate_http_url"))]
    pub avatar_url:   Option<String>,
    pub preferences:  Option<serde_json::Value>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct ChangePasswordDto {
    pub old_password: String,
    #[validate(length(min = 8, message = "Nouveau mot de passe: 8 caractères minimum"))]
    pub new_password: String,
}
