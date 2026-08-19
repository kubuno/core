//! Sign in (`POST /auth/login`) and sign out (`POST /auth/logout`).

use crate::{
    audit::{login_context, redact::target, AuditEntry},
    auth::{client_ip::ClientIp, jwt::JwtService},
    crypto::{password, token},
    errors::AppError,
    models::session::{LoginDto, NativeTokenResponse},
    state::AppState,
};
use axum::{
    extract::State,
    http::{header, HeaderMap, StatusCode},
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;

use serde::Deserialize;

use super::tokens::{
    clear_slot_cookie, issue_full_tokens, read_slot_cookie, refresh_cookie, MAX_ACCOUNT_SLOTS,
};

#[utoipa::path(
    post,
    path = "/api/v1/auth/login",
    tag = "auth",
    request_body = LoginDto,
    responses(
        (status = 200, description = "Authentifié. Pour client_type 'native'/'desktop' le corps est un NativeTokenResponse ; sinon LoginResponse + cookie HttpOnly refresh_token.", body = NativeTokenResponse),
        (status = 422, description = "Identifiants invalides")
    )
)]
pub async fn login(
    State(state): State<AppState>,
    client_ip: ClientIp,
    headers: HeaderMap,
    Json(dto): Json<LoginDto>,
) -> Result<Response, AppError> {
    let user_opt = sqlx::query_as::<_, crate::models::user::User>(
        "SELECT * FROM core.users WHERE (email = $1 OR username = $1) AND is_active = TRUE",
    )
    .bind(&dto.login)
    .fetch_optional(&state.db)
    .await?;

    // Toujours exécuter un calcul argon2 pour éviter le timing attack sur les emails inexistants
    let dummy_hash = "$argon2id$v=19$m=19456,t=2,p=1$c29tZXNhbHQ$RdescudvJCsgt3ub+b+dWRWJTmaasfvMkQ96Cjbu2I0";
    let hash_to_check = user_opt
        .as_ref()
        .and_then(|u| u.password_hash.as_deref())
        .unwrap_or(dummy_hash);

    let ok = password::verify_password(&dto.password, hash_to_check)
        .map_err(AppError::Internal)?;

    // Même message dans tous les cas (pas d'énumération email/mot de passe)
    let invalid = || AppError::Validation("Identifiants invalides".into());

    // Failed sign-ins are audited for administrator accounts only: they are the
    // ones whose compromise matters, and recording every miss on every unknown
    // login would let a stranger fill the table at will. The response is
    // identical either way, so this cannot be used to enumerate accounts.
    if let Some(candidate) = user_opt.as_ref() {
        if candidate.role == "admin" && (!ok || candidate.password_hash.is_none()) {
            let ctx = login_context(&headers, client_ip, candidate);
            ctx.record(
                &state.db,
                AuditEntry::new("core.auth.login_failed")
                    .module("core")
                    .target(target::USER, candidate.id, candidate.username.clone())
                    .denied("bad_credentials"),
            )
            .await;
        }
    }

    // ── Which methods this account may use ───────────────────────────────────
    //
    // An administrator's decision, resolved per organisational unit
    // (`crate::auth::methods`). For a known account the chain runs
    // account → groups → unit and its ancestors → instance; for a login the
    // instance has never seen there is no unit to resolve from, so the instance
    // value applies — and, crucially, the behaviour therefore does not depend on
    // whether the login exists. Nothing here is an enumeration oracle.
    let scope = match user_opt.as_ref() {
        Some(u) => crate::settings::SettingScope::user(u.id),
        None => crate::settings::SettingScope::INSTANCE,
    };
    let methods = crate::auth::methods::resolve(&state.db, &scope).await;
    let admin_fallback = crate::auth::methods::admin_fallback(&state.db, &scope).await;
    let route = crate::directory::auth::route_for(user_opt.as_ref(), methods, admin_fallback);

    if route.uses_directory() {
        match crate::directory::auth::authenticate(
            &state.db,
            &state.settings.auth.jwt_secret,
            &dto.login,
            &dto.password,
            route.only(),
        )
        .await
        {
            Ok(Some(found)) => {
                tracing::info!(
                    user_id = %found.user.id,
                    directory = %found.directory_slug,
                    provisioning = found.how.as_str(),
                    "Connexion par annuaire"
                );
                if found.user.role == "admin" {
                    let ctx = login_context(&headers, client_ip, &found.user);
                    ctx.record(
                        &state.db,
                        AuditEntry::new("core.auth.login")
                            .module("core")
                            .target(target::USER, found.user.id, found.user.username.clone())
                            .detail(format!("annuaire « {} »", found.directory_slug)),
                    )
                    .await;
                }
                // A directory sign-in still crosses the second factor when the
                // account carries one: the directory proves who you are, not
                // that you hold the token.
                if found.user.totp_enabled {
                    let totp_session = JwtService::generate_totp_session(
                        &state.settings.auth.jwt_secret,
                        found.user.id,
                    )?;
                    return Ok(Json(json!({ "requires_totp": true, "totp_session": totp_session })).into_response());
                }
                return issue_full_tokens(
                    &state,
                    &headers,
                    client_ip,
                    found.user,
                    dto.device_name.as_deref(),
                    dto.device_type.as_deref(),
                    dto.client_type.as_deref(),
                    crate::devices::AuthStrength::Password,
                    dto.slot,
                )
                .await;
            }
            // Same wording as every other failure: whether the directory refused
            // the bind, is unreachable, or knows nobody by that name, the person
            // at the form is told the same thing.
            Ok(None) => return Err(invalid()),
            Err(e) => {
                tracing::error!(error = %e, "Authentification par annuaire impossible");
                return Err(invalid());
            }
        }
    }

    let mut user = user_opt.ok_or_else(invalid)?;
    if !ok || user.password_hash.is_none() { return Err(invalid()); }

    // The account holds a hash and it matched — but the policy for its unit may
    // not accept a local password at all (and the administrative fallback may
    // not apply to it). Refused, with the same wording as every other failure:
    // somebody probing the form learns nothing about the account or its unit.
    if route != crate::directory::auth::PasswordRoute::Local {
        tracing::info!(
            user_id = %user.id,
            "Connexion refusée : le mot de passe local n'est pas une méthode acceptée pour cette unité"
        );
        return Err(invalid());
    }

    // ── The password policy, applied to a password that already exists ───────
    //
    // Two questions the policy asks here and nowhere else, because this is the
    // only moment at which the plaintext of an *existing* password is in hand:
    // has it aged out (`security.password_expiry_days`), and does it still
    // satisfy a policy that may have been tightened since it was chosen
    // (`security.password_enforce_at_login`). Both answer by arming
    // `must_change_password`, which `auth::middleware` already turns into a
    // closed door for every write and `App.tsx` into the forced-change screen.
    //
    // Deliberately BEFORE the second-factor branch: an account that carries a
    // second factor must be flagged too, and the TOTP step returns early.
    //
    // The sign-in itself is never refused on this basis. Locking somebody out
    // of the only screen that lets them fix their password is not a policy, it
    // is an outage — and a refusal here would also tell a stranger that the
    // password they typed was correct but stale.
    let policy =
        crate::settings::password_policy::PasswordPolicy::for_user(&state.db, user.id).await?;
    let expired = policy.is_expired(user.password_changed_at);
    let off_policy = policy.enforce_at_login && policy.check(&dto.password).is_err();
    if (expired || off_policy) && !user.must_change_password {
        // Failure to persist the flag must not cost the person their sign-in:
        // it is logged, and the next sign-in evaluates the same two questions
        // again and gets another chance to record the answer.
        match sqlx::query(
            "UPDATE core.users SET must_change_password = TRUE WHERE id = $1 \
               AND NOT must_change_password",
        )
        .bind(user.id)
        .execute(&state.db)
        .await
        {
            Ok(_) => {
                user.must_change_password = true;
                tracing::info!(
                    user_id = %user.id,
                    reason = if expired { "expiration" } else { "politique" },
                    "Changement de mot de passe imposé à la connexion"
                );
            }
            Err(e) => {
                tracing::error!(
                    error = %e,
                    user_id = %user.id,
                    "login: impossible d'imposer le changement de mot de passe"
                );
            }
        }
    }

    // Si la 2FA est activée : émettre un jeton de session TOTP et interrompre.
    if user.totp_enabled {
        let totp_session = JwtService::generate_totp_session(
            &state.settings.auth.jwt_secret, user.id,
        )?;
        return Ok(Json(json!({ "requires_totp": true, "totp_session": totp_session })).into_response());
    }

    if user.role == "admin" {
        let ctx = login_context(&headers, client_ip, &user);
        ctx.record(
            &state.db,
            AuditEntry::new("core.auth.login")
                .module("core")
                .target(target::USER, user.id, user.username.clone()),
        )
        .await;
    }

    issue_full_tokens(
        &state,
        &headers,
        client_ip,
        user,
        dto.device_name.as_deref(),
        dto.device_type.as_deref(),
        dto.client_type.as_deref(),
        // A password and nothing else: the session list says so, so an operator
        // can tell at a glance which live sessions never passed a second factor.
        crate::devices::AuthStrength::Password,
        dto.slot,
    )
    .await
}

/// Sign-out request. Everything optional: an empty body signs the ACTIVE
/// session out (web cookie), `refresh_token` serves native clients, `slot`
/// removes ONE parked account without touching the active session, and
/// `all: true` closes every account of this browser (Google's « Se déconnecter
/// de tous les comptes »).
#[derive(Debug, Default, Deserialize, utoipa::ToSchema)]
pub struct LogoutRequest {
    pub refresh_token: Option<String>,
    #[serde(default)]
    pub slot: Option<u8>,
    #[serde(default)]
    pub all: bool,
}

/// Revokes the session behind one raw refresh token and closes its step-up
/// (reauth) window — a proof must not outlive the session it was granted in.
async fn revoke_session(state: &AppState, refresh_raw: &str) {
    let refresh_hash = token::hash_token(refresh_raw);
    let owner: Option<uuid::Uuid> = match sqlx::query_scalar(
        "UPDATE core.refresh_tokens SET revoked_at = NOW(), revoke_reason = 'logout'
         WHERE token_hash = $1 AND revoked_at IS NULL
         RETURNING user_id",
    )
    .bind(&refresh_hash)
    .fetch_optional(&state.db)
    .await
    {
        Ok(o) => o,
        Err(e) => {
            tracing::error!(error = %e, "logout: révocation du refresh token");
            None
        }
    };
    if let Some(user_id) = owner {
        crate::auth::reauth::store::revoke_all(&state.db, user_id).await;
    }
}

#[utoipa::path(
    post,
    path = "/api/v1/auth/logout",
    tag = "auth",
    request_body(content = LogoutRequest, description = "Optionnel — refresh_token (natif), slot (retirer UN compte), all (tous les comptes)."),
    responses((status = 200, description = "Session(s) révoquée(s)"))
)]
pub async fn logout(
    State(state): State<AppState>,
    headers: HeaderMap,
    body: axum::body::Bytes,
) -> Result<Response, AppError> {
    let req: LogoutRequest = if body.is_empty() {
        LogoutRequest::default()
    } else {
        serde_json::from_slice(&body).unwrap_or_default()
    };
    let active_raw = refresh_cookie(&headers);
    let mut cookies_to_clear: Vec<String> = Vec::new();

    if req.all {
        // Every account of this browser: the active session plus each slot.
        if let Some(raw) = active_raw.as_deref() {
            revoke_session(&state, raw).await;
        }
        cookies_to_clear
            .push("refresh_token=; HttpOnly; Path=/api/v1/auth; SameSite=Strict; Max-Age=0".into());
        for slot in 0..MAX_ACCOUNT_SLOTS {
            if let Some(raw) = read_slot_cookie(&headers, slot) {
                if Some(raw.as_str()) != active_raw.as_deref() {
                    revoke_session(&state, &raw).await;
                }
                cookies_to_clear.push(clear_slot_cookie(slot));
            }
        }
    } else if let Some(slot) = req.slot {
        // Remove ONE parked account. The active session survives — unless the
        // removed slot IS the active account.
        if slot >= MAX_ACCOUNT_SLOTS {
            return Err(AppError::Validation("Emplacement de compte invalide".into()));
        }
        if let Some(raw) = read_slot_cookie(&headers, slot) {
            revoke_session(&state, &raw).await;
            cookies_to_clear.push(clear_slot_cookie(slot));
            if Some(raw.as_str()) == active_raw.as_deref() {
                cookies_to_clear.push(
                    "refresh_token=; HttpOnly; Path=/api/v1/auth; SameSite=Strict; Max-Age=0".into(),
                );
            }
        }
    } else {
        // Active session only (legacy behaviour): revoke it and clear both the
        // active cookie and the slot cookie mirroring the same token.
        if let Some(raw) = req.refresh_token.as_deref().or(active_raw.as_deref()) {
            revoke_session(&state, raw).await;
        }
        cookies_to_clear
            .push("refresh_token=; HttpOnly; Path=/api/v1/auth; SameSite=Strict; Max-Age=0".into());
        if let Some(active) = active_raw.as_deref() {
            for slot in 0..MAX_ACCOUNT_SLOTS {
                if read_slot_cookie(&headers, slot).as_deref() == Some(active) {
                    cookies_to_clear.push(clear_slot_cookie(slot));
                }
            }
        }
    }

    let mut response =
        (StatusCode::OK, Json(json!({ "message": "Déconnecté" }))).into_response();
    for cookie in cookies_to_clear {
        if let Ok(value) = header::HeaderValue::from_str(&cookie) {
            response.headers_mut().append(header::SET_COOKIE, value);
        }
    }
    Ok(response)
}
