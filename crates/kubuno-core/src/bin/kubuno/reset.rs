//! Réinitialisations destructives : `app:reset` (toute la plateforme) et
//! `<module>:reset` (un seul module).

use anyhow::{Context, Result};
use kubuno_core::{
    config::Settings,
    database::{migrations, pool::create_pool, seed},
};
use kubuno_storage::StorageBackendType;

use crate::display::*;

/// Supprime le CONTENU d'un répertoire sans supprimer le répertoire lui-même.
/// Renvoie le nombre d'entrées supprimées.
fn purge_dir_contents(path: &std::path::Path) -> Option<u32> {
    match std::fs::read_dir(path) {
        Ok(entries) => {
            let mut deleted = 0u32;
            for entry in entries.flatten() {
                let ep = entry.path();
                let res = if ep.is_dir() {
                    std::fs::remove_dir_all(&ep)
                } else {
                    std::fs::remove_file(&ep)
                };
                match res {
                    Ok(_)  => deleted += 1,
                    Err(e) => warn(&format!("Impossible de supprimer {} : {e}", ep.display())),
                }
            }
            Some(deleted)
        }
        Err(e) => {
            warn(&format!("Impossible de lire {} : {e}", path.display()));
            None
        }
    }
}

pub async fn cmd_app_reset(args: &clap::ArgMatches) -> Result<()> {
    section("Réinitialisation complète de l'application");
    println!();

    let force      = args.get_flag("force");
    let keep_files = args.get_flag("keep-files");

    let settings = Settings::load().context("Chargement de la configuration")?;
    let pool     = create_pool(&settings.database)
        .await
        .context("Connexion à la base de données")?;

    // ── Découverte des schémas à supprimer ──────────────────────────────────
    let schemas: Vec<String> = sqlx::query_scalar(
        "SELECT nspname FROM pg_catalog.pg_namespace
         WHERE nspname NOT IN ('public', 'information_schema')
           AND nspname NOT LIKE 'pg_%'
         ORDER BY nspname",
    )
    .fetch_all(&pool)
    .await
    .context("Liste des schémas PostgreSQL")?;

    let storage_path = settings.storage.local_path().to_string();
    let temp_path    = settings.storage.temp_path().to_string();
    let is_local     = settings.storage.backend == StorageBackendType::Local;

    // ── Résumé de ce qui va être détruit ────────────────────────────────────
    warn(&format!(
        "{RED}{BOLD}ATTENTION — Cette opération va EFFACER DÉFINITIVEMENT :{RESET}"
    ));
    println!();

    if schemas.is_empty() {
        info("  • Aucun schéma applicatif trouvé en base de données");
    } else {
        info(&format!("  • Schémas PostgreSQL ({}) :", schemas.len()));
        for s in &schemas {
            info(&format!("      – {s}"));
        }
    }
    info("  • Historique des migrations (_sqlx_migrations)");

    if !keep_files {
        if is_local {
            info(&format!("  • Fichiers de stockage : {storage_path}"));
            info(&format!("  • Fichiers temporaires : {temp_path}"));
        } else {
            warn("  • Backend S3 détecté — les fichiers S3 ne seront PAS supprimés automatiquement.");
        }
    }

    println!();
    info("Après la réinitialisation :");
    info("  ✓ Schéma core recréé avec les paramètres par défaut");
    info("  ✓ Compte administrateur initial (admin / kubuno)");
    info("  ✓ Les modules relanceront leurs migrations au prochain démarrage");
    println!();

    // ── Confirmation ────────────────────────────────────────────────────────
    if !force {
        warn("Pour confirmer, tapez exactement : RESET KUBUNO");
        if !confirm_exact("Confirmation : ", "RESET KUBUNO") {
            info("Opération annulée.");
            return Ok(());
        }
        println!();
    }

    // ── 1. Suppression des schémas ──────────────────────────────────────────
    if schemas.is_empty() {
        info("Aucun schéma à supprimer.");
    } else {
        for schema in &schemas {
            info(&format!("Suppression du schéma {schema}…"));
            sqlx::query(&format!("DROP SCHEMA IF EXISTS \"{schema}\" CASCADE"))
                .execute(&pool)
                .await
                .with_context(|| format!("Suppression du schéma {schema}"))?;
        }
        ok(&format!("{} schéma(s) supprimé(s).", schemas.len()));
    }

    // ── 2. Réinitialisation de l'historique des migrations ──────────────────
    info("Réinitialisation de _sqlx_migrations…");
    sqlx::query("DELETE FROM _sqlx_migrations")
        .execute(&pool)
        .await
        .context("Réinitialisation de _sqlx_migrations")?;
    ok("Historique des migrations réinitialisé.");

    // ── 3. Suppression des fichiers de stockage ─────────────────────────────
    if !keep_files && is_local {
        for path_str in &[&storage_path, &temp_path] {
            let p = std::path::Path::new(path_str);
            if !p.exists() {
                continue;
            }
            info(&format!("Suppression des fichiers dans {path_str}…"));
            // Supprimer le contenu sans supprimer le répertoire racine
            if let Some(deleted) = purge_dir_contents(p) {
                ok(&format!("{deleted} entrée(s) supprimée(s) dans {path_str}"));
            }
        }
    } else if keep_files {
        info("Fichiers de stockage conservés (--keep-files).");
    }

    // ── 4. Recréation du schéma core et migrations ──────────────────────────
    info("Application des migrations core…");
    migrations::run(&pool).await.context("Application des migrations core")?;
    ok("Schéma core recréé avec les paramètres par défaut.");

    // ── 5. Compte administrateur initial ───────────────────────────────────
    info("Création du compte administrateur initial…");
    seed::ensure_default_admin(&pool).await.context("Seed compte admin")?;
    ok("Compte admin créé (username: admin  /  password: kubuno).");

    println!();
    ok(&format!("{GREEN}{BOLD}Réinitialisation terminée.{RESET}"));
    warn("Redémarrez kubuno-core et tous les modules pour finaliser.");

    Ok(())
}

pub async fn cmd_module_reset(module_id: &str, force: bool, keep_files: bool) -> Result<()> {
    section(&format!("Réinitialisation du module : {CYAN}{BOLD}{module_id}{RESET}"));
    println!();

    let settings = Settings::load().context("Chargement de la configuration")?;
    let pool = create_pool(&settings.database)
        .await
        .context("Connexion à la base de données")?;

    // Vérifier que le schéma existe
    let schema_exists: bool = sqlx::query_scalar(
        "SELECT EXISTS(SELECT 1 FROM pg_catalog.pg_namespace WHERE nspname = $1)",
    )
    .bind(module_id)
    .fetch_one(&pool)
    .await
    .unwrap_or(false);

    if !schema_exists {
        warn(&format!("Le schéma '{module_id}' n'existe pas — module déjà réinitialisé ou non installé."));
        return Ok(());
    }

    // Compter les tables pour informer l'utilisateur
    let table_count: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = $1",
    )
    .bind(module_id)
    .fetch_one(&pool)
    .await
    .unwrap_or(0);

    let storage_path = settings.storage.local_path().to_string();
    let is_local     = settings.storage.backend == StorageBackendType::Local;
    let module_storage = std::path::Path::new(&storage_path).join(module_id);
    let has_storage = is_local && module_storage.exists();

    // ── Résumé ──────────────────────────────────────────────────────────────
    warn(&format!("{RED}{BOLD}ATTENTION — Cette opération va EFFACER DÉFINITIVEMENT :{RESET}"));
    println!();
    info(&format!("  • Schéma PostgreSQL «{module_id}» ({table_count} table(s))"));
    info( "  • Historique des migrations du module");
    if !keep_files {
        if has_storage {
            info(&format!("  • Fichiers de stockage : {}", module_storage.display()));
        } else if !is_local {
            warn("  • Backend S3 détecté — les fichiers S3 ne seront PAS supprimés.");
        }
    }
    println!();
    info("Après la réinitialisation :");
    info(&format!("  ✓ Le module relancera ses migrations au prochain démarrage (systemctl restart kubuno-{module_id})"));
    println!();

    // ── Confirmation ────────────────────────────────────────────────────────
    if !force {
        let expected = format!("reset {module_id}");
        warn(&format!("Pour confirmer, tapez exactement : {BOLD}{expected}{RESET}"));
        if !confirm_exact("Confirmation : ", &expected) {
            info("Opération annulée.");
            return Ok(());
        }
        println!();
    }

    // ── 1. Suppression du schéma ─────────────────────────────────────────────
    info(&format!("Suppression du schéma {module_id}…"));
    sqlx::query(&format!("DROP SCHEMA IF EXISTS \"{module_id}\" CASCADE"))
        .execute(&pool)
        .await
        .with_context(|| format!("Suppression du schéma {module_id}"))?;
    ok(&format!("Schéma {module_id} supprimé ({table_count} table(s))."));

    // ── 2. Suppression des fichiers de stockage ──────────────────────────────
    if !keep_files && has_storage {
        info(&format!("Suppression des fichiers dans {}…", module_storage.display()));
        if let Some(deleted) = purge_dir_contents(&module_storage) {
            ok(&format!("{deleted} entrée(s) supprimée(s) dans {}", module_storage.display()));
        }
    } else if keep_files {
        info("Fichiers de stockage conservés (--keep-files).");
    }

    println!();
    ok(&format!("{GREEN}{BOLD}Module {module_id} réinitialisé avec succès.{RESET}"));
    warn(&format!("Redémarrez le module : {BOLD}systemctl restart kubuno-{module_id}{RESET}"));

    Ok(())
}
