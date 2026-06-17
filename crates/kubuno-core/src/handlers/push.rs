//! User-facing endpoints to register push devices and tune preferences.

use axum::{
    extract::{Path, State},
    Json,
};
use serde::Deserialize;
use serde_json::{json, Value};

use crate::{auth::middleware::AuthUser, errors::AppError, state::AppState};

#[derive(Deserialize)]
pub struct RegisterDeviceDto {
    pub provider:     String, // 'unifiedpush' | 'apns' | 'fcm'
    pub device_token: String, // endpoint URL (unifiedpush) or push token
    pub app_id:       Option<String>,
    pub locale:       Option<String>,
}

/// POST /api/v1/me/push/devices — register (or refresh) a device.
pub async fn register_device(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
    Json(dto): Json<RegisterDeviceDto>,
) -> Result<Json<Value>, AppError> {
    if !matches!(dto.provider.as_str(), "unifiedpush" | "apns" | "fcm") {
        return Err(AppError::Validation("provider inconnu".into()));
    }
    if dto.device_token.trim().is_empty() {
        return Err(AppError::Validation("device_token requis".into()));
    }

    // Re-registering the same (provider, token) re-binds it to this user.
    let id: uuid::Uuid = sqlx::query_scalar(
        r#"INSERT INTO core.push_devices (user_id, provider, device_token, app_id, locale)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (provider, device_token)
           DO UPDATE SET user_id = EXCLUDED.user_id, app_id = EXCLUDED.app_id,
                         locale = EXCLUDED.locale, last_seen_at = NOW()
           RETURNING id"#,
    )
    .bind(user.id)
    .bind(&dto.provider)
    .bind(&dto.device_token)
    .bind(dto.app_id.as_deref())
    .bind(dto.locale.as_deref())
    .fetch_one(&state.db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, "register_device");
        AppError::Database(e)
    })?;

    Ok(Json(json!({ "id": id })))
}

/// DELETE /api/v1/me/push/devices/:id — unregister a device.
pub async fn delete_device(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
    Path(device_id): Path<uuid::Uuid>,
) -> Result<Json<Value>, AppError> {
    let affected = sqlx::query("DELETE FROM core.push_devices WHERE id = $1 AND user_id = $2")
        .bind(device_id)
        .bind(user.id)
        .execute(&state.db)
        .await?
        .rows_affected();

    if affected == 0 {
        return Err(AppError::NotFound("Device introuvable".into()));
    }
    Ok(Json(json!({ "message": "Device supprimé" })))
}

/// GET /api/v1/me/push/preferences — list opt-out preferences.
pub async fn list_preferences(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
) -> Result<Json<Value>, AppError> {
    let rows = sqlx::query_as::<_, (String, String, bool)>(
        "SELECT module_id, event_type, enabled FROM core.push_preferences WHERE user_id = $1",
    )
    .bind(user.id)
    .fetch_all(&state.db)
    .await?;

    let prefs: Vec<Value> = rows
        .into_iter()
        .map(|(module_id, event_type, enabled)| json!({
            "module_id": module_id, "event_type": event_type, "enabled": enabled,
        }))
        .collect();
    Ok(Json(json!({ "preferences": prefs })))
}

#[derive(Deserialize)]
pub struct SetPreferenceDto {
    pub module_id:  Option<String>,
    pub event_type: Option<String>,
    pub enabled:    bool,
}

/// PATCH /api/v1/me/push/preferences — upsert one preference.
pub async fn set_preference(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
    Json(dto): Json<SetPreferenceDto>,
) -> Result<Json<Value>, AppError> {
    let module_id = dto.module_id.unwrap_or_else(|| "*".into());
    let event_type = dto.event_type.unwrap_or_else(|| "*".into());

    sqlx::query(
        r#"INSERT INTO core.push_preferences (user_id, module_id, event_type, enabled)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (user_id, module_id, event_type) DO UPDATE SET enabled = EXCLUDED.enabled"#,
    )
    .bind(user.id)
    .bind(&module_id)
    .bind(&event_type)
    .bind(dto.enabled)
    .execute(&state.db)
    .await?;

    Ok(Json(json!({ "message": "Préférence enregistrée" })))
}
