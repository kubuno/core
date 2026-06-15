use anyhow::{Context, Result};
use sqlx::PgPool;

pub async fn run(pool: &PgPool) -> Result<()> {
    tracing::info!("Application des migrations SQL…");
    sqlx::migrate!("../../migrations")
        .run(pool)
        .await
        .context("Échec des migrations")?;
    tracing::info!("Migrations appliquées avec succès");
    Ok(())
}
