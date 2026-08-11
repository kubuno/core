use anyhow::{Context, Result};
use sqlx::PgPool;
use uuid::Uuid;

use crate::crypto::password::hash_password;

/// The organisation's root unit — the single row of `core.org_units` with no
/// parent.
///
/// It lives in this module because this module owns what an instance is
/// bootstrapped with, and the root unit is one of those things: seeded by
/// migration `000036`, recreated by `000107` if it ever went missing. The
/// account-creation paths whose caller names no unit (public sign-up, first SSO
/// sign-in, the seeded administrator) read it from here rather than each
/// carrying their own copy of the query.
///
/// ⚠️ `ORDER BY created_at, id` rather than a bare `SELECT`, deliberately.
/// Migration `000106` makes the root unique with an index; until it has run on
/// an older instance there may be more than one row with a NULL parent, and this
/// ordering names the exact row `000106` keeps as the real root. The answer is
/// therefore the same whichever migration ran first.
///
/// Never propagates a failure: an account must not be refused because the tree
/// could not be read. `None` leaves `org_unit_id` unset in the INSERT, and the
/// `users_place_in_tree` trigger (`000107`) places the account at the root
/// anyway — the invariant is enforced by the database, this function only makes
/// the intention visible at the call site and lets the quota resolve from the
/// right unit.
pub async fn root_org_unit<'e, E: sqlx::PgExecutor<'e>>(db: E) -> Option<Uuid> {
    match sqlx::query_scalar::<_, Uuid>(
        "SELECT id FROM core.org_units WHERE parent_id IS NULL ORDER BY created_at, id LIMIT 1",
    )
    .fetch_optional(db)
    .await
    {
        Ok(unit) => unit,
        Err(e) => {
            tracing::error!(error = %e, "Reading the root organisational unit failed");
            None
        }
    }
}

/// Password used when `KUBUNO_ADMIN_PASSWORD` is not provided. Accounts seeded
/// with it are flagged `must_change_password` so it cannot silently survive.
const DEFAULT_ADMIN_PASSWORD: &str = "kubuno";

/// Creates the default administrator account if it does not exist yet.
///
/// The credentials are configurable via environment variables (handy for Docker
/// / CI), falling back to the historical defaults `admin` / `kubuno`:
///   - `KUBUNO_ADMIN_USER`     (default: `admin`)
///   - `KUBUNO_ADMIN_PASSWORD` (default: `kubuno`)
///   - `KUBUNO_ADMIN_EMAIL`    (default: `admin@kubuno.local`)
///
/// When the password comes from the hard-coded default (nothing supplied by the
/// operator), the account is created with `must_change_password = TRUE`: the
/// frontend then forces a password change before anything else and the backend
/// refuses administrative writes until it is done. An operator who supplied
/// `KUBUNO_ADMIN_PASSWORD` chose their own secret and is left alone.
pub async fn ensure_default_admin(pool: &PgPool) -> Result<()> {
    let username = env_or("KUBUNO_ADMIN_USER", "admin");
    let (password, is_default_password) = match env_value("KUBUNO_ADMIN_PASSWORD") {
        Some(v) => (v, false),
        None => (DEFAULT_ADMIN_PASSWORD.to_string(), true),
    };
    let email = env_or("KUBUNO_ADMIN_EMAIL", "admin@kubuno.local");

    // Seed only when no admin exists yet, so a renamed/removed default admin is
    // not silently recreated on every boot.
    let exists: bool =
        sqlx::query_scalar("SELECT EXISTS(SELECT 1 FROM core.users WHERE role = 'admin')")
            .fetch_one(pool)
            .await
            .inspect_err(|e| {
                tracing::error!(error = %e, "Checking for an existing admin account failed");
            })
            .context("Checking for an existing admin account")?;

    if exists {
        warn_if_password_change_pending(pool).await;
        return Ok(());
    }

    let password_hash = hash_password(&password).context("Hashing the initial admin password")?;

    // The first administrator is placed in the tree like every other account.
    // Left unset it would land outside it, which is the one state migration
    // 000107 removes: an account with no unit is invisible to every DELEGATED
    // administrator (`handlers/admin/users.rs` filters by subtree) and skips the
    // whole org-unit segment of the settings chain. Stating it here rather than
    // relying on the trigger keeps the intention readable.
    let root_unit = root_org_unit(pool).await;

    sqlx::query(
        r#"
        INSERT INTO core.users
            (email, username, password_hash, display_name, role, email_verified, is_active,
             must_change_password, org_unit_id)
        VALUES
            ($1, $2, $3, 'Administrateur', 'admin', TRUE, TRUE, $4, $5)
        "#,
    )
    .bind(&email)
    .bind(&username)
    .bind(&password_hash)
    .bind(is_default_password)
    .bind(root_unit)
    .execute(pool)
    .await
    .inspect_err(|e| {
        tracing::error!(error = %e, "Creating the initial administrator account failed");
    })
    .context("Creating the initial administrator account")?;

    tracing::info!(username = %username, "Initial administrator account created");
    warn_if_password_change_pending(pool).await;
    Ok(())
}

/// Emits a loud warning at boot while at least one account still carries a
/// password it did not choose. The password itself is never logged.
async fn warn_if_password_change_pending(pool: &PgPool) {
    let pending: Result<Vec<String>, sqlx::Error> = sqlx::query_scalar(
        "SELECT username FROM core.users
         WHERE must_change_password = TRUE AND is_active = TRUE
         ORDER BY created_at ASC",
    )
    .fetch_all(pool)
    .await;

    match pending {
        Ok(users) if !users.is_empty() => {
            tracing::warn!(
                accounts = %users.join(", "),
                "SECURITY: these accounts still use the built-in default password. \
                 Sign in and change it — administrative writes are refused until then. \
                 Set KUBUNO_ADMIN_PASSWORD before the first boot to avoid this."
            );
        }
        Ok(_) => {}
        Err(e) => {
            tracing::error!(error = %e, "Checking for pending password changes failed");
        }
    }
}

/// Reads an environment variable, trimming whitespace and ignoring empty values.
fn env_value(key: &str) -> Option<String> {
    match std::env::var(key) {
        Ok(v) if !v.trim().is_empty() => Some(v.trim().to_string()),
        _ => None,
    }
}

/// Reads an environment variable, falling back to `default`.
fn env_or(key: &str, default: &str) -> String {
    env_value(key).unwrap_or_else(|| default.to_string())
}
