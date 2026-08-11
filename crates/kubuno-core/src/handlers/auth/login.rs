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

use super::tokens::{issue_full_tokens, refresh_cookie, RefreshRequest};

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

    let user = user_opt.ok_or_else(invalid)?;
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
    )
    .await
}

#[utoipa::path(
    post,
    path = "/api/v1/auth/logout",
    tag = "auth",
    request_body(content = RefreshRequest, description = "Optionnel — clients natifs. Le web envoie le refresh via cookie."),
    responses((status = 200, description = "Session révoquée"))
)]
pub async fn logout(
    State(state): State<AppState>,
    headers: HeaderMap,
    body: axum::body::Bytes,
) -> Result<Response, AppError> {
    // Refresh à révoquer : corps JSON (natif) ou cookie (web).
    let body_token: Option<String> = if body.is_empty() {
        None
    } else {
        serde_json::from_slice::<RefreshRequest>(&body)
            .ok()
            .map(|r| r.refresh_token)
    };

    if let Some(refresh_raw) = body_token.or_else(|| refresh_cookie(&headers)) {
        let refresh_hash = token::hash_token(&refresh_raw);
        let owner: Option<uuid::Uuid> = sqlx::query_scalar(
            "UPDATE core.refresh_tokens SET revoked_at = NOW(), revoke_reason = 'logout'
             WHERE token_hash = $1 AND revoked_at IS NULL
             RETURNING user_id",
        )
        .bind(&refresh_hash)
        .fetch_optional(&state.db)
        .await
        .map_err(|e| { tracing::error!(error = %e, "logout: révocation du refresh token"); AppError::Database(e) })?;

        // A step-up proof must not outlive the session it was granted in: leaving
        // the grace window open after a sign-out would let the next person at the
        // machine walk straight into a sensitive action.
        if let Some(user_id) = owner {
            crate::auth::reauth::store::revoke_all(&state.db, user_id).await;
        }
    }

    let clear_cookie = "refresh_token=; HttpOnly; Path=/api/v1/auth; SameSite=Strict; Max-Age=0";
    Ok((
        StatusCode::OK,
        [(header::SET_COOKIE, clear_cookie)],
        Json(json!({ "message": "Déconnecté" })),
    )
        .into_response())
}
