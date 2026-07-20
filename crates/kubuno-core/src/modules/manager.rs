use crate::{config::{DbCredentials, Settings}, errors::AppError};
use chrono::Utc;
use sqlx::PgPool;
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex, OnceLock};
use tokio::sync::watch;

use super::manifest::{load_all, ModuleManifest};

// ── Registre d'arrêt des superviseurs ────────────────────────────────────────
// Permet à la désinstallation d'ARRÊTER un module lancé (kill du process + fin de
// la boucle de supervision). Un canal `watch<bool>` par module ; `true` = arrêter.

static SUPERVISORS: OnceLock<Mutex<HashMap<String, watch::Sender<bool>>>> = OnceLock::new();
fn supervisors() -> &'static Mutex<HashMap<String, watch::Sender<bool>>> {
    SUPERVISORS.get_or_init(|| Mutex::new(HashMap::new()))
}

/// Demande l'arrêt d'un module supervisé (kill du process, fin de la supervision).
/// Retourne `true` si un superviseur écoutait ce module.
pub fn stop_module(module_id: &str) -> bool {
    if let Ok(mut map) = supervisors().lock() {
        if let Some(tx) = map.remove(module_id) {
            let _ = tx.send(true);
            return true;
        }
    }
    false
}

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
             homepage_url, runtime, dependencies, is_enabled, is_core_module)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, TRUE, $10)
        ON CONFLICT (id) DO UPDATE SET
            display_name   = EXCLUDED.display_name,
            version        = EXCLUDED.version,
            description    = EXCLUDED.description,
            author         = EXCLUDED.author,
            license        = EXCLUDED.license,
            homepage_url   = EXCLUDED.homepage_url,
            runtime        = EXCLUDED.runtime,
            dependencies   = EXCLUDED.dependencies,
            -- "Sticky": once internal, stays internal (a later re-register can't unset it).
            is_core_module = core.modules.is_core_module OR EXCLUDED.is_core_module,
            updated_at     = NOW()
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
    .bind(m.internal)
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
    // On scanne DEUX emplacements : les paquets système (`modules_dir`) ET les modules
    // installés à l'exécution depuis la marketplace (`modules_install_dir`, inscriptible
    // par le core). En cas de doublon d'id, l'installation marketplace a la priorité
    // (mise à jour explicite par l'admin).
    let install_dir = PathBuf::from(&settings.server.modules_install_dir);
    let mut manifests = load_all(&install_dir);
    let mut seen: std::collections::HashSet<String> =
        manifests.iter().map(|(_, m)| m.module.id.clone()).collect();
    for (dir, m) in load_all(modules_dir) {
        if seen.insert(m.module.id.clone()) {
            manifests.push((dir, m));
        } else {
            tracing::info!(module_id = %m.module.id, "Module système masqué par une version marketplace");
        }
    }

    if manifests.is_empty() {
        tracing::info!(dir = %modules_dir.display(), "Aucun module trouvé");
        return;
    }

    tracing::info!(
        dir   = %modules_dir.display(),
        store = %install_dir.display(),
        count = manifests.len(),
        "Modules découverts — synchronisation DB…"
    );

    for (module_dir, manifest) in manifests {
        spawn_module(settings.clone(), module_dir, manifest, db.clone()).await;
    }
}

/// Démarre (et supervise) UN module déjà présent sur disque, à chaud — utilisé au
/// démarrage (`start_all`) et après une installation marketplace. Synchronise les
/// métadonnées en DB puis lance la boucle de supervision dans une tâche dédiée.
/// Retourne `true` si le module a été lancé (activé), `false` s'il est désactivé.
pub async fn spawn_module(
    settings: Arc<Settings>,
    module_dir: PathBuf,
    manifest: ModuleManifest,
    db: PgPool,
) -> bool {
    let enabled = sync_to_db(&db, &manifest).await;
    if !enabled {
        tracing::info!(module_id = %manifest.module.id, "Module désactivé — non démarré");
        return false;
    }

    let core_url = format!(
        "http://{}:{}",
        if settings.server.host == "0.0.0.0" { "127.0.0.1" } else { &settings.server.host },
        settings.server.port
    );
    let db_credentials = match settings.database.credentials() {
        Ok(c) => c,
        Err(e) => {
            tracing::error!(error = %e, module_id = %manifest.module.id, "Credentials DB indisponibles — module non démarré");
            return false;
        }
    };
    let secret   = settings.server.internal_secret.clone();
    let cfg_dir  = settings.server.modules_config_dir.clone();
    let data_dir = settings.server.modules_data_dir.clone();
    let db2      = db.clone();

    // Canal d'arrêt. Si un superviseur existait déjà pour cet id (mise à jour, ou
    // remplacement d'une version système par une version marketplace), on le prie de
    // s'arrêter (kill de son process) avant de démarrer le nouveau.
    let (stop_tx, stop_rx) = watch::channel(false);
    if let Ok(mut map) = supervisors().lock() {
        if let Some(old) = map.insert(manifest.module.id.clone(), stop_tx) {
            let _ = old.send(true);
        }
    }

    tokio::spawn(async move {
        supervise(manifest, module_dir, core_url, secret, db_credentials, db2, cfg_dir, data_dir, stop_rx).await;
    });
    true
}

/// Boucle de supervision : lance le module, le redémarre s'il plante.
/// S'arrête définitivement après 5 échecs consécutifs au lancement.
#[allow(clippy::too_many_arguments)]
async fn supervise(
    manifest:           ModuleManifest,
    module_dir:         PathBuf,
    core_url:           String,
    internal_secret:    String,
    db_credentials:     DbCredentials,
    db:                 PgPool,
    modules_config_dir: String,
    modules_data_dir:   String,
    mut stop_rx:        watch::Receiver<bool>,
) {
    let module_id  = manifest.module.id.clone();
    // Chemins par module dérivés des réglages (défauts FHS Linux, surchargeables
    // sur Windows/macOS via KV__SERVER__MODULES_{CONFIG,DATA}_DIR).
    let config_dir = format!("{}/{module_id}", modules_config_dir.trim_end_matches(['/', '\\']));
    let data_dir   = format!("{}/{module_id}", modules_data_dir.trim_end_matches(['/', '\\']));

    // Le CWD du module doit exister, sinon `spawn` échoue. On crée les deux dossiers
    // (no-op s'ils existent ; les paquets les créent déjà à l'installation).
    if let Err(e) = std::fs::create_dir_all(&config_dir) {
        tracing::warn!(module_id = %module_id, dir = %config_dir, error = %e, "Création du répertoire de config du module impossible");
    }
    if let Err(e) = std::fs::create_dir_all(&data_dir) {
        tracing::warn!(module_id = %module_id, dir = %data_dir, error = %e, "Création du répertoire de données du module impossible");
    }

    let mut consecutive_failures: u32 = 0;

    loop {
        // Arrêt demandé (désinstallation) avant un (re)lancement.
        if *stop_rx.borrow() {
            tracing::info!(module_id = %module_id, "Supervision arrêtée (arrêt demandé)");
            let _ = mark_stopped(&db, &module_id).await;
            break;
        }

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
                // Attend soit la fin du process, soit une demande d'arrêt (→ kill).
                let waited = tokio::select! {
                    status = child.wait() => Some(status),
                    _ = stop_rx.changed() => {
                        if *stop_rx.borrow() {
                            tracing::info!(module_id = %module_id, "Arrêt demandé — kill du module");
                            let _ = child.start_kill();
                            let _ = child.wait().await;
                            let _ = mark_stopped(&db, &module_id).await;
                            break;
                        }
                        None
                    }
                };
                match waited {
                    Some(Ok(status)) if status.success() => {
                        tracing::info!(module_id = %module_id, "Module arrêté proprement");
                        let _ = mark_stopped(&db, &module_id).await;
                        break;
                    }
                    Some(Ok(status)) => {
                        tracing::warn!(
                            module_id = %module_id,
                            code      = ?status.code(),
                            "Module terminé avec erreur, redémarrage…"
                        );
                        let _ = mark_stopped(&db, &module_id).await;
                    }
                    Some(Err(e)) => {
                        tracing::error!(module_id = %module_id, error = %e, "Erreur wait()");
                    }
                    None => {}
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
    // NB : on ne retire PAS l'entrée du registre ici — elle a pu être remplacée par un
    // nouveau superviseur (mise à jour). `stop_module` la retire explicitement ; une
    // entrée résiduelle (module arrêté seul) est inoffensive (récepteur disparu).
}
