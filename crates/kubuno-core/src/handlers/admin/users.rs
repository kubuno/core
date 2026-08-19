use crate::{
    audit::{redact::target, snap, AdminAudit, AuditEntry},
    auth::middleware::AdminUser,
    authz::{
        guards::{
            apply_legacy_role_change, ensure_can_act_on_user, ensure_superadmin_remains,
            user_org_unit,
        },
        keys, AdminCtx,
    },
    errors::AppError,
    models::user::User,
    state::AppState,
};
use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    Json,
};
use serde::Deserialize;
use serde_json::json;
use uuid::Uuid;

/// Label shown in the trail for a user target: readable without a join, and
/// still meaningful once the account is gone.
fn user_label(user: &User) -> String {
    match user.display_name.as_deref() {
        Some(name) if !name.is_empty() => format!("{name} <{}>", user.email),
        _ => format!("{} <{}>", user.username, user.email),
    }
}

#[derive(Deserialize)]
pub struct ListUsersQuery {
    pub limit:  Option<i64>,
    pub offset: Option<i64>,
    pub search: Option<String>,
    pub role:   Option<String>,
    /// Confine the listing to one organisational unit.
    pub org_unit_id: Option<Uuid>,
    /// With `org_unit_id`: include the accounts of the whole subtree, not just
    /// the ones sitting directly in that unit. Looking at "Support" and being
    /// told it holds nobody, while its three sub-units hold everyone, is the
    /// answer an operator reads as a bug.
    pub include_descendants: Option<bool>,
    /// Also return the number of accounts per unit (`org_unit_counts`).
    ///
    /// Opt-in rather than always: the unit manager is the only caller that needs
    /// the aggregate, and the accounts list is fetched on every keystroke of its
    /// search box.
    pub counts: Option<bool>,
}

/// The perimeter shared by the listing and its total.
///
/// One string for both, because they must describe the *same* set: a total
/// computed on a wider predicate reports pages that the listing cannot show, and
/// the operator reads it as accounts being hidden from them.
///
/// Parameters, in order: `$1` search, `$2` role, `$3` scope units,
/// `$4` unit filter, `$5` include descendants.
const USER_FILTER: &str = r#"
        ($1::text IS NULL OR email ILIKE '%' || $1 || '%'
               OR username ILIKE '%' || $1 || '%'
               OR display_name ILIKE '%' || $1 || '%')
    AND ($2::text IS NULL OR role = $2)
    AND ($3::uuid[] IS NULL OR (org_unit_id IS NOT NULL AND org_unit_id = ANY($3)))
    AND ($4::uuid IS NULL OR org_unit_id = $4
               OR ($5::bool AND org_unit_id IN (SELECT d.id FROM core.org_unit_descendants($4) d)))
"#;

/// `GET /admin/users` — **confined to the caller's organisational subtree**.
///
/// Before delegation existed this listing filtered nothing at all, which was
/// harmless when the only administrator was an instance administrator. It stops
/// being harmless the moment a role can be scoped: without the subtree filter a
/// delegated administrator enumerates the whole directory — every address, every
/// name — which is most of the value of the directory to an attacker.
///
/// `scope_units = NULL` means "no restriction" (instance scope or superuser); an
/// **empty** array means "nothing", which is the right answer for a caller who
/// does not hold `core.users.read` at all.
pub async fn list_users(
    State(state): State<AppState>,
    _admin: AdminUser,
    ctx: AdminCtx,
    Query(q): Query<ListUsersQuery>,
) -> Result<Json<serde_json::Value>, AppError> {
    ctx.require(keys::USERS_READ)?;

    let limit  = q.limit.unwrap_or(50).clamp(0, 200);
    let offset = q.offset.unwrap_or(0).max(0);
    let scope_units = ctx.subtree_filter(keys::USERS_READ);
    let unit = q.org_unit_id;
    let descendants = q.include_descendants.unwrap_or(false);

    let users = sqlx::query_as::<_, User>(&format!(
        "SELECT * FROM core.users WHERE {USER_FILTER}
         ORDER BY created_at DESC
         LIMIT $6 OFFSET $7"
    ))
    .bind(q.search.as_deref())
    .bind(q.role.as_deref())
    .bind(scope_units.as_deref())
    .bind(unit)
    .bind(descendants)
    .bind(limit)
    .bind(offset)
    .fetch_all(&state.db)
    .await
    .map_err(|e| { tracing::error!(error = %e, "list_users"); AppError::Database(e) })?;

    // The total must obey the same perimeter — and the same filters — or the
    // pagination tells the caller how many accounts they are not allowed to see,
    // and offers pages that come back empty.
    let total: i64 = sqlx::query_scalar(&format!(
        "SELECT COUNT(*)::bigint FROM core.users WHERE {USER_FILTER}"
    ))
    .bind(q.search.as_deref())
    .bind(q.role.as_deref())
    .bind(scope_units.as_deref())
    .bind(unit)
    .bind(descendants)
    .fetch_one(&state.db)
    .await
    .map_err(|e| { tracing::error!(error = %e, "list_users: total"); AppError::Database(e) })?;

    let mut body = json!({ "users": users, "total": total, "limit": limit, "offset": offset });

    // Accounts per unit — the "own" count only; a subtree total is a sum over a
    // tree the caller already holds, and computing it here would be one
    // recursive query per unit for an answer the console can add up itself.
    // Deliberately NOT narrowed by the search/role/unit filters: this describes
    // the directory, not the current page.
    if q.counts.unwrap_or(false) {
        let counts: Vec<(Uuid, i64)> = sqlx::query_as(
            "SELECT org_unit_id, COUNT(*)::bigint FROM core.users
             WHERE org_unit_id IS NOT NULL
               AND ($1::uuid[] IS NULL OR org_unit_id = ANY($1))
             GROUP BY org_unit_id",
        )
        .bind(scope_units.as_deref())
        .fetch_all(&state.db)
        .await
        .map_err(|e| { tracing::error!(error = %e, "list_users: org_unit_counts"); AppError::Database(e) })?;

        body["org_unit_counts"] = json!(counts
            .into_iter()
            .map(|(id, count)| json!({ "org_unit_id": id, "count": count }))
            .collect::<Vec<_>>());
    }

    Ok(Json(body))
}

#[derive(Deserialize)]
pub struct CreateUserAdminDto {
    pub email:        String,
    pub username:     String,
    pub password:     String,
    pub role:         Option<String>,
    pub display_name: Option<String>,
    pub quota_bytes:  Option<i64>,
    /// Unit the account is created in. A delegated administrator must name one
    /// inside their own subtree — an account created outside the tree would be
    /// invisible to every scoped listing, including their own.
    pub org_unit_id:  Option<Uuid>,
}

pub async fn create_user(
    State(state): State<AppState>,
    ctx: AdminCtx,
    audit: AdminAudit,
    Json(dto): Json<CreateUserAdminDto>,
) -> Result<impl axum::response::IntoResponse, AppError> {
    ctx.require_for_unit(keys::USERS_CREATE, dto.org_unit_id)?;

    // Creating an administrator is granting super-administration; it goes
    // through the assignment path below, and only a superuser may take it.
    if dto.role.as_deref() == Some("admin") {
        ctx.require_superuser("création d'un administrateur")?;
    }

    let exists: bool = sqlx::query_scalar(
        "SELECT EXISTS(SELECT 1 FROM core.users WHERE email = $1 OR username = $2)",
    )
    .bind(&dto.email)
    .bind(&dto.username)
    .fetch_one(&state.db)
    .await
    .map_err(|e| { tracing::error!(error = %e, "create_user: unicité"); AppError::Database(e) })?;

    if exists {
        return Err(AppError::Conflict("Email ou username déjà utilisé".into()));
    }

    // The password policy of the unit the account is being created in
    // (migration `000115`). An administrator is not exempt from the policy they
    // set: an account handed out below the instance's own minimum would be a
    // permanent exception nobody would ever notice again.
    let policy = crate::settings::password_policy::PasswordPolicy::for_new_account(
        &state.db,
        dto.org_unit_id,
    )
    .await?;
    policy.check(&dto.password)?;

    let hash = crate::crypto::password::hash_password(&dto.password)
        .map_err(AppError::Internal)?;

    let role = dto.role.as_deref().unwrap_or("user");
    // No explicit quota means "apply the policy", and the policy is resolved for
    // the unit the account lands in — not the instance value. An administrator
    // who gave Marketing 50 GiB expects an account created there to get 50 GiB.
    let quota = match dto.quota_bytes {
        Some(explicit) => explicit,
        None => crate::models::user::default_quota_for(&state.db, dto.org_unit_id).await,
    };

    // Audited transaction: the account and its trail entry commit together, so
    // no user can appear without a record of who created it.
    let mut tx = audit.begin(&state.db).await?;

    let user = sqlx::query_as::<_, User>(
        r#"INSERT INTO core.users (email, username, password_hash, display_name, role, quota_bytes,
                                   org_unit_id, password_changed_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
           RETURNING *"#,
    )
    .bind(&dto.email)
    .bind(&dto.username)
    .bind(&hash)
    .bind(dto.display_name.as_deref())
    .bind(role)
    .bind(quota)
    .bind(dto.org_unit_id)
    .fetch_one(&mut *tx)
    .await
    .map_err(|e| { tracing::error!(error = %e, "create_user: insertion"); AppError::Database(e) })?;

    // The password the account was handed enters the history straight away:
    // otherwise "no reuse" would let its owner change it once and set it back to
    // the one an administrator typed — the single password most likely to have
    // been written down or sent over a chat.
    crate::settings::password_policy::remember(&mut tx, user.id, &hash, policy.history_depth)
        .await?;

    // `role = 'admin'` on the legacy surface means "instance super-administrator";
    // materialise the assignment so the account is visible to the whole
    // delegation model — and to the "never remove the last one" guard.
    if role == "admin" {
        apply_legacy_role_change(&mut tx, user.id, "admin", ctx.user_id).await?;
    }

    tx.commit(
        AuditEntry::new("core.users.create")
            .target(target::USER, user.id, user_label(&user))
            // `after` only: the password hash is not part of the whitelist, so
            // the entry says a user was created without saying with what.
            .after(snap(target::USER, &user))
            .reversible(),
    )
    .await?;

    // `UserCreated` used to be published by public registration only, so an
    // account created by an administrator — the majority of them on a managed
    // instance — was invisible to every module that provisions on account
    // creation, and to the rule engine. Published after the commit, and logged:
    // `publish` alone reaches live subscribers but leaves nothing in
    // `core.event_log`, which is what a retrospective replay reads.
    state
        .events
        .publish_and_log(
            crate::events::AppEvent::UserCreated {
                user_id: user.id,
                email:   user.email.clone(),
            },
            &state.db,
        )
        .await;

    Ok((StatusCode::CREATED, Json(json!({ "user": user }))))
}

pub async fn get_user(
    State(state): State<AppState>,
    _admin: AdminUser,
    ctx: AdminCtx,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let user = sqlx::query_as::<_, User>("SELECT * FROM core.users WHERE id = $1")
        .bind(id)
        .fetch_optional(&state.db)
        .await
        .map_err(|e| { tracing::error!(error = %e, "get_user"); AppError::Database(e) })?
        .ok_or_else(|| AppError::NotFound(format!("User {id}")))?;

    // Read the row first, then check the perimeter against the unit it is
    // actually in: the alternative is a scoped WHERE clause that reports
    // "introuvable" and quietly turns every out-of-scope id into a probe for
    // whether the account exists.
    ctx.require_for_unit(keys::USERS_READ, user.org_unit_id)?;

    Ok(Json(json!({ "user": user })))
}

#[derive(Debug, Default, Deserialize)]
pub struct UpdateUserAdminDto {
    pub role:        Option<String>,
    pub quota_bytes: Option<i64>,
    pub is_active:   Option<bool>,
    pub display_name: Option<String>,
    pub org_unit_id: Option<Uuid>,

    // ── Profile fields of migration `000114` ────────────────────────────────
    //
    // Present here because the refusal a person reads when a switch is off says
    // the field "est géré par votre administrateur". If no administrative path
    // could write it, that sentence would be false and the switch would mean
    // "nobody may change this", which is not what the card offers.
    //
    // Same three-state shape as `PATCH /me`: absent leaves alone, `null` erases,
    // a value sets. Same bounds too — the DTO is normalised through
    // [`crate::models::user::UpdateUserDto::tidy_profile`] rather than
    // re-validated by hand, so the two paths cannot drift apart.
    #[serde(default, deserialize_with = "crate::models::user::double_option")]
    pub name_pronunciation: Option<Option<String>>,
    #[serde(default, deserialize_with = "crate::models::user::double_option")]
    pub pronouns:           Option<Option<String>>,
    #[serde(default, deserialize_with = "crate::models::user::double_option")]
    pub work_location:      Option<Option<String>>,
    #[serde(default, deserialize_with = "crate::models::user::double_option")]
    pub introduction:       Option<Option<String>>,
    #[serde(default, deserialize_with = "crate::models::user::double_option")]
    pub gender:             Option<Option<String>>,
    #[serde(default, deserialize_with = "crate::models::user::double_option")]
    pub birthday:           Option<Option<chrono::NaiveDate>>,
}

impl UpdateUserAdminDto {
    /// Borrows the profile half into the shape `tidy_profile` knows, normalises
    /// it, and takes the cleaned values back. One set of rules, one set of
    /// messages, whoever is writing.
    fn tidy_profile(&mut self, today: chrono::NaiveDate) -> Result<(), AppError> {
        let mut shared = crate::models::user::UpdateUserDto {
            name_pronunciation: self.name_pronunciation.take(),
            pronouns:           self.pronouns.take(),
            work_location:      self.work_location.take(),
            introduction:       self.introduction.take(),
            gender:             self.gender.take(),
            birthday:           self.birthday.take(),
            ..Default::default()
        };
        let outcome = shared.tidy_profile(today);

        self.name_pronunciation = shared.name_pronunciation;
        self.pronouns           = shared.pronouns;
        self.work_location      = shared.work_location;
        self.introduction       = shared.introduction;
        self.gender             = shared.gender;
        self.birthday           = shared.birthday;

        outcome.map_err(AppError::Validation)
    }

    /// Names of the profile fields this request carries. Used for the audit
    /// entry's `detail`, because the trail's whitelist (`audit::redact`)
    /// deliberately does not list these columns: without the sentence, a
    /// profile-only edit would appear in the trail as an entry with an empty
    /// diff and nobody could tell what had moved. **Names only, never values.**
    fn profile_fields_present(&self) -> Vec<&'static str> {
        let mut names = Vec::new();
        if self.name_pronunciation.is_some() { names.push("name_pronunciation"); }
        if self.pronouns.is_some() { names.push("pronouns"); }
        if self.work_location.is_some() { names.push("work_location"); }
        if self.introduction.is_some() { names.push("introduction"); }
        if self.gender.is_some() { names.push("gender"); }
        if self.birthday.is_some() { names.push("birthday"); }
        names
    }
}

/// Which of `core.users.{update,role,quota,activation}` best describes an edit.
///
/// Role, quota and activation changes get their own action names: they are the
/// three that carry privilege or capacity, and an operator filtering the trail
/// wants them without having to read every diff.
fn user_update_action(dto: &UpdateUserAdminDto) -> &'static str {
    if dto.role.is_some() {
        "core.users.role"
    } else if dto.is_active.is_some() {
        "core.users.activation"
    } else if dto.quota_bytes.is_some() {
        "core.users.quota"
    } else {
        "core.users.update"
    }
}

pub async fn update_user(
    State(state): State<AppState>,
    ctx: AdminCtx,
    audit: AdminAudit,
    Path(id): Path<Uuid>,
    Json(mut dto): Json<UpdateUserAdminDto>,
) -> Result<Json<serde_json::Value>, AppError> {
    // Promoting or demoting through this legacy field is granting or revoking
    // instance super-administration: superuser only, and it must go through the
    // assignment table so the model — and guard 4 — see it.
    if dto.role.is_some() {
        ctx.require_superuser("changement de rôle système")?;
    }

    // Before the transaction opens: a request carrying an impossible birthday
    // must cost neither a lock on the row nor an audit transaction.
    dto.tidy_profile(chrono::Utc::now().date_naive())?;
    let profile_touched = dto.profile_fields_present();

    let mut tx = audit.begin(&state.db).await?;

    // Read the previous state inside the transaction: the `before` snapshot is
    // then the exact row the UPDATE is about to overwrite, not one a concurrent
    // request may have changed in between.
    let previous = sqlx::query_as::<_, User>("SELECT * FROM core.users WHERE id = $1 FOR UPDATE")
        .bind(id)
        .fetch_optional(&mut *tx)
        .await
        .map_err(|e| { tracing::error!(error = %e, "update_user: lecture"); AppError::Database(e) })?
        .ok_or_else(|| AppError::NotFound(format!("User {id}")))?;

    // Perimeter: the unit the account is in today, and — when the edit moves it —
    // the unit it is going to. Checking only the first would let a delegated
    // administrator push accounts out of their own subtree.
    ctx.require_for_unit(keys::USERS_UPDATE, previous.org_unit_id)?;
    if let Some(new_unit) = dto.org_unit_id {
        if Some(new_unit) != previous.org_unit_id {
            ctx.require_for_unit(keys::USERS_UPDATE, Some(new_unit))?;
        }
    }
    if dto.is_active.is_some() {
        ctx.require_for_unit(keys::USER_SUSPENSION, previous.org_unit_id)?;
    }
    // Guard 3: never act on an account holding a role the caller does not hold.
    ensure_can_act_on_user(&mut tx, &ctx, id).await?;

    let user = sqlx::query_as::<_, User>(
        r#"UPDATE core.users
           SET role        = COALESCE($1, role),
               quota_bytes = COALESCE($2, quota_bytes),
               is_active   = COALESCE($3, is_active),
               display_name = COALESCE($4, display_name),
               org_unit_id = COALESCE($5, org_unit_id),
               -- Reactivating an account cancels its pending destruction. The
               -- alternative — leaving the stamp — would let the purge job
               -- delete a live account weeks later because somebody had once
               -- deleted it and changed their mind.
               deleted_at  = CASE WHEN $3 IS TRUE THEN NULL ELSE deleted_at END,
               -- Three-state, exactly as on `PATCH /me`: the boolean says the
               -- request carried the field, so an explicit null erases it.
               name_pronunciation = CASE WHEN $7::boolean  THEN $8::text  ELSE name_pronunciation END,
               pronouns           = CASE WHEN $9::boolean  THEN $10::text ELSE pronouns END,
               work_location      = CASE WHEN $11::boolean THEN $12::text ELSE work_location END,
               introduction       = CASE WHEN $13::boolean THEN $14::text ELSE introduction END,
               gender             = CASE WHEN $15::boolean THEN $16::text ELSE gender END,
               birthday           = CASE WHEN $17::boolean THEN $18::date ELSE birthday END
           WHERE id = $6
           RETURNING *"#,
    )
    .bind(dto.role.as_deref())
    .bind(dto.quota_bytes)
    .bind(dto.is_active)
    .bind(dto.display_name.as_deref())
    .bind(dto.org_unit_id)
    .bind(id)
    .bind(dto.name_pronunciation.is_some())
    .bind(dto.name_pronunciation.clone().flatten())
    .bind(dto.pronouns.is_some())
    .bind(dto.pronouns.clone().flatten())
    .bind(dto.work_location.is_some())
    .bind(dto.work_location.clone().flatten())
    .bind(dto.introduction.is_some())
    .bind(dto.introduction.clone().flatten())
    .bind(dto.gender.is_some())
    .bind(dto.gender.clone().flatten())
    .bind(dto.birthday.is_some())
    .bind(dto.birthday.flatten())
    .fetch_optional(&mut *tx)
    .await
    .map_err(|e| { tracing::error!(error = %e, "update_user: écriture"); AppError::Database(e) })?
    .ok_or_else(|| AppError::NotFound(format!("User {id}")))?;

    // Keep the two representations of "is an administrator" in step, then check
    // the post-state: a demotion, or a deactivation, must never empty the
    // instance of super-administrators.
    if let Some(new_role) = dto.role.as_deref() {
        apply_legacy_role_change(&mut tx, id, new_role, ctx.user_id).await?;
    }
    if dto.role.is_some() || dto.is_active == Some(false) {
        ensure_superadmin_remains(&mut tx).await?;
    }

    let mut entry = AuditEntry::new(user_update_action(&dto))
        .target(target::USER, user.id, user_label(&user))
        .before(snap(target::USER, &previous))
        .after(snap(target::USER, &user))
        .reversible();

    // The personal columns are absent from the snapshot whitelist on purpose —
    // a gender must not be readable in a trail every administrator can export.
    // The sentence restores what the diff cannot say, without saying what was
    // written.
    if !profile_touched.is_empty() {
        entry = entry.detail(format!("champs de profil modifiés : {}", profile_touched.join(", ")));
    }

    tx.commit(entry).await?;

    Ok(Json(json!({ "user": user })))
}

#[derive(Deserialize)]
pub struct BulkOrgUnitDto {
    pub user_ids:    Vec<Uuid>,
    pub org_unit_id: Uuid,
}

/// Largest move accepted in one call. High enough for "select the page, move
/// it", low enough that the transaction below cannot hold a lock on the whole
/// directory while an operator's browser is thinking about it.
const BULK_MAX: usize = 500;

/// `POST /admin/users/bulk/org-unit` — move several accounts into one unit.
///
/// One transaction and **one** audit entry, rather than N calls to
/// `PATCH /admin/users/:id`. The difference is not performance: a bulk move that
/// fails halfway leaves the directory in a state nobody asked for, and a trail
/// that records it as forty unrelated edits does not let anyone answer "who
/// reorganised Support, and when". The entry says "N accounts moved to X" and
/// carries the list in its diff.
pub async fn bulk_set_org_unit(
    State(state): State<AppState>,
    ctx: AdminCtx,
    audit: AdminAudit,
    Json(dto): Json<BulkOrgUnitDto>,
) -> Result<Json<serde_json::Value>, AppError> {
    // Deduplicate before anything else: the same id twice would make the
    // "everything was found" check below fail on a request that is merely
    // redundant.
    let mut ids = dto.user_ids.clone();
    ids.sort_unstable();
    ids.dedup();

    if ids.is_empty() {
        return Err(AppError::Validation("Aucun compte sélectionné".into()));
    }
    if ids.len() > BULK_MAX {
        return Err(AppError::Validation(format!(
            "Trop de comptes en une fois (maximum {BULK_MAX})"
        )));
    }

    // The destination first: an operator who may not administer the target unit
    // must not be able to push accounts into it, even accounts they do own.
    ctx.require_for_unit(keys::USERS_UPDATE, Some(dto.org_unit_id))?;

    let mut tx = audit.begin(&state.db).await?;

    let unit_name: String = sqlx::query_scalar("SELECT name FROM core.org_units WHERE id = $1")
        .bind(dto.org_unit_id)
        .fetch_optional(&mut *tx)
        .await
        .map_err(|e| { tracing::error!(error = %e, "bulk_set_org_unit: unité"); AppError::Database(e) })?
        .ok_or_else(|| AppError::NotFound(format!("Unité {}", dto.org_unit_id)))?;

    // Ordered by id, and locked: two concurrent bulk moves take the rows in the
    // same order, so they queue instead of deadlocking.
    let previous = sqlx::query_as::<_, User>(
        "SELECT * FROM core.users WHERE id = ANY($1) ORDER BY id FOR UPDATE",
    )
    .bind(&ids)
    .fetch_all(&mut *tx)
    .await
    .map_err(|e| { tracing::error!(error = %e, "bulk_set_org_unit: lecture"); AppError::Database(e) })?;

    if previous.len() != ids.len() {
        return Err(AppError::NotFound(format!(
            "{} compte(s) introuvable(s)",
            ids.len() - previous.len()
        )));
    }

    // Every source unit, and every target account, checked before a single row
    // is written: a partial move is exactly what the transaction is here to
    // prevent, so the refusal has to come first.
    for user in &previous {
        ctx.require_for_unit(keys::USERS_UPDATE, user.org_unit_id)?;
        ensure_can_act_on_user(&mut tx, &ctx, user.id).await?;
    }

    let moving: Vec<Uuid> = previous
        .iter()
        .filter(|u| u.org_unit_id != Some(dto.org_unit_id))
        .map(|u| u.id)
        .collect();

    // Nothing to do — but say so rather than writing an entry claiming a move.
    if moving.is_empty() {
        return Ok(Json(json!({ "moved": 0, "org_unit_id": dto.org_unit_id })));
    }

    let moved = sqlx::query("UPDATE core.users SET org_unit_id = $1 WHERE id = ANY($2)")
        .bind(dto.org_unit_id)
        .bind(&moving)
        .execute(&mut *tx)
        .await
        .map_err(|e| { tracing::error!(error = %e, "bulk_set_org_unit: écriture"); AppError::Database(e) })?
        .rows_affected();

    // The diff names the accounts and where each came from: the entry has to be
    // enough on its own to put the directory back the way it was.
    let before = previous
        .iter()
        .filter(|u| moving.contains(&u.id))
        .map(|u| json!({
            "id": u.id,
            "label": user_label(u),
            "org_unit_id": u.org_unit_id,
        }))
        .collect::<Vec<_>>();

    tx.commit(
        AuditEntry::new("core.users.org_unit")
            .target(target::ORG_UNIT, dto.org_unit_id, unit_name.clone())
            .before(json!({ "users": before }))
            .after(json!({ "org_unit_id": dto.org_unit_id, "moved": moved }))
            .detail(format!("{moved} compte(s) déplacé(s) vers « {unit_name} »"))
            .reversible(),
    )
    .await?;

    // An account's unit decides which delegated administrator reaches it, and the
    // resolved context is cached for a few seconds per subject. Drop it, or a
    // move can be followed by a window where the OLD perimeter still applies.
    crate::authz::cache::invalidate_all();

    Ok(Json(json!({ "moved": moved, "org_unit_id": dto.org_unit_id })))
}

pub async fn delete_user(
    State(state): State<AppState>,
    ctx: AdminCtx,
    audit: AdminAudit,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let mut tx = audit.begin(&state.db).await?;

    let previous = sqlx::query_as::<_, User>(
        "SELECT * FROM core.users WHERE id = $1 AND is_active = TRUE FOR UPDATE",
    )
    .bind(id)
    .fetch_optional(&mut *tx)
    .await
    .map_err(|e| { tracing::error!(error = %e, "delete_user: lecture"); AppError::Database(e) })?
    .ok_or_else(|| AppError::NotFound(format!("User {id}")))?;

    ctx.require_for_unit(keys::USERS_DELETE, previous.org_unit_id)?;
    ensure_can_act_on_user(&mut tx, &ctx, id).await?;

    // `deleted_at` is what arms the automatic purge, and it is stamped *here* —
    // never by a suspension. The two produce the same `is_active = FALSE`, and a
    // purge keyed on that flag would destroy accounts somebody merely put on
    // hold. See `migrations/000109`.
    let user = sqlx::query_as::<_, User>(
        "UPDATE core.users SET is_active = FALSE, deleted_at = NOW() WHERE id = $1 RETURNING *",
    )
    .bind(id)
    .fetch_one(&mut *tx)
    .await
    .map_err(|e| { tracing::error!(error = %e, "delete_user: désactivation"); AppError::Database(e) })?;

    // `core.superadmin_ids()` counts ACTIVE accounts only, so deactivating the
    // last super-administrator is caught here like any other removal.
    // Deliberately no `sync_role_cache` here: the assignment survives the
    // deactivation, so reactivating the account must restore its powers rather
    // than silently return an ex-administrator as an ordinary user.
    ensure_superadmin_remains(&mut tx).await?;

    tx.commit(
        AuditEntry::new("core.users.delete")
            .target(target::USER, id, user_label(&previous))
            .before(snap(target::USER, &previous))
            .after(snap(target::USER, &user))
            .reversible(),
    )
    .await?;

    state.events.publish(crate::events::AppEvent::UserDeleted { user_id: id });

    Ok(Json(json!({ "message": "Utilisateur désactivé" })))
}

/// Body of a purge: the account's own email address, typed back.
#[derive(Debug, Deserialize)]
pub struct PurgeUserDto {
    pub confirm_email: String,
}

/// `DELETE /admin/users/:id/purge` — erases the row, for good.
///
/// ## Why this is a second route and not a flag on the first
///
/// Deleting and erasing are different acts with different consequences, and a
/// boolean on one endpoint makes them one click apart. Here the sequence is
/// deliberate: an account must already be deactivated before it can be erased,
/// so destroying a live account takes two decisions taken at two moments.
///
/// ## Three refusals, in this order
///
/// 1. **A live account is never erased.** The caller has to deactivate first,
///    which is the reversible half of the operation and the one that gives the
///    organisation time to object.
/// 2. **The email is typed back.** Not a checkbox: a checkbox is ticked by the
///    hand that was already moving. Retyping `marie.dupont@…` is the moment
///    somebody reads the address and notices it is not the one they meant.
/// 3. **The ordinary guards still apply** — scope, self-protection, and the last
///    super-administrator. Erasing is not a way around a rule that blocks
///    deactivating.
///
/// The audit entry carries the complete snapshot *before* the delete, because
/// afterwards there is no row left to point at. It is explicitly **not**
/// `reversible()`: nothing here can be undone, and a trail that suggested
/// otherwise would be worse than one that says nothing.
pub async fn purge_user(
    State(state): State<AppState>,
    ctx: AdminCtx,
    audit: AdminAudit,
    Path(id): Path<Uuid>,
    Json(dto): Json<PurgeUserDto>,
) -> Result<Json<serde_json::Value>, AppError> {
    let mut tx = audit.begin(&state.db).await?;

    let victim = sqlx::query_as::<_, User>("SELECT * FROM core.users WHERE id = $1 FOR UPDATE")
        .bind(id)
        .fetch_optional(&mut *tx)
        .await
        .map_err(|e| {
            tracing::error!(error = %e, "purge_user: lecture");
            AppError::Database(e)
        })?
        .ok_or_else(|| AppError::NotFound(format!("User {id}")))?;

    ctx.require_for_unit(keys::USERS_DELETE, victim.org_unit_id)?;
    ensure_can_act_on_user(&mut tx, &ctx, id).await?;

    if victim.is_active {
        return Err(tx
            .abort(
                &state.db,
                AuditEntry::new("core.users.purge")
                    .target(target::USER, id, user_label(&victim))
                    .denied("compte encore actif"),
                AppError::Validation(
                    "Ce compte est encore actif : désactivez-le d'abord. La suppression définitive ne s'applique qu'à un compte déjà retiré du service.".into(),
                ),
            )
            .await);
    }

    // Compared without regard to case: the column is `CITEXT`, so `Marie@…` and
    // `marie@…` are the same account, and refusing the first would be a riddle
    // rather than a safeguard.
    if !dto.confirm_email.trim().eq_ignore_ascii_case(&victim.email) {
        return Err(tx
            .abort(
                &state.db,
                AuditEntry::new("core.users.purge")
                    .target(target::USER, id, user_label(&victim))
                    .denied("adresse de confirmation incorrecte"),
                AppError::Validation(
                    "L'adresse saisie ne correspond pas à celle du compte. Recopiez-la exactement pour confirmer la suppression définitive.".into(),
                ),
            )
            .await);
    }

    let before = snap(target::USER, &victim);

    // Release the alerts this account had taken, *before* the delete.
    //
    // `core.alerts.assignee_id` is `ON DELETE SET NULL`, but the table also
    // carries `CHECK ((assignee_id IS NULL) = (assigned_at IS NULL))`: nulling
    // one half of the pair breaks the constraint and the whole delete fails.
    // The referential action and the check contradict each other, and nothing
    // caught it because until this route existed no account was ever hard
    // deleted. Clearing both columns is what the constraint means by "not
    // assigned" — the alert survives, unassigned, which is the right outcome:
    // it was raised by the instance, not by the person who happened to take it.
    let released = sqlx::query(
        "UPDATE core.alerts SET assignee_id = NULL, assigned_at = NULL WHERE assignee_id = $1",
    )
    .bind(id)
    .execute(&mut *tx)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, user_id = %id, "purge_user: libération des alertes");
        AppError::Database(e)
    })?
    .rows_affected();

    sqlx::query("DELETE FROM core.users WHERE id = $1")
        .bind(id)
        .execute(&mut *tx)
        .await
        .map_err(|e| {
            tracing::error!(error = %e, user_id = %id, "purge_user: suppression");
            // A constraint that still refuses names the relation holding the
            // account back. A bare 500 here would send an operator to the logs
            // for something they can act on — and the point of this route is to
            // finish, or to say precisely what is in the way.
            match e.as_database_error().and_then(|d| d.constraint()) {
                Some(c) => AppError::Conflict(format!(
                    "Des données liées empêchent l'effacement de ce compte (contrainte « {c} »). Elles doivent être traitées avant la suppression définitive."
                )),
                None => AppError::Database(e),
            }
        })?;

    // Runs after the delete, on purpose: the count must see the instance as it
    // will be, not as it was.
    ensure_superadmin_remains(&mut tx).await?;

    tx.commit(
        AuditEntry::new("core.users.purge")
            .target(target::USER, id, user_label(&victim))
            .before(before)
            .detail(format!("{released} alerte(s) libérée(s)")),
    )
    .await?;

    // Modules hold rows keyed on this account. They already handle the event for
    // a deactivation; an erasure is the same signal, sent once more so a module
    // that only reacts to this one still learns of it.
    state.events.publish(crate::events::AppEvent::UserDeleted { user_id: id });

    Ok(Json(json!({ "message": "Compte supprimé définitivement" })))
}

pub async fn admin_stats(
    State(state): State<AppState>,
    _admin: AdminUser,
    ctx: AdminCtx,
) -> Result<Json<serde_json::Value>, AppError> {
    // Instance-wide aggregates: not scopable, so a delegated administrator does
    // not get a count of the accounts they cannot list.
    ctx.require(keys::STATS_READ)?;

    let users_total: i64 = sqlx::query_scalar(
        "SELECT COUNT(*)::bigint FROM core.users",
    )
    .fetch_one(&state.db)
    .await
    .map_err(|e| { tracing::error!(error = %e, "admin_stats: users_total"); AppError::Database(e) })?;

    let users_active: i64 = sqlx::query_scalar(
        "SELECT COUNT(*)::bigint FROM core.users WHERE is_active = TRUE",
    )
    .fetch_one(&state.db)
    .await
    .map_err(|e| { tracing::error!(error = %e, "admin_stats: users_active"); AppError::Database(e) })?;

    let storage_used: i64 = sqlx::query_scalar(
        "SELECT COALESCE(SUM(used_bytes), 0)::bigint FROM core.users",
    )
    .fetch_one(&state.db)
    .await
    .map_err(|e| { tracing::error!(error = %e, "admin_stats: storage_used"); AppError::Database(e) })?;

    let modules_active: i64 = sqlx::query_scalar(
        "SELECT COUNT(*)::bigint FROM core.module_instances WHERE status = 'healthy'",
    )
    .fetch_one(&state.db)
    .await
    .map_err(|e| { tracing::error!(error = %e, "admin_stats: modules_active"); AppError::Database(e) })?;

    // ── Statistiques de sessions ────────────────────────────────────────────
    let sessions_active: i64 = sqlx::query_scalar(
        "SELECT COUNT(*)::bigint FROM core.refresh_tokens
         WHERE revoked_at IS NULL AND expires_at > NOW()",
    )
    .fetch_one(&state.db)
    .await
    .map_err(|e| { tracing::error!(error = %e, "admin_stats: sessions_active"); AppError::Database(e) })?;

    // Utilisateurs distincts ayant au moins une session active (= connectés)
    let users_online: i64 = sqlx::query_scalar(
        "SELECT COUNT(DISTINCT user_id)::bigint FROM core.refresh_tokens
         WHERE revoked_at IS NULL AND expires_at > NOW()",
    )
    .fetch_one(&state.db)
    .await
    .map_err(|e| { tracing::error!(error = %e, "admin_stats: users_online"); AppError::Database(e) })?;

    // Sessions utilisées dans les dernières 24 h
    let sessions_24h: i64 = sqlx::query_scalar(
        "SELECT COUNT(*)::bigint FROM core.refresh_tokens
         WHERE revoked_at IS NULL AND last_used_at > NOW() - INTERVAL '24 hours'",
    )
    .fetch_one(&state.db)
    .await
    .map_err(|e| { tracing::error!(error = %e, "admin_stats: sessions_24h"); AppError::Database(e) })?;

    // ── Agrégats enrichis (cartes + graphiques) ─────────────────────────────────
    let storage_quota_total: i64 = sqlx::query_scalar(
        "SELECT COALESCE(SUM(quota_bytes), 0)::bigint FROM core.users",
    )
    .fetch_one(&state.db).await
    .map_err(|e| { tracing::error!(error = %e, "admin_stats: storage_quota_total"); AppError::Database(e) })?;

    let new_users_7d: i64 = sqlx::query_scalar(
        "SELECT COUNT(*)::bigint FROM core.users WHERE created_at > NOW() - INTERVAL '7 days'",
    )
    .fetch_one(&state.db).await
    .map_err(|e| { tracing::error!(error = %e, "admin_stats: new_users_7d"); AppError::Database(e) })?;

    let new_users_30d: i64 = sqlx::query_scalar(
        "SELECT COUNT(*)::bigint FROM core.users WHERE created_at > NOW() - INTERVAL '30 days'",
    )
    .fetch_one(&state.db).await
    .map_err(|e| { tracing::error!(error = %e, "admin_stats: new_users_30d"); AppError::Database(e) })?;

    // Répartitions (clé, compte)
    let users_by_role: Vec<(String, i64)> = sqlx::query_as(
        "SELECT role, COUNT(*)::bigint FROM core.users GROUP BY role ORDER BY 2 DESC",
    )
    .fetch_all(&state.db).await
    .map_err(|e| { tracing::error!(error = %e, "admin_stats: users_by_role"); AppError::Database(e) })?;

    let sessions_by_device: Vec<(String, i64)> = sqlx::query_as(
        "SELECT COALESCE(NULLIF(device_type, ''), 'unknown'), COUNT(*)::bigint FROM core.refresh_tokens
         WHERE revoked_at IS NULL AND expires_at > NOW() GROUP BY 1 ORDER BY 2 DESC",
    )
    .fetch_all(&state.db).await
    .map_err(|e| { tracing::error!(error = %e, "admin_stats: sessions_by_device"); AppError::Database(e) })?;

    let modules_by_status: Vec<(String, i64)> = sqlx::query_as(
        "SELECT status, COUNT(*)::bigint FROM core.module_instances GROUP BY status ORDER BY 2 DESC",
    )
    .fetch_all(&state.db).await
    .map_err(|e| { tracing::error!(error = %e, "admin_stats: modules_by_status"); AppError::Database(e) })?;

    // Top utilisateurs par stockage
    let top_storage: Vec<(String, i64, i64)> = sqlx::query_as(
        "SELECT COALESCE(NULLIF(display_name, ''), username), used_bytes, quota_bytes
         FROM core.users ORDER BY used_bytes DESC LIMIT 6",
    )
    .fetch_all(&state.db).await
    .map_err(|e| { tracing::error!(error = %e, "admin_stats: top_storage"); AppError::Database(e) })?;

    // Séries journalières (zéro-remplies via generate_series)
    let daily = |table: &str, date_col: &str, days: i64| -> String {
        format!(
            "SELECT to_char(d::date, 'YYYY-MM-DD'), COALESCE(c.cnt, 0)::bigint \
             FROM generate_series((CURRENT_DATE - INTERVAL '{n} days')::date, CURRENT_DATE, INTERVAL '1 day') AS d \
             LEFT JOIN (SELECT {col}::date AS day, COUNT(*) cnt FROM {tbl} \
                        WHERE {col} > CURRENT_DATE - INTERVAL '{n1} days' GROUP BY 1) c ON c.day = d::date \
             ORDER BY d",
            n = days - 1, n1 = days, col = date_col, tbl = table,
        )
    };

    let signups_daily: Vec<(String, i64)> = sqlx::query_as(&daily("core.users", "created_at", 14))
        .fetch_all(&state.db).await
        .map_err(|e| { tracing::error!(error = %e, "admin_stats: signups_daily"); AppError::Database(e) })?;

    let logins_daily: Vec<(String, i64)> = sqlx::query_as(&daily("core.refresh_tokens", "created_at", 14))
        .fetch_all(&state.db).await
        .map_err(|e| { tracing::error!(error = %e, "admin_stats: logins_daily"); AppError::Database(e) })?;

    let events_daily: Vec<(String, i64)> = sqlx::query_as(&daily("core.event_log", "created_at", 7))
        .fetch_all(&state.db).await
        .unwrap_or_default(); // event_log peut être vide / absente selon l'instance

    let kv = |rows: Vec<(String, i64)>| -> Vec<serde_json::Value> {
        rows.into_iter().map(|(k, v)| json!({ "key": k, "count": v })).collect()
    };
    let series = |rows: Vec<(String, i64)>| -> Vec<serde_json::Value> {
        rows.into_iter().map(|(d, v)| json!({ "date": d, "count": v })).collect()
    };

    Ok(Json(json!({
        "users_total":         users_total,
        "users_active":        users_active,
        "storage_used":        storage_used,
        "storage_quota_total": storage_quota_total,
        "modules_active":      modules_active,
        "sessions_active":     sessions_active,
        "users_online":        users_online,
        "sessions_24h":        sessions_24h,
        "new_users_7d":        new_users_7d,
        "new_users_30d":       new_users_30d,
        "users_by_role":       kv(users_by_role),
        "sessions_by_device":  kv(sessions_by_device),
        "modules_by_status":   kv(modules_by_status),
        "signups_daily":       series(signups_daily),
        "logins_daily":        series(logins_daily),
        "events_daily":        series(events_daily),
        "top_storage": top_storage.into_iter()
            .map(|(name, used, quota)| json!({ "name": name, "used": used, "quota": quota }))
            .collect::<Vec<_>>(),
    })))
}

/// GET /admin/users/:id/sessions — liste les sessions actives d'un utilisateur.
pub async fn list_user_sessions(
    State(state): State<AppState>,
    _admin: AdminUser,
    ctx: AdminCtx,
    Path(user_id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let mut conn = state.db.acquire().await.map_err(|e| {
        tracing::error!(error = %e, "list_user_sessions: connexion");
        AppError::Database(e)
    })?;
    let unit = user_org_unit(&mut conn, user_id).await?;
    ctx.require_for_unit(keys::SESSIONS_READ, unit)?;
    drop(conn);

    let sessions = sqlx::query_as::<_, crate::models::session::RefreshToken>(
        r#"SELECT id, user_id, token_hash, device_name, device_type,
                  host(ip_address)::text as ip_address, user_agent,
                  expires_at, created_at, last_used_at, revoked_at, revoke_reason,
                  family_id, client_type
           FROM core.refresh_tokens
           WHERE user_id = $1 AND revoked_at IS NULL AND expires_at > NOW()
           ORDER BY last_used_at DESC"#,
    )
    .bind(user_id)
    .fetch_all(&state.db)
    .await
    .map_err(|e| { tracing::error!(error = %e, "list_user_sessions"); AppError::Database(e) })?;

    Ok(Json(json!({ "sessions": sessions })))
}

/// DELETE /admin/users/:id/sessions/:sid — révoque une session précise.
pub async fn revoke_user_session(
    State(state): State<AppState>,
    ctx: AdminCtx,
    audit: AdminAudit,
    Path((user_id, session_id)): Path<(Uuid, Uuid)>,
) -> Result<Json<serde_json::Value>, AppError> {
    let mut tx = audit.begin(&state.db).await?;

    let unit = user_org_unit(&mut tx, user_id).await?;
    ctx.require_for_unit(keys::SESSIONS_DELETE, unit)?;
    ensure_can_act_on_user(&mut tx, &ctx, user_id).await?;

    // `token_hash` is not selected: it is not on the session whitelist and has
    // no business travelling anywhere near the trail.
    let session: Option<(Option<String>, Option<String>, Option<String>)> = sqlx::query_as(
        r#"SELECT device_name, device_type, host(ip_address)::text
           FROM core.refresh_tokens
           WHERE id = $1 AND user_id = $2 AND revoked_at IS NULL
           FOR UPDATE"#,
    )
    .bind(session_id)
    .bind(user_id)
    .fetch_optional(&mut *tx)
    .await
    .map_err(|e| { tracing::error!(error = %e, "revoke_user_session: lecture"); AppError::Database(e) })?;

    let Some((device_name, device_type, ip)) = session else {
        return Err(AppError::NotFound("Session introuvable".into()));
    };

    sqlx::query(
        "UPDATE core.refresh_tokens
         SET revoked_at = NOW(), revoke_reason = 'admin'
         WHERE id = $1 AND user_id = $2",
    )
    .bind(session_id)
    .bind(user_id)
    .execute(&mut *tx)
    .await
    .map_err(|e| { tracing::error!(error = %e, "revoke_user_session"); AppError::Database(e) })?;

    let label = device_name.clone().unwrap_or_else(|| "Session".into());
    tx.commit(
        AuditEntry::new("core.sessions.revoke")
            .target(target::SESSION, session_id, label)
            .before(crate::audit::redact::snapshot(
                target::SESSION,
                &json!({
                    "id": session_id, "user_id": user_id,
                    "device_name": device_name, "device_type": device_type,
                    "ip_address": ip,
                }),
            ))
            .after(crate::audit::redact::snapshot(
                target::SESSION,
                &json!({ "id": session_id, "user_id": user_id, "revoke_reason": "admin" }),
            )),
    )
    .await?;

    Ok(Json(json!({ "ok": true })))
}

/// DELETE /admin/users/:id/sessions — révoque TOUTES les sessions d'un utilisateur.
pub async fn revoke_all_user_sessions(
    State(state): State<AppState>,
    ctx: AdminCtx,
    audit: AdminAudit,
    Path(user_id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let mut tx = audit.begin(&state.db).await?;

    let unit = user_org_unit(&mut tx, user_id).await?;
    ctx.require_for_unit(keys::SESSIONS_DELETE, unit)?;
    ensure_can_act_on_user(&mut tx, &ctx, user_id).await?;

    let target_user: Option<(String, String)> =
        sqlx::query_as("SELECT username, email FROM core.users WHERE id = $1")
            .bind(user_id)
            .fetch_optional(&mut *tx)
            .await
            .map_err(|e| { tracing::error!(error = %e, "revoke_all_user_sessions: cible"); AppError::Database(e) })?;

    let affected = sqlx::query(
        "UPDATE core.refresh_tokens
         SET revoked_at = NOW(), revoke_reason = 'admin'
         WHERE user_id = $1 AND revoked_at IS NULL",
    )
    .bind(user_id)
    .execute(&mut *tx)
    .await
    .map_err(|e| { tracing::error!(error = %e, "revoke_all_user_sessions"); AppError::Database(e) })?
    .rows_affected();

    let label = target_user
        .map(|(username, email)| format!("{username} <{email}>"))
        .unwrap_or_else(|| user_id.to_string());

    tx.commit(
        AuditEntry::new("core.sessions.revoke_all")
            .target(target::USER, user_id, label)
            .after(json!({ "revoked": affected }))
            .detail(format!("{affected} session(s) révoquée(s)")),
    )
    .await?;

    Ok(Json(json!({ "ok": true, "revoked": affected })))
}
