//! The catalogue: what a rule may react to, and what it may do.
//!
//! ## A module can only write under its own name
//!
//! A module declares a trigger or an action by its **bare name** —
//! `document_shared`, not `office.document_shared` — and the core prefixes it
//! with the module identifier at registration. Identical to `settings_schema`
//! and to [`crate::authz::catalog`], and for the same reason: a namespace a
//! module can choose is a namespace it can *claim*, and the first thing a
//! careless module would claim is `core`.
//!
//! ## The core is not a special case
//!
//! [`register_core`] pushes the core's own triggers and actions through
//! [`upsert`], into the same two tables, with the same validation and the same
//! forced prefixing. There is no core-only column, no core-only branch in the
//! engine, and no module identifier written anywhere in `crate::rules` except
//! the constant `"core"` used for the core's own declarations. Installing a
//! module therefore requires **zero lines** here.
//!
//! ## What happens to a departed module's entries
//!
//! A trigger a rule still references cannot be deleted (`ON DELETE RESTRICT`),
//! and must not be: deleting it would either cascade into the rule — silently
//! changing what the instance does — or leave the rule pointing at nothing.
//! Entries that disappeared from a re-registration are therefore **deleted when
//! nothing references them and flagged `is_orphan` when something does**, which
//! is the same answer [`crate::authz::catalog`] gives for privileges.

use serde::{Deserialize, Serialize};
use serde_json::Value;
use sqlx::{PgConnection, PgPool, Row};
use uuid::Uuid;

use crate::errors::AppError;

use super::condition::Operator;

/// The namespace the core declares under. A module may never take it.
pub const CORE_NAMESPACE: &str = "core";

/// Field type marking a **content part**: a piece of text the caller of the
/// synchronous gate submits for inspection, rather than a fact a rule compares.
///
/// The distinction is enforced by consequence rather than by decree. A content
/// field declares no operator, so `super::validate` refuses any comparison
/// against it; and content never enters [`super::facts::Facts`], so there is
/// nothing to compare even if one slipped through. What a rule may say about a
/// content part is therefore exactly one thing: a detector leaf.
///
/// Declaring it in the same `fields` array as everything else is what keeps the
/// console catalogue-driven: an editor that already renders a trigger's fields
/// learns which parts exist without the core growing a second manifest.
pub const CONTENT_TYPE: &str = "content";

/// Longest bare name a declaration may carry.
const MAX_NAME_LEN: usize = 60;

// ── Declarations ─────────────────────────────────────────────────────────────

/// One queryable field of a trigger, with the operators it accepts.
///
/// The operator list is what makes "no expression language" hold all the way
/// down: a rule may not merely use a known operator, it must use one this field
/// declares. Comparing a timestamp with `starts_with` is refused at write time
/// rather than silently answering `false` forever.
#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct FieldDef {
    /// Dotted path into the fact, e.g. `subject.email`.
    pub name: String,
    /// `string` | `number` | `bool` | `uuid` | `timestamp`. Descriptive: the
    /// evaluator is duck-typed, this drives the editor and the validation.
    #[serde(rename = "type")]
    pub value_type: String,
    pub label: String,
    #[serde(default)]
    pub operators: Vec<Operator>,
}

/// A trigger as declared in a registration payload. `key` is **relative**.
#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct TriggerDef {
    pub key: String,
    /// Event type on the bus. For a module this is the `event_type` of the
    /// `Custom` events it publishes.
    pub event_type: String,
    pub label: String,
    #[serde(default)]
    pub description: Option<String>,
    #[serde(default)]
    pub fields: Vec<FieldDef>,
}

/// An action as declared in a registration payload. `key` is **relative**.
#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct ActionDef {
    pub key: String,
    pub label: String,
    #[serde(default)]
    pub description: Option<String>,
    /// Internal route on the declaring module, POSTed by the dispatcher against
    /// its registered base URL. Mandatory for a module; `None` for the core's
    /// own in-process actions.
    #[serde(default)]
    pub endpoint: Option<String>,
    #[serde(default)]
    pub params: Vec<ParamDef>,
    /// Does the rest of the rule's action list wait for this one?
    #[serde(default)]
    pub blocking: bool,
    /// Can an operator walk the effect back?
    #[serde(default)]
    pub reversible: bool,
}

/// One parameter of an action.
#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct ParamDef {
    pub name: String,
    /// `string` | `number` | `bool` | `enum`.
    #[serde(rename = "type")]
    pub value_type: String,
    pub label: String,
    #[serde(default)]
    pub required: bool,
    /// Domain for `type = "enum"`.
    #[serde(default)]
    pub values: Option<Vec<Value>>,
}

// ── Rows, as the API serves them ─────────────────────────────────────────────

#[derive(Debug, Clone, Serialize)]
pub struct TriggerRow {
    pub key: String,
    pub module_id: String,
    pub event_type: String,
    pub label: String,
    pub description: Option<String>,
    pub fields: Value,
    pub is_orphan: bool,
}

#[derive(Debug, Clone, Serialize)]
pub struct ActionRow {
    pub key: String,
    pub module_id: String,
    pub label: String,
    pub description: Option<String>,
    pub params_schema: Value,
    pub is_blocking: bool,
    pub is_reversible: bool,
    pub is_orphan: bool,
}

// ── Qualification ────────────────────────────────────────────────────────────

/// Builds the full key, refusing anything that tries to escape the namespace.
fn qualify(namespace: &str, bare: &str) -> Result<String, AppError> {
    let bare = bare.trim();
    if bare.is_empty() || bare.len() > MAX_NAME_LEN {
        return Err(AppError::Validation(format!(
            "Nom « {bare} » invalide : 1 à {MAX_NAME_LEN} caractères"
        )));
    }
    // A bare name carrying its own prefix is a module choosing its namespace.
    if bare.contains('.') {
        return Err(AppError::Validation(format!(
            "Nom « {bare} » invalide : un module déclare un nom simple, le préfixe est ajouté par le core"
        )));
    }
    if !bare
        .chars()
        .all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '_')
    {
        return Err(AppError::Validation(format!(
            "Nom « {bare} » invalide : minuscules, chiffres et underscores uniquement"
        )));
    }
    Ok(format!("{namespace}.{bare}"))
}

/// Guard on the module-facing entry point.
fn refuse_core_namespace(module_id: &str) -> Result<(), AppError> {
    if module_id == CORE_NAMESPACE {
        return Err(AppError::Validation(
            "L'espace « core » est réservé au core".into(),
        ));
    }
    Ok(())
}

// ── Registration ─────────────────────────────────────────────────────────────

/// Upserts a **module's** declared triggers and actions.
///
/// Runs inside the registration transaction, next to `settings_schema` and the
/// privilege catalogue. A malformed declaration is skipped with a loud log
/// rather than failing the whole registration: a typo in one trigger must not
/// keep a module offline.
pub async fn register_module(
    conn: &mut PgConnection,
    module_id: &str,
    triggers: &[TriggerDef],
    actions: &[ActionDef],
) -> Result<(), AppError> {
    refuse_core_namespace(module_id)?;
    upsert(conn, module_id, triggers, actions, true).await
}

/// Upserts the **core's** own declarations. Same table, same validation, same
/// forced prefixing — see the module header for why that matters.
pub async fn register_core(
    conn: &mut PgConnection,
    triggers: &[TriggerDef],
    actions: &[ActionDef],
) -> Result<(), AppError> {
    upsert(conn, CORE_NAMESPACE, triggers, actions, false).await
}

/// The one implementation both entry points share.
///
/// `endpoint_required` is the only thing that differs, and it is a property of
/// the transport rather than of the declarer: a separate process must say where
/// to reach it, the core need not.
async fn upsert(
    conn: &mut PgConnection,
    namespace: &str,
    triggers: &[TriggerDef],
    actions: &[ActionDef],
    endpoint_required: bool,
) -> Result<(), AppError> {
    let mut trigger_keys: Vec<String> = Vec::with_capacity(triggers.len());
    for def in triggers {
        let full = match qualify(namespace, &def.key) {
            Ok(k) => k,
            Err(e) => {
                tracing::warn!(module_id = %namespace, key = %def.key, error = %e,
                    "Déclencheur ignoré : déclaration invalide");
                continue;
            }
        };
        if def.event_type.trim().is_empty() || def.event_type.len() > 160 {
            tracing::warn!(module_id = %namespace, key = %full,
                "Déclencheur ignoré : type d'événement absent ou trop long");
            continue;
        }
        let fields = serde_json::to_value(&def.fields).unwrap_or_else(|_| Value::Array(vec![]));

        sqlx::query(
            r#"INSERT INTO core.rule_triggers
                   (key, module_id, event_type, label, description, fields, is_orphan)
               VALUES ($1, $2, $3, $4, $5, $6, FALSE)
               ON CONFLICT (key) DO UPDATE SET
                   event_type  = EXCLUDED.event_type,
                   label       = EXCLUDED.label,
                   description = EXCLUDED.description,
                   fields      = EXCLUDED.fields,
                   is_orphan   = FALSE"#,
        )
        .bind(&full)
        .bind(namespace)
        .bind(def.event_type.trim())
        .bind(&def.label)
        .bind(def.description.as_deref())
        .bind(&fields)
        .execute(&mut *conn)
        .await
        .map_err(|e| {
            tracing::error!(error = %e, key = %full, "rules: enregistrement d'un déclencheur");
            AppError::Database(e)
        })?;
        trigger_keys.push(full);
    }

    let mut action_keys: Vec<String> = Vec::with_capacity(actions.len());
    for def in actions {
        let full = match qualify(namespace, &def.key) {
            Ok(k) => k,
            Err(e) => {
                tracing::warn!(module_id = %namespace, key = %def.key, error = %e,
                    "Action ignorée : déclaration invalide");
                continue;
            }
        };
        let endpoint = def.endpoint.as_deref().map(str::trim).filter(|s| !s.is_empty());
        if endpoint_required && endpoint.is_none() {
            tracing::warn!(module_id = %namespace, key = %full,
                "Action ignorée : un module doit déclarer l'endpoint interne qui l'exécute");
            continue;
        }
        if let Some(ep) = endpoint {
            if !ep.starts_with('/') || ep.len() > 500 {
                tracing::warn!(module_id = %namespace, key = %full, endpoint = %ep,
                    "Action ignorée : endpoint interne invalide (chemin absolu attendu)");
                continue;
            }
        }
        let params = serde_json::to_value(&def.params).unwrap_or_else(|_| Value::Array(vec![]));

        sqlx::query(
            r#"INSERT INTO core.rule_actions
                   (key, module_id, label, description, endpoint, params_schema,
                    is_blocking, is_reversible, is_orphan)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, FALSE)
               ON CONFLICT (key) DO UPDATE SET
                   label         = EXCLUDED.label,
                   description   = EXCLUDED.description,
                   endpoint      = EXCLUDED.endpoint,
                   params_schema = EXCLUDED.params_schema,
                   is_blocking   = EXCLUDED.is_blocking,
                   is_reversible = EXCLUDED.is_reversible,
                   is_orphan     = FALSE"#,
        )
        .bind(&full)
        .bind(namespace)
        .bind(&def.label)
        .bind(def.description.as_deref())
        .bind(endpoint)
        .bind(&params)
        .bind(def.blocking)
        .bind(def.reversible)
        .execute(&mut *conn)
        .await
        .map_err(|e| {
            tracing::error!(error = %e, key = %full, "rules: enregistrement d'une action");
            AppError::Database(e)
        })?;
        action_keys.push(full);
    }

    purge_vanished(conn, namespace, &trigger_keys, &action_keys).await
}

/// Removes entries this namespace no longer declares — and only those a rule
/// does not depend on. The rest survive, flagged, so an existing rule keeps
/// meaning something and the console can grey it out.
async fn purge_vanished(
    conn: &mut PgConnection,
    namespace: &str,
    trigger_keys: &[String],
    action_keys: &[String],
) -> Result<(), AppError> {
    sqlx::query(
        r#"DELETE FROM core.rule_triggers t
            WHERE t.module_id = $1
              AND NOT (t.key = ANY($2))
              AND NOT EXISTS (SELECT 1 FROM core.rules r WHERE r.trigger_key = t.key)"#,
    )
    .bind(namespace)
    .bind(trigger_keys)
    .execute(&mut *conn)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, module_id = %namespace, "rules: purge des déclencheurs disparus");
        AppError::Database(e)
    })?;

    sqlx::query(
        r#"UPDATE core.rule_triggers
              SET is_orphan = TRUE
            WHERE module_id = $1 AND NOT (key = ANY($2)) AND is_orphan = FALSE"#,
    )
    .bind(namespace)
    .bind(trigger_keys)
    .execute(&mut *conn)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, module_id = %namespace, "rules: marquage des déclencheurs orphelins");
        AppError::Database(e)
    })?;

    // An action is referenced from a JSONB array rather than by a foreign key,
    // so the dependency test is a containment check on `core.rules.actions`.
    sqlx::query(
        r#"DELETE FROM core.rule_actions a
            WHERE a.module_id = $1
              AND NOT (a.key = ANY($2))
              AND NOT EXISTS (
                    SELECT 1
                      FROM core.rules r,
                           LATERAL jsonb_array_elements(r.actions) AS spec
                     WHERE spec->>'action' = a.key
              )"#,
    )
    .bind(namespace)
    .bind(action_keys)
    .execute(&mut *conn)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, module_id = %namespace, "rules: purge des actions disparues");
        AppError::Database(e)
    })?;

    sqlx::query(
        r#"UPDATE core.rule_actions
              SET is_orphan = TRUE
            WHERE module_id = $1 AND NOT (key = ANY($2)) AND is_orphan = FALSE"#,
    )
    .bind(namespace)
    .bind(action_keys)
    .execute(&mut *conn)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, module_id = %namespace, "rules: marquage des actions orphelines");
        AppError::Database(e)
    })?;

    Ok(())
}

/// Flags as orphan every non-core entry whose module is no longer installed,
/// and clears the flag on those whose module came back. Cheap enough to run at
/// startup and after an uninstall; never deletes a row.
pub async fn refresh_orphans(db: &PgPool) -> Result<(), AppError> {
    for table in ["core.rule_triggers", "core.rule_actions"] {
        let sql = format!(
            r#"UPDATE {table} c
                  SET is_orphan = NOT EXISTS (SELECT 1 FROM core.modules m WHERE m.id = c.module_id)
                WHERE c.module_id <> 'core'
                  AND c.is_orphan <> NOT EXISTS (SELECT 1 FROM core.modules m WHERE m.id = c.module_id)"#
        );
        if let Err(e) = sqlx::query(&sql).execute(db).await {
            tracing::error!(error = %e, table = %table, "rules: réévaluation des orphelins");
            return Err(AppError::Database(e));
        }
    }
    Ok(())
}

// ── Reads ────────────────────────────────────────────────────────────────────

pub async fn list_triggers(db: &PgPool) -> Result<Vec<TriggerRow>, AppError> {
    let rows = sqlx::query(
        r#"SELECT key, module_id, event_type, label, description, fields, is_orphan
             FROM core.rule_triggers ORDER BY module_id, key"#,
    )
    .fetch_all(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, "rules: lecture du catalogue des déclencheurs");
        AppError::Database(e)
    })?;

    Ok(rows
        .iter()
        .map(|r| TriggerRow {
            key: r.get("key"),
            module_id: r.get("module_id"),
            event_type: r.get("event_type"),
            label: r.get("label"),
            description: r.get("description"),
            fields: r.get("fields"),
            is_orphan: r.get("is_orphan"),
        })
        .collect())
}

pub async fn list_actions(db: &PgPool) -> Result<Vec<ActionRow>, AppError> {
    let rows = sqlx::query(
        r#"SELECT key, module_id, label, description, params_schema,
                  is_blocking, is_reversible, is_orphan
             FROM core.rule_actions ORDER BY module_id, key"#,
    )
    .fetch_all(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, "rules: lecture du catalogue des actions");
        AppError::Database(e)
    })?;

    Ok(rows
        .iter()
        .map(|r| ActionRow {
            key: r.get("key"),
            module_id: r.get("module_id"),
            label: r.get("label"),
            description: r.get("description"),
            params_schema: r.get("params_schema"),
            is_blocking: r.get("is_blocking"),
            is_reversible: r.get("is_reversible"),
            is_orphan: r.get("is_orphan"),
        })
        .collect())
}

/// Everything the dispatcher needs to run one action.
#[derive(Debug, Clone)]
pub struct ResolvedAction {
    pub key: String,
    pub module_id: String,
    pub endpoint: Option<String>,
    pub is_blocking: bool,
    pub is_reversible: bool,
}

pub async fn resolve_action(db: &PgPool, key: &str) -> Result<Option<ResolvedAction>, AppError> {
    let row = sqlx::query(
        r#"SELECT key, module_id, endpoint, is_blocking, is_reversible
             FROM core.rule_actions WHERE key = $1"#,
    )
    .bind(key)
    .fetch_optional(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, action = %key, "rules: résolution d'une action");
        AppError::Database(e)
    })?;

    Ok(row.map(|r| ResolvedAction {
        key: r.get("key"),
        module_id: r.get("module_id"),
        endpoint: r.get("endpoint"),
        is_blocking: r.get("is_blocking"),
        is_reversible: r.get("is_reversible"),
    }))
}

/// The trigger a rule points at, with its declared fields — used to validate a
/// rule's comparisons against the vocabulary its trigger actually offers.
pub async fn get_trigger(db: &PgPool, key: &str) -> Result<Option<TriggerRow>, AppError> {
    let row = sqlx::query(
        r#"SELECT key, module_id, event_type, label, description, fields, is_orphan
             FROM core.rule_triggers WHERE key = $1"#,
    )
    .bind(key)
    .fetch_optional(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, trigger = %key, "rules: lecture d'un déclencheur");
        AppError::Database(e)
    })?;

    Ok(row.map(|r| TriggerRow {
        key: r.get("key"),
        module_id: r.get("module_id"),
        event_type: r.get("event_type"),
        label: r.get("label"),
        description: r.get("description"),
        fields: r.get("fields"),
        is_orphan: r.get("is_orphan"),
    }))
}

/// Parses the `fields` column back into declarations.
pub fn parse_fields(raw: &Value) -> Vec<FieldDef> {
    serde_json::from_value(raw.clone()).unwrap_or_default()
}

/// The content parts a trigger declares, in declaration order.
///
/// A trigger with none of them cannot carry a detector leaf: there would be
/// nothing to inspect, and a rule that can never fire must be refused when it is
/// written rather than discovered when it does not block anything.
pub fn content_parts(fields: &[FieldDef]) -> Vec<&str> {
    fields
        .iter()
        .filter(|f| f.value_type == CONTENT_TYPE)
        .map(|f| f.name.as_str())
        .collect()
}

/// Does `unit` exist? Used when validating a scope, so a rule cannot name a
/// unit that was deleted last week and quietly apply to nobody.
pub async fn org_unit_exists(db: &PgPool, unit: Uuid) -> Result<bool, AppError> {
    sqlx::query_scalar::<_, bool>("SELECT EXISTS (SELECT 1 FROM core.org_units WHERE id = $1)")
        .bind(unit)
        .fetch_one(db)
        .await
        .map_err(|e| {
            tracing::error!(error = %e, "rules: vérification d'une unité organisationnelle");
            AppError::Database(e)
        })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn the_prefix_is_added_by_the_core() {
        assert_eq!(
            qualify("office", "document_shared").expect("valide"),
            "office.document_shared"
        );
        assert_eq!(
            qualify(CORE_NAMESPACE, "login_failed").expect("valide"),
            "core.login_failed"
        );
    }

    #[test]
    fn a_module_cannot_choose_its_namespace() {
        // Not by smuggling a prefix in…
        assert!(qualify("office", "core.login_failed").is_err());
        // …nor with an empty or oversized name…
        assert!(qualify("office", "").is_err());
        assert!(qualify("office", &"a".repeat(MAX_NAME_LEN + 1)).is_err());
        // …nor with characters that would break the key grammar.
        assert!(qualify("office", "Document Shared").is_err());
        assert!(qualify("office", "doc-shared").is_err());
        // …and not by calling itself `core` through the module entry point.
        assert!(refuse_core_namespace("core").is_err());
        assert!(refuse_core_namespace("office").is_ok());
    }
}
