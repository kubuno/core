use crate::{auth::middleware::AdminUser, errors::AppError, state::AppState};
use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use serde::{Deserialize, Serialize};
use serde_json::json;
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Serialize, FromRow)]
pub struct OrgUnit {
    pub id:          Uuid,
    pub name:        String,
    pub parent_id:   Option<Uuid>,
    pub description: Option<String>,
}

pub async fn list_org_units(
    State(state): State<AppState>,
    _admin: AdminUser,
) -> Result<Json<serde_json::Value>, AppError> {
    let units = sqlx::query_as::<_, OrgUnit>(
        "SELECT id, name, parent_id, description FROM core.org_units ORDER BY name",
    )
    .fetch_all(&state.db)
    .await
    .map_err(|e| { tracing::error!(error = %e, "list_org_units"); AppError::Database(e) })?;

    Ok(Json(json!({ "org_units": units })))
}

#[derive(Deserialize)]
pub struct CreateOrgUnitDto {
    pub name:        String,
    pub parent_id:   Option<Uuid>,
    pub description: Option<String>,
}

pub async fn create_org_unit(
    State(state): State<AppState>,
    _admin: AdminUser,
    Json(dto): Json<CreateOrgUnitDto>,
) -> Result<impl axum::response::IntoResponse, AppError> {
    let name = dto.name.trim();
    if name.is_empty() {
        return Err(AppError::Validation("Nom requis".into()));
    }
    let unit = sqlx::query_as::<_, OrgUnit>(
        "INSERT INTO core.org_units (name, parent_id, description) VALUES ($1, $2, $3) RETURNING id, name, parent_id, description",
    )
    .bind(name)
    .bind(dto.parent_id)
    .bind(dto.description.as_deref())
    .fetch_one(&state.db)
    .await
    .map_err(|e| { tracing::error!(error = %e, "create_org_unit"); AppError::Database(e) })?;

    Ok((StatusCode::CREATED, Json(json!({ "org_unit": unit }))))
}

#[derive(Deserialize)]
pub struct UpdateOrgUnitDto {
    pub name:        Option<String>,
    pub parent_id:   Option<Uuid>,
    pub description: Option<String>,
}

pub async fn update_org_unit(
    State(state): State<AppState>,
    _admin: AdminUser,
    Path(id): Path<Uuid>,
    Json(dto): Json<UpdateOrgUnitDto>,
) -> Result<Json<serde_json::Value>, AppError> {
    if dto.parent_id == Some(id) {
        return Err(AppError::Validation("Une unité ne peut pas être son propre parent".into()));
    }
    let unit = sqlx::query_as::<_, OrgUnit>(
        r#"UPDATE core.org_units
           SET name = COALESCE($1, name),
               parent_id = COALESCE($2, parent_id),
               description = COALESCE($3, description)
           WHERE id = $4
           RETURNING id, name, parent_id, description"#,
    )
    .bind(dto.name.as_deref())
    .bind(dto.parent_id)
    .bind(dto.description.as_deref())
    .bind(id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| { tracing::error!(error = %e, "update_org_unit"); AppError::Database(e) })?
    .ok_or_else(|| AppError::NotFound(format!("Unité {id}")))?;

    Ok(Json(json!({ "org_unit": unit })))
}

pub async fn delete_org_unit(
    State(state): State<AppState>,
    _admin: AdminUser,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    // The root unit (parent_id IS NULL) cannot be deleted.
    let parent: Option<Option<Uuid>> =
        sqlx::query_scalar("SELECT parent_id FROM core.org_units WHERE id = $1")
            .bind(id)
            .fetch_optional(&state.db)
            .await
            .map_err(|e| { tracing::error!(error = %e, "delete_org_unit lookup"); AppError::Database(e) })?;
    let parent = parent.ok_or_else(|| AppError::NotFound(format!("Unité {id}")))?;
    let Some(parent_id) = parent else {
        return Err(AppError::Validation("Impossible de supprimer l'unité racine".into()));
    };

    // Reparent children and move users up to the parent, then delete — atomically.
    let mut tx = state.db.begin().await?;
    sqlx::query("UPDATE core.org_units SET parent_id = $1 WHERE parent_id = $2")
        .bind(parent_id).bind(id).execute(&mut *tx).await?;
    sqlx::query("UPDATE core.users SET org_unit_id = $1 WHERE org_unit_id = $2")
        .bind(parent_id).bind(id).execute(&mut *tx).await?;
    sqlx::query("DELETE FROM core.org_units WHERE id = $1")
        .bind(id).execute(&mut *tx).await?;
    tx.commit().await?;

    Ok(Json(json!({ "message": "Unité supprimée" })))
}
