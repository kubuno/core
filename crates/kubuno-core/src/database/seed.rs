use anyhow::{Context, Result};
use sqlx::PgPool;

use crate::crypto::password::hash_password;

/// Creates the default administrator account if it does not exist yet.
///
/// The credentials are configurable via environment variables (handy for Docker
/// / CI), falling back to the historical defaults `admin` / `kubuno`:
///   - `KUBUNO_ADMIN_USER`     (default: `admin`)
///   - `KUBUNO_ADMIN_PASSWORD` (default: `kubuno`)
///   - `KUBUNO_ADMIN_EMAIL`    (default: `admin@kubuno.local`)
pub async fn ensure_default_admin(pool: &PgPool) -> Result<()> {
    let username = env_or("KUBUNO_ADMIN_USER", "admin");
    let password = env_or("KUBUNO_ADMIN_PASSWORD", "kubuno");
    let email = env_or("KUBUNO_ADMIN_EMAIL", "admin@kubuno.local");

    // Seed only when no admin exists yet, so a renamed/removed default admin is
    // not silently recreated on every boot.
    let exists: bool =
        sqlx::query_scalar("SELECT EXISTS(SELECT 1 FROM core.users WHERE role = 'admin')")
            .fetch_one(pool)
            .await
            .context("Checking for an existing admin account")?;

    if exists {
        return Ok(());
    }

    let password_hash =
        hash_password(&password).context("Hashing the initial admin password")?;

    sqlx::query(
        r#"
        INSERT INTO core.users
            (email, username, password_hash, display_name, role, email_verified, is_active)
        VALUES
            ($1, $2, $3, 'Administrateur', 'admin', TRUE, TRUE)
        "#,
    )
    .bind(&email)
    .bind(&username)
    .bind(&password_hash)
    .execute(pool)
    .await
    .context("Creating the initial administrator account")?;

    tracing::info!(username = %username, "Initial administrator account created");
    Ok(())
}

/// Reads an environment variable, trimming whitespace and ignoring empty values.
fn env_or(key: &str, default: &str) -> String {
    match std::env::var(key) {
        Ok(v) if !v.trim().is_empty() => v.trim().to_string(),
        _ => default.to_string(),
    }
}
