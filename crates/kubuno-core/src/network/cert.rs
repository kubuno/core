//! Certificate material: parsing its metadata, validating a chain+key pair, and
//! persisting it.
//!
//! No cryptography lives here. Validation is delegated to rustls (building a
//! `ServerConfig` fails unless the chain and key are usable and match), and
//! metadata extraction to `x509-parser`. This module only moves bytes between
//! the console and the database.

use chrono::{DateTime, Utc};
use serde::Serialize;
use sqlx::{PgPool, Row};
use uuid::Uuid;
use x509_parser::prelude::*;

use crate::errors::AppError;

use super::config;

/// A certificate row as the console sees it — never the private key.
#[derive(Debug, Clone, Serialize)]
pub struct StoredCert {
    pub id: Uuid,
    pub source: String,
    pub subject: Option<String>,
    pub issuer: Option<String>,
    pub san: Vec<String>,
    pub not_before: Option<DateTime<Utc>>,
    pub not_after: Option<DateTime<Utc>>,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
}

impl StoredCert {
    fn from_row(row: &sqlx::postgres::PgRow) -> Result<Self, sqlx::Error> {
        Ok(Self {
            id: row.try_get("id")?,
            source: row.try_get("source")?,
            subject: row.try_get("subject")?,
            issuer: row.try_get("issuer")?,
            san: row.try_get("san")?,
            not_before: row.try_get("not_before")?,
            not_after: row.try_get("not_after")?,
            is_active: row.try_get("is_active")?,
            created_at: row.try_get("created_at")?,
        })
    }
}

/// Metadata parsed from the leaf certificate of a chain.
struct CertMeta {
    subject: Option<String>,
    issuer: Option<String>,
    san: Vec<String>,
    not_before: Option<DateTime<Utc>>,
    not_after: Option<DateTime<Utc>>,
}

/// Parses the leaf certificate (first PEM block) for its human-facing metadata.
fn parse_metadata(cert_pem: &[u8]) -> Result<CertMeta, AppError> {
    let (_, pem) = x509_parser::pem::parse_x509_pem(cert_pem).map_err(|_| {
        AppError::Validation("Certificat illisible : le PEM ne contient pas de bloc CERTIFICATE valide".into())
    })?;
    let cert = pem
        .parse_x509()
        .map_err(|_| AppError::Validation("Certificat X.509 illisible".into()))?;

    let cn_of = |name: &X509Name| -> Option<String> {
        name.iter_common_name()
            .next()
            .and_then(|a| a.as_str().ok())
            .map(str::to_string)
    };

    let subject = cn_of(cert.subject()).or_else(|| Some(cert.subject().to_string()));
    let issuer = cn_of(cert.issuer()).or_else(|| Some(cert.issuer().to_string()));

    let mut san = Vec::new();
    if let Ok(Some(ext)) = cert.subject_alternative_name() {
        for gn in &ext.value.general_names {
            if let GeneralName::DNSName(d) = gn {
                san.push(d.to_string());
            }
        }
    }

    let to_dt = |ts: i64| DateTime::<Utc>::from_timestamp(ts, 0);
    let not_before = to_dt(cert.validity().not_before.timestamp());
    let not_after = to_dt(cert.validity().not_after.timestamp());

    Ok(CertMeta {
        subject,
        issuer,
        san,
        not_before,
        not_after,
    })
}

/// Stores `cert_pem` + `key_pem` as the new active certificate, deactivating any
/// previous one. Atomicity is the caller's transaction (`conn`): the console
/// upload runs it inside the audited transaction, so a crash between the two
/// writes never leaves two active — or zero — certificates behind.
///
/// The pair is validated first (rustls refuses a mismatched or unusable pair)
/// and its metadata parsed for display. The private key is encrypted at rest and
/// never returned by any route.
pub async fn store_active(
    conn: &mut sqlx::PgConnection,
    jwt_secret: &str,
    source: &str,
    cert_pem: &str,
    key_pem: &str,
    uploaded_by: Option<Uuid>,
) -> Result<StoredCert, AppError> {
    // Validation: if rustls can build a server config from the pair, it is a
    // usable, matching chain+key. This is the same code path that will serve it.
    super::runtime::build_server_config(
        cert_pem.as_bytes(),
        key_pem.as_bytes(),
        config::TlsMinVersion::V1_2,
    )?;

    let meta = parse_metadata(cert_pem.as_bytes())?;
    let key_enc = config::encrypt_key(jwt_secret, key_pem)?;

    sqlx::query("UPDATE core.tls_certificates SET is_active = FALSE WHERE is_active = TRUE")
        .execute(&mut *conn)
        .await
        .map_err(|e| {
            tracing::error!(error = %e, "réseau : désactivation des certificats précédents");
            AppError::Database(e)
        })?;

    let row = sqlx::query(
        "INSERT INTO core.tls_certificates \
             (source, cert_pem, key_encrypted, subject, issuer, san, not_before, not_after, is_active, uploaded_by) \
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE, $9) \
         RETURNING id, source, subject, issuer, san, not_before, not_after, is_active, created_at",
    )
    .bind(source)
    .bind(cert_pem)
    .bind(&key_enc)
    .bind(&meta.subject)
    .bind(&meta.issuer)
    .bind(&meta.san)
    .bind(meta.not_before)
    .bind(meta.not_after)
    .bind(uploaded_by)
    .fetch_one(&mut *conn)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, "réseau : insertion du certificat");
        AppError::Database(e)
    })?;

    StoredCert::from_row(&row).map_err(|e| {
        tracing::error!(error = %e, "réseau : décodage du certificat inséré");
        AppError::Database(e)
    })
}

/// The active certificate's metadata, or `None` when the instance holds none.
pub async fn active(db: &PgPool) -> Result<Option<StoredCert>, AppError> {
    let row = sqlx::query(
        "SELECT id, source, subject, issuer, san, not_before, not_after, is_active, created_at \
         FROM core.tls_certificates WHERE is_active = TRUE",
    )
    .fetch_optional(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, "réseau : lecture du certificat actif");
        AppError::Database(e)
    })?;

    row.map(|r| StoredCert::from_row(&r))
        .transpose()
        .map_err(|e| {
            tracing::error!(error = %e, "réseau : décodage du certificat actif");
            AppError::Database(e)
        })
}

/// The active certificate's usable material (chain PEM + decrypted key PEM), for
/// the server to bind or reload. `None` when there is no active certificate or
/// its key can no longer be decrypted.
pub async fn active_material(db: &PgPool, jwt_secret: &str) -> Option<(String, String)> {
    let row = sqlx::query("SELECT cert_pem, key_encrypted FROM core.tls_certificates WHERE is_active = TRUE")
        .fetch_optional(db)
        .await
        .map_err(|e| {
            tracing::error!(error = %e, "réseau : lecture du matériel du certificat actif");
            e
        })
        .ok()??;

    let cert_pem: String = row.try_get("cert_pem").ok()?;
    let key_enc: String = row.try_get("key_encrypted").ok()?;
    let key_pem = config::decrypt_key(jwt_secret, &key_enc)?;
    Some((cert_pem, key_pem))
}
