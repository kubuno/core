use crate::{auth::middleware::AdminUser, errors::AppError, models::user::User, state::AppState};
use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    Json,
};
use serde::Deserialize;
use serde_json::json;
use uuid::Uuid;

#[derive(Deserialize)]
pub struct ListUsersQuery {
    pub limit:  Option<i64>,
    pub offset: Option<i64>,
    pub search: Option<String>,
    pub role:   Option<String>,
}

pub async fn list_users(
    State(state): State<AppState>,
    _admin: AdminUser,
    Query(q): Query<ListUsersQuery>,
) -> Result<Json<serde_json::Value>, AppError> {
    let limit  = q.limit.unwrap_or(50).min(200);
    let offset = q.offset.unwrap_or(0);

    let users = sqlx::query_as::<_, User>(
        r#"SELECT * FROM core.users
           WHERE ($1::text IS NULL OR email ILIKE '%' || $1 || '%'
                  OR username ILIKE '%' || $1 || '%'
                  OR display_name ILIKE '%' || $1 || '%')
             AND ($2::text IS NULL OR role = $2)
           ORDER BY created_at DESC
           LIMIT $3 OFFSET $4"#,
    )
    .bind(q.search.as_deref())
    .bind(q.role.as_deref())
    .bind(limit)
    .bind(offset)
    .fetch_all(&state.db)
    .await?;

    let total: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM core.users")
        .fetch_one(&state.db)
        .await?;

    Ok(Json(json!({ "users": users, "total": total, "limit": limit, "offset": offset })))
}

#[derive(Deserialize)]
pub struct CreateUserAdminDto {
    pub email:        String,
    pub username:     String,
    pub password:     String,
    pub role:         Option<String>,
    pub display_name: Option<String>,
    pub quota_bytes:  Option<i64>,
}

pub async fn create_user(
    State(state): State<AppState>,
    _admin: AdminUser,
    Json(dto): Json<CreateUserAdminDto>,
) -> Result<impl axum::response::IntoResponse, AppError> {
    let exists: bool = sqlx::query_scalar(
        "SELECT EXISTS(SELECT 1 FROM core.users WHERE email = $1 OR username = $2)",
    )
    .bind(&dto.email)
    .bind(&dto.username)
    .fetch_one(&state.db)
    .await?;

    if exists {
        return Err(AppError::Conflict("Email ou username déjà utilisé".into()));
    }

    let hash = crate::crypto::password::hash_password(&dto.password)
        .map_err(|e| AppError::Internal(e))?;

    let role = dto.role.as_deref().unwrap_or("user");
    let quota = dto.quota_bytes.unwrap_or(10_737_418_240);

    let user = sqlx::query_as::<_, User>(
        r#"INSERT INTO core.users (email, username, password_hash, display_name, role, quota_bytes)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING *"#,
    )
    .bind(&dto.email)
    .bind(&dto.username)
    .bind(&hash)
    .bind(dto.display_name.as_deref())
    .bind(role)
    .bind(quota)
    .fetch_one(&state.db)
    .await?;

    Ok((StatusCode::CREATED, Json(json!({ "user": user }))))
}

pub async fn get_user(
    State(state): State<AppState>,
    _admin: AdminUser,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let user = sqlx::query_as::<_, User>("SELECT * FROM core.users WHERE id = $1")
        .bind(id)
        .fetch_optional(&state.db)
        .await?
        .ok_or_else(|| AppError::NotFound(format!("User {id}")))?;

    Ok(Json(json!({ "user": user })))
}

#[derive(Deserialize)]
pub struct UpdateUserAdminDto {
    pub role:        Option<String>,
    pub quota_bytes: Option<i64>,
    pub is_active:   Option<bool>,
    pub display_name: Option<String>,
}

pub async fn update_user(
    State(state): State<AppState>,
    _admin: AdminUser,
    Path(id): Path<Uuid>,
    Json(dto): Json<UpdateUserAdminDto>,
) -> Result<Json<serde_json::Value>, AppError> {
    let user = sqlx::query_as::<_, User>(
        r#"UPDATE core.users
           SET role        = COALESCE($1, role),
               quota_bytes = COALESCE($2, quota_bytes),
               is_active   = COALESCE($3, is_active),
               display_name = COALESCE($4, display_name)
           WHERE id = $5
           RETURNING *"#,
    )
    .bind(dto.role.as_deref())
    .bind(dto.quota_bytes)
    .bind(dto.is_active)
    .bind(dto.display_name.as_deref())
    .bind(id)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound(format!("User {id}")))?;

    Ok(Json(json!({ "user": user })))
}

pub async fn delete_user(
    State(state): State<AppState>,
    _admin: AdminUser,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let affected = sqlx::query(
        "UPDATE core.users SET is_active = FALSE WHERE id = $1 AND is_active = TRUE",
    )
    .bind(id)
    .execute(&state.db)
    .await?
    .rows_affected();

    if affected == 0 {
        return Err(AppError::NotFound(format!("User {id}")));
    }

    state.events.publish(crate::events::AppEvent::UserDeleted { user_id: id });

    Ok(Json(json!({ "message": "Utilisateur désactivé" })))
}

pub async fn admin_stats(
    State(state): State<AppState>,
    _admin: AdminUser,
) -> Result<Json<serde_json::Value>, AppError> {
    let users_total: i64 = sqlx::query_scalar(
        "SELECT COUNT(*)::bigint FROM core.users",
    )
    .fetch_one(&state.db)
    .await
    .map_err(|e| { tracing::error!(error = %e, "admin_stats: users_total"); AppError::Database(e) })?;

    let users_active: i64 = sqlx::query_scalar(
        "SELECT COUNT(*)::bigint FROM core.users WHERE is_active = TRUE",
    )
    .fetch_one(&state.db)
    .await
    .map_err(|e| { tracing::error!(error = %e, "admin_stats: users_active"); AppError::Database(e) })?;

    let storage_used: i64 = sqlx::query_scalar(
        "SELECT COALESCE(SUM(used_bytes), 0)::bigint FROM core.users",
    )
    .fetch_one(&state.db)
    .await
    .map_err(|e| { tracing::error!(error = %e, "admin_stats: storage_used"); AppError::Database(e) })?;

    let modules_active: i64 = sqlx::query_scalar(
        "SELECT COUNT(*)::bigint FROM core.module_instances WHERE status = 'healthy'",
    )
    .fetch_one(&state.db)
    .await
    .map_err(|e| { tracing::error!(error = %e, "admin_stats: modules_active"); AppError::Database(e) })?;

    // ── Statistiques de sessions ────────────────────────────────────────────
    let sessions_active: i64 = sqlx::query_scalar(
        "SELECT COUNT(*)::bigint FROM core.refresh_tokens
         WHERE revoked_at IS NULL AND expires_at > NOW()",
    )
    .fetch_one(&state.db)
    .await
    .map_err(|e| { tracing::error!(error = %e, "admin_stats: sessions_active"); AppError::Database(e) })?;

    // Utilisateurs distincts ayant au moins une session active (= connectés)
    let users_online: i64 = sqlx::query_scalar(
        "SELECT COUNT(DISTINCT user_id)::bigint FROM core.refresh_tokens
         WHERE revoked_at IS NULL AND expires_at > NOW()",
    )
    .fetch_one(&state.db)
    .await
    .map_err(|e| { tracing::error!(error = %e, "admin_stats: users_online"); AppError::Database(e) })?;

    // Sessions utilisées dans les dernières 24 h
    let sessions_24h: i64 = sqlx::query_scalar(
        "SELECT COUNT(*)::bigint FROM core.refresh_tokens
         WHERE revoked_at IS NULL AND last_used_at > NOW() - INTERVAL '24 hours'",
    )
    .fetch_one(&state.db)
    .await
    .map_err(|e| { tracing::error!(error = %e, "admin_stats: sessions_24h"); AppError::Database(e) })?;

    // ── Agrégats enrichis (cartes + graphiques) ─────────────────────────────────
    let storage_quota_total: i64 = sqlx::query_scalar(
        "SELECT COALESCE(SUM(quota_bytes), 0)::bigint FROM core.users",
    )
    .fetch_one(&state.db).await
    .map_err(|e| { tracing::error!(error = %e, "admin_stats: storage_quota_total"); AppError::Database(e) })?;

    let new_users_7d: i64 = sqlx::query_scalar(
        "SELECT COUNT(*)::bigint FROM core.users WHERE created_at > NOW() - INTERVAL '7 days'",
    )
    .fetch_one(&state.db).await
    .map_err(|e| { tracing::error!(error = %e, "admin_stats: new_users_7d"); AppError::Database(e) })?;

    let new_users_30d: i64 = sqlx::query_scalar(
        "SELECT COUNT(*)::bigint FROM core.users WHERE created_at > NOW() - INTERVAL '30 days'",
    )
    .fetch_one(&state.db).await
    .map_err(|e| { tracing::error!(error = %e, "admin_stats: new_users_30d"); AppError::Database(e) })?;

    // Répartitions (clé, compte)
    let users_by_role: Vec<(String, i64)> = sqlx::query_as(
        "SELECT role, COUNT(*)::bigint FROM core.users GROUP BY role ORDER BY 2 DESC",
    )
    .fetch_all(&state.db).await
    .map_err(|e| { tracing::error!(error = %e, "admin_stats: users_by_role"); AppError::Database(e) })?;

    let sessions_by_device: Vec<(String, i64)> = sqlx::query_as(
        "SELECT COALESCE(NULLIF(device_type, ''), 'unknown'), COUNT(*)::bigint FROM core.refresh_tokens
         WHERE revoked_at IS NULL AND expires_at > NOW() GROUP BY 1 ORDER BY 2 DESC",
    )
    .fetch_all(&state.db).await
    .map_err(|e| { tracing::error!(error = %e, "admin_stats: sessions_by_device"); AppError::Database(e) })?;

    let modules_by_status: Vec<(String, i64)> = sqlx::query_as(
        "SELECT status, COUNT(*)::bigint FROM core.module_instances GROUP BY status ORDER BY 2 DESC",
    )
    .fetch_all(&state.db).await
    .map_err(|e| { tracing::error!(error = %e, "admin_stats: modules_by_status"); AppError::Database(e) })?;

    // Top utilisateurs par stockage
    let top_storage: Vec<(String, i64, i64)> = sqlx::query_as(
        "SELECT COALESCE(NULLIF(display_name, ''), username), used_bytes, quota_bytes
         FROM core.users ORDER BY used_bytes DESC LIMIT 6",
    )
    .fetch_all(&state.db).await
    .map_err(|e| { tracing::error!(error = %e, "admin_stats: top_storage"); AppError::Database(e) })?;

    // Séries journalières (zéro-remplies via generate_series)
    let daily = |table: &str, date_col: &str, days: i64| -> String {
        format!(
            "SELECT to_char(d::date, 'YYYY-MM-DD'), COALESCE(c.cnt, 0)::bigint \
             FROM generate_series((CURRENT_DATE - INTERVAL '{n} days')::date, CURRENT_DATE, INTERVAL '1 day') AS d \
             LEFT JOIN (SELECT {col}::date AS day, COUNT(*) cnt FROM {tbl} \
                        WHERE {col} > CURRENT_DATE - INTERVAL '{n1} days' GROUP BY 1) c ON c.day = d::date \
             ORDER BY d",
            n = days - 1, n1 = days, col = date_col, tbl = table,
        )
    };

    let signups_daily: Vec<(String, i64)> = sqlx::query_as(&daily("core.users", "created_at", 14))
        .fetch_all(&state.db).await
        .map_err(|e| { tracing::error!(error = %e, "admin_stats: signups_daily"); AppError::Database(e) })?;

    let logins_daily: Vec<(String, i64)> = sqlx::query_as(&daily("core.refresh_tokens", "created_at", 14))
        .fetch_all(&state.db).await
        .map_err(|e| { tracing::error!(error = %e, "admin_stats: logins_daily"); AppError::Database(e) })?;

    let events_daily: Vec<(String, i64)> = sqlx::query_as(&daily("core.event_log", "created_at", 7))
        .fetch_all(&state.db).await
        .unwrap_or_default(); // event_log peut être vide / absente selon l'instance

    let kv = |rows: Vec<(String, i64)>| -> Vec<serde_json::Value> {
        rows.into_iter().map(|(k, v)| json!({ "key": k, "count": v })).collect()
    };
    let series = |rows: Vec<(String, i64)>| -> Vec<serde_json::Value> {
        rows.into_iter().map(|(d, v)| json!({ "date": d, "count": v })).collect()
    };

    Ok(Json(json!({
        "users_total":         users_total,
        "users_active":        users_active,
        "storage_used":        storage_used,
        "storage_quota_total": storage_quota_total,
        "modules_active":      modules_active,
        "sessions_active":     sessions_active,
        "users_online":        users_online,
        "sessions_24h":        sessions_24h,
        "new_users_7d":        new_users_7d,
        "new_users_30d":       new_users_30d,
        "users_by_role":       kv(users_by_role),
        "sessions_by_device":  kv(sessions_by_device),
        "modules_by_status":   kv(modules_by_status),
        "signups_daily":       series(signups_daily),
        "logins_daily":        series(logins_daily),
        "events_daily":        series(events_daily),
        "top_storage": top_storage.into_iter()
            .map(|(name, used, quota)| json!({ "name": name, "used": used, "quota": quota }))
            .collect::<Vec<_>>(),
    })))
}

/// GET /admin/users/:id/sessions — liste les sessions actives d'un utilisateur.
pub async fn list_user_sessions(
    State(state): State<AppState>,
    _admin: AdminUser,
    Path(user_id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let sessions = sqlx::query_as::<_, crate::models::session::RefreshToken>(
        r#"SELECT id, user_id, token_hash, device_name, device_type,
                  host(ip_address)::text as ip_address, user_agent,
                  expires_at, created_at, last_used_at, revoked_at, revoke_reason
           FROM core.refresh_tokens
           WHERE user_id = $1 AND revoked_at IS NULL AND expires_at > NOW()
           ORDER BY last_used_at DESC"#,
    )
    .bind(user_id)
    .fetch_all(&state.db)
    .await
    .map_err(|e| { tracing::error!(error = %e, "list_user_sessions"); AppError::Database(e) })?;

    Ok(Json(json!({ "sessions": sessions })))
}

/// DELETE /admin/users/:id/sessions/:sid — révoque une session précise.
pub async fn revoke_user_session(
    State(state): State<AppState>,
    _admin: AdminUser,
    Path((user_id, session_id)): Path<(Uuid, Uuid)>,
) -> Result<Json<serde_json::Value>, AppError> {
    let affected = sqlx::query(
        "UPDATE core.refresh_tokens
         SET revoked_at = NOW(), revoke_reason = 'admin'
         WHERE id = $1 AND user_id = $2 AND revoked_at IS NULL",
    )
    .bind(session_id)
    .bind(user_id)
    .execute(&state.db)
    .await
    .map_err(|e| { tracing::error!(error = %e, "revoke_user_session"); AppError::Database(e) })?
    .rows_affected();

    if affected == 0 {
        return Err(AppError::NotFound("Session introuvable".into()));
    }
    Ok(Json(json!({ "ok": true })))
}

/// DELETE /admin/users/:id/sessions — révoque TOUTES les sessions d'un utilisateur.
pub async fn revoke_all_user_sessions(
    State(state): State<AppState>,
    _admin: AdminUser,
    Path(user_id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let affected = sqlx::query(
        "UPDATE core.refresh_tokens
         SET revoked_at = NOW(), revoke_reason = 'admin'
         WHERE user_id = $1 AND revoked_at IS NULL",
    )
    .bind(user_id)
    .execute(&state.db)
    .await
    .map_err(|e| { tracing::error!(error = %e, "revoke_all_user_sessions"); AppError::Database(e) })?
    .rows_affected();

    Ok(Json(json!({ "ok": true, "revoked": affected })))
}
