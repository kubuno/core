//! Reading the referential, and folding the overlay into it.
//!
//! ## The one query that matters
//!
//! [`feed`] answers "what are the special days between these two dates, for
//! somebody here". Everything it does is about *not* fanning out: a subdivision
//! inherits its country's days through one recursive CTE, exclusions and the
//! organisational-unit overlay are applied in the same pass, and the expansion
//! into dates happens in memory afterwards, where it is pure arithmetic.

use chrono::NaiveDate;
use serde_json::Value;
use sqlx::{postgres::PgRow, PgPool, Row};
use uuid::Uuid;

use super::model::{self, Category, Holiday, HolidayCalendar, Observance, Occurrence, Rule};
use super::rules;
use crate::errors::AppError;

/// A calendar plus what the console needs to judge it without opening it.
#[derive(Debug, Clone, serde::Serialize)]
pub struct CalendarSummary {
    #[serde(flatten)]
    pub calendar: HolidayCalendar,
    /// Days declared on the calendar itself.
    pub holiday_count: i64,
    /// Days it takes from its country, exclusions already deducted.
    pub inherited_count: i64,
    /// How many of its own days an administrator has edited.
    pub overridden_count: i64,
    pub subdivision_count: i64,
    /// The country name, for the console's grouping.
    pub display_name: String,
}

fn calendar_from_row(row: &PgRow) -> Result<HolidayCalendar, sqlx::Error> {
    Ok(HolidayCalendar {
        id: row.try_get("id")?,
        code: row.try_get("code")?,
        country_code: row.try_get("country_code")?,
        subdivision: row.try_get("subdivision")?,
        parent_id: row.try_get("parent_id")?,
        name: row.try_get("name")?,
        names: row.try_get("names")?,
        is_builtin: row.try_get("is_builtin")?,
        enabled: row.try_get("enabled")?,
        coverage_from: row.try_get("coverage_from")?,
        coverage_to: row.try_get("coverage_to")?,
    })
}

fn holiday_from_row(row: &PgRow) -> Result<Holiday, AppError> {
    let kind: String = row.try_get("kind").map_err(AppError::Database)?;
    let params: Value = row.try_get("rule").map_err(AppError::Database)?;
    let category: String = row.try_get("category").map_err(AppError::Database)?;
    let observance: String = row.try_get("observance").map_err(AppError::Database)?;
    Ok(Holiday {
        id: row.try_get("id").map_err(AppError::Database)?,
        calendar_id: row.try_get("calendar_id").map_err(AppError::Database)?,
        key: row.try_get("key").map_err(AppError::Database)?,
        name: row.try_get("name").map_err(AppError::Database)?,
        names: row.try_get("names").map_err(AppError::Database)?,
        category: Category::parse(&category)?,
        rule: Rule::from_parts(&kind, &params)?,
        observance: Observance::parse(&observance)?,
        from_year: row.try_get("from_year").map_err(AppError::Database)?,
        to_year: row.try_get("to_year").map_err(AppError::Database)?,
        color: row.try_get("color").map_err(AppError::Database)?,
        enabled: row.try_get("enabled").map_err(AppError::Database)?,
        is_builtin: row.try_get("is_builtin").map_err(AppError::Database)?,
        is_overridden: row.try_get("is_overridden").map_err(AppError::Database)?,
        is_orphan: row.try_get("is_orphan").map_err(AppError::Database)?,
    })
}

/// Every calendar, with its counts. `search` matches the code and every
/// localised name, so an operator typing "Maroc" finds `MA` in a French console
/// and one typing "Morocco" finds it in an English one.
pub async fn list_calendars(
    db: &PgPool,
    search: Option<&str>,
    countries_only: bool,
    only_enabled: bool,
    locale: &str,
) -> Result<Vec<CalendarSummary>, AppError> {
    let needle = search
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .map(|s| format!("%{}%", s.to_lowercase()));

    let rows = sqlx::query(
        r#"
        SELECT c.id, c.code, c.country_code, c.subdivision, c.parent_id, c.name, c.names,
               c.is_builtin, c.enabled, c.coverage_from, c.coverage_to,
               (SELECT COUNT(*) FROM core.holidays h WHERE h.calendar_id = c.id)::bigint AS holiday_count,
               (SELECT COUNT(*) FROM core.holidays h
                 WHERE h.calendar_id = c.parent_id
                   AND NOT EXISTS (SELECT 1 FROM core.holiday_exclusions e
                                    WHERE e.calendar_id = c.id AND e.key = h.key))::bigint AS inherited_count,
               (SELECT COUNT(*) FROM core.holidays h
                 WHERE h.calendar_id = c.id AND h.is_overridden)::bigint AS overridden_count,
               (SELECT COUNT(*) FROM core.holiday_calendars s WHERE s.parent_id = c.id)::bigint AS subdivision_count
          FROM core.holiday_calendars c
         WHERE ($1::bool IS NOT TRUE OR c.parent_id IS NULL)
           AND ($3::bool IS NOT TRUE OR c.enabled)
           AND ($2::text IS NULL
                OR LOWER(c.code) LIKE $2
                OR LOWER(c.name) LIKE $2
                -- Every translated name, so the search speaks the reader's
                -- language without the console shipping a country list of its own.
                OR EXISTS (SELECT 1 FROM jsonb_each_text(c.names) t WHERE LOWER(t.value) LIKE $2))
         ORDER BY c.parent_id NULLS FIRST, LOWER(c.name)
        "#,
    )
    .bind(countries_only)
    .bind(needle.as_deref())
    .bind(only_enabled)
    .fetch_all(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, "holidays: liste des calendriers");
        AppError::Database(e)
    })?;

    rows.iter()
        .map(|row| {
            let calendar = calendar_from_row(row).map_err(AppError::Database)?;
            let display_name = calendar.localized_name(locale);
            Ok(CalendarSummary {
                display_name,
                holiday_count: row.try_get("holiday_count").map_err(AppError::Database)?,
                inherited_count: row.try_get("inherited_count").map_err(AppError::Database)?,
                overridden_count: row.try_get("overridden_count").map_err(AppError::Database)?,
                subdivision_count: row.try_get("subdivision_count").map_err(AppError::Database)?,
                calendar,
            })
        })
        .collect()
}

/// One calendar by its id.
pub async fn calendar(db: &PgPool, id: Uuid) -> Result<HolidayCalendar, AppError> {
    let row = sqlx::query(
        "SELECT id, code, country_code, subdivision, parent_id, name, names, is_builtin, enabled, \
                coverage_from, coverage_to \
           FROM core.holiday_calendars WHERE id = $1",
    )
    .bind(id)
    .fetch_optional(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, "holidays: lecture d'un calendrier");
        AppError::Database(e)
    })?
    .ok_or_else(|| AppError::NotFound("Calendrier introuvable".into()))?;
    calendar_from_row(&row).map_err(AppError::Database)
}

/// The days declared on one calendar, and — when `include_inherited` — the ones
/// it takes from its country, exclusions already applied.
///
/// Returns `(holiday, inherited)` so the console can show an inherited row as
/// what it is: readable, and edited on the country rather than here.
pub async fn holidays_of(
    db: &PgPool,
    calendar_id: Uuid,
    include_inherited: bool,
) -> Result<Vec<(Holiday, bool)>, AppError> {
    let rows = sqlx::query(
        r#"
        SELECT h.id, h.calendar_id, h.key, h.name, h.names, h.category, h.kind, h.rule,
               h.observance, h.from_year, h.to_year, h.color, h.enabled,
               h.is_builtin, h.is_overridden, h.is_orphan,
               (h.calendar_id <> $1) AS inherited
          FROM core.holidays h
         WHERE h.calendar_id = $1
            OR ($2 AND h.calendar_id = (SELECT parent_id FROM core.holiday_calendars WHERE id = $1)
                   AND NOT EXISTS (SELECT 1 FROM core.holiday_exclusions e
                                    WHERE e.calendar_id = $1 AND e.key = h.key))
         ORDER BY inherited, LOWER(h.name)
        "#,
    )
    .bind(calendar_id)
    .bind(include_inherited)
    .fetch_all(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, "holidays: liste des journées");
        AppError::Database(e)
    })?;

    rows.iter()
        .map(|row| {
            let inherited: bool = row.try_get("inherited").map_err(AppError::Database)?;
            Ok((holiday_from_row(row)?, inherited))
        })
        .collect()
}

/// The keys of the parent's days a subdivision does not observe.
pub async fn exclusions(db: &PgPool, calendar_id: Uuid) -> Result<Vec<String>, AppError> {
    sqlx::query_scalar::<_, String>(
        "SELECT key FROM core.holiday_exclusions WHERE calendar_id = $1 ORDER BY key",
    )
    .bind(calendar_id)
    .fetch_all(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, "holidays: lecture des exclusions");
        AppError::Database(e)
    })
}

/// What one organisational unit turns on or off, closest ancestor first.
///
/// The walk goes *up*: a unit inherits its parent's adjustments, and its own
/// answer wins over theirs — the same rule as `core.setting_values`, so an
/// operator does not have to hold two inheritance models in their head.
pub async fn unit_prefs(
    db: &PgPool,
    org_unit_id: Uuid,
) -> Result<Vec<(Option<Uuid>, Option<Uuid>, bool, i32)>, AppError> {
    let rows = sqlx::query(
        r#"
        WITH RECURSIVE chain AS (
            SELECT id, parent_id, 0 AS depth FROM core.org_units WHERE id = $1
            UNION ALL
            SELECT u.id, u.parent_id, c.depth + 1
              FROM core.org_units u JOIN chain c ON u.id = c.parent_id
             -- A cycle written by a past bug must not hang a page request.
             WHERE c.depth < 32
        )
        SELECT p.calendar_id, p.holiday_id, p.enabled, c.depth
          FROM core.holiday_unit_prefs p
          JOIN chain c ON c.id = p.org_unit_id
         ORDER BY c.depth
        "#,
    )
    .bind(org_unit_id)
    .fetch_all(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, "holidays: lecture de la surcouche d'unité");
        AppError::Database(e)
    })?;

    rows.iter()
        .map(|row| {
            Ok((
                row.try_get("calendar_id").map_err(AppError::Database)?,
                row.try_get("holiday_id").map_err(AppError::Database)?,
                row.try_get("enabled").map_err(AppError::Database)?,
                row.try_get("depth").map_err(AppError::Database)?,
            ))
        })
        .collect()
}

/// What a request asks the feed for.
pub struct FeedQuery<'a> {
    /// Calendar codes, already resolved for the reader.
    pub codes: &'a [String],
    pub from: NaiveDate,
    pub to: NaiveDate,
    /// Empty means every category — a module that has not filtered wants the
    /// whole answer, not a silently narrowed one.
    pub categories: &'a [Category],
    pub locale: &'a str,
    /// The reader's unit, when known: what the overlay is applied for.
    pub org_unit_id: Option<Uuid>,
    /// `intl.holidays_enabled` — when false, only what this instance declared
    /// itself is served.
    pub builtin_enabled: bool,
}

/// Every occurrence in the range, for the calendars that apply.
pub async fn feed(db: &PgPool, query: FeedQuery<'_>) -> Result<Vec<Occurrence>, AppError> {
    if query.codes.is_empty() || query.from > query.to {
        return Ok(Vec::new());
    }

    let codes: Vec<String> = query.codes.iter().map(|c| c.to_uppercase()).collect();
    let categories: Vec<String> = query.categories.iter().map(|c| c.as_str().to_string()).collect();

    // The recursive part walks from the requested calendar up to its country,
    // carrying the *requested* calendar's identity along: a French inherited day
    // shown for `FR-6AE` must still say it is displayed under Alsace-Moselle.
    let rows = sqlx::query(
        r#"
        WITH RECURSIVE wanted AS (
            SELECT c.id, c.parent_id, c.enabled, c.id AS root_id, c.code AS root_code,
                   c.name AS root_name, c.names AS root_names, 0 AS depth
              FROM core.holiday_calendars c
             WHERE UPPER(c.code) = ANY($1)
            UNION ALL
            SELECT p.id, p.parent_id, p.enabled, w.root_id, w.root_code,
                   w.root_name, w.root_names, w.depth + 1
              FROM core.holiday_calendars p
              JOIN wanted w ON p.id = w.parent_id
             WHERE w.depth < 8
        )
        SELECT h.id, h.calendar_id, h.key, h.name, h.names, h.category, h.kind, h.rule,
               h.observance, h.from_year, h.to_year, h.color, h.enabled,
               h.is_builtin, h.is_overridden, h.is_orphan,
               w.root_id, w.root_code, w.root_name, w.root_names
          FROM wanted w
          JOIN core.holidays h ON h.calendar_id = w.id
         WHERE h.enabled
           AND w.enabled
           AND (h.is_builtin IS NOT TRUE OR $2)
           AND (cardinality($3::text[]) = 0 OR h.category = ANY($3))
           -- A day the requested calendar explicitly does not observe.
           AND NOT EXISTS (SELECT 1 FROM core.holiday_exclusions e
                            WHERE e.calendar_id = w.root_id AND e.key = h.key)
        "#,
    )
    .bind(&codes)
    .bind(query.builtin_enabled)
    .bind(&categories)
    .fetch_all(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, "holidays: flux");
        AppError::Database(e)
    })?;

    // The overlay, closest unit first: the first answer found for a target wins.
    let prefs = match query.org_unit_id {
        Some(unit) => unit_prefs(db, unit).await?,
        None => Vec::new(),
    };
    let pref_for = |calendar: Uuid, holiday: Uuid| -> Option<bool> {
        prefs
            .iter()
            .find(|(_, hol, _, _)| *hol == Some(holiday))
            .or_else(|| prefs.iter().find(|(cal, _, _, _)| *cal == Some(calendar)))
            .map(|(_, _, enabled, _)| *enabled)
    };

    let mut out = Vec::new();
    for row in &rows {
        let holiday = holiday_from_row(row)?;
        let root_id: Uuid = row.try_get("root_id").map_err(AppError::Database)?;
        if pref_for(root_id, holiday.id) == Some(false) {
            continue;
        }
        let root_code: String = row.try_get("root_code").map_err(AppError::Database)?;
        let root_name: String = row.try_get("root_name").map_err(AppError::Database)?;
        let root_names: Value = row.try_get("root_names").map_err(AppError::Database)?;
        let calendar_name = model::localized_name(&root_names, &root_name, query.locale);

        let name = holiday.localized_name(query.locale);
        for expansion in rules::expand(
            &holiday.rule,
            holiday.observance,
            query.from,
            query.to,
            holiday.from_year,
            holiday.to_year,
        ) {
            out.push(Occurrence {
                date: expansion.date,
                name: name.clone(),
                key: holiday.key.clone(),
                category: holiday.category,
                calendar_code: root_code.clone(),
                calendar_name: calendar_name.clone(),
                color: holiday.color.clone(),
                observed_from: expansion.observed_from,
            });
        }
    }

    // Sorted by date then by name: two calendars can answer for the same day,
    // and a stable order is what keeps a module's rendering from flickering
    // between two refreshes.
    out.sort_by(|a, b| a.date.cmp(&b.date).then_with(|| a.name.cmp(&b.name)));
    Ok(out)
}
