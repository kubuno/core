//! Cross-module labels: user-owned labels attachable to elements of ANY module.
//!
//! A link stores a denormalized snapshot of the element ({module,
//! resource_type, resource_id, title, href, envelope}) so listing, filtering
//! and searching across modules never fans out to module backends. The
//! `envelope` is a full cross-module JSON envelope: the frontend renders it
//! through the same `core.data-card` renderers as clipboard paste.

use axum::{
    extract::{Path, Query, State},
    Json,
};
use serde::Deserialize;
use serde_json::{json, Value};
use uuid::Uuid;
use validator::Validate;

use crate::{
    auth::middleware::AuthUser,
    errors::AppError,
    models::label::{
        CreateLabelDto, Label, LabelLink, SetLabelSharesDto, SetResourceLabelsDto, UpdateLabelDto,
    },
    state::AppState,
};

fn normalized_color(color: Option<&str>) -> Result<String, AppError> {
    let c = color.unwrap_or("#1a73e8").trim().to_string();
    if !c.starts_with('#') || !(4..=9).contains(&c.len()) || !c[1..].chars().all(|ch| ch.is_ascii_hexdigit()) {
        return Err(AppError::Validation("Couleur invalide (attendu #rrggbb)".into()));
    }
    Ok(c)
}

/// Effective rights of `user_id` on `label_id` — `None` when the label does not
/// exist or is not shared with them. `core.label_access` folds ownership, direct
/// shares and group shares, keeping the most permissive.
async fn access(
    db: &sqlx::PgPool,
    user_id: Uuid,
    label_id: Uuid,
) -> Result<Option<(bool, bool)>, AppError> {
    let row = sqlx::query_as::<_, (bool, bool)>(
        "SELECT is_owner, can_manage FROM core.label_access($1) WHERE label_id = $2",
    )
    .bind(user_id)
    .bind(label_id)
    .fetch_optional(db)
    .await?;
    Ok(row)
}

/// Rejects the caller unless they may manage `label_id` (owner or a share with
/// `can_manage`). Unknown and forbidden are both 404: no existence leak.
async fn require_manage(db: &sqlx::PgPool, user_id: Uuid, label_id: Uuid) -> Result<(), AppError> {
    match access(db, user_id, label_id).await? {
        Some((_, true)) => Ok(()),
        Some((_, false)) => Err(AppError::Forbidden),
        None => Err(AppError::NotFound("Étiquette introuvable".into())),
    }
}

/// GET /api/v1/labels — every label the caller may see: their own plus those
/// shared with them directly or through one of their groups.
pub async fn list(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
) -> Result<Json<Value>, AppError> {
    // `link_count` follows the visibility rule: a manager counts everyone's
    // links, a plain recipient only their own.
    let rows = sqlx::query_as::<_, (Uuid, String, String, Option<String>, bool, bool, Uuid, String, i64, i64)>(
        r#"SELECT l.id, l.name, l.color, l.description,
                  a.is_owner, a.can_manage,
                  l.owner_id, COALESCE(u.display_name, u.username) AS owner_name,
                  (SELECT COUNT(*) FROM core.label_links k
                    WHERE k.label_id = l.id AND (a.can_manage OR k.owner_id = $1)) AS link_count,
                  (SELECT COUNT(*) FROM core.label_shares s WHERE s.label_id = l.id) AS share_count
           FROM core.label_access($1) a
           JOIN core.labels l ON l.id = a.label_id
           JOIN core.users  u ON u.id = l.owner_id
           ORDER BY a.is_owner DESC, LOWER(l.name)"#,
    )
    .bind(user.id)
    .fetch_all(&state.db)
    .await?;

    let labels: Vec<Value> = rows
        .into_iter()
        .map(|(id, name, color, description, is_owner, can_manage, owner_id, owner_name, link_count, share_count)| {
            json!({
                "id": id, "name": name, "color": color, "description": description,
                "is_owner": is_owner, "can_manage": can_manage,
                "owner_id": owner_id, "owner_name": owner_name,
                "link_count": link_count, "share_count": share_count,
            })
        })
        .collect();
    Ok(Json(json!({ "labels": labels })))
}

/// POST /api/v1/labels
pub async fn create(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
    Json(dto): Json<CreateLabelDto>,
) -> Result<Json<Value>, AppError> {
    dto.validate().map_err(|e| AppError::Validation(e.to_string()))?;
    let name = dto.name.trim();
    if name.is_empty() {
        return Err(AppError::Validation("Nom vide".into()));
    }
    let color = normalized_color(dto.color.as_deref())?;

    let label = sqlx::query_as::<_, Label>(
        r#"INSERT INTO core.labels (owner_id, name, color, description)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (owner_id, name) DO UPDATE SET updated_at = NOW()
           RETURNING id, owner_id, name, color, description, created_at, updated_at"#,
    )
    .bind(user.id)
    .bind(name)
    .bind(&color)
    .bind(dto.description.as_deref())
    .fetch_one(&state.db)
    .await?;

    // Same shape as `list`, so the caller can drop the new label straight into
    // its state without inventing the access fields. A fresh label is owned,
    // manageable, unshared and unlinked by definition.
    Ok(Json(json!({ "label": {
        "id": label.id, "name": label.name, "color": label.color,
        "description": label.description,
        "is_owner": true, "can_manage": true,
        "owner_id": user.id,
        "owner_name": user.display_name.as_ref().unwrap_or(&user.username),
        "link_count": 0, "share_count": 0,
    } })))
}

/// PATCH /api/v1/labels/:id
pub async fn update(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
    Path(id): Path<Uuid>,
    Json(dto): Json<UpdateLabelDto>,
) -> Result<Json<Value>, AppError> {
    dto.validate().map_err(|e| AppError::Validation(e.to_string()))?;
    require_manage(&state.db, user.id, id).await?;
    let color = match dto.color.as_deref() {
        Some(c) => Some(normalized_color(Some(c))?),
        None => None,
    };

    let label = sqlx::query_as::<_, Label>(
        r#"UPDATE core.labels
           SET name        = COALESCE($2, name),
               color       = COALESCE($3, color),
               description = COALESCE($4, description)
           WHERE id = $1
           RETURNING id, owner_id, name, color, description, created_at, updated_at"#,
    )
    .bind(id)
    .bind(dto.name.as_deref().map(str::trim))
    .bind(color.as_deref())
    .bind(dto.description.as_deref())
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Étiquette introuvable".into()))?;

    Ok(Json(json!({ "label": label })))
}

/// DELETE /api/v1/labels/:id — links and shares go with it (ON DELETE CASCADE).
/// A co-manager may delete: full co-ownership, so this wipes the label for
/// EVERYONE, including the links of the other members.
pub async fn delete(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<Value>, AppError> {
    require_manage(&state.db, user.id, id).await?;
    sqlx::query("DELETE FROM core.labels WHERE id = $1")
        .bind(id)
        .execute(&state.db)
        .await?;
    Ok(Json(json!({ "ok": true })))
}

#[derive(Debug, Deserialize)]
pub struct ResourceQuery {
    pub resource_type: String,
    pub resource_id:   String,
}

/// GET /api/v1/labels/resource?resource_type=&resource_id= — the label ids of
/// one element (the picker's initial state).
pub async fn labels_for_resource(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
    Query(q): Query<ResourceQuery>,
) -> Result<Json<Value>, AppError> {
    let ids = sqlx::query_scalar::<_, Uuid>(
        r#"SELECT label_id FROM core.label_links
           WHERE owner_id = $1 AND resource_type = $2 AND resource_id = $3"#,
    )
    .bind(user.id)
    .bind(&q.resource_type)
    .bind(&q.resource_id)
    .fetch_all(&state.db)
    .await?;
    Ok(Json(json!({ "label_ids": ids })))
}

/// PUT /api/v1/labels/resource — replaces the label set of one element in a
/// single atomic call (what the picker saves).
pub async fn set_resource_labels(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
    Json(dto): Json<SetResourceLabelsDto>,
) -> Result<Json<Value>, AppError> {
    dto.validate().map_err(|e| AppError::Validation(e.to_string()))?;

    let mut tx = state.db.begin().await?;

    // Any label the caller may see can be linked — their own, and those shared
    // with them (a share is a shared vocabulary, so plain recipients may label
    // their own elements too). The links themselves stay owned by the caller.
    let owned: Vec<Uuid> = sqlx::query_scalar::<_, Uuid>(
        "SELECT label_id FROM core.label_access($1) WHERE label_id = ANY($2)",
    )
    .bind(user.id)
    .bind(&dto.label_ids)
    .fetch_all(&mut *tx)
    .await?;

    sqlx::query(
        r#"DELETE FROM core.label_links
           WHERE owner_id = $1 AND resource_type = $2 AND resource_id = $3
             AND label_id <> ALL($4)"#,
    )
    .bind(user.id)
    .bind(&dto.resource_type)
    .bind(&dto.resource_id)
    .bind(&owned)
    .execute(&mut *tx)
    .await?;

    for label_id in &owned {
        sqlx::query(
            r#"INSERT INTO core.label_links
                 (label_id, owner_id, module, resource_type, resource_id, title, href, envelope)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
               ON CONFLICT (label_id, resource_type, resource_id)
               DO UPDATE SET title = EXCLUDED.title, href = EXCLUDED.href,
                             envelope = EXCLUDED.envelope"#,
        )
        .bind(label_id)
        .bind(user.id)
        .bind(&dto.module)
        .bind(&dto.resource_type)
        .bind(&dto.resource_id)
        .bind(dto.title.as_deref())
        .bind(dto.href.as_deref())
        .bind(&dto.envelope)
        .execute(&mut *tx)
        .await?;
    }

    tx.commit().await?;
    Ok(Json(json!({ "ok": true, "linked": owned.len() })))
}

#[derive(Debug, Deserialize)]
pub struct BrowseQuery {
    /// Comma-separated label ids — an element must carry ALL of them.
    pub labels: Option<String>,
    /// Free-text search over the link titles (trigram-indexed).
    pub q:      Option<String>,
    /// Restrict to one module.
    pub module: Option<String>,
}

/// GET /api/v1/labels/browse — cross-module search & filter through labels.
/// Returns one entry per element, with the ids of ALL its labels.
pub async fn browse(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
    Query(q): Query<BrowseQuery>,
) -> Result<Json<Value>, AppError> {
    let wanted: Vec<Uuid> = q
        .labels
        .as_deref()
        .unwrap_or("")
        .split(',')
        .filter_map(|s| Uuid::parse_str(s.trim()).ok())
        .collect();
    let text = q.q.as_deref().map(str::trim).filter(|s| !s.is_empty());

    // One row per element: aggregate its label ids, keep the newest snapshot.
    // Visibility: the caller's own links always, plus everyone's links on the
    // labels they co-manage (`can_manage`) — a plain share stays private.
    // `other_owners` names the members who labelled an element that is not the
    // caller's, so the browser can attribute it.
    let rows = sqlx::query_as::<_, (String, String, String, Option<String>, Option<String>, Option<Value>, Vec<Uuid>, Option<Vec<String>>)>(
        r#"SELECT k.module, k.resource_type, k.resource_id,
                  MAX(k.title) AS title, MAX(k.href) AS href,
                  (ARRAY_AGG(k.envelope ORDER BY k.created_at DESC))[1] AS envelope,
                  ARRAY_AGG(DISTINCT k.label_id) AS label_ids,
                  ARRAY_AGG(DISTINCT COALESCE(u.display_name, u.username))
                      FILTER (WHERE k.owner_id <> $1) AS other_owners
           FROM core.label_links k
           JOIN core.label_access($1) a ON a.label_id = k.label_id
           JOIN core.users u ON u.id = k.owner_id
           WHERE (k.owner_id = $1 OR a.can_manage)
             AND ($2 = '' OR k.module = $2)
             AND ($3 = '' OR k.title ILIKE '%' || $3 || '%')
           GROUP BY k.module, k.resource_type, k.resource_id
           HAVING $4 = 0 OR COUNT(DISTINCT k.label_id) FILTER (WHERE k.label_id = ANY($5)) = $4
           ORDER BY MAX(k.created_at) DESC
           LIMIT 500"#,
    )
    .bind(user.id)
    .bind(q.module.as_deref().unwrap_or(""))
    .bind(text.unwrap_or(""))
    .bind(wanted.len() as i64)
    .bind(&wanted)
    .fetch_all(&state.db)
    .await?;

    let items: Vec<Value> = rows
        .into_iter()
        .map(|(module, resource_type, resource_id, title, href, envelope, label_ids, other_owners)| {
            json!({
                "module": module, "resource_type": resource_type, "resource_id": resource_id,
                "title": title, "href": href, "envelope": envelope, "label_ids": label_ids,
                "other_owners": other_owners.unwrap_or_default(),
            })
        })
        .collect();
    Ok(Json(json!({ "items": items })))
}

/// GET /api/v1/labels/:id/links — the raw links of one label, under the same
/// visibility rule as `browse`.
pub async fn list_links(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<Value>, AppError> {
    if access(&state.db, user.id, id).await?.is_none() {
        return Err(AppError::NotFound("Étiquette introuvable".into()));
    }
    let links = sqlx::query_as::<_, LabelLink>(
        r#"SELECT k.id, k.label_id, k.module, k.resource_type, k.resource_id,
                  k.title, k.href, k.envelope, k.created_at
           FROM core.label_links k
           JOIN core.label_access($2) a ON a.label_id = k.label_id
           WHERE k.label_id = $1 AND (k.owner_id = $2 OR a.can_manage)
           ORDER BY k.created_at DESC"#,
    )
    .bind(id)
    .bind(user.id)
    .fetch_all(&state.db)
    .await?;
    Ok(Json(json!({ "links": links })))
}

/// DELETE /api/v1/labels/:id/links/:link_id — detach one element. The caller
/// detaches their own links; a co-manager may detach anyone's.
pub async fn remove_link(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
    Path((id, link_id)): Path<(Uuid, Uuid)>,
) -> Result<Json<Value>, AppError> {
    let can_manage = matches!(access(&state.db, user.id, id).await?, Some((_, true)));
    let res = sqlx::query(
        r#"DELETE FROM core.label_links
           WHERE id = $1 AND label_id = $2 AND (owner_id = $3 OR $4)"#,
    )
    .bind(link_id)
    .bind(id)
    .bind(user.id)
    .bind(can_manage)
    .execute(&state.db)
    .await?;
    if res.rows_affected() == 0 {
        return Err(AppError::NotFound("Lien introuvable".into()));
    }
    Ok(Json(json!({ "ok": true })))
}

/// GET /api/v1/labels/:id/shares — the audience of a label (managers only).
pub async fn list_shares(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
    Path(id): Path<Uuid>,
) -> Result<Json<Value>, AppError> {
    require_manage(&state.db, user.id, id).await?;

    let rows = sqlx::query_as::<_, (Uuid, Option<Uuid>, Option<Uuid>, bool, Option<String>, Option<String>)>(
        r#"SELECT s.id, s.user_id, s.group_id, s.can_manage,
                  COALESCE(u.display_name, u.username) AS user_name,
                  g.name AS group_name
           FROM core.label_shares s
           LEFT JOIN core.users u       ON u.id = s.user_id
           LEFT JOIN core.user_groups g ON g.id = s.group_id
           WHERE s.label_id = $1
           ORDER BY g.name NULLS LAST, COALESCE(u.display_name, u.username)"#,
    )
    .bind(id)
    .fetch_all(&state.db)
    .await?;

    let shares: Vec<Value> = rows
        .into_iter()
        .map(|(sid, user_id, group_id, can_manage, user_name, group_name)| {
            json!({
                "id": sid, "user_id": user_id, "group_id": group_id, "can_manage": can_manage,
                "name": user_name.or(group_name).unwrap_or_default(),
                "kind": if group_id.is_some() { "group" } else { "user" },
            })
        })
        .collect();
    Ok(Json(json!({ "shares": shares })))
}

/// PUT /api/v1/labels/:id/shares — replaces the whole audience atomically
/// (managers only). Sharing back to the owner is a no-op and is dropped.
pub async fn set_shares(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
    Path(id): Path<Uuid>,
    Json(dto): Json<SetLabelSharesDto>,
) -> Result<Json<Value>, AppError> {
    dto.validate().map_err(|e| AppError::Validation(e.to_string()))?;
    require_manage(&state.db, user.id, id).await?;

    let owner_id = sqlx::query_scalar::<_, Uuid>("SELECT owner_id FROM core.labels WHERE id = $1")
        .bind(id)
        .fetch_optional(&state.db)
        .await?
        .ok_or_else(|| AppError::NotFound("Étiquette introuvable".into()))?;

    for s in &dto.shares {
        if s.user_id.is_some() == s.group_id.is_some() {
            return Err(AppError::Validation(
                "Chaque partage vise soit un utilisateur, soit un groupe".into(),
            ));
        }
    }

    let mut tx = state.db.begin().await?;
    sqlx::query("DELETE FROM core.label_shares WHERE label_id = $1")
        .bind(id)
        .execute(&mut *tx)
        .await?;

    let mut kept = 0usize;
    for s in &dto.shares {
        if s.user_id == Some(owner_id) {
            continue; // the owner already has full rights
        }
        // Unknown users/groups are rejected by the FKs — surface a clean 422.
        sqlx::query(
            r#"INSERT INTO core.label_shares (label_id, user_id, group_id, can_manage, created_by)
               VALUES ($1, $2, $3, $4, $5)
               ON CONFLICT DO NOTHING"#,
        )
        .bind(id)
        .bind(s.user_id)
        .bind(s.group_id)
        .bind(s.can_manage)
        .bind(user.id)
        .execute(&mut *tx)
        .await
        .map_err(|e| {
            tracing::error!(label_id = %id, error = %e, "insertion d'un partage d'étiquette");
            AppError::Validation("Destinataire inconnu".into())
        })?;
        kept += 1;
    }

    tx.commit().await?;
    Ok(Json(json!({ "ok": true, "shares": kept })))
}

#[derive(Debug, Deserialize)]
pub struct ShareTargetsQuery {
    pub q: Option<String>,
}

/// GET /api/v1/labels/share-targets?q= — users and groups the share picker can
/// offer. Public fields only (no email), like `/users/search`.
pub async fn share_targets(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
    Query(q): Query<ShareTargetsQuery>,
) -> Result<Json<Value>, AppError> {
    let text = q.q.as_deref().map(str::trim).unwrap_or("");

    let users = sqlx::query_as::<_, (Uuid, String, Option<String>)>(
        r#"SELECT id, COALESCE(display_name, username), avatar_url
           FROM core.users
           WHERE is_active = TRUE AND id <> $1
             AND ($2 = '' OR username ILIKE '%' || $2 || '%'
                          OR display_name ILIKE '%' || $2 || '%')
           ORDER BY COALESCE(display_name, username)
           LIMIT 25"#,
    )
    .bind(user.id)
    .bind(text)
    .fetch_all(&state.db)
    .await?;

    let groups = sqlx::query_as::<_, (Uuid, String, i64)>(
        r#"SELECT g.id, g.name, COUNT(m.user_id)
           FROM core.user_groups g
           LEFT JOIN core.user_group_members m ON m.group_id = g.id
           WHERE ($1 = '' OR g.name ILIKE '%' || $1 || '%')
           GROUP BY g.id
           ORDER BY g.name
           LIMIT 25"#,
    )
    .bind(text)
    .fetch_all(&state.db)
    .await?;

    Ok(Json(json!({
        "users": users.into_iter()
            .map(|(id, name, avatar_url)| json!({ "id": id, "name": name, "avatar_url": avatar_url }))
            .collect::<Vec<_>>(),
        "groups": groups.into_iter()
            .map(|(id, name, members)| json!({ "id": id, "name": name, "member_count": members }))
            .collect::<Vec<_>>(),
    })))
}
