//! Writing the trail.
//!
//! ## Why an audited *transaction* rather than a "log it afterwards" helper
//!
//! An audit row appended after the mutation committed is lost in exactly the
//! situations that matter: the process is killed between the two statements, the
//! connection drops, a later `?` returns early. Worse, nothing in the type
//! system notices when a new handler simply forgets the call.
//!
//! [`AuditTx`] removes both failure modes by construction: it wraps a database
//! transaction and **exposes no way to commit without an [`AuditEntry`]**. The
//! only terminal method is [`AuditTx::commit`], whose single argument is the
//! entry; the row and the mutation land in the same commit, atomically. Dropping
//! the guard rolls the mutation back, so "forgot to audit" degrades into "the
//! change never happened" instead of "the change happened invisibly".
//!
//! The escape hatches are named so they read as exceptions at the call site:
//! [`AuditContext::record`] for events that have no mutation to ride along with
//! (a refusal, a failed sign-in, a background install), and nothing else.

use serde_json::Value;
use sqlx::{PgConnection, PgPool, Postgres, Transaction};

use super::model::{AuditContext, AuditEntry, Outcome};
use crate::errors::AppError;

/// Inserts one entry on the given executor and returns its id.
async fn insert(
    conn: &mut PgConnection,
    ctx: &AuditContext,
    entry: &AuditEntry,
) -> Result<i64, sqlx::Error> {
    use super::chain;

    let ip_owned = ctx.ip.map(|ip| ip.to_string());
    // Server-set timestamp, chosen here (not by the column default) so the exact
    // value that is stored is the one the hash covers. Truncated to microseconds
    // — PostgreSQL `timestamptz` keeps only microseconds, so hashing the raw
    // nanosecond `now()` would not match the value read back at verification.
    let occurred_at = chrono::Utc::now();
    let occurred_at =
        chrono::DateTime::from_timestamp_micros(occurred_at.timestamp_micros()).unwrap_or(occurred_at);

    // ── Hash chaining (tamper-evidence) ──────────────────────────────────────
    // Only when the key is installed (it is not in unit tests / tools, and then
    // the hash columns stay NULL). The advisory lock serialises appenders so two
    // concurrent writers cannot read the same tip and both link to it; it is an
    // xact lock, released at commit — both call sites run inside a transaction.
    let (prev_hash, row_hash): (Option<Vec<u8>>, Option<Vec<u8>>) = match chain::audit_key() {
        Some(key) => {
            sqlx::query("SELECT pg_advisory_xact_lock($1)")
                .bind(chain::CHAIN_LOCK)
                .execute(&mut *conn)
                .await?;
            let prev: Vec<u8> = sqlx::query_scalar::<_, Vec<u8>>(
                "SELECT row_hash FROM core.admin_audit \
                 WHERE row_hash IS NOT NULL ORDER BY id DESC LIMIT 1",
            )
            .fetch_optional(&mut *conn)
            .await?
            .unwrap_or_else(|| chain::GENESIS.to_vec());
            let fields = chain::canonical_of_write(ctx, entry, occurred_at, ip_owned.as_deref());
            let hash = chain::row_hash(key, &chain::canonical(&fields), &prev);
            (Some(prev), Some(hash))
        }
        None => (None, None),
    };

    let id: i64 = sqlx::query_scalar(
        r#"INSERT INTO core.admin_audit
               (actor_id, actor_label, actor_role, actor_origin, actor_token_id,
                ip_address, user_agent,
                action, module_id, target_type, target_id, target_label,
                before, after, outcome, detail, reversible, reverts_entry_id,
                occurred_at, prev_hash, row_hash)
           VALUES ($1, $2, $3, $4, $5, $6::inet, $7, $8, $9, $10, $11, $12,
                   $13, $14, $15, $16, $17, $18, $19, $20, $21)
           RETURNING id"#,
    )
    .bind(ctx.actor.id)
    .bind(&ctx.actor.label)
    .bind(ctx.actor.role.as_deref())
    .bind(ctx.actor.origin.as_str())
    .bind(ctx.actor.token_id)
    .bind(ip_owned.as_deref())
    .bind(ctx.user_agent.as_deref())
    .bind(&entry.action)
    .bind(entry.module_id.as_deref())
    .bind(entry.target.kind.as_deref())
    .bind(entry.target.id.as_deref())
    .bind(entry.target.label.as_deref())
    .bind(entry.before.as_ref())
    .bind(entry.after.as_ref())
    .bind(entry.outcome.as_str())
    .bind(entry.detail.as_deref())
    .bind(entry.reversible)
    .bind(entry.reverts_entry_id)
    .bind(occurred_at)
    .bind(prev_hash)
    .bind(row_hash)
    .fetch_one(&mut *conn)
    .await?;

    // Close the undo loop: the undone entry points back at the one that undid it.
    if let Some(undone) = entry.reverts_entry_id {
        sqlx::query("UPDATE core.admin_audit SET reverted_by_entry_id = $1 WHERE id = $2")
            .bind(id)
            .bind(undone)
            .execute(&mut *conn)
            .await?;
    }

    Ok(id)
}

impl AuditContext {
    /// Opens a transaction that can only be committed together with its audit
    /// entry. This is the path every administrative mutation should take.
    pub async fn begin<'a>(&self, db: &'a PgPool) -> Result<AuditTx<'a>, AppError> {
        let tx = db.begin().await.map_err(|e| {
            tracing::error!(error = %e, "audit: ouverture de la transaction auditée");
            AppError::Database(e)
        })?;
        Ok(AuditTx {
            tx,
            ctx: self.clone(),
            extra: Vec::new(),
        })
    }

    /// Records an entry outside any mutation.
    ///
    /// Reserved for events that have nothing to commit alongside: refusals,
    /// failed sign-ins, and work performed by a detached task. Never use it to
    /// "log after" a mutation — that is what [`AuditTx`] exists to prevent.
    ///
    /// Best-effort by design: an audit failure must not turn a refusal into a
    /// 500. The error is logged loudly instead.
    pub async fn record(&self, db: &PgPool, entry: AuditEntry) -> Option<i64> {
        // A transaction, not a bare connection: the hash chain takes an
        // xact-scoped advisory lock, which only serialises appenders when it is
        // held for the duration of the read-tip-then-insert, i.e. inside a tx.
        let mut tx = match db.begin().await {
            Ok(t) => t,
            Err(e) => {
                tracing::error!(error = %e, action = %entry.action, "audit: connexion indisponible, entrée perdue");
                return None;
            }
        };
        match insert(&mut tx, self, &entry).await {
            Ok(id) => {
                if let Err(e) = tx.commit().await {
                    tracing::error!(error = %e, action = %entry.action, "audit: commit de l'entrée impossible");
                    return None;
                }
                publish_fact(db, self, &entry).await;
                Some(id)
            }
            Err(e) => {
                tracing::error!(error = %e, action = %entry.action, "audit: écriture de l'entrée impossible");
                None
            }
        }
    }
}

/// Republishes a recorded event on the bus, for the server's own consumers.
///
/// ## Why this bridge exists
///
/// The administration rule engine ([`crate::rules`]) reacts to events. The facts
/// an administrator most wants to react to — a refused sign-in, a denied
/// administrative call — are precisely the ones that were only ever written to
/// the trail and nowhere else. Rather than sprinkling a `publish` beside every
/// such call site (and forgetting one), the *escape hatch of the trail itself*
/// becomes an event source: whatever gets recorded outside a mutation is
/// republished under its own action name.
///
/// Three properties make that safe:
///
/// * **After the insert.** Never announces something the trail does not hold.
/// * **`internal`.** The bus is a broadcast to every connected browser; an
///   administrative refusal delivered to everybody would be a leak far worse
///   than the missing trigger. The WebSocket and push workers drop these.
/// * **Structural fields only.** Actor, target, outcome, address. The `before`
///   and `after` snapshots — the only part that can hold anything sensitive —
///   are deliberately left out.
///
/// Best-effort: a publication failure never turns an audited refusal into a 500.
async fn publish_fact(db: &PgPool, ctx: &AuditContext, entry: &AuditEntry) {
    use crate::events::{AppEvent, EventMeta};

    let target_id = entry.target.id.as_deref();
    // A target of type `user` is the account the fact is *about*, which is what
    // a rule's scope and threshold are keyed on.
    let subject_user_id = match entry.target.kind.as_deref() {
        Some(super::redact::target::USER) => target_id.and_then(|s| uuid::Uuid::parse_str(s).ok()),
        _ => None,
    };

    let payload = serde_json::json!({
        "action":        entry.action,
        "outcome":       entry.outcome.as_str(),
        "user_id":       subject_user_id,
        "actor_user_id": ctx.actor.id,
        "actor_label":   ctx.actor.label,
        "actor_origin":  ctx.actor.origin.as_str(),
        "ip":            ctx.ip.map(|ip| ip.to_string()),
        "target_type":   entry.target.kind,
        "target_id":     entry.target.id,
        "target_label":  entry.target.label,
        // Short machine reason ("bad_credentials", "no_admin_privilege"), the
        // same string the trail shows. Never a snapshot.
        "reason":        entry.detail,
    });

    let event = AppEvent::Custom {
        event_type: entry.action.clone(),
        module_id: entry
            .module_id
            .clone()
            .unwrap_or_else(|| "core".to_string()),
        payload,
    };

    let meta = EventMeta::internal();
    // The log row first: an event the engine reacts to but that a backtest
    // cannot replay is a rule whose history is unknowable.
    crate::events::bus::log_event(db, &event, &meta).await;

    if let Err(e) = crate::database::notify::pg_notify_with(db, &event, &meta).await {
        tracing::warn!(error = %e, action = %entry.action, "audit: publication du fait sur le bus impossible");
    }
}

/// A database transaction that carries its audit entry to the commit.
///
/// Deref-s to the underlying connection so existing query code is unchanged:
/// `sqlx::query(..).execute(&mut *tx)`.
pub struct AuditTx<'a> {
    tx: Transaction<'a, Postgres>,
    ctx: AuditContext,
    extra: Vec<AuditEntry>,
}

impl AuditTx<'_> {
    /// The request-scoped actor, for handlers that need to compare it with the
    /// target (self-demotion guards, for instance).
    pub fn context(&self) -> &AuditContext {
        &self.ctx
    }

    /// Queues an additional entry for a request that touches several objects
    /// (a settings PATCH carrying five keys writes five entries, one per key).
    /// They are all written by [`Self::commit`], inside the same transaction.
    pub fn also(&mut self, entry: AuditEntry) {
        self.extra.push(entry);
    }

    /// Writes `entry` and commits both it and the mutation atomically.
    ///
    /// This is the **only** way to commit an `AuditTx`; there is no zero-argument
    /// `commit()` to reach for by accident.
    pub async fn commit(mut self, entry: AuditEntry) -> Result<i64, AppError> {
        let queued = std::mem::take(&mut self.extra);
        for extra in &queued {
            insert(&mut self.tx, &self.ctx, extra).await.map_err(|e| {
                tracing::error!(error = %e, action = %extra.action, "audit: insertion d'une entrée additionnelle");
                AppError::Database(e)
            })?;
        }
        let id = insert(&mut self.tx, &self.ctx, &entry)
            .await
            .map_err(|e| {
                tracing::error!(error = %e, action = %entry.action, "audit: insertion de l'entrée");
                AppError::Database(e)
            })?;
        self.tx.commit().await.map_err(|e| {
            tracing::error!(error = %e, action = %entry.action, "audit: commit de la transaction auditée");
            AppError::Database(e)
        })?;
        Ok(id)
    }

    /// Abandons the mutation and records why, on a separate connection so the
    /// entry survives the rollback. Returns the original error for `?`.
    pub async fn abort(self, db: &PgPool, entry: AuditEntry, error: AppError) -> AppError {
        let ctx = self.ctx.clone();
        drop(self.tx); // explicit rollback
        let outcome = match error {
            AppError::Forbidden
            | AppError::PasswordChangeRequired
            | AppError::ReauthRequired
            | AppError::ReauthImpossible
            | AppError::TwoFactorRequired => Outcome::Denied,
            _ => Outcome::Error,
        };
        ctx.record(db, entry.outcome(outcome).detail(error.to_string()))
            .await;
        error
    }
}

impl std::ops::Deref for AuditTx<'_> {
    type Target = PgConnection;
    fn deref(&self) -> &Self::Target {
        &self.tx
    }
}

impl std::ops::DerefMut for AuditTx<'_> {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.tx
    }
}

/// Convenience for the very common "snapshot a serialisable model" shape.
pub fn snap<T: serde::Serialize>(target_type: &str, model: &T) -> Value {
    let raw = serde_json::to_value(model).unwrap_or(Value::Null);
    super::redact::snapshot(target_type, &raw)
}
