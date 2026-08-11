//! Scoped settings API: resolve, write, revert, lock.
//!
//! Provenance is a first-class part of every response. A console that shows a
//! value without saying where it comes from is worse than one that shows
//! nothing: the administrator edits what they believe is a local setting and
//! silently reconfigures the whole instance, or the opposite.
//!
//! ```text
//!   GET    /admin/settings/resolved       ?scope_type=&scope_id=[&module_id=]
//!   GET    /admin/settings/chain/:key     ?scope_type=&scope_id=
//!   PUT    /admin/settings/scoped/:key    { scope_type, scope_id, value }
//!   DELETE /admin/settings/scoped/:key    ?scope_type=&scope_id=      → inherit again
//!   POST   /admin/settings/lock/:key      { scope_type, scope_id, locked }
//! ```

use axum::{
    extract::{Path, Query, State},
    Json,
};
use serde::Deserialize;
use serde_json::{json, Value};
use uuid::Uuid;

use crate::{
    audit::{redact, redact::target, AdminAudit, AuditEntry},
    authz::{keys, AdminCtx},
    errors::AppError,
    events::AppEvent,
    settings::{
        chain, schema,
        scope::{ScopeKind, SettingScope},
        store, WriteOutcome,
    },
    state::AppState,
};

// ── Query / body shapes ──────────────────────────────────────────────────────

#[derive(Debug, Deserialize)]
pub struct ScopeQuery {
    #[serde(default = "default_scope_type")]
    pub scope_type: String,
    #[serde(default)]
    pub scope_id: Option<Uuid>,
    /// Restricts the listing to one module's settings. Absent means the core's
    /// own settings, which is what the general Settings tab shows.
    #[serde(default)]
    pub module_id: Option<String>,
}

fn default_scope_type() -> String {
    ScopeKind::Instance.as_str().to_string()
}

impl ScopeQuery {
    fn scope(&self) -> Result<SettingScope, AppError> {
        SettingScope::from_parts(&self.scope_type, self.scope_id)
    }
}

#[derive(Debug, Deserialize)]
pub struct SetValueDto {
    pub scope_type: String,
    #[serde(default)]
    pub scope_id: Option<Uuid>,
    pub value: Value,
}

#[derive(Debug, Deserialize)]
pub struct LockDto {
    pub scope_type: String,
    #[serde(default)]
    pub scope_id: Option<Uuid>,
    pub locked: bool,
}

// ── Authorisation ────────────────────────────────────────────────────────────

/// Confines a scoped write to what the caller may act on.
///
/// `core.settings.manage` is declared non-scopable (migration `000044`), so it
/// can only be held instance-wide today and `require` would be enough. The unit
/// check is written anyway and on purpose: the day that declaration is relaxed —
/// which per-unit settings makes plausible — an operator delegated over one
/// branch must not be able to reconfigure another one. A guard added afterwards
/// is a guard nobody adds.
fn authorize(ctx: &AdminCtx, scope: &SettingScope, privilege: &str) -> Result<(), AppError> {
    ctx.require(privilege)?;
    match scope.kind {
        ScopeKind::OrgUnit => ctx.require_for_unit(privilege, scope.id),
        ScopeKind::Instance | ScopeKind::Group => ctx.require_instance(privilege),
        // A per-account value is confined by the account's own unit, exactly
        // like every other operation on that account.
        ScopeKind::User => Ok(()),
        ScopeKind::Default => Err(AppError::Validation(
            "La valeur d'usine n'est pas modifiable".into(),
        )),
    }
}

/// For a user-scoped write, the target account's unit is what bounds the caller.
async fn authorize_user_scope(
    db: &sqlx::PgPool,
    ctx: &AdminCtx,
    scope: &SettingScope,
    privilege: &str,
) -> Result<(), AppError> {
    let Some(user_id) = scope.id.filter(|_| scope.kind == ScopeKind::User) else {
        return Ok(());
    };
    let unit: Option<Option<Uuid>> =
        sqlx::query_scalar("SELECT org_unit_id FROM core.users WHERE id = $1")
            .bind(user_id)
            .fetch_optional(db)
            .await
            .map_err(|e| {
                tracing::error!(error = %e, %user_id, "settings: lecture de l'unité du compte impossible");
                AppError::Database(e)
            })?;
    let unit = unit.ok_or_else(|| AppError::NotFound("Compte inexistant".into()))?;
    ctx.require_for_unit(privilege, unit)
}

// ── Reading ──────────────────────────────────────────────────────────────────

fn origin_json(o: Option<&crate::settings::Origin>) -> Value {
    match o {
        Some(o) => json!({
            "scope_type": o.scope_type,
            "scope_id":   o.scope_id,
            "scope_name": o.scope_name,
        }),
        None => Value::Null,
    }
}

/// GET /api/v1/admin/settings/resolved
///
/// Every declared setting, resolved for one scope, provenance included.
pub async fn resolved_settings(
    State(state): State<AppState>,
    ctx: AdminCtx,
    Query(q): Query<ScopeQuery>,
) -> Result<Json<Value>, AppError> {
    ctx.require(keys::SETTINGS_READ)?;
    let scope = q.scope()?;
    // Before anything is resolved. Without it, any uuid produced a complete,
    // plausible settings page — every key resolved, `can_override: true`
    // throughout — for a unit, group or account that does not exist, and the
    // console offered writes on it. See `store::ensure_subject_exists`.
    store::ensure_subject_exists(&state.db, &scope).await?;

    // The `mail` category is excluded for the same reason as on /admin/settings:
    // one of its keys holds an AES-GCM blob and this route returns raw values.
    // It is owned by /admin/mail/settings, the only writer that encrypts.
    let schemas: Vec<_> = schema::load_all(&state.db, q.module_id.as_deref())
        .await?
        .into_iter()
        .filter(|s| s.category != "mail")
        .collect();

    let keys_list: Vec<String> = schemas.iter().map(|s| s.key.clone()).collect();
    // Only meaningful at instance level, where the warning "these scopes override
    // it and will not be affected" belongs.
    let overrides = if scope.kind == ScopeKind::Instance {
        store::overrides_by_key(&state.db, &keys_list).await?
    } else {
        Default::default()
    };

    let mut out = Vec::with_capacity(schemas.len());
    for s in &schemas {
        let r = chain::resolve_for(&state.db, &s.key, &scope).await?;
        out.push(json!({
            "key":              s.key,
            "category":         s.category,
            "label":            s.label,
            "description":      s.description,
            "is_public":        s.is_public,
            "value_type":       s.value_type,
            "allowed_values":   s.allowed_values,
            "module_id":        s.module_id,
            "default_value":    s.default_value,
            "declared_scope":   s.scope,

            "value":            r.value,
            "source":           origin_json(r.source.as_ref()),
            "has_own_value":    r.has_own_value,
            "inherited_value":  r.inherited_value,
            "inherited_source": origin_json(r.inherited_source.as_ref()),
            "locked_above":     r.locked_above,
            "locked_here":      r.locked_here,
            "lock_source":      origin_json(r.lock_source.as_ref()),
            "can_override":     r.can_override(),
            "overrides":        overrides.get(&s.key).cloned().unwrap_or_default(),
        }));
    }

    Ok(Json(json!({
        "scope":    { "scope_type": scope.kind.as_str(), "scope_id": scope.id },
        "settings": out,
    })))
}

/// GET /api/v1/admin/settings/chain/:key — the whole inheritance chain.
pub async fn setting_chain(
    State(state): State<AppState>,
    ctx: AdminCtx,
    Path(key): Path<String>,
    Query(q): Query<ScopeQuery>,
) -> Result<Json<Value>, AppError> {
    ctx.require(keys::SETTINGS_READ)?;
    let scope = q.scope()?;
    store::ensure_subject_exists(&state.db, &scope).await?;
    let s = schema::load(&state.db, &key).await?;
    let r = chain::resolve_for(&state.db, &key, &scope).await?;

    let levels: Vec<Value> = r
        .chain
        .iter()
        .enumerate()
        .map(|(i, l)| {
            json!({
                "scope_type":  l.scope_type,
                "scope_id":    l.scope_id,
                "scope_name":  l.scope_name,
                "value":       l.value,
                "locked":      l.locked,
                "updated_at":  l.updated_at,
                "is_winner":   r.winner_index == Some(i),
                "is_own":      l.scope_type == scope.kind.as_str() && l.scope_id == scope.id,
            })
        })
        .collect();

    Ok(Json(json!({
        "key":       key,
        "label":     s.label,
        "scope":     { "scope_type": scope.kind.as_str(), "scope_id": scope.id },
        "levels":    levels,
        "value":     r.value,
        "source":    origin_json(r.source.as_ref()),
        "overrides": store::list_overrides(&state.db, &key).await?,
    })))
}

// ── Writing ──────────────────────────────────────────────────────────────────

/// Builds the audit entry for a scoped write. The value goes through the same
/// whitelist as the instance-level route, so a credential is `«rédigé»` here too.
fn audit_entry(action: &str, key: &str, scope: &SettingScope, out: &WriteOutcome) -> AuditEntry {
    let before = redact::setting_scoped(
        key,
        out.before.value.as_ref().unwrap_or(&Value::Null),
        scope.kind.as_str(),
        scope.id,
        out.before.locked_here,
    );
    let after = redact::setting_scoped(
        key,
        out.effective.as_ref().unwrap_or(&Value::Null),
        scope.kind.as_str(),
        scope.id,
        out.locked,
    );
    AuditEntry::new(action)
        .target(target::SETTING, key, key.to_string())
        .before(before)
        .after(after)
        .reversible()
}

fn change_event(key: &str, scope: &SettingScope, out: &WriteOutcome, value_set: bool) -> AppEvent {
    AppEvent::SettingChanged {
        key:        key.to_string(),
        scope_type: scope.kind.as_str().to_string(),
        scope_id:   scope.id,
        module_id:  out.schema.module_id.clone(),
        value_set,
        locked:     out.locked,
    }
}

/// Settings the rest of the core caches or applies hot. Only the instance scope
/// can affect them: nothing below it feeds a process-wide limiter.
async fn apply_side_effects(state: &AppState, key: &str, scope: &SettingScope) {
    if scope.kind != ScopeKind::Instance {
        return;
    }
    if key.starts_with("security.ddos_") {
        crate::auth::ddos::reload_from_db(&state.db).await;
    }
    crate::health::invalidate();
}

/// PUT /api/v1/admin/settings/scoped/:key
pub async fn set_scoped_value(
    State(state): State<AppState>,
    audit: AdminAudit,
    ctx: AdminCtx,
    Path(key): Path<String>,
    Json(dto): Json<SetValueDto>,
) -> Result<Json<Value>, AppError> {
    let scope = SettingScope::from_parts(&dto.scope_type, dto.scope_id)?;
    authorize(&ctx, &scope, keys::SETTINGS_MANAGE)?;
    authorize_user_scope(&state.db, &ctx, &scope, keys::SETTINGS_MANAGE).await?;
    guard_owned_elsewhere(&key)?;
    if key == crate::audit::retention::RETENTION_SETTING_KEY {
        crate::audit::retention::validate_retention(&dto.value)?;
    }
    // The declared `value_type` says "a string"; it cannot say "an absolute
    // path with no `..` in it", and a destination the scheduler silently
    // clamps is a directory the operator will look in and not find.
    if key == crate::backup::policy::KEY_DESTINATION {
        let raw = dto.value.as_str().unwrap_or_default();
        crate::backup::policy::validate_destination(raw)?;
    }
    // Which methods a scope accepts is a list, not a scalar, and the declared
    // `value_type` cannot express "one of local / directory / sso, at least one
    // of them". Refused here rather than stored and misread later.
    if key == crate::auth::methods::KEY_METHODS {
        crate::auth::methods::MethodSet::validate(&dto.value)?;
    }

    let mut tx = audit.begin(&state.db).await?;
    let out = store::set_value(&mut tx, &key, &scope, &dto.value, Some(audit.admin.id)).await?;
    // ── Anti-lockout ─────────────────────────────────────────────────────────
    // Checked AFTER the write and inside the same transaction, so what is
    // verified is the policy as it would really resolve — chain, inheritance,
    // locks and all — rather than a simulation that could drift from the
    // resolver. An error here drops the transaction: nothing was written.
    if key == crate::auth::methods::KEY_METHODS
        || key == crate::auth::methods::KEY_ADMIN_FALLBACK
    {
        crate::auth::methods::ensure_no_administrator_is_stranded(&mut tx).await?;
    }
    tx.commit(audit_entry("core.settings.scope_set", &key, &scope, &out))
        .await?;

    state.events.publish(change_event(&key, &scope, &out, true));
    apply_side_effects(&state, &key, &scope).await;

    Ok(Json(json!({ "message": "Réglage enregistré" })))
}

/// DELETE /api/v1/admin/settings/scoped/:key — revert to the inherited value.
///
/// A deletion, never a write of the inherited value: this is what makes the
/// scope follow its parent again, including for changes made later.
pub async fn clear_scoped_value(
    State(state): State<AppState>,
    audit: AdminAudit,
    ctx: AdminCtx,
    Path(key): Path<String>,
    Query(q): Query<ScopeQuery>,
) -> Result<Json<Value>, AppError> {
    let scope = q.scope()?;
    authorize(&ctx, &scope, keys::SETTINGS_MANAGE)?;
    authorize_user_scope(&state.db, &ctx, &scope, keys::SETTINGS_MANAGE).await?;
    guard_owned_elsewhere(&key)?;

    let mut tx = audit.begin(&state.db).await?;
    let out = store::clear_value(&mut tx, &key, &scope, Some(audit.admin.id)).await?;
    // Reverting to the inherited value can strand somebody just as easily as
    // writing one: the parent may say `["directory"]` where this unit said
    // `["local"]`. Same guard, same transaction.
    if key == crate::auth::methods::KEY_METHODS
        || key == crate::auth::methods::KEY_ADMIN_FALLBACK
    {
        crate::auth::methods::ensure_no_administrator_is_stranded(&mut tx).await?;
    }
    tx.commit(audit_entry("core.settings.scope_clear", &key, &scope, &out))
        .await?;

    state.events.publish(change_event(&key, &scope, &out, false));
    apply_side_effects(&state, &key, &scope).await;

    Ok(Json(json!({
        "message": "Valeur héritée rétablie",
        "value":   out.effective,
    })))
}

/// POST /api/v1/admin/settings/lock/:key
pub async fn set_scoped_lock(
    State(state): State<AppState>,
    audit: AdminAudit,
    ctx: AdminCtx,
    Path(key): Path<String>,
    Json(dto): Json<LockDto>,
) -> Result<Json<Value>, AppError> {
    let scope = SettingScope::from_parts(&dto.scope_type, dto.scope_id)?;
    authorize(&ctx, &scope, keys::SETTINGS_MANAGE)?;
    authorize_user_scope(&state.db, &ctx, &scope, keys::SETTINGS_MANAGE).await?;
    guard_owned_elsewhere(&key)?;

    let mut tx = audit.begin(&state.db).await?;
    let out = store::set_lock(&mut tx, &key, &scope, dto.locked, Some(audit.admin.id)).await?;
    let action = if dto.locked {
        "core.settings.lock"
    } else {
        "core.settings.unlock"
    };
    tx.commit(audit_entry(action, &key, &scope, &out)).await?;

    state.events.publish(change_event(&key, &scope, &out, true));

    Ok(Json(json!({
        "message": if dto.locked { "Réglage verrouillé" } else { "Verrou retiré" },
    })))
}

/// The relay settings have exactly one writer, and it encrypts. Accepting one
/// here would store a credential in clear under a key the rest of the code reads
/// as ciphertext — unusable and readable at the same time.
fn guard_owned_elsewhere(key: &str) -> Result<(), AppError> {
    if crate::handlers::admin::mail::owns_setting(key) {
        return Err(AppError::Validation(format!(
            "'{key}' se règle depuis Administration → Courriel (PATCH /admin/mail/settings)"
        )));
    }
    // The restore drill is a *statement*, not a preference: it is written by the
    // endpoint that records who declared it and when. Letting it be typed here
    // would let an operator back-date the one field whose only value is that
    // somebody vouched for it.
    if key == crate::backup::policy::KEY_LAST_RESTORE_TEST {
        return Err(AppError::Validation(format!(
            "'{key}' s'enregistre depuis Administration → Tâches de fond \
             (POST /admin/backup/restore-test)"
        )));
    }
    Ok(())
}
