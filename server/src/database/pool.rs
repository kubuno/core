use crate::config::settings::DatabaseSettings;
use crate::database::SCHEMA;
use anyhow::{Context, Result};
use kubuno_db::{params, DbPool};

/// Opens the pool for the configured engine (PostgreSQL / MySQL / SQLite,
/// chosen at run time in `[database] engine`) and makes the `core` namespace
/// usable. `kubuno_db::connect` also sets the PostgreSQL search_path and creates
/// the schema / database / SQLite file as the engine requires.
pub async fn create_pool(cfg: &DatabaseSettings) -> Result<DbPool> {
    let pool = kubuno_db::connect(cfg, SCHEMA)
        .await
        .context("Connexion à la base de données")?;

    pool.execute("SELECT 1", params![])
        .await
        .context("Test de connexion à la base de données échoué")?;

    tracing::info!(
        "Pool base de données initialisé ({} connexions max, moteur {})",
        cfg.max_connections,
        cfg.engine
    );
    Ok(pool)
}

pub async fn check_connection(pool: &DbPool) -> Result<()> {
    pool.execute("SELECT 1", params![])
        .await
        .context("Base de données injoignable")?;
    Ok(())
}
