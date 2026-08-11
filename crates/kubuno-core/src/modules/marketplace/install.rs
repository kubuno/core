//! Installation (récursive, dépendances d'abord) et désinstallation d'un module
//! de la marketplace dans le store inscriptible par le core.

use std::path::{Path, PathBuf};
use std::sync::Arc;

use serde::Serialize;
use sqlx::PgPool;

use crate::{config::Settings, errors::AppError};

use super::artifact::{kind_from_name, resolve_artifact, Artifact};
use super::catalog::{client, fetch_detail, validate_id};
use super::extract::{copy_dir_all, extract_artifact, find_module_root, sha256_hex};
use super::progress::set_phase;

const TRUSTED_REPO_PREFIX: &str = "https://github.com/kubuno/";

#[derive(Debug, Clone, Serialize)]
pub struct InstallReport {
    pub id:      String,
    pub name:    String,
    pub version: String,
    pub path:    String,
    pub started: bool,
    pub config_written: bool,
    /// Dépendances déclarées par le module (installées automatiquement si absentes).
    #[serde(default)]
    pub dependencies: Vec<String>,
}

/// `true` si le module est déjà présent sur disque (store OU paquet système), donc
/// utilisable comme dépendance sans réinstallation.
fn is_available(settings: &Settings, id: &str) -> bool {
    Path::new(&settings.server.modules_install_dir).join(id).is_dir()
        || Path::new(&settings.server.modules_dir).join(id).is_dir()
}

/// Résultat d'une matérialisation : le module est téléchargé, vérifié et déposé dans
/// le store, mais PAS encore démarré (on démarre après ses dépendances).
struct Materialized {
    dest_mod:       PathBuf,
    manifest:       crate::modules::manifest::ModuleManifest,
    name:           String,
    version:        String,
    config_written: bool,
}

/// Télécharge, vérifie (SHA-256), extrait et relocalise un module dans le store.
/// Ne le démarre pas. Applique la garde de confiance (officiel + dépôt kubuno).
async fn materialize(settings: &Settings, id: &str) -> Result<Materialized, AppError> {
    validate_id(id)?;
    let http = client()?;

    // 1) Métadonnées + garde de confiance (module officiel, dépôt sous kubuno/).
    set_phase(id, "resolving", "Résolution du module…");
    let detail = fetch_detail(id).await?;
    let repo = detail.links.repo.clone().ok_or_else(|| {
        AppError::Validation(format!("le module « {id} » n'expose pas de dépôt"))
    })?;
    if !detail.official || !repo.starts_with(TRUSTED_REPO_PREFIX) {
        return Err(AppError::Forbidden);
    }

    // 2) Résolution de l'artefact ADAPTÉ À L'OS/ARCH DU CORE. Source PRÉFÉRÉE : URL
    //    directe fournie par la marketplace (à terme, kubuno.com — supposée déjà
    //    résolue pour la plateforme). Repli : asset de la Release GitHub choisi selon
    //    `std::env::consts::OS/ARCH`.
    let asset = match detail.download_url.clone() {
        Some(url) => {
            if !url.starts_with("https://") {
                return Err(AppError::Validation("URL d'artefact non sécurisée (HTTPS requis)".into()));
            }
            let kind = kind_from_name(&url)
                .ok_or_else(|| AppError::Validation(format!("format d'artefact inconnu : {url}")))?;
            Artifact { url, kind, sha256: detail.sha256.as_deref().map(|s| s.trim_start_matches("sha256:").to_ascii_lowercase()) }
        }
        None => resolve_artifact(&http, &repo, &detail.version).await?,
    };
    tracing::info!(module_id = %id, version = %detail.version, os = std::env::consts::OS, arch = std::env::consts::ARCH, kind = ?asset.kind, url = %asset.url, "Marketplace : téléchargement de l'artefact");
    set_phase(id, "downloading", "Téléchargement de l'artefact…");
    let bytes = http
        .get(&asset.url)
        .send()
        .await
        .and_then(|r| r.error_for_status())
        .map_err(|e| AppError::Internal(anyhow::anyhow!("téléchargement .deb: {e}")))?
        .bytes()
        .await
        .map_err(|e| AppError::Internal(anyhow::anyhow!("lecture .deb: {e}")))?;

    // 2b) Vérification d'intégrité SHA-256 (empreinte publiée par GitHub). Échec DUR
    //     en cas de divergence ; simple avertissement si aucune empreinte n'est fournie.
    set_phase(id, "verifying", "Vérification de l'intégrité…");
    match asset.sha256.as_deref() {
        Some(expected) => {
            let actual = sha256_hex(&bytes);
            if actual != expected {
                tracing::error!(module_id = %id, expected, actual, "Marketplace : SHA-256 non conforme — installation refusée");
                return Err(AppError::Internal(anyhow::anyhow!(
                    "intégrité du .deb non vérifiée (SHA-256 attendu {expected}, obtenu {actual})"
                )));
            }
            tracing::info!(module_id = %id, sha256 = %actual, "Marketplace : intégrité SHA-256 vérifiée");
        }
        None => tracing::warn!(module_id = %id, "Marketplace : aucune empreinte SHA-256 publiée — intégrité non vérifiée"),
    }

    // 3) Staging dans le store (inscriptible par le core).
    let install_dir = PathBuf::from(&settings.server.modules_install_dir);
    let staging = install_dir.join(".staging").join(id);
    let _ = tokio::fs::remove_dir_all(&staging).await;
    tokio::fs::create_dir_all(&staging)
        .await
        .map_err(|e| AppError::Internal(anyhow::anyhow!("création staging {}: {e}", staging.display())))?;
    let pkg_path = staging.join("artifact");
    tokio::fs::write(&pkg_path, &bytes)
        .await
        .map_err(|e| AppError::Internal(anyhow::anyhow!("écriture artefact: {e}")))?;

    // 4) Extraction selon le format (.deb → dpkg-deb, .tar.gz → tar, .zip → crate zip).
    set_phase(id, "extracting", "Extraction du paquet…");
    let extract = staging.join("extract");
    tokio::fs::create_dir_all(&extract)
        .await
        .map_err(|e| AppError::Internal(anyhow::anyhow!("création extract: {e}")))?;
    extract_artifact(asset.kind, &pkg_path, &extract).await?;

    // 5) Relocalisation du dossier module → store/<id> (self-contained). On localise le
    //    dossier du module quel que soit le layout de l'archive (deb imbriqué ou plat).
    let src_mod = find_module_root(&extract, id).ok_or_else(|| {
        AppError::Internal(anyhow::anyhow!("artefact invalide : module.toml introuvable pour « {id} »"))
    })?;
    let dest_mod = install_dir.join(id);
    let _ = tokio::fs::remove_dir_all(&dest_mod).await;
    // rename intra-fs (staging et dest sont tous deux sous modules_install_dir).
    tokio::fs::rename(&src_mod, &dest_mod)
        .await
        .map_err(|e| AppError::Internal(anyhow::anyhow!("relocalisation module: {e}")))?;

    // 6) Config → modules_config_dir/<id> (best-effort : /etc peut être non inscriptible).
    let mut config_written = false;
    let src_cfg = extract.join("etc/kubuno/modules").join(id);
    if src_cfg.is_dir() {
        let dest_cfg = Path::new(&settings.server.modules_config_dir).join(id);
        match copy_dir_all(&src_cfg, &dest_cfg) {
            Ok(_) => config_written = true,
            Err(e) => tracing::warn!(module_id = %id, dir = %dest_cfg.display(), error = %e,
                "Config du module non écrite (permissions ?) — démarrage avec les valeurs par défaut"),
        }
    }

    // 7) Nettoyage du staging.
    let _ = tokio::fs::remove_dir_all(install_dir.join(".staging")).await;

    // 8) Parse du manifeste relocalisé (les dépendances y figurent).
    let toml_str = tokio::fs::read_to_string(dest_mod.join("module.toml"))
        .await
        .map_err(|e| AppError::Internal(anyhow::anyhow!("lecture module.toml: {e}")))?;
    let manifest: crate::modules::manifest::ModuleManifest = toml::from_str(&toml_str)
        .map_err(|e| AppError::Internal(anyhow::anyhow!("parse module.toml: {e}")))?;

    Ok(Materialized {
        dest_mod,
        manifest,
        name: detail.name,
        version: detail.version,
        config_written,
    })
}

/// Installe un module et, RÉCURSIVEMENT, ses dépendances manquantes AVANT de le
/// démarrer (dépendances d'abord). `visited` protège des cycles ; `depth` borne la
/// profondeur. Chaque module traverse la même garde de confiance (via `materialize`).
fn install_node<'a>(
    settings: Arc<Settings>,
    db: PgPool,
    id: &'a str,
    visited: &'a mut std::collections::HashSet<String>,
    depth: usize,
) -> std::pin::Pin<Box<dyn std::future::Future<Output = Result<InstallReport, AppError>> + Send + 'a>> {
    Box::pin(async move {
        if depth > 16 {
            return Err(AppError::Validation("chaîne de dépendances trop profonde".into()));
        }

        // 1) Matérialise CE module (téléchargement/extraction/relocalisation).
        let mat = materialize(&settings, id).await?;
        let deps = mat.manifest.module.dependencies.clone();

        // 2) Installe les dépendances absentes du disque, AVANT de démarrer ce module.
        for dep in &deps {
            if dep == id || is_available(&settings, dep) {
                continue;
            }
            if !visited.insert(dep.clone()) {
                continue; // cycle ou déjà en cours d'installation
            }
            set_phase(id, "dependencies", &format!("Installation de la dépendance « {dep} »…"));
            tracing::info!(module_id = %id, dependency = %dep, "Marketplace : installation d'une dépendance manquante");
            install_node(settings.clone(), db.clone(), dep, &mut *visited, depth + 1).await?;
        }

        // 3) Démarre ce module (à chaud).
        set_phase(id, "starting", "Démarrage du module…");
        let started = crate::modules::manager::spawn_module(
            settings.clone(), mat.dest_mod.clone(), mat.manifest, db.clone(),
        ).await;
        tracing::info!(module_id = %id, version = %mat.version, started, "Marketplace : module installé");

        Ok(InstallReport {
            id: id.to_string(),
            name: mat.name,
            version: mat.version,
            path: mat.dest_mod.display().to_string(),
            started,
            config_written: mat.config_written,
            dependencies: deps,
        })
    })
}

/// Installe (ou met à jour) un module depuis la marketplace, avec ses dépendances.
pub async fn install(settings: Arc<Settings>, db: PgPool, id: &str) -> Result<InstallReport, AppError> {
    validate_id(id)?;
    let mut visited = std::collections::HashSet::new();
    visited.insert(id.to_string());
    install_node(settings, db, id, &mut visited, 0).await
}

/// `true` si le module `id` a été installé via la marketplace (présent dans le store,
/// donc désinstallable). Les paquets système (`/usr/lib`) ne le sont pas ici.
pub fn is_store_installed(settings: &Settings, id: &str) -> bool {
    Path::new(&settings.server.modules_install_dir).join(id).is_dir()
}

/// Désinstalle un module installé depuis la marketplace : arrête le process, retire
/// les fichiers du store et purge la DB. N'agit QUE sur les modules du store (les
/// paquets système restent intacts).
pub async fn uninstall(settings: Arc<Settings>, db: PgPool, id: &str) -> Result<(), AppError> {
    validate_id(id)?;
    let store_dir = PathBuf::from(&settings.server.modules_install_dir).join(id);
    if !store_dir.is_dir() {
        return Err(AppError::Validation(format!(
            "« {id} » n'est pas un module installé depuis la marketplace (non désinstallable ici)"
        )));
    }

    // 1) Arrêt de la supervision + kill du process, puis court délai pour la propagation.
    let stopped = crate::modules::manager::stop_module(id);
    tracing::info!(module_id = %id, stopped, "Marketplace : arrêt du module avant désinstallation");
    tokio::time::sleep(std::time::Duration::from_millis(300)).await;

    // 2) Suppression des fichiers du store.
    tokio::fs::remove_dir_all(&store_dir)
        .await
        .map_err(|e| AppError::Internal(anyhow::anyhow!("suppression {}: {e}", store_dir.display())))?;

    // 3) Purge DB (instances + réglages semés + métadonnées).
    let _ = sqlx::query("DELETE FROM core.module_instances WHERE module_id = $1").bind(id).execute(&db).await;
    let _ = sqlx::query("DELETE FROM core.settings WHERE module_id = $1").bind(id).execute(&db).await;
    sqlx::query("DELETE FROM core.modules WHERE id = $1")
        .bind(id)
        .execute(&db)
        .await
        .map_err(|e| { tracing::error!(module_id = %id, error = %e, "uninstall: purge core.modules"); e })?;

    tracing::info!(module_id = %id, "Marketplace : module désinstallé");
    Ok(())
}
