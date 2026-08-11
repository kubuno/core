//! The five guards without which delegation *is* privilege escalation.
//!
//! Each one closes a path that is obvious in hindsight and invisible in a code
//! review that only checks "does this handler require a privilege":
//!
//! 1. [`ensure_role_management`] — defining roles is a superuser act. Whoever
//!    can write a role can write themselves a role.
//! 2. [`ensure_can_grant`] — you cannot grant what you do not hold, nor over a
//!    scope wider than your own.
//! 3. [`ensure_can_act_on_user`] — you cannot touch an account that holds a role
//!    you do not hold **in full**. Without this, `core.users.update` over the
//!    root unit is a password reset on a super-administrator, which is a total
//!    takeover through a privilege that reads as mundane.
//! 4. [`ensure_superadmin_remains`] — the instance must keep at least one active
//!    super-administrator. An instance with none is unrecoverable without
//!    database surgery.
//! 5. [`AdminContext::require_superuser`] at the two call sites that execute
//!    arbitrary code: installing a module and trusting a theme.
//!
//! Guards 2 and 3 are scope-aware: "holding" a privilege means holding it over
//! the unit the target actually sits in, not merely somewhere.

use std::collections::HashSet;

use sqlx::{PgConnection, PgPool};
use uuid::Uuid;

use super::context::AdminContext;
use super::model::AssignmentScope;
use crate::errors::AppError;

/// Guard 1 — defining roles and their privilege sets is superuser-only.
pub fn ensure_role_management(ctx: &AdminContext) -> Result<(), AppError> {
    ctx.require_superuser("gestion des rôles")
}

/// The organisational unit an account sits in.
pub async fn user_org_unit(
    conn: &mut PgConnection,
    user_id: Uuid,
) -> Result<Option<Uuid>, AppError> {
    let unit: Option<Option<Uuid>> =
        sqlx::query_scalar("SELECT org_unit_id FROM core.users WHERE id = $1")
            .bind(user_id)
            .fetch_optional(&mut *conn)
            .await
            .map_err(|e| {
                tracing::error!(error = %e, user_id = %user_id, "authz: lecture de l'unité de la cible");
                AppError::Database(e)
            })?;
    Ok(unit.flatten())
}

/// Privileges carried by a role, and whether the role is a superuser role.
async fn role_contents(
    conn: &mut PgConnection,
    role_id: Uuid,
) -> Result<(bool, Vec<String>), AppError> {
    let is_superuser: Option<bool> =
        sqlx::query_scalar("SELECT is_superuser FROM core.roles WHERE id = $1")
            .bind(role_id)
            .fetch_optional(&mut *conn)
            .await
            .map_err(|e| {
                tracing::error!(error = %e, role_id = %role_id, "authz: lecture du rôle");
                AppError::Database(e)
            })?;
    let is_superuser =
        is_superuser.ok_or_else(|| AppError::NotFound(format!("Rôle {role_id}")))?;

    let keys: Vec<String> = sqlx::query_scalar(
        "SELECT privilege_key FROM core.role_privileges WHERE role_id = $1 ORDER BY privilege_key",
    )
    .bind(role_id)
    .fetch_all(&mut *conn)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, role_id = %role_id, "authz: lecture des privilèges du rôle");
        AppError::Database(e)
    })?;

    Ok((is_superuser, keys))
}

/// **The scopability rule.** An org-unit-scoped assignment is refused when its
/// role carries even one privilege that cannot be confined to a subtree.
///
/// This is what makes the scope a boundary rather than a label. A role mixing
/// `core.users.update` (scopable) with `core.settings.manage` (not) cannot be
/// "restricted to the Marketing unit": the settings privilege would still apply
/// to the whole instance, and the person granting it would believe otherwise.
pub async fn ensure_scopable(
    conn: &mut PgConnection,
    role_id: Uuid,
    scope: AssignmentScope,
) -> Result<(), AppError> {
    if scope != AssignmentScope::OrgUnit {
        return Ok(());
    }

    let (is_superuser, _) = role_contents(conn, role_id).await?;
    if is_superuser {
        return Err(AppError::Validation(
            "Un rôle super-utilisateur ne peut pas être restreint à une unité organisationnelle : \
             il détient tout, présent et futur."
                .into(),
        ));
    }

    let blocking: Vec<String> = sqlx::query_scalar(
        r#"SELECT p.key
             FROM core.role_privileges rp
             JOIN core.privileges p ON p.key = rp.privilege_key
            WHERE rp.role_id = $1 AND NOT p.is_ou_scopable
            ORDER BY p.key"#,
    )
    .bind(role_id)
    .fetch_all(&mut *conn)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, role_id = %role_id, "authz: contrôle de restreignabilité");
        AppError::Database(e)
    })?;

    if blocking.is_empty() {
        return Ok(());
    }

    Err(AppError::Validation(format!(
        "Affectation impossible à une unité organisationnelle : ce rôle contient {} privilège(s) \
         non restreignable(s) ({}). Une portée d'unité serait une illusion de sécurité.",
        blocking.len(),
        blocking.join(", ")
    )))
}

/// Guard 2 — you cannot grant a privilege you do not hold, nor over a scope
/// wider than the one you hold it at.
pub async fn ensure_can_grant(
    conn: &mut PgConnection,
    ctx: &AdminContext,
    role_id: Uuid,
    scope: AssignmentScope,
    unit: Option<Uuid>,
) -> Result<(), AppError> {
    if ctx.is_superuser {
        return Ok(());
    }

    let (is_superuser_role, keys) = role_contents(conn, role_id).await?;
    if is_superuser_role {
        tracing::warn!(
            actor = %ctx.user_id,
            role_id = %role_id,
            "Tentative d'octroi d'un rôle super-utilisateur par un non-super-utilisateur"
        );
        return Err(AppError::Forbidden);
    }

    // Granting over a subtree the caller does not administer is granting outside
    // one's own scope even when every privilege is held.
    if scope == AssignmentScope::OrgUnit {
        let Some(target_unit) = unit else {
            return Err(AppError::Validation("Unité organisationnelle requise".into()));
        };
        let covered = keys
            .iter()
            .all(|k| ctx.has_for_unit(k, Some(target_unit)));
        if !covered {
            tracing::warn!(
                actor = %ctx.user_id,
                role_id = %role_id,
                org_unit = %target_unit,
                "Octroi refusé : le rôle dépasse le périmètre de l'appelant"
            );
            return Err(AppError::Forbidden);
        }
        return Ok(());
    }

    // Instance scope demands the privilege at instance scope: an operator
    // confined to a unit must not be able to hand out instance-wide power.
    let missing: Vec<&String> = keys.iter().filter(|k| !ctx.has_at_instance(k)).collect();
    if !missing.is_empty() {
        tracing::warn!(
            actor = %ctx.user_id,
            role_id = %role_id,
            missing = ?missing,
            "Octroi refusé : privilèges non détenus à portée instance"
        );
        return Err(AppError::Forbidden);
    }
    Ok(())
}

/// Every role held by an account, directly or through a group, not expired.
async fn roles_held_by(
    conn: &mut PgConnection,
    user_id: Uuid,
) -> Result<(bool, HashSet<String>), AppError> {
    let rows: Vec<(bool, Option<String>)> = sqlx::query_as(
        r#"SELECT r.is_superuser, rp.privilege_key
             FROM core.role_assignments a
             JOIN core.roles r ON r.id = a.role_id
             LEFT JOIN core.role_privileges rp ON rp.role_id = r.id
            WHERE (a.expires_at IS NULL OR a.expires_at > NOW())
              AND (
                    a.subject_user_id = $1
                 OR a.subject_group_id IN (
                        SELECT m.group_id FROM core.user_group_members m WHERE m.user_id = $1
                    )
                  )"#,
    )
    .bind(user_id)
    .fetch_all(&mut *conn)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, user_id = %user_id, "authz: lecture des rôles de la cible");
        AppError::Database(e)
    })?;

    let mut superuser = false;
    let mut keys = HashSet::new();
    for (is_superuser, key) in rows {
        superuser |= is_superuser;
        if let Some(k) = key {
            keys.insert(k);
        }
    }
    Ok((superuser, keys))
}

/// Guard 3 — refuse to act on an account holding a role the caller does not
/// hold in full.
///
/// The attack this closes: an operator delegated `core.users.update` and
/// `core.user_password.execute` over the **root** unit holds them over every
/// account, including the super-administrators — and a password reset on a
/// super-administrator is a complete takeover through a privilege that looks
/// like account maintenance. The rule is not "do not touch admins", it is the
/// general form: whatever the target holds, the caller must hold too.
pub async fn ensure_can_act_on_user(
    conn: &mut PgConnection,
    ctx: &AdminContext,
    target_user_id: Uuid,
) -> Result<(), AppError> {
    if ctx.is_superuser {
        return Ok(());
    }
    // Acting on oneself is always within one's own perimeter by construction,
    // and refusing it would lock an operator out of their own account page.
    if ctx.user_id == target_user_id {
        return Ok(());
    }

    let (target_is_superuser, target_keys) = roles_held_by(conn, target_user_id).await?;

    if target_is_superuser {
        tracing::warn!(
            actor = %ctx.user_id,
            target = %target_user_id,
            "Action refusée : la cible détient un rôle super-utilisateur"
        );
        return Err(AppError::Forbidden);
    }

    let target_unit = user_org_unit(conn, target_user_id).await?;
    let missing: Vec<&String> = target_keys
        .iter()
        .filter(|k| !ctx.has_for_unit(k, target_unit))
        .collect();

    if !missing.is_empty() {
        tracing::warn!(
            actor = %ctx.user_id,
            target = %target_user_id,
            missing = ?missing,
            "Action refusée : la cible détient des privilèges que l'appelant ne détient pas"
        );
        return Err(AppError::Forbidden);
    }
    Ok(())
}

/// Number of active super-administrators, evaluated on the given connection —
/// so it can be called **inside** a transaction, after the mutation, and see its
/// effect.
pub async fn superadmin_count(conn: &mut PgConnection) -> Result<i64, AppError> {
    sqlx::query_scalar("SELECT COUNT(*)::bigint FROM core.superadmin_ids()")
        .fetch_one(&mut *conn)
        .await
        .map_err(|e| {
            tracing::error!(error = %e, "authz: comptage des super-administrateurs");
            AppError::Database(e)
        })
}

/// Guard 4 — refuse a mutation that would leave the instance with no active
/// super-administrator.
///
/// Called **after** the write, inside the same transaction: "would this leave
/// zero" is a question about the post-state, and predicting it from the
/// pre-state is where off-by-one mistakes live. The caller rolls back on `Err`.
pub async fn ensure_superadmin_remains(conn: &mut PgConnection) -> Result<(), AppError> {
    if superadmin_count(conn).await? > 0 {
        return Ok(());
    }
    tracing::warn!("Refus : l'opération retirerait le dernier super-administrateur de l'instance");
    Err(AppError::Validation(
        "Opération refusée : l'instance doit conserver au moins un super-administrateur actif.".into(),
    ))
}

/// Keeps `core.users.role` in step with "holds an instance-scoped superuser
/// role".
///
/// The column is **not** the source of truth any more, and its `CHECK` is
/// frozen — but the module proxy forwards it in `X-Kubuno-User-Role` and the
/// frontend reads it, so it is maintained as a denormalised cache of exactly one
/// fact. Delegated administrators keep `role = 'user'`: their power is scoped to
/// the core's console and does not travel to the modules.
pub async fn sync_role_cache(conn: &mut PgConnection, user_id: Uuid) -> Result<(), AppError> {
    sqlx::query(
        r#"UPDATE core.users u
              SET role = CASE
                             WHEN EXISTS (SELECT 1 FROM core.superadmin_ids() s WHERE s.user_id = u.id)
                                 THEN 'admin'
                             WHEN u.role = 'admin' THEN 'user'
                             ELSE u.role
                         END
            WHERE u.id = $1"#,
    )
    .bind(user_id)
    .execute(&mut *conn)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, user_id = %user_id, "authz: synchronisation du cache users.role");
        AppError::Database(e)
    })?;
    Ok(())
}

/// Grants (or revokes) the instance-scoped super-administrator assignment behind
/// a direct write to `core.users.role`.
///
/// The legacy `PATCH /admin/users/:id { role }` surface predates this model and
/// the console still uses it. Left alone it would create administrators with no
/// assignment — invisible to the whole delegation model, and to guard 4. So the
/// two representations are written together.
pub async fn apply_legacy_role_change(
    conn: &mut PgConnection,
    user_id: Uuid,
    new_role: &str,
    granted_by: Uuid,
) -> Result<(), AppError> {
    if new_role == "admin" {
        sqlx::query(
            r#"INSERT INTO core.role_assignments (role_id, subject_user_id, scope, created_by)
               SELECT r.id, $1, 'instance', $2 FROM core.roles r WHERE r.slug = 'super-admin'
               ON CONFLICT DO NOTHING"#,
        )
        .bind(user_id)
        .bind(granted_by)
        .execute(&mut *conn)
        .await
        .map_err(|e| {
            tracing::error!(error = %e, user_id = %user_id, "authz: octroi de l'affectation super-admin");
            AppError::Database(e)
        })?;
    } else {
        sqlx::query(
            r#"DELETE FROM core.role_assignments a
                USING core.roles r
                WHERE a.role_id = r.id
                  AND r.is_superuser
                  AND a.subject_user_id = $1
                  AND a.scope = 'instance'"#,
        )
        .bind(user_id)
        .execute(&mut *conn)
        .await
        .map_err(|e| {
            tracing::error!(error = %e, user_id = %user_id, "authz: retrait de l'affectation super-admin");
            AppError::Database(e)
        })?;
    }
    super::cache::invalidate_all();
    Ok(())
}

/// Convenience wrapper for callers holding a pool rather than a transaction.
pub async fn superadmin_count_pool(db: &PgPool) -> Result<i64, AppError> {
    let mut conn = db.acquire().await.map_err(|e| {
        tracing::error!(error = %e, "authz: acquisition d'une connexion");
        AppError::Database(e)
    })?;
    superadmin_count(&mut conn).await
}
