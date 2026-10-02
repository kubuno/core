use crate::database::SCHEMA;
use anyhow::{Context, Result};
use kubuno_db::{DbPool, MigratorSet};

/// The core's migration set. The three dialects live under
/// `migrations/{postgres,mysql,sqlite}`; `migrations/mysql-oracle` holds the
/// Oracle MySQL flavour variants of a few `mysql` files (MariaDB runs the
/// `mysql` files as written). See `kubuno_db::MySqlVariants`.
fn set() -> MigratorSet {
    kubuno_db::migrations!(
        "../../migrations/postgres",
        "../../migrations/mysql",
        "../../migrations/sqlite",
        oracle_mysql = "../../migrations/mysql-oracle",
    )
}

/// Runs the migration set for the pool's engine; `.run` applies the one that
/// matches the pool (with the MySQL flavour's variants), keeping
/// `_sqlx_migrations` inside the `core` namespace (the table PostgreSQL already
/// used through its search_path, so an applied migration is not re-run).
pub async fn run(pool: &DbPool) -> Result<()> {
    tracing::info!("Application des migrations SQL…");
    set().run(pool, SCHEMA).await.context("Échec des migrations")?;
    tracing::info!("Migrations appliquées avec succès");
    Ok(())
}

#[cfg(test)]
mod tests {
    #[test]
    fn mysql_flavour_variants_replace_existing_files() {
        super::set().check().expect("every variant has a namesake in migrations/mysql");
    }
}
