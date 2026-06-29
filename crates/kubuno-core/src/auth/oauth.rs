use anyhow::Context;
use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine};
use rand::Rng;
use serde::Deserialize;
use sha2::{Digest, Sha256};
use std::collections::HashMap;
use std::sync::{OnceLock, RwLock};
use std::time::{Duration, Instant};

// ── Secret encryption key ───────────────────────────────────────────────────
// Client secrets are stored AES-256-GCM encrypted; the key is derived from the
// JWT secret with domain separation (same pattern as TOTP secrets).
pub fn secret_key(jwt_secret: &str) -> [u8; 32] {
    let mut h = Sha256::new();
    h.update(b"kubuno:oidc:");
    h.update(jwt_secret.as_bytes());
    h.finalize().into()
}

// ── PKCE + state ──────────────────────────────────────────────────────────────

pub struct OAuthPkce {
    pub nonce:         String,
    pub code_verifier: String,
}

impl OAuthPkce {
    pub fn generate() -> Self {
        let nonce_bytes: Vec<u8> = rand::thread_rng()
            .sample_iter(rand::distributions::Standard)
            .take(24)
            .collect();
        let verifier_bytes: Vec<u8> = rand::thread_rng()
            .sample_iter(rand::distributions::Standard)
            .take(32)
            .collect();
        Self {
            nonce:         URL_SAFE_NO_PAD.encode(&nonce_bytes),
            code_verifier: URL_SAFE_NO_PAD.encode(&verifier_bytes),
        }
    }

    pub fn code_challenge(&self) -> String {
        URL_SAFE_NO_PAD.encode(Sha256::digest(self.code_verifier.as_bytes()))
    }

    /// Sérialisé dans le cookie HttpOnly `oauth_pkce`.
    pub fn to_cookie_value(&self) -> String {
        format!("{}:{}", self.nonce, self.code_verifier)
    }

    pub fn from_cookie_value(s: &str) -> Option<Self> {
        let (nonce, verifier) = s.split_once(':')?;
        Some(Self {
            nonce:         nonce.to_string(),
            code_verifier: verifier.to_string(),
        })
    }
}

// ── OIDC discovery (.well-known/openid-configuration) ───────────────────────────
// Provider-agnostic: works for Keycloak, GitLab, Authentik, Okta, Zitadel, etc.
// Results are cached per issuer for an hour to avoid hammering the IdP.

#[derive(Debug, Clone, Deserialize)]
pub struct OidcDiscovery {
    pub authorization_endpoint: String,
    pub token_endpoint:         String,
    pub userinfo_endpoint:      String,
    #[serde(default)]
    pub end_session_endpoint:   Option<String>,
}

fn discovery_cache() -> &'static RwLock<HashMap<String, (OidcDiscovery, Instant)>> {
    static CACHE: OnceLock<RwLock<HashMap<String, (OidcDiscovery, Instant)>>> = OnceLock::new();
    CACHE.get_or_init(|| RwLock::new(HashMap::new()))
}

const DISCOVERY_TTL: Duration = Duration::from_secs(3600);

pub async fn discover(client: &reqwest::Client, issuer_url: &str) -> anyhow::Result<OidcDiscovery> {
    let issuer = issuer_url.trim_end_matches('/').to_string();

    if let Some((disc, fetched_at)) = discovery_cache()
        .read()
        .ok()
        .and_then(|m| m.get(&issuer).cloned())
    {
        if fetched_at.elapsed() < DISCOVERY_TTL {
            return Ok(disc);
        }
    }

    let url = format!("{issuer}/.well-known/openid-configuration");
    let resp = client
        .get(&url)
        .send()
        .await
        .context("Appel discovery OIDC échoué")?;
    if !resp.status().is_success() {
        let body = resp.text().await.unwrap_or_default();
        return Err(anyhow::anyhow!("Discovery OIDC ({issuer}): {body}"));
    }
    let disc: OidcDiscovery = resp.json().await.context("Document discovery OIDC invalide")?;

    if let Ok(mut m) = discovery_cache().write() {
        m.insert(issuer, (disc.clone(), Instant::now()));
    }
    Ok(disc)
}

// ── Authorization URL ───────────────────────────────────────────────────────────

pub fn oidc_auth_url(
    disc:         &OidcDiscovery,
    client_id:    &str,
    scopes:       &str,
    redirect_uri: &str,
    pkce:         &OAuthPkce,
) -> anyhow::Result<String> {
    let mut url = url::Url::parse(&disc.authorization_endpoint)
        .context("authorization_endpoint invalide")?;
    url.query_pairs_mut()
        .append_pair("client_id",             client_id)
        .append_pair("redirect_uri",          redirect_uri)
        .append_pair("response_type",         "code")
        .append_pair("scope",                 scopes)
        .append_pair("state",                 &pkce.nonce)
        .append_pair("code_challenge",        &pkce.code_challenge())
        .append_pair("code_challenge_method", "S256");
    Ok(url.to_string())
}

// ── Token exchange ────────────────────────────────────────────────────────────

#[derive(Deserialize)]
pub struct OidcTokenResponse {
    pub access_token: String,
}

#[allow(clippy::too_many_arguments)]
pub async fn oidc_exchange_code(
    client:        &reqwest::Client,
    disc:          &OidcDiscovery,
    client_id:     &str,
    client_secret: &str,
    code:          &str,
    redirect_uri:  &str,
    code_verifier: &str,
) -> anyhow::Result<OidcTokenResponse> {
    let mut form: Vec<(&str, &str)> = vec![
        ("grant_type",    "authorization_code"),
        ("client_id",     client_id),
        ("code",          code),
        ("redirect_uri",  redirect_uri),
        ("code_verifier", code_verifier),
    ];
    // Public clients (no secret) omit client_secret and rely on PKCE.
    if !client_secret.is_empty() {
        form.push(("client_secret", client_secret));
    }

    let resp = client
        .post(&disc.token_endpoint)
        .form(&form)
        .send()
        .await
        .context("Appel token OIDC échoué")?;

    if !resp.status().is_success() {
        let body = resp.text().await.unwrap_or_default();
        return Err(anyhow::anyhow!("OIDC token endpoint: {body}"));
    }

    resp.json::<OidcTokenResponse>()
        .await
        .context("Réponse token OIDC invalide")
}

// ── User info ─────────────────────────────────────────────────────────────────

#[derive(Deserialize)]
pub struct OidcUserInfo {
    pub sub:                String,
    pub email:              Option<String>,
    pub preferred_username: Option<String>,
    // GitLab exposes the handle as `nickname`; used as a fallback.
    #[serde(default)]
    pub nickname:           Option<String>,
    pub name:               Option<String>,
}

pub async fn oidc_userinfo(
    client:       &reqwest::Client,
    disc:         &OidcDiscovery,
    access_token: &str,
) -> anyhow::Result<OidcUserInfo> {
    let resp = client
        .get(&disc.userinfo_endpoint)
        .bearer_auth(access_token)
        .send()
        .await
        .context("Appel userinfo OIDC échoué")?;

    if !resp.status().is_success() {
        let body = resp.text().await.unwrap_or_default();
        return Err(anyhow::anyhow!("OIDC userinfo endpoint: {body}"));
    }

    resp.json::<OidcUserInfo>()
        .await
        .context("Réponse userinfo OIDC invalide")
}
