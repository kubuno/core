use axum::{
    extract::{Path, State},
    Json,
};
use serde::Deserialize;
use serde_json::{json, Value};
use uuid::Uuid;
use validator::Validate;

use crate::{
    auth::middleware::AdminUser,
    errors::AppError,
    models::group::{CreateGroupDto, UpdateGroupDto, UserGroup},
    state::AppState,
};

pub async fn list_groups(
    State(state): State<AppState>,
    _admin: AdminUser,
) -> Result<Json<Value>, AppError> {
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
    Path(group_id): Path<Uuid>,
) -> Result<Json<Value>, AppError> {
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
    _admin: AdminUser,
    Json(dto): Json<CreateGroupDto>,
) -> Result<Json<Value>, AppError> {
    dto.validate()
        .map_err(|e| AppError::Validation(e.to_string()))?;

    let permissions = serde_json::to_value(&dto.permissions)
        .unwrap_or(serde_json::Value::Array(vec![]));

    let group = sqlx::query_as::<_, UserGroup>(
        r#"INSERT INTO core.user_groups (name, description, permissions, is_default)
           VALUES ($1, $2, $3, $4)
           RETURNING *"#,
    )
    .bind(&dto.name)
    .bind(dto.description.as_deref())
    .bind(&permissions)
    .bind(dto.is_default)
    .fetch_one(&state.db)
    .await
    .map_err(|e| {
        if e.to_string().contains("unique") {
            AppError::Conflict(format!("Un groupe nommé '{}' existe déjà", dto.name))
        } else {
            AppError::Database(e)
        }
    })?;

    Ok(Json(json!({ "group": group })))
}

pub async fn update_group(
    State(state): State<AppState>,
    _admin: AdminUser,
    Path(group_id): Path<Uuid>,
    Json(dto): Json<UpdateGroupDto>,
) -> Result<Json<Value>, AppError> {
    dto.validate()
        .map_err(|e| AppError::Validation(e.to_string()))?;

    let permissions = dto.permissions.as_ref().map(|p| serde_json::to_value(p).unwrap_or_default());

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
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Groupe introuvable".into()))?;

    Ok(Json(json!({ "group": group })))
}

pub async fn delete_group(
    State(state): State<AppState>,
    _admin: AdminUser,
    Path(group_id): Path<Uuid>,
) -> Result<Json<Value>, AppError> {
    // Les groupes système (Administrateurs, Utilisateurs, Invités) ne sont pas supprimables
    let is_system: Option<bool> = sqlx::query_scalar(
        "SELECT is_system FROM core.user_groups WHERE id = $1",
    )
    .bind(group_id)
    .fetch_optional(&state.db)
    .await?;

    match is_system {
        None => return Err(AppError::NotFound("Groupe introuvable".into())),
        Some(true) => return Err(AppError::Forbidden),
        Some(false) => {}
    }

    sqlx::query("DELETE FROM core.user_groups WHERE id = $1")
        .bind(group_id)
        .execute(&state.db)
        .await?;

    Ok(Json(json!({ "message": "Groupe supprimé" })))
}

// ── Membres ───────────────────────────────────────────────────────────────────

#[derive(Deserialize)]
pub struct AddMemberDto {
    pub user_id: Uuid,
}

pub async fn add_member(
    State(state): State<AppState>,
    AdminUser(admin): AdminUser,
    Path(group_id): Path<Uuid>,
    Json(dto): Json<AddMemberDto>,
) -> Result<Json<Value>, AppError> {
    // Vérifier que le groupe existe
    let exists: bool = sqlx::query_scalar(
        "SELECT EXISTS(SELECT 1 FROM core.user_groups WHERE id = $1)",
    )
    .bind(group_id)
    .fetch_one(&state.db)
    .await?;
    if !exists { return Err(AppError::NotFound("Groupe introuvable".into())); }

    sqlx::query(
        r#"INSERT INTO core.user_group_members (group_id, user_id, added_by)
           VALUES ($1, $2, $3)
           ON CONFLICT DO NOTHING"#,
    )
    .bind(group_id)
    .bind(dto.user_id)
    .bind(admin.id)
    .execute(&state.db)
    .await?;

    Ok(Json(json!({ "message": "Membre ajouté" })))
}

pub async fn remove_member(
    State(state): State<AppState>,
    _admin: AdminUser,
    Path((group_id, user_id)): Path<(Uuid, Uuid)>,
) -> Result<Json<Value>, AppError> {
    let affected = sqlx::query(
        "DELETE FROM core.user_group_members WHERE group_id = $1 AND user_id = $2",
    )
    .bind(group_id)
    .bind(user_id)
    .execute(&state.db)
    .await?
    .rows_affected();

    if affected == 0 {
        return Err(AppError::NotFound("Membre introuvable dans ce groupe".into()));
    }
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
