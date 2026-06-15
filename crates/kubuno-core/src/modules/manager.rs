use crate::{config::{DbCredentials, Settings}, errors::AppError};
use chrono::Utc;
use sqlx::PgPool;
use std::path::{Path, PathBuf};
use std::sync::Arc;

use super::manifest::{load_all, ModuleManifest};

// ── Statut DB ────────────────────────────────────────────────────

pub async fn mark_healthy(db: &PgPool, instance_id: uuid::Uuid) -> Result<(), AppError> {
    sqlx::query(
        "UPDATE core.module_instances SET status = 'healthy', last_heartbeat = $1 WHERE id = $2",
    )
    .bind(Utc::now())
    .bind(instance_id)
    .execute(db)
    .await?;
    Ok(())
}

pub async fn mark_stopped(db: &PgPool, module_id: &str) -> Result<(), AppError> {
    sqlx::query(
        "UPDATE core.module_instances SET status = 'stopped' WHERE module_id = $1",
    )
    .bind(module_id)
    .execute(db)
    .await?;
    Ok(())
}

// ── Sync DB ──────────────────────────────────────────────────────

/// Upserte le module dans core.modules d'après son manifest.
///
/// - Nouveaux modules : insérés avec is_enabled = TRUE (démarrés par défaut).
/// - Modules connus   : metadata mise à jour, is_enabled PRÉSERVÉ (choix de l'admin).
///
/// Retourne `true` si le module doit être démarré.
async fn sync_to_db(db: &PgPool, manifest: &ModuleManifest) -> bool {
    let m = &manifest.module;

    let result = sqlx::query_scalar::<_, bool>(
        r#"
        INSERT INTO core.modules
            (id, display_name, version, description, author, license,
             homepage_url, runtime, dependencies, is_enabled)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, TRUE)
        ON CONFLICT (id) DO UPDATE SET
            display_name = EXCLUDED.display_name,
            version      = EXCLUDED.version,
            description  = EXCLUDED.description,
            author       = EXCLUDED.author,
            license      = EXCLUDED.license,
            homepage_url = EXCLUDED.homepage_url,
            runtime      = EXCLUDED.runtime,
            dependencies = EXCLUDED.dependencies,
            updated_at   = NOW()
        RETURNING is_enabled
        "#,
    )
    .bind(&m.id)
    .bind(&m.display_name)
    .bind(&m.version)
    .bind(m.description.as_deref())
    .bind(m.author.as_deref())
    .bind(m.license.as_deref())
    .bind(m.homepage_url.as_deref())
    .bind(&m.runtime)
    .bind(&m.dependencies[..])
    .fetch_one(db)
    .await;

    match result {
        Ok(enabled) => {
            if enabled {
                tracing::debug!(module_id = %m.id, version = %m.version, "Module synchronisé (activé)");
            } else {
                tracing::info!(module_id = %m.id, "Module synchronisé (désactivé par l'admin)");
            }
            enabled
        }
        Err(e) => {
            tracing::error!(module_id = %m.id, error = %e, "Erreur sync core.modules");
            // En cas d'erreur DB, on démarre quand même (fail-open)
            true
        }
    }
}

// ── Superviseur de processus ─────────────────────────────────────

/// Scanne `modules_dir`, synchronise avec la DB, puis lance et supervise
/// chaque module activé.
///
/// Variables d'environnement injectées dans chaque processus :
///   KUBUNO_CORE_URL        → URL du core (pour l'auto-enregistrement)
///   KUBUNO_INTERNAL_SECRET → Secret partagé
///   KUBUNO_MODULE_ID       → Identifiant du module
///   KUBUNO_CONFIG_DIR      → /etc/kubuno/modules/<id>/
///   KUBUNO_DATA_DIR        → /var/lib/kubuno/modules/<id>/
///   KUBUNO_DB_HOST/PORT/USER/PASSWORD/NAME → Credentials PostgreSQL
pub async fn start_all(settings: Arc<Settings>, modules_dir: &Path, db: PgPool) {
    let manifests = load_all(modules_dir);
    if manifests.is_empty() {
        tracing::info!(dir = %modules_dir.display(), "Aucun module trouvé");
        return;
    }

    tracing::info!(
        dir   = %modules_dir.display(),
        count = manifests.len(),
        "Modules découverts — synchronisation DB…"
    );

    let core_url = format!(
        "http://{}:{}",
        if settings.server.host == "0.0.0.0" { "127.0.0.1" } else { &settings.server.host },
        settings.server.port
    );
    let secret = settings.server.internal_secret.clone();

    let db_credentials = match settings.database.credentials() {
        Ok(c) => c,
        Err(e) => {
            tracing::error!(error = %e, "Impossible d'extraire les credentials DB — modules non démarrés");
            return;
        }
    };

    for (module_dir, manifest) in manifests {
        // 1. Sync metadata → DB, vérifier is_enabled
        let enabled = sync_to_db(&db, &manifest).await;
        if !enabled {
            tracing::info!(
                module_id = %manifest.module.id,
                "Module désactivé — non démarré"
            );
            continue;
        }

        // 2. Lancer et superviser dans une tâche dédiée
        let core_url2       = core_url.clone();
        let secret2         = secret.clone();
        let db_credentials2 = db_credentials.clone();
        let db2             = db.clone();

        tokio::spawn(async move {
            supervise(manifest, module_dir, core_url2, secret2, db_credentials2, db2).await;
        });
    }
}

/// Boucle de supervision : lance le module, le redémarre s'il plante.
/// S'arrête définitivement après 5 échecs consécutifs au lancement.
async fn supervise(
    manifest:        ModuleManifest,
    module_dir:      PathBuf,
    core_url:        String,
    internal_secret: String,
    db_credentials:  DbCredentials,
    db:              PgPool,
) {
    let module_id  = manifest.module.id.clone();
    let config_dir = format!("/etc/kubuno/modules/{module_id}");
    let data_dir   = format!("/var/lib/kubuno/modules/{module_id}");

    let mut consecutive_failures: u32 = 0;

    loop {
        let mut cmd = manifest.build_tokio_command(&module_dir);

        cmd
            .env("KUBUNO_CORE_URL",        &core_url)
            .env("KUBUNO_INTERNAL_SECRET", &internal_secret)
            .env("KUBUNO_MODULE_ID",       &module_id)
            .env("KUBUNO_MODULE_DIR",      module_dir.to_str().unwrap_or(""))
            .env("KUBUNO_CONFIG_DIR",      &config_dir)
            .env("KUBUNO_DATA_DIR",        &data_dir)
            .env("KUBUNO_DB_HOST",         &db_credentials.host)
            .env("KUBUNO_DB_PORT",         db_credentials.port.to_string())
            .env("KUBUNO_DB_USER",         &db_credentials.user)
            .env("KUBUNO_DB_PASSWORD",     &db_credentials.password)
            .env("KUBUNO_DB_NAME",         &db_credentials.database)
            .current_dir(&config_dir)
            .stdout(std::process::Stdio::inherit())
            .stderr(std::process::Stdio::inherit());

        tracing::info!(
            module_id = %module_id,
            runtime   = %manifest.module.runtime,
            "Démarrage du module"
        );

        match cmd.spawn() {
            Ok(mut child) => {
                consecutive_failures = 0;
                match child.wait().await {
                    Ok(status) if status.success() => {
                        tracing::info!(module_id = %module_id, "Module arrêté proprement");
                        let _ = mark_stopped(&db, &module_id).await;
                        break;
                    }
                    Ok(status) => {
                        tracing::warn!(
                            module_id = %module_id,
                            code      = ?status.code(),
                            "Module terminé avec erreur, redémarrage…"
                        );
                        let _ = mark_stopped(&db, &module_id).await;
                    }
                    Err(e) => {
                        tracing::error!(module_id = %module_id, error = %e, "Erreur wait()");
                    }
                }
            }
            Err(e) => {
                consecutive_failures += 1;
                tracing::error!(
                    module_id = %module_id,
                    error     = %e,
                    attempt   = consecutive_failures,
                    "Impossible de lancer le module"
                );
                if consecutive_failures >= 5 {
                    tracing::error!(
                        module_id = %module_id,
                        "5 échecs de lancement consécutifs — supervision abandonnée"
                    );
                    let _ = mark_stopped(&db, &module_id).await;
                    break;
                }
            }
        }

        // Backoff exponentiel : 1s, 2s, 4s, 8s, 16s → plafonné à 30s
        let delay = std::cmp::min(2u64.pow(consecutive_failures.saturating_sub(1).min(4)), 30);
        tokio::time::sleep(tokio::time::Duration::from_secs(delay)).await;
    }
}
