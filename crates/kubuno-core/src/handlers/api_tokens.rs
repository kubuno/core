use axum::{
    extract::{Path, State},
    Json,
};
use chrono::Utc;
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use uuid::Uuid;
use validator::Validate;

use crate::{
    auth::middleware::AuthUser,
    errors::AppError,
    handlers::admin::groups::user_has_permission,
    models::api_token::{ApiToken, CreateApiTokenDto},
    state::AppState,
};

/// Préfixe reconnaissable dans les logs et interfaces.
const TOKEN_PREFIX: &str = "kubuno_";

/// Génère un token brut et retourne (token_brut, sha256_hex).
fn generate_api_token() -> (String, String) {
    use rand::RngCore;
    let mut raw = [0u8; 32];
    rand::thread_rng().fill_bytes(&mut raw);
    let encoded = base64::engine::general_purpose::URL_SAFE_NO_PAD
        .encode(raw);
    let token = format!("{TOKEN_PREFIX}{encoded}");
    let hash  = hex::encode(Sha256::digest(token.as_bytes()));
    (token, hash)
}

pub async fn list(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
) -> Result<Json<Value>, AppError> {
    let tokens = sqlx::query_as::<_, ApiToken>(
        r#"SELECT id, user_id, name, token_hash, expires_at,
                  created_at, last_used_at, revoked_at
           FROM core.api_tokens
           WHERE user_id = $1 AND revoked_at IS NULL
           ORDER BY created_at DESC"#,
    )
    .bind(user.id)
    .fetch_all(&state.db)
    .await?;

    Ok(Json(json!({ "tokens": tokens })))
}

pub async fn create(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
    Json(dto): Json<CreateApiTokenDto>,
) -> Result<Json<Value>, AppError> {
    dto.validate()
        .map_err(|e| AppError::Validation(e.to_string()))?;

    // Vérifier que ce rôle (ou un groupe de l'utilisateur) peut créer des tokens
    let allowed_roles = load_allowed_roles(&state.db).await;
    let allowed = user_has_permission(
        &state.db,
        &user.role,
        user.id,
        "api_tokens.create",
        &allowed_roles,
    ).await;
    if !allowed {
        return Err(AppError::Forbidden);
    }

    let (raw_token, hash) = generate_api_token();

    let expires_at = dto.expires_in_days.map(|days| {
        Utc::now() + chrono::Duration::days(days as i64)
    });

    let token = sqlx::query_as::<_, ApiToken>(
        r#"INSERT INTO core.api_tokens (user_id, name, token_hash, expires_at)
           VALUES ($1, $2, $3, $4)
           RETURNING id, user_id, name, token_hash, expires_at,
                     created_at, last_used_at, revoked_at"#,
    )
    .bind(user.id)
    .bind(&dto.name)
    .bind(&hash)
    .bind(expires_at)
    .fetch_one(&state.db)
    .await?;

    // Le token brut n'est retourné qu'une seule fois — ne jamais le logger
    Ok(Json(json!({
        "token":       raw_token,
        "id":          token.id,
        "name":        token.name,
        "expires_at":  token.expires_at,
        "created_at":  token.created_at,
    })))
}

pub async fn revoke(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
    Path(token_id): Path<Uuid>,
) -> Result<Json<Value>, AppError> {
    let affected = sqlx::query(
        r#"UPDATE core.api_tokens
           SET revoked_at = NOW()
           WHERE id = $1 AND user_id = $2 AND revoked_at IS NULL"#,
    )
    .bind(token_id)
    .bind(user.id)
    .execute(&state.db)
    .await?
    .rows_affected();

    if affected == 0 {
        return Err(AppError::NotFound("Token introuvable".into()));
    }

    Ok(Json(json!({ "message": "Token révoqué" })))
}

/// Résout un token brut en user_id (utilisé par le middleware et le proxy).
/// Met à jour `last_used_at` en best-effort.
pub async fn resolve_token(db: &sqlx::PgPool, raw_token: &str) -> Option<Uuid> {
    if !raw_token.starts_with(TOKEN_PREFIX) {
        return None;
    }
    let hash = hex::encode(Sha256::digest(raw_token.as_bytes()));
    let row: Option<(Uuid, Option<chrono::DateTime<Utc>>)> = sqlx::query_as(
        r#"SELECT user_id, expires_at FROM core.api_tokens
           WHERE token_hash = $1 AND revoked_at IS NULL"#,
    )
    .bind(&hash)
    .fetch_optional(db)
    .await
    .ok()?;

    let (user_id, expires_at) = row?;

    // Vérifier l'expiration
    if let Some(exp) = expires_at {
        if exp < Utc::now() {
            return None;
        }
    }

    // Mise à jour last_used_at (best-effort, on ignore l'erreur)
    let _ = sqlx::query(
        "UPDATE core.api_tokens SET last_used_at = NOW() WHERE token_hash = $1",
    )
    .bind(&hash)
    .execute(db)
    .await;

    Some(user_id)
}

use base64::Engine as _;

/// Charge la liste des rôles autorisés depuis la setting `auth.api_token_allowed_roles`.
async fn load_allowed_roles(db: &sqlx::PgPool) -> Vec<String> {
    let row: Option<serde_json::Value> = sqlx::query_scalar(
        "SELECT value FROM core.settings WHERE key = 'auth.api_token_allowed_roles'",
    )
    .fetch_optional(db)
    .await
    .ok()
    .flatten();

    row.and_then(|v| serde_json::from_value::<Vec<String>>(v).ok())
        .unwrap_or_else(|| vec!["user".into(), "admin".into()])
}
