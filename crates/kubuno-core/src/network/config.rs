//! The instance's HTTP/HTTPS configuration, read from `core.settings`, and the
//! encryption of the one field that never travels in clear: the private key.
//!
//! The private key is stored as an AES-256-GCM blob keyed by a domain-separated
//! derivation of the JWT secret — the same construction the SMTP relay, the OIDC
//! client secrets and the LDAP service password use. The domains differ, so one
//! secret leaking never unlocks another.

use sha2::{Digest, Sha256};
use sqlx::PgPool;

use crate::{crypto::encryption, errors::AppError};

// ── Setting keys (declared by migration 000125) ──────────────────────────────
pub const KEY_HTTPS_ENABLED: &str = "network.https_enabled";
pub const KEY_HTTPS_PORT: &str = "network.https_port";
pub const KEY_HTTP_REDIRECT: &str = "network.http_redirect_to_https";
pub const KEY_HTTP_REDIRECT_PORT: &str = "network.http_redirect_port";
pub const KEY_TLS_MIN_VERSION: &str = "network.tls_min_version";
pub const KEY_HSTS_ENABLED: &str = "network.hsts_enabled";
pub const KEY_HSTS_MAX_AGE_DAYS: &str = "network.hsts_max_age_days";
pub const KEY_HSTS_INCLUDE_SUBDOMAINS: &str = "network.hsts_include_subdomains";
pub const KEY_HSTS_PRELOAD: &str = "network.hsts_preload";
pub const KEY_CERT_MODE: &str = "network.cert_mode";

/// Key used to encrypt a TLS private key at rest. Domain-separated from every
/// other subsystem's key so a leak stays contained.
pub fn secret_key(jwt_secret: &str) -> [u8; 32] {
    let mut h = Sha256::new();
    h.update(b"kubuno:tls:");
    h.update(jwt_secret.as_bytes());
    h.finalize().into()
}

/// Encrypts a private-key PEM for storage.
pub fn encrypt_key(jwt_secret: &str, key_pem: &str) -> Result<String, AppError> {
    encryption::encrypt(&secret_key(jwt_secret), key_pem.as_bytes()).map_err(AppError::Internal)
}

/// Decrypts a stored private-key blob.
///
/// A blob that no longer decrypts means the JWT secret was rotated: the instance
/// says so, once and loudly, and carries on in HTTP rather than refusing to
/// boot. The operator re-uploads the certificate from the console.
pub fn decrypt_key(jwt_secret: &str, blob: &str) -> Option<String> {
    match encryption::decrypt(&secret_key(jwt_secret), blob) {
        Ok(bytes) => Some(String::from_utf8_lossy(&bytes).into_owned()),
        Err(e) => {
            tracing::error!(
                error = %e,
                "réseau : clé privée TLS indéchiffrable (secret JWT changé ?) — le HTTPS ne démarrera pas tant qu'un certificat n'est pas ré-importé"
            );
            None
        }
    }
}

/// The minimum TLS version the core will accept. rustls cannot speak anything
/// older than 1.2 regardless, so this chooses between "1.2 and up" and "1.3
/// only".
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TlsMinVersion {
    V1_2,
    V1_3,
}

impl TlsMinVersion {
    pub fn from_setting(s: &str) -> Self {
        match s {
            "1.3" => Self::V1_3,
            _ => Self::V1_2,
        }
    }
}

/// HSTS parameters. The header is only ever emitted when the core actually
/// serves over HTTPS (an HSTS header on a plain-HTTP response is ignored by
/// browsers and, worse, misleading).
#[derive(Debug, Clone)]
pub struct HstsConfig {
    pub enabled: bool,
    pub max_age_days: i64,
    pub include_subdomains: bool,
    pub preload: bool,
}

impl HstsConfig {
    /// The `Strict-Transport-Security` value, or `None` when disabled.
    pub fn header_value(&self) -> Option<String> {
        if !self.enabled {
            return None;
        }
        let max_age = self.max_age_days.max(0) * 86_400;
        let mut v = format!("max-age={max_age}");
        if self.include_subdomains {
            v.push_str("; includeSubDomains");
        }
        if self.preload {
            v.push_str("; preload");
        }
        Some(v)
    }
}

/// The instance's whole HTTP/HTTPS configuration, resolved to concrete values.
#[derive(Debug, Clone)]
pub struct NetworkConfig {
    pub https_enabled: bool,
    pub https_port: u16,
    pub http_redirect_to_https: bool,
    pub http_redirect_port: u16,
    pub tls_min_version: TlsMinVersion,
    pub hsts: HstsConfig,
    pub cert_mode: String,
}

impl NetworkConfig {
    /// Reads every `network.*` key at the instance scope, each with the factory
    /// default the migration declared as a fallback. Never fails: an unreadable
    /// setting takes the safe default rather than the instance down.
    pub async fn load(db: &PgPool) -> Self {
        async fn bool_of(db: &PgPool, key: &str, default: bool) -> bool {
            crate::settings::instance_value(db, key)
                .await
                .and_then(|v| v.as_bool())
                .unwrap_or(default)
        }
        async fn int_of(db: &PgPool, key: &str, default: i64) -> i64 {
            crate::settings::instance_value(db, key)
                .await
                .and_then(|v| v.as_i64())
                .unwrap_or(default)
        }
        async fn str_of(db: &PgPool, key: &str, default: &str) -> String {
            crate::settings::instance_value(db, key)
                .await
                .and_then(|v| v.as_str().map(str::to_string))
                .unwrap_or_else(|| default.to_string())
        }

        // A port stored out of range falls back to its default rather than
        // wrapping to a nonsense value.
        let port = |n: i64, default: u16| -> u16 {
            u16::try_from(n).ok().filter(|p| *p > 0).unwrap_or(default)
        };

        NetworkConfig {
            https_enabled: bool_of(db, KEY_HTTPS_ENABLED, false).await,
            https_port: port(int_of(db, KEY_HTTPS_PORT, 8443).await, 8443),
            http_redirect_to_https: bool_of(db, KEY_HTTP_REDIRECT, false).await,
            http_redirect_port: port(int_of(db, KEY_HTTP_REDIRECT_PORT, 80).await, 80),
            tls_min_version: TlsMinVersion::from_setting(
                &str_of(db, KEY_TLS_MIN_VERSION, "1.2").await,
            ),
            hsts: HstsConfig {
                enabled: bool_of(db, KEY_HSTS_ENABLED, true).await,
                max_age_days: int_of(db, KEY_HSTS_MAX_AGE_DAYS, 365).await,
                include_subdomains: bool_of(db, KEY_HSTS_INCLUDE_SUBDOMAINS, true).await,
                preload: bool_of(db, KEY_HSTS_PRELOAD, false).await,
            },
            cert_mode: str_of(db, KEY_CERT_MODE, "manual").await,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn the_key_round_trips_and_the_blob_hides_it() {
        let jwt = "un-secret-jwt-suffisamment-long-pour-le-test";
        let pem = "-----BEGIN PRIVATE KEY-----\nAAAA\n-----END PRIVATE KEY-----\n";
        let blob = encrypt_key(jwt, pem).expect("chiffrement");
        assert!(!blob.contains("BEGIN PRIVATE KEY"));
        assert_eq!(decrypt_key(jwt, &blob).as_deref(), Some(pem));
    }

    #[test]
    fn a_blob_from_another_secret_yields_none() {
        let pem = "-----BEGIN PRIVATE KEY-----\nAAAA\n-----END PRIVATE KEY-----\n";
        let blob = encrypt_key("le-premier-secret-jwt-assez-long", pem).expect("chiffrement");
        assert_eq!(decrypt_key("un-tout-autre-secret-jwt-long", &blob), None);
    }

    #[test]
    fn the_tls_key_differs_from_the_ldap_key() {
        let jwt = "le-meme-secret-pour-les-deux-sous-systemes";
        assert_ne!(secret_key(jwt), crate::directory::config::secret_key(jwt));
    }

    #[test]
    fn hsts_header_is_built_from_its_parts() {
        let h = HstsConfig {
            enabled: true,
            max_age_days: 365,
            include_subdomains: true,
            preload: false,
        };
        assert_eq!(
            h.header_value().as_deref(),
            Some("max-age=31536000; includeSubDomains")
        );
        let off = HstsConfig {
            enabled: false,
            ..h.clone()
        };
        assert_eq!(off.header_value(), None);
    }
}
