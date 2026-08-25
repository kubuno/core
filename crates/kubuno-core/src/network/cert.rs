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
/// and its metadata parsed for display. **The key material is written to disk**
/// (`super::store`), never to the database: the row holds subject, SAN and
/// validity, none of which is a secret.
pub async fn store_active(
    conn: &mut sqlx::PgConnection,
    paths: &super::store::Paths,
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

    // Disk first: if the material cannot be written there is nothing to record,
    // and the transaction the caller opened is simply dropped. The reverse order
    // would leave a row claiming a certificate the server cannot serve.
    super::store::write_material(paths, cert_pem, key_pem)?;

    // The previous certificate is retired. Only its metadata survives — the key
    // material it referred to has just been overwritten on disk, and there is no
    // rollback path that would want an old key back.
    sqlx::query("UPDATE core.tls_certificates SET is_active = FALSE WHERE is_active = TRUE")
        .execute(&mut *conn)
        .await
        .map_err(|e| {
            tracing::error!(error = %e, "réseau : désactivation des certificats précédents");
            AppError::Database(e)
        })?;

    // Bounded history. An ACME renewal lands here every ~60 days for the life of
    // the instance; without a ceiling the table grows without end.
    sqlx::query(
        "DELETE FROM core.tls_certificates WHERE is_active = FALSE AND id NOT IN ( \
             SELECT id FROM core.tls_certificates WHERE is_active = FALSE \
             ORDER BY created_at DESC LIMIT 20 )",
    )
    .execute(&mut *conn)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, "réseau : élagage de l'historique des certificats");
        AppError::Database(e)
    })?;

    let row = sqlx::query(
        "INSERT INTO core.tls_certificates \
             (source, subject, issuer, san, not_before, not_after, is_active, uploaded_by) \
         VALUES ($1, $2, $3, $4, $5, $6, TRUE, $7) \
         RETURNING id, source, subject, issuer, san, not_before, not_after, is_active, created_at",
    )
    .bind(source)
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

/// Every stored certificate, newest first — the active one and the retired ones
/// whose metadata is kept for the history (their keys are already destroyed).
pub async fn list(db: &PgPool) -> Result<Vec<StoredCert>, AppError> {
    let rows = sqlx::query(
        "SELECT id, source, subject, issuer, san, not_before, not_after, is_active, created_at \
         FROM core.tls_certificates ORDER BY is_active DESC, created_at DESC",
    )
    .fetch_all(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, "réseau : liste des certificats");
        AppError::Database(e)
    })?;

    rows.iter()
        .map(StoredCert::from_row)
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| {
            tracing::error!(error = %e, "réseau : décodage de la liste des certificats");
            AppError::Database(e)
        })
}

/// Deletes one certificate, key material included.
///
/// Refuses to delete the ACTIVE certificate while HTTPS is switched on: that
/// would leave the instance configured to serve TLS with nothing to serve it
/// with, and the failure would only appear at the next restart — as an instance
/// that silently fell back to plain HTTP. Turning HTTPS off first is an explicit
/// act; this keeps it from happening by accident.
pub async fn delete(
    db: &PgPool,
    paths: &super::store::Paths,
    id: Uuid,
    https_enabled: bool,
) -> Result<StoredCert, AppError> {
    let cert = sqlx::query(
        "SELECT id, source, subject, issuer, san, not_before, not_after, is_active, created_at \
         FROM core.tls_certificates WHERE id = $1",
    )
    .bind(id)
    .fetch_optional(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, "réseau : lecture du certificat à supprimer");
        AppError::Database(e)
    })?
    .ok_or_else(|| AppError::NotFound("Certificat introuvable".into()))?;

    let cert = StoredCert::from_row(&cert).map_err(|e| {
        tracing::error!(error = %e, "réseau : décodage du certificat à supprimer");
        AppError::Database(e)
    })?;

    if cert.is_active && https_enabled {
        return Err(AppError::Validation(
            "Ce certificat est celui que sert le HTTPS : désactivez d'abord le HTTPS, \
             ou installez un autre certificat à sa place"
                .into(),
        ));
    }

    sqlx::query("DELETE FROM core.tls_certificates WHERE id = $1")
        .bind(id)
        .execute(db)
        .await
        .map_err(|e| {
            tracing::error!(error = %e, "réseau : suppression du certificat");
            AppError::Database(e)
        })?;

    // Only the ACTIVE row owns the files on disk; a retired row is metadata for
    // a certificate whose material was overwritten when it was replaced.
    if cert.is_active {
        super::store::delete_material(paths)?;
    }

    Ok(cert)
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

/// The usable material (chain PEM + private key PEM) the server binds or
/// reloads, read from disk. `None` when the instance holds none.
///
/// Deliberately does not consult the database: the files are the material, and a
/// row that disagreed with them would be a second source of truth for the one
/// thing that must have only one.
pub fn active_material(paths: &super::store::Paths) -> Option<(String, String)> {
    super::store::read_material(paths)
}
