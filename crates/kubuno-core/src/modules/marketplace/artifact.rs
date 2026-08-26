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

/// Une URL d'artefact est-elle acceptable ?
///
/// HTTPS exigé : le catalogue est authentifié par sa signature, mais l'artefact
/// se télécharge ailleurs — en clair, n'importe qui sur le chemin le remplace.
/// L'empreinte le rattraperait, sauf qu'on ne veut pas dépendre d'un seul
/// rempart. Exception faite de la boucle locale, qui n'a pas de chemin réseau à
/// détourner et sans laquelle on ne peut pas éprouver le dispositif.
fn acceptable_url(url: &str) -> bool {
    if url.starts_with("https://") {
        return true;
    }
    url.starts_with("http://127.0.0.1")
        || url.starts_with("http://localhost")
        || url.starts_with("http://[::1]")
}

/// Traduit la recommandation du catalogue en artefact téléchargeable.
///
/// Le catalogue a déjà fait le tri pour la plateforme annoncée ; il reste à
/// vérifier que le core sait ouvrir ce format — refuser franchement vaut mieux
/// que télécharger cinquante mégaoctets pour buter dessus.
pub(super) fn from_recommendation(a: &crate::modules::marketplace::catalog::CatalogArtifact)
    -> Option<Artifact>
{
    if !acceptable_url(&a.url) {
        tracing::error!(url = %a.url, "Marketplace : artefact proposé hors HTTPS — ignoré");
        return None;
    }
    let kind = match a.kind.to_ascii_lowercase().as_str() {
        "kbpkg" | "zip" => ArtifactKind::Zip,
        "deb"           => ArtifactKind::Deb,
        "tar.gz" | "tgz" => ArtifactKind::TarGz,
        other => {
            tracing::warn!(kind = %other, asset = %a.filename,
                "Marketplace : format recommandé par le catalogue que le core ne sait pas ouvrir");
            return None;
        }
    };
    tracing::info!(asset = %a.filename, kind = %a.kind, "Marketplace : artefact recommandé par le catalogue");
    Some(Artifact { url: a.url.clone(), sha256: a.sha256.as_ref().map(|h| h.to_ascii_lowercase()), kind })
}

/// Choisit, parmi ce que le catalogue annonce, l'artefact installable ici.
///
/// Le catalogue dit ce que chaque module publie réellement ; il n'y a donc plus
/// à deviner d'après un nom de fichier. Deux refus explicites valent mieux qu'un
/// choix approximatif :
///   - un artefact d'une autre plateforme n'est jamais retenu ;
///   - un installateur système (`.exe`, `.rpm`, `.pkg`) n'est pas retenu non
///     plus : le core sait déballer une archive, pas piloter l'installateur d'un
///     système. Tant qu'un module ne publie que cela pour une plateforme,
///     l'installation depuis la console y est impossible — c'est précisément ce
///     que le format `.kbpkg` doit résoudre.
pub(super) fn from_catalogue(arts: &[crate::modules::marketplace::catalog::CatalogArtifact])
    -> Option<Artifact>
{
    let os   = std::env::consts::OS;
    let arch = std::env::consts::ARCH;

    // Par ordre de préférence : le format unique d'abord, puis les archives que
    // le core sait ouvrir.
    for wanted in ["kbpkg", "deb", "tar.gz", "zip"] {
        let Some(hit) = arts.iter().find(|a| {
            acceptable_url(&a.url)
                && a.kind.eq_ignore_ascii_case(wanted)
                && a.os.eq_ignore_ascii_case(os)
                && (a.arch.eq_ignore_ascii_case(arch) || a.arch.eq_ignore_ascii_case("universal"))
        }) else {
            continue; // ce format n'est pas publié ici : on essaie le suivant
        };
        // `kbpkg` est une archive ZIP ; les autres portent déjà leur format.
        let kind = match wanted {
            "kbpkg" | "zip" => ArtifactKind::Zip,
            "deb"           => ArtifactKind::Deb,
            _               => ArtifactKind::TarGz,
        };
        tracing::info!(
            asset = %hit.filename, kind = %hit.kind,
            "Marketplace : artefact désigné par le catalogue pour {os}/{arch}"
        );
        return Some(Artifact {
            url: hit.url.clone(),
            sha256: hit.sha256.as_ref().map(|h| h.to_ascii_lowercase()),
            kind,
        });
    }
    None
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

#[cfg(test)]
mod tests {
    use super::*;
    use crate::modules::marketplace::catalog::{CatalogArtifact, MarketModule};

    fn art(os: &str, arch: &str, kind: &str) -> CatalogArtifact {
        CatalogArtifact {
            os: os.into(), arch: arch.into(), kind: kind.into(),
            filename: format!("kubuno-drive.{kind}"),
            url: format!("https://example.test/kubuno-drive.{kind}"),
            size: 1, sha256: Some("ABCDEF".into()),
        }
    }

    /// The catalogue's own payload must deserialize, artefacts included —
    /// otherwise the server silently falls back to guessing.
    #[test]
    fn reads_a_real_catalogue_payload() {
        let json = include_str!("testdata/catalogue_drive.json");
        let m: MarketModule = serde_json::from_str(json).expect("payload du catalogue");
        assert_eq!(m.id, "drive");
        assert!(!m.artifacts.is_empty(), "les artefacts doivent être lus");
        assert!(m.artifacts.iter().any(|a| a.kind == "deb" && a.os == "linux"));
    }

    #[test]
    fn ignores_other_platforms() {
        let other = if std::env::consts::OS == "linux" { "windows" } else { "linux" };
        assert!(from_catalogue(&[art(other, std::env::consts::ARCH, "deb")]).is_none());
    }

    /// A module that only ships a system installer for this platform cannot be
    /// installed from the console: the server unpacks archives, it does not drive
    /// an operating system's installer.
    #[test]
    fn refuses_system_installers() {
        let os = std::env::consts::OS;
        let arch = std::env::consts::ARCH;
        assert!(from_catalogue(&[art(os, arch, "exe"), art(os, arch, "pkg"), art(os, arch, "rpm")]).is_none());
    }

    #[test]
    fn prefers_the_single_format_then_falls_back() {
        let os = std::env::consts::OS;
        let arch = std::env::consts::ARCH;
        let chosen = from_catalogue(&[art(os, arch, "deb"), art(os, arch, "kbpkg")]).expect("un artefact");
        assert!(chosen.url.ends_with(".kbpkg"), "le format unique passe avant le reste");
        assert_eq!(chosen.kind, ArtifactKind::Zip);
        // Sans kbpkg, une archive que le core sait ouvrir fait l'affaire.
        let fallback = from_catalogue(&[art(os, arch, "deb")]).expect("repli");
        assert_eq!(fallback.kind, ArtifactKind::Deb);
        // L'empreinte est normalisée en minuscules pour la comparaison.
        assert_eq!(fallback.sha256.as_deref(), Some("abcdef"));
    }

    #[test]
    fn accepts_a_universal_build() {
        let os = std::env::consts::OS;
        assert!(from_catalogue(&[art(os, "universal", "kbpkg")]).is_some());
    }
}

#[cfg(test)]
mod recommendation_tests {
    use super::*;
    use crate::modules::marketplace::catalog::MarketModule;

    /// The catalogue, asked from a given platform, answers about that platform:
    /// it narrows the list and names the artefact to install. The server must
    /// read that answer — otherwise it goes back to sorting things out itself.
    #[test]
    fn follows_the_catalogue_recommendation() {
        let json = include_str!("testdata/catalogue_drive_linux.json");
        let m: MarketModule = serde_json::from_str(json).expect("charge utile par plateforme");
        let rec = m.artifact.as_ref().expect("le catalogue recommande un artefact");
        assert_eq!(rec.os, "linux");
        let chosen = from_recommendation(rec).expect("format connu du core");
        assert_eq!(chosen.kind, ArtifactKind::Deb);
        assert!(chosen.url.ends_with(".deb"));
        assert!(chosen.sha256.is_some(), "l'empreinte accompagne la recommandation");
    }

    /// A system installer is never followed, even when recommended: the server
    /// unpacks archives, it does not drive an operating system's installer.
    #[test]
    fn declines_a_format_it_cannot_open() {
        let a = crate::modules::marketplace::catalog::CatalogArtifact {
            os: std::env::consts::OS.into(), arch: std::env::consts::ARCH.into(),
            kind: "pkg".into(), filename: "x.pkg".into(),
            url: "https://example.test/x.pkg".into(), size: 1, sha256: None,
        };
        assert!(from_recommendation(&a).is_none());
    }
}
