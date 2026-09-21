use crate::database::SCHEMA;
use anyhow::{Context, Result};
use kubuno_db::DbPool;

/// Runs the migration set for the pool's engine. The three dialects live under
/// `migrations/{postgres,mysql,sqlite}`; `kubuno_db::migrations!` resolves all
/// three at compile time and `.run` applies the one that matches the pool,
/// keeping `_sqlx_migrations` inside the `core` namespace (the table PostgreSQL
/// already used through its search_path, so an applied migration is not re-run).
pub async fn run(pool: &DbPool) -> Result<()> {
    tracing::info!("Application des migrations SQL…");
    kubuno_db::migrations!(
        "../../migrations/postgres",
        "../../migrations/mysql",
        "../../migrations/sqlite",
    )
    .run(pool, SCHEMA)
    .await
    .context("Échec des migrations")?;
    tracing::info!("Migrations appliquées avec succès");
    Ok(())
}
