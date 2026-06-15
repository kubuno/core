use crate::config::settings::DatabaseSettings;
use anyhow::{Context, Result};
use sqlx::{postgres::PgPoolOptions, PgPool};

pub async fn create_pool(cfg: &DatabaseSettings) -> Result<PgPool> {
    let opts = cfg.connect_options().context("Configuration base de données invalide")?;
    let pool = PgPoolOptions::new()
        .max_connections(cfg.max_connections)
        .min_connections(cfg.min_connections)
        .acquire_timeout(cfg.connect_timeout)
        .connect_with(opts)
        .await
        .context("Connexion à PostgreSQL échouée")?;

    sqlx::query("SELECT 1")
        .execute(&pool)
        .await
        .context("Test de connexion PostgreSQL échoué")?;

    tracing::info!("Pool PostgreSQL initialisé ({} connexions max)", cfg.max_connections);
    Ok(pool)
}

pub async fn check_connection(pool: &PgPool) -> Result<()> {
    sqlx::query("SELECT 1")
        .execute(pool)
        .await
        .context("PostgreSQL injoignable")?;
    Ok(())
}
