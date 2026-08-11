//! Instance requirement: administrators must carry a second factor.
//!
//! ## The ordering that makes this safe
//!
//! This module is deliberately the *last* of the three pieces. Making the second
//! factor mandatory on an instance that has no backup codes and no local recovery
//! path is a way to lock an operator out of their own server for good. Both exist
//! before this switch does: [`crate::auth::backup_codes`] and the
//! `kubuno auth:recover` subcommand.
//!
//! ## The grace window is stamped per account, not computed from the switch
//!
//! `core.users.admin_2fa_grace_until` is written the first time an administrator
//! without a second factor is seen while the requirement is on. Deriving the
//! deadline from "when the setting was flipped" instead would hand an account
//! created a month later a window that had already elapsed — a new administrator
//! refused on their first sign-in, with nothing they did wrong to point at.
//!
//! Enrolling clears the stamp (see the `/me/2fa/enable` handler), so an operator
//! who later turns their second factor off gets a fresh delay rather than an
//! immediate refusal.

use chrono::{DateTime, Duration as ChronoDuration, Utc};
use serde::Serialize;
use sqlx::PgPool;

use crate::{errors::AppError, models::user::User};

/// Instance-level configuration of the requirement.
#[derive(Debug, Clone, Copy)]
pub struct Admin2faPolicy {
    pub required: bool,
    pub grace_days: i64,
}

impl Default for Admin2faPolicy {
    fn default() -> Self {
        // Off. Migration 000052 seeds the same value, and for the same reason.
        Self { required: false, grace_days: 7 }
    }
}

/// What the interface needs to warn an administrator before the deadline.
#[derive(Debug, Clone, Serialize, utoipa::ToSchema)]
pub struct Admin2faStatus {
    /// The instance requires a second factor of its administrators.
    pub required: bool,
    /// This account already satisfies it.
    pub satisfied: bool,
    /// End of this account's grace window, when one is armed.
    pub grace_until: Option<DateTime<Utc>>,
    /// Whole days left, floored at zero. `None` when nothing is armed.
    pub days_left: Option<i64>,
    /// Administrative access is refused right now.
    pub locked_out: bool,
}

fn as_i64(v: &serde_json::Value) -> Option<i64> {
    v.as_i64().or_else(|| v.as_str().and_then(|s| s.parse().ok()))
}

/// Reads the requirement from `core.settings`.
///
/// Any read failure falls back to "not required": a database hiccup must never
/// be the thing that shuts an operator out of their administration console.
pub async fn policy(db: &PgPool) -> Admin2faPolicy {
    let mut out = Admin2faPolicy::default();

    let rows = sqlx::query_as::<_, (String, serde_json::Value)>(
        "SELECT key, value FROM core.settings
          WHERE key IN ('security.admin_2fa_required', 'security.admin_2fa_grace_days')",
    )
    .fetch_all(db)
    .await
    .unwrap_or_default();

    for (key, value) in rows {
        match key.as_str() {
            "security.admin_2fa_required" => {
                out.required = value.as_bool().unwrap_or(false);
            }
            "security.admin_2fa_grace_days" => {
                if let Some(n) = as_i64(&value) {
                    out.grace_days = n.clamp(0, 365);
                }
            }
            _ => {}
        }
    }
    out
}

/// Arms the account's deadline if it has none yet, and returns it.
async fn arm_deadline(
    db: &PgPool,
    user: &User,
    grace_days: i64,
) -> Result<DateTime<Utc>, AppError> {
    if let Some(existing) = user.admin_2fa_grace_until {
        return Ok(existing);
    }

    let deadline = Utc::now() + ChronoDuration::days(grace_days);

    // `IS NULL` in the WHERE clause makes two concurrent requests agree on one
    // deadline instead of the second silently pushing the first one back.
    let stored: Option<DateTime<Utc>> = sqlx::query_scalar(
        "UPDATE core.users SET admin_2fa_grace_until = $2
          WHERE id = $1 AND admin_2fa_grace_until IS NULL
      RETURNING admin_2fa_grace_until",
    )
    .bind(user.id)
    .bind(deadline)
    .fetch_optional(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, user_id = %user.id, "admin_2fa: armement du délai de grâce");
        AppError::Database(e)
    })?;

    match stored {
        Some(d) => Ok(d),
        // Lost the race: read back whatever the winner wrote.
        None => {
            let d: Option<DateTime<Utc>> =
                sqlx::query_scalar("SELECT admin_2fa_grace_until FROM core.users WHERE id = $1")
                    .bind(user.id)
                    .fetch_one(db)
                    .await
                    .map_err(|e| {
                        tracing::error!(error = %e, user_id = %user.id, "admin_2fa: relecture du délai");
                        AppError::Database(e)
                    })?;
            Ok(d.unwrap_or(deadline))
        }
    }
}

/// Clears the stamp — called when an account enrols a second factor.
pub async fn clear_deadline(db: &PgPool, user_id: uuid::Uuid) {
    if let Err(e) = sqlx::query("UPDATE core.users SET admin_2fa_grace_until = NULL WHERE id = $1")
        .bind(user_id)
        .execute(db)
        .await
    {
        tracing::error!(error = %e, user_id = %user_id, "admin_2fa: effacement du délai de grâce");
    }
}

/// Refuses administrative access when the account's grace window has closed.
///
/// Returns [`AppError::TwoFactorRequired`], whose message says what to do — a
/// bare "accès refusé" in front of an administrator who changed nothing is the
/// kind of dead end that ends in a database edit.
pub async fn enforce(db: &PgPool, user: &User) -> Result<(), AppError> {
    let policy = policy(db).await;

    if !policy.required {
        // Turning the requirement off disarms whatever it armed. Leaving a
        // deadline behind would mean that switching it on again months later
        // locks out, on the spot, every administrator whose stale window had
        // already elapsed — a delay they were never given a chance to use.
        if user.admin_2fa_grace_until.is_some() {
            clear_deadline(db, user.id).await;
        }
        return Ok(());
    }

    if user.totp_enabled {
        return Ok(());
    }

    let deadline = arm_deadline(db, user, policy.grace_days).await?;
    if Utc::now() < deadline {
        return Ok(());
    }

    tracing::warn!(
        user_id = %user.id,
        "Accès administration refusé : second facteur obligatoire, délai de grâce expiré"
    );
    Err(AppError::TwoFactorRequired)
}

/// Read-only view for the interface. Never arms anything.
pub async fn status(db: &PgPool, user: &User) -> Admin2faStatus {
    let policy = policy(db).await;
    let satisfied = user.totp_enabled;
    let grace_until = user.admin_2fa_grace_until;

    let days_left = grace_until.map(|d| (d - Utc::now()).num_days().max(0));
    let locked_out = policy.required
        && !satisfied
        && grace_until.map(|d| Utc::now() >= d).unwrap_or(false);

    Admin2faStatus {
        required: policy.required,
        satisfied,
        grace_until,
        days_left,
        locked_out,
    }
}
