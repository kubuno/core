//! Administration of the core's HTTP/HTTPS termination.
//!
//! The toggles (enable HTTPS, ports, HSTS, minimum TLS version) are ordinary
//! `network.*` settings, edited through the generic scoped-settings routes; this
//! handler owns only what settings cannot hold — the certificate material — and
//! the runtime status the console shows next to it.
//!
//! Like the SMTP password, the private key goes IN in clear over the
//! authenticated admin channel, is stored encrypted, and never comes back OUT:
//! no route ever returns it.

use axum::{extract::State, Json};
use serde::Deserialize;
use serde_json::{json, Value};

use crate::{
    audit::{AdminAudit, AuditEntry},
    auth::middleware::AdminUser,
    authz::{keys, AdminCtx},
    errors::AppError,
    network::{cert, config::TlsMinVersion, NetworkConfig},
    state::AppState,
};

/// Longest PEM payload accepted, per field. A full chain with a couple of
/// intermediates is a few KB; this bounds a settings row from becoming a blob.
const MAX_PEM_LEN: usize = 64 * 1024;

fn min_version_str(v: TlsMinVersion) -> &'static str {
    match v {
        TlsMinVersion::V1_3 => "1.3",
        TlsMinVersion::V1_2 => "1.2",
    }
}

/// GET /admin/network — current configuration, the active certificate's
/// metadata (never its key) and the live serving status.
pub async fn get_network(
    State(state): State<AppState>,
    _admin: AdminUser,
    ctx: AdminCtx,
) -> Result<Json<Value>, AppError> {
    ctx.require(keys::SETTINGS_READ)?;

    let net = NetworkConfig::load(&state.db).await;
    let certificate = cert::active(&state.db).await?;

    // An explicit `[server.tls]` in config.toml overrides the console: the panel
    // reports the fact and treats itself as read-only in that case.
    let file_override = state.settings.server.tls.enabled;
    let https_live = state.tls.is_https_live();
    // Turning HTTPS on/off binds or unbinds a socket, which only a restart can
    // do; the panel warns when the requested state and the live state diverge.
    let restart_required = !file_override && net.https_enabled != https_live;

    Ok(Json(json!({
        "config": {
            "https_enabled":           net.https_enabled,
            "https_port":              net.https_port,
            "http_redirect_to_https":  net.http_redirect_to_https,
            "http_redirect_port":      net.http_redirect_port,
            "tls_min_version":         min_version_str(net.tls_min_version),
            "cert_mode":               net.cert_mode,
            "hsts": {
                "enabled":            net.hsts.enabled,
                "max_age_days":       net.hsts.max_age_days,
                "include_subdomains": net.hsts.include_subdomains,
                "preload":            net.hsts.preload,
            },
        },
        "certificate": certificate,
        "runtime": {
            "https_live":       https_live,
            "file_override":    file_override,
            "restart_required": restart_required,
        },
    })))
}

#[derive(Deserialize)]
pub struct UploadCertDto {
    /// Full PEM chain (leaf + intermediates).
    pub cert_pem: String,
    /// PEM private key (PKCS#8 or RSA, unencrypted).
    pub key_pem: String,
}

/// POST /admin/network/certificate — install a certificate + key as the active
/// one. Hot-reloads the live HTTPS listener when there is one; otherwise reports
/// that a restart is needed to start serving it.
pub async fn upload_certificate(
    State(state): State<AppState>,
    audit: AdminAudit,
    ctx: AdminCtx,
    Json(dto): Json<UploadCertDto>,
) -> Result<Json<Value>, AppError> {
    ctx.require(keys::SETTINGS_MANAGE)?;

    if dto.cert_pem.trim().is_empty() || dto.key_pem.trim().is_empty() {
        return Err(AppError::Validation(
            "Le certificat et la clé privée sont requis".into(),
        ));
    }
    if dto.cert_pem.len() > MAX_PEM_LEN || dto.key_pem.len() > MAX_PEM_LEN {
        return Err(AppError::Validation(
            "Certificat ou clé trop volumineux".into(),
        ));
    }

    let mut tx = audit.begin(&state.db).await?;
    let admin_id = audit.admin.id;
    let stored = cert::store_active(
        &mut tx,
        &state.settings.auth.jwt_secret,
        "upload",
        &dto.cert_pem,
        &dto.key_pem,
        Some(admin_id),
    )
    .await?;

    // Metadata only in the trail — never the chain, never the key.
    let entry = AuditEntry::new("core.network.certificate.upload")
        .target_kind(
            "network.certificate",
            stored.subject.clone().unwrap_or_else(|| "certificat".into()),
        )
        .after(json!({
            "subject":    stored.subject,
            "issuer":     stored.issuer,
            "san":        stored.san,
            "not_after":  stored.not_after,
            "source":     stored.source,
        }));
    tx.commit(entry).await?;

    // Take effect live when an HTTPS listener is already running.
    let hot_reloaded = crate::network::runtime::reload_certificate(&state).await;

    let net = NetworkConfig::load(&state.db).await;
    let https_live = state.tls.is_https_live();
    let restart_required = net.https_enabled && !https_live;

    let message = if hot_reloaded {
        "Certificat installé et rechargé à chaud."
    } else if !net.https_enabled {
        "Certificat installé. Activez le HTTPS puis redémarrez le service pour l'utiliser."
    } else {
        "Certificat installé. Redémarrez le service pour activer le HTTPS."
    };

    Ok(Json(json!({
        "certificate":      stored,
        "hot_reloaded":     hot_reloaded,
        "https_live":       https_live,
        "restart_required": restart_required,
        "message":          message,
    })))
}
