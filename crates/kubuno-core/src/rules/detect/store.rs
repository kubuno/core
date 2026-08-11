//! Reading, writing and caching detectors.
//!
//! ## Why there is a cache at all
//!
//! Compiling a regular expression costs microseconds to milliseconds. Doing it
//! per request would make the price of the feature proportional to traffic
//! rather than to configuration, and would put a pattern's compile cost on the
//! path of the user whose message is being checked. The compiled set is
//! therefore built once and replaced atomically, exactly like
//! [`super::super::index`] does for rules — and reloaded through the **same**
//! `LISTEN/NOTIFY` channel, so there is one refresh mechanism on the instance
//! rather than two that can disagree about which is stale.
//!
//! ## A detector that will not compile does not stop the others
//!
//! A build failure is logged and that detector is left out of the set. The
//! alternative — refusing to load anything — means one bad pattern disarms every
//! rule on the instance, which is the failure mode a data-protection control can
//! least afford. Validation at write time is what keeps this branch rare; it is
//! not what keeps it impossible, because a `regex` upgrade could in principle
//! reject something it used to accept.

use std::collections::HashMap;
use std::sync::{Arc, LazyLock, RwLock};

use chrono::{DateTime, Utc};
use serde_json::Value;
use sqlx::{PgConnection, PgPool, Row};
use uuid::Uuid;

use crate::errors::AppError;

use super::checksum::Checksum;
use super::model::{Detector, Kind};
use super::scan::Compiled;

// ── Rows ─────────────────────────────────────────────────────────────────────

const COLUMNS: &str = r#"id, key, label, description, category, kind, pattern, terms, checksum,
    proximity_terms, proximity_window, proximity_required,
    base_confidence, checksum_bonus, proximity_bonus,
    min_confidence, min_matches, min_unique_matches,
    is_enabled, is_builtin, created_at, updated_at"#;

fn row_to_detector(r: &sqlx::postgres::PgRow) -> Detector {
    let kind: String = r.get("kind");
    let checksum: Option<String> = r.get("checksum");
    Detector {
        id: r.get("id"),
        key: r.get("key"),
        label: r.get("label"),
        description: r.get("description"),
        category: r.get("category"),
        // A row whose kind the binary does not know reads as a plain pattern
        // rather than failing the whole load. The CHECK constraint makes this
        // unreachable today; it stops being unreachable the day a downgrade
        // meets a newer schema.
        kind: Kind::parse(&kind).unwrap_or(Kind::Regex),
        pattern: r.get("pattern"),
        terms: string_list(&r.get::<Value, _>("terms")),
        checksum: checksum.as_deref().and_then(Checksum::parse),
        proximity_terms: string_list(&r.get::<Value, _>("proximity_terms")),
        proximity_window: r.get("proximity_window"),
        proximity_required: r.get("proximity_required"),
        base_confidence: r.get("base_confidence"),
        checksum_bonus: r.get("checksum_bonus"),
        proximity_bonus: r.get("proximity_bonus"),
        min_confidence: r.get("min_confidence"),
        min_matches: r.get("min_matches"),
        min_unique_matches: r.get("min_unique_matches"),
        is_enabled: r.get("is_enabled"),
        is_builtin: r.get("is_builtin"),
        created_at: r.get::<DateTime<Utc>, _>("created_at"),
        updated_at: r.get::<DateTime<Utc>, _>("updated_at"),
    }
}

fn string_list(raw: &Value) -> Vec<String> {
    match raw {
        Value::Array(items) => items
            .iter()
            .filter_map(|v| v.as_str().map(str::to_string))
            .collect(),
        _ => Vec::new(),
    }
}

// ── Reads ────────────────────────────────────────────────────────────────────

pub async fn list(db: &PgPool) -> Result<Vec<Detector>, AppError> {
    let sql = format!("SELECT {COLUMNS} FROM core.content_detectors ORDER BY category, label");
    let rows = sqlx::query(&sql).fetch_all(db).await.map_err(|e| {
        tracing::error!(error = %e, "detectors: lecture du catalogue");
        AppError::Database(e)
    })?;
    Ok(rows.iter().map(row_to_detector).collect())
}

pub async fn get(db: &PgPool, id: Uuid) -> Result<Detector, AppError> {
    let sql = format!("SELECT {COLUMNS} FROM core.content_detectors WHERE id = $1");
    let row = sqlx::query(&sql)
        .bind(id)
        .fetch_optional(db)
        .await
        .map_err(|e| {
            tracing::error!(error = %e, "detectors: lecture d'un détecteur");
            AppError::Database(e)
        })?;
    row.as_ref()
        .map(row_to_detector)
        .ok_or_else(|| AppError::NotFound("détecteur".into()))
}

pub async fn key_exists(db: &PgPool, key: &str, except: Option<Uuid>) -> Result<bool, AppError> {
    sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS (SELECT 1 FROM core.content_detectors WHERE key = $1 AND ($2::uuid IS NULL OR id <> $2))",
    )
    .bind(key)
    .bind(except)
    .fetch_one(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, "detectors: vérification d'unicité de clé");
        AppError::Database(e)
    })
}

// ── Writes ───────────────────────────────────────────────────────────────────

/// A detector as it is about to be stored, already validated.
#[derive(Debug, Clone)]
pub struct DetectorDraft {
    pub key: String,
    pub label: String,
    pub description: Option<String>,
    pub category: String,
    pub kind: Kind,
    pub pattern: Option<String>,
    pub terms: Vec<String>,
    pub checksum: Option<Checksum>,
    pub proximity_terms: Vec<String>,
    pub proximity_window: i32,
    pub proximity_required: bool,
    pub base_confidence: f32,
    pub checksum_bonus: f32,
    pub proximity_bonus: f32,
    pub min_confidence: f32,
    pub min_matches: i32,
    pub min_unique_matches: i32,
    pub is_enabled: bool,
}

pub async fn insert(
    conn: &mut PgConnection,
    draft: &DetectorDraft,
    author: Option<Uuid>,
) -> Result<Detector, AppError> {
    let sql = format!(
        r#"INSERT INTO core.content_detectors
               (key, label, description, category, kind, pattern, terms, checksum,
                proximity_terms, proximity_window, proximity_required,
                base_confidence, checksum_bonus, proximity_bonus,
                min_confidence, min_matches, min_unique_matches,
                is_enabled, is_builtin, created_by, updated_by)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,FALSE,$19,$19)
           RETURNING {COLUMNS}"#
    );
    let row = bind_draft(sqlx::query(&sql), draft)
        .bind(author)
        .fetch_one(&mut *conn)
        .await
        .map_err(|e| {
            tracing::error!(error = %e, key = %draft.key, "detectors: création");
            AppError::Database(e)
        })?;
    Ok(row_to_detector(&row))
}

pub async fn update(
    conn: &mut PgConnection,
    id: Uuid,
    draft: &DetectorDraft,
    author: Option<Uuid>,
) -> Result<Detector, AppError> {
    let sql = format!(
        r#"UPDATE core.content_detectors SET
               key = $1, label = $2, description = $3, category = $4, kind = $5,
               pattern = $6, terms = $7, checksum = $8,
               proximity_terms = $9, proximity_window = $10, proximity_required = $11,
               base_confidence = $12, checksum_bonus = $13, proximity_bonus = $14,
               min_confidence = $15, min_matches = $16, min_unique_matches = $17,
               is_enabled = $18, updated_by = $19
           WHERE id = $20
           RETURNING {COLUMNS}"#
    );
    let row = bind_draft(sqlx::query(&sql), draft)
        .bind(author)
        .bind(id)
        .fetch_optional(&mut *conn)
        .await
        .map_err(|e| {
            tracing::error!(error = %e, %id, "detectors: modification");
            AppError::Database(e)
        })?;
    row.as_ref()
        .map(row_to_detector)
        .ok_or_else(|| AppError::NotFound("détecteur".into()))
}

/// Deletes a detector. Built-ins are refused by the caller, not here.
pub async fn delete(conn: &mut PgConnection, id: Uuid) -> Result<(), AppError> {
    sqlx::query("DELETE FROM core.content_detectors WHERE id = $1")
        .bind(id)
        .execute(&mut *conn)
        .await
        .map_err(|e| {
            tracing::error!(error = %e, %id, "detectors: suppression");
            AppError::Database(e)
        })?;
    Ok(())
}

fn bind_draft<'q>(
    q: sqlx::query::Query<'q, sqlx::Postgres, sqlx::postgres::PgArguments>,
    d: &'q DetectorDraft,
) -> sqlx::query::Query<'q, sqlx::Postgres, sqlx::postgres::PgArguments> {
    q.bind(&d.key)
        .bind(&d.label)
        .bind(d.description.as_deref())
        .bind(&d.category)
        .bind(d.kind.as_str())
        .bind(d.pattern.as_deref())
        .bind(Value::from(d.terms.clone()))
        .bind(d.checksum.map(|c| c.as_str()))
        .bind(Value::from(d.proximity_terms.clone()))
        .bind(d.proximity_window)
        .bind(d.proximity_required)
        .bind(d.base_confidence)
        .bind(d.checksum_bonus)
        .bind(d.proximity_bonus)
        .bind(d.min_confidence)
        .bind(d.min_matches)
        .bind(d.min_unique_matches)
        .bind(d.is_enabled)
}

/// Which rules reference this detector, by name.
///
/// Asked before a deletion, so the console can say "three rules use this" rather
/// than leaving an operator to find out from a rule that quietly stopped
/// blocking. The condition tree is JSONB, so the question is a containment test
/// rather than a foreign key — a detector leaf can sit at any depth.
pub async fn rules_using(db: &PgPool, key: &str) -> Result<Vec<String>, AppError> {
    let rows = sqlx::query(
        r#"SELECT name FROM core.rules
            WHERE conditions::text LIKE '%' || $1 || '%'
            ORDER BY name"#,
    )
    .bind(key)
    .fetch_all(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, "detectors: recherche des règles utilisatrices");
        AppError::Database(e)
    })?;
    Ok(rows.iter().map(|r| r.get::<String, _>("name")).collect())
}

// ── The compiled set ─────────────────────────────────────────────────────────

/// Every enabled detector, compiled, keyed by its catalogue key.
#[derive(Debug, Default)]
pub struct DetectorSet {
    by_key: HashMap<String, Arc<Compiled>>,
}

impl DetectorSet {
    pub fn get(&self, key: &str) -> Option<&Arc<Compiled>> {
        self.by_key.get(key)
    }

    pub fn len(&self) -> usize {
        self.by_key.len()
    }

    pub fn is_empty(&self) -> bool {
        self.by_key.is_empty()
    }
}

static SET: LazyLock<RwLock<Arc<DetectorSet>>> =
    LazyLock::new(|| RwLock::new(Arc::new(DetectorSet::default())));

/// The current set. One lock acquisition and an `Arc` clone.
pub fn snapshot() -> Arc<DetectorSet> {
    match SET.read() {
        Ok(guard) => Arc::clone(&guard),
        Err(poisoned) => {
            // Same reasoning as the rule index: serving a possibly stale value
            // beats propagating a panic into the gate, which would take the
            // portal down for every module at once.
            tracing::error!("detectors: verrou du jeu compilé empoisonné, lecture forcée");
            Arc::clone(&poisoned.into_inner())
        }
    }
}

/// Rebuilds the compiled set from the database. Called at startup and from the
/// rules reload listener.
pub async fn reload(db: &PgPool) -> Result<usize, AppError> {
    let detectors = list(db).await?;
    let mut by_key = HashMap::new();
    let mut skipped = 0usize;

    for d in detectors.into_iter().filter(|d| d.is_enabled) {
        let key = d.key.clone();
        match Compiled::build(d) {
            Ok(c) => {
                by_key.insert(key, Arc::new(c));
            }
            Err(e) => {
                skipped += 1;
                // Loud, and only about this one detector: one unbuildable
                // pattern must not disarm every rule on the instance.
                tracing::error!(error = %e, detector = %key,
                    "Détecteur ignoré : son motif ne compile pas");
            }
        }
    }

    let loaded = by_key.len();
    let set = Arc::new(DetectorSet { by_key });
    match SET.write() {
        Ok(mut guard) => *guard = set,
        Err(poisoned) => *poisoned.into_inner() = set,
    }
    if skipped > 0 {
        tracing::warn!(ignorés = skipped, chargés = loaded, "Détecteurs de contenu rechargés");
    }
    Ok(loaded)
}

// ── Settings ─────────────────────────────────────────────────────────────────

/// A string setting, trimmed, with a fallback. `core.settings.value` is JSONB,
/// so a value written as a bare string and one written as a JSON string both
/// have to read.
pub async fn setting_str(db: &PgPool, key: &str, default: &str) -> String {
    let raw: Option<Value> = sqlx::query_scalar("SELECT value FROM core.settings WHERE key = $1")
        .bind(key)
        .fetch_optional(db)
        .await
        .unwrap_or_else(|e| {
            tracing::error!(error = %e, key = %key, "detectors: lecture d'un réglage");
            None
        })
        .flatten();

    raw.as_ref()
        .map(|v| match v {
            Value::String(s) => s.trim().to_string(),
            other => other.to_string(),
        })
        .filter(|s| !s.is_empty())
        .unwrap_or_else(|| default.to_string())
}

pub async fn setting_bool(db: &PgPool, key: &str, default: bool) -> bool {
    let raw: Option<Value> = sqlx::query_scalar("SELECT value FROM core.settings WHERE key = $1")
        .bind(key)
        .fetch_optional(db)
        .await
        .unwrap_or_else(|e| {
            tracing::error!(error = %e, key = %key, "detectors: lecture d'un réglage");
            None
        })
        .flatten();
    raw.as_ref().and_then(Value::as_bool).unwrap_or(default)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_json_array_of_anything_else_reads_as_no_terms() {
        assert_eq!(string_list(&serde_json::json!(["a", "b"])), vec!["a", "b"]);
        // Numbers and nested objects are dropped rather than stringified: a
        // term that is not text is a term nobody typed.
        assert_eq!(string_list(&serde_json::json!(["a", 3, {}])), vec!["a"]);
        assert!(string_list(&serde_json::json!({})).is_empty());
        assert!(string_list(&Value::Null).is_empty());
    }

    #[test]
    fn an_empty_set_answers_none_rather_than_panicking() {
        let set = DetectorSet::default();
        assert!(set.get("core.iban").is_none());
        assert!(set.is_empty());
        assert_eq!(set.len(), 0);
    }
}
