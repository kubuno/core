//! Writing scoped values: set, revert to inherited, lock.
//!
//! Every path here goes through the same two gates before touching a row:
//! the value must match the declaration ([`super::schema::SettingSchema::validate`]),
//! and no level above the target may hold a lock. The second gate is what makes
//! locking an enforceable rule rather than a hint in the interface.

use serde_json::Value;
use sqlx::PgConnection;
use uuid::Uuid;

use super::chain::{self, Resolution};
use super::schema::{self, SettingSchema};
use super::scope::{ScopeKind, SettingScope};
use crate::errors::AppError;

/// What a write did, for the audit entry and the change event.
#[derive(Debug, Clone)]
pub struct WriteOutcome {
    pub schema: SettingSchema,
    /// State before the write, as the target scope saw it.
    pub before: Resolution,
    /// The value that now applies at the target scope.
    pub effective: Option<Value>,
    pub locked: bool,
}

/// Refuses the write when a strictly more general level has locked the key.
fn ensure_writable(resolution: &Resolution, key: &str, scope: &SettingScope) -> Result<(), AppError> {
    if !resolution.locked_above {
        return Ok(());
    }
    let by = resolution
        .lock_source
        .as_ref()
        .and_then(|o| o.scope_name.clone())
        .unwrap_or_else(|| "l'organisation".into());
    tracing::warn!(
        key = %key,
        scope = %scope.kind.as_str(),
        scope_id = ?scope.id,
        "settings: écriture refusée, réglage verrouillé par un niveau supérieur"
    );
    Err(AppError::SettingLocked(format!(
        "'{key}' est verrouillé par {by} : la valeur ne peut pas être remplacée ici"
    )))
}

// ── The scope's subject must exist ───────────────────────────────────────────

/// Where a scope's subject lives, and how it is named in a refusal.
///
/// `Instance` has no subject at all — its `scope_id` is the sentinel uuid of
/// migration `000060` — and `Default` is the factory value rather than a
/// storable scope. Neither is checkable, and that is a property of the model,
/// not a gap in this function.
///
/// The table names are literals from this match and never come from a request:
/// the query built below interpolates only what is returned here.
fn subject_relation(kind: ScopeKind) -> Option<(&'static str, &'static str)> {
    match kind {
        ScopeKind::OrgUnit => Some(("core.org_units", "Unité organisationnelle")),
        ScopeKind::Group => Some(("core.user_groups", "Groupe")),
        ScopeKind::User => Some(("core.users", "Compte")),
        ScopeKind::Instance | ScopeKind::Default => None,
    }
}

/// Refuses a scope whose subject does not exist.
///
/// `core.setting_values.scope_id` is polymorphic and therefore carries no
/// foreign key (`000060:77`), so nothing in the schema was checking this. The
/// consequences were not merely untidy:
///
///   * `GET /admin/settings/resolved?scope_type=org_unit&scope_id=<any uuid>`
///     answered `200` with `can_override: true` on every declared key — a full
///     settings page for a unit that does not exist;
///   * the matching `PUT` stored a row keyed on that uuid. The purge trigger of
///     `000060:89` fires on the DELETE of a real subject, so it can never reach a
///     row whose subject never existed;
///   * and that row is UNREACHABLE afterwards. `core.setting_chain` walks
///     `core.org_unit_ancestors`, which returns nothing for a unit that is not
///     there, so the resolver reports "no own value at this scope" and
///     `DELETE /admin/settings/scoped/:key` refuses to remove it. It surfaces
///     only in the instance-level override warning, as a scope named « ? ».
///
/// Checked at the entry of every read and every write. Migration `000107`
/// deletes the rows created before this existed.
pub async fn ensure_subject_exists<'e, E: sqlx::PgExecutor<'e>>(
    db: E,
    scope: &SettingScope,
) -> Result<(), AppError> {
    let Some((table, label)) = subject_relation(scope.kind) else {
        return Ok(());
    };
    // `SettingScope::from_parts` already refuses a subject-less unit/group/user
    // scope, so this is unreachable through the API; treated as "nothing to
    // check" rather than as an error, because inventing a second refusal for a
    // case the constructor owns would just make the two disagree one day.
    let Some(id) = scope.id else {
        return Ok(());
    };

    let exists: bool = sqlx::query_scalar(&format!(
        "SELECT EXISTS(SELECT 1 FROM {table} WHERE id = $1)"
    ))
    .bind(id)
    .fetch_one(db)
    .await
    .map_err(|e| {
        tracing::error!(
            error = %e,
            scope = %scope.kind.as_str(),
            scope_id = %id,
            "settings: vérification de l'existence du sujet de portée impossible"
        );
        AppError::Database(e)
    })?;

    if !exists {
        tracing::warn!(
            scope = %scope.kind.as_str(),
            scope_id = %id,
            "settings: portée refusée, le sujet n'existe pas"
        );
        return Err(AppError::NotFound(format!("{label} {id}")));
    }
    Ok(())
}

/// Sets `key` at `scope`.
///
/// Runs on a connection rather than the pool so the caller can enclose it in the
/// audited transaction.
pub async fn set_value(
    conn: &mut PgConnection,
    key: &str,
    scope: &SettingScope,
    value: &Value,
    actor: Option<Uuid>,
) -> Result<WriteOutcome, AppError> {
    ensure_subject_exists(&mut *conn, scope).await?;
    let schema = schema::load(&mut *conn, key).await?;
    schema.validate(value)?;

    let before = chain::resolve_for(&mut *conn, key, scope).await?;
    ensure_writable(&before, key, scope)?;

    // The lock flag is a property of the level, not of the value: re-setting a
    // value at a level that locks must not silently unlock it.
    sqlx::query(
        r#"INSERT INTO core.setting_values (key, scope_type, scope_id, value, updated_at, updated_by)
           VALUES ($1, $2, $3, $4, NOW(), $5)
           ON CONFLICT (key, scope_type, scope_id) DO UPDATE
               SET value = EXCLUDED.value, updated_at = NOW(), updated_by = EXCLUDED.updated_by"#,
    )
    .bind(key)
    .bind(scope.kind.as_str())
    .bind(scope.storage_id())
    .bind(value)
    .bind(actor)
    .execute(&mut *conn)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, key = %key, "settings: écriture de la valeur impossible");
        AppError::Database(e)
    })?;

    Ok(WriteOutcome {
        schema,
        locked: before.locked_here,
        before,
        effective: Some(value.clone()),
    })
}

/// Removes the row held at `scope`, which is what makes the setting inherit
/// again — and keep following its parent afterwards. Deliberately **not** a
/// write of the inherited value.
pub async fn clear_value(
    conn: &mut PgConnection,
    key: &str,
    scope: &SettingScope,
    _actor: Option<Uuid>,
) -> Result<WriteOutcome, AppError> {
    ensure_subject_exists(&mut *conn, scope).await?;
    let schema = schema::load(&mut *conn, key).await?;
    let before = chain::resolve_for(&mut *conn, key, scope).await?;
    ensure_writable(&before, key, scope)?;

    if !before.has_own_value {
        return Err(AppError::Validation(format!(
            "'{key}' n'a pas de valeur propre à cette portée : rien à rétablir"
        )));
    }

    sqlx::query(
        "DELETE FROM core.setting_values WHERE key = $1 AND scope_type = $2 AND scope_id = $3",
    )
    .bind(key)
    .bind(scope.kind.as_str())
    .bind(scope.storage_id())
    .execute(&mut *conn)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, key = %key, "settings: suppression de la valeur impossible");
        AppError::Database(e)
    })?;

    Ok(WriteOutcome {
        schema,
        effective: before.inherited_value.clone(),
        locked: false,
        before,
    })
}

/// Locks or unlocks `key` at `scope` for every level below it.
///
/// Locking requires a value at that level: a lock with nothing to enforce would
/// pin whatever the level happens to inherit today and silently change meaning
/// when the parent moves.
pub async fn set_lock(
    conn: &mut PgConnection,
    key: &str,
    scope: &SettingScope,
    locked: bool,
    actor: Option<Uuid>,
) -> Result<WriteOutcome, AppError> {
    ensure_subject_exists(&mut *conn, scope).await?;
    let schema = schema::load(&mut *conn, key).await?;
    let before = chain::resolve_for(&mut *conn, key, scope).await?;
    ensure_writable(&before, key, scope)?;

    if locked && !before.has_own_value {
        return Err(AppError::Validation(format!(
            "'{key}' doit d'abord recevoir une valeur à cette portée pour être verrouillé"
        )));
    }
    if !locked && !before.has_own_value {
        return Err(AppError::Validation(format!(
            "'{key}' n'est pas verrouillé à cette portée"
        )));
    }

    sqlx::query(
        "UPDATE core.setting_values SET locked = $4, updated_at = NOW(), updated_by = $5 \
         WHERE key = $1 AND scope_type = $2 AND scope_id = $3",
    )
    .bind(key)
    .bind(scope.kind.as_str())
    .bind(scope.storage_id())
    .bind(locked)
    .bind(actor)
    .execute(&mut *conn)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, key = %key, "settings: verrouillage impossible");
        AppError::Database(e)
    })?;

    Ok(WriteOutcome {
        schema,
        effective: before.value.clone(),
        locked,
        before,
    })
}

/// Mirrors a `PATCH /me` preferences payload into the user scope.
///
/// Personal module settings are still written by the client as
/// `preferences[<module>][<key>]`, and `core.users.preferences` remains the
/// store for everything in there that is *not* a declared setting (widget
/// layout, language, sidebar widths). This keeps the two in step for the subset
/// that is one: the resolver reads `core.setting_values`, so a personal override
/// that never made it there would simply stop applying.
///
/// Driven by the patch rather than by the whole preferences document on purpose:
/// `preferences || patch` replaces a module subtree wholesale, so the patch is
/// the complete new state of every module it names — which is what lets a key
/// dropped from the subtree be deleted here rather than lingering.
///
/// Best effort by design. A key locked by a higher scope is skipped, not
/// refused: the rest of the payload is unrelated preference data, and failing it
/// all would turn "you may not change this one setting" into "your preferences
/// cannot be saved".
pub async fn sync_user_preferences(
    conn: &mut PgConnection,
    user_id: Uuid,
    patch: &Value,
) -> Result<(), AppError> {
    let Some(modules) = patch.as_object() else {
        return Ok(());
    };
    let scope = SettingScope::user(user_id);

    for (module_id, subtree) in modules {
        let Some(entries) = subtree.as_object() else {
            continue;
        };
        for (sub_key, value) in entries {
            let key = format!("{module_id}.{sub_key}");
            // Not a declared setting (widget layout and friends): nothing to
            // mirror, and `schema::load` is the cheapest way to find out.
            let Ok(declared) = schema::load(&mut *conn, &key).await else {
                continue;
            };
            if declared.module_id.as_deref() != Some(module_id.as_str()) {
                continue;
            }

            let resolution = chain::resolve_for(&mut *conn, &key, &scope).await?;
            if resolution.locked_above {
                tracing::info!(
                    %user_id, key = %key,
                    "settings: préférence ignorée, réglage verrouillé par l'organisation"
                );
                continue;
            }

            // A stored JSON null has always meant "reverted to the inherited
            // value" on this route; here that is a deletion, which is what keeps
            // the account following its unit afterwards.
            if value.is_null() {
                sqlx::query(
                    "DELETE FROM core.setting_values \
                     WHERE key = $1 AND scope_type = 'user' AND scope_id = $2",
                )
                .bind(&key)
                .bind(user_id)
                .execute(&mut *conn)
                .await
                .map_err(|e| {
                    tracing::error!(error = %e, key = %key, "settings: retrait de la préférence impossible");
                    AppError::Database(e)
                })?;
                continue;
            }

            if declared.validate(value).is_err() {
                tracing::warn!(%user_id, key = %key, "settings: préférence ignorée, valeur hors schéma");
                continue;
            }

            sqlx::query(
                r#"INSERT INTO core.setting_values (key, scope_type, scope_id, value, updated_at, updated_by)
                   VALUES ($1, 'user', $2, $3, NOW(), $2)
                   ON CONFLICT (key, scope_type, scope_id) DO UPDATE
                       SET value = EXCLUDED.value, updated_at = NOW()"#,
            )
            .bind(&key)
            .bind(user_id)
            .bind(value)
            .execute(&mut *conn)
            .await
            .map_err(|e| {
                tracing::error!(error = %e, key = %key, "settings: écriture de la préférence impossible");
                AppError::Database(e)
            })?;
        }
    }
    Ok(())
}

/// Scopes that override `key` below the instance — the "these will not be
/// affected" warning shown when editing at instance level.
#[derive(Debug, Clone, serde::Serialize)]
pub struct OverrideRef {
    pub scope_type: String,
    pub scope_id: Uuid,
    pub scope_name: String,
    pub locked: bool,
}

pub async fn list_overrides<'e, E: sqlx::PgExecutor<'e>>(
    db: E,
    key: &str,
) -> Result<Vec<OverrideRef>, AppError> {
    let rows: Vec<(String, Uuid, String, bool)> = sqlx::query_as(
        "SELECT scope_type, scope_id, scope_name, locked FROM core.setting_overrides($1)",
    )
    .bind(key)
    .fetch_all(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, key = %key, "settings: lecture des surcharges impossible");
        AppError::Database(e)
    })?;

    Ok(rows
        .into_iter()
        .map(|(scope_type, scope_id, scope_name, locked)| OverrideRef {
            scope_type,
            scope_id,
            scope_name,
            locked,
        })
        .collect())
}

/// Every override of every key at once, keyed by setting key. One query instead
/// of one per row when the console lists a whole category.
pub async fn overrides_by_key<'e, E: sqlx::PgExecutor<'e>>(
    db: E,
    keys: &[String],
) -> Result<std::collections::HashMap<String, Vec<OverrideRef>>, AppError> {
    let rows: Vec<(String, String, Uuid, String, bool)> = sqlx::query_as(
        r#"SELECT v.key, v.scope_type::TEXT, v.scope_id,
                  COALESCE(o.name, g.name, u.display_name, u.username, '?')::TEXT,
                  v.locked
             FROM core.setting_values v
             LEFT JOIN core.org_units   o ON v.scope_type = 'org_unit' AND o.id = v.scope_id
             LEFT JOIN core.user_groups g ON v.scope_type = 'group'    AND g.id = v.scope_id
             LEFT JOIN core.users       u ON v.scope_type = 'user'     AND u.id = v.scope_id
            WHERE v.key = ANY($1) AND v.scope_type <> 'instance'
            ORDER BY v.key, v.scope_type"#,
    )
    .bind(keys)
    .fetch_all(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, "settings: lecture groupée des surcharges impossible");
        AppError::Database(e)
    })?;

    let mut out: std::collections::HashMap<String, Vec<OverrideRef>> =
        std::collections::HashMap::new();
    for (key, scope_type, scope_id, scope_name, locked) in rows {
        out.entry(key).or_default().push(OverrideRef {
            scope_type,
            scope_id,
            scope_name,
            locked,
        });
    }
    Ok(out)
}

#[cfg(test)]
mod tests {
    use super::*;

    /// The three scopes with a subject each name the table that holds it, and the
    /// two without one name nothing. A scope added later without a branch here
    /// would be silently unchecked, which is exactly what this asserts against.
    #[test]
    fn every_scope_with_a_subject_names_its_table() {
        assert_eq!(
            subject_relation(ScopeKind::OrgUnit).map(|(t, _)| t),
            Some("core.org_units")
        );
        assert_eq!(
            subject_relation(ScopeKind::Group).map(|(t, _)| t),
            Some("core.user_groups")
        );
        assert_eq!(
            subject_relation(ScopeKind::User).map(|(t, _)| t),
            Some("core.users")
        );
        // No subject to check: the instance scope carries the sentinel uuid, and
        // the factory default is not a storable scope at all.
        assert!(subject_relation(ScopeKind::Instance).is_none());
        assert!(subject_relation(ScopeKind::Default).is_none());
    }

    /// Every table named is in the `core` schema and is a bare identifier — the
    /// string is interpolated into the existence query, so it must never be able
    /// to carry anything else. The values are literals, so this guards the *next*
    /// branch somebody adds.
    #[test]
    fn subject_tables_are_plain_core_identifiers() {
        for kind in [ScopeKind::OrgUnit, ScopeKind::Group, ScopeKind::User] {
            let (table, label) = subject_relation(kind).expect("a subject");
            assert!(table.starts_with("core."), "{table} is outside the core schema");
            assert!(
                table
                    .strip_prefix("core.")
                    .is_some_and(|t| !t.is_empty()
                        && t.chars().all(|c| c.is_ascii_lowercase() || c == '_')),
                "{table} is not a bare identifier"
            );
            assert!(!label.is_empty(), "{table} has no name for the refusal");
        }
    }
}
