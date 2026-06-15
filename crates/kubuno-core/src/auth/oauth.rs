use anyhow::Context;
use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine};
use rand::Rng;
use serde::Deserialize;
use sha2::{Digest, Sha256};

// ── Keycloak config (from settings.toml / env vars) ──────────────────────────

#[derive(Debug, Clone)]
pub struct KeycloakConfig {
    pub issuer_url:    String,   // e.g. https://auth.example.com/realms/myrealm
    pub client_id:     String,
    pub client_secret: String,
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

// ── URL builder ───────────────────────────────────────────────────────────────

pub fn keycloak_auth_url(kc: &KeycloakConfig, redirect_uri: &str, pkce: &OAuthPkce) -> anyhow::Result<String> {
    let mut url = url::Url::parse(&format!("{}/protocol/openid-connect/auth", kc.issuer_url))
        .context("issuer_url Keycloak invalide")?;
    url.query_pairs_mut()
        .append_pair("client_id",             &kc.client_id)
        .append_pair("redirect_uri",          redirect_uri)
        .append_pair("response_type",         "code")
        .append_pair("scope",                 "openid email profile")
        .append_pair("state",                 &pkce.nonce)
        .append_pair("code_challenge",        &pkce.code_challenge())
        .append_pair("code_challenge_method", "S256");
    Ok(url.to_string())
}

// ── Token exchange ────────────────────────────────────────────────────────────

#[derive(Deserialize)]
pub struct KeycloakTokenResponse {
    pub access_token: String,
}

pub async fn keycloak_exchange_code(
    client:        &reqwest::Client,
    kc:            &KeycloakConfig,
    code:          &str,
    redirect_uri:  &str,
    code_verifier: &str,
) -> anyhow::Result<KeycloakTokenResponse> {
    let resp = client
        .post(format!("{}/protocol/openid-connect/token", kc.issuer_url))
        .form(&[
            ("grant_type",    "authorization_code"),
            ("client_id",     kc.client_id.as_str()),
            ("client_secret", kc.client_secret.as_str()),
            ("code",          code),
            ("redirect_uri",  redirect_uri),
            ("code_verifier", code_verifier),
        ])
        .send()
        .await
        .context("Appel token Keycloak échoué")?;

    if !resp.status().is_success() {
        let body = resp.text().await.unwrap_or_default();
        return Err(anyhow::anyhow!("Keycloak token endpoint: {body}"));
    }

    resp.json::<KeycloakTokenResponse>()
        .await
        .context("Réponse token Keycloak invalide")
}

// ── User info ─────────────────────────────────────────────────────────────────

#[derive(Deserialize)]
pub struct KeycloakUserInfo {
    pub sub:                String,
    pub email:              Option<String>,
    pub preferred_username: Option<String>,
    pub name:               Option<String>,
}

pub async fn keycloak_userinfo(
    client:       &reqwest::Client,
    kc:           &KeycloakConfig,
    access_token: &str,
) -> anyhow::Result<KeycloakUserInfo> {
    let resp = client
        .get(format!("{}/protocol/openid-connect/userinfo", kc.issuer_url))
        .bearer_auth(access_token)
        .send()
        .await
        .context("Appel userinfo Keycloak échoué")?;

    if !resp.status().is_success() {
        let body = resp.text().await.unwrap_or_default();
        return Err(anyhow::anyhow!("Keycloak userinfo endpoint: {body}"));
    }

    resp.json::<KeycloakUserInfo>()
        .await
        .context("Réponse userinfo Keycloak invalide")
}
