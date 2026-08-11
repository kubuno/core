use axum::{
    extract::{Path, State},
    Json,
};
use serde::Deserialize;
use serde_json::{json, Value};
use uuid::Uuid;
use validator::Validate;

use crate::{
    authz::{keys, AdminCtx},
    audit::{redact::target, snap, AdminAudit, AuditEntry},
    auth::middleware::AdminUser,
    errors::AppError,
    models::group::{CreateGroupDto, UpdateGroupDto, UserGroup},
    state::AppState,
};

pub async fn list_groups(
    State(state): State<AppState>,
    _admin: AdminUser,
    ctx: AdminCtx,
) -> Result<Json<Value>, AppError> {
    ctx.require(keys::GROUPS_READ)?;
    let groups = sqlx::query_as::<_, UserGroup>(
        r#"SELECT g.id, g.name, g.description, g.permissions, g.is_default, g.is_system,
                  g.created_at, g.updated_at
           FROM core.user_groups g
           ORDER BY g.is_system DESC, g.name"#,
    )
    .fetch_all(&state.db)
    .await?;

    // Enrichit chaque groupe avec le nombre de membres
    let mut result = Vec::with_capacity(groups.len());
    for g in groups {
        let count: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM core.user_group_members WHERE group_id = $1",
        )
        .bind(g.id)
        .fetch_one(&state.db)
        .await
        .unwrap_or(0);
        result.push(json!({
            "id":           g.id,
            "name":         g.name,
            "description":  g.description,
            "permissions":  g.permissions,
            "is_default":   g.is_default,
            "is_system":    g.is_system,
            "member_count": count,
            "created_at":   g.created_at,
            "updated_at":   g.updated_at,
        }));
    }

    Ok(Json(json!({ "groups": result })))
}

pub async fn get_group(
    State(state): State<AppState>,
    _admin: AdminUser,
    ctx: AdminCtx,
    Path(group_id): Path<Uuid>,
) -> Result<Json<Value>, AppError> {
    ctx.require(keys::GROUPS_READ)?;
    let group = sqlx::query_as::<_, UserGroup>(
        "SELECT * FROM core.user_groups WHERE id = $1",
    )
    .bind(group_id)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Groupe introuvable".into()))?;

    let members = sqlx::query_as::<_, (Uuid, String, String, String)>(
        r#"SELECT u.id, u.username, u.email,
                  COALESCE(u.display_name, u.username) as display_name
           FROM core.user_group_members m
           JOIN core.users u ON u.id = m.user_id
           WHERE m.group_id = $1
           ORDER BY u.username"#,
    )
    .bind(group_id)
    .fetch_all(&state.db)
    .await?;

    let members_json: Vec<Value> = members.iter().map(|(id, username, email, display_name)| json!({
        "id": id, "username": username, "email": email, "display_name": display_name,
    })).collect();

    Ok(Json(json!({
        "group":   group,
        "members": members_json,
    })))
}

pub async fn create_group(
    State(state): State<AppState>,
    audit: AdminAudit,
    ctx: AdminCtx,
    Json(dto): Json<CreateGroupDto>,
) -> Result<Json<Value>, AppError> {
    ctx.require(keys::GROUPS_MANAGE)?;
    dto.validate()
        .map_err(|e| AppError::Validation(e.to_string()))?;

    let permissions = serde_json::to_value(&dto.permissions)
        .unwrap_or(serde_json::Value::Array(vec![]));

    let mut tx = audit.begin(&state.db).await?;

    let group = sqlx::query_as::<_, UserGroup>(
        r#"INSERT INTO core.user_groups (name, description, permissions, is_default)
           VALUES ($1, $2, $3, $4)
           RETURNING *"#,
    )
    .bind(&dto.name)
    .bind(dto.description.as_deref())
    .bind(&permissions)
    .bind(dto.is_default)
    .fetch_one(&mut *tx)
    .await
    .map_err(|e| {
        if e.to_string().contains("unique") {
            AppError::Conflict(format!("Un groupe nommé '{}' existe déjà", dto.name))
        } else {
            tracing::error!(error = %e, "create_group");
            AppError::Database(e)
        }
    })?;

    tx.commit(
        AuditEntry::new("core.groups.create")
            .target(target::GROUP, group.id, group.name.clone())
            .after(snap(target::GROUP, &group))
            .reversible(),
    )
    .await?;

    Ok(Json(json!({ "group": group })))
}

pub async fn update_group(
    State(state): State<AppState>,
    audit: AdminAudit,
    ctx: AdminCtx,
    Path(group_id): Path<Uuid>,
    Json(dto): Json<UpdateGroupDto>,
) -> Result<Json<Value>, AppError> {
    ctx.require(keys::GROUPS_MANAGE)?;
    dto.validate()
        .map_err(|e| AppError::Validation(e.to_string()))?;

    let permissions = dto.permissions.as_ref().map(|p| serde_json::to_value(p).unwrap_or_default());

    let mut tx = audit.begin(&state.db).await?;

    let previous = sqlx::query_as::<_, UserGroup>(
        "SELECT * FROM core.user_groups WHERE id = $1 FOR UPDATE",
    )
    .bind(group_id)
    .fetch_optional(&mut *tx)
    .await
    .map_err(|e| { tracing::error!(error = %e, "update_group: lecture"); AppError::Database(e) })?
    .ok_or_else(|| AppError::NotFound("Groupe introuvable".into()))?;

    let group = sqlx::query_as::<_, UserGroup>(
        r#"UPDATE core.user_groups
           SET name        = COALESCE($1, name),
               description = CASE WHEN $2::text IS NOT NULL THEN $2 ELSE description END,
               permissions = COALESCE($3, permissions),
               is_default  = COALESCE($4, is_default)
           WHERE id = $5
           RETURNING *"#,
    )
    .bind(dto.name.as_deref())
    .bind(dto.description.as_deref())
    .bind(permissions.as_ref())
    .bind(dto.is_default)
    .bind(group_id)
    .fetch_optional(&mut *tx)
    .await
    .map_err(|e| { tracing::error!(error = %e, "update_group: écriture"); AppError::Database(e) })?
    .ok_or_else(|| AppError::NotFound("Groupe introuvable".into()))?;

    tx.commit(
        AuditEntry::new("core.groups.update")
            .target(target::GROUP, group.id, group.name.clone())
            .before(snap(target::GROUP, &previous))
            .after(snap(target::GROUP, &group))
            .reversible(),
    )
    .await?;

    Ok(Json(json!({ "group": group })))
}

pub async fn delete_group(
    State(state): State<AppState>,
    audit: AdminAudit,
    ctx: AdminCtx,
    Path(group_id): Path<Uuid>,
) -> Result<Json<Value>, AppError> {
    ctx.require(keys::GROUPS_MANAGE)?;
    let mut tx = audit.begin(&state.db).await?;

    let group = sqlx::query_as::<_, UserGroup>(
        "SELECT * FROM core.user_groups WHERE id = $1 FOR UPDATE",
    )
    .bind(group_id)
    .fetch_optional(&mut *tx)
    .await
    .map_err(|e| { tracing::error!(error = %e, "delete_group: lecture"); AppError::Database(e) })?
    .ok_or_else(|| AppError::NotFound("Groupe introuvable".into()))?;

    // Les groupes système (Administrateurs, Utilisateurs, Invités) ne sont pas
    // supprimables : le refus est journalisé au même titre qu'une réussite.
    if group.is_system {
        let name = group.name.clone();
        return Err(tx
            .abort(
                &state.db,
                AuditEntry::new("core.groups.delete")
                    .target(target::GROUP, group_id, name)
                    .before(snap(target::GROUP, &group)),
                AppError::Forbidden,
            )
            .await);
    }

    sqlx::query("DELETE FROM core.user_groups WHERE id = $1")
        .bind(group_id)
        .execute(&mut *tx)
        .await
        .map_err(|e| { tracing::error!(error = %e, "delete_group"); AppError::Database(e) })?;

    tx.commit(
        AuditEntry::new("core.groups.delete")
            .target(target::GROUP, group_id, group.name.clone())
            .before(snap(target::GROUP, &group))
            .reversible(),
    )
    .await?;

    Ok(Json(json!({ "message": "Groupe supprimé" })))
}

// ── Membres ───────────────────────────────────────────────────────────────────

#[derive(Deserialize)]
pub struct AddMemberDto {
    pub user_id: Uuid,
}

/// Group name and member username, for a readable membership entry.
async fn membership_labels(
    conn: &mut sqlx::PgConnection,
    group_id: Uuid,
    user_id: Uuid,
) -> Result<(String, String), AppError> {
    let group_name: Option<String> =
        sqlx::query_scalar("SELECT name FROM core.user_groups WHERE id = $1")
            .bind(group_id)
            .fetch_optional(&mut *conn)
            .await
            .map_err(|e| { tracing::error!(error = %e, "membership_labels: groupe"); AppError::Database(e) })?;
    let group_name = group_name.ok_or_else(|| AppError::NotFound("Groupe introuvable".into()))?;

    let username: Option<String> =
        sqlx::query_scalar("SELECT username FROM core.users WHERE id = $1")
            .bind(user_id)
            .fetch_optional(&mut *conn)
            .await
            .map_err(|e| { tracing::error!(error = %e, "membership_labels: utilisateur"); AppError::Database(e) })?;

    Ok((group_name, username.unwrap_or_else(|| user_id.to_string())))
}

pub async fn add_member(
    State(state): State<AppState>,
    audit: AdminAudit,
    ctx: AdminCtx,
    Path(group_id): Path<Uuid>,
    Json(dto): Json<AddMemberDto>,
) -> Result<Json<Value>, AppError> {
    ctx.require(keys::GROUPS_MANAGE)?;
    let mut tx = audit.begin(&state.db).await?;
    let (group_name, username) = membership_labels(&mut tx, group_id, dto.user_id).await?;

    sqlx::query(
        r#"INSERT INTO core.user_group_members (group_id, user_id, added_by)
           VALUES ($1, $2, $3)
           ON CONFLICT DO NOTHING"#,
    )
    .bind(group_id)
    .bind(dto.user_id)
    .bind(audit.admin.id)
    .execute(&mut *tx)
    .await
    .map_err(|e| { tracing::error!(error = %e, "add_member"); AppError::Database(e) })?;

    tx.commit(
        AuditEntry::new("core.groups.member_add")
            .target(target::GROUP, group_id, group_name.clone())
            .after(crate::audit::redact::snapshot(
                target::GROUP_MEMBER,
                &json!({
                    "group_id": group_id, "group_name": group_name,
                    "user_id": dto.user_id, "username": username,
                }),
            ))
            .reversible(),
    )
    .await?;

    Ok(Json(json!({ "message": "Membre ajouté" })))
}

pub async fn remove_member(
    State(state): State<AppState>,
    audit: AdminAudit,
    ctx: AdminCtx,
    Path((group_id, user_id)): Path<(Uuid, Uuid)>,
) -> Result<Json<Value>, AppError> {
    ctx.require(keys::GROUPS_MANAGE)?;
    let mut tx = audit.begin(&state.db).await?;
    let (group_name, username) = membership_labels(&mut tx, group_id, user_id).await?;

    let affected = sqlx::query(
        "DELETE FROM core.user_group_members WHERE group_id = $1 AND user_id = $2",
    )
    .bind(group_id)
    .bind(user_id)
    .execute(&mut *tx)
    .await
    .map_err(|e| { tracing::error!(error = %e, "remove_member"); AppError::Database(e) })?
    .rows_affected();

    if affected == 0 {
        return Err(AppError::NotFound("Membre introuvable dans ce groupe".into()));
    }

    tx.commit(
        AuditEntry::new("core.groups.member_remove")
            .target(target::GROUP, group_id, group_name.clone())
            .before(crate::audit::redact::snapshot(
                target::GROUP_MEMBER,
                &json!({
                    "group_id": group_id, "group_name": group_name,
                    "user_id": user_id, "username": username,
                }),
            ))
            .reversible(),
    )
    .await?;

    Ok(Json(json!({ "message": "Membre retiré" })))
}

/// Liste les groupes d'un utilisateur (utilisé par d'autres handlers).
pub async fn user_groups(db: &sqlx::PgPool, user_id: Uuid) -> Result<Vec<UserGroup>, sqlx::Error> {
    sqlx::query_as::<_, UserGroup>(
        r#"SELECT g.* FROM core.user_groups g
           JOIN core.user_group_members m ON m.group_id = g.id
           WHERE m.user_id = $1"#,
    )
    .bind(user_id)
    .fetch_all(db)
    .await
}

/// Vérifie si un user a une permission donnée (via son rôle ou ses groupes).
/// `allowed_roles` provient de la setting `auth.api_token_allowed_roles`.
pub async fn user_has_permission(
    db: &sqlx::PgPool,
    user_role: &str,
    user_id: Uuid,
    permission: &str,
    allowed_roles: &[String],
) -> bool {
    // 1. Via le rôle système
    if allowed_roles.iter().any(|r| r == user_role) {
        return true;
    }
    // 2. Via les groupes
    let groups = user_groups(db, user_id).await.unwrap_or_default();
    groups.iter().any(|g| {
        g.permissions
            .as_array()
            .map(|arr| arr.iter().any(|p| p.as_str() == Some(permission)))
            .unwrap_or(false)
    })
}
