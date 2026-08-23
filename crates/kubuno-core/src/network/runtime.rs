//! The live TLS state the running server holds, and the one place a rustls
//! `ServerConfig` is built.
//!
//! rustls is the sole TLS engine. This module never touches key bytes beyond
//! handing them to rustls, and rustls categorically cannot negotiate SSLv3 /
//! TLS 1.0 / TLS 1.1 — so the "disable the old protocols" hardening an Apache
//! operator applies by hand is, here, structural.

use std::sync::{Arc, RwLock};

use axum::http::HeaderValue;
use axum_server::tls_rustls::RustlsConfig;
use rustls::ServerConfig;
use rustls::pki_types::{CertificateDer, PrivateKeyDer};

use crate::{errors::AppError, state::AppState};

use super::cert;
use super::config::{NetworkConfig, TlsMinVersion};

/// Installs the process-wide crypto provider rustls 0.23 requires before any
/// `ServerConfig` is built. Idempotent — a second call is a no-op.
pub fn install_crypto_provider() {
    let _ = rustls::crypto::ring::default_provider().install_default();
}

/// Builds a rustls `ServerConfig` from a PEM chain and key, honouring the
/// minimum protocol version. A build failure means the pair is unusable or
/// mismatched — which is exactly the validation the upload path relies on.
pub fn build_server_config(
    cert_pem: &[u8],
    key_pem: &[u8],
    min: TlsMinVersion,
) -> Result<Arc<ServerConfig>, AppError> {
    install_crypto_provider();

    let mut cr: &[u8] = cert_pem;
    let certs: Vec<CertificateDer<'static>> = rustls_pemfile::certs(&mut cr)
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| AppError::Validation(format!("Chaîne de certificats illisible : {e}")))?;
    if certs.is_empty() {
        return Err(AppError::Validation(
            "Aucun certificat trouvé dans le PEM fourni".into(),
        ));
    }

    let mut kr: &[u8] = key_pem;
    let key: PrivateKeyDer<'static> = rustls_pemfile::private_key(&mut kr)
        .map_err(|e| AppError::Validation(format!("Clé privée illisible : {e}")))?
        .ok_or_else(|| AppError::Validation("Aucune clé privée trouvée dans le PEM fourni".into()))?;

    let versions: &[&'static rustls::SupportedProtocolVersion] = match min {
        TlsMinVersion::V1_3 => &[&rustls::version::TLS13],
        TlsMinVersion::V1_2 => rustls::ALL_VERSIONS,
    };

    let cfg = ServerConfig::builder_with_protocol_versions(versions)
        .with_no_client_auth()
        .with_single_cert(certs, key)
        .map_err(|e| {
            AppError::Validation(format!("Certificat et clé incompatibles ou invalides : {e}"))
        })?;

    Ok(Arc::new(cfg))
}

/// The mutable TLS state shared between the accept loop and the admin handlers.
///
/// `reload` holds the axum-server config the HTTPS listener actually serves —
/// `Some` only when the process bound an HTTPS socket at boot. `hsts` holds the
/// `Strict-Transport-Security` value the response layer emits, kept out of
/// plain-HTTP responses.
#[derive(Default)]
pub struct TlsRuntime {
    reload: RwLock<Option<RustlsConfig>>,
    hsts: RwLock<Option<HeaderValue>>,
}

impl TlsRuntime {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn set_reload(&self, config: RustlsConfig) {
        if let Ok(mut g) = self.reload.write() {
            *g = Some(config);
        }
    }

    pub fn reload_handle(&self) -> Option<RustlsConfig> {
        self.reload.read().ok().and_then(|g| g.clone())
    }

    pub fn is_https_live(&self) -> bool {
        self.reload.read().map(|g| g.is_some()).unwrap_or(false)
    }

    pub fn set_hsts(&self, value: Option<HeaderValue>) {
        if let Ok(mut g) = self.hsts.write() {
            *g = value;
        }
    }

    pub fn hsts(&self) -> Option<HeaderValue> {
        self.hsts.read().ok().and_then(|g| g.clone())
    }
}

/// Recomputes the HSTS header and applies a minimum-version change to the live
/// listener. Called after any `network.*` setting changes. Cheap and safe to
/// call when no HTTPS listener is running (it just clears HSTS).
pub async fn refresh_runtime(state: &AppState) {
    let cfg = NetworkConfig::load(&state.db).await;
    let live = state.tls.is_https_live();

    // HSTS only means anything over HTTPS; never announce it on a plain-HTTP
    // instance.
    let hsts = if live {
        cfg.hsts
            .header_value()
            .and_then(|s| HeaderValue::from_str(&s).ok())
    } else {
        None
    };
    state.tls.set_hsts(hsts);

    // A minimum-version change reaches the live listener without a restart.
    if live {
        reload_active_certificate(state, cfg.tls_min_version).await;
    }
}

/// Rebuilds the served `ServerConfig` from the active certificate and swaps it
/// into the live listener, with no dropped connections. Returns whether a swap
/// actually happened (false when no HTTPS listener is running).
pub async fn reload_certificate(state: &AppState) -> bool {
    if !state.tls.is_https_live() {
        return false;
    }
    let min = NetworkConfig::load(&state.db).await.tls_min_version;
    reload_active_certificate(state, min).await
}

async fn reload_active_certificate(state: &AppState, min: TlsMinVersion) -> bool {
    let Some(handle) = state.tls.reload_handle() else {
        return false;
    };
    let Some((cert_pem, key_pem)) =
        cert::active_material(&state.db, &state.settings.auth.jwt_secret).await
    else {
        tracing::warn!("réseau : rechargement TLS demandé mais aucun certificat actif exploitable");
        return false;
    };
    match build_server_config(cert_pem.as_bytes(), key_pem.as_bytes(), min) {
        Ok(sc) => {
            handle.reload_from_config(sc);
            tracing::info!("réseau : certificat TLS rechargé à chaud");
            true
        }
        Err(e) => {
            tracing::error!(error = %e, "réseau : rechargement du certificat TLS échoué");
            false
        }
    }
}
