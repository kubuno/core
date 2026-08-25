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

/// Where the generated first password is left for the operator when they did
/// not supply one. Readable by the service only (0600), and deleted as soon as
/// the account changes its password.
fn initial_password_file() -> std::path::PathBuf {
    if let Ok(p) = std::env::var("KUBUNO_INITIAL_PASSWORD_FILE") {
        if !p.trim().is_empty() {
            return std::path::PathBuf::from(p);
        }
    }
    let state = std::path::Path::new("/var/lib/kubuno");
    if state.is_dir() {
        return state.join("initial-admin-password");
    }
    std::path::PathBuf::from("initial-admin-password")
}

/// A first password nobody can guess.
///
/// There is NO default password any more. A value shipped in the source is
/// known to everyone who can read the source, and an instance reachable before
/// its owner's first sign-in is an instance anyone can take. So one is drawn at
/// random, written where only the service can read it, and never logged — the
/// project's rule on secrets in logs holds here too.
fn generate_initial_password() -> String {
    // Ambiguous glyphs left out: this is meant to be retyped from a terminal.
    const ALPHABET: &[u8] = b"abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let mut bytes = [0u8; 20];
    rand::RngCore::fill_bytes(&mut rand::thread_rng(), &mut bytes);
    bytes.iter().map(|b| ALPHABET[*b as usize % ALPHABET.len()] as char).collect()
}

/// Creates the default administrator account if it does not exist yet.
///
/// The credentials come from the environment (handy for Docker / CI):
///   - `KUBUNO_ADMIN_USER`     (default: `admin`)
///   - `KUBUNO_ADMIN_PASSWORD` (no default — see below)
///   - `KUBUNO_ADMIN_EMAIL`    (default: `admin@kubuno.local`)
///
/// **There is no default password.** When none is supplied, one is drawn at
/// random and written to a file only the service can read; the account is
/// created with `must_change_password = TRUE`, so the frontend forces a change
/// before anything else and the backend refuses administrative writes until it
/// is done. An operator who supplied `KUBUNO_ADMIN_PASSWORD` chose their own
/// secret and is left alone.
///
/// Note that this path only runs when the instance is configured but has no
/// administrator — an unattended deployment, typically. A fresh installation
/// goes through the setup wizard instead, where the operator picks the password
/// on screen and nothing is ever generated.
pub async fn ensure_default_admin(pool: &PgPool) -> Result<()> {
    let username = env_or("KUBUNO_ADMIN_USER", "admin");
    let (password, is_generated) = match env_value("KUBUNO_ADMIN_PASSWORD") {
        Some(v) => (v, false),
        None => (generate_initial_password(), true),
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
    .bind(is_generated)
    .bind(root_unit)
    .execute(pool)
    .await
    .inspect_err(|e| {
        tracing::error!(error = %e, "Creating the initial administrator account failed");
    })
    .context("Creating the initial administrator account")?;

    // `role = 'admin'` is only the cache; what the console reads is the role
    // ASSIGNMENT. Without this the first administrator is admitted to the
    // console holding nothing, sees the two or three pages that require no
    // privilege and gets a 403 on all the rest.
    let admin_id: Option<uuid::Uuid> =
        sqlx::query_scalar("SELECT id FROM core.users WHERE email = $1")
            .bind(&email)
            .fetch_optional(pool)
            .await
            .unwrap_or(None);
    if let Some(id) = admin_id {
        if let Err(e) = crate::authz::bootstrap::grant_instance_superadmin(pool, id).await {
            tracing::error!(error = %e, "Attribution de la super-administration à l'administrateur initial");
        }
    }

    // The generated password is handed over through a file, never through the
    // log: logs are collected, shipped and read by more people than the machine's
    // owner. The path is logged, the value is not.
    if is_generated {
        let path = initial_password_file();
        match std::fs::write(&path, format!("{password}\n")) {
            Ok(()) => {
                #[cfg(unix)]
                {
                    use std::os::unix::fs::PermissionsExt;
                    let _ = std::fs::set_permissions(&path, std::fs::Permissions::from_mode(0o600));
                }
                tracing::warn!(
                    username = %username,
                    file = %path.display(),
                    "Compte administrateur créé avec un mot de passe ALÉATOIRE — il est dans ce fichier, \
                     à changer à la première connexion"
                );
            }
            Err(e) => {
                // Better to say so loudly than to leave an unusable account: the
                // operator can still reset it with `kubuno reset-admin`.
                tracing::error!(
                    error = %e, file = %path.display(),
                    "Mot de passe administrateur initial NON écrit — utilisez « kubuno reset-admin »"
                );
            }
        }
    }
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
