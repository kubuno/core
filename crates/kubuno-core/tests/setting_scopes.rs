//! Per-scope setting values, inheritance down the organisational tree, and the
//! properties that make the model correct rather than merely present.
//!
//! Exercises migration `000060` (the table, the chain function, the two mirror
//! triggers) together with `crate::settings` — resolution policy, "revert =
//! delete", lock enforcement — against a real database.

mod common;

use kubuno_core::settings::{
    chain, scope::SettingScope, store, ScopeKind,
};
use serde_json::{json, Value};
use sqlx::PgPool;
use uuid::Uuid;

// ── Fixtures ─────────────────────────────────────────────────────────────────
//
// The suite runs in parallel against ONE database, so every test owns its own
// setting key and its own subtree. Sharing a real key (`security.max_sessions`)
// made the tests fight over the instance row and fail in whichever order they
// happened to interleave — a flake that says nothing about the code.

struct Tree {
    root:  Uuid,
    zone:  Uuid,
    team:  Uuid,
    user:  Uuid,
    group: Uuid,
    /// Declared setting owned by this fixture alone.
    key:   String,
    /// Its factory default.
    factory: Value,
}

async fn unit(db: &PgPool, name: &str, parent: Option<Uuid>) -> Uuid {
    sqlx::query_scalar("INSERT INTO core.org_units (name, parent_id) VALUES ($1, $2) RETURNING id")
        .bind(name)
        .bind(parent)
        .fetch_one(db)
        .await
        .expect("création d'unité")
}

async fn fixture(db: &PgPool, tag: &str) -> Tree {
    let tag = format!("zz{tag}-{}", &Uuid::new_v4().to_string()[..8]);
    let tag = tag.as_str();

    let key = format!("zztest.{tag}");
    let factory = json!(10);
    sqlx::query(
        "INSERT INTO core.settings (key, value, default_value, category, value_type, module_id) \
         VALUES ($1, $2, $2, 'zztest', 'int', 'zztest')",
    )
    .bind(&key)
    .bind(&factory)
    .execute(db)
    .await
    .expect("déclaration du réglage de test");

    let root = unit(db, &format!("{tag} Racine"), None).await;
    let zone = unit(db, &format!("{tag} Zone"), Some(root)).await;
    let team = unit(db, &format!("{tag} Equipe"), Some(zone)).await;

    let user: Uuid = sqlx::query_scalar(
        "INSERT INTO core.users (email, username, password_hash, display_name, org_unit_id) \
         VALUES ($1, $2, 'x', 'Compte de test', $3) RETURNING id",
    )
    .bind(format!("{tag}@test.local"))
    .bind(format!("{tag}-user"))
    .bind(team)
    .fetch_one(db)
    .await
    .expect("création du compte");

    let group: Uuid =
        sqlx::query_scalar("INSERT INTO core.user_groups (name) VALUES ($1) RETURNING id")
            .bind(format!("{tag} Groupe"))
            .fetch_one(db)
            .await
            .expect("création du groupe");
    sqlx::query("INSERT INTO core.user_group_members (group_id, user_id) VALUES ($1, $2)")
        .bind(group)
        .bind(user)
        .execute(db)
        .await
        .expect("adhésion au groupe");

    Tree { root, zone, team, user, group, key, factory }
}

async fn cleanup(db: &PgPool, tree: &Tree) {
    // The units cascade to their subtree, and the purge triggers take the
    // setting values with them.
    let _ = sqlx::query("DELETE FROM core.users WHERE id = $1").bind(tree.user).execute(db).await;
    let _ = sqlx::query("DELETE FROM core.user_groups WHERE id = $1").bind(tree.group).execute(db).await;
    let _ = sqlx::query("DELETE FROM core.org_units WHERE id = $1").bind(tree.root).execute(db).await;
    // Cascades to every remaining value of the key.
    let _ = sqlx::query("DELETE FROM core.settings WHERE key = $1").bind(&tree.key).execute(db).await;
}

/// Writes straight to the table — the fixture path, deliberately bypassing the
/// store so the store's own guards can be tested against it.
async fn put(db: &PgPool, key: &str, scope: &SettingScope, value: Value, locked: bool) {
    sqlx::query(
        "INSERT INTO core.setting_values (key, scope_type, scope_id, value, locked) \
         VALUES ($1, $2, $3, $4, $5) \
         ON CONFLICT (key, scope_type, scope_id) DO UPDATE SET value = EXCLUDED.value, locked = EXCLUDED.locked",
    )
    .bind(key)
    .bind(scope.kind.as_str())
    .bind(scope.storage_id())
    .bind(&value)
    .bind(locked)
    .execute(db)
    .await
    .expect("écriture de la valeur");
}

async fn effective(db: &PgPool, key: &str, scope: &SettingScope) -> Option<Value> {
    chain::resolve_for(db, key, scope).await.expect("résolution").value
}

// ── Tests ────────────────────────────────────────────────────────────────────

#[tokio::test]
async fn resolution_walks_the_whole_order_and_the_closest_unit_wins() {
    let Some(db) = common::test_pool().await else { return };
    let t = fixture(&db, "ordre").await;
    let user_scope = SettingScope::user(t.user);

    // Nothing anywhere: the factory default applies.
    assert_eq!(effective(&db, &t.key, &user_scope).await, Some(t.factory.clone()));

    put(&db, &t.key, &SettingScope::INSTANCE, json!(100), false).await;
    assert_eq!(effective(&db, &t.key, &user_scope).await, Some(json!(100)), "instance");

    put(&db, &t.key, &SettingScope::org_unit(t.root), json!(200), false).await;
    assert_eq!(effective(&db, &t.key, &user_scope).await, Some(json!(200)), "racine > instance");

    put(&db, &t.key, &SettingScope::org_unit(t.zone), json!(300), false).await;
    assert_eq!(effective(&db, &t.key, &user_scope).await, Some(json!(300)), "zone > racine");

    put(&db, &t.key, &SettingScope::org_unit(t.team), json!(400), false).await;
    assert_eq!(
        effective(&db, &t.key, &user_scope).await,
        Some(json!(400)),
        "l'unité LA PLUS PROCHE l'emporte"
    );

    put(&db, &t.key, &SettingScope::group(t.group), json!(500), false).await;
    assert_eq!(effective(&db, &t.key, &user_scope).await, Some(json!(500)), "groupe > unité");

    put(&db, &t.key, &SettingScope::user(t.user), json!(600), false).await;
    assert_eq!(effective(&db, &t.key, &user_scope).await, Some(json!(600)), "utilisateur > groupe");

    cleanup(&db, &t).await;
}

#[tokio::test]
async fn an_inherited_scope_holds_no_row_and_reverting_is_a_deletion() {
    let Some(db) = common::test_pool().await else { return };
    let t = fixture(&db, "heritage").await;
    let team_scope = SettingScope::org_unit(t.team);

    put(&db, &t.key, &SettingScope::org_unit(t.zone), json!(10), false).await;

    // The child inherits — and stores nothing. This is the invariant the whole
    // feature rests on: materialising here would freeze the value.
    let r = chain::resolve_for(&db, &t.key, &team_scope).await.expect("résolution");
    assert_eq!(r.value, Some(json!(10)));
    assert!(!r.has_own_value, "une portée qui hérite n'a PAS de ligne");
    let stored: i64 = sqlx::query_scalar(
        "SELECT count(*) FROM core.setting_values WHERE key = $1 AND scope_type = 'org_unit' AND scope_id = $2",
    )
    .bind(&t.key)
    .bind(t.team)
    .fetch_one(&db)
    .await
    .expect("comptage");
    assert_eq!(stored, 0, "rien n'a été matérialisé");

    // Override, then revert through the store.
    let mut conn = db.acquire().await.expect("connexion");
    store::set_value(&mut conn, &t.key, &team_scope, &json!(99), None)
        .await
        .expect("surcharge");
    assert_eq!(effective(&db, &t.key, &team_scope).await, Some(json!(99)));

    store::clear_value(&mut conn, &t.key, &team_scope, None)
        .await
        .expect("rétablissement");
    let stored: i64 = sqlx::query_scalar(
        "SELECT count(*) FROM core.setting_values WHERE key = $1 AND scope_type = 'org_unit' AND scope_id = $2",
    )
    .bind(&t.key)
    .bind(t.team)
    .fetch_one(&db)
    .await
    .expect("comptage");
    assert_eq!(stored, 0, "« rétablir » est une SUPPRESSION, pas une écriture");

    // And the point of the deletion: the child now FOLLOWS the parent again.
    put(&db, &t.key, &SettingScope::org_unit(t.zone), json!(77), false).await;
    assert_eq!(
        effective(&db, &t.key, &team_scope).await,
        Some(json!(77)),
        "le réglage suit à nouveau les changements du parent"
    );

    drop(conn);
    cleanup(&db, &t).await;
}

#[tokio::test]
async fn a_lock_wins_over_every_level_below_and_the_api_refuses_to_write_there() {
    let Some(db) = common::test_pool().await else { return };
    let t = fixture(&db, "verrou").await;
    let mut conn = db.acquire().await.expect("connexion");

    put(&db, &t.key, &SettingScope::org_unit(t.zone), json!(42), true).await;
    put(&db, &t.key, &SettingScope::user(t.user), json!(1), false).await;

    // The user's own value exists and is ignored: the lock short-circuits it.
    let r = chain::resolve_for(&db, &t.key, &SettingScope::user(t.user))
        .await
        .expect("résolution");
    assert_eq!(r.value, Some(json!(42)), "la valeur verrouillée l'emporte");
    assert!(r.locked_above);
    assert!(!r.can_override());
    assert_eq!(
        r.lock_source.as_ref().map(|o| o.scope_type.as_str()),
        Some(ScopeKind::OrgUnit.as_str())
    );

    // Writing underneath is refused, at the sub-unit and at the account alike.
    for scope in [SettingScope::org_unit(t.team), SettingScope::user(t.user)] {
        let err = store::set_value(&mut conn, &t.key, &scope, &json!(7), None)
            .await
            .expect_err("l'écriture sous un verrou doit être refusée");
        assert!(
            matches!(err, kubuno_core::errors::AppError::SettingLocked(_)),
            "erreur inattendue : {err:?}"
        );
    }
    // …and so is reverting: a lock is not escaped by deleting one's own row.
    let err = store::clear_value(&mut conn, &t.key, &SettingScope::user(t.user), None)
        .await
        .expect_err("le rétablissement sous un verrou doit être refusé");
    assert!(matches!(err, kubuno_core::errors::AppError::SettingLocked(_)));

    // The level that HOLDS the lock is not locked out of its own value.
    store::set_value(&mut conn, &t.key, &SettingScope::org_unit(t.zone), &json!(43), None)
        .await
        .expect("le niveau qui verrouille garde la main");
    // …and setting it again did not silently drop the lock.
    let still: bool = sqlx::query_scalar(
        "SELECT locked FROM core.setting_values WHERE key = $1 AND scope_type = 'org_unit' AND scope_id = $2",
    )
    .bind(&t.key)
    .bind(t.zone)
    .fetch_one(&db)
    .await
    .expect("relecture du verrou");
    assert!(still, "réécrire la valeur ne déverrouille pas");

    drop(conn);
    cleanup(&db, &t).await;
}

#[tokio::test]
async fn the_most_general_lock_wins_over_a_lower_one() {
    let Some(db) = common::test_pool().await else { return };
    let t = fixture(&db, "verroudouble").await;

    put(&db, &t.key, &SettingScope::INSTANCE, json!(5), true).await;
    put(&db, &t.key, &SettingScope::org_unit(t.zone), json!(50), true).await;

    assert_eq!(
        effective(&db, &t.key, &SettingScope::user(t.user)).await,
        Some(json!(5)),
        "le verrou le plus général court-circuite le verrou local"
    );

    cleanup(&db, &t).await;
}

#[tokio::test]
async fn the_compatibility_mirror_stays_in_step_in_both_directions() {
    let Some(db) = common::test_pool().await else { return };
    let t = fixture(&db, "miroir").await;

    async fn read_mirror(db: &PgPool, key: &str) -> Value {
        sqlx::query_scalar::<_, Value>("SELECT value FROM core.settings WHERE key = $1")
            .bind(key)
            .fetch_one(db)
            .await
            .expect("miroir")
    }

    // Legacy write path (about twenty call sites still do exactly this).
    sqlx::query("UPDATE core.settings SET value = $1 WHERE key = $2")
        .bind(json!(33))
        .bind(&t.key)
        .execute(&db)
        .await
        .expect("écriture héritée");
    let stored: Option<Value> = sqlx::query_scalar(
        "SELECT value FROM core.setting_values WHERE key = $1 AND scope_type = 'instance'",
    )
    .bind(&t.key)
    .fetch_optional(&db)
    .await
    .expect("lecture de la portée instance");
    assert_eq!(stored, Some(json!(33)), "l'écriture héritée atterrit dans la table par portée");

    // Scoped write path.
    put(&db, &t.key, &SettingScope::INSTANCE, json!(44), false).await;
    assert_eq!(read_mirror(&db, &t.key).await, json!(44), "le miroir suit l'écriture par portée");

    // Reverting the instance level puts the factory default back in the mirror,
    // which is what the legacy readers must see.
    let factory = t.factory.clone();
    sqlx::query("DELETE FROM core.setting_values WHERE key = $1 AND scope_type = 'instance'")
        .bind(&t.key)
        .execute(&db)
        .await
        .expect("retour à l'usine");
    assert_eq!(read_mirror(&db, &t.key).await, factory);

    // A per-unit override never leaks into the mirror: it is not an instance
    // value, and the legacy readers must keep seeing the instance one.
    put(&db, &t.key, &SettingScope::org_unit(t.zone), json!(999), false).await;
    assert_eq!(read_mirror(&db, &t.key).await, factory, "rien d'hérité n'entre dans le miroir");

    cleanup(&db, &t).await;
}

#[tokio::test]
async fn the_migration_preserved_every_effective_value() {
    let Some(db) = common::test_pool().await else { return };

    // After 000060 the effective instance value of every declared key must equal
    // what `core.settings.value` holds — that column is the mirror, and any
    // divergence would be a silent behaviour change for the twenty call sites
    // still reading it.
    let mismatches: i64 = sqlx::query_scalar(
        "SELECT count(*) FROM core.settings s \
          WHERE s.value IS DISTINCT FROM COALESCE( \
              (SELECT v.value FROM core.setting_values v \
                WHERE v.key = s.key AND v.scope_type = 'instance'), \
              s.default_value)",
    )
    .fetch_one(&db)
    .await
    .expect("comparaison");
    assert_eq!(mismatches, 0, "des valeurs effectives ont changé pendant la migration");

    // And every key now has a factory default to fall back to.
    let orphans: i64 = sqlx::query_scalar("SELECT count(*) FROM core.settings WHERE default_value IS NULL")
        .fetch_one(&db)
        .await
        .expect("comptage");
    assert_eq!(orphans, 0, "toute clé doit avoir une valeur d'usine");
}

#[tokio::test]
async fn deleting_a_subject_takes_its_overrides_with_it() {
    let Some(db) = common::test_pool().await else { return };
    let t = fixture(&db, "purge").await;

    put(&db, &t.key, &SettingScope::org_unit(t.team), json!(1), false).await;
    put(&db, &t.key, &SettingScope::user(t.user), json!(2), false).await;
    put(&db, &t.key, &SettingScope::group(t.group), json!(3), false).await;

    // Counted on this fixture's subjects only: the suite runs in parallel on a
    // shared database, and a global count would race with the other tests.
    let subjects = vec![t.team, t.user, t.group];
    async fn count(db: &PgPool, key: &str, subjects: &[Uuid]) -> i64 {
        sqlx::query_scalar::<_, i64>(
            "SELECT count(*) FROM core.setting_values WHERE key = $1 AND scope_id = ANY($2)",
        )
        .bind(key)
        .bind(subjects)
        .fetch_one(db)
        .await
        .expect("comptage")
    }
    assert_eq!(count(&db, &t.key, &subjects).await, 3);

    cleanup(&db, &t).await;
    assert_eq!(
        count(&db, &t.key, &subjects).await,
        0,
        "un sujet supprimé ne laisse pas de réglage orphelin qu'un uuid recyclé ressusciterait"
    );
}

#[tokio::test]
async fn a_value_outside_the_declared_domain_is_refused() {
    let Some(db) = common::test_pool().await else { return };
    let t = fixture(&db, "domaine").await;
    let mut conn = db.acquire().await.expect("connexion");

    // The fixture key is declared `int`: a string must not pass.
    let err = store::set_value(&mut conn, &t.key, &SettingScope::INSTANCE, &json!("beaucoup"), None)
        .await
        .expect_err("un type incompatible doit être refusé");
    assert!(matches!(err, kubuno_core::errors::AppError::Validation(_)), "{err:?}");

    let err = store::set_value(&mut conn, "n.existe.pas", &SettingScope::INSTANCE, &json!(1), None)
        .await
        .expect_err("une clé non déclarée doit être refusée");
    assert!(matches!(err, kubuno_core::errors::AppError::NotFound(_)), "{err:?}");

    drop(conn);
    cleanup(&db, &t).await;
}
