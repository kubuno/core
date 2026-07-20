//! Marketplace : catalogue distant + installation de modules à l'exécution.
//!
//! Le catalogue est servi par kubuno.com (`GET /api/v1/modules[/:id]`, User-Agent
//! requis). Les artefacts installables (`.deb`) vivent dans les **Releases GitHub**
//! du dépôt de chaque module (CI officielle). L'installation :
//!   1. résout le dépôt + la version via le catalogue,
//!   2. résout l'asset `.deb` de la release GitHub correspondante,
//!   3. télécharge, extrait (`dpkg-deb -x`) et relocalise dans le **store**
//!      inscriptible par le core (`modules_install_dir`),
//!   4. synchronise la DB et lance le module à chaud (`manager::spawn_module`).
//!
//! Sécurité : réservé aux admins (côté handler), HTTPS uniquement, et restreint aux
//! modules **officiels** hébergés sous `github.com/kubuno/`.

use std::path::{Path, PathBuf};
use std::sync::Arc;

use serde::{Deserialize, Serialize};
use sqlx::PgPool;

use crate::{config::Settings, errors::AppError};

const CATALOG_BASE: &str = "https://www.kubuno.com/api/v1/modules";
const USER_AGENT: &str = "Kubuno-Core/marketplace";
const TRUSTED_REPO_PREFIX: &str = "https://github.com/kubuno/";

// ── Suivi de progression d'installation (en mémoire) ─────────────────────────
// L'installation tourne en tâche de fond ; le frontend interroge l'état via
// `GET /admin/marketplace/:id/status`. Phases : resolving → downloading →
// verifying → extracting → starting → done | error.

use std::sync::{Mutex, OnceLock};

#[derive(Debug, Clone, Serialize)]
pub struct InstallProgress {
    pub phase:   String,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub report:  Option<InstallReport>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error:   Option<String>,
}

static PROGRESS: OnceLock<Mutex<std::collections::HashMap<String, InstallProgress>>> = OnceLock::new();
fn progress_map() -> &'static Mutex<std::collections::HashMap<String, InstallProgress>> {
    PROGRESS.get_or_init(|| Mutex::new(std::collections::HashMap::new()))
}

fn set_phase(id: &str, phase: &str, message: &str) {
    if let Ok(mut m) = progress_map().lock() {
        m.insert(id.to_string(), InstallProgress {
            phase: phase.to_string(), message: message.to_string(), report: None, error: None,
        });
    }
}

/// État courant d'une installation (None si aucune n'a été lancée pour cet id).
pub fn get_progress(id: &str) -> Option<InstallProgress> {
    progress_map().lock().ok().and_then(|m| m.get(id).cloned())
}

/// Marque une installation « en file d'attente » (avant de lancer la tâche de fond).
pub fn begin(id: &str) {
    set_phase(id, "queued", "En file d'attente…");
}

/// Marque l'installation terminée (avec le rapport) ou échouée (avec l'erreur).
pub fn finish_progress(id: &str, result: &Result<InstallReport, AppError>) {
    if let Ok(mut m) = progress_map().lock() {
        let entry = match result {
            Ok(r)  => InstallProgress { phase: "done".into(),  message: "Installé".into(),
                                        report: Some(r.clone()), error: None },
            Err(e) => InstallProgress { phase: "error".into(), message: "Échec".into(),
                                        report: None, error: Some(e.to_string()) },
        };
        m.insert(id.to_string(), entry);
    }
}

// ── Modèles du catalogue ─────────────────────────────────────────────────────

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct MarketLinks {
    #[serde(rename = "self", default)]
    pub self_url: Option<String>,
    #[serde(default)]
    pub html: Option<String>,
    #[serde(default)]
    pub repo: Option<String>,
    #[serde(default)]
    pub homepage: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MarketModule {
    pub id:      String,
    pub name:    String,
    pub version: String,
    #[serde(default)]
    pub author:      Option<String>,
    #[serde(default)]
    pub official:    bool,
    #[serde(default)]
    pub category:    Option<String>,
    #[serde(default)]
    pub accent:      Option<String>,
    #[serde(default)]
    pub summary:     Option<String>,
    #[serde(default)]
    pub description: Option<String>,
    #[serde(default)]
    pub license:     Option<String>,
    #[serde(default)]
    pub tags:        Vec<String>,
    #[serde(default)]
    pub rating:      Option<f64>,
    #[serde(default)]
    pub updated:     Option<String>,
    #[serde(default)]
    pub links:       MarketLinks,
    /// URL directe de l'artefact `.deb` servi par la marketplace. ABSENTE aujourd'hui
    /// (le catalogue ne fournit que des métadonnées → on résout la Release GitHub) ;
    /// quand kubuno.com servira les artefacts, il suffira que le détail expose ce champ
    /// (+ `sha256`) pour que le core télécharge directement, SANS modification.
    #[serde(default, alias = "artifact_url", alias = "download")]
    pub download_url: Option<String>,
    /// Empreinte SHA-256 hex de l'artefact `download_url` (vérification d'intégrité).
    #[serde(default, alias = "sha256sum", alias = "checksum")]
    pub sha256:       Option<String>,
}

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

// ── Client HTTP ──────────────────────────────────────────────────────────────

fn client() -> Result<reqwest::Client, AppError> {
    reqwest::Client::builder()
        .user_agent(USER_AGENT)
        .timeout(std::time::Duration::from_secs(60))
        .build()
        .map_err(|e| AppError::Internal(anyhow::anyhow!("client HTTP marketplace: {e}")))
}

#[derive(Deserialize)]
struct Envelope<T> {
    data: T,
}

/// Récupère le catalogue complet des modules disponibles.
pub async fn fetch_catalog() -> Result<Vec<MarketModule>, AppError> {
    let resp = client()?
        .get(CATALOG_BASE)
        .send()
        .await
        .map_err(|e| AppError::Internal(anyhow::anyhow!("appel catalogue marketplace: {e}")))?;
    if !resp.status().is_success() {
        return Err(AppError::Internal(anyhow::anyhow!(
            "catalogue marketplace: statut {}",
            resp.status()
        )));
    }
    let env: Envelope<Vec<MarketModule>> = resp
        .json()
        .await
        .map_err(|e| AppError::Internal(anyhow::anyhow!("parse catalogue marketplace: {e}")))?;
    Ok(env.data)
}

/// Récupère le détail d'un module du catalogue.
pub async fn fetch_detail(id: &str) -> Result<MarketModule, AppError> {
    validate_id(id)?;
    let url = format!("{CATALOG_BASE}/{id}");
    let resp = client()?
        .get(&url)
        .send()
        .await
        .map_err(|e| AppError::Internal(anyhow::anyhow!("appel détail marketplace: {e}")))?;
    if resp.status() == reqwest::StatusCode::NOT_FOUND {
        return Err(AppError::NotFound(format!("module marketplace « {id} »")));
    }
    if !resp.status().is_success() {
        return Err(AppError::Internal(anyhow::anyhow!(
            "détail marketplace: statut {}",
            resp.status()
        )));
    }
    let env: Envelope<MarketModule> = resp
        .json()
        .await
        .map_err(|e| AppError::Internal(anyhow::anyhow!("parse détail marketplace: {e}")))?;
    Ok(env.data)
}

// ── Résolution de l'asset .deb (Releases GitHub) ─────────────────────────────

#[derive(Deserialize)]
struct GhAsset {
    name: String,
    browser_download_url: String,
    /// Empreinte fournie par GitHub, format `sha256:<hex>` (peut être absente sur
    /// d'anciennes releases).
    #[serde(default)]
    digest: Option<String>,
}
#[derive(Deserialize)]
struct GhRelease {
    #[serde(default)]
    assets: Vec<GhAsset>,
}

/// Extrait `owner/repo` d'une URL `https://github.com/owner/repo`.
fn parse_owner_repo(repo_url: &str) -> Option<(String, String)> {
    let rest = repo_url.strip_prefix("https://github.com/")?;
    let rest = rest.trim_end_matches('/').trim_end_matches(".git");
    let mut it = rest.split('/');
    let owner = it.next()?.to_string();
    let name = it.next()?.to_string();
    if owner.is_empty() || name.is_empty() {
        return None;
    }
    Some((owner, name))
}

/// Format d'un artefact de module, déduit de l'extension du fichier.
#[derive(Debug, Clone, Copy, PartialEq)]
enum ArtifactKind { Deb, TarGz, Zip }

fn kind_from_name(name: &str) -> Option<ArtifactKind> {
    let n = name.to_ascii_lowercase();
    if n.ends_with(".deb") { Some(ArtifactKind::Deb) }
    else if n.ends_with(".tar.gz") || n.ends_with(".tgz") { Some(ArtifactKind::TarGz) }
    else if n.ends_with(".zip") { Some(ArtifactKind::Zip) }
    else { None }
}

/// Artefact résolu : URL + empreinte SHA-256 (si publiée) + format.
struct Artifact {
    url:    String,
    sha256: Option<String>,
    kind:   ArtifactKind,
}

/// Suffixes de nom d'asset acceptés pour l'OS/arch **du core**, par ordre de
/// préférence. Le téléchargement dépend donc de la plateforme d'exécution du core
/// (Windows → binaires Windows, macOS → macOS, Linux → .deb/tar.gz).
fn os_artifact_suffixes() -> Vec<String> {
    let arch = std::env::consts::ARCH; // "x86_64" | "aarch64" | …
    match std::env::consts::OS {
        "linux" => {
            let deb = match arch { "x86_64" => "amd64", "aarch64" => "arm64", a => a };
            vec![
                format!("_{deb}.deb"),
                format!("-linux-{arch}.tar.gz"), format!("-linux-{arch}.tgz"),
                format!("-linux-{deb}.tar.gz"),
            ]
        }
        "windows" => {
            let w = match arch { "x86_64" => "x64", "aarch64" => "arm64", a => a };
            vec![
                format!("-windows-{w}.zip"), format!("-windows-{arch}.zip"),
                format!("-win-{w}.zip"),
                format!("-windows-{w}.tar.gz"), format!("-windows-{arch}.tar.gz"),
            ]
        }
        "macos" => {
            let m = match arch { "x86_64" => "x86_64", "aarch64" => "arm64", a => a };
            vec![
                format!("-macos-{m}.tar.gz"), format!("-darwin-{m}.tar.gz"),
                format!("-macos-{m}.zip"),    format!("-darwin-{m}.zip"),
            ]
        }
        _ => vec![],
    }
}

/// Résout l'artefact adapté à l'OS/arch du core pour `repo` à la `version` donnée.
/// Tente d'abord la release taguée `v<version>`, puis se rabat sur la dernière release.
async fn resolve_artifact(
    http: &reqwest::Client,
    repo_url: &str,
    version: &str,
) -> Result<Artifact, AppError> {
    let (owner, name) = parse_owner_repo(repo_url)
        .ok_or_else(|| AppError::Validation(format!("dépôt invalide : {repo_url}")))?;
    let suffixes = os_artifact_suffixes();
    if suffixes.is_empty() {
        return Err(AppError::Validation(format!(
            "OS non supporté par la marketplace : {}", std::env::consts::OS
        )));
    }

    let candidates = [
        format!("https://api.github.com/repos/{owner}/{name}/releases/tags/v{version}"),
        format!("https://api.github.com/repos/{owner}/{name}/releases/latest"),
    ];

    for url in candidates {
        let resp = match http.get(&url).send().await {
            Ok(r) if r.status().is_success() => r,
            _ => continue,
        };
        let rel: GhRelease = match resp.json().await {
            Ok(r) => r,
            Err(_) => continue,
        };
        // Cherche, dans l'ordre de préférence, un asset dont le nom finit par un
        // suffixe attendu pour cet OS/arch.
        for suf in &suffixes {
            if let Some(a) = rel.assets.iter().find(|a| a.name.to_ascii_lowercase().ends_with(suf.as_str())) {
                let kind = kind_from_name(&a.name)
                    .ok_or_else(|| AppError::Internal(anyhow::anyhow!("format d'asset inconnu : {}", a.name)))?;
                let sha256 = a.digest.as_deref()
                    .and_then(|d| d.strip_prefix("sha256:"))
                    .map(|h| h.to_ascii_lowercase());
                tracing::info!(module = %name, asset = %a.name, "Marketplace : artefact choisi pour {}/{}", std::env::consts::OS, std::env::consts::ARCH);
                return Ok(Artifact { url: a.browser_download_url.clone(), sha256, kind });
            }
        }
    }
    Err(AppError::NotFound(format!(
        "aucun artefact {}/{} dans les releases de {owner}/{name}",
        std::env::consts::OS, std::env::consts::ARCH
    )))
}

/// Extrait un artefact selon son format vers `dest`.
async fn extract_artifact(kind: ArtifactKind, file: &Path, dest: &Path) -> Result<(), AppError> {
    match kind {
        ArtifactKind::Deb => {
            let out = tokio::process::Command::new("dpkg-deb")
                .arg("-x").arg(file).arg(dest)
                .output().await
                .map_err(|e| AppError::Internal(anyhow::anyhow!("lancement dpkg-deb: {e}")))?;
            if !out.status.success() {
                return Err(AppError::Internal(anyhow::anyhow!("dpkg-deb: {}", String::from_utf8_lossy(&out.stderr))));
            }
        }
        ArtifactKind::TarGz => {
            let out = tokio::process::Command::new("tar")
                .arg("-xzf").arg(file).arg("-C").arg(dest)
                .output().await
                .map_err(|e| AppError::Internal(anyhow::anyhow!("lancement tar: {e}")))?;
            if !out.status.success() {
                return Err(AppError::Internal(anyhow::anyhow!("tar: {}", String::from_utf8_lossy(&out.stderr))));
            }
        }
        ArtifactKind::Zip => {
            // Extraction Rust pure (crate `zip`) → pas d'outil externe (portable Windows).
            let (file, dest) = (file.to_path_buf(), dest.to_path_buf());
            tokio::task::spawn_blocking(move || -> Result<(), AppError> {
                let f = std::fs::File::open(&file)
                    .map_err(|e| AppError::Internal(anyhow::anyhow!("ouverture zip: {e}")))?;
                let mut ar = zip::ZipArchive::new(f)
                    .map_err(|e| AppError::Internal(anyhow::anyhow!("lecture zip: {e}")))?;
                ar.extract(&dest)
                    .map_err(|e| AppError::Internal(anyhow::anyhow!("extraction zip: {e}")))?;
                Ok(())
            })
            .await
            .map_err(|e| AppError::Internal(anyhow::anyhow!("tâche extraction zip: {e}")))??;
        }
    }
    Ok(())
}

/// Localise le dossier du module `id` dans l'arbre extrait — gère le layout `.deb`
/// (`usr/lib/kubuno/modules/<id>`) ET un layout plat (`<id>/` ou racine), en se
/// repérant sur la présence de `module.toml`.
fn find_module_root(extract: &Path, id: &str) -> Option<PathBuf> {
    for cand in [
        extract.join("usr/lib/kubuno/modules").join(id),
        extract.join("usr/local/kubuno/modules").join(id),
        extract.join("modules").join(id),
        extract.join(id),
        extract.to_path_buf(),
    ] {
        if cand.join("module.toml").is_file() {
            return Some(cand);
        }
    }
    // Recherche bornée d'un dossier contenant `module.toml`.
    find_toml_dir(extract, 5)
}

fn find_toml_dir(dir: &Path, depth: usize) -> Option<PathBuf> {
    if depth == 0 { return None; }
    let entries = std::fs::read_dir(dir).ok()?;
    let mut subdirs = Vec::new();
    for e in entries.flatten() {
        let p = e.path();
        if p.is_dir() { subdirs.push(p); }
    }
    for d in &subdirs {
        if d.join("module.toml").is_file() {
            return Some(d.clone());
        }
    }
    for d in &subdirs {
        if let Some(found) = find_toml_dir(d, depth - 1) {
            return Some(found);
        }
    }
    None
}

/// Calcule le SHA-256 hex d'un buffer.
fn sha256_hex(bytes: &[u8]) -> String {
    use sha2::{Digest, Sha256};
    let mut h = Sha256::new();
    h.update(bytes);
    hex::encode(h.finalize())
}

// ── Utilitaires ──────────────────────────────────────────────────────────────

/// Valide un id de module (anti-traversée) : alphanumériques, `-`, `_`.
pub fn validate_id(id: &str) -> Result<(), AppError> {
    if id.is_empty()
        || id.len() > 50
        || !id.chars().all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_')
    {
        return Err(AppError::Validation(format!("id de module invalide : « {id} »")));
    }
    Ok(())
}

/// Copie récursive d'un dossier (best-effort, utilisée pour la config en /etc).
fn copy_dir_all(src: &Path, dst: &Path) -> std::io::Result<()> {
    std::fs::create_dir_all(dst)?;
    for entry in std::fs::read_dir(src)? {
        let entry = entry?;
        let ty = entry.file_type()?;
        let to = dst.join(entry.file_name());
        if ty.is_dir() {
            copy_dir_all(&entry.path(), &to)?;
        } else {
            std::fs::copy(entry.path(), &to)?;
        }
    }
    Ok(())
}

// ── Installation ─────────────────────────────────────────────────────────────

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
