use anyhow::{Context, Result};
use sqlx::PgPool;

pub async fn run(pool: &PgPool) -> Result<()> {
    tracing::info!("Application des migrations SQL…");
    // Migrations are split per engine under `migrations/{postgres,mysql,sqlite}`.
    // The core still runs on PostgreSQL here; the runtime-engine switch (state on
    // `kubuno_db::DbPool`, `kubuno_db::migrations!`) selects the right set.
    sqlx::migrate!("../../migrations/postgres")
        .run(pool)
        .await
        .context("Échec des migrations")?;
    tracing::info!("Migrations appliquées avec succès");
    Ok(())
}
