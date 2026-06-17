use crate::{
    auth::{middleware::AuthUser, totp as totp_auth},
    errors::AppError,
    models::{session::RefreshToken, user::UpdateUserDto},
    state::AppState,
};
use axum::{
    body::Body,
    extract::{Multipart, Path, Query, State},
    http::header,
    response::Response,
    Json,
};
use bytes::Bytes;
use serde::Deserialize;
use serde_json::json;
use validator::Validate;

#[derive(Deserialize)]
pub struct TotpCodeDto {
    pub code: String,
}

#[utoipa::path(
    get,
    path = "/api/v1/me",
    tag = "me",
    security(("bearer" = [])),
    responses(
        (status = 200, description = "Profil de l'utilisateur courant", body = crate::models::user::User),
        (status = 401, description = "Non authentifié")
    )
)]
pub async fn get_me(
    State(_state): State<AppState>,
    AuthUser(user): AuthUser,
) -> Result<Json<serde_json::Value>, AppError> {
    Ok(Json(json!({ "user": user })))
}

/// Flux d'activité personnel : derniers événements de l'utilisateur connecté,
/// tous modules confondus (filtre sur payload.user_id).
pub async fn me_activity(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
    Query(q): Query<std::collections::HashMap<String, String>>,
) -> Result<Json<serde_json::Value>, AppError> {
    let limit: i64 = q.get("limit").and_then(|v| v.parse().ok()).unwrap_or(15).clamp(1, 50);

    let rows = sqlx::query(
        r#"SELECT id, event_type, source_module, payload, created_at
           FROM core.event_log
           WHERE payload->>'user_id' = $1
           ORDER BY created_at DESC
           LIMIT $2"#,
    )
    .bind(user.id.to_string())
    .bind(limit)
    .fetch_all(&state.db)
    .await
    .map_err(|e| {
        tracing::error!("me_activity query failed: {e}");
        e
    })?;

    let events: Vec<_> = rows
        .into_iter()
        .map(|r| {
            use sqlx::Row;
            json!({
                "id": r.get::<i64, _>("id"),
                "event_type": r.get::<String, _>("event_type"),
                "source_module": r.get::<Option<String>, _>("source_module"),
                "payload": r.get::<serde_json::Value, _>("payload"),
                "created_at": r.get::<chrono::DateTime<chrono::Utc>, _>("created_at"),
            })
        })
        .collect();

    Ok(Json(json!({ "events": events })))
}

pub async fn update_me(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
    Json(dto): Json<UpdateUserDto>,
) -> Result<Json<serde_json::Value>, AppError> {
    dto.validate()
        .map_err(|e| AppError::Validation(e.to_string()))?;

    let updated = sqlx::query_as::<_, crate::models::user::User>(
        r#"UPDATE core.users
           SET display_name = COALESCE($1, display_name),
               avatar_url   = COALESCE($2, avatar_url),
               preferences  = CASE WHEN $3::jsonb IS NOT NULL THEN preferences || $3 ELSE preferences END
           WHERE id = $4
           RETURNING *"#,
    )
    .bind(dto.display_name.as_deref())
    .bind(dto.avatar_url.as_deref())
    .bind(dto.preferences)
    .bind(user.id)
    .fetch_one(&state.db)
    .await?;

    state.events.publish(crate::events::AppEvent::UserUpdated {
        user_id: user.id,
        fields: vec!["display_name".into(), "avatar_url".into(), "preferences".into()],
    });

    Ok(Json(json!({ "user": updated })))
}

pub async fn change_password(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
    Json(dto): Json<crate::models::user::ChangePasswordDto>,
) -> Result<Json<serde_json::Value>, AppError> {
    let hash = user
        .password_hash
        .as_deref()
        .ok_or_else(|| AppError::Validation("Compte OAuth uniquement".into()))?;

    let ok = crate::crypto::password::verify_password(&dto.old_password, hash)
        .map_err(|e| AppError::Internal(e))?;

    if !ok {
        return Err(AppError::Validation("Ancien mot de passe incorrect".into()));
    }

    let new_hash = crate::crypto::password::hash_password(&dto.new_password)
        .map_err(|e| AppError::Internal(e))?;

    let mut tx = state.db.begin().await?;

    sqlx::query("UPDATE core.users SET password_hash = $1 WHERE id = $2")
        .bind(&new_hash)
        .bind(user.id)
        .execute(&mut *tx)
        .await?;

    sqlx::query(
        "UPDATE core.refresh_tokens SET revoked_at = NOW(), revoke_reason = 'password_change'
         WHERE user_id = $1 AND revoked_at IS NULL",
    )
    .bind(user.id)
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;

    Ok(Json(json!({ "message": "Mot de passe mis à jour" })))
}

#[utoipa::path(
    get,
    path = "/api/v1/me/sessions",
    tag = "me",
    security(("bearer" = [])),
    responses(
        (status = 200, description = "Sessions actives (refresh tokens) de l'utilisateur, avec client_type", body = [crate::models::session::RefreshToken]),
        (status = 401, description = "Non authentifié")
    )
)]
pub async fn list_sessions(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
) -> Result<Json<serde_json::Value>, AppError> {
    let sessions = sqlx::query_as::<_, RefreshToken>(
        r#"SELECT id, user_id, token_hash, device_name, device_type,
                  host(ip_address)::text as ip_address, user_agent,
                  expires_at, created_at, last_used_at, revoked_at, revoke_reason,
                  family_id, client_type
           FROM core.refresh_tokens
           WHERE user_id = $1 AND revoked_at IS NULL AND expires_at > NOW()
           ORDER BY last_used_at DESC"#,
    )
    .bind(user.id)
    .fetch_all(&state.db)
    .await?;

    Ok(Json(json!({ "sessions": sessions })))
}

pub async fn revoke_session(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
    Path(session_id): Path<uuid::Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let affected = sqlx::query(
        "UPDATE core.refresh_tokens
         SET revoked_at = NOW(), revoke_reason = 'logout'
         WHERE id = $1 AND user_id = $2 AND revoked_at IS NULL",
    )
    .bind(session_id)
    .bind(user.id)
    .execute(&state.db)
    .await?
    .rows_affected();

    if affected == 0 {
        return Err(AppError::NotFound("Session introuvable".into()));
    }

    Ok(Json(json!({ "message": "Session révoquée" })))
}

pub async fn revoke_all_sessions(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query(
        "UPDATE core.refresh_tokens
         SET revoked_at = NOW(), revoke_reason = 'logout'
         WHERE user_id = $1 AND revoked_at IS NULL",
    )
    .bind(user.id)
    .execute(&state.db)
    .await?;

    Ok(Json(json!({ "message": "Toutes les sessions révoquées" })))
}

#[derive(Deserialize)]
pub struct SearchUsersQuery {
    pub q:     Option<String>,
    pub limit: Option<i64>,
}

/// Search active users — returns only public profile fields (no email).
pub async fn search_users(
    State(state): State<AppState>,
    AuthUser(_caller): AuthUser,
    Query(q): Query<SearchUsersQuery>,
) -> Result<Json<serde_json::Value>, AppError> {
    let limit = q.limit.unwrap_or(20).min(50);
    let query = q.q.as_deref().unwrap_or("");

    let users = sqlx::query_as::<_, (uuid::Uuid, String, Option<String>, Option<String>)>(
        r#"SELECT id, username, display_name, avatar_url
           FROM core.users
           WHERE is_active = TRUE
             AND ($1 = '' OR username ILIKE '%' || $1 || '%'
                          OR display_name ILIKE '%' || $1 || '%')
           ORDER BY display_name ASC NULLS LAST
           LIMIT $2"#,
    )
    .bind(query)
    .bind(limit)
    .fetch_all(&state.db)
    .await?;

    let result: Vec<serde_json::Value> = users
        .into_iter()
        .map(|(id, username, display_name, avatar_url)| json!({
            "id":           id,
            "username":     username,
            "display_name": display_name.unwrap_or_else(|| username.clone()),
            "avatar_url":   avatar_url,
        }))
        .collect();

    Ok(Json(json!({ "users": result })))
}

#[derive(serde::Deserialize)]
pub struct LookupUsersQuery {
    /// Liste d'UUID séparés par des virgules.
    pub ids: Option<String>,
}

/// Résout des utilisateurs par leurs IDs — champs publics uniquement (pas d'email).
pub async fn lookup_users(
    State(state): State<AppState>,
    AuthUser(_caller): AuthUser,
    Query(q): Query<LookupUsersQuery>,
) -> Result<Json<serde_json::Value>, AppError> {
    let ids: Vec<uuid::Uuid> = q
        .ids
        .unwrap_or_default()
        .split(',')
        .filter_map(|s| uuid::Uuid::parse_str(s.trim()).ok())
        .take(200)
        .collect();

    if ids.is_empty() {
        return Ok(Json(json!({ "users": [] })));
    }

    let users = sqlx::query_as::<_, (uuid::Uuid, String, Option<String>, Option<String>)>(
        r#"SELECT id, username, display_name, avatar_url
           FROM core.users
           WHERE id = ANY($1)"#,
    )
    .bind(&ids)
    .fetch_all(&state.db)
    .await?;

    let result: Vec<serde_json::Value> = users
        .into_iter()
        .map(|(id, username, display_name, avatar_url)| json!({
            "id":           id,
            "username":     username,
            "display_name": display_name.unwrap_or_else(|| username.clone()),
            "avatar_url":   avatar_url,
        }))
        .collect();

    Ok(Json(json!({ "users": result })))
}

// ── 2FA / TOTP ────────────────────────────────────────────────────────────────

/// Démarre la configuration 2FA : génère un secret TOTP, stocke-le chiffré
/// en « pending », et retourne l'URI otpauth:// + le secret en clair (base32).
pub async fn setup_totp(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
) -> Result<Json<serde_json::Value>, AppError> {
    if user.totp_enabled {
        return Err(AppError::Conflict("La 2FA est déjà activée".into()));
    }

    let (secret_base32, uri, encrypted) = totp_auth::generate_secret(
        &state.settings.auth.jwt_secret, &user.email,
    )
    .map_err(AppError::Internal)?;

    sqlx::query("UPDATE core.users SET totp_pending_secret = $1 WHERE id = $2")
        .bind(&encrypted)
        .bind(user.id)
        .execute(&state.db)
        .await?;

    Ok(Json(json!({ "uri": uri, "secret": secret_base32 })))
}

/// Vérifie le code TOTP entré par l'utilisateur et active définitivement la 2FA.
pub async fn enable_totp(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
    Json(dto): Json<TotpCodeDto>,
) -> Result<Json<serde_json::Value>, AppError> {
    let encrypted = user
        .totp_pending_secret
        .as_deref()
        .ok_or_else(|| AppError::Validation("Démarrez d'abord la configuration 2FA".into()))?;

    let valid = totp_auth::verify_code(
        &state.settings.auth.jwt_secret, encrypted, &dto.code, &user.email,
    )
    .map_err(AppError::Internal)?;

    if !valid {
        return Err(AppError::Validation("Code incorrect".into()));
    }

    sqlx::query(
        "UPDATE core.users
         SET totp_secret = totp_pending_secret,
             totp_pending_secret = NULL,
             totp_enabled = TRUE
         WHERE id = $1",
    )
    .bind(user.id)
    .execute(&state.db)
    .await?;

    Ok(Json(json!({ "enabled": true })))
}

/// Désactive la 2FA après vérification d'un code TOTP valide.
pub async fn disable_totp(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
    Json(dto): Json<TotpCodeDto>,
) -> Result<Json<serde_json::Value>, AppError> {
    if !user.totp_enabled {
        return Err(AppError::Validation("La 2FA n'est pas activée".into()));
    }

    let encrypted = user
        .totp_secret
        .as_deref()
        .ok_or_else(|| AppError::Internal(anyhow::anyhow!("Secret TOTP absent malgré totp_enabled=true")))?;

    let valid = totp_auth::verify_code(
        &state.settings.auth.jwt_secret, encrypted, &dto.code, &user.email,
    )
    .map_err(AppError::Internal)?;

    if !valid {
        return Err(AppError::Validation("Code incorrect".into()));
    }

    sqlx::query(
        "UPDATE core.users
         SET totp_secret = NULL,
             totp_pending_secret = NULL,
             totp_enabled = FALSE
         WHERE id = $1",
    )
    .bind(user.id)
    .execute(&state.db)
    .await?;

    Ok(Json(json!({ "enabled": false })))
}

/// POST /api/v1/me/avatar — upload d'avatar (multipart, champ "avatar")
pub async fn upload_avatar(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
    mut multipart: Multipart,
) -> Result<Json<serde_json::Value>, AppError> {
    let ext_for = |ct: &str| match ct {
        "image/png"  => "png",
        "image/webp" => "webp",
        "image/gif"  => "gif",
        _            => "jpg",
    };

    let mut data:     Option<(Bytes, String)> = None;  // avatar recadré
    let mut original: Option<(Bytes, String)> = None;  // image originale (pour re-recadrage)

    while let Some(field) = multipart
        .next_field()
        .await
        .map_err(|e| AppError::Validation(format!("Champ invalide : {e}")))?
    {
        let name = field.name().map(|s| s.to_owned());
        let content_type = field.content_type().unwrap_or("image/jpeg").to_owned();
        match name.as_deref() {
            Some("avatar") | Some("original") => {
                if !content_type.starts_with("image/") {
                    return Err(AppError::Validation("Le fichier doit être une image".into()));
                }
                let bytes = field.bytes().await
                    .map_err(|e| AppError::Validation(format!("Lecture fichier : {e}")))?;
                if bytes.len() > 10 * 1024 * 1024 {
                    return Err(AppError::Validation("L'image ne doit pas dépasser 10 Mo".into()));
                }
                if name.as_deref() == Some("avatar") { data = Some((bytes, content_type)); }
                else { original = Some((bytes, content_type)); }
            }
            _ => {}
        }
    }

    let (bytes, content_type) = data.ok_or_else(|| AppError::Validation("Champ 'avatar' manquant".into()))?;
    let ext = ext_for(&content_type);
    let path = format!("avatars/{}.{}", user.id, ext);

    state
        .storage
        .put(&path, bytes)
        .await
        .map_err(|e| AppError::Internal(anyhow::anyhow!("Stockage avatar : {e}")))?;

    // Conserver l'image originale (full) pour permettre un re-recadrage ultérieur
    if let Some((obytes, oct)) = original {
        let opath = format!("avatars/{}-original.{}", user.id, ext_for(&oct));
        let _ = state.storage.put(&opath, obytes).await;
    }

    let avatar_url = format!("/api/v1/users/{}/avatar", user.id);

    let updated = sqlx::query_as::<_, crate::models::user::User>(
        "UPDATE core.users SET avatar_url = $1 WHERE id = $2 RETURNING *",
    )
    .bind(&avatar_url)
    .bind(user.id)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(json!({ "user": updated })))
}

/// GET /api/v1/users/:id/avatar — serve l'avatar stocké
pub async fn get_avatar(
    State(state): State<AppState>,
    Path(user_id): Path<uuid::Uuid>,
) -> Result<Response, AppError> {
    // Try each supported format
    let formats = [("jpg", "image/jpeg"), ("png", "image/png"), ("webp", "image/webp"), ("gif", "image/gif")];
    for (ext, mime) in formats {
        let path = format!("avatars/{}.{}", user_id, ext);
        if let Ok(bytes) = state.storage.get(&path).await {
            return Ok(Response::builder()
                .header(header::CONTENT_TYPE, mime)
                .header(header::CACHE_CONTROL, "public, max-age=3600")
                .body(Body::from(bytes))
                .unwrap());
        }
    }
    Err(AppError::NotFound("Avatar introuvable".into()))
}

/// GET /api/v1/users/:id/avatar/original — serve l'image originale (pour re-recadrage)
pub async fn get_avatar_original(
    State(state): State<AppState>,
    Path(user_id): Path<uuid::Uuid>,
) -> Result<Response, AppError> {
    let formats = [("jpg", "image/jpeg"), ("png", "image/png"), ("webp", "image/webp"), ("gif", "image/gif")];
    for (ext, mime) in formats {
        let path = format!("avatars/{}-original.{}", user_id, ext);
        if let Ok(bytes) = state.storage.get(&path).await {
            return Ok(Response::builder()
                .header(header::CONTENT_TYPE, mime)
                .header(header::CACHE_CONTROL, "private, max-age=60")
                .body(Body::from(bytes))
                .unwrap());
        }
    }
    Err(AppError::NotFound("Image originale introuvable".into()))
}

/// POST /api/v1/linked-account/login
/// Proxifie un login vers une instance Kubuno distante (contourne CORS).
pub async fn linked_account_login(
    Json(body): Json<serde_json::Value>,
) -> Result<Json<serde_json::Value>, AppError> {
    let instance_url = body
        .get("instance_url")
        .and_then(|v| v.as_str())
        .ok_or_else(|| AppError::Validation("instance_url requis".into()))?
        .trim_end_matches('/')
        .to_owned();

    // Basic URL sanity check — must start with http:// or https://
    if !instance_url.starts_with("http://") && !instance_url.starts_with("https://") {
        return Err(AppError::Validation("URL invalide".into()));
    }

    let login_url = format!("{instance_url}/api/v1/auth/login");

    let payload = serde_json::json!({
        "login":   body.get("email").and_then(|v| v.as_str()).unwrap_or(""),
        "password": body.get("password").and_then(|v| v.as_str()).unwrap_or(""),
    });

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(15))
        .build()
        .map_err(|e| AppError::Internal(anyhow::anyhow!("HTTP client : {e}")))?;

    let resp = client
        .post(&login_url)
        .json(&payload)
        .send()
        .await
        .map_err(|e| AppError::Validation(format!("Impossible de joindre l'instance : {e}")))?;

    let status = resp.status();
    let json: serde_json::Value = resp
        .json()
        .await
        .map_err(|e| AppError::Internal(anyhow::anyhow!("Réponse invalide : {e}")))?;

    if status == reqwest::StatusCode::UNAUTHORIZED || status == reqwest::StatusCode::UNPROCESSABLE_ENTITY {
        return Err(AppError::Validation("Identifiants incorrects".into()));
    }
    if !status.is_success() {
        return Err(AppError::Validation(format!("Erreur {status} de l'instance distante")));
    }

    Ok(Json(json))
}
