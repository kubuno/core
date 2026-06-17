use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use utoipa::ToSchema;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, FromRow, ToSchema)]
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
    /// Root of the rotation chain (all refresh tokens issued from one device login).
    pub family_id:     Option<Uuid>,
    /// How the session was opened: 'web' | 'native' | 'desktop' | 'api'.
    pub client_type:   Option<String>,
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

#[derive(Debug, Deserialize, ToSchema)]
pub struct LoginDto {
    /// Email ou nom d'utilisateur.
    pub login:    String,
    pub password: String,
    pub device_name: Option<String>,
    pub device_type: Option<String>,
    /// 'web' (default) keeps the HttpOnly cookie. 'native'/'desktop' receive the
    /// refresh token in the JSON body (no cookie) so non-browser clients can
    /// store it in the OS keychain and refresh without a cookie jar.
    pub client_type: Option<String>,
}

#[derive(Debug, Serialize, ToSchema)]
pub struct LoginResponse {
    pub access_token: String,
    pub user:         crate::models::user::User,
}

/// Token response for native/desktop clients. The raw refresh token is returned
/// in the body (never logged) and rotated on every `/auth/refresh`.
///
/// `Debug` is intentionally NOT derived: the refresh token must never reach the
/// logs through a stray `{:?}`.
#[derive(Serialize, ToSchema)]
pub struct NativeTokenResponse {
    pub access_token:       String,
    pub refresh_token:      String,
    pub refresh_expires_at: DateTime<Utc>,
    pub user:               crate::models::user::User,
}
