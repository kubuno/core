//! Persistence of the rule engine: rules and their versions, the execution log,
//! the threshold counters, and the notification that reloads the memory index.
//!
//! Every statement targets the `core` schema and nothing else.
//!
//! ## Writing a rule always writes a version
//!
//! [`insert_rule`] and [`update_rule`] take a live connection — in practice the
//! [`crate::audit::AuditTx`] the handler opened — and write the snapshot in the
//! **same transaction** as the rule. There is no code path that produces a rule
//! row without the matching `core.rule_versions` row, because the two statements
//! are in one function and that function is the only way in. An execution log
//! that names a version which might not exist would be unreadable exactly when
//! somebody needs to know which wording of a rule suspended an account.

use chrono::{DateTime, Utc};
use serde_json::{json, Value};
use sqlx::{PgConnection, PgPool, Row};
use uuid::Uuid;

use crate::errors::AppError;

use super::condition::Condition;
use super::model::{ActionSpec, ExecutionRow, Mode, Outcome, Rule, Scope, Subject, VersionRow};

/// PostgreSQL channel woken up whenever a rule changes. Every core process
/// listens and rebuilds its memory index; nothing queries on the hot path.
pub const RULES_CHANNEL: &str = "kubuno_rules";

const SELECT_RULE: &str = r#"
    id, name, description, trigger_key, conditions, actions, mode, scope,
    threshold_count, threshold_window_s, rollout_percent, severity, priority,
    version, created_at, updated_at
"#;

fn map_rule(r: &sqlx::postgres::PgRow) -> Rule {
    let conditions: Value = r.get("conditions");
    let actions: Value = r.get("actions");
    let scope: Value = r.get("scope");
    let mode: String = r.get("mode");
    Rule {
        id: r.get("id"),
        name: r.get("name"),
        description: r.get("description"),
        trigger_key: r.get("trigger_key"),
        // A tree stored by an older or newer core that this build cannot read
        // degrades to "matches everything" — never to a panic on the hot path.
        // The console shows the raw JSON so the drift is visible.
        conditions: serde_json::from_value(conditions).unwrap_or_default(),
        actions: serde_json::from_value(actions).unwrap_or_default(),
        mode: Mode::parse(&mode).unwrap_or(Mode::Inactive),
        scope: serde_json::from_value(scope).unwrap_or_default(),
        threshold_count: r.get("threshold_count"),
        threshold_window_s: r.get("threshold_window_s"),
        rollout_percent: r.get("rollout_percent"),
        severity: r.get("severity"),
        priority: r.get("priority"),
        version: r.get("version"),
        created_at: r.get("created_at"),
        updated_at: r.get("updated_at"),
    }
}

// ── Reads ────────────────────────────────────────────────────────────────────

/// Every rule that is not inactive, ordered as the engine runs them.
pub async fn load_active(db: &PgPool) -> Result<Vec<Rule>, AppError> {
    let rows = sqlx::query(&format!(
        "SELECT {SELECT_RULE} FROM core.rules WHERE mode <> 'inactive' ORDER BY priority, created_at"
    ))
    .fetch_all(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, "rules: chargement des règles actives");
        AppError::Database(e)
    })?;
    Ok(rows.iter().map(map_rule).collect())
}

pub async fn list_rules(db: &PgPool) -> Result<Vec<Rule>, AppError> {
    let rows = sqlx::query(&format!(
        "SELECT {SELECT_RULE} FROM core.rules ORDER BY priority, created_at"
    ))
    .fetch_all(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, "rules: lecture des règles");
        AppError::Database(e)
    })?;
    Ok(rows.iter().map(map_rule).collect())
}

pub async fn get_rule(db: &PgPool, id: Uuid) -> Result<Rule, AppError> {
    let row = sqlx::query(&format!("SELECT {SELECT_RULE} FROM core.rules WHERE id = $1"))
        .bind(id)
        .fetch_optional(db)
        .await
        .map_err(|e| {
            tracing::error!(error = %e, rule_id = %id, "rules: lecture d'une règle");
            AppError::Database(e)
        })?
        .ok_or_else(|| AppError::NotFound("règle".into()))?;
    Ok(map_rule(&row))
}

// ── Writes ───────────────────────────────────────────────────────────────────

/// A validated rule definition, ready to be written.
#[derive(Debug, Clone)]
pub struct RuleDraft {
    pub name: String,
    pub description: Option<String>,
    pub trigger_key: String,
    pub conditions: Condition,
    pub actions: Vec<ActionSpec>,
    pub mode: Mode,
    pub scope: Scope,
    pub threshold_count: Option<i32>,
    pub threshold_window_s: Option<i32>,
    pub rollout_percent: i16,
    pub severity: String,
    pub priority: i32,
}

impl RuleDraft {
    /// The snapshot stored in `core.rule_versions`. Denormalised on purpose:
    /// reading history must not depend on the current shape of `core.rules`.
    fn snapshot(&self, version: i32) -> Value {
        json!({
            "version":            version,
            "name":               self.name,
            "description":        self.description,
            "trigger_key":        self.trigger_key,
            "conditions":         self.conditions,
            "actions":            self.actions,
            "mode":               self.mode.as_str(),
            "scope":              self.scope,
            "threshold_count":    self.threshold_count,
            "threshold_window_s": self.threshold_window_s,
            "rollout_percent":    self.rollout_percent,
            "severity":           self.severity,
            "priority":           self.priority,
        })
    }
}

/// Creates a rule and its first version, atomically.
pub async fn insert_rule(
    conn: &mut PgConnection,
    draft: &RuleDraft,
    author: Option<Uuid>,
    note: Option<&str>,
) -> Result<Rule, AppError> {
    let row = sqlx::query(&format!(
        r#"INSERT INTO core.rules
               (name, description, trigger_key, conditions, actions, mode, scope,
                threshold_count, threshold_window_s, rollout_percent, severity, priority,
                version, created_by, updated_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 1, $13, $13)
           RETURNING {SELECT_RULE}"#
    ))
    .bind(&draft.name)
    .bind(draft.description.as_deref())
    .bind(&draft.trigger_key)
    .bind(serde_json::to_value(&draft.conditions).unwrap_or_default())
    .bind(serde_json::to_value(&draft.actions).unwrap_or_default())
    .bind(draft.mode.as_str())
    .bind(serde_json::to_value(&draft.scope).unwrap_or_default())
    .bind(draft.threshold_count)
    .bind(draft.threshold_window_s)
    .bind(draft.rollout_percent)
    .bind(&draft.severity)
    .bind(draft.priority)
    .bind(author)
    .fetch_one(&mut *conn)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, "rules: création d'une règle");
        AppError::Database(e)
    })?;

    let rule = map_rule(&row);
    insert_version(conn, rule.id, 1, &draft.snapshot(1), author, note).await?;
    Ok(rule)
}

/// Replaces a rule's definition, bumping its version and writing the snapshot in
/// the same transaction.
pub async fn update_rule(
    conn: &mut PgConnection,
    id: Uuid,
    draft: &RuleDraft,
    author: Option<Uuid>,
    note: Option<&str>,
) -> Result<Rule, AppError> {
    let row = sqlx::query(&format!(
        r#"UPDATE core.rules
              SET name = $2, description = $3, trigger_key = $4, conditions = $5,
                  actions = $6, mode = $7, scope = $8, threshold_count = $9,
                  threshold_window_s = $10, rollout_percent = $11, severity = $12,
                  priority = $13, version = version + 1, updated_by = $14
            WHERE id = $1
        RETURNING {SELECT_RULE}"#
    ))
    .bind(id)
    .bind(&draft.name)
    .bind(draft.description.as_deref())
    .bind(&draft.trigger_key)
    .bind(serde_json::to_value(&draft.conditions).unwrap_or_default())
    .bind(serde_json::to_value(&draft.actions).unwrap_or_default())
    .bind(draft.mode.as_str())
    .bind(serde_json::to_value(&draft.scope).unwrap_or_default())
    .bind(draft.threshold_count)
    .bind(draft.threshold_window_s)
    .bind(draft.rollout_percent)
    .bind(&draft.severity)
    .bind(draft.priority)
    .bind(author)
    .fetch_optional(&mut *conn)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, rule_id = %id, "rules: mise à jour d'une règle");
        AppError::Database(e)
    })?
    .ok_or_else(|| AppError::NotFound("règle".into()))?;

    let rule = map_rule(&row);
    insert_version(
        conn,
        rule.id,
        rule.version,
        &draft.snapshot(rule.version),
        author,
        note,
    )
    .await?;
    Ok(rule)
}

async fn insert_version(
    conn: &mut PgConnection,
    rule_id: Uuid,
    version: i32,
    snapshot: &Value,
    author: Option<Uuid>,
    note: Option<&str>,
) -> Result<(), AppError> {
    sqlx::query(
        r#"INSERT INTO core.rule_versions (rule_id, version, snapshot, change_note, changed_by)
           VALUES ($1, $2, $3, $4, $5)"#,
    )
    .bind(rule_id)
    .bind(version)
    .bind(snapshot)
    .bind(note)
    .bind(author)
    .execute(&mut *conn)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, rule_id = %rule_id, version, "rules: écriture d'une version");
        AppError::Database(e)
    })?;
    Ok(())
}

pub async fn delete_rule(conn: &mut PgConnection, id: Uuid) -> Result<(), AppError> {
    let affected = sqlx::query("DELETE FROM core.rules WHERE id = $1")
        .bind(id)
        .execute(&mut *conn)
        .await
        .map_err(|e| {
            tracing::error!(error = %e, rule_id = %id, "rules: suppression d'une règle");
            AppError::Database(e)
        })?
        .rows_affected();
    if affected == 0 {
        return Err(AppError::NotFound("règle".into()));
    }
    Ok(())
}

pub async fn versions(db: &PgPool, rule_id: Uuid) -> Result<Vec<VersionRow>, AppError> {
    let rows = sqlx::query(
        r#"SELECT v.version, v.snapshot, v.change_note, v.changed_by, v.created_at,
                  COALESCE(NULLIF(u.display_name, ''), u.username) AS changed_by_label
             FROM core.rule_versions v
             LEFT JOIN core.users u ON u.id = v.changed_by
            WHERE v.rule_id = $1
            ORDER BY v.version DESC"#,
    )
    .bind(rule_id)
    .fetch_all(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, rule_id = %rule_id, "rules: lecture des versions");
        AppError::Database(e)
    })?;

    Ok(rows
        .iter()
        .map(|r| VersionRow {
            version: r.get("version"),
            snapshot: r.get("snapshot"),
            change_note: r.get("change_note"),
            changed_by: r.get("changed_by"),
            changed_by_label: r.get("changed_by_label"),
            created_at: r.get("created_at"),
        })
        .collect())
}

/// Wakes every core process so it rebuilds its memory index.
pub async fn notify_reload(db: &PgPool) {
    if let Err(e) = sqlx::query("SELECT pg_notify($1, '')")
        .bind(RULES_CHANNEL)
        .execute(db)
        .await
    {
        tracing::error!(error = %e, "rules: pg_notify sur le canal des règles");
    }
}

// ── Execution log ────────────────────────────────────────────────────────────

/// One line to append. Structural fields and counters only — see the header of
/// migration `000061` for why the inspected content is not among them.
#[derive(Debug, Clone)]
pub struct NewExecution {
    pub rule_id: Uuid,
    pub rule_version: i32,
    pub mode: Mode,
    pub outcome: Outcome,
    pub event_type: String,
    pub actor_user_id: Option<Uuid>,
    pub org_unit_id: Option<Uuid>,
    pub resource_type: Option<String>,
    pub resource_id: Option<String>,
    pub detail: Value,
    pub actions_total: i16,
    pub actions_ok: i16,
    pub actions_failed: i16,
    pub depth: i16,
    pub duration_ms: i32,
    /// The reference handed to a user the synchronous gate stopped. `None` for
    /// every execution that did not come from the gate — which is what makes
    /// the column a usable index rather than one that is set on every row.
    pub gate_reference: Option<String>,
}

impl NewExecution {
    pub fn new(rule: &Rule, mode: Mode, outcome: Outcome, event_type: impl Into<String>) -> Self {
        Self {
            rule_id: rule.id,
            rule_version: rule.version,
            mode,
            outcome,
            event_type: event_type.into(),
            actor_user_id: None,
            org_unit_id: None,
            resource_type: None,
            resource_id: None,
            detail: json!({}),
            actions_total: 0,
            actions_ok: 0,
            actions_failed: 0,
            depth: 0,
            duration_ms: 0,
            gate_reference: None,
        }
    }
}

pub async fn record_execution(db: &PgPool, exec: &NewExecution) -> Result<i64, AppError> {
    sqlx::query_scalar::<_, i64>(
        r#"INSERT INTO core.rule_executions
               (rule_id, rule_version, mode, outcome, event_type, actor_user_id,
                org_unit_id, resource_type, resource_id, detail,
                actions_total, actions_ok, actions_failed, depth, duration_ms,
                gate_reference)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
           RETURNING id"#,
    )
    .bind(exec.rule_id)
    .bind(exec.rule_version)
    .bind(exec.mode.as_str())
    .bind(exec.outcome.as_str())
    .bind(&exec.event_type)
    .bind(exec.actor_user_id)
    .bind(exec.org_unit_id)
    .bind(exec.resource_type.as_deref())
    .bind(exec.resource_id.as_deref())
    .bind(&exec.detail)
    .bind(exec.actions_total)
    .bind(exec.actions_ok)
    .bind(exec.actions_failed)
    .bind(exec.depth)
    .bind(exec.duration_ms)
    .bind(exec.gate_reference.as_deref())
    .fetch_one(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, rule_id = %exec.rule_id, "rules: écriture du journal d'exécution");
        AppError::Database(e)
    })
}

/// Updates the action counters of an execution once the dispatcher is done.
pub async fn settle_execution(
    db: &PgPool,
    execution_id: i64,
    ok: i16,
    failed: i16,
    detail: &Value,
) -> Result<(), AppError> {
    sqlx::query(
        r#"UPDATE core.rule_executions
              SET actions_ok = $2, actions_failed = $3, detail = $4,
                  outcome = CASE WHEN $3 > 0 AND $2 = 0 THEN 'error' ELSE outcome END
            WHERE id = $1"#,
    )
    .bind(execution_id)
    .bind(ok)
    .bind(failed)
    .bind(detail)
    .execute(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, execution_id, "rules: clôture d'une exécution");
        AppError::Database(e)
    })?;
    Ok(())
}

/// Filters accepted by the execution log endpoint.
#[derive(Debug, Clone, Default, serde::Deserialize)]
pub struct ExecutionQuery {
    pub rule_id: Option<Uuid>,
    pub mode: Option<String>,
    pub outcome: Option<String>,
    /// The reference a user was given by the gate. The whole point of handing
    /// one out: somebody who may read the run log pastes it and lands on the
    /// exact execution, without the user ever having learnt which rule it was.
    pub reference: Option<String>,
    pub limit: Option<i64>,
}

pub const MAX_EXECUTION_LIMIT: i64 = 200;

pub async fn list_executions(
    db: &PgPool,
    q: &ExecutionQuery,
) -> Result<Vec<ExecutionRow>, AppError> {
    let limit = q.limit.unwrap_or(50).clamp(1, MAX_EXECUTION_LIMIT);
    let rows = sqlx::query(
        r#"SELECT e.id, e.rule_id, r.name AS rule_name, e.rule_version, e.mode, e.outcome,
                  e.event_type, e.actor_user_id, e.org_unit_id, e.resource_type, e.resource_id,
                  e.detail, e.actions_total, e.actions_ok, e.actions_failed, e.depth,
                  e.duration_ms, e.occurred_at, e.gate_reference
             FROM core.rule_executions e
             LEFT JOIN core.rules r ON r.id = e.rule_id
            WHERE ($1::uuid IS NULL OR e.rule_id = $1)
              AND ($2::text IS NULL OR e.mode    = $2)
              AND ($3::text IS NULL OR e.outcome = $3)
              AND ($4::text IS NULL OR e.gate_reference = UPPER($4))
            ORDER BY e.occurred_at DESC, e.id DESC
            LIMIT $5"#,
    )
    .bind(q.rule_id)
    .bind(q.mode.as_deref())
    .bind(q.outcome.as_deref())
    .bind(q.reference.as_deref().map(str::trim).filter(|s| !s.is_empty()))
    .bind(limit)
    .fetch_all(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, "rules: lecture du journal d'exécution");
        AppError::Database(e)
    })?;

    Ok(rows
        .iter()
        .map(|r| ExecutionRow {
            id: r.get("id"),
            rule_id: r.get("rule_id"),
            rule_name: r.get("rule_name"),
            rule_version: r.get("rule_version"),
            mode: r.get("mode"),
            outcome: r.get("outcome"),
            event_type: r.get("event_type"),
            actor_user_id: r.get("actor_user_id"),
            org_unit_id: r.get("org_unit_id"),
            resource_type: r.get("resource_type"),
            resource_id: r.get("resource_id"),
            detail: r.get("detail"),
            actions_total: r.get("actions_total"),
            actions_ok: r.get("actions_ok"),
            actions_failed: r.get("actions_failed"),
            depth: r.get("depth"),
            duration_ms: r.get("duration_ms"),
            occurred_at: r.get("occurred_at"),
            gate_reference: r.get("gate_reference"),
        })
        .collect())
}

// ── Thresholds ───────────────────────────────────────────────────────────────

/// Records a match and returns how many happened inside the window, this one
/// included.
///
/// Rolling, not tumbling: "more than five times in fifteen minutes" must be true
/// at every instant, not only inside an arbitrary quarter-hour.
///
/// ## Two statements, on purpose
///
/// The obvious one-round-trip form —
/// `WITH inserted AS (INSERT …) SELECT COUNT(*) FROM core.rule_hits …` — is
/// **wrong**, and silently so. Every sub-statement of a `WITH` sees the snapshot
/// taken at the start of the whole statement, so the `SELECT` cannot see the row
/// the `INSERT` just wrote: the count came back one short, for ever, and a rule
/// asking for five occurrences fired on the sixth. An integration test is what
/// caught it. Two statements in one transaction cost one extra round trip and
/// are simply correct.
pub async fn hit_and_count(
    db: &PgPool,
    rule_id: Uuid,
    subject_key: &str,
    window_s: i32,
) -> Result<i64, AppError> {
    let mut tx = db.begin().await.map_err(|e| {
        tracing::error!(error = %e, rule_id = %rule_id, "rules: transaction de comptage du seuil");
        AppError::Database(e)
    })?;

    sqlx::query("INSERT INTO core.rule_hits (rule_id, subject_key) VALUES ($1, $2)")
        .bind(rule_id)
        .bind(subject_key)
        .execute(&mut *tx)
        .await
        .map_err(|e| {
            tracing::error!(error = %e, rule_id = %rule_id, "rules: écriture d'une occurrence de seuil");
            AppError::Database(e)
        })?;

    let count = sqlx::query_scalar::<_, i64>(
        r#"SELECT COUNT(*) FROM core.rule_hits
            WHERE rule_id = $1 AND subject_key = $2
              AND occurred_at > NOW() - make_interval(secs => $3::double precision)"#,
    )
    .bind(rule_id)
    .bind(subject_key)
    .bind(f64::from(window_s))
    .fetch_one(&mut *tx)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, rule_id = %rule_id, "rules: comptage du seuil");
        AppError::Database(e)
    })?;

    tx.commit().await.map_err(|e| {
        tracing::error!(error = %e, rule_id = %rule_id, "rules: commit du comptage du seuil");
        AppError::Database(e)
    })?;

    Ok(count)
}

/// Drops hits older than the widest window any rule declares. Called by the
/// maintenance job; the table is otherwise unbounded.
pub async fn purge_hits(db: &PgPool) -> Result<u64, AppError> {
    let rows = sqlx::query(
        r#"DELETE FROM core.rule_hits h
            USING core.rules r
            WHERE h.rule_id = r.id
              AND h.occurred_at < NOW()
                  - make_interval(secs => COALESCE(r.threshold_window_s, 0)::double precision)
                  - INTERVAL '1 hour'"#,
    )
    .execute(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, "rules: purge des occurrences de seuil");
        AppError::Database(e)
    })?
    .rows_affected();
    Ok(rows)
}

/// Drops executions past the configured retention.
pub async fn purge_executions(db: &PgPool, days: i64) -> Result<u64, AppError> {
    let rows = sqlx::query(
        "DELETE FROM core.rule_executions WHERE occurred_at < NOW() - make_interval(days => $1::int)",
    )
    .bind(days.clamp(1, 3_650) as i32)
    .execute(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, "rules: purge du journal d'exécution");
        AppError::Database(e)
    })?
    .rows_affected();
    Ok(rows)
}

// ── Subject resolution ───────────────────────────────────────────────────────

/// Everything a scope test needs about an account, in one query.
///
/// Called **only after a rule's conditions matched and its scope is non-empty**.
/// The hot path — deciding which rules an event concerns — is served entirely
/// from the memory index and never touches the database.
pub async fn resolve_subject(db: &PgPool, user_id: Uuid) -> Result<Subject, AppError> {
    let row = sqlx::query(
        r#"SELECT u.id,
                  u.org_unit_id,
                  COALESCE(
                      (SELECT array_agg(a.id) FROM core.org_unit_ancestors(u.org_unit_id, $2) a),
                      ARRAY[]::uuid[]
                  ) AS unit_chain,
                  COALESCE(
                      (SELECT array_agg(gm.group_id) FROM core.user_group_members gm WHERE gm.user_id = u.id),
                      ARRAY[]::uuid[]
                  ) AS group_ids
             FROM core.users u
            WHERE u.id = $1"#,
    )
    .bind(user_id)
    // The ceiling the console enforces, not a literal of our own: a bound
    // shorter than the tree an operator may legally build would truncate the
    // ancestor chain, and a rule scoped near the top would stop firing for the
    // deepest accounts without anything failing. One invariant, one constant.
    .bind(crate::handlers::admin::org_units::MAX_ORG_UNIT_DEPTH)
    .fetch_optional(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, user_id = %user_id, "rules: résolution du sujet");
        AppError::Database(e)
    })?;

    let Some(row) = row else {
        // The account vanished between the event and the evaluation. An unknown
        // subject is covered by nothing that names anybody.
        return Ok(Subject::default());
    };

    let org_unit_id: Option<Uuid> = row.get("org_unit_id");
    let mut unit_chain: Vec<Uuid> = row.get("unit_chain");
    // `org_unit_ancestors` walks upwards from the unit itself; the defensive
    // insert keeps the chain correct even if that ever stops being true.
    if let Some(own) = org_unit_id {
        if !unit_chain.contains(&own) {
            unit_chain.push(own);
        }
    }

    Ok(Subject {
        user_id: Some(row.get("id")),
        org_unit_id,
        unit_chain,
        group_ids: row.get("group_ids"),
    })
}

// ── Settings ─────────────────────────────────────────────────────────────────

/// Reads one numeric knob from `core.settings`, clamped to a sane range.
pub async fn setting_u64(db: &PgPool, key: &str, default: u64, min: u64, max: u64) -> u64 {
    let raw: Option<Value> = sqlx::query_scalar("SELECT value FROM core.settings WHERE key = $1")
        .bind(key)
        .fetch_optional(db)
        .await
        .unwrap_or_else(|e| {
            tracing::error!(error = %e, key = %key, "rules: lecture d'un réglage");
            None
        })
        .flatten();

    raw.as_ref()
        .and_then(Value::as_u64)
        .unwrap_or(default)
        .clamp(min, max)
}

/// Is the engine armed at all?
pub async fn engine_enabled(db: &PgPool) -> bool {
    let raw: Option<Value> =
        sqlx::query_scalar("SELECT value FROM core.settings WHERE key = 'rules.enabled'")
            .fetch_optional(db)
            .await
            .unwrap_or_else(|e| {
                tracing::error!(error = %e, "rules: lecture de rules.enabled");
                None
            })
            .flatten();
    raw.as_ref().and_then(Value::as_bool).unwrap_or(true)
}

// ── Backtests ────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, serde::Serialize)]
pub struct BacktestRow {
    pub id: Uuid,
    pub rule_id: Uuid,
    pub rule_version: i32,
    pub window_from: DateTime<Utc>,
    pub window_to: DateTime<Utc>,
    pub status: String,
    pub report: Value,
    pub error: Option<String>,
    pub created_at: DateTime<Utc>,
    pub completed_at: Option<DateTime<Utc>>,
}

fn map_backtest(r: &sqlx::postgres::PgRow) -> BacktestRow {
    BacktestRow {
        id: r.get("id"),
        rule_id: r.get("rule_id"),
        rule_version: r.get("rule_version"),
        window_from: r.get("window_from"),
        window_to: r.get("window_to"),
        status: r.get("status"),
        report: r.get("report"),
        error: r.get("error"),
        created_at: r.get("created_at"),
        completed_at: r.get("completed_at"),
    }
}

pub async fn create_backtest(
    db: &PgPool,
    rule: &Rule,
    from: DateTime<Utc>,
    to: DateTime<Utc>,
    requested_by: Option<Uuid>,
) -> Result<BacktestRow, AppError> {
    let row = sqlx::query(
        r#"INSERT INTO core.rule_backtests
               (rule_id, rule_version, window_from, window_to, requested_by)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id, rule_id, rule_version, window_from, window_to, status,
                     report, error, created_at, completed_at"#,
    )
    .bind(rule.id)
    .bind(rule.version)
    .bind(from)
    .bind(to)
    .bind(requested_by)
    .fetch_one(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, rule_id = %rule.id, "rules: création d'un test rétrospectif");
        AppError::Database(e)
    })?;
    Ok(map_backtest(&row))
}

pub async fn get_backtest(db: &PgPool, id: Uuid) -> Result<BacktestRow, AppError> {
    let row = sqlx::query(
        r#"SELECT id, rule_id, rule_version, window_from, window_to, status,
                  report, error, created_at, completed_at
             FROM core.rule_backtests WHERE id = $1"#,
    )
    .bind(id)
    .fetch_optional(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, backtest_id = %id, "rules: lecture d'un test rétrospectif");
        AppError::Database(e)
    })?
    .ok_or_else(|| AppError::NotFound("test rétrospectif".into()))?;
    Ok(map_backtest(&row))
}

pub async fn list_backtests(db: &PgPool, rule_id: Uuid) -> Result<Vec<BacktestRow>, AppError> {
    let rows = sqlx::query(
        r#"SELECT id, rule_id, rule_version, window_from, window_to, status,
                  report, error, created_at, completed_at
             FROM core.rule_backtests WHERE rule_id = $1
            ORDER BY created_at DESC LIMIT 20"#,
    )
    .bind(rule_id)
    .fetch_all(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, rule_id = %rule_id, "rules: lecture des tests rétrospectifs");
        AppError::Database(e)
    })?;
    Ok(rows.iter().map(map_backtest).collect())
}

pub async fn mark_backtest_running(db: &PgPool, id: Uuid) -> Result<(), AppError> {
    sqlx::query("UPDATE core.rule_backtests SET status = 'running' WHERE id = $1")
        .bind(id)
        .execute(db)
        .await
        .map_err(|e| {
            tracing::error!(error = %e, backtest_id = %id, "rules: passage en cours d'un test rétrospectif");
            AppError::Database(e)
        })?;
    Ok(())
}

pub async fn finish_backtest(
    db: &PgPool,
    id: Uuid,
    report: &Value,
    error: Option<&str>,
) -> Result<(), AppError> {
    sqlx::query(
        r#"UPDATE core.rule_backtests
              SET status = CASE WHEN $3::text IS NULL THEN 'done' ELSE 'failed' END,
                  report = $2, error = $3, completed_at = NOW()
            WHERE id = $1"#,
    )
    .bind(id)
    .bind(report)
    .bind(error)
    .execute(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, backtest_id = %id, "rules: clôture d'un test rétrospectif");
        AppError::Database(e)
    })?;
    Ok(())
}
