//! Catalogue distant : client HTTP partagé, modèles et lectures du registre
//! servi par kubuno.com (`GET /api/v1/modules[/:id]`).

use serde::{Deserialize, Serialize};

use crate::errors::AppError;

const CATALOG_BASE: &str = "https://www.kubuno.com/api/v1/modules";
const USER_AGENT: &str = "Kubuno-Core/marketplace";

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

// ── Client HTTP ──────────────────────────────────────────────────────────────

pub(super) fn client() -> Result<reqwest::Client, AppError> {
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
