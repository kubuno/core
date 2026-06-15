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

use crate::{auth::middleware::InternalRequest, errors::AppError, state::AppState};

fn remote_err(e: impl std::fmt::Display) -> AppError {
    AppError::Internal(anyhow::anyhow!(e.to_string()))
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
    state.remote_mounts.connector_from(&dto.provider, &dto.config).map_err(remote_err)?;
    let config_enc = state.remote_mounts.encrypt_config(&dto.config);

    let id: Uuid = sqlx::query_scalar(
        r#"INSERT INTO core.remote_mounts (owner_id, name, provider, config_enc, mount_name)
           VALUES ($1, $2, $3, $4, $5) RETURNING id"#,
    )
    .bind(user_id).bind(&dto.name).bind(&dto.provider).bind(&config_enc).bind(&mount_name)
    .fetch_one(&state.db)
    .await?;

    Ok((StatusCode::CREATED, Json(json!({ "id": id, "mount_name": mount_name }))))
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
    let conn = state.remote_mounts.get_connector(id, user_id).await.map_err(remote_err)?;
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
    let conn = state.remote_mounts.get_connector(id, user_id).await.map_err(remote_err)?;
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
    let conn = state.remote_mounts.get_connector(id, user_id).await.map_err(remote_err)?;
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
    let conn = state.remote_mounts.get_connector(id, user_id).await.map_err(remote_err)?;
    conn.rename(path.trim_start_matches('/'), dto.to.trim_start_matches('/')).await.map_err(remote_err)?;
    Ok(Json(json!({ "ok": true })))
}

/// POST /internal/storage/mounts/:user_id/:id/mkdir/*path — crée un dossier.
pub async fn create_dir(
    _i: InternalRequest,
    State(state): State<AppState>,
    Path((user_id, id, path)): Path<(Uuid, Uuid, String)>,
) -> Result<Json<Value>, AppError> {
    let conn = state.remote_mounts.get_connector(id, user_id).await.map_err(remote_err)?;
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
    let conn = state.remote_mounts.get_connector(id, user_id).await.map_err(remote_err)?;
    let p = path.trim_start_matches('/').to_string();
    let stream = body.into_data_stream()
        .map(|r| r.map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e.to_string())));
    let entry = conn.put_file(&p, Box::pin(stream), None).await.map_err(remote_err)?;
    Ok(Json(json!({ "ok": true, "name": entry.name, "path": entry.path })))
}

/// GET /internal/storage/mounts/:user_id/:id/file/*path — flux du fichier.
pub async fn get_file(
    _i: InternalRequest,
    State(state): State<AppState>,
    Path((user_id, id, path)): Path<(Uuid, Uuid, String)>,
) -> Result<Response, AppError> {
    let conn = state.remote_mounts.get_connector(id, user_id).await.map_err(remote_err)?;
    let p = path.trim_start_matches('/').to_string();
    let stream = conn.get_file(&p).await.map_err(remote_err)?;
    let fname = p.rsplit('/').next().unwrap_or("fichier").to_string();
    let body = Body::from_stream(stream.map(|r| {
        r.map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e.to_string()))
    }));
    Ok((
        [(header::CONTENT_DISPOSITION, format!("attachment; filename=\"{fname}\""))],
        body,
    ).into_response())
}
