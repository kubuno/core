//! The console side of "Abonnement et licence".
//!
//! ## What this page is, and what it deliberately is not
//!
//! It is not a billing page. Kubuno is AGPL-3.0-or-later and is **not sold**:
//! there is no seat to count, no plan to upgrade to, no capability to unlock,
//! and no licence server to call. A page modelled on a commercial console would
//! be a page of buttons that lie.
//!
//! What it answers instead is what an operator of a free, self-hosted product
//! actually asks: *under what terms do I hold this software*, *which
//! installation is this exactly*, and *is anybody obliged to help me if it
//! breaks*. The first is a constant, the second already existed in the schema,
//! and only the third needed anything new.
//!
//! ## One route, because the page is one reading
//!
//! Everything the page shows arrives in a single `GET`. Composing it here rather
//! than making the browser call `/admin/stats`, `/admin/modules` and this route
//! in parallel is what keeps the page openable by an operator who holds
//! `core.settings.read` and nothing else: each block is included only when the
//! caller may see it, and the blocks they may not see arrive as `null` rather
//! than as a 403 that would blank the whole page.

use axum::{extract::State, Json};
use serde::Deserialize;
use serde_json::{json, Value};
use sqlx::Row;

use crate::{
    audit::{redact, AdminAudit, AuditEntry},
    auth::middleware::AdminUser,
    authz::{keys, AdminCtx},
    errors::AppError,
    state::AppState,
    support::{self, store, Trust},
};

/// Longest key accepted from the form. Well above any plausible contract, and
/// checked before anything is parsed.
const MAX_KEY_LEN: usize = 8192;

/// The contract as the page shows it: the stored claims, plus the two things
/// only the server can say — today's verdict on the signature, and how long is
/// left.
fn contract_json(stored: &store::StoredContract, trust: &Trust) -> Value {
    let now = chrono::Utc::now();
    let expired = stored.expires_at.map(|e| e <= now).unwrap_or(false);
    let days_left = stored
        .expires_at
        .map(|e| (e - now).num_days())
        .filter(|_| !expired);

    json!({
        "subject":       stored.subject,
        "plan":          stored.plan,
        "perimeter":     stored.perimeter,
        "contact":       stored.contact,
        "issued_at":     stored.issued_at,
        "expires_at":    stored.expires_at,
        "registered_at": stored.registered_at,
        "expired":       expired,
        "days_left":     days_left,
        // The verdict recomputed on this read, not the one stored at
        // registration: the day the publisher's signing key ships, contracts
        // registered before it become verified without anybody re-pasting them.
        "verified":      matches!(trust, Trust::Verified { .. }),
        "key_id":        match trust { Trust::Verified { key_id } => Some(key_id.clone()), Trust::Declarative => None },
    })
}

/// The blocks that are always true, whatever the caller may read.
fn licence_json() -> Value {
    json!({
        "spdx":             support::LICENCE_SPDX,
        "text_url":         support::LICENCE_URL,
        "source_url":       support::SOURCE_URL,
        "organisation_url": support::ORGANISATION_URL,
    })
}

/// `GET /admin/subscription`
pub async fn get(
    State(state): State<AppState>,
    _admin: AdminUser,
    ctx: AdminCtx,
) -> Result<Json<Value>, AppError> {
    ctx.require(keys::SETTINGS_READ)?;

    let identity = store::identity(&state.db).await?;
    let instance_name = crate::settings::instance_value(&state.db, "instance.name")
        .await
        .and_then(|v| v.as_str().map(str::to_string));

    // How many accounts this instance carries. Behind `stats.read`, the key that
    // governs every other instance-wide aggregate: a delegated operator who may
    // not see the dashboard's totals must not read them off this page either.
    let accounts = if ctx.has(keys::STATS_READ) {
        // `COUNT` already returns `bigint`; no cast, so the FILTER clause needs
        // no parenthesising to keep the cast attached to the right expression.
        let row = sqlx::query(
            "SELECT COUNT(*) AS total,
                    COUNT(*) FILTER (WHERE is_active) AS active
               FROM core.users",
        )
        .fetch_one(&state.db)
        .await
        .map_err(|e| {
            tracing::error!(error = %e, "subscription: comptage des comptes");
            AppError::Database(e)
        })?;
        Some(json!({
            "total":  row.try_get::<i64, _>("total").map_err(AppError::Database)?,
            "active": row.try_get::<i64, _>("active").map_err(AppError::Database)?,
        }))
    } else {
        None
    };

    // The installed modules and the licence each one declares. Read from
    // `core.modules`, which is where the manifest each module ships lands
    // (`modules::manager::sync_to_db`) — never from a list of names in the core.
    let modules = if ctx.has(keys::MODULES_READ) {
        let rows = sqlx::query(
            "SELECT id, display_name, version, license, homepage_url, is_enabled, installed_at
               FROM core.modules
              WHERE is_core_module = FALSE
              ORDER BY display_name",
        )
        .fetch_all(&state.db)
        .await
        .map_err(|e| {
            tracing::error!(error = %e, "subscription: inventaire des modules");
            AppError::Database(e)
        })?;

        let mut items = Vec::with_capacity(rows.len());
        for row in &rows {
            items.push(json!({
                "id":           row.try_get::<String, _>("id").map_err(AppError::Database)?,
                "display_name": row.try_get::<String, _>("display_name").map_err(AppError::Database)?,
                "version":      row.try_get::<String, _>("version").map_err(AppError::Database)?,
                "license":      row.try_get::<Option<String>, _>("license").map_err(AppError::Database)?,
                "homepage_url": row.try_get::<Option<String>, _>("homepage_url").map_err(AppError::Database)?,
                "is_enabled":   row.try_get::<bool, _>("is_enabled").map_err(AppError::Database)?,
                "installed_at": row.try_get::<chrono::DateTime<chrono::Utc>, _>("installed_at").map_err(AppError::Database)?,
            }));
        }
        Some(Value::Array(items))
    } else {
        None
    };

    let stored = store::contract(&state.db).await?;
    let contract = match &stored {
        Some(row) => {
            let trust = store::recheck(&state.db, &identity.instance_id)
                .await?
                .unwrap_or(Trust::Declarative);
            contract_json(row, &trust)
        }
        None => Value::Null,
    };

    Ok(Json(json!({
        "licence": licence_json(),
        "instance": {
            "name":         instance_name,
            "instance_id":  identity.instance_id,
            "installed_at": identity.installed_at,
            "core_version": env!("CARGO_PKG_VERSION"),
        },
        "accounts": accounts,
        "modules":  modules,
        "support": {
            // The community channels, always — they are what an instance without
            // a contract actually has, and they do not stop existing when one is
            // registered.
            "community": {
                "source_url":       support::SOURCE_URL,
                "issues_url":       support::ISSUES_URL,
                "organisation_url": support::ORGANISATION_URL,
            },
            "contract": contract,
            // Whether this build can check a signature at all. The console says
            // so plainly rather than letting an operator believe a declarative
            // contract was verified.
            "verification_available": support::verification_available(),
        },
    })))
}

/// The pasted key.
///
/// Deliberately **not** `Debug`: the field is the bearer proof of a contract,
/// and a derived `Debug` is how one ends up in a log the day somebody adds a
/// `?dto` to a tracing call.
#[derive(Deserialize)]
pub struct RegisterKeyDto {
    /// The key as the publisher issued it. Never echoed back, never logged.
    key: String,
}

/// `POST /admin/subscription/support-key` — register or replace the contract.
pub async fn register_key(
    State(state): State<AppState>,
    _admin: AdminUser,
    audit: AdminAudit,
    ctx: AdminCtx,
    Json(dto): Json<RegisterKeyDto>,
) -> Result<Json<Value>, AppError> {
    // Writing a support contract is editing instance-wide configuration, so it
    // is governed by the settings key — the same one the menu entry is gated on
    // for reading. It grants nothing: the contract unlocks no feature.
    ctx.require(keys::SETTINGS_MANAGE)?;

    let key_text = dto.key.trim();
    if key_text.is_empty() {
        return Err(AppError::Validation(
            "Collez la clé de support fournie par l'éditeur.".into(),
        ));
    }
    if key_text.len() > MAX_KEY_LEN {
        return Err(AppError::Validation(
            "Cette clé de support est trop longue pour en être une.".into(),
        ));
    }

    let identity = store::identity(&state.db).await?;
    // Validation before any write, and the only place the key is interpreted.
    let key = support::read_key(key_text, &identity.instance_id.to_string())?;

    let previous = store::contract(&state.db).await?;
    let before = previous.as_ref().map(|p| {
        redact::snapshot(
            redact::target::SUPPORT_CONTRACT,
            &json!({
                "subject":    p.subject,
                "plan":       p.plan,
                "perimeter":  p.perimeter,
                "contact":    p.contact,
                "expires_at": p.expires_at,
                "verified":   p.verified_at_registration,
                "key_id":     p.key_id,
            }),
        )
    });

    let after = redact::snapshot(
        redact::target::SUPPORT_CONTRACT,
        &json!({
            "subject":    key.claims.sub.trim(),
            "plan":       key.claims.plan,
            "perimeter":  key.claims.perimeter,
            "contact":    key.claims.contact,
            "expires_at": key.expires_at(),
            "verified":   key.is_verified(),
            "key_id":     key.key_id(),
        }),
    );

    let mut tx = audit.begin(&state.db).await?;
    store::register(&mut tx, key_text, &key, audit.admin.id).await?;

    let mut entry = AuditEntry::new("core.support.register")
        .target_kind(redact::target::SUPPORT_CONTRACT, key.claims.sub.trim().to_string())
        .after(after)
        // Says, in the trail itself, whether the instance could confirm the
        // claims or merely recorded them. Without it an auditor cannot tell a
        // proven contract from a typed one.
        .detail(if key.is_verified() {
            "signature vérifiée"
        } else {
            "signature non vérifiée — informations déclaratives"
        });
    if let Some(before) = before {
        entry = entry.before(before);
    }
    tx.commit(entry).await?;

    let stored = store::contract(&state.db).await?.ok_or_else(|| {
        tracing::error!("subscription: contrat introuvable juste après son enregistrement");
        AppError::NotFound("Contrat de support".into())
    })?;
    Ok(Json(json!({ "contract": contract_json(&stored, &key.trust) })))
}

/// `DELETE /admin/subscription/support-key` — go back to community support.
///
/// Not a destructive operation in any meaningful sense: the instance loses a
/// display, never a capability. The contract itself lives in the operator's
/// agreement with the publisher, not here.
pub async fn remove_key(
    State(state): State<AppState>,
    _admin: AdminUser,
    audit: AdminAudit,
    ctx: AdminCtx,
) -> Result<Json<Value>, AppError> {
    ctx.require(keys::SETTINGS_MANAGE)?;

    let previous = store::contract(&state.db).await?.ok_or_else(|| {
        AppError::NotFound("Aucun contrat de support n'est enregistré".into())
    })?;

    let mut tx = audit.begin(&state.db).await?;
    store::remove(&mut tx).await?;
    tx.commit(
        AuditEntry::new("core.support.remove")
            .target_kind(
                redact::target::SUPPORT_CONTRACT,
                previous.subject.clone(),
            )
            .before(redact::snapshot(
                redact::target::SUPPORT_CONTRACT,
                &json!({
                    "subject":    previous.subject,
                    "plan":       previous.plan,
                    "perimeter":  previous.perimeter,
                    "contact":    previous.contact,
                    "expires_at": previous.expires_at,
                    "verified":   previous.verified_at_registration,
                    "key_id":     previous.key_id,
                }),
            )),
    )
    .await?;

    Ok(Json(json!({ "ok": true })))
}
