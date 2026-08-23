//! Routes INTERNES des montages distants (centralisées dans le core).
//! Protégées par `InternalRequest` (X-Internal-Secret). Le module drive proxifie
//! `/api/v1/drive/remotes/*` vers ces routes en passant le `user_id`.

use axum::{
    body::Body,
    extract::{Path, State},
    http::{header, StatusCode},
    response::{IntoResponse, Response},
    Json,
};
use futures::StreamExt;
use serde::Deserialize;
use serde_json::{json, Value};
use sqlx::Row;
use uuid::Uuid;

use crate::{
    auth::middleware::InternalRequest, errors::AppError, state::AppState,
    storage::remote::RemoteError,
};

/// Maps a connector failure onto the HTTP surface.
///
/// This used to collapse every variant into `Internal`, so an unreachable NAS,
/// a renamed directory and credentials that can no longer be decrypted all came
/// back as the same bare 500 "Erreur interne" — and the last of those is the
/// only one the user can actually do something about.
fn remote_err(e: RemoteError) -> AppError {
    match e {
        RemoteError::ConfigUnreadable => AppError::RemoteMountUnreadable,
        RemoteError::NotFound(m)      => AppError::NotFound(m),
        RemoteError::QuotaExceeded    => AppError::QuotaExceeded,
        RemoteError::Unsupported(m)   => AppError::Validation(m),
        // Everything left is the remote itself failing us: refused credentials,
        // network, provider or I/O. 502, with the detail kept in the message.
        other => AppError::RemoteUnavailable(other.to_string()),
    }
}

/// Failure to build a connector from a config the caller just submitted.
///
/// Always 422, never 502: nothing has been contacted at this point, so the fault
/// is in the form. Routing it through [`remote_err`] answered "stockage distant
/// injoignable" to a mistyped URL — on the very screen where a user reconnects
/// a broken mount, that sends them debugging their NAS instead of their typo.
fn config_err(e: RemoteError) -> AppError {
    // Unwrap the variant's own prefix: the connector reports a missing URL as
    // `Auth("URL manquante")`, which would surface as "Données invalides :
    // Authentification échouée : URL manquante" — three clauses, the middle one
    // false. Only the reason is worth showing.
    match e {
        RemoteError::Auth(m)
        | RemoteError::Provider(m)
        | RemoteError::Unsupported(m)
        | RemoteError::Forbidden(m) => AppError::Validation(m),
        other => AppError::Validation(other.to_string()),
    }
}

/// Loads a mount's connector, recording the fault on the row when its stored
/// config can no longer be decrypted.
///
/// `status` otherwise stays frozen at the last success, so a mount that has
/// become permanently unusable keeps advertising itself as "connected" in the
/// panel — the one place the owner looks to find out something is wrong.
async fn connector(
    state: &AppState, id: Uuid, user_id: Uuid,
) -> Result<std::sync::Arc<dyn crate::storage::remote::RemoteConnector>, AppError> {
    match state.remote_mounts.get_connector(id, user_id).await {
        Ok(c) => Ok(c),
        Err(RemoteError::ConfigUnreadable) => {
            let msg = AppError::RemoteMountUnreadable.to_string();
            // Best effort: the caller's failure is what matters, and a write
            // error here must not mask it.
            if let Err(e) = sqlx::query(
                "UPDATE core.remote_mounts SET status='error', last_error=$3 WHERE id=$1 AND owner_id=$2",
            )
            .bind(id).bind(user_id).bind(&msg)
            .execute(&state.db).await
            {
                tracing::error!(error = %e, mount = %id, "Marquage du montage illisible impossible");
            }
            Err(AppError::RemoteMountUnreadable)
        }
        Err(e) => Err(remote_err(e)),
    }
}

#[derive(Deserialize)]
pub struct CreateMountDto {
    pub name:     String,
    pub provider: String,
    pub config:   Value,
}

/// GET /internal/storage/mounts/:user_id — liste des montages d'un utilisateur.
pub async fn list(
    _i: InternalRequest,
    State(state): State<AppState>,
    Path(user_id): Path<Uuid>,
) -> Result<Json<Value>, AppError> {
    let rows = sqlx::query(
        r#"SELECT id, name, provider, mount_name, status, last_connected_at, last_error,
                  remote_quota_bytes, remote_used_bytes, created_at
           FROM core.remote_mounts WHERE owner_id = $1 ORDER BY created_at DESC"#,
    )
    .bind(user_id)
    .fetch_all(&state.db)
    .await?;

    let connections: Vec<Value> = rows.iter().map(|r| json!({
        "id":                 r.get::<Uuid, _>("id"),
        "name":               r.get::<String, _>("name"),
        "provider":           r.get::<String, _>("provider"),
        "mount_name":         r.get::<String, _>("mount_name"),
        "status":             r.get::<String, _>("status"),
        "last_connected_at":  r.get::<Option<chrono::DateTime<chrono::Utc>>, _>("last_connected_at"),
        "last_error":         r.get::<Option<String>, _>("last_error"),
        "remote_quota_bytes": r.get::<Option<i64>, _>("remote_quota_bytes"),
        "remote_used_bytes":  r.get::<Option<i64>, _>("remote_used_bytes"),
        "created_at":         r.get::<chrono::DateTime<chrono::Utc>, _>("created_at"),
    })).collect();

    Ok(Json(json!({ "connections": connections })))
}

/// POST /internal/storage/mounts/:user_id — crée un montage.
pub async fn create(
    _i: InternalRequest,
    State(state): State<AppState>,
    Path(user_id): Path<Uuid>,
    Json(dto): Json<CreateMountDto>,
) -> Result<(StatusCode, Json<Value>), AppError> {
    if dto.name.trim().is_empty() {
        return Err(AppError::Validation("Nom requis".into()));
    }
    let mount_name = dto.name.to_lowercase().chars()
        .map(|c| if c.is_alphanumeric() || c == '-' { c } else { '-' })
        .collect::<String>().trim_matches('-').to_string();

    // Valide la config en construisant le connecteur.
    state.remote_mounts.connector_from(&dto.provider, &dto.config).map_err(config_err)?;
    let config_enc = state.remote_mounts.encrypt_config(&dto.config).map_err(config_err)?;

    let id: Uuid = sqlx::query_scalar(
        r#"INSERT INTO core.remote_mounts (owner_id, name, provider, config_enc, mount_name)
           VALUES ($1, $2, $3, $4, $5) RETURNING id"#,
    )
    .bind(user_id).bind(&dto.name).bind(&dto.provider).bind(&config_enc).bind(&mount_name)
    .fetch_one(&state.db)
    .await?;

    Ok((StatusCode::CREATED, Json(json!({ "id": id, "mount_name": mount_name }))))
}

/// Config keys whose value never leaves the server. Everything else — host,
/// share, username, domain, paths — is what the owner typed and can be shown
/// back to them: hiding it would force a full re-entry to change one letter.
const SECRET_KEYS: &[&str] = &[
    "password", "access_token", "refresh_token", "client_secret", "private_key",
];

/// Carries the stored secrets over when the submitted config omits them.
///
/// The form cannot show a secret, so it cannot send one back untouched either:
/// a blank password field means "keep the current one", never "erase it".
fn merge_secrets(submitted: &Value, stored: Option<&Value>) -> Value {
    let mut out = submitted.clone();
    let (Some(obj), Some(prev)) = (out.as_object_mut(), stored.and_then(Value::as_object))
    else { return out };
    for key in SECRET_KEYS {
        if !obj.contains_key(*key) {
            if let Some(v) = prev.get(*key) { obj.insert((*key).to_string(), v.clone()); }
        }
    }
    out
}

/// GET /internal/storage/mounts/:user_id/:id/config — config REDACTED, for the
/// edit form.
///
/// Returns every non-secret field in clear and merely NAMES the secrets that are
/// set, so the form can prefill what the owner typed and mark the rest as
/// unchanged. A mount whose config cannot be decrypted answers
/// `MOUNT_CONFIG_UNREADABLE`: there is nothing to prefill, everything must be
/// re-entered.
pub async fn config(
    _i: InternalRequest,
    State(state): State<AppState>,
    Path((user_id, id)): Path<(Uuid, Uuid)>,
) -> Result<Json<Value>, AppError> {
    let row = sqlx::query_as::<_, (String, Vec<u8>)>(
        "SELECT provider, config_enc FROM core.remote_mounts WHERE id = $1 AND owner_id = $2",
    )
    .bind(id).bind(user_id)
    .fetch_optional(&state.db).await?
    .ok_or_else(|| AppError::NotFound(format!("Montage {id}")))?;

    let cfg = state.remote_mounts.decrypt_config(&row.1)
        .ok_or(AppError::RemoteMountUnreadable)?;

    let mut public  = serde_json::Map::new();
    let mut secrets = Vec::new();
    for (k, v) in cfg.as_object().into_iter().flatten() {
        if SECRET_KEYS.contains(&k.as_str()) {
            if !v.is_null() { secrets.push(k.clone()); }
        } else {
            public.insert(k.clone(), v.clone());
        }
    }
    Ok(Json(json!({ "provider": row.0, "config": public, "secrets_set": secrets })))
}

#[derive(Deserialize)]
pub struct SmbSharesDto {
    pub host:     String,
    pub username: Option<String>,
    pub password: Option<String>,
    pub domain:   Option<String>,
    /// Mount being edited, if any — lets the lookup reuse the password already
    /// on file instead of demanding it be retyped just to browse.
    pub mount_id: Option<Uuid>,
}

/// POST /internal/storage/smb-shares/:user_id — what shares a server offers.
pub async fn smb_shares(
    _i: InternalRequest,
    State(state): State<AppState>,
    Path(user_id): Path<Uuid>,
    Json(dto): Json<SmbSharesDto>,
) -> Result<Json<Value>, AppError> {
    let host = dto.host.trim();
    if host.is_empty() {
        return Err(AppError::Validation("Hôte requis".into()));
    }

    // The edit form never holds the password (write-only), so fall back to the
    // stored one rather than make the user retype it to list shares.
    let mut password = dto.password.clone().filter(|p| !p.is_empty());
    if password.is_none() {
        if let Some(mount_id) = dto.mount_id {
            let enc: Option<Vec<u8>> = sqlx::query_scalar(
                "SELECT config_enc FROM core.remote_mounts WHERE id = $1 AND owner_id = $2",
            )
            .bind(mount_id).bind(user_id)
            .fetch_optional(&state.db).await?;
            password = enc
                .and_then(|e| state.remote_mounts.decrypt_config(&e))
                .and_then(|c| c.get("password").and_then(Value::as_str).map(str::to_string));
        }
    }

    let shares = crate::storage::remote::smb::list_shares(
        host, dto.username.as_deref(), password.as_deref(), dto.domain.as_deref(),
    )
    .await
    .map_err(remote_err)?;

    Ok(Json(json!({
        "shares": shares.into_iter()
            .map(|s| json!({ "name": s.name, "comment": s.comment }))
            .collect::<Vec<_>>(),
    })))
}

#[derive(Deserialize)]
pub struct UpdateMountDto {
    pub name:   Option<String>,
    pub config: Option<Value>,
}

/// PATCH /internal/storage/mounts/:user_id/:id — met à jour un montage.
///
/// `config` replaces the stored one, except for the secret keys it omits, which
/// are carried over (see [`merge_secrets`]). Omit `config` entirely to rename.
///
/// `mount_name` is deliberately immutable: it is the path segment under
/// `/remotes/`, and renaming it would break every reference to the mount.
pub async fn update(
    _i: InternalRequest,
    State(state): State<AppState>,
    Path((user_id, id)): Path<(Uuid, Uuid)>,
    Json(dto): Json<UpdateMountDto>,
) -> Result<Json<Value>, AppError> {
    let row = sqlx::query_as::<_, (String, Vec<u8>)>(
        "SELECT provider, config_enc FROM core.remote_mounts WHERE id = $1 AND owner_id = $2",
    )
    .bind(id).bind(user_id)
    .fetch_optional(&state.db).await?
    .ok_or_else(|| AppError::NotFound(format!("Montage {id}")))?;
    let provider = row.0;

    let name = match dto.name.as_deref().map(str::trim) {
        Some("") => return Err(AppError::Validation("Nom requis".into())),
        other    => other,
    };

    // Validate before sealing: an unusable config would only reveal itself on
    // the next browse, long after the form said it had saved.
    let config_enc = match dto.config.as_ref() {
        Some(config) => {
            // `None` when the stored config is unreadable — then there is nothing
            // to carry over and every field must have been re-entered anyway.
            let stored = state.remote_mounts.decrypt_config(&row.1);
            let merged = merge_secrets(config, stored.as_ref());
            state.remote_mounts.connector_from(&provider, &merged).map_err(config_err)?;
            Some(state.remote_mounts.encrypt_config(&merged).map_err(config_err)?)
        }
        None => None,
    };

    // New credentials reset the verdict: the mount is untested again, and any
    // previous error no longer describes it.
    sqlx::query(
        r#"UPDATE core.remote_mounts
              SET name       = COALESCE($3::varchar, name),
                  config_enc = COALESCE($4::bytea, config_enc),
                  status     = CASE WHEN $4::bytea IS NULL THEN status     ELSE 'disconnected' END,
                  last_error = CASE WHEN $4::bytea IS NULL THEN last_error ELSE NULL END
            WHERE id = $1 AND owner_id = $2"#,
    )
    .bind(id).bind(user_id).bind(name).bind(config_enc.as_deref())
    .execute(&state.db).await?;

    // Drop the cached connector: it was built from the previous config.
    state.remote_mounts.invalidate(id).await;
    Ok(Json(json!({ "ok": true })))
}

/// DELETE /internal/storage/mounts/:user_id/:id — supprime un montage (+ cache).
pub async fn delete(
    _i: InternalRequest,
    State(state): State<AppState>,
    Path((user_id, id)): Path<(Uuid, Uuid)>,
) -> Result<StatusCode, AppError> {
    state.remote_mounts.invalidate(id).await;
    let res = sqlx::query("DELETE FROM core.remote_mounts WHERE id = $1 AND owner_id = $2")
        .bind(id).bind(user_id)
        .execute(&state.db)
        .await?;
    if res.rows_affected() == 0 {
        return Err(AppError::NotFound(format!("Montage {id}")));
    }
    Ok(StatusCode::NO_CONTENT)
}

/// POST /internal/storage/mounts/:user_id/:id/test — teste la connexion.
pub async fn test(
    _i: InternalRequest,
    State(state): State<AppState>,
    Path((user_id, id)): Path<(Uuid, Uuid)>,
) -> Result<Json<Value>, AppError> {
    state.remote_mounts.invalidate(id).await; // forcer un rechargement de config
    let conn = connector(&state, id, user_id).await?;
    match conn.connect().await {
        Ok(quota) => {
            sqlx::query(
                r#"UPDATE core.remote_mounts SET status='connected', last_connected_at=NOW(),
                          last_error=NULL, remote_quota_bytes=$2, remote_used_bytes=$3 WHERE id=$1"#,
            )
            .bind(id)
            .bind(quota.as_ref().and_then(|q| q.total_bytes).map(|b| b as i64))
            .bind(quota.as_ref().and_then(|q| q.used_bytes).map(|b| b as i64))
            .execute(&state.db).await?;
            Ok(Json(json!({
                "ok": true,
                "quota": quota.map(|q| json!({ "total_bytes": q.total_bytes, "used_bytes": q.used_bytes, "free_bytes": q.free_bytes })),
            })))
        }
        Err(e) => {
            sqlx::query("UPDATE core.remote_mounts SET status='error', last_error=$2 WHERE id=$1")
                .bind(id).bind(e.to_string())
                .execute(&state.db).await?;
            Ok(Json(json!({ "ok": false, "error": e.to_string() })))
        }
    }
}

async fn list_dir_json(state: &AppState, user_id: Uuid, id: Uuid, path: &str) -> Result<Json<Value>, AppError> {
    let conn = connector(state, id, user_id).await?;
    let entries = conn.list_dir(path).await.map_err(remote_err)?;
    let items: Vec<Value> = entries.into_iter().map(|e| json!({
        "name":        e.name,
        "path":        e.path,
        "is_dir":      e.is_dir(),
        "size_bytes":  e.size_bytes,
        "modified_at": e.modified_at,
        "mime_type":   e.mime_type,
        "remote_id":   e.remote_id,
    })).collect();
    Ok(Json(json!({ "items": items })))
}

/// GET /internal/storage/mounts/:user_id/:id/browse — racine du montage.
pub async fn browse_root(
    _i: InternalRequest,
    State(state): State<AppState>,
    Path((user_id, id)): Path<(Uuid, Uuid)>,
) -> Result<Json<Value>, AppError> {
    list_dir_json(&state, user_id, id, "").await
}

/// GET /internal/storage/mounts/:user_id/:id/browse/*path
pub async fn browse(
    _i: InternalRequest,
    State(state): State<AppState>,
    Path((user_id, id, path)): Path<(Uuid, Uuid, String)>,
) -> Result<Json<Value>, AppError> {
    list_dir_json(&state, user_id, id, path.trim_start_matches('/')).await
}

#[derive(Deserialize)]
pub struct RenameDto { pub to: String }

/// DELETE /internal/storage/mounts/:user_id/:id/entry/*path — supprime fichier/dossier.
pub async fn delete_entry(
    _i: InternalRequest,
    State(state): State<AppState>,
    Path((user_id, id, path)): Path<(Uuid, Uuid, String)>,
) -> Result<StatusCode, AppError> {
    let conn = connector(&state, id, user_id).await?;
    let p = path.trim_start_matches('/');
    // Suppression UNIFORME pour tous les backends : un dossier est supprimé
    // récursivement (`delete_recursive` vide le contenu puis retire le dossier),
    // un fichier directement. Évite les échecs silencieux sur les protocoles dont
    // `delete` ne gère que les fichiers (FTP/SMB) ou dépend du serveur (WebDAV).
    let is_dir = matches!(conn.stat(p).await, Ok(e) if e.is_dir());
    if is_dir { conn.delete_recursive(p).await.map_err(remote_err)?; }
    else      { conn.delete(p).await.map_err(remote_err)?; }
    Ok(StatusCode::NO_CONTENT)
}

/// POST /internal/storage/mounts/:user_id/:id/rename/*path { to } — renomme/déplace.
pub async fn rename_entry(
    _i: InternalRequest,
    State(state): State<AppState>,
    Path((user_id, id, path)): Path<(Uuid, Uuid, String)>,
    Json(dto): Json<RenameDto>,
) -> Result<Json<Value>, AppError> {
    let conn = connector(&state, id, user_id).await?;
    conn.rename(path.trim_start_matches('/'), dto.to.trim_start_matches('/')).await.map_err(remote_err)?;
    Ok(Json(json!({ "ok": true })))
}

/// POST /internal/storage/mounts/:user_id/:id/mkdir/*path — crée un dossier.
pub async fn create_dir(
    _i: InternalRequest,
    State(state): State<AppState>,
    Path((user_id, id, path)): Path<(Uuid, Uuid, String)>,
) -> Result<Json<Value>, AppError> {
    let conn = connector(&state, id, user_id).await?;
    conn.create_dir(path.trim_start_matches('/')).await.map_err(remote_err)?;
    Ok(Json(json!({ "ok": true })))
}

/// POST /internal/storage/mounts/:user_id/:id/upload/*path — écrit un fichier.
pub async fn upload(
    _i: InternalRequest,
    State(state): State<AppState>,
    Path((user_id, id, path)): Path<(Uuid, Uuid, String)>,
    body: Body,
) -> Result<Json<Value>, AppError> {
    let conn = connector(&state, id, user_id).await?;
    let p = path.trim_start_matches('/').to_string();
    let stream = body.into_data_stream()
        .map(|r| r.map_err(|e| std::io::Error::other(e.to_string())));
    let entry = conn.put_file(&p, Box::pin(stream), None).await.map_err(remote_err)?;
    Ok(Json(json!({ "ok": true, "name": entry.name, "path": entry.path })))
}

/// GET /internal/storage/mounts/:user_id/:id/file/*path — flux du fichier.
pub async fn get_file(
    _i: InternalRequest,
    State(state): State<AppState>,
    Path((user_id, id, path)): Path<(Uuid, Uuid, String)>,
) -> Result<Response, AppError> {
    let conn = connector(&state, id, user_id).await?;
    let p = path.trim_start_matches('/').to_string();
    let stream = conn.get_file(&p).await.map_err(remote_err)?;
    let fname = p.rsplit('/').next().unwrap_or("fichier").to_string();
    let body = Body::from_stream(stream.map(|r| {
        r.map_err(|e| std::io::Error::other(e.to_string()))
    }));
    Ok((
        [(header::CONTENT_DISPOSITION, format!("attachment; filename=\"{fname}\""))],
        body,
    ).into_response())
}
