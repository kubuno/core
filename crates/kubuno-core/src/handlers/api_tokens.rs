//! Personal API tokens: minting, listing, revoking.
//!
//! The raw token is returned **once**, by [`create`], and never again — not in a
//! listing, not in a log, not in the audit trail. What circulates afterwards is
//! the row id, the name its owner gave it, and its scopes.
//!
//! Resolution (turning a presented token back into an authorisation) lives in
//! [`crate::auth::token_scope`], not here: the middleware, the module proxy and
//! the MCP endpoint all go through that one path, which is what makes a refusal
//! added there apply everywhere.

use axum::{
    extract::{Path, State},
    http::request::Parts,
    Json,
};
use base64::Engine as _;
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use uuid::Uuid;
use validator::Validate;

use crate::{
    audit::{context_from, redact, AuditEntry},
    auth::{
        middleware::AuthUser,
        reauth::Reauthenticated,
        token_scope::{grant::TOKEN_PREFIX, policy},
    },
    authz::context as authz_context,
    errors::AppError,
    handlers::admin::groups::user_has_permission,
    models::api_token::{ApiToken, CreateApiTokenDto},
    state::AppState,
};

/// Génère un token brut et retourne (token_brut, sha256_hex).
fn generate_api_token() -> (String, String) {
    use rand::RngCore;
    let mut raw = [0u8; 32];
    rand::thread_rng().fill_bytes(&mut raw);
    let encoded = base64::engine::general_purpose::URL_SAFE_NO_PAD.encode(raw);
    let token = format!("{TOKEN_PREFIX}{encoded}");
    let hash = hex::encode(Sha256::digest(token.as_bytes()));
    (token, hash)
}

/// Reads the columns the interface needs, plus the computed grace deadline.
///
/// `legacy_grace_until` is derived at read time from `legacy_since` and the
/// current setting, so widening or closing the migration window from the
/// settings is reflected immediately — in the interface and in the refusals —
/// without a second migration or a backfill.
pub async fn list(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
) -> Result<Json<Value>, AppError> {
    let tokens = sqlx::query_as::<_, ApiToken>(
        r#"SELECT id, user_id, name, token_hash, scopes, is_legacy, legacy_since,
                  expires_at, created_at, last_used_at, revoked_at
           FROM core.api_tokens
           WHERE user_id = $1 AND revoked_at IS NULL
           ORDER BY created_at DESC"#,
    )
    .bind(user.id)
    .fetch_all(&state.db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, user_id = %user.id, "Liste des jetons d'API");
        AppError::Database(e)
    })?;

    let grace_days = policy::legacy_grace_days(&state.db).await;
    let tokens: Vec<Value> = tokens
        .iter()
        .map(|t| {
            let mut v = serde_json::to_value(t).unwrap_or_else(|_| json!({}));
            let until = t
                .legacy_since
                .map(|since| policy::grace_deadline(since, grace_days));
            if let Some(obj) = v.as_object_mut() {
                obj.insert("legacy_grace_until".into(), json!(until));
            }
            v
        })
        .collect();

    Ok(Json(json!({ "tokens": tokens })))
}

/// The scopes the caller may put on a token, for the selector in the interface.
///
/// Restricted to what the caller holds **at this instant**: the list offered is
/// the same list `create` will accept, so the interface cannot present a choice
/// the server is going to refuse.
pub async fn available_scopes(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
) -> Result<Json<Value>, AppError> {
    // Resolved directly rather than through the request extensions: this route
    // lives outside `/admin/*`, so no layer has resolved anything yet.
    let ctx = authz_context::resolve(
        &state.db,
        user.id,
        crate::audit::ActorOrigin::Session,
        None,
    )
    .await?;

    let scopes = policy::grantable_for(&state.db, &ctx).await?;
    Ok(Json(json!({
        "scopes":       scopes,
        "max_ttl_days": policy::max_ttl_days(&state.db).await,
    })))
}

/// Sensitive: minting a long-lived credential from a session that may have been
/// left open is how a momentary compromise becomes a permanent one. Guarded by
/// [`Reauthenticated`], which also means an existing API token cannot mint
/// another one — a bearer with no second factor can never pass the challenge.
///
/// Four conditions beyond the challenge itself, in the order they are checked:
///
/// 1. the account is allowed to mint tokens at all (`api_tokens.create`);
/// 2. the scope list is non-empty, exists in the catalogue, is grantable, and is
///    **held by the creator right now** — no delegation of what one lacks;
/// 3. a `core.*` write scope forces an expiry, and every expiry is clamped to the
///    instance ceiling;
/// 4. the row is written with its scopes, which the database `CHECK` requires.
pub async fn create(
    State(state): State<AppState>,
    proof: Reauthenticated,
    parts: Parts,
    Json(dto): Json<CreateApiTokenDto>,
) -> Result<Json<Value>, AppError> {
    let user = proof.user().clone();

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
    )
    .await;
    if !allowed {
        return Err(AppError::Forbidden);
    }

    // What the creator holds, resolved fresh — this is the ceiling on what the
    // token can be given.
    let ctx = authz_context::resolve(
        &state.db,
        user.id,
        crate::audit::ActorOrigin::Session,
        None,
    )
    .await?;

    let audit = context_from(&parts, &user);

    let scopes = match policy::validate_requested(&state.db, &dto.scopes, &ctx).await {
        Ok(s) => s,
        Err(e) => {
            audit
                .record(
                    &state.db,
                    AuditEntry::new("core.api_tokens.create")
                        .module("core")
                        .target_kind(redact::target::API_TOKEN, dto.name.clone())
                        .denied(format!("scopes_refused: {e}")),
                )
                .await;
            return Err(e);
        }
    };

    let expires_at = match policy::resolve_expiry(&state.db, &scopes, dto.expires_in_days).await {
        Ok(v) => v,
        Err(e) => {
            audit
                .record(
                    &state.db,
                    AuditEntry::new("core.api_tokens.create")
                        .module("core")
                        .target_kind(redact::target::API_TOKEN, dto.name.clone())
                        .denied(format!("expiry_refused: {e}")),
                )
                .await;
            return Err(e);
        }
    };

    let (raw_token, hash) = generate_api_token();

    let token = sqlx::query_as::<_, ApiToken>(
        r#"INSERT INTO core.api_tokens (user_id, name, token_hash, scopes, expires_at)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id, user_id, name, token_hash, scopes, is_legacy, legacy_since,
                     expires_at, created_at, last_used_at, revoked_at"#,
    )
    .bind(user.id)
    .bind(&dto.name)
    .bind(&hash)
    .bind(&scopes)
    .bind(expires_at)
    .fetch_one(&state.db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, user_id = %user.id, "Création d'un jeton d'API");
        AppError::Database(e)
    })?;

    // The trail records what the key may do — never the key. `after` goes
    // through the whitelist, which has no `token_hash` entry by construction.
    audit
        .record(
            &state.db,
            AuditEntry::new("core.api_tokens.create")
                .module("core")
                .target(redact::target::API_TOKEN, token.id, token.name.clone())
                .after(crate::audit::snap(
                    redact::target::API_TOKEN,
                    &json!({
                        "id":         token.id,
                        "user_id":    token.user_id,
                        "name":       token.name,
                        "scopes":     token.scopes,
                        "expires_at": token.expires_at,
                        "is_legacy":  token.is_legacy,
                    }),
                )),
        )
        .await;

    // Le token brut n'est retourné qu'une seule fois — ne jamais le logger
    Ok(Json(json!({
        "token":       raw_token,
        "id":          token.id,
        "name":        token.name,
        "scopes":      token.scopes,
        "expires_at":  token.expires_at,
        "created_at":  token.created_at,
    })))
}

pub async fn revoke(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
    parts: Parts,
    Path(token_id): Path<Uuid>,
) -> Result<Json<Value>, AppError> {
    let revoked = sqlx::query_as::<_, ApiToken>(
        r#"UPDATE core.api_tokens
           SET revoked_at = NOW()
           WHERE id = $1 AND user_id = $2 AND revoked_at IS NULL
           RETURNING id, user_id, name, token_hash, scopes, is_legacy, legacy_since,
                     expires_at, created_at, last_used_at, revoked_at"#,
    )
    .bind(token_id)
    .bind(user.id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, token_id = %token_id, "Révocation d'un jeton d'API");
        AppError::Database(e)
    })?;

    let Some(token) = revoked else {
        return Err(AppError::NotFound("Token introuvable".into()));
    };

    context_from(&parts, &user)
        .record(
            &state.db,
            AuditEntry::new("core.api_tokens.revoke")
                .module("core")
                .target(redact::target::API_TOKEN, token.id, token.name.clone())
                .before(crate::audit::snap(
                    redact::target::API_TOKEN,
                    &json!({
                        "id":        token.id,
                        "name":      token.name,
                        "scopes":    token.scopes,
                        "is_legacy": token.is_legacy,
                    }),
                )),
        )
        .await;

    Ok(Json(json!({ "message": "Token révoqué" })))
}

/// Charge la liste des rôles autorisés depuis la setting `auth.api_token_allowed_roles`.
async fn load_allowed_roles(db: &sqlx::PgPool) -> Vec<String> {
    let row: Option<serde_json::Value> = sqlx::query_scalar(
        "SELECT value FROM core.settings WHERE key = 'auth.api_token_allowed_roles'",
    )
    .fetch_optional(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, "Lecture de auth.api_token_allowed_roles");
        e
    })
    .ok()
    .flatten();

    row.and_then(|v| serde_json::from_value::<Vec<String>>(v).ok())
        .unwrap_or_else(|| vec!["user".into(), "admin".into()])
}
