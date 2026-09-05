use crate::{
    audit::{login_context, redact::target, AuditEntry},
    auth::{
        admin_2fa, backup_codes, client_ip::ClientIp,
        middleware::{AuthUser, InternalRequest},
        reauth::Reauthenticated, reauth::store as reauth_store, totp as totp_auth,
    },
    errors::AppError,
    models::{session::RefreshToken, user::UpdateUserDto},
    settings,
    state::AppState,
};
use axum::{
    body::Body,
    extract::{Multipart, Path, Query, State},
    http::{header, HeaderMap},
    response::Response,
    Json,
};
use bytes::Bytes;
use serde::Deserialize;
use serde_json::json;
use validator::Validate;

#[derive(Deserialize)]
pub struct TotpCodeDto {
    pub code: String,
}

/// `GET /api/v1/me` — the caller's account row **and** what they may do.
///
/// The privilege block is information about oneself, so it demands no privilege:
/// exactly like the `role` field the account has always been able to read. Before
/// it existed the only way for a client to learn its own privileges was
/// `GET /admin/users/:id/privileges`, which requires `core.roles.read` — so a
/// delegated administrator who was not also granted that key read back a refusal
/// and was shown no console at all, and an ordinary user provoked a failing
/// request on every single page load.
///
/// What is reported is what **this credential** may exercise, not what the
/// account holds in the absolute: the context is narrowed by the presented API
/// token's scopes exactly as the enforcement path narrows it (see
/// [`crate::auth::token_scope`]). An interface driven by a scoped token therefore
/// offers precisely the actions the server will accept.
///
/// The response shape is only ever added to — `user` keeps its place and its
/// contents for the frontend, the modules and the native applications.
#[utoipa::path(
    get,
    path = "/api/v1/me",
    tag = "me",
    security(("bearer" = [])),
    responses(
        (status = 200, description = "Profil de l'utilisateur courant et ses privilèges effectifs", body = crate::models::user::User),
        (status = 401, description = "Non authentifié")
    )
)]
pub async fn get_me(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
    ctx: crate::authz::AdminCtx,
) -> Result<Json<serde_json::Value>, AppError> {
    let mut privileges = ctx.effective();

    // Mirrors the disjunction the `/admin/*` layer itself applies, so the console
    // never hides a surface the server would admit — with one restriction the
    // layer has no need of: `users.role` describes the *account*, and a scoped
    // token must not inherit its owner's console from a denormalised flag.
    if user.role == "admin" && ctx.origin != crate::audit::ActorOrigin::ApiToken {
        privileges.is_admin = true;
    }

    // Per-account feature switches: the settings that decide whether a whole
    // surface EXISTS for this person, as opposed to what they may do inside one.
    //
    // Served here rather than discovered by the interface calling the feature's
    // own route, because "is it there?" must be answered before the first paint:
    // a section that appears half a second after the page did reads as a defect,
    // and the answer depends on the scope chain (unit, group, account), which
    // only the server can walk.
    let features = json!({
        "data_export_self_service":
            crate::data_export::policy::self_service_enabled(&state.db, user.id).await,
    });

    Ok(Json(json!({
        "user": user,
        "privileges": privileges,
        "features": features,
    })))
}

/// Flux d'activité personnel : derniers événements de l'utilisateur connecté,
/// tous modules confondus (filtre sur payload.user_id).
pub async fn me_activity(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
    Query(q): Query<std::collections::HashMap<String, String>>,
) -> Result<Json<serde_json::Value>, AppError> {
    let limit: i64 = q.get("limit").and_then(|v| v.parse().ok()).unwrap_or(15).clamp(1, 50);

    let rows = sqlx::query(
        r#"SELECT id, event_type, source_module, payload, created_at
           FROM core.event_log
           WHERE payload->>'user_id' = $1
           ORDER BY created_at DESC
           LIMIT $2"#,
    )
    .bind(user.id.to_string())
    .bind(limit)
    .fetch_all(&state.db)
    .await
    .map_err(|e| {
        tracing::error!("me_activity query failed: {e}");
        e
    })?;

    let events: Vec<_> = rows
        .into_iter()
        .map(|r| {
            use sqlx::Row;
            json!({
                "id": r.get::<i64, _>("id"),
                "event_type": r.get::<String, _>("event_type"),
                "source_module": r.get::<Option<String>, _>("source_module"),
                "payload": r.get::<serde_json::Value, _>("payload"),
                "created_at": r.get::<chrono::DateTime<chrono::Utc>, _>("created_at"),
            })
        })
        .collect();

    Ok(Json(json!({ "events": events })))
}

/// `PATCH /api/v1/me` — the account rewrites its own profile.
///
/// ## What the directory policy governs here
///
/// Until migration `000110` this route accepted `display_name` and `avatar_url`
/// from anybody, unconditionally. Both are now governed by
/// `directory.profile_edit_name` / `directory.profile_edit_photo`, resolved for
/// **this account** — so the answer walks the account, its groups, its
/// organisational unit and that unit's ancestors before falling back to the
/// instance (`crate::settings::directory`).
///
/// A forbidden field is **refused**, not dropped. Silently ignoring it would
/// hand the client a `200` and a response body still showing the old name, and
/// the person would retry forever; the refusal names the field and stops the
/// whole request before the transaction opens, so a request touching a
/// permitted field and a forbidden one writes neither.
///
/// ## Absent, null, value
///
/// The six profile fields of migration `000114` accept an explicit `null`,
/// which **erases** them (`UpdateUserDto` and its `double_option`). That is not
/// a nicety: `gender` and `birthday` are personal data, and a field somebody can
/// fill in but never take back out is not a field they control. The statement
/// below therefore writes each one under a `CASE WHEN <present>` rather than a
/// `COALESCE`, which cannot express an erase.
///
/// ## What is logged, and what is not
///
/// The audit line and the `UserUpdated` event carry the **names** of the fields
/// touched and nothing else. No profile value — least of all a gender or a
/// birthday — reaches a log, an event payload or the audit trail; the trail's
/// own whitelist (`audit::redact`) does not list these columns either.
pub async fn update_me(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
    client_ip: ClientIp,
    headers: HeaderMap,
    Json(mut dto): Json<UpdateUserDto>,
) -> Result<Json<serde_json::Value>, AppError> {
    dto.validate()
        .map_err(|e| AppError::Validation(e.to_string()))?;
    // Trims, turns an emptied box into an explicit erase, and refuses what will
    // not fit or is not a plausible date — before the policy is even consulted,
    // so a malformed request never costs a settings resolution.
    dto.tidy_profile(chrono::Utc::now().date_naive())
        .map_err(AppError::Validation)?;

    // Before the transaction, and before any write: the policy is a
    // precondition of the request, not a correction applied to its result.
    //
    // Only a field the request actually carries **and changes** is checked.
    // Clients send whole profile forms, and refusing a `display_name` that is
    // merely being echoed back unchanged would make the profile page unusable
    // for everything else it contains — the check therefore asks "is this a
    // change?", not "is this present?".
    let changed_text = |requested: &Option<Option<String>>, stored: &Option<String>| match requested
    {
        None => false,
        Some(value) => value.as_deref() != stored.as_deref(),
    };

    use settings::directory::ProfileField as PF;
    let governed = [
        (dto.display_name.is_some() && dto.display_name != user.display_name, PF::Name),
        (changed_text(&dto.first_name, &user.first_name), PF::FirstName),
        (changed_text(&dto.last_name, &user.last_name), PF::LastName),
        (dto.avatar_url.is_some() && dto.avatar_url != user.avatar_url, PF::Photo),
        (changed_text(&dto.name_pronunciation, &user.name_pronunciation), PF::NamePronunciation),
        (changed_text(&dto.pronouns, &user.pronouns), PF::Pronouns),
        (changed_text(&dto.work_location, &user.work_location), PF::WorkLocation),
        (changed_text(&dto.introduction, &user.introduction), PF::Introduction),
        (changed_text(&dto.gender, &user.gender), PF::Gender),
        (
            match dto.birthday {
                None => false,
                Some(value) => value != user.birthday,
            },
            PF::Birthday,
        ),
    ];
    for (is_change, field) in governed {
        if is_change {
            settings::directory::ensure_may_edit(&state.db, user.id, field).await?;
        }
    }

    // The preferences write and its mirror into the scoped settings table share
    // one transaction: half of a personal override is worse than none, because
    // the resolver and the client would then disagree about what is set.
    let mut tx = state.db.begin().await.map_err(|e| {
        tracing::error!(error = %e, "update_me: ouverture de transaction");
        AppError::Database(e)
    })?;

    let updated = sqlx::query_as::<_, crate::models::user::User>(
        r#"UPDATE core.users
           SET display_name = COALESCE($1, display_name),
               avatar_url   = COALESCE($2, avatar_url),
               preferences  = CASE WHEN $3::jsonb IS NOT NULL THEN preferences || $3 ELSE preferences END,
               -- One boolean "did the request carry this field" per column, so
               -- an explicit null erases and an absent field is left alone.
               first_name         = CASE WHEN $4::boolean  THEN $5::text  ELSE first_name END,
               last_name          = CASE WHEN $6::boolean  THEN $7::text  ELSE last_name END,
               name_pronunciation = CASE WHEN $8::boolean  THEN $9::text  ELSE name_pronunciation END,
               pronouns           = CASE WHEN $10::boolean THEN $11::text ELSE pronouns END,
               work_location      = CASE WHEN $12::boolean THEN $13::text ELSE work_location END,
               introduction       = CASE WHEN $14::boolean THEN $15::text ELSE introduction END,
               gender             = CASE WHEN $16::boolean THEN $17::text ELSE gender END,
               birthday           = CASE WHEN $18::boolean THEN $19::date ELSE birthday END
           WHERE id = $20
           RETURNING *"#,
    )
    .bind(dto.display_name.as_deref())
    .bind(dto.avatar_url.as_deref())
    .bind(dto.preferences.as_ref())
    .bind(dto.first_name.is_some())
    .bind(dto.first_name.clone().flatten())
    .bind(dto.last_name.is_some())
    .bind(dto.last_name.clone().flatten())
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
    .bind(user.id)
    .fetch_one(&mut *tx)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, user_id = %user.id, "update_me: écriture du profil");
        AppError::Database(e)
    })?;

    // Personal module settings live in two places for compatibility: the
    // `preferences` document the client still writes, and the scoped settings
    // table the resolver reads. Keeping them in step is what makes a personal
    // override survive its unit's default changing underneath it.
    if let Some(patch) = dto.preferences.as_ref() {
        crate::settings::store::sync_user_preferences(&mut tx, user.id, patch).await?;
    }

    tx.commit().await.map_err(|e| {
        tracing::error!(error = %e, user_id = %user.id, "update_me: commit");
        AppError::Database(e)
    })?;

    // What the request actually carried, rather than the three names this event
    // used to announce whatever had been sent. A subscriber that reacts to a
    // photo change should not be woken by somebody editing their pronouns.
    let touched = dto.profile_fields_present();

    state.events.publish(crate::events::AppEvent::UserUpdated {
        user_id: user.id,
        fields: touched.iter().map(|n| (*n).to_string()).collect(),
    });

    // A self-service write is still a write, and this one now reaches columns an
    // administrator governs. The entry records **which fields** moved and never
    // their contents: the trail is readable by every administrator and exported
    // to CSV, and a gender does not belong in either.
    if !touched.is_empty() {
        let ctx = login_context(&headers, client_ip, &user);
        ctx.record(
            &state.db,
            AuditEntry::new("core.me.profile.update")
                .module("core")
                .target(target::USER, user.id, user.username.clone())
                .detail(format!("champs modifiés : {}", touched.join(", "))),
        )
        .await;
    }

    Ok(Json(json!({ "user": updated })))
}

pub async fn change_password(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
    Json(dto): Json<crate::models::user::ChangePasswordDto>,
) -> Result<Json<serde_json::Value>, AppError> {
    let hash = user
        .password_hash
        .as_deref()
        .ok_or_else(|| AppError::Validation("Compte OAuth uniquement".into()))?;

    let ok = crate::crypto::password::verify_password(&dto.old_password, hash)
        .map_err(AppError::Internal)?;

    if !ok {
        return Err(AppError::Validation("Ancien mot de passe incorrect".into()));
    }

    // Validate before touching the database: the DTO's own rules (length), plus
    // the new password must actually differ from the current one — otherwise a
    // forced change could be "satisfied" by re-entering the default password.
    dto.validate()
        .map_err(|e| AppError::Validation(e.to_string()))?;

    if dto.new_password == dto.old_password {
        return Err(AppError::Validation(
            "Le nouveau mot de passe doit être différent de l'actuel".into(),
        ));
    }

    // The policy of THIS account's scope (migration `000115`): account →
    // groups → its unit and the units above → instance. Read before hashing so
    // a refused password never costs an argon2id.
    let policy =
        crate::settings::password_policy::PasswordPolicy::for_user(&state.db, user.id).await?;
    policy.check(&dto.new_password)?;
    crate::settings::password_policy::reject_reuse(
        &state.db,
        &policy,
        user.id,
        &dto.new_password,
    )
    .await?;

    let new_hash = crate::crypto::password::hash_password(&dto.new_password)
        .map_err(AppError::Internal)?;

    let mut tx = state.db.begin().await?;

    // Clearing must_change_password here is what lifts the forced-change screen
    // and re-opens administrative writes. `password_changed_at` restarts the
    // expiry clock — and is what a forced change, once made, actually resets.
    sqlx::query(
        "UPDATE core.users \
            SET password_hash = $1, must_change_password = FALSE, password_changed_at = NOW() \
          WHERE id = $2",
    )
    .bind(&new_hash)
    .bind(user.id)
    .execute(&mut *tx)
    .await?;

    // In the same transaction as the change: a history that commits without the
    // password it describes would make the no-reuse rule refuse a password the
    // account never had, or accept one it still has.
    crate::settings::password_policy::remember(&mut tx, user.id, &new_hash, policy.history_depth)
        .await?;

    sqlx::query(
        "UPDATE core.refresh_tokens SET revoked_at = NOW(), revoke_reason = 'password_change'
         WHERE user_id = $1 AND revoked_at IS NULL",
    )
    .bind(user.id)
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;

    // A step-up proof is layered on top of a credential; when that credential is
    // replaced, the proof goes with it.
    reauth_store::revoke_all(&state.db, user.id).await;

    Ok(Json(json!({ "message": "Mot de passe mis à jour" })))
}

/// `GET /api/v1/me/security` — everything the settings page needs to talk about
/// the second factor without three separate round-trips.
///
/// Counters only. No secret, no code, no token.
pub async fn security_overview(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
) -> Result<Json<serde_json::Value>, AppError> {
    let codes = backup_codes::status(&state.db, user.id).await?;
    let admin = admin_2fa::status(&state.db, &user).await;
    let grace = reauth_store::grace_until(&state.db, user.id).await?;

    Ok(Json(json!({
        "totp_enabled": user.totp_enabled,
        "backup_codes": codes,
        "admin_2fa":    admin,
        "reauth_grace_until": grace,
    })))
}

#[utoipa::path(
    get,
    path = "/api/v1/me/sessions",
    tag = "me",
    security(("bearer" = [])),
    responses(
        (status = 200, description = "Sessions actives (refresh tokens) de l'utilisateur, avec client_type", body = [crate::models::session::RefreshToken]),
        (status = 401, description = "Non authentifié")
    )
)]
pub async fn list_sessions(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
) -> Result<Json<serde_json::Value>, AppError> {
    let sessions = sqlx::query_as::<_, RefreshToken>(
        r#"SELECT id, user_id, token_hash, device_name, device_type,
                  host(ip_address)::text as ip_address, user_agent,
                  expires_at, created_at, last_used_at, revoked_at, revoke_reason,
                  family_id, client_type
           FROM core.refresh_tokens
           WHERE user_id = $1 AND revoked_at IS NULL AND expires_at > NOW()
           ORDER BY last_used_at DESC"#,
    )
    .bind(user.id)
    .fetch_all(&state.db)
    .await?;

    Ok(Json(json!({ "sessions": sessions })))
}

pub async fn revoke_session(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
    Path(session_id): Path<uuid::Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let affected = sqlx::query(
        "UPDATE core.refresh_tokens
         SET revoked_at = NOW(), revoke_reason = 'logout'
         WHERE id = $1 AND user_id = $2 AND revoked_at IS NULL",
    )
    .bind(session_id)
    .bind(user.id)
    .execute(&state.db)
    .await?
    .rows_affected();

    if affected == 0 {
        return Err(AppError::NotFound("Session introuvable".into()));
    }

    Ok(Json(json!({ "message": "Session révoquée" })))
}

pub async fn revoke_all_sessions(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query(
        "UPDATE core.refresh_tokens
         SET revoked_at = NOW(), revoke_reason = 'logout'
         WHERE user_id = $1 AND revoked_at IS NULL",
    )
    .bind(user.id)
    .execute(&state.db)
    .await?;

    Ok(Json(json!({ "message": "Toutes les sessions révoquées" })))
}

#[derive(Deserialize)]
pub struct SearchUsersQuery {
    pub q:     Option<String>,
    pub limit: Option<i64>,
    /// `unit` narrows the answer to the caller's own organisational unit and its
    /// sub-units, whatever the instance's audience policy says. It can only ever
    /// RESTRICT: a caller asking for their unit on an instance that already
    /// restricts gets the same list, and the `directory.enabled` gate still
    /// applies first. Used by the address book to offer "my unit" as a group.
    pub scope: Option<String>,
}

/// The **only** columns the directory routes may select.
///
/// Written once, used by both `search_users` and `lookup_users`, and asserted by
/// the test at the bottom of this file. The point is not to save typing: since
/// migration `000114` the account row carries `gender` and `birthday`, and those
/// two must never leave the account's own profile or the administration sheet.
/// A single `SELECT *` here — or one column quietly appended to a hand-written
/// list — would push a personal datum into every people picker of every module,
/// silently, because both routes serialise whatever they select. One constant
/// and one test is what makes that regression fail in CI rather than in
/// production.
///
/// `email` is selected but only *emitted* when `directory.share_email` says so.
const DIRECTORY_COLUMNS: &str = "id, username, display_name, avatar_url, email";

/// Search active accounts — the staff directory, as the caller is entitled to
/// see it.
///
/// The three sharing keys of migration `000110` all land here, resolved for the
/// **caller** (`crate::settings::directory`), which is what makes them
/// per-organisational-unit:
///
///   * `directory.enabled` off answers an empty list rather than a `403`. A
///     member picker that finds nobody is the intended experience of a closed
///     directory; an error would surface in every module as a broken component;
///   * `directory.audience = same_unit` narrows the result to the caller's own
///     unit **and its sub-units** (`core.org_unit_descendants`, migration
///     `000041`) — the per-unit directory, obtained from the scope engine rather
///     than from a second object to administer;
///   * `directory.share_email` adds the address, which this route has never
///     disclosed. It stays absent from the payload when the policy says so —
///     omitted, not blanked, so no client can mistake `""` for an address.
pub async fn search_users(
    State(state): State<AppState>,
    AuthUser(caller): AuthUser,
    Query(q): Query<SearchUsersQuery>,
) -> Result<Json<serde_json::Value>, AppError> {
    let limit = q.limit.unwrap_or(20).min(50);
    let query = q.q.as_deref().unwrap_or("");

    let policy = settings::directory::SharingPolicy::resolve(
        &state.db,
        caller.id,
        caller.role == "admin",
    )
    .await?;

    if !policy.enabled {
        return Ok(Json(json!({ "users": [] })));
    }

    // Narrowing is expressed as a flag plus the anchor unit rather than as "a
    // NULL anchor means no filter": an account attached to no unit would then
    // fall through to the whole instance, turning the tightest policy into the
    // loosest one for exactly the accounts nobody thought about. Here it sees an
    // empty directory instead, which is the closed side of the failure.
    let restrict = policy.audience == settings::directory::Audience::SameUnit
        || q.scope.as_deref() == Some("unit");
    let anchor = caller.org_unit_id;

    // The projection comes from `DIRECTORY_COLUMNS`, never from a list typed
    // here: see that constant for why.
    let sql = format!(
        r#"SELECT {DIRECTORY_COLUMNS}
           FROM core.users
           WHERE is_active = TRUE
             AND ($1 = '' OR username ILIKE '%' || $1 || '%'
                          OR display_name ILIKE '%' || $1 || '%')
             AND (NOT $3::boolean
                  OR ($4::uuid IS NOT NULL
                      AND org_unit_id IN (SELECT d.id FROM core.org_unit_descendants($4) d)))
           ORDER BY display_name ASC NULLS LAST
           LIMIT $2"#
    );

    let users = sqlx::query_as::<_, (uuid::Uuid, String, Option<String>, Option<String>, String)>(
        &sql,
    )
    .bind(query)
    .bind(limit)
    .bind(restrict)
    .bind(anchor)
    .fetch_all(&state.db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, caller = %caller.id, "search_users: lecture de l'annuaire impossible");
        AppError::Database(e)
    })?;

    let result: Vec<serde_json::Value> = users
        .into_iter()
        .map(|(id, username, display_name, avatar_url, email)| {
            let shown = display_name.unwrap_or_else(|| username.clone());
            let mut entry = json!({
                "id":           id,
                "username":     username,
                "display_name": shown,
                "avatar_url":   avatar_url,
            });
            if policy.share_email {
                entry["email"] = json!(email);
            }
            entry
        })
        .collect();

    Ok(Json(json!({ "users": result })))
}

#[derive(serde::Deserialize)]
pub struct LookupUsersQuery {
    /// Liste d'UUID séparés par des virgules.
    pub ids: Option<String>,
}

/// Resolves accounts by id — public profile fields, plus the address when the
/// directory policy publishes it.
///
/// **Only `directory.share_email` applies here, and that is deliberate.** This
/// route answers "who is this identifier I am already holding" — a document's
/// author, a mention, an event organiser — not "show me the directory". Closing
/// it under `directory.enabled`, or narrowing it under `directory.audience`,
/// would blank out authorship labels across every module for no privacy gain:
/// the caller already possesses the uuid, which is only ever obtained from data
/// they can already read, and uuids are not enumerable.
///
/// Disclosure of an *address* is a different question from resolution of a
/// name, which is why that one key does apply: an instance that withholds
/// addresses from its directory must not hand them out through the side door.
///
/// The profile fields of migration `000114` are **not** answered here, and
/// `gender` and `birthday` never will be: see [`DIRECTORY_COLUMNS`].
pub async fn lookup_users(
    State(state): State<AppState>,
    AuthUser(caller): AuthUser,
    Query(q): Query<LookupUsersQuery>,
) -> Result<Json<serde_json::Value>, AppError> {
    let ids: Vec<uuid::Uuid> = q
        .ids
        .unwrap_or_default()
        .split(',')
        .filter_map(|s| uuid::Uuid::parse_str(s.trim()).ok())
        .take(200)
        .collect();

    if ids.is_empty() {
        return Ok(Json(json!({ "users": [] })));
    }

    let policy = settings::directory::SharingPolicy::resolve(
        &state.db,
        caller.id,
        caller.role == "admin",
    )
    .await?;

    // Same projection as the search, for the same reason: this route is what
    // every module calls to put a name on an author or a mention, and a personal
    // datum appended to the list here would surface in all of them at once.
    let sql = format!("SELECT {DIRECTORY_COLUMNS} FROM core.users WHERE id = ANY($1)");

    let users = sqlx::query_as::<_, (uuid::Uuid, String, Option<String>, Option<String>, String)>(
        &sql,
    )
    .bind(&ids)
    .fetch_all(&state.db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, caller = %caller.id, "lookup_users: résolution des comptes impossible");
        AppError::Database(e)
    })?;

    let result: Vec<serde_json::Value> = users
        .into_iter()
        .map(|(id, username, display_name, avatar_url, email)| {
            let shown = display_name.unwrap_or_else(|| username.clone());
            let mut entry = json!({
                "id":           id,
                "username":     username,
                "display_name": shown,
                "avatar_url":   avatar_url,
            });
            if policy.share_email {
                entry["email"] = json!(email);
            }
            entry
        })
        .collect();

    Ok(Json(json!({ "users": result })))
}

// ── 2FA / TOTP ────────────────────────────────────────────────────────────────

/// Démarre la configuration 2FA : génère un secret TOTP, stocke-le chiffré
/// en « pending », et retourne l'URI otpauth:// + le secret en clair (base32).
pub async fn setup_totp(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
) -> Result<Json<serde_json::Value>, AppError> {
    if user.totp_enabled {
        return Err(AppError::Conflict("La 2FA est déjà activée".into()));
    }

    let (secret_base32, uri, encrypted) = totp_auth::generate_secret(
        &state.settings.auth.jwt_secret, &user.email,
    )
    .map_err(AppError::Internal)?;

    sqlx::query("UPDATE core.users SET totp_pending_secret = $1 WHERE id = $2")
        .bind(&encrypted)
        .bind(user.id)
        .execute(&state.db)
        .await?;

    Ok(Json(json!({ "uri": uri, "secret": secret_base32 })))
}

/// Vérifie le code TOTP entré par l'utilisateur et active définitivement la 2FA.
///
/// Backup codes are generated **here**, in the same breath as the enrolment, and
/// returned in this response and nowhere else. Enrolling without them is what
/// turns a lost phone into a lost account, so the two are not separate steps the
/// user could skip one of.
pub async fn enable_totp(
    State(state): State<AppState>,
    client_ip: ClientIp,
    headers: HeaderMap,
    AuthUser(user): AuthUser,
    Json(dto): Json<TotpCodeDto>,
) -> Result<Json<serde_json::Value>, AppError> {
    let encrypted = user
        .totp_pending_secret
        .as_deref()
        .ok_or_else(|| AppError::Validation("Démarrez d'abord la configuration 2FA".into()))?;

    let valid = totp_auth::verify_code(
        &state.settings.auth.jwt_secret, encrypted, &dto.code, &user.email,
    )
    .map_err(AppError::Internal)?;

    if !valid {
        return Err(AppError::Validation("Code incorrect".into()));
    }

    sqlx::query(
        "UPDATE core.users
         SET totp_secret = totp_pending_secret,
             totp_pending_secret = NULL,
             totp_enabled = TRUE
         WHERE id = $1",
    )
    .bind(user.id)
    .execute(&state.db)
    .await
    .map_err(|e| { tracing::error!(error = %e, user_id = %user.id, "enable_totp: activation"); AppError::Database(e) })?;

    let codes = backup_codes::replace_all(&state.db, user.id).await?;

    // The account now satisfies any instance-wide requirement, so its pending
    // deadline is dropped: turning the second factor off later must re-arm a
    // fresh delay rather than refuse access on the spot.
    admin_2fa::clear_deadline(&state.db, user.id).await;

    let ctx = login_context(&headers, client_ip, &user);
    ctx.record(
        &state.db,
        AuditEntry::new("core.auth.backup_codes.generate")
            .module("core")
            .target(target::USER, user.id, user.username.clone())
            .detail(format!("{} codes émis à l'activation de la 2FA", codes.len())),
    )
    .await;

    let status = backup_codes::status(&state.db, user.id).await?;

    Ok(Json(json!({
        "enabled":      true,
        // Shown exactly once. No route returns them again.
        "backup_codes": codes,
        "status":       status,
    })))
}

/// Désactive la 2FA après vérification d'un code TOTP valide.
///
/// Sensitive: removing the second factor is the single most valuable thing an
/// attacker holding a live session could do, so it takes [`Reauthenticated`] on
/// top of the TOTP code the handler already asks for.
pub async fn disable_totp(
    State(state): State<AppState>,
    client_ip: ClientIp,
    headers: HeaderMap,
    proof: Reauthenticated,
    Json(dto): Json<TotpCodeDto>,
) -> Result<Json<serde_json::Value>, AppError> {
    let user = proof.user().clone();

    if !user.totp_enabled {
        return Err(AppError::Validation("La 2FA n'est pas activée".into()));
    }

    let encrypted = user
        .totp_secret
        .as_deref()
        .ok_or_else(|| AppError::Internal(anyhow::anyhow!("Secret TOTP absent malgré totp_enabled=true")))?;

    let valid = totp_auth::verify_code(
        &state.settings.auth.jwt_secret, encrypted, &dto.code, &user.email,
    )
    .map_err(AppError::Internal)?;

    if !valid {
        return Err(AppError::Validation("Code incorrect".into()));
    }

    sqlx::query(
        "UPDATE core.users
         SET totp_secret = NULL,
             totp_pending_secret = NULL,
             totp_enabled = FALSE
         WHERE id = $1",
    )
    .bind(user.id)
    .execute(&state.db)
    .await
    .map_err(|e| { tracing::error!(error = %e, user_id = %user.id, "disable_totp: désactivation"); AppError::Database(e) })?;

    // Codes exist to stand in for the second factor; with no second factor they
    // would be a standing password bypass.
    let dropped = backup_codes::clear(&state.db, user.id).await?;

    let ctx = login_context(&headers, client_ip, &user);
    ctx.record(
        &state.db,
        AuditEntry::new("core.auth.two_factor.disable")
            .module("core")
            .target(target::USER, user.id, user.username.clone())
            .detail(format!("{dropped} code(s) de secours supprimé(s)")),
    )
    .await;

    Ok(Json(json!({ "enabled": false })))
}

/// POST /api/v1/me/avatar — upload d'avatar (multipart, champ "avatar")
pub async fn upload_avatar(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
    mut multipart: Multipart,
) -> Result<Json<serde_json::Value>, AppError> {
    // The other half of `directory.profile_edit_photo`. Governing only the
    // `avatar_url` field of `PATCH /me` would leave the door this route opens
    // wide: it is the one the profile page actually uses, and it writes the
    // same column. Checked before a single byte is read from the wire, so a
    // refused upload costs neither the transfer nor the storage write.
    settings::directory::ensure_may_edit(
        &state.db,
        user.id,
        settings::directory::ProfileField::Photo,
    )
    .await?;

    let ext_for = |ct: &str| match ct {
        "image/png"  => "png",
        "image/webp" => "webp",
        "image/gif"  => "gif",
        _            => "jpg",
    };

    let mut data:     Option<(Bytes, String)> = None;  // avatar recadré
    let mut original: Option<(Bytes, String)> = None;  // image originale (pour re-recadrage)

    while let Some(field) = multipart
        .next_field()
        .await
        .map_err(|e| AppError::Validation(format!("Champ invalide : {e}")))?
    {
        let name = field.name().map(|s| s.to_owned());
        let content_type = field.content_type().unwrap_or("image/jpeg").to_owned();
        match name.as_deref() {
            Some("avatar") | Some("original") => {
                if !content_type.starts_with("image/") {
                    return Err(AppError::Validation("Le fichier doit être une image".into()));
                }
                let bytes = field.bytes().await
                    .map_err(|e| AppError::Validation(format!("Lecture fichier : {e}")))?;
                if bytes.len() > 10 * 1024 * 1024 {
                    return Err(AppError::Validation("L'image ne doit pas dépasser 10 Mo".into()));
                }
                if name.as_deref() == Some("avatar") { data = Some((bytes, content_type)); }
                else { original = Some((bytes, content_type)); }
            }
            _ => {}
        }
    }

    let (bytes, content_type) = data.ok_or_else(|| AppError::Validation("Champ 'avatar' manquant".into()))?;
    let ext = ext_for(&content_type);
    let path = format!("avatars/{}.{}", user.id, ext);

    state
        .storage
        .put(&path, bytes)
        .await
        .map_err(|e| AppError::Internal(anyhow::anyhow!("Stockage avatar : {e}")))?;

    // Conserver l'image originale (full) pour permettre un re-recadrage ultérieur
    if let Some((obytes, oct)) = original {
        let opath = format!("avatars/{}-original.{}", user.id, ext_for(&oct));
        let _ = state.storage.put(&opath, obytes).await;
    }

    let avatar_url = format!("/api/v1/users/{}/avatar", user.id);

    let updated = sqlx::query_as::<_, crate::models::user::User>(
        "UPDATE core.users SET avatar_url = $1 WHERE id = $2 RETURNING *",
    )
    .bind(&avatar_url)
    .bind(user.id)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(json!({ "user": updated })))
}

/// GET /api/v1/users/:id/avatar — serve l'avatar stocké
pub async fn get_avatar(
    State(state): State<AppState>,
    Path(user_id): Path<uuid::Uuid>,
) -> Result<Response, AppError> {
    // Try each supported format
    let formats = [("jpg", "image/jpeg"), ("png", "image/png"), ("webp", "image/webp"), ("gif", "image/gif")];
    for (ext, mime) in formats {
        let path = format!("avatars/{}.{}", user_id, ext);
        if let Ok(bytes) = state.storage.get(&path).await {
            return Ok(Response::builder()
                .header(header::CONTENT_TYPE, mime)
                .header(header::CACHE_CONTROL, "public, max-age=3600")
                .body(Body::from(bytes))
                .unwrap());
        }
    }
    Err(AppError::NotFound("Avatar introuvable".into()))
}

/// GET /api/v1/users/:id/avatar/original — serve l'image originale (pour re-recadrage)
pub async fn get_avatar_original(
    State(state): State<AppState>,
    Path(user_id): Path<uuid::Uuid>,
) -> Result<Response, AppError> {
    let formats = [("jpg", "image/jpeg"), ("png", "image/png"), ("webp", "image/webp"), ("gif", "image/gif")];
    for (ext, mime) in formats {
        let path = format!("avatars/{}-original.{}", user_id, ext);
        if let Ok(bytes) = state.storage.get(&path).await {
            return Ok(Response::builder()
                .header(header::CONTENT_TYPE, mime)
                .header(header::CACHE_CONTROL, "private, max-age=60")
                .body(Body::from(bytes))
                .unwrap());
        }
    }
    Err(AppError::NotFound("Image originale introuvable".into()))
}

/// POST /api/v1/linked-account/login
/// Proxifie un login vers une instance Kubuno distante (contourne CORS).
pub async fn linked_account_login(
    Json(body): Json<serde_json::Value>,
) -> Result<Json<serde_json::Value>, AppError> {
    let instance_url = body
        .get("instance_url")
        .and_then(|v| v.as_str())
        .ok_or_else(|| AppError::Validation("instance_url requis".into()))?
        .trim_end_matches('/')
        .to_owned();

    // Basic URL sanity check — must start with http:// or https://
    if !instance_url.starts_with("http://") && !instance_url.starts_with("https://") {
        return Err(AppError::Validation("URL invalide".into()));
    }

    let login_url = format!("{instance_url}/api/v1/auth/login");

    let payload = serde_json::json!({
        "login":   body.get("email").and_then(|v| v.as_str()).unwrap_or(""),
        "password": body.get("password").and_then(|v| v.as_str()).unwrap_or(""),
    });

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(15))
        .build()
        .map_err(|e| AppError::Internal(anyhow::anyhow!("HTTP client : {e}")))?;

    let resp = client
        .post(&login_url)
        .json(&payload)
        .send()
        .await
        .map_err(|e| AppError::Validation(format!("Impossible de joindre l'instance : {e}")))?;

    let status = resp.status();
    let json: serde_json::Value = resp
        .json()
        .await
        .map_err(|e| AppError::Internal(anyhow::anyhow!("Réponse invalide : {e}")))?;

    if status == reqwest::StatusCode::UNAUTHORIZED || status == reqwest::StatusCode::UNPROCESSABLE_ENTITY {
        return Err(AppError::Validation("Identifiants incorrects".into()));
    }
    if !status.is_success() {
        return Err(AppError::Validation(format!("Erreur {status} de l'instance distante")));
    }

    Ok(Json(json))
}

// ── The directory, as a MODULE sees it ───────────────────────────────────────
//
// A module that has to attach one of its objects to a person — a mailbox to its
// owner, a resource to its manager — needs to name that person and to check the
// name still exists. It cannot read `core.users`: a module owns its own schema
// and nothing else, which is the rule that keeps a module from becoming a second
// place where accounts are defined.
//
// The public directory route cannot serve it either: it resolves the sharing
// policy for its CALLER, and a module has no caller — the proxy strips
// `Authorization` before a module is reached, precisely so a module can never
// borrow a user's authority.
//
// Hence these two, guarded by `InternalRequest` (there is no layer on
// `/internal`; the guard is per handler). They answer the same projection the
// people pickers get — `DIRECTORY_COLUMNS`, never a list typed here, so a
// personal column added to `core.users` cannot leak through this door either.
// The sharing policy is deliberately NOT applied: it narrows what one person may
// see of another, and an administrator configuring an instance-wide object is
// not browsing the staff directory.

#[derive(Deserialize)]
pub struct InternalDirectoryQuery {
    q:     Option<String>,
    limit: Option<i64>,
}

/// Active accounts, for a module building an owner picker.
pub async fn internal_list_users(
    State(state): State<AppState>,
    _internal: InternalRequest,
    Query(q): Query<InternalDirectoryQuery>,
) -> Result<Json<serde_json::Value>, AppError> {
    let limit = q.limit.unwrap_or(50).clamp(1, 200);
    let query = q.q.as_deref().unwrap_or("").trim().to_string();

    let sql = format!(
        r#"SELECT {DIRECTORY_COLUMNS}
           FROM core.users
           WHERE is_active = TRUE
             AND ($1 = '' OR username ILIKE '%' || $1 || '%'
                          OR display_name ILIKE '%' || $1 || '%'
                          OR email::text ILIKE '%' || $1 || '%')
           ORDER BY display_name ASC NULLS LAST
           LIMIT $2"#
    );

    let rows = sqlx::query_as::<_, (uuid::Uuid, String, Option<String>, Option<String>, String)>(&sql)
        .bind(&query)
        .bind(limit)
        .fetch_all(&state.db)
        .await
        .map_err(|e| {
            tracing::error!(error = %e, "annuaire interne : lecture impossible");
            AppError::Database(e)
        })?;

    Ok(Json(json!({ "users": rows.into_iter().map(directory_entry).collect::<Vec<_>>() })))
}

/// One account by id — what a module calls to check that an owner it stored is
/// still there. `404` when it is not, so "unknown" and "the database is down"
/// can never be confused for one another.
pub async fn internal_get_user(
    State(state): State<AppState>,
    _internal: InternalRequest,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let sql = format!("SELECT {DIRECTORY_COLUMNS} FROM core.users WHERE id = $1 AND is_active = TRUE");

    let row = sqlx::query_as::<_, (uuid::Uuid, String, Option<String>, Option<String>, String)>(&sql)
        .bind(id)
        .fetch_optional(&state.db)
        .await
        .map_err(|e| {
            tracing::error!(error = %e, %id, "annuaire interne : lecture d'un compte impossible");
            AppError::Database(e)
        })?
        .ok_or_else(|| AppError::NotFound("Compte introuvable".into()))?;

    Ok(Json(directory_entry(row)))
}

/// The groups one account belongs to, in READ ONLY — for a module that gates
/// access on group membership (e.g. the forum's per-group forum permissions).
/// Same trust model as the rest of `/internal/directory/*`: the internal secret
/// proves the caller is inside the instance; no module is named. Only the group
/// id and name are disclosed, never the group's `permissions` policy.
pub async fn internal_user_groups(
    State(state): State<AppState>,
    _internal: InternalRequest,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let rows = sqlx::query_as::<_, (uuid::Uuid, String)>(
        r#"SELECT g.id, g.name
             FROM core.user_group_members m
             JOIN core.user_groups g ON g.id = m.group_id
            WHERE m.user_id = $1
            ORDER BY g.name"#,
    )
    .bind(id)
    .fetch_all(&state.db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, %id, "annuaire interne : groupes d'un compte impossibles à lire");
        AppError::Database(e)
    })?;

    Ok(Json(json!({
        "groups": rows.into_iter().map(|(id, name)| json!({ "id": id, "name": name })).collect::<Vec<_>>()
    })))
}

/// Every group of the instance (id + name only), READ ONLY — so a module can
/// let an administrator pick which groups a per-group rule applies to.
pub async fn internal_list_groups(
    State(state): State<AppState>,
    _internal: InternalRequest,
) -> Result<Json<serde_json::Value>, AppError> {
    let rows = sqlx::query_as::<_, (uuid::Uuid, String)>(
        "SELECT id, name FROM core.user_groups ORDER BY name",
    )
    .fetch_all(&state.db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, "annuaire interne : liste des groupes impossible à lire");
        AppError::Database(e)
    })?;

    Ok(Json(json!({
        "groups": rows.into_iter().map(|(id, name)| json!({ "id": id, "name": name })).collect::<Vec<_>>()
    })))
}

/// Columns the mail provisioning reads. NOT `DIRECTORY_COLUMNS`: the directory
/// and every people picker must keep answering `display_name`, username and
/// photo, and adding the structured names there would disclose them everywhere.
/// This list exists so provisioning — and provisioning alone — can read them.
const PROVISIONING_COLUMNS: &str = "id, username, display_name, first_name, last_name";

type ProvisioningRow = (uuid::Uuid, String, Option<String>, Option<String>, Option<String>);

fn provisioning_entry(
    (id, username, display_name, first_name, last_name): ProvisioningRow,
) -> serde_json::Value {
    json!({
        "id":           id,
        "username":     username,
        "display_name": display_name,
        "first_name":   first_name,
        "last_name":    last_name,
    })
}

/// `GET /internal/mail/provisioning/users` — every active account, with the name
/// parts the mail module builds an address from.
///
/// Its own endpoint rather than a field on the directory read: the directory is
/// a privacy surface that answers name/username/photo, and structured names are
/// exactly what it must not start leaking. Internal-only, like every route under
/// `/internal`.
pub async fn internal_provisioning_users(
    State(state): State<AppState>,
    _internal: InternalRequest,
) -> Result<Json<serde_json::Value>, AppError> {
    let sql = format!(
        "SELECT {PROVISIONING_COLUMNS} FROM core.users           WHERE is_active = TRUE ORDER BY created_at ASC"
    );
    let rows = sqlx::query_as::<_, ProvisioningRow>(&sql)
        .fetch_all(&state.db)
        .await
        .map_err(|e| {
            tracing::error!(error = %e, "provisioning mail : liste des comptes impossible");
            AppError::Database(e)
        })?;
    Ok(Json(json!({ "users": rows.into_iter().map(provisioning_entry).collect::<Vec<_>>() })))
}

/// `GET /internal/mail/provisioning/users/:id` — one account, same shape.
pub async fn internal_provisioning_user(
    State(state): State<AppState>,
    _internal: InternalRequest,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let sql = format!(
        "SELECT {PROVISIONING_COLUMNS} FROM core.users WHERE id = $1 AND is_active = TRUE"
    );
    let row = sqlx::query_as::<_, ProvisioningRow>(&sql)
        .bind(id)
        .fetch_optional(&state.db)
        .await
        .map_err(|e| {
            tracing::error!(error = %e, %id, "provisioning mail : lecture d'un compte impossible");
            AppError::Database(e)
        })?
        .ok_or_else(|| AppError::NotFound("Compte introuvable".into()))?;
    Ok(Json(provisioning_entry(row)))
}

/// The one shape both routes answer. Shared so the two can never drift apart.
fn directory_entry(
    (id, username, display_name, avatar_url, email): (uuid::Uuid, String, Option<String>, Option<String>, String),
) -> serde_json::Value {
    let shown = display_name.unwrap_or_else(|| username.clone());
    json!({
        "id":           id,
        "username":     username,
        "display_name": shown,
        "avatar_url":   avatar_url,
        "email":        email,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    /// The columns that must never appear in [`DIRECTORY_COLUMNS`].
    const NEVER_IN_DIRECTORY: [&str; 2] = ["gender", "birthday"];

    /// The regression this guards against is silent and wide: adding a column to
    /// `core.users` and "helpfully" extending the directory projection would put
    /// a personal datum into every people picker of every module at once, with
    /// no error anywhere.
    #[test]
    fn the_directory_projection_never_carries_a_personal_field() {
        for column in NEVER_IN_DIRECTORY {
            assert!(
                !DIRECTORY_COLUMNS.contains(column),
                "{column} ne doit jamais figurer dans la projection de l'annuaire"
            );
        }
    }

    /// The five columns both routes destructure into a tuple. A sixth one added
    /// to the constant without changing the tuple type would fail at runtime, on
    /// a route every module calls; this fails at `cargo test` instead.
    #[test]
    fn the_directory_projection_matches_the_tuple_it_is_decoded_into() {
        assert_eq!(DIRECTORY_COLUMNS.split(',').count(), 5);
    }
}
