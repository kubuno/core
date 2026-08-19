//! Refresh token issuance after a full authentication, plus the small helpers
//! shared by the sign-in / sign-out / rotation handlers.

use crate::{
    auth::{client_ip::ClientIp, jwt::JwtService},
    devices::{self, correlate, model::AuthStrength},
    errors::AppError,
    models::session::{LoginResponse, NativeTokenResponse},
    state::AppState,
};
use axum::{
    http::{header, HeaderMap, StatusCode},
    response::{IntoResponse, Response},
    Json,
};
use chrono::Utc;
use serde::Deserialize;

/// Émet le couple access_token / refresh_token après authentification complète.
///
/// `client_type` = 'native' | 'desktop' renvoie le refresh token dans le corps
/// JSON (sans cookie) ; toute autre valeur conserve le cookie HttpOnly du web.
///
/// This is also where a session joins the device inventory
/// ([`crate::devices`]): the request is correlated to a device row, the row is
/// refreshed with what the request observed, and the freshly issued session
/// points at it. Doing it here rather than in each sign-in handler is what makes
/// password, 2FA and backup-code sign-ins land in the same inventory — three
/// call sites, one correlation.
// Eight parameters because signing in genuinely depends on eight distinct
// things, and the alternative — a context struct — would be assembled at three
// call sites and taken apart here, hiding which of them actually vary.
#[allow(clippy::too_many_arguments)]
pub(super) async fn issue_full_tokens(
    state: &AppState,
    headers: &HeaderMap,
    client_ip: ClientIp,
    user: crate::models::user::User,
    device_name: Option<&str>,
    device_type: Option<&str>,
    client_type: Option<&str>,
    auth_strength: AuthStrength,
    requested_slot: Option<u8>,
) -> Result<Response, AppError> {
    // Durées de session lues à chaud depuis core.settings (configurables en admin)
    let ttls = crate::config::runtime::security_ttls(&state.db, &state.settings).await;

    let jwt = JwtService::new(
        state.settings.auth.jwt_secret.clone(),
        ttls.access_ttl,
    );
    let access_token = jwt.generate_access_token(&user)?;
    let (refresh_raw, refresh_hash) = JwtService::generate_refresh_token();

    // Resolved by the ClientIp extractor: forwarding headers are honoured only
    // behind a trusted proxy, so a forged header cannot poison the session
    // record. NULL when the address could not be established.
    let ip_owned = client_ip.to_inet_string();
    let ip: Option<&str> = ip_owned.as_deref();
    let ua = headers
        .get("user-agent")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("");

    let expires_at = Utc::now() + ttls.refresh_ttl;
    // New login = root of a fresh rotation family.
    let family_id = uuid::Uuid::new_v4();
    let is_native = matches!(client_type, Some("native") | Some("desktop"));
    let stored_client_type = client_type.unwrap_or("web");

    // ── Device inventory ─────────────────────────────────────────────────────
    // Correlation first: a device blocked by an operator must be refused before
    // a session row exists for it, not after.
    let normalised = devices::normalise(ua);
    let cookies = headers.get(header::COOKIE).and_then(|v| v.to_str().ok());
    let device_header = headers
        .get(correlate::DEVICE_HEADER)
        .and_then(|v| v.to_str().ok());
    let key = correlate::resolve(
        device_header,
        cookies,
        user.id,
        stored_client_type,
        &normalised,
        // Only a browser can be handed a cookie; a native client carries its own
        // key, and an API client gets the fingerprint fallback.
        !is_native,
    );
    let country = client_ip.0.and_then(devices::geoip::lookup);
    let touched = devices::correlate::upsert(
        &state.db,
        user.id,
        &key,
        &normalised,
        ua,
        stored_client_type,
        ip,
        country.as_deref(),
    )
    .await?;

    if touched.approval == crate::devices::Approval::Blocked.as_str()
        && devices::declared::block_denies_refresh(&state.db).await
    {
        tracing::warn!(user_id = %user.id, device_id = %touched.device_id, "Connexion refusée : appareil bloqué");
        return Err(AppError::Forbidden);
    }

    sqlx::query(
        r#"INSERT INTO core.refresh_tokens
           (user_id, token_hash, device_name, device_type, ip_address, user_agent,
            expires_at, family_id, client_type, device_id, country, auth_strength)
           VALUES ($1, $2, $3, $4, $5::inet, $6, $7, $8, $9, $10, $11, $12)"#,
    )
    .bind(user.id)
    .bind(&refresh_hash)
    // A device name the client supplied is a hint, not an identity: the
    // inventory's own label is what the console shows.
    .bind(device_name)
    .bind(device_type)
    .bind(ip)
    .bind(ua)
    .bind(expires_at)
    .bind(family_id)
    .bind(stored_client_type)
    .bind(touched.device_id)
    .bind(country.as_deref())
    .bind(auth_strength.as_str())
    .execute(&state.db)
    .await?;

    correlate::record_event(
        &state.db,
        touched.device_id,
        crate::devices::event_kind::SESSION_OPENED,
        ip,
        country.as_deref(),
        Some(user.id),
        None,
        Some(auth_strength.as_str()),
    )
    .await;

    // Limiter le nombre de sessions simultanées (révoque les plus anciennes)
    crate::config::runtime::enforce_max_sessions(&state.db, user.id, ttls.max_sessions).await;

    sqlx::query("UPDATE core.users SET last_login_at = NOW() WHERE id = $1")
        .bind(user.id)
        .execute(&state.db)
        .await?;

    // Native/desktop: refresh token in the JSON body, no cookie.
    if is_native {
        return Ok(Json(NativeTokenResponse {
            access_token,
            refresh_token: refresh_raw,
            refresh_expires_at: expires_at,
            user,
        })
        .into_response());
    }

    // ── Multi-account slot (Google-style) ────────────────────────────────────
    // Besides the active-session cookie, the refresh token is mirrored into a
    // per-account `kb_account_<slot>` cookie: the browser's cookie jar IS the
    // roster of signed-in accounts (`GET /auth/accounts` enumerates it,
    // `POST /auth/switch` re-points `refresh_token` at another slot). Web
    // tokens never rotate, so the mirror cannot drift from the active cookie.
    let slot = resolve_account_slot(state, headers, user.id, requested_slot).await?;
    // A previous session parked in this slot (re-connecting the same account,
    // or a dead row being overwritten) must not linger as an orphan.
    if let Some(previous_raw) = read_slot_cookie(headers, slot) {
        if previous_raw != refresh_raw {
            let previous_hash = crate::crypto::token::hash_token(&previous_raw);
            if let Err(e) = sqlx::query(
                "UPDATE core.refresh_tokens SET revoked_at = NOW(), revoke_reason = 'relogin'
                 WHERE token_hash = $1 AND user_id = $2 AND revoked_at IS NULL",
            )
            .bind(&previous_hash)
            .bind(user.id)
            .execute(&state.db)
            .await
            {
                tracing::error!(error = %e, "login: révocation de l'ancienne session du slot");
            }
        }
    }

    let secure_flag = state.settings.server.secure_cookies;
    let secure = if secure_flag { "; Secure" } else { "" };
    let cookie = format!(
        "refresh_token={refresh_raw}; HttpOnly{secure}; Path=/api/v1/auth; SameSite=Strict; Max-Age={}",
        ttls.refresh_ttl.as_secs()
    );
    let slot_cookie = format!(
        "{}={refresh_raw}; HttpOnly{secure}; Path=/api/v1/auth; SameSite=Strict; Max-Age={}",
        slot_cookie_name(slot),
        ttls.refresh_ttl.as_secs()
    );

    let mut response = (
        StatusCode::OK,
        [(header::SET_COOKIE, cookie)],
        Json(LoginResponse { access_token, user, slot: Some(slot) }),
    )
        .into_response();
    // APPEND, not a second tuple entry: the header-array IntoResponse inserts
    // by name, so a duplicated SET_COOKIE key would keep only the last one.
    if let Ok(value) = header::HeaderValue::from_str(&slot_cookie) {
        response.headers_mut().append(header::SET_COOKIE, value);
    }

    // A minted correlation cookie rides on the same response. Without it the
    // next sign-in falls back to the fingerprint and the same browser appears
    // twice in the inventory.
    if let Some(minted) = key.mint.as_deref() {
        if let Ok(value) = header::HeaderValue::from_str(&correlate::mint_cookie(minted, secure_flag))
        {
            response.headers_mut().append(header::SET_COOKIE, value);
        }
    }

    Ok(response)
}

/// Corps optionnel pour les clients natifs : le refresh token est transmis en
/// JSON (les navigateurs continuent d'utiliser le cookie HttpOnly).
#[derive(Deserialize, utoipa::ToSchema)]
pub struct RefreshRequest {
    pub refresh_token: String,
}

/// Extrait la valeur du cookie `refresh_token`.
pub(super) fn refresh_cookie(headers: &HeaderMap) -> Option<String> {
    headers
        .get("cookie")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("")
        .split(';')
        .find_map(|part| part.trim().strip_prefix("refresh_token=").map(str::to_string))
}

// ── Multi-account slots ──────────────────────────────────────────────────────

/// Ten simultaneous accounts per browser, like Google.
pub(super) const MAX_ACCOUNT_SLOTS: u8 = 10;

/// Cookie holding the refresh token of the account parked in `slot`.
pub(super) fn slot_cookie_name(slot: u8) -> String {
    format!("kb_account_{slot}")
}

/// Value of the `kb_account_<slot>` cookie, if that slot is occupied.
pub(super) fn read_slot_cookie(headers: &HeaderMap, slot: u8) -> Option<String> {
    let name = slot_cookie_name(slot);
    headers
        .get("cookie")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("")
        .split(';')
        .find_map(|part| {
            part.trim()
                .strip_prefix(name.as_str())
                .and_then(|rest| rest.strip_prefix('='))
                .map(str::to_string)
        })
}

/// A `Set-Cookie` clearing the slot's cookie.
pub(super) fn clear_slot_cookie(slot: u8) -> String {
    format!(
        "{}=; HttpOnly; Path=/api/v1/auth; SameSite=Strict; Max-Age=0",
        slot_cookie_name(slot)
    )
}

/// Which slot a fresh web sign-in should occupy: the slot explicitly requested
/// (re-connecting an account row from the panel), else the slot already holding
/// a LIVE session of the same user (signing in twice must not duplicate the
/// account), else the first slot that is empty or holds a dead session.
async fn resolve_account_slot(
    state: &AppState,
    headers: &HeaderMap,
    user_id: uuid::Uuid,
    requested: Option<u8>,
) -> Result<u8, AppError> {
    if let Some(slot) = requested {
        if slot >= MAX_ACCOUNT_SLOTS {
            return Err(AppError::Validation("Emplacement de compte invalide".into()));
        }
        return Ok(slot);
    }
    let mut first_free: Option<u8> = None;
    for slot in 0..MAX_ACCOUNT_SLOTS {
        match read_slot_cookie(headers, slot) {
            None => {
                if first_free.is_none() {
                    first_free = Some(slot);
                }
            }
            Some(raw) => {
                let hash = crate::crypto::token::hash_token(&raw);
                let row: Option<(uuid::Uuid, bool)> = sqlx::query_as(
                    "SELECT user_id, (revoked_at IS NULL AND expires_at > NOW())
                     FROM core.refresh_tokens WHERE token_hash = $1",
                )
                .bind(&hash)
                .fetch_optional(&state.db)
                .await
                .map_err(|e| {
                    tracing::error!(error = %e, "login: résolution du slot de compte");
                    AppError::Database(e)
                })?;
                match row {
                    // This browser already holds a live session of this very
                    // account → same slot (the old token gets revoked upstream).
                    Some((uid, true)) if uid == user_id => return Ok(slot),
                    // Live session of ANOTHER account → occupied.
                    Some((_, true)) => {}
                    // Dead or unknown token → reusable.
                    _ => {
                        if first_free.is_none() {
                            first_free = Some(slot);
                        }
                    }
                }
            }
        }
    }
    first_free.ok_or_else(|| {
        AppError::Validation(format!(
            "Nombre maximal de comptes simultanés atteint ({MAX_ACCOUNT_SLOTS})"
        ))
    })
}
