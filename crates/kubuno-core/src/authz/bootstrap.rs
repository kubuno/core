//! Keeping `users.role = 'admin'` and the super-administrator assignment in step.
//!
//! Since migration `000044`, what an administrator may do comes from a role
//! ASSIGNMENT; `core.users.role` is only a denormalised cache of "holds an
//! instance-scoped superuser role", kept because the module proxy forwards it
//! and the frontend reads it. The console derives every one of its entries from
//! the assignment, never from the cache.
//!
//! That left the very first administrator with nothing. The migration's backfill
//! granted the assignment to the accounts existing WHEN IT RAN, and on a fresh
//! installation there are none: the administrator is created afterwards, by the
//! installation wizard or by the headless seed, both of which wrote the cache
//! alone. The result was an account flagged administrator, admitted to the
//! console, and holding zero privileges — a console showing only the handful of
//! pages that require none, and a 403 on everything else.
//!
//! Two answers, both here: [`grant_instance_superadmin`] for the accounts being
//! created, and [`reconcile_superadmins`] at every start for those already out
//! there, whose instance cannot be repaired by a migration that has already run.

use sqlx::PgPool;
use uuid::Uuid;

/// Grants the instance-scoped super-administrator role. Idempotent.
///
/// Returns whether an assignment was actually created, so a caller can say so.
pub async fn grant_instance_superadmin(db: &PgPool, user_id: Uuid) -> Result<bool, sqlx::Error> {
    let created = sqlx::query(
        "INSERT INTO core.role_assignments (role_id, subject_user_id, scope) \
         SELECT r.id, $1, 'instance' FROM core.roles r WHERE r.slug = 'super-admin' \
         ON CONFLICT DO NOTHING",
    )
    .bind(user_id)
    .execute(db)
    .await?
    .rows_affected()
        > 0;

    if created {
        super::cache::invalidate_all();
    }
    Ok(created)
}

/// Grants the assignment to every active account flagged `role = 'admin'` that
/// holds no superuser role at all.
///
/// Runs at every start, and does nothing on an instance that is already
/// coherent — which is every instance but the ones installed while the gap was
/// open. It only ever ADDS what the flag already claims: an account reaches
/// `role = 'admin'` through a path that demands super-administration to begin
/// with, so this widens no door. Accounts holding it through a group are left
/// alone: `core.superadmin_ids()` already counts them.
pub async fn reconcile_superadmins(db: &PgPool) -> Result<u64, sqlx::Error> {
    let n = sqlx::query(
        "INSERT INTO core.role_assignments (role_id, subject_user_id, scope) \
         SELECT r.id, u.id, 'instance' \
           FROM core.users u, core.roles r \
          WHERE u.role = 'admin' AND u.is_active \
            AND r.slug = 'super-admin' \
            AND u.id NOT IN (SELECT user_id FROM core.superadmin_ids()) \
         ON CONFLICT DO NOTHING",
    )
    .execute(db)
    .await?
    .rows_affected();

    if n > 0 {
        super::cache::invalidate_all();
        tracing::warn!(
            comptes = n,
            "Administrateur(s) sans attribution de rôle : super-administration instance rétablie \
             (compte créé par l'assistant d'installation ou le semis avant le correctif — la \
              console n'affichait alors qu'une poignée de pages)"
        );
    }
    Ok(n)
}
