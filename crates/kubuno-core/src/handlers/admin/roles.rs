//! Roles, assignments and the privilege catalogue.
//!
//! Two objects, deliberately kept apart (see [`crate::authz`]): a **role** is a
//! named bag of privileges, an **assignment** binds a subject to a role over a
//! scope. Everything here is audited, and every write invalidates the resolution
//! cache — a revoked privilege that keeps working for a minute is a revocation
//! that did not happen.
//!
//! ## Who may do what here
//!
//! Defining roles is **superuser-only** (guard 1): whoever can write a role can
//! write themselves a role, so no amount of per-privilege gating makes role
//! editing safely delegable. Granting an existing role needs
//! `core.roles.manage` *and* passes guard 2 — you cannot hand out what you do
//! not hold, nor over a scope wider than your own.

use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    Json,
};
use serde::Deserialize;
use serde_json::{json, Value};
use uuid::Uuid;

use crate::{
    audit::{redact::target, AdminAudit, AuditEntry},
    authz::{
        cache,
        guards::{self, ensure_can_grant, ensure_role_management, ensure_scopable},
        keys,
        model::{parse_key, AssignmentScope, AssignmentRow, Privilege, Role},
        AdminCtx,
    },
    errors::AppError,
    state::AppState,
};

/// Snapshot of a role for the trail: the definition **and** its privilege set,
/// because "the role was widened" is the change worth reading.
fn role_snapshot(role: &Role, privileges: &[String]) -> Value {
    crate::audit::redact::snapshot(
        target::ROLE,
        &json!({
            "id":           role.id,
            "slug":         role.slug,
            "name":         role.name,
            "description":  role.description,
            "is_system":    role.is_system,
            "is_superuser": role.is_superuser,
            "privileges":   privileges,
        }),
    )
}

async fn privileges_of(
    conn: &mut sqlx::PgConnection,
    role_id: Uuid,
) -> Result<Vec<String>, AppError> {
    sqlx::query_scalar(
        "SELECT privilege_key FROM core.role_privileges WHERE role_id = $1 ORDER BY privilege_key",
    )
    .bind(role_id)
    .fetch_all(&mut *conn)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, role_id = %role_id, "roles: lecture des privilèges");
        AppError::Database(e)
    })
}

// ── Catalogue ─────────────────────────────────────────────────────────────────

/// `GET /admin/privileges` — the catalogue, orphans included and flagged.
pub async fn list_privileges(
    State(state): State<AppState>,
    ctx: AdminCtx,
) -> Result<Json<Value>, AppError> {
    ctx.require(keys::ROLES_READ)?;

    let privileges = sqlx::query_as::<_, Privilege>(
        "SELECT key, namespace, domain, verb, label, description, is_ou_scopable, is_orphan \
         FROM core.privileges ORDER BY namespace, domain, verb",
    )
    .fetch_all(&state.db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, "list_privileges");
        AppError::Database(e)
    })?;

    Ok(Json(json!({ "privileges": privileges })))
}

// ── Roles ─────────────────────────────────────────────────────────────────────

/// `GET /admin/roles`
pub async fn list_roles(
    State(state): State<AppState>,
    ctx: AdminCtx,
) -> Result<Json<Value>, AppError> {
    ctx.require(keys::ROLES_READ)?;

    let roles = sqlx::query_as::<_, Role>(
        "SELECT id, slug, name, description, is_system, is_superuser, created_at, updated_at \
         FROM core.roles ORDER BY is_superuser DESC, is_system DESC, name",
    )
    .fetch_all(&state.db)
    .await
    .map_err(|e| { tracing::error!(error = %e, "list_roles"); AppError::Database(e) })?;

    // Privileges and assignment counts in two set-based queries rather than one
    // per role: the console lists every role on one screen.
    let pairs: Vec<(Uuid, String)> = sqlx::query_as(
        "SELECT role_id, privilege_key FROM core.role_privileges ORDER BY privilege_key",
    )
    .fetch_all(&state.db)
    .await
    .map_err(|e| { tracing::error!(error = %e, "list_roles: privilèges"); AppError::Database(e) })?;

    let counts: Vec<(Uuid, i64)> = sqlx::query_as(
        "SELECT role_id, COUNT(*)::bigint FROM core.role_assignments \
         WHERE expires_at IS NULL OR expires_at > NOW() GROUP BY role_id",
    )
    .fetch_all(&state.db)
    .await
    .map_err(|e| { tracing::error!(error = %e, "list_roles: affectations"); AppError::Database(e) })?;

    // A role is delegable to an organisational unit only when *every* one of its
    // privileges is scopable — surfaced here so the console can say so before
    // the operator discovers it on a refusal.
    let non_scopable: Vec<(Uuid, i64)> = sqlx::query_as(
        "SELECT rp.role_id, COUNT(*)::bigint \
           FROM core.role_privileges rp \
           JOIN core.privileges p ON p.key = rp.privilege_key \
          WHERE NOT p.is_ou_scopable GROUP BY rp.role_id",
    )
    .fetch_all(&state.db)
    .await
    .map_err(|e| { tracing::error!(error = %e, "list_roles: restreignabilité"); AppError::Database(e) })?;

    let out: Vec<Value> = roles
        .iter()
        .map(|r| {
            let privileges: Vec<&str> = pairs
                .iter()
                .filter(|(id, _)| *id == r.id)
                .map(|(_, k)| k.as_str())
                .collect();
            let assignments = counts.iter().find(|(id, _)| *id == r.id).map(|(_, c)| *c).unwrap_or(0);
            let blocked = non_scopable.iter().any(|(id, c)| *id == r.id && *c > 0);
            json!({
                "id":               r.id,
                "slug":             r.slug,
                "name":             r.name,
                "description":      r.description,
                "is_system":        r.is_system,
                "is_superuser":     r.is_superuser,
                "privileges":       privileges,
                "assignment_count": assignments,
                // Superuser roles are never delegable to a subtree.
                "ou_delegable":     !blocked && !r.is_superuser,
                "created_at":       r.created_at,
                "updated_at":       r.updated_at,
            })
        })
        .collect();

    Ok(Json(json!({ "roles": out })))
}

#[derive(Deserialize)]
pub struct CreateRoleDto {
    pub slug: String,
    pub name: String,
    pub description: Option<String>,
    #[serde(default)]
    pub privileges: Vec<String>,
}

/// Slug shape: what appears in URLs and in the trail.
fn validate_slug(slug: &str) -> Result<(), AppError> {
    if slug.len() < 2 || slug.len() > 100 {
        return Err(AppError::Validation("Identifiant : 2 à 100 caractères".into()));
    }
    if !slug
        .chars()
        .all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '-')
    {
        return Err(AppError::Validation(
            "Identifiant : minuscules, chiffres et tirets uniquement".into(),
        ));
    }
    Ok(())
}

/// Checks that every key exists in the catalogue. An unknown key would be
/// rejected by the foreign key anyway; catching it here turns a 500 into a
/// message naming the offender.
async fn validate_privileges(
    conn: &mut sqlx::PgConnection,
    keys_in: &[String],
) -> Result<(), AppError> {
    for key in keys_in {
        parse_key(key)?;
    }
    if keys_in.is_empty() {
        return Ok(());
    }
    let known: Vec<String> = sqlx::query_scalar(
        "SELECT key FROM core.privileges WHERE key = ANY($1)",
    )
    .bind(keys_in)
    .fetch_all(&mut *conn)
    .await
    .map_err(|e| { tracing::error!(error = %e, "roles: validation des privilèges"); AppError::Database(e) })?;

    let unknown: Vec<&String> = keys_in.iter().filter(|k| !known.contains(k)).collect();
    if !unknown.is_empty() {
        return Err(AppError::Validation(format!(
            "Privilège(s) inconnu(s) du catalogue : {}",
            unknown
                .iter()
                .map(|k| k.as_str())
                .collect::<Vec<_>>()
                .join(", ")
        )));
    }
    Ok(())
}

/// `POST /admin/roles` — superuser only (guard 1).
pub async fn create_role(
    State(state): State<AppState>,
    ctx: AdminCtx,
    audit: AdminAudit,
    Json(dto): Json<CreateRoleDto>,
) -> Result<impl axum::response::IntoResponse, AppError> {
    ensure_role_management(&ctx)?;
    validate_slug(&dto.slug)?;
    if dto.name.trim().is_empty() {
        return Err(AppError::Validation("Nom requis".into()));
    }

    let mut tx = audit.begin(&state.db).await?;
    validate_privileges(&mut tx, &dto.privileges).await?;

    let role = sqlx::query_as::<_, Role>(
        "INSERT INTO core.roles (slug, name, description) VALUES ($1, $2, $3) \
         RETURNING id, slug, name, description, is_system, is_superuser, created_at, updated_at",
    )
    .bind(&dto.slug)
    .bind(dto.name.trim())
    .bind(dto.description.as_deref())
    .fetch_one(&mut *tx)
    .await
    .map_err(|e| {
        if e.to_string().contains("unique") {
            AppError::Conflict(format!("Un rôle « {} » existe déjà", dto.slug))
        } else {
            tracing::error!(error = %e, "create_role");
            AppError::Database(e)
        }
    })?;

    for key in &dto.privileges {
        sqlx::query("INSERT INTO core.role_privileges (role_id, privilege_key) VALUES ($1, $2)")
            .bind(role.id)
            .bind(key)
            .execute(&mut *tx)
            .await
            .map_err(|e| { tracing::error!(error = %e, key = %key, "create_role: privilège"); AppError::Database(e) })?;
    }

    tx.commit(
        AuditEntry::new("core.roles.create")
            .target(target::ROLE, role.id, role.name.clone())
            .after(role_snapshot(&role, &dto.privileges))
            .reversible(),
    )
    .await?;

    cache::invalidate_all();
    Ok((StatusCode::CREATED, Json(json!({ "role": role, "privileges": dto.privileges }))))
}

#[derive(Deserialize)]
pub struct UpdateRoleDto {
    pub name: Option<String>,
    pub description: Option<String>,
    /// Full replacement of the privilege set when present.
    pub privileges: Option<Vec<String>>,
}

/// `PATCH /admin/roles/:id` — superuser only (guard 1).
pub async fn update_role(
    State(state): State<AppState>,
    ctx: AdminCtx,
    audit: AdminAudit,
    Path(role_id): Path<Uuid>,
    Json(dto): Json<UpdateRoleDto>,
) -> Result<Json<Value>, AppError> {
    ensure_role_management(&ctx)?;

    let mut tx = audit.begin(&state.db).await?;

    let previous = sqlx::query_as::<_, Role>(
        "SELECT id, slug, name, description, is_system, is_superuser, created_at, updated_at \
         FROM core.roles WHERE id = $1 FOR UPDATE",
    )
    .bind(role_id)
    .fetch_optional(&mut *tx)
    .await
    .map_err(|e| { tracing::error!(error = %e, "update_role: lecture"); AppError::Database(e) })?
    .ok_or_else(|| AppError::NotFound(format!("Rôle {role_id}")))?;

    let before_privileges = privileges_of(&mut tx, role_id).await?;

    // A system role's privilege set is frozen: the four seeded roles are what
    // the escalation guards and the documentation reason about, and silently
    // redefining "administrateur en lecture seule" to include
    // `core.settings.manage` is a rename attack, not a configuration change.
    if previous.is_system && dto.privileges.is_some() {
        let name = previous.name.clone();
        return Err(tx
            .abort(
                &state.db,
                AuditEntry::new("core.roles.update")
                    .target(target::ROLE, role_id, name)
                    .before(role_snapshot(&previous, &before_privileges)),
                AppError::Validation(
                    "Les privilèges d'un rôle système ne sont pas modifiables".into(),
                ),
            )
            .await);
    }

    if let Some(privileges) = dto.privileges.as_ref() {
        validate_privileges(&mut tx, privileges).await?;
    }

    let role = sqlx::query_as::<_, Role>(
        "UPDATE core.roles SET name = COALESCE($1, name), \
                description = CASE WHEN $2::text IS NOT NULL THEN $2 ELSE description END \
         WHERE id = $3 \
         RETURNING id, slug, name, description, is_system, is_superuser, created_at, updated_at",
    )
    .bind(dto.name.as_deref().map(str::trim).filter(|s| !s.is_empty()))
    .bind(dto.description.as_deref())
    .bind(role_id)
    .fetch_one(&mut *tx)
    .await
    .map_err(|e| { tracing::error!(error = %e, "update_role: écriture"); AppError::Database(e) })?;

    if let Some(privileges) = dto.privileges.as_ref() {
        sqlx::query("DELETE FROM core.role_privileges WHERE role_id = $1")
            .bind(role_id)
            .execute(&mut *tx)
            .await
            .map_err(|e| { tracing::error!(error = %e, "update_role: purge"); AppError::Database(e) })?;
        for key in privileges {
            sqlx::query("INSERT INTO core.role_privileges (role_id, privilege_key) VALUES ($1, $2)")
                .bind(role_id)
                .bind(key)
                .execute(&mut *tx)
                .await
                .map_err(|e| { tracing::error!(error = %e, key = %key, "update_role: privilège"); AppError::Database(e) })?;
        }

        // Widening a role can make an existing org-unit-scoped assignment carry a
        // non-scopable privilege — the exact situation the scopability rule
        // exists to prevent, arrived at by the back door. Refuse the edit rather
        // than leave the instance in a state the rule says is impossible.
        let broken: i64 = sqlx::query_scalar(
            "SELECT COUNT(*)::bigint \
               FROM core.role_assignments a \
              WHERE a.role_id = $1 AND a.scope = 'org_unit' \
                AND EXISTS (SELECT 1 FROM core.role_privileges rp \
                              JOIN core.privileges p ON p.key = rp.privilege_key \
                             WHERE rp.role_id = a.role_id AND NOT p.is_ou_scopable)",
        )
        .bind(role_id)
        .fetch_one(&mut *tx)
        .await
        .map_err(|e| { tracing::error!(error = %e, "update_role: contrôle des affectations"); AppError::Database(e) })?;

        if broken > 0 {
            let name = role.name.clone();
            return Err(tx
                .abort(
                    &state.db,
                    AuditEntry::new("core.roles.update")
                        .target(target::ROLE, role_id, name)
                        .before(role_snapshot(&previous, &before_privileges)),
                    AppError::Validation(format!(
                        "Modification refusée : {broken} affectation(s) de ce rôle sont restreintes \
                         à une unité organisationnelle, et le nouvel ensemble contient un privilège \
                         non restreignable."
                    )),
                )
                .await);
        }
    }

    let after_privileges = privileges_of(&mut tx, role_id).await?;

    tx.commit(
        AuditEntry::new("core.roles.update")
            .target(target::ROLE, role.id, role.name.clone())
            .before(role_snapshot(&previous, &before_privileges))
            .after(role_snapshot(&role, &after_privileges))
            .reversible(),
    )
    .await?;

    cache::invalidate_all();
    Ok(Json(json!({ "role": role, "privileges": after_privileges })))
}

/// `DELETE /admin/roles/:id` — superuser only, system roles protected.
pub async fn delete_role(
    State(state): State<AppState>,
    ctx: AdminCtx,
    audit: AdminAudit,
    Path(role_id): Path<Uuid>,
) -> Result<Json<Value>, AppError> {
    ensure_role_management(&ctx)?;

    let mut tx = audit.begin(&state.db).await?;

    let role = sqlx::query_as::<_, Role>(
        "SELECT id, slug, name, description, is_system, is_superuser, created_at, updated_at \
         FROM core.roles WHERE id = $1 FOR UPDATE",
    )
    .bind(role_id)
    .fetch_optional(&mut *tx)
    .await
    .map_err(|e| { tracing::error!(error = %e, "delete_role: lecture"); AppError::Database(e) })?
    .ok_or_else(|| AppError::NotFound(format!("Rôle {role_id}")))?;

    let privileges = privileges_of(&mut tx, role_id).await?;

    if role.is_system {
        let name = role.name.clone();
        return Err(tx
            .abort(
                &state.db,
                AuditEntry::new("core.roles.delete")
                    .target(target::ROLE, role_id, name)
                    .before(role_snapshot(&role, &privileges)),
                AppError::Forbidden,
            )
            .await);
    }

    sqlx::query("DELETE FROM core.roles WHERE id = $1")
        .bind(role_id)
        .execute(&mut *tx)
        .await
        .map_err(|e| { tracing::error!(error = %e, "delete_role"); AppError::Database(e) })?;

    // Deleting a role cascades to its assignments: guard 4 applies.
    guards::ensure_superadmin_remains(&mut tx).await?;

    tx.commit(
        AuditEntry::new("core.roles.delete")
            .target(target::ROLE, role_id, role.name.clone())
            .before(role_snapshot(&role, &privileges))
            .reversible(),
    )
    .await?;

    cache::invalidate_all();
    Ok(Json(json!({ "message": "Rôle supprimé" })))
}

// ── Assignments ───────────────────────────────────────────────────────────────

const ASSIGNMENT_SELECT: &str = r#"
    SELECT a.id, a.role_id, r.slug AS role_slug, r.name AS role_name,
           a.subject_user_id, a.subject_group_id,
           COALESCE(u.username || ' <' || u.email || '>', g.name) AS subject_label,
           a.scope, a.scope_org_unit_id, ou.name AS scope_org_unit_name,
           a.expires_at, a.created_at, a.created_by
      FROM core.role_assignments a
      JOIN core.roles r            ON r.id = a.role_id
      LEFT JOIN core.users u       ON u.id = a.subject_user_id
      LEFT JOIN core.user_groups g ON g.id = a.subject_group_id
      LEFT JOIN core.org_units ou  ON ou.id = a.scope_org_unit_id
"#;

#[derive(Deserialize)]
pub struct ListAssignmentsQuery {
    pub user_id: Option<Uuid>,
    pub group_id: Option<Uuid>,
    pub role_id: Option<Uuid>,
    /// Include assignments whose expiry has passed (default: hide them).
    #[serde(default)]
    pub include_expired: bool,
}

/// `GET /admin/role-assignments`
pub async fn list_assignments(
    State(state): State<AppState>,
    ctx: AdminCtx,
    Query(q): Query<ListAssignmentsQuery>,
) -> Result<Json<Value>, AppError> {
    ctx.require(keys::ROLES_READ)?;

    let sql = format!(
        "{ASSIGNMENT_SELECT} WHERE ($1::uuid IS NULL OR a.subject_user_id = $1) \
           AND ($2::uuid IS NULL OR a.subject_group_id = $2) \
           AND ($3::uuid IS NULL OR a.role_id = $3) \
           AND ($4 OR a.expires_at IS NULL OR a.expires_at > NOW()) \
         ORDER BY a.created_at DESC"
    );

    let rows = sqlx::query_as::<_, AssignmentRow>(&sql)
        .bind(q.user_id)
        .bind(q.group_id)
        .bind(q.role_id)
        .bind(q.include_expired)
        .fetch_all(&state.db)
        .await
        .map_err(|e| { tracing::error!(error = %e, "list_assignments"); AppError::Database(e) })?;

    Ok(Json(json!({ "assignments": rows })))
}

#[derive(Deserialize)]
pub struct CreateAssignmentDto {
    pub role_id: Uuid,
    /// Exactly one of the two.
    pub user_id: Option<Uuid>,
    pub group_id: Option<Uuid>,
    /// `"instance"` or `"org_unit"`.
    pub scope: String,
    pub org_unit_id: Option<Uuid>,
    /// Optional expiry, for a temporary delegation.
    pub expires_at: Option<chrono::DateTime<chrono::Utc>>,
}

fn assignment_snapshot(row: &AssignmentRow) -> Value {
    crate::audit::redact::snapshot(
        target::ROLE_ASSIGNMENT,
        &serde_json::to_value(row).unwrap_or(Value::Null),
    )
}

/// `POST /admin/role-assignments` — grants a role to a subject over a scope.
///
/// Runs, in order: the privilege check, the scopability rule, and guard 2.
pub async fn create_assignment(
    State(state): State<AppState>,
    ctx: AdminCtx,
    audit: AdminAudit,
    Json(dto): Json<CreateAssignmentDto>,
) -> Result<impl axum::response::IntoResponse, AppError> {
    ctx.require(keys::ROLES_MANAGE)?;

    let scope = AssignmentScope::parse(&dto.scope)?;
    match (dto.user_id, dto.group_id) {
        (Some(_), Some(_)) => {
            return Err(AppError::Validation(
                "Un sujet et un seul : utilisateur OU groupe".into(),
            ))
        }
        (None, None) => return Err(AppError::Validation("Sujet requis".into())),
        _ => {}
    }
    if scope == AssignmentScope::OrgUnit && dto.org_unit_id.is_none() {
        return Err(AppError::Validation(
            "Unité organisationnelle requise pour une portée « org_unit »".into(),
        ));
    }
    if let Some(expiry) = dto.expires_at {
        if expiry <= chrono::Utc::now() {
            return Err(AppError::Validation(
                "La date d'expiration doit être dans le futur".into(),
            ));
        }
    }

    let mut tx = audit.begin(&state.db).await?;

    // The rule that makes the scope a boundary, then the rule that keeps the
    // grantor from exceeding themselves. A refused grant is recorded like any
    // other refusal: an attempt to hand oneself power is the single most
    // interesting line in the trail, and rolling back silently would erase it.
    let refusal = |reason: &AppError| {
        AuditEntry::new("core.role_assignments.create")
            .target_kind(
                target::ROLE_ASSIGNMENT,
                format!("rôle {} → portée {}", dto.role_id, scope.as_str()),
            )
            .denied(reason.to_string())
    };
    if let Err(e) = ensure_scopable(&mut tx, dto.role_id, scope).await {
        return Err(tx.abort(&state.db, refusal(&e), e).await);
    }
    if let Err(e) = ensure_can_grant(&mut tx, &ctx, dto.role_id, scope, dto.org_unit_id).await {
        return Err(tx.abort(&state.db, refusal(&e), e).await);
    }

    let id: Uuid = sqlx::query_scalar(
        r#"INSERT INTO core.role_assignments
               (role_id, subject_user_id, subject_group_id, scope, scope_org_unit_id, expires_at, created_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id"#,
    )
    .bind(dto.role_id)
    .bind(dto.user_id)
    .bind(dto.group_id)
    .bind(scope.as_str())
    .bind(dto.org_unit_id)
    .bind(dto.expires_at)
    .bind(ctx.user_id)
    .fetch_one(&mut *tx)
    .await
    .map_err(|e| {
        if e.to_string().contains("uniq_core_assign") {
            AppError::Conflict("Cette affectation existe déjà".into())
        } else if e.to_string().contains("foreign key") {
            AppError::NotFound("Rôle, sujet ou unité introuvable".into())
        } else {
            tracing::error!(error = %e, "create_assignment");
            AppError::Database(e)
        }
    })?;

    let row = sqlx::query_as::<_, AssignmentRow>(&format!("{ASSIGNMENT_SELECT} WHERE a.id = $1"))
        .bind(id)
        .fetch_one(&mut *tx)
        .await
        .map_err(|e| { tracing::error!(error = %e, "create_assignment: relecture"); AppError::Database(e) })?;

    // Keep `core.users.role` in step when the grant makes someone a
    // super-administrator.
    if let Some(user_id) = dto.user_id {
        guards::sync_role_cache(&mut tx, user_id).await?;
    }

    let label = format!(
        "{} → {}",
        row.subject_label.as_deref().unwrap_or("?"),
        row.role_name
    );
    tx.commit(
        AuditEntry::new("core.role_assignments.create")
            .target(target::ROLE_ASSIGNMENT, id, label)
            .after(assignment_snapshot(&row))
            .reversible(),
    )
    .await?;

    cache::invalidate_all();

    // Published AFTER the commit, so the rule engine never reacts to a grant
    // that was rolled back. `internal`: the bus is a broadcast to every browser,
    // and who was just made an administrator is not everybody's business.
    state
        .events
        .publish_and_log_with(
            crate::events::AppEvent::Custom {
                event_type: crate::rules::declare::events::PRIVILEGE_GRANTED.into(),
                module_id: "core".into(),
                payload: json!({
                    "user_id":        row.subject_user_id,
                    "group_id":       row.subject_group_id,
                    "role_slug":      row.role_slug,
                    "role_name":      row.role_name,
                    "scope":          row.scope,
                    "org_unit_id":    row.scope_org_unit_id,
                    "granted_by":     ctx.user_id,
                    "assignment_id":  id,
                }),
            },
            crate::events::EventMeta::internal(),
            &state.db,
        )
        .await;

    Ok((StatusCode::CREATED, Json(json!({ "assignment": row }))))
}

/// `DELETE /admin/role-assignments/:id` — revokes a grant.
///
/// Symmetric with the grant: you may only take away what you could have given
/// (guard 2), and never the last super-administrator (guard 4).
pub async fn delete_assignment(
    State(state): State<AppState>,
    ctx: AdminCtx,
    audit: AdminAudit,
    Path(id): Path<Uuid>,
) -> Result<Json<Value>, AppError> {
    ctx.require(keys::ROLES_MANAGE)?;

    let mut tx = audit.begin(&state.db).await?;

    let row = sqlx::query_as::<_, AssignmentRow>(&format!(
        "{ASSIGNMENT_SELECT} WHERE a.id = $1"
    ))
    .bind(id)
    .fetch_optional(&mut *tx)
    .await
    .map_err(|e| { tracing::error!(error = %e, "delete_assignment: lecture"); AppError::Database(e) })?
    .ok_or_else(|| AppError::NotFound(format!("Affectation {id}")))?;

    let scope = AssignmentScope::parse(&row.scope)?;
    if let Err(e) =
        ensure_can_grant(&mut tx, &ctx, row.role_id, scope, row.scope_org_unit_id).await
    {
        let entry = AuditEntry::new("core.role_assignments.delete")
            .target(
                target::ROLE_ASSIGNMENT,
                id,
                row.subject_label.clone().unwrap_or_else(|| id.to_string()),
            )
            .before(assignment_snapshot(&row))
            .denied(e.to_string());
        return Err(tx.abort(&state.db, entry, e).await);
    }

    sqlx::query("DELETE FROM core.role_assignments WHERE id = $1")
        .bind(id)
        .execute(&mut *tx)
        .await
        .map_err(|e| { tracing::error!(error = %e, "delete_assignment"); AppError::Database(e) })?;

    // Evaluated on the post-state, inside the transaction: "would this leave
    // zero" is a question about what the instance looks like after the write.
    guards::ensure_superadmin_remains(&mut tx).await?;

    if let Some(user_id) = row.subject_user_id {
        guards::sync_role_cache(&mut tx, user_id).await?;
    }

    let label = format!(
        "{} → {}",
        row.subject_label.as_deref().unwrap_or("?"),
        row.role_name
    );
    tx.commit(
        AuditEntry::new("core.role_assignments.delete")
            .target(target::ROLE_ASSIGNMENT, id, label)
            .before(assignment_snapshot(&row))
            .reversible(),
    )
    .await?;

    cache::invalidate_all();
    Ok(Json(json!({ "message": "Affectation retirée" })))
}

/// `GET /admin/users/:id/privileges` — what one account effectively holds.
///
/// The question an operator actually asks ("why can this person do that?"), and
/// the one a flat list of assignments answers badly once groups and subtrees are
/// involved.
pub async fn user_effective_privileges(
    State(state): State<AppState>,
    ctx: AdminCtx,
    Path(user_id): Path<Uuid>,
) -> Result<Json<Value>, AppError> {
    ctx.require(keys::ROLES_READ)?;

    let resolved = crate::authz::context::resolve(
        &state.db,
        user_id,
        crate::audit::ActorOrigin::System,
        None,
    )
    .await?;

    // Same shape as the `privileges` block of `GET /api/v1/me`, so an operator
    // inspecting an account and that account inspecting itself cannot disagree.
    Ok(Json(json!(resolved.effective())))
}
