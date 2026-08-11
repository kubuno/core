//! Scoped personal API tokens, against a real PostgreSQL (see `common`).
//!
//! Covers the properties that are only true if they are enforced: the
//! intersection, its re-evaluation after a privilege is withdrawn from the owner,
//! the refusal of an empty or sensitive scope list, the immediate cut of
//! administrative writes for a legacy token, and the refusal of a token whose
//! owner has been deactivated.

mod common;

use std::collections::HashSet;

use axum::http::Method;
use kubuno_core::audit::ActorOrigin;
use kubuno_core::auth::token_scope::{
    self, grant::resolve_grant, policy, TokenGrant,
};
use kubuno_core::authz::{context, AdminContext, PrivilegeScope};
use kubuno_core::errors::AppError;
use sha2::{Digest, Sha256};
use sqlx::PgPool;
use uuid::Uuid;

// ── Fixtures ─────────────────────────────────────────────────────────────────

fn tag() -> String {
    Uuid::new_v4().simple().to_string()[..12].to_string()
}

async fn make_user(db: &PgPool, tag: &str, who: &str, role: &str) -> Uuid {
    sqlx::query_scalar(
        "INSERT INTO core.users (email, username, password_hash, role) \
         VALUES ($1, $2, 'x', $3) RETURNING id",
    )
    .bind(format!("{who}.{tag}@test.local"))
    .bind(format!("{who}_{tag}"))
    .bind(role)
    .fetch_one(db)
    .await
    .expect("création d'utilisateur")
}

async fn make_role(db: &PgPool, tag: &str, slug: &str, privileges: &[&str]) -> Uuid {
    let id: Uuid =
        sqlx::query_scalar("INSERT INTO core.roles (slug, name) VALUES ($1, $2) RETURNING id")
            .bind(format!("{slug}-{tag}"))
            .bind(slug)
            .fetch_one(db)
            .await
            .expect("création de rôle");
    for key in privileges {
        sqlx::query("INSERT INTO core.role_privileges (role_id, privilege_key) VALUES ($1, $2)")
            .bind(id)
            .bind(key)
            .execute(db)
            .await
            .expect("privilège du rôle");
    }
    id
}

async fn assign_instance(db: &PgPool, role: Uuid, user: Uuid) -> Uuid {
    sqlx::query_scalar(
        "INSERT INTO core.role_assignments (role_id, subject_user_id, scope) \
         VALUES ($1, $2, 'instance') RETURNING id",
    )
    .bind(role)
    .bind(user)
    .fetch_one(db)
    .await
    .expect("affectation")
}

/// Inserts a token exactly as the handler would, and returns `(id, raw)`.
async fn make_token(db: &PgPool, user: Uuid, scopes: &[&str]) -> (Uuid, String) {
    let raw = format!("kubuno_test_{}", Uuid::new_v4().simple());
    let hash = hex::encode(Sha256::digest(raw.as_bytes()));
    let scopes: Vec<String> = scopes.iter().map(|s| s.to_string()).collect();
    let id: Uuid = sqlx::query_scalar(
        "INSERT INTO core.api_tokens (user_id, name, token_hash, scopes) \
         VALUES ($1, 'test', $2, $3) RETURNING id",
    )
    .bind(user)
    .bind(&hash)
    .bind(&scopes)
    .fetch_one(db)
    .await
    .expect("création de jeton");
    (id, raw)
}

/// A token as the migration left it: no scopes, marked legacy.
async fn make_legacy_token(db: &PgPool, user: Uuid, since_days_ago: i64) -> (Uuid, String) {
    let raw = format!("kubuno_test_{}", Uuid::new_v4().simple());
    let hash = hex::encode(Sha256::digest(raw.as_bytes()));
    let id: Uuid = sqlx::query_scalar(
        "INSERT INTO core.api_tokens (user_id, name, token_hash, is_legacy, legacy_since) \
         VALUES ($1, 'legacy', $2, TRUE, NOW() - ($3 || ' days')::INTERVAL) RETURNING id",
    )
    .bind(user)
    .bind(&hash)
    .bind(since_days_ago.to_string())
    .fetch_one(db)
    .await
    .expect("création de jeton hérité");
    (id, raw)
}

async fn cleanup(db: &PgPool, users: &[Uuid]) {
    // `core.api_tokens` and `core.role_assignments` cascade from the user.
    for u in users {
        let _ = sqlx::query("DELETE FROM core.users WHERE id = $1")
            .bind(u)
            .execute(db)
            .await;
    }
}

async fn ctx_for_token(db: &PgPool, grant: &TokenGrant) -> AdminContext {
    let subject = context::resolve(db, grant.user_id, ActorOrigin::ApiToken, Some(grant.token_id))
        .await
        .expect("résolution du contexte");
    token_scope::narrow(subject, Some(grant))
}

// ── The database refuses what the policy refuses ─────────────────────────────

#[tokio::test]
async fn an_unscoped_non_legacy_token_cannot_even_be_inserted() {
    let Some(db) = common::test_pool().await else { return };
    let t = tag();
    let user = make_user(&db, &t, "owner", "user").await;

    // The CHECK is the floor: no code path, present or future, can mint a
    // credential with no scopes unless it also marks it legacy.
    let res = sqlx::query(
        "INSERT INTO core.api_tokens (user_id, name, token_hash) VALUES ($1, 'x', $2)",
    )
    .bind(user)
    .bind(hex::encode(Sha256::digest(b"anything")))
    .execute(&db)
    .await;
    assert!(res.is_err(), "une liste de portées vide doit être refusée par la base");

    cleanup(&db, &[user]).await;
}

// ── Intersection ─────────────────────────────────────────────────────────────

#[tokio::test]
async fn the_effective_privilege_is_the_intersection_with_the_owner() {
    let Some(db) = common::test_pool().await else { return };
    let t = tag();
    let user = make_user(&db, &t, "delegate", "user").await;
    let role = make_role(&db, &t, "reader", &["core.users.read", "core.audit.read"]).await;
    assign_instance(&db, role, user).await;
    kubuno_core::authz::cache::invalidate_all();

    // The token lists one privilege the owner holds and one they do not.
    let (_, raw) = make_token(&db, user, &["core.users.read", "core.settings.manage"]).await;
    let grant = resolve_grant(&db, &raw).await.expect("jeton valide");
    let ctx = ctx_for_token(&db, &grant).await;

    assert!(ctx.has("core.users.read"), "portée listée et détenue");
    assert!(
        !ctx.has("core.audit.read"),
        "détenue par le propriétaire mais non listée par le jeton"
    );
    assert!(
        !ctx.has("core.settings.manage"),
        "listée par le jeton mais non détenue : un jeton ne dépasse jamais son propriétaire"
    );

    cleanup(&db, &[user]).await;
}

#[tokio::test]
async fn withdrawing_a_privilege_from_the_owner_withdraws_it_from_the_token() {
    let Some(db) = common::test_pool().await else { return };
    let t = tag();
    let user = make_user(&db, &t, "revoked", "user").await;
    let role = make_role(&db, &t, "reader", &["core.users.read"]).await;
    let assignment = assign_instance(&db, role, user).await;
    kubuno_core::authz::cache::invalidate_all();

    let (_, raw) = make_token(&db, user, &["core.users.read"]).await;
    let grant = resolve_grant(&db, &raw).await.expect("jeton valide");
    assert!(
        ctx_for_token(&db, &grant).await.has("core.users.read"),
        "avant retrait, le jeton exerce la portée"
    );

    // The owner loses the assignment. Nothing is done to the token.
    sqlx::query("DELETE FROM core.role_assignments WHERE id = $1")
        .bind(assignment)
        .execute(&db)
        .await
        .expect("retrait de l'affectation");
    kubuno_core::authz::cache::invalidate_all();

    assert!(
        !ctx_for_token(&db, &grant).await.has("core.users.read"),
        "le privilège est réévalué à chaque usage : intersection, pas copie figée"
    );

    cleanup(&db, &[user]).await;
}

#[tokio::test]
async fn a_superuser_token_holds_its_list_and_not_the_rest() {
    let Some(db) = common::test_pool().await else { return };
    let t = tag();
    let user = make_user(&db, &t, "root", "admin").await;
    let role: Uuid = sqlx::query_scalar(
        "INSERT INTO core.roles (slug, name, is_superuser) VALUES ($1, 'su', TRUE) RETURNING id",
    )
    .bind(format!("su-{t}"))
    .fetch_one(&db)
    .await
    .expect("rôle super-utilisateur");
    assign_instance(&db, role, user).await;
    kubuno_core::authz::cache::invalidate_all();

    let (_, raw) = make_token(&db, user, &["core.users.read"]).await;
    let grant = resolve_grant(&db, &raw).await.expect("jeton valide");
    let ctx = ctx_for_token(&db, &grant).await;

    assert!(!ctx.is_superuser, "le drapeau ne survit pas à l'intersection");
    assert!(ctx.has("core.users.read"));
    assert!(!ctx.has("core.settings.manage"));
    // And the operations reserved to a person stay closed.
    assert!(ctx.require_superuser("installer un module").is_err());

    cleanup(&db, &[user]).await;
    let _ = sqlx::query("DELETE FROM core.roles WHERE id = $1").bind(role).execute(&db).await;
}

// ── Scope selection at creation ──────────────────────────────────────────────

#[tokio::test]
async fn an_empty_scope_list_is_refused_with_an_explanation() {
    let Some(db) = common::test_pool().await else { return };
    let t = tag();
    let user = make_user(&db, &t, "creator", "user").await;
    let ctx = context::resolve(&db, user, ActorOrigin::Session, None)
        .await
        .expect("contexte");

    let err = policy::validate_requested(&db, &[], &ctx)
        .await
        .expect_err("une liste vide doit être refusée");
    assert!(matches!(err, AppError::Validation(_)));
    // Whitespace-only entries collapse to the same refusal — no accidental
    // "one scope" that is in fact none.
    assert!(policy::validate_requested(&db, &["   ".into()], &ctx).await.is_err());

    cleanup(&db, &[user]).await;
}

#[tokio::test]
async fn the_sensitive_scopes_are_refused_even_to_a_superuser() {
    let Some(db) = common::test_pool().await else { return };
    let t = tag();
    let user = make_user(&db, &t, "su", "admin").await;
    let role: Uuid = sqlx::query_scalar(
        "INSERT INTO core.roles (slug, name, is_superuser) VALUES ($1, 'su', TRUE) RETURNING id",
    )
    .bind(format!("su2-{t}"))
    .fetch_one(&db)
    .await
    .expect("rôle super-utilisateur");
    assign_instance(&db, role, user).await;
    kubuno_core::authz::cache::invalidate_all();

    let ctx = context::resolve(&db, user, ActorOrigin::Session, None)
        .await
        .expect("contexte");
    assert!(ctx.is_superuser, "le créateur détient tout");

    for key in [
        "core.roles.manage",       // granting power
        "core.marketplace.manage", // installing modules
        "core.themes.manage",      // approving themes
    ] {
        let err = policy::validate_requested(&db, &[key.into()], &ctx)
            .await
            .expect_err(&format!("{key} doit être refusée"));
        assert!(
            matches!(err, AppError::Validation(_)),
            "{key} : refus attendu au titre des portées sensibles"
        );
    }

    // Second-factor reset: the keys are not in the catalogue, and the namespace
    // is refused by name so promoting one later cannot open the door.
    assert!(token_scope::forbids_scope("security.two_factor.disable"));
    assert!(policy::validate_requested(&db, &["security.two_factor.disable".into()], &ctx)
        .await
        .is_err());

    cleanup(&db, &[user]).await;
    let _ = sqlx::query("DELETE FROM core.roles WHERE id = $1").bind(role).execute(&db).await;
}

#[tokio::test]
async fn a_creator_cannot_grant_what_they_do_not_hold() {
    let Some(db) = common::test_pool().await else { return };
    let t = tag();
    let user = make_user(&db, &t, "modest", "user").await;
    let role = make_role(&db, &t, "reader", &["core.users.read"]).await;
    assign_instance(&db, role, user).await;
    kubuno_core::authz::cache::invalidate_all();

    let ctx = context::resolve(&db, user, ActorOrigin::Session, None)
        .await
        .expect("contexte");

    assert!(policy::validate_requested(&db, &["core.users.read".into()], &ctx).await.is_ok());
    assert!(
        matches!(
            policy::validate_requested(&db, &["core.settings.manage".into()], &ctx).await,
            Err(AppError::Forbidden)
        ),
        "on ne délègue pas ce que l'on ne détient pas"
    );

    cleanup(&db, &[user]).await;
}

#[tokio::test]
async fn a_core_write_scope_cannot_be_perpetual_and_is_clamped() {
    let Some(db) = common::test_pool().await else { return };

    let write = vec!["core.users.update".to_string()];
    assert!(
        policy::resolve_expiry(&db, &write, None).await.is_err(),
        "une portée core.* en écriture exige une expiration"
    );
    let expiry = policy::resolve_expiry(&db, &write, Some(30))
        .await
        .expect("30 jours accepté")
        .expect("date d'expiration");
    assert!(expiry > chrono::Utc::now());

    // Beyond the ceiling, the request is clamped rather than refused.
    let cap = policy::max_ttl_days(&db).await;
    let clamped = policy::resolve_expiry(&db, &write, Some(100_000))
        .await
        .expect("plafonnement")
        .expect("date");
    assert!(
        clamped <= chrono::Utc::now() + chrono::Duration::days(cap + 1),
        "l'expiration doit être ramenée au plafond de l'instance"
    );

    // A read-only scope may be perpetual.
    let read = vec!["core.users.read".to_string()];
    assert!(policy::resolve_expiry(&db, &read, None).await.expect("ok").is_none());
}

// ── Legacy tokens ────────────────────────────────────────────────────────────

#[tokio::test]
async fn a_legacy_token_is_cut_off_from_administrative_writes_immediately() {
    let Some(db) = common::test_pool().await else { return };
    let t = tag();
    let user = make_user(&db, &t, "legacy", "admin").await;
    let (_, raw) = make_legacy_token(&db, user, 0).await;

    let grant = resolve_grant(&db, &raw).await.expect("dans la fenêtre de grâce");
    assert!(grant.is_legacy);
    assert!(grant.grace_until.is_some());

    // Reads under /admin/* stay open until the deadline…
    assert!(token_scope::deny_legacy_admin_write(Some(&grant), &Method::GET).is_ok());
    // …every write is refused, with no grace at all.
    for m in [Method::POST, Method::PATCH, Method::PUT, Method::DELETE] {
        assert!(
            matches!(
                token_scope::deny_legacy_admin_write(Some(&grant), &m),
                Err(AppError::ApiTokenLegacyAdminWrite)
            ),
            "{m} doit être refusée sans délai de grâce"
        );
    }

    cleanup(&db, &[user]).await;
}

#[tokio::test]
async fn a_legacy_token_keeps_the_owner_privileges_except_the_sensitive_ones() {
    let Some(db) = common::test_pool().await else { return };
    let t = tag();
    let user = make_user(&db, &t, "legacysu", "admin").await;
    let role: Uuid = sqlx::query_scalar(
        "INSERT INTO core.roles (slug, name, is_superuser) VALUES ($1, 'su', TRUE) RETURNING id",
    )
    .bind(format!("su3-{t}"))
    .fetch_one(&db)
    .await
    .expect("rôle super-utilisateur");
    assign_instance(&db, role, user).await;
    kubuno_core::authz::cache::invalidate_all();

    let (_, raw) = make_legacy_token(&db, user, 1).await;
    let grant = resolve_grant(&db, &raw).await.expect("dans la fenêtre");
    let ctx = ctx_for_token(&db, &grant).await;

    // Grace: the ordinary reads its integration relies on still work…
    assert!(ctx.has("core.users.read"));
    assert!(ctx.has("core.stats.read"));
    // …and the operations reserved to a person never do.
    assert!(!ctx.has("core.roles.manage"));
    assert!(!ctx.has("core.marketplace.manage"));
    assert!(!ctx.has("core.themes.manage"));
    assert!(ctx.require_superuser("approuver un thème").is_err());

    cleanup(&db, &[user]).await;
    let _ = sqlx::query("DELETE FROM core.roles WHERE id = $1").bind(role).execute(&db).await;
}

#[tokio::test]
async fn a_legacy_token_past_its_window_is_refused_with_a_distinguishable_code() {
    let Some(db) = common::test_pool().await else { return };
    let t = tag();
    let user = make_user(&db, &t, "expired", "user").await;

    let grace = policy::legacy_grace_days(&db).await;
    let (_, raw) = make_legacy_token(&db, user, grace + 1).await;

    let err = resolve_grant(&db, &raw)
        .await
        .expect_err("au-delà de la fenêtre, le jeton est refusé");
    assert!(
        matches!(err, AppError::ApiTokenLegacyExpired),
        "le refus doit inviter à réémettre, pas ressembler à une panne"
    );

    cleanup(&db, &[user]).await;
}

// ── The owner's account ──────────────────────────────────────────────────────

#[tokio::test]
async fn a_token_whose_owner_is_deactivated_is_refused() {
    let Some(db) = common::test_pool().await else { return };
    let t = tag();
    let user = make_user(&db, &t, "suspended", "user").await;
    let (_, raw) = make_token(&db, user, &["core.users.read"]).await;

    assert!(resolve_grant(&db, &raw).await.is_ok(), "compte actif : jeton valide");

    sqlx::query("UPDATE core.users SET is_active = FALSE WHERE id = $1")
        .bind(user)
        .execute(&db)
        .await
        .expect("désactivation");

    assert!(
        matches!(resolve_grant(&db, &raw).await, Err(AppError::Unauthorized)),
        "suspendre un compte doit couper ses jetons, pas seulement ses sessions"
    );

    cleanup(&db, &[user]).await;
}

#[tokio::test]
async fn a_revoked_token_stays_refused() {
    let Some(db) = common::test_pool().await else { return };
    let t = tag();
    let user = make_user(&db, &t, "revoke", "user").await;
    let (id, raw) = make_token(&db, user, &["core.users.read"]).await;

    sqlx::query("UPDATE core.api_tokens SET revoked_at = NOW() WHERE id = $1")
        .bind(id)
        .execute(&db)
        .await
        .expect("révocation");

    assert!(matches!(resolve_grant(&db, &raw).await, Err(AppError::Unauthorized)));

    cleanup(&db, &[user]).await;
}

// ── The module-facing role ───────────────────────────────────────────────────

#[tokio::test]
async fn a_token_reaches_a_module_as_an_ordinary_user_unless_scoped_otherwise() {
    let Some(db) = common::test_pool().await else { return };
    let t = tag();
    let user = make_user(&db, &t, "modrole", "admin").await;

    let (_, plain) = make_token(&db, user, &["core.users.read"]).await;
    let grant = resolve_grant(&db, &plain).await.expect("jeton valide");
    assert_eq!(
        token_scope::module_role_for(&grant, "admin"),
        "user",
        "le rôle du propriétaire ne doit plus voyager tel quel vers les modules"
    );

    let (_, elevated) = make_token(&db, user, &[token_scope::MODULE_ADMIN]).await;
    let grant = resolve_grant(&db, &elevated).await.expect("jeton valide");
    assert_eq!(token_scope::module_role_for(&grant, "admin"), "admin");
    // …and the scope cannot manufacture a role the owner lacks.
    assert_eq!(token_scope::module_role_for(&grant, "user"), "user");

    cleanup(&db, &[user]).await;
}

#[tokio::test]
async fn the_mcp_endpoint_requires_its_own_scope() {
    let Some(db) = common::test_pool().await else { return };
    let t = tag();
    let user = make_user(&db, &t, "mcp", "user").await;

    let (_, plain) = make_token(&db, user, &["core.users.read"]).await;
    let grant = resolve_grant(&db, &plain).await.expect("jeton valide");
    assert!(
        !grant.may_carry(token_scope::MCP_EXECUTE),
        "le chemin MCP doit être explicitement demandé"
    );

    let (_, allowed) = make_token(&db, user, &[token_scope::MCP_EXECUTE]).await;
    let grant = resolve_grant(&db, &allowed).await.expect("jeton valide");
    assert!(grant.may_carry(token_scope::MCP_EXECUTE));

    cleanup(&db, &[user]).await;
}

// ── The offered list matches the accepted list ───────────────────────────────

#[tokio::test]
async fn the_offered_scopes_are_exactly_those_the_creator_may_pick() {
    let Some(db) = common::test_pool().await else { return };
    let t = tag();
    let user = make_user(&db, &t, "offer", "user").await;
    let role = make_role(
        &db,
        &t,
        "mixed",
        &["core.users.read", "core.roles.manage", "core.settings.read"],
    )
    .await;
    assign_instance(&db, role, user).await;
    kubuno_core::authz::cache::invalidate_all();

    let ctx = context::resolve(&db, user, ActorOrigin::Session, None)
        .await
        .expect("contexte");
    let offered: HashSet<String> = policy::grantable_for(&db, &ctx)
        .await
        .expect("liste offrable")
        .into_iter()
        .map(|s| s.key)
        .collect();

    assert!(offered.contains("core.users.read"));
    assert!(offered.contains("core.settings.read"));
    assert!(
        !offered.contains("core.roles.manage"),
        "une portée sensible ne doit pas être proposée, même détenue"
    );
    assert!(
        !offered.contains("core.users.delete"),
        "une portée non détenue ne doit pas être proposée"
    );

    // Everything offered is accepted: the interface cannot present a choice the
    // server then refuses.
    let all: Vec<String> = offered.iter().cloned().collect();
    assert!(policy::validate_requested(&db, &all, &ctx).await.is_ok());

    cleanup(&db, &[user]).await;
}

// ── The narrowing is a pure function, and stays one ───────────────────────────

#[tokio::test]
async fn a_session_context_is_never_narrowed() {
    let Some(db) = common::test_pool().await else { return };
    let t = tag();
    let user = make_user(&db, &t, "human", "user").await;
    let role = make_role(&db, &t, "reader", &["core.users.read"]).await;
    assign_instance(&db, role, user).await;
    kubuno_core::authz::cache::invalidate_all();

    let subject = context::resolve(&db, user, ActorOrigin::Session, None)
        .await
        .expect("contexte");
    let narrowed = token_scope::narrow(subject.clone(), None);
    assert_eq!(
        narrowed.privileges.keys().collect::<HashSet<_>>(),
        subject.privileges.keys().collect::<HashSet<_>>()
    );
    assert!(narrowed.denied.is_empty());
    assert_eq!(narrowed.privileges.get("core.users.read"), Some(&PrivilegeScope {
        instance: true,
        units: HashSet::new(),
    }));

    cleanup(&db, &[user]).await;
}
