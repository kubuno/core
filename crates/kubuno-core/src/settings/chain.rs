//! The inheritance chain of one setting, and the policy applied to it.
//!
//! The database builds the chain (`core.setting_chain`, migration `000060`);
//! everything below decides what it *means*: which level wins, which value the
//! target would fall back to if its own row were removed, and whether a level
//! above has locked the key. Keeping the policy here rather than in SQL is what
//! makes it unit-testable without a database.

use serde::Serialize;
use serde_json::Value;
use sqlx::postgres::PgRow;
use sqlx::{PgExecutor, Row};
use uuid::Uuid;

use super::scope::{ScopeKind, SettingScope};
use crate::errors::AppError;

/// One level of the chain that actually carries a value.
#[derive(Debug, Clone, Serialize)]
pub struct ChainLevel {
    pub scope_type: String,
    pub scope_id: Option<Uuid>,
    /// Unit / group / account name. `None` for the factory default and the
    /// instance, which have no subject to name.
    pub scope_name: Option<String>,
    /// Internal ordering weight — the higher, the more specific.
    pub specificity: i32,
    pub value: Value,
    pub locked: bool,
    pub updated_at: Option<chrono::DateTime<chrono::Utc>>,
    pub updated_by: Option<Uuid>,
}

impl ChainLevel {
    fn from_row(row: &PgRow) -> Result<Self, sqlx::Error> {
        Ok(Self {
            scope_type: row.try_get("scope_type")?,
            scope_id: row.try_get("scope_id")?,
            scope_name: row.try_get("scope_name")?,
            specificity: row.try_get("specificity")?,
            value: row.try_get("value")?,
            locked: row.try_get("locked")?,
            updated_at: row.try_get("updated_at")?,
            updated_by: row.try_get("updated_by")?,
        })
    }

    /// True when this level *is* the target scope — the row an admin would
    /// delete to go back to inheriting.
    fn is_own(&self, scope: &SettingScope) -> bool {
        self.scope_type == scope.kind.as_str() && self.scope_id == scope.id
    }
}

/// A short description of where a value comes from, as returned by the API.
#[derive(Debug, Clone, Serialize, PartialEq)]
pub struct Origin {
    pub scope_type: String,
    pub scope_id: Option<Uuid>,
    pub scope_name: Option<String>,
}

impl From<&ChainLevel> for Origin {
    fn from(l: &ChainLevel) -> Self {
        Self {
            scope_type: l.scope_type.clone(),
            scope_id: l.scope_id,
            scope_name: l.scope_name.clone(),
        }
    }
}

/// Everything the UI needs to draw one setting at one scope, provenance first.
#[derive(Debug, Clone, Serialize)]
pub struct Resolution {
    /// The value that actually applies.
    pub value: Option<Value>,
    /// Which level it came from.
    pub source: Option<Origin>,
    /// True when the target scope holds its own row.
    pub has_own_value: bool,
    /// What the target would fall back to if its own row were removed. Equal to
    /// `value` when the setting is already inherited.
    pub inherited_value: Option<Value>,
    pub inherited_source: Option<Origin>,
    /// True when a level *strictly above* the target has locked the key: the
    /// target cannot write, and its own row (if any) is ignored.
    pub locked_above: bool,
    /// True when the target scope itself holds the lock.
    pub locked_here: bool,
    /// Which level holds the lock, whichever side of the target it sits on.
    pub lock_source: Option<Origin>,
    /// The whole chain, most general first, for the "inheritance chain" view.
    pub chain: Vec<ChainLevel>,
    /// Index in `chain` of the winning level.
    pub winner_index: Option<usize>,
}

impl Resolution {
    /// True when this scope may still be given its own value.
    pub fn can_override(&self) -> bool {
        !self.locked_above
    }
}

/// Picks the winner out of a chain.
///
/// Two rules, in this order:
///
/// 1. **A lock wins.** The most *general* locked level short-circuits every
///    level below it — that is the whole point of locking, and it is why the
///    search starts from the general end rather than the specific one.
/// 2. Otherwise the most **specific** level wins: user, then group, then the
///    closest organisational unit, then the instance, then the factory default.
fn winner(chain: &[ChainLevel]) -> Option<usize> {
    // Both passes are written without relying on the incoming order, so a chain
    // reordered by a caller cannot silently change the answer. Ties are settled
    // by position — the query already ordered equal levels (several groups of
    // the same account) most-recently-set first.
    let mut best: Option<usize> = None;
    for (i, l) in chain.iter().enumerate() {
        if !l.locked {
            continue;
        }
        if best.is_none_or(|b| l.specificity < chain[b].specificity) {
            best = Some(i);
        }
    }
    if best.is_some() {
        return best;
    }
    for (i, l) in chain.iter().enumerate() {
        if best.is_none_or(|b| l.specificity > chain[b].specificity) {
            best = Some(i);
        }
    }
    best
}

/// Applies the policy to a chain read for `scope`.
pub fn resolve(chain: Vec<ChainLevel>, scope: &SettingScope) -> Resolution {
    let win = winner(&chain);

    // The lock that governs the target: the most general locked level. When it
    // sits at or below the target it constrains the levels underneath, not the
    // target itself.
    let lock = chain.iter().find(|l| l.locked);
    let locked_here = lock.map(|l| l.is_own(scope)).unwrap_or(false);
    let locked_above = match lock {
        Some(l) => !l.is_own(scope) && l.specificity < own_specificity(&chain, scope),
        None => false,
    };

    // What the scope falls back to once its own row is gone — computed on the
    // chain minus that row, never stored. This is the value "revert to
    // inherited" restores, and it keeps tracking the parent afterwards.
    let without_own: Vec<ChainLevel> = chain
        .iter()
        .filter(|l| !l.is_own(scope))
        .cloned()
        .collect();
    let inherited_idx = winner(&without_own);

    Resolution {
        value: win.map(|i| chain[i].value.clone()),
        source: win.map(|i| Origin::from(&chain[i])),
        has_own_value: chain.iter().any(|l| l.is_own(scope)),
        inherited_value: inherited_idx.map(|i| without_own[i].value.clone()),
        inherited_source: inherited_idx.map(|i| Origin::from(&without_own[i])),
        locked_above,
        locked_here,
        lock_source: lock.map(Origin::from),
        winner_index: win,
        chain,
    }
}

/// Specificity of the target scope, whether or not it carries a row. Used to
/// tell "a lock above me" from "a lock below me".
fn own_specificity(chain: &[ChainLevel], scope: &SettingScope) -> i32 {
    if let Some(l) = chain.iter().find(|l| l.is_own(scope)) {
        return l.specificity;
    }
    // No row of its own: fall back to the nominal weight of the kind. Org units
    // are the only ambiguous case (their weight depends on depth), and the
    // target unit is always the deepest of its own chain — hence the maximum.
    match scope.kind {
        ScopeKind::Default => 0,
        ScopeKind::Instance => 100,
        ScopeKind::OrgUnit => 264,
        ScopeKind::Group => 400,
        ScopeKind::User => 500,
    }
}

/// Reads the chain of `key` as seen from `scope`.
pub async fn load_chain<'e, E: PgExecutor<'e>>(
    db: E,
    key: &str,
    scope: &SettingScope,
) -> Result<Vec<ChainLevel>, AppError> {
    let rows = sqlx::query(
        "SELECT scope_type, scope_id, scope_name, specificity, value, locked, updated_at, updated_by \
         FROM core.setting_chain($1, $2, $3)",
    )
    .bind(key)
    .bind(scope.kind.as_str())
    .bind(scope.chain_id())
    .fetch_all(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, key = %key, "setting_chain: lecture de la chaîne impossible");
        AppError::Database(e)
    })?;

    rows.iter()
        .map(ChainLevel::from_row)
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| {
            tracing::error!(error = %e, key = %key, "setting_chain: décodage impossible");
            AppError::Database(e)
        })
}

/// Reads and resolves in one call.
pub async fn resolve_for<'e, E: PgExecutor<'e>>(
    db: E,
    key: &str,
    scope: &SettingScope,
) -> Result<Resolution, AppError> {
    let chain = load_chain(db, key, scope).await?;
    Ok(resolve(chain, scope))
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn level(kind: &str, id: Option<u128>, spec: i32, v: i64, locked: bool) -> ChainLevel {
        ChainLevel {
            scope_type: kind.into(),
            scope_id: id.map(Uuid::from_u128),
            scope_name: None,
            specificity: spec,
            value: json!(v),
            locked,
            updated_at: None,
            updated_by: None,
        }
    }

    const UNIT_A: u128 = 10;
    const UNIT_A1: u128 = 11;
    const USER: u128 = 20;
    const GROUP: u128 = 30;

    /// factory → instance → Zone A → Équipe A1 → group → user
    fn full_chain() -> Vec<ChainLevel> {
        vec![
            level("default", None, 0, 1, false),
            level("instance", None, 100, 2, false),
            level("org_unit", Some(UNIT_A), 263, 3, false),
            level("org_unit", Some(UNIT_A1), 264, 4, false),
            level("group", Some(GROUP), 400, 5, false),
            level("user", Some(USER), 500, 6, false),
        ]
    }

    #[test]
    fn most_specific_wins_across_the_whole_order() {
        let r = resolve(full_chain(), &SettingScope::user(Uuid::from_u128(USER)));
        assert_eq!(r.value, Some(json!(6)), "utilisateur > groupe > unité");

        let mut c = full_chain();
        c.pop(); // no user value
        let r = resolve(c.clone(), &SettingScope::user(Uuid::from_u128(USER)));
        assert_eq!(r.value, Some(json!(5)), "groupe > unité");

        c.pop(); // no group value
        let r = resolve(c.clone(), &SettingScope::user(Uuid::from_u128(USER)));
        assert_eq!(r.value, Some(json!(4)), "unité la plus proche");

        c.pop(); // no A1 value
        let r = resolve(c.clone(), &SettingScope::user(Uuid::from_u128(USER)));
        assert_eq!(r.value, Some(json!(3)), "unité parente");

        c.pop(); // no unit value at all
        let r = resolve(c.clone(), &SettingScope::user(Uuid::from_u128(USER)));
        assert_eq!(r.value, Some(json!(2)), "instance");

        c.pop();
        let r = resolve(c, &SettingScope::user(Uuid::from_u128(USER)));
        assert_eq!(r.value, Some(json!(1)), "valeur d'usine");
    }

    #[test]
    fn closest_unit_beats_its_ancestor() {
        let chain = vec![
            level("default", None, 0, 1, false),
            level("org_unit", Some(UNIT_A), 263, 3, false),
            level("org_unit", Some(UNIT_A1), 264, 4, false),
        ];
        let r = resolve(chain, &SettingScope::org_unit(Uuid::from_u128(UNIT_A1)));
        assert_eq!(r.value, Some(json!(4)));
        assert!(r.has_own_value);
    }

    #[test]
    fn removing_the_own_row_falls_back_to_the_parent_and_keeps_following_it() {
        let chain = vec![
            level("default", None, 0, 1, false),
            level("org_unit", Some(UNIT_A), 263, 3, false),
            level("org_unit", Some(UNIT_A1), 264, 4, false),
        ];
        let scope = SettingScope::org_unit(Uuid::from_u128(UNIT_A1));
        let r = resolve(chain, &scope);
        // What "revert to inherited" would restore — read from the parent, not
        // copied anywhere.
        assert_eq!(r.inherited_value, Some(json!(3)));
        assert_eq!(r.inherited_source.as_ref().map(|o| o.scope_type.as_str()), Some("org_unit"));

        // The parent then changes: with no own row, the child follows. This is
        // the property materialising the value would destroy.
        let after_parent_change = vec![
            level("default", None, 0, 1, false),
            level("org_unit", Some(UNIT_A), 263, 99, false),
        ];
        let r = resolve(after_parent_change, &scope);
        assert!(!r.has_own_value);
        assert_eq!(r.value, Some(json!(99)));
    }

    #[test]
    fn a_lock_short_circuits_every_level_below_it() {
        let mut chain = full_chain();
        chain[2].locked = true; // Zone A locks the key
        let r = resolve(chain, &SettingScope::user(Uuid::from_u128(USER)));
        assert_eq!(r.value, Some(json!(3)), "la valeur verrouillée l'emporte");
        assert!(r.locked_above, "l'utilisateur est sous le verrou");
        assert!(!r.can_override());
        assert_eq!(r.lock_source.as_ref().map(|o| o.scope_type.as_str()), Some("org_unit"));
    }

    #[test]
    fn the_most_general_lock_wins_over_a_lower_one() {
        let mut chain = full_chain();
        chain[1].locked = true; // instance
        chain[3].locked = true; // Équipe A1 locked too
        let r = resolve(chain, &SettingScope::user(Uuid::from_u128(USER)));
        assert_eq!(r.value, Some(json!(2)), "le verrou le plus général gagne");
    }

    #[test]
    fn a_lock_at_my_own_level_does_not_lock_me_out() {
        let mut chain = full_chain();
        chain[3].locked = true; // Équipe A1 locks for its sub-units
        let r = resolve(chain, &SettingScope::org_unit(Uuid::from_u128(UNIT_A1)));
        assert!(r.locked_here);
        assert!(!r.locked_above);
        assert!(r.can_override(), "poser le verrou ne s'auto-interdit pas");
    }

    #[test]
    fn a_lock_below_me_does_not_constrain_me() {
        let mut chain = full_chain();
        chain[5].locked = true; // the user locked their own value (in their chain)
        let r = resolve(chain, &SettingScope::org_unit(Uuid::from_u128(UNIT_A)));
        assert!(!r.locked_above);
        assert!(r.can_override());
    }

    #[test]
    fn an_empty_chain_resolves_to_nothing_rather_than_panicking() {
        let r = resolve(Vec::new(), &SettingScope::INSTANCE);
        assert!(r.value.is_none());
        assert!(r.inherited_value.is_none());
        assert!(!r.has_own_value);
        assert!(r.can_override());
    }
}
