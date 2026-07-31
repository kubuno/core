//! Roaming CLIPBOARD HISTORY — the last things a user copied, whatever the
//! module, kept server-side.
//!
//! The browser clipboard holds one item, is not shared between tabs and is lost
//! on reload; the modules' own slots (the spreadsheet's object clipboard, an
//! editor's cell buffer) are process-local too. This service keeps the recent
//! clips as the same cross-module JSON envelopes `core.data-card` renders, so
//! any module — on any tab, on any device — can paste them back.
//!
//! Rules enforced here, never trusted to the client:
//!   • strictly per user (no sharing, no lookup by id across users);
//!   • payload capped (`MAX_PAYLOAD_BYTES`) so the content blob cannot be used
//!     as free storage;
//!   • deduplicated by SHA-256 fingerprint: re-copying the same thing bumps the
//!     existing row to the top instead of adding a twin;
//!   • trimmed to `MAX_ITEMS` unpinned entries per user after each push.
//!
//! Payloads are NEVER logged: an error mentions the item id, never its content.

use axum::{
    extract::{Path, Query, State},
    Json,
};
use serde::Deserialize;
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use uuid::Uuid;
use validator::Validate;

use crate::{
    auth::middleware::AuthUser,
    errors::AppError,
    models::clipboard::{ClipboardItem, PushClipboardDto, UpdateClipboardDto},
    state::AppState,
};

/// Biggest payload accepted, in bytes of serialized JSON. Comfortably above a
/// spreadsheet shape or a maps route, far below an embedded picture.
const MAX_PAYLOAD_BYTES: usize = 256 * 1024;
/// How many UNPINNED entries a user keeps. Pinned ones are never trimmed.
const MAX_ITEMS: i64 = 30;
/// Longest stored summary; longer previews are truncated, not rejected.
const MAX_PREVIEW_CHARS: usize = 2000;

#[derive(Debug, Deserialize)]
pub struct ListQuery {
    pub limit: Option<i64>,
}

/// Hex SHA-256 of the canonical payload — the dedup key.
fn fingerprint(payload: &Value) -> String {
    let mut hasher = Sha256::new();
    hasher.update(payload.to_string().as_bytes());
    format!("{:x}", hasher.finalize())
}

/// Cut a preview to `MAX_PREVIEW_CHARS` on a char boundary.
fn truncate_preview(preview: Option<String>) -> Option<String> {
    preview.map(|p| {
        if p.chars().count() <= MAX_PREVIEW_CHARS {
            p
        } else {
            p.chars().take(MAX_PREVIEW_CHARS).collect()
        }
    })
}

/// GET /api/v1/clipboard?limit=
///
/// The user's own history, pinned entries first, then most recent.
pub async fn list(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
    Query(q): Query<ListQuery>,
) -> Result<Json<Value>, AppError> {
    let limit = q.limit.unwrap_or(MAX_ITEMS).clamp(1, 100);
    let items = sqlx::query_as::<_, ClipboardItem>(
        r#"SELECT id, module, kind, title, preview, payload, href, pinned, created_at, updated_at
             FROM core.clipboard_items
            WHERE owner_id = $1
            ORDER BY pinned DESC, created_at DESC
            LIMIT $2"#,
    )
    .bind(user.id)
    .bind(limit)
    .fetch_all(&state.db)
    .await
    .map_err(|e| {
        tracing::error!("clipboard: lecture de l'historique échouée: {e}");
        e
    })?;

    Ok(Json(json!({ "items": items })))
}

/// POST /api/v1/clipboard
///
/// Push a clip. Re-copying the same content bumps the existing row (its
/// `created_at` moves to now) rather than creating a duplicate.
pub async fn push(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
    Json(dto): Json<PushClipboardDto>,
) -> Result<Json<Value>, AppError> {
    dto.validate().map_err(|e| AppError::Validation(e.to_string()))?;

    let payload_size = dto.payload.to_string().len();
    if payload_size > MAX_PAYLOAD_BYTES {
        return Err(AppError::Validation(format!(
            "Contenu trop volumineux pour l'historique du presse-papiers ({} Ko, maximum {} Ko)",
            payload_size / 1024,
            MAX_PAYLOAD_BYTES / 1024
        )));
    }
    if dto.payload.is_null() {
        return Err(AppError::Validation("Contenu vide".into()));
    }

    let fp = fingerprint(&dto.payload);
    let preview = truncate_preview(dto.preview);

    let mut tx = state.db.begin().await?;

    let item = sqlx::query_as::<_, ClipboardItem>(
        r#"INSERT INTO core.clipboard_items
                  (owner_id, module, kind, title, preview, payload, href, pinned, fingerprint)
           VALUES ($1, $2, $3, $4, $5, $6, $7, COALESCE($8, FALSE), $9)
           ON CONFLICT (owner_id, fingerprint) DO UPDATE
              SET created_at = NOW(),
                  title      = EXCLUDED.title,
                  preview    = EXCLUDED.preview,
                  href       = EXCLUDED.href,
                  module     = EXCLUDED.module,
                  kind       = EXCLUDED.kind
        RETURNING id, module, kind, title, preview, payload, href, pinned, created_at, updated_at"#,
    )
    .bind(user.id)
    .bind(&dto.module)
    .bind(&dto.kind)
    .bind(&dto.title)
    .bind(&preview)
    .bind(&dto.payload)
    .bind(&dto.href)
    .bind(dto.pinned)
    .bind(&fp)
    .fetch_one(&mut *tx)
    .await
    .map_err(|e| {
        tracing::error!("clipboard: enregistrement d'un élément échoué: {e}");
        e
    })?;

    // Trim: keep the newest MAX_ITEMS unpinned entries of this user.
    sqlx::query(
        r#"DELETE FROM core.clipboard_items
            WHERE owner_id = $1 AND pinned = FALSE
              AND id NOT IN (
                    SELECT id FROM core.clipboard_items
                     WHERE owner_id = $1 AND pinned = FALSE
                     ORDER BY created_at DESC
                     LIMIT $2)"#,
    )
    .bind(user.id)
    .bind(MAX_ITEMS)
    .execute(&mut *tx)
    .await
    .map_err(|e| {
        tracing::error!("clipboard: purge de l'historique échouée: {e}");
        e
    })?;

    tx.commit().await?;
    Ok(Json(json!({ "item": item })))
}

/// PATCH /api/v1/clipboard/:id — pin / unpin.
pub async fn update(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
    Path(id): Path<Uuid>,
    Json(dto): Json<UpdateClipboardDto>,
) -> Result<Json<Value>, AppError> {
    dto.validate().map_err(|e| AppError::Validation(e.to_string()))?;
    let Some(pinned) = dto.pinned else {
        return Err(AppError::Validation("Rien à modifier".into()));
    };

    let item = sqlx::query_as::<_, ClipboardItem>(
        r#"UPDATE core.clipboard_items SET pinned = $3
            WHERE id = $1 AND owner_id = $2
        RETURNING id, module, kind, title, preview, payload, href, pinned, created_at, updated_at"#,
    )
    .bind(id)
    .bind(user.id)
    .bind(pinned)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| {
        tracing::error!("clipboard: épinglage de {id} échoué: {e}");
        e
    })?
    // Someone else's item and a missing one are the same 404: no existence leak.
    .ok_or_else(|| AppError::NotFound("Élément introuvable".into()))?;

    Ok(Json(json!({ "item": item })))
}

/// DELETE /api/v1/clipboard/:id
pub async fn delete(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<Value>, AppError> {
    let done = sqlx::query("DELETE FROM core.clipboard_items WHERE id = $1 AND owner_id = $2")
        .bind(id)
        .bind(user.id)
        .execute(&state.db)
        .await
        .map_err(|e| {
            tracing::error!("clipboard: suppression de {id} échouée: {e}");
            e
        })?;
    if done.rows_affected() == 0 {
        return Err(AppError::NotFound("Élément introuvable".into()));
    }
    Ok(Json(json!({ "ok": true })))
}

/// DELETE /api/v1/clipboard — clear the history, keeping pinned entries.
pub async fn clear(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
) -> Result<Json<Value>, AppError> {
    let done = sqlx::query("DELETE FROM core.clipboard_items WHERE owner_id = $1 AND pinned = FALSE")
        .bind(user.id)
        .execute(&state.db)
        .await
        .map_err(|e| {
            tracing::error!("clipboard: vidage de l'historique échoué: {e}");
            e
        })?;
    Ok(Json(json!({ "deleted": done.rows_affected() })))
}
