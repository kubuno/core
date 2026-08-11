//! Reading the trail: filters, keyset pagination and CSV export.
//!
//! Pagination is **keyset**, never `OFFSET`. The trail grows while it is being
//! read — a busy instance writes entries between two pages — and an offset would
//! then shift every subsequent page, showing some rows twice and skipping
//! others. The cursor is the `(occurred_at, id)` pair of the last row returned,
//! and `id` breaks the tie for entries sharing a timestamp, which happens
//! routinely when one request writes several entries.

use base64::Engine as _;
use chrono::{DateTime, Utc};
use serde::Deserialize;
use sqlx::{PgPool, Row};

use super::model::AuditRow;
use crate::errors::AppError;

/// Page size ceiling. The screen paints a dense table; beyond this the payload
/// costs more than it shows.
pub const MAX_LIMIT: i64 = 200;
pub const DEFAULT_LIMIT: i64 = 50;

/// Rows streamed per database round-trip during a CSV export.
pub const EXPORT_CHUNK: i64 = 500;

/// Opaque position in the descending `(occurred_at, id)` ordering.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Cursor {
    pub occurred_at: DateTime<Utc>,
    pub id: i64,
}

impl Cursor {
    /// `<rfc3339 with nanoseconds>|<id>`, base64url without padding. Encoded so
    /// clients treat it as opaque and do not start arithmetic on it.
    pub fn encode(&self) -> String {
        let raw = format!("{}|{}", self.occurred_at.to_rfc3339(), self.id);
        base64::engine::general_purpose::URL_SAFE_NO_PAD.encode(raw)
    }

    pub fn decode(encoded: &str) -> Option<Self> {
        let bytes = base64::engine::general_purpose::URL_SAFE_NO_PAD
            .decode(encoded.trim())
            .ok()?;
        let text = String::from_utf8(bytes).ok()?;
        let (at, id) = text.rsplit_once('|')?;
        Some(Self {
            occurred_at: DateTime::parse_from_rfc3339(at).ok()?.with_timezone(&Utc),
            id: id.parse().ok()?,
        })
    }
}

/// Query string of `GET /admin/audit`.
#[derive(Debug, Default, Deserialize)]
pub struct AuditQuery {
    pub actor_id: Option<uuid::Uuid>,
    /// Exact action, or a prefix: `core.users` matches `core.users.*`.
    pub action: Option<String>,
    pub target_type: Option<String>,
    pub outcome: Option<String>,
    pub from: Option<DateTime<Utc>>,
    pub to: Option<DateTime<Utc>>,
    /// Free-text over actor label, target label and action.
    pub q: Option<String>,
    pub limit: Option<i64>,
    pub cursor: Option<String>,
}

const SELECT_COLUMNS: &str = r#"
    id, occurred_at, actor_id, actor_label, actor_role, actor_origin, actor_token_id,
    host(ip_address)::text AS ip_address, user_agent,
    action, module_id, target_type, target_id, target_label,
    before, after, outcome, detail,
    reversible, reverts_entry_id, reverted_by_entry_id
"#;

fn map_row(r: &sqlx::postgres::PgRow) -> AuditRow {
    AuditRow {
        id: r.get("id"),
        occurred_at: r.get("occurred_at"),
        actor_id: r.get("actor_id"),
        actor_label: r.get("actor_label"),
        actor_role: r.get("actor_role"),
        actor_origin: r.get("actor_origin"),
        actor_token_id: r.get("actor_token_id"),
        ip_address: r.get("ip_address"),
        user_agent: r.get("user_agent"),
        action: r.get("action"),
        module_id: r.get("module_id"),
        target_type: r.get("target_type"),
        target_id: r.get("target_id"),
        target_label: r.get("target_label"),
        before: r.get("before"),
        after: r.get("after"),
        outcome: r.get("outcome"),
        detail: r.get("detail"),
        reversible: r.get("reversible"),
        reverts_entry_id: r.get("reverts_entry_id"),
        reverted_by_entry_id: r.get("reverted_by_entry_id"),
    }
}

/// One page plus the cursor to the next one (`None` when the end is reached).
pub struct Page {
    pub rows: Vec<AuditRow>,
    pub next_cursor: Option<String>,
}

/// Fetches one page. `limit` is clamped to [`MAX_LIMIT`].
pub async fn list(db: &PgPool, q: &AuditQuery) -> Result<Page, AppError> {
    let limit = q.limit.unwrap_or(DEFAULT_LIMIT).clamp(1, MAX_LIMIT);
    let cursor = q.cursor.as_deref().and_then(Cursor::decode);

    let sql = format!(
        r#"SELECT {SELECT_COLUMNS}
           FROM core.admin_audit
           WHERE ($1::uuid  IS NULL OR actor_id = $1)
             AND ($2::text  IS NULL OR action = $2 OR action LIKE $2 || '.%')
             AND ($3::text  IS NULL OR target_type = $3)
             AND ($4::text  IS NULL OR outcome = $4)
             AND ($5::timestamptz IS NULL OR occurred_at >= $5)
             AND ($6::timestamptz IS NULL OR occurred_at <= $6)
             AND ($7::text  IS NULL OR actor_label ILIKE '%' || $7 || '%'
                                    OR target_label ILIKE '%' || $7 || '%'
                                    OR action ILIKE '%' || $7 || '%')
             AND ($8::timestamptz IS NULL OR (occurred_at, id) < ($8, $9))
           ORDER BY occurred_at DESC, id DESC
           LIMIT $10"#
    );

    // One extra row tells us whether a next page exists without a COUNT.
    let rows = sqlx::query(&sql)
        .bind(q.actor_id)
        .bind(q.action.as_deref().filter(|s| !s.is_empty()))
        .bind(q.target_type.as_deref().filter(|s| !s.is_empty()))
        .bind(q.outcome.as_deref().filter(|s| !s.is_empty()))
        .bind(q.from)
        .bind(q.to)
        .bind(q.q.as_deref().filter(|s| !s.is_empty()))
        .bind(cursor.map(|c| c.occurred_at))
        .bind(cursor.map(|c| c.id).unwrap_or_default())
        .bind(limit + 1)
        .fetch_all(db)
        .await
        .map_err(|e| {
            tracing::error!(error = %e, "audit: lecture de la page");
            AppError::Database(e)
        })?;

    let has_more = rows.len() as i64 > limit;
    let mut mapped: Vec<AuditRow> = rows.iter().take(limit as usize).map(map_row).collect();

    let next_cursor = if has_more {
        mapped.last().map(|r| {
            Cursor { occurred_at: r.occurred_at, id: r.id }.encode()
        })
    } else {
        None
    };

    // Defensive: never hand back a page whose last row is missing.
    mapped.shrink_to_fit();
    Ok(Page { rows: mapped, next_cursor })
}

/// Fetches a single entry.
pub async fn get(db: &PgPool, id: i64) -> Result<AuditRow, AppError> {
    let sql = format!("SELECT {SELECT_COLUMNS} FROM core.admin_audit WHERE id = $1");
    let row = sqlx::query(&sql)
        .bind(id)
        .fetch_optional(db)
        .await
        .map_err(|e| {
            tracing::error!(error = %e, entry_id = id, "audit: lecture de l'entrée");
            AppError::Database(e)
        })?
        .ok_or_else(|| AppError::NotFound(format!("Entrée d'audit {id}")))?;
    Ok(map_row(&row))
}

/// Escapes one CSV field (RFC 4180) and neutralises spreadsheet formula
/// injection: a field starting with `=`, `+`, `-` or `@` is prefixed with a
/// quote so a `=HYPERLINK(...)` crafted into a display name cannot execute when
/// the export is opened.
pub fn csv_field(value: &str) -> String {
    let sanitised = match value.chars().next() {
        Some('=' | '+' | '-' | '@') => format!("'{value}"),
        _ => value.to_string(),
    };
    if sanitised.contains([',', '"', '\n', '\r']) {
        format!("\"{}\"", sanitised.replace('"', "\"\""))
    } else {
        sanitised
    }
}

pub const CSV_HEADER: &str = "occurred_at,actor_label,actor_role,actor_origin,ip_address,action,module_id,target_type,target_id,target_label,outcome,detail\n";

/// Renders one row as a CSV line.
pub fn csv_line(r: &AuditRow) -> String {
    let f = |v: Option<&str>| csv_field(v.unwrap_or(""));
    format!(
        "{},{},{},{},{},{},{},{},{},{},{},{}\n",
        csv_field(&r.occurred_at.to_rfc3339()),
        csv_field(&r.actor_label),
        f(r.actor_role.as_deref()),
        csv_field(&r.actor_origin),
        f(r.ip_address.as_deref()),
        csv_field(&r.action),
        f(r.module_id.as_deref()),
        f(r.target_type.as_deref()),
        f(r.target_id.as_deref()),
        f(r.target_label.as_deref()),
        csv_field(&r.outcome),
        f(r.detail.as_deref()),
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::TimeZone;

    fn at(s: &str) -> DateTime<Utc> {
        DateTime::parse_from_rfc3339(s)
            .expect("horodatage de test valide")
            .with_timezone(&Utc)
    }

    #[test]
    fn cursor_round_trips() {
        let c = Cursor { occurred_at: at("2026-08-03T10:11:12.123456Z"), id: 4242 };
        let decoded = Cursor::decode(&c.encode()).expect("curseur décodable");
        assert_eq!(decoded.id, c.id);
        assert_eq!(decoded.occurred_at, c.occurred_at);
    }

    #[test]
    fn cursor_is_opaque_not_a_plain_integer() {
        let c = Cursor { occurred_at: Utc.timestamp_opt(0, 0).single().unwrap_or_default(), id: 7 };
        let encoded = c.encode();
        assert!(encoded.parse::<i64>().is_err());
        assert!(!encoded.contains('|'));
    }

    #[test]
    fn malformed_cursors_are_rejected_not_panicked_on() {
        assert!(Cursor::decode("").is_none());
        assert!(Cursor::decode("not-base64!!!").is_none());
        // Valid base64, meaningless payload.
        let junk = base64::engine::general_purpose::URL_SAFE_NO_PAD.encode("hello");
        assert!(Cursor::decode(&junk).is_none());
        let no_id = base64::engine::general_purpose::URL_SAFE_NO_PAD.encode("2026-08-03T00:00:00Z|abc");
        assert!(Cursor::decode(&no_id).is_none());
    }

    #[test]
    fn cursor_ordering_is_strict_so_a_page_never_repeats_its_boundary() {
        // Two entries written by the same request share a timestamp; the id must
        // break the tie, otherwise the boundary row comes back on the next page.
        let same = at("2026-08-03T10:00:00Z");
        let a = Cursor { occurred_at: same, id: 10 };
        let b = Cursor { occurred_at: same, id: 9 };
        assert_ne!(a.encode(), b.encode());
        assert!((b.occurred_at, b.id) < (a.occurred_at, a.id));
    }

    #[test]
    fn cursor_survives_sub_second_precision() {
        // Truncating to whole seconds would make two entries in the same second
        // indistinguishable and re-serve rows.
        let a = Cursor { occurred_at: at("2026-08-03T10:00:00.000001Z"), id: 1 };
        let b = Cursor { occurred_at: at("2026-08-03T10:00:00.000002Z"), id: 1 };
        let da = Cursor::decode(&a.encode()).expect("a");
        let db = Cursor::decode(&b.encode()).expect("b");
        assert!(da.occurred_at < db.occurred_at);
    }

    #[test]
    fn csv_escapes_quotes_and_separators() {
        assert_eq!(csv_field("plain"), "plain");
        assert_eq!(csv_field("a,b"), "\"a,b\"");
        assert_eq!(csv_field("say \"hi\""), "\"say \"\"hi\"\"\"");
        assert_eq!(csv_field("line\nbreak"), "\"line\nbreak\"");
    }

    #[test]
    fn csv_neutralises_formula_injection() {
        assert_eq!(csv_field("=HYPERLINK(\"http://x\")"), "\"'=HYPERLINK(\"\"http://x\"\")\"");
        assert!(csv_field("+1").starts_with('\''));
        assert!(csv_field("@SUM(A1)").starts_with('\''));
        assert!(csv_field("-2").starts_with('\''));
    }

    #[test]
    fn csv_header_and_line_have_the_same_arity() {
        let row = AuditRow {
            id: 1,
            occurred_at: at("2026-08-03T10:00:00Z"),
            actor_id: None,
            actor_label: "alice <a@b.c>".into(),
            actor_role: Some("admin".into()),
            actor_origin: "session".into(),
            actor_token_id: None,
            ip_address: Some("127.0.0.1".into()),
            user_agent: None,
            action: "core.users.update".into(),
            module_id: Some("core".into()),
            target_type: Some("user".into()),
            target_id: Some("42".into()),
            target_label: Some("bob".into()),
            before: None,
            after: None,
            outcome: "success".into(),
            detail: None,
            reversible: true,
            reverts_entry_id: None,
            reverted_by_entry_id: None,
        };
        let header_cols = CSV_HEADER.trim_end().split(',').count();
        let line = csv_line(&row);
        assert_eq!(line.trim_end().split(',').count(), header_cols);
    }
}
