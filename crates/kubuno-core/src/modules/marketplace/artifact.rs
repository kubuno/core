//! Résolution de l'artefact installable dans les **Releases GitHub** du dépôt du
//! module, pour l'OS/arch sur lequel tourne le core.

use serde::Deserialize;

use crate::errors::AppError;

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
pub(super) enum ArtifactKind { Deb, TarGz, Zip }

pub(super) fn kind_from_name(name: &str) -> Option<ArtifactKind> {
    let n = name.to_ascii_lowercase();
    if n.ends_with(".deb") { Some(ArtifactKind::Deb) }
    else if n.ends_with(".tar.gz") || n.ends_with(".tgz") { Some(ArtifactKind::TarGz) }
    else if n.ends_with(".zip") { Some(ArtifactKind::Zip) }
    else { None }
}

/// Artefact résolu : URL + empreinte SHA-256 (si publiée) + format.
pub(super) struct Artifact {
    pub url:    String,
    pub sha256: Option<String>,
    pub kind:   ArtifactKind,
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
pub(super) async fn resolve_artifact(
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
