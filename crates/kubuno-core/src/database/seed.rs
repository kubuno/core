use anyhow::{Context, Result};
use sqlx::PgPool;

use crate::crypto::password::hash_password;

/// Crée le compte administrateur par défaut s'il n'existe pas encore.
/// Identifiants initiaux : admin / kubuno
pub async fn ensure_default_admin(pool: &PgPool) -> Result<()> {
    let exists: bool = sqlx::query_scalar(
        "SELECT EXISTS(SELECT 1 FROM core.users WHERE username = 'admin')",
    )
    .fetch_one(pool)
    .await
    .context("Vérification compte admin")?;

    if exists {
        return Ok(());
    }

    let password_hash =
        hash_password("kubuno").context("Hachage du mot de passe admin initial")?;

    sqlx::query(
        r#"
        INSERT INTO core.users
            (email, username, password_hash, display_name, role, email_verified, is_active)
        VALUES
            ('admin@kubuno.local', 'admin', $1, 'Administrateur', 'admin', TRUE, TRUE)
        "#,
    )
    .bind(&password_hash)
    .execute(pool)
    .await
    .context("Création du compte administrateur initial")?;

    tracing::info!("Compte administrateur initial créé (username: admin)");
    Ok(())
}
