//! Commandes `db:*` — sauvegarde, restauration, réinitialisation, migrations, état.

use anyhow::{Context, Result};
use kubuno_core::{
    config::Settings,
    database::{migrations, pool::create_pool, seed},
};
use std::process::Command as Proc;

use crate::display::*;
use crate::pgconn::PgConn;

pub async fn cmd_db_backup(args: &clap::ArgMatches) -> Result<()> {
    section("Sauvegarde de la base de données");
    println!();

    let settings = Settings::load().context("Chargement de la configuration")?;
    let conn = PgConn::from_settings(&settings.database)?;

    let output = args.get_one::<String>("output").cloned().unwrap_or_else(|| {
        let ts = chrono::Local::now().format("%Y%m%d_%H%M%S");
        format!("kubuno_backup_{ts}.sql")
    });

    info(&format!("Base    : {}", conn.db));
    info(&format!("Hôte    : {}:{}", conn.host, conn.port));
    info(&format!("Fichier : {output}"));
    println!();

    let mut pg_args = conn.pg_args();
    if !args.get_flag("full") {
        pg_args.extend(["--schema=core".into(), "-F".into(), "p".into()]);
    }
    pg_args.extend(["-f".into(), output.clone(), conn.db.clone()]);

    let status = Proc::new("pg_dump")
        .envs(conn.pg_env())
        .args(&pg_args)
        .status()
        .context("pg_dump introuvable — installez postgresql-client")?;

    if status.success() {
        ok(&format!("Sauvegarde créée : {output}"));
    } else {
        fail("pg_dump a échoué.");
        std::process::exit(1);
    }
    Ok(())
}

pub async fn cmd_db_restore(args: &clap::ArgMatches) -> Result<()> {
    section("Restauration de la base de données");
    println!();

    let file = match args.get_one::<String>("file") {
        Some(f) => f,
        // `file` est requis par clap : ce bras est inatteignable en pratique.
        None => {
            fail("Fichier de sauvegarde manquant.");
            std::process::exit(1);
        }
    };
    let force = args.get_flag("force");

    if !std::path::Path::new(file).exists() {
        fail(&format!("Fichier introuvable : {file}"));
        std::process::exit(1);
    }

    let settings = Settings::load().context("Chargement de la configuration")?;
    let conn = PgConn::from_settings(&settings.database)?;

    info(&format!("Base    : {}", conn.db));
    info(&format!("Hôte    : {}:{}", conn.host, conn.port));
    info(&format!("Fichier : {file}"));
    println!();

    if !force {
        warn("Cette opération va écraser les données existantes.");
        if !confirm_yes_no("Confirmer ? [y/N] ") {
            info("Opération annulée.");
            return Ok(());
        }
        println!();
    }

    let mut pg_args = conn.pg_args();
    pg_args.extend(["-d".into(), conn.db.clone(), "-f".into(), file.clone()]);

    let status = Proc::new("psql")
        .envs(conn.pg_env())
        .args(&pg_args)
        .status()
        .context("psql introuvable — installez postgresql-client")?;

    if status.success() {
        ok("Restauration terminée.");
    } else {
        fail("psql a échoué.");
        std::process::exit(1);
    }
    Ok(())
}

pub async fn cmd_db_reset(args: &clap::ArgMatches) -> Result<()> {
    section("Réinitialisation de la base de données");
    println!();

    let force = args.get_flag("force");

    if !force {
        warn(&format!("{RED}{BOLD}ATTENTION{RESET}{YELLOW} — Toutes les données seront SUPPRIMÉES DÉFINITIVEMENT.{RESET}"));
        if !confirm_exact(&format!("Tapez {BOLD}reset{RESET} pour confirmer : "), "reset") {
            info("Opération annulée.");
            return Ok(());
        }
        println!();
    }

    let settings = Settings::load().context("Chargement de la configuration")?;
    let pool = create_pool(&settings.database)
        .await
        .context("Connexion à la base de données")?;

    info("Suppression du schéma core…");
    sqlx::query("DROP SCHEMA IF EXISTS core CASCADE")
        .execute(&pool)
        .await
        .context("Suppression du schéma core")?;
    ok("Schéma core supprimé.");

    // _sqlx_migrations est dans le schéma public — il survit au DROP SCHEMA core.
    // Sans ce DELETE, sqlx considère les migrations comme déjà appliquées et les saute,
    // laissant la base dans un état incohérent (core.users inexistante).
    sqlx::query("DELETE FROM _sqlx_migrations")
        .execute(&pool)
        .await
        .context("Réinitialisation de la table _sqlx_migrations")?;
    ok("Historique migrations réinitialisé.");

    info("Application des migrations…");
    migrations::run(&pool).await.context("Application des migrations")?;
    ok("Migrations appliquées.");

    info("Création du compte administrateur initial…");
    seed::ensure_default_admin(&pool).await.context("Seed compte admin")?;
    ok("Compte admin créé (username: admin / password: kubuno).");

    ok("Base de données réinitialisée.");

    Ok(())
}

pub async fn cmd_db_migrate() -> Result<()> {
    section("Application des migrations SQL");
    println!();

    let settings = Settings::load().context("Chargement de la configuration")?;
    let pool = create_pool(&settings.database)
        .await
        .context("Connexion à la base de données")?;

    migrations::run(&pool).await.context("Application des migrations")?;
    ok("Migrations appliquées.");
    Ok(())
}

pub async fn cmd_db_status() -> Result<()> {
    section("État de la base de données");
    println!();

    let settings = Settings::load().context("Chargement de la configuration")?;
    let conn = PgConn::from_settings(&settings.database)?;

    info(&format!("Hôte        : {}:{}", conn.host, conn.port));
    info(&format!("Base        : {}", conn.db));
    info(&format!("Utilisateur : {}", conn.user));
    println!();

    let pool = create_pool(&settings.database)
        .await
        .context("Connexion à la base de données")?;

    let (pg_version,): (String,) = sqlx::query_as("SELECT version()")
        .fetch_one(&pool)
        .await
        .context("Requête version PostgreSQL")?;
    ok(&format!("Connecté — {pg_version}"));

    let rows: Vec<(i64, String, bool)> = sqlx::query_as(
        "SELECT version, description, success FROM _sqlx_migrations ORDER BY version",
    )
    .fetch_all(&pool)
    .await
    .unwrap_or_default();

    println!();
    if rows.is_empty() {
        warn("Aucune migration appliquée.");
    } else {
        println!("  {BOLD}{:<8}  {:<50}  État{RESET}", "Version", "Description");
        println!("  {}", "─".repeat(70));
        for (ver, desc, applied) in &rows {
            let st = if *applied { format!("{GREEN}✓{RESET}") } else { format!("{RED}✗{RESET}") };
            println!("  {ver:<8}  {desc:<50}  {st}");
        }
    }
    Ok(())
}
