use crate::{
    auth::{
        jwt::JwtService,
        oauth::{keycloak_auth_url, keycloak_exchange_code, keycloak_userinfo, OAuthPkce},
        totp as totp_auth,
    },
    crypto::{password, token},
    errors::AppError,
    models::{
        session::{LoginDto, LoginResponse},
        user::CreateUserDto,
    },
    state::AppState,
};
use axum::{
    extract::{Query, State},
    http::{header, HeaderMap, StatusCode},
    response::{IntoResponse, Redirect, Response},
    Json,
};
use chrono::Utc;
use serde::Deserialize;
use serde_json::json;
use validator::Validate;

pub async fn register(
    State(state): State<AppState>,
    Json(dto): Json<CreateUserDto>,
) -> Result<impl IntoResponse, AppError> {
    dto.validate()
        .map_err(|e| AppError::Validation(e.to_string()))?;

    // Vérifier si inscription ouverte
    let open: bool = sqlx::query_scalar(
        "SELECT (value::text = 'true') FROM core.settings WHERE key = 'auth.registration_open'",
    )
    .fetch_optional(&state.db)
    .await?
    .unwrap_or(true);

    if !open {
        return Err(AppError::Forbidden);
    }

    // Vérifier unicité email + username (même message pour éviter l'énumération)
    let exists: bool = sqlx::query_scalar(
        "SELECT EXISTS(SELECT 1 FROM core.users WHERE email = $1 OR username = $2)",
    )
    .bind(&dto.email)
    .bind(&dto.username)
    .fetch_one(&state.db)
    .await?;

    if exists {
        return Err(AppError::Conflict("Email ou nom d'utilisateur déjà utilisé".into()));
    }

    let hash = password::hash_password(&dto.password)
        .map_err(|e| AppError::Internal(e))?;

    let user = sqlx::query_as::<_, crate::models::user::User>(
        r#"INSERT INTO core.users (email, username, password_hash, display_name)
           VALUES ($1, $2, $3, $4)
           RETURNING *"#,
    )
    .bind(&dto.email)
    .bind(&dto.username)
    .bind(&hash)
    .bind(dto.display_name.as_deref())
    .fetch_one(&state.db)
    .await?;

    // Ajouter l'utilisateur aux groupes par défaut
    let default_groups: Vec<uuid::Uuid> = sqlx::query_scalar(
        "SELECT id FROM core.user_groups WHERE is_default = TRUE",
    )
    .fetch_all(&state.db)
    .await
    .unwrap_or_default();

    for group_id in default_groups {
        let _ = sqlx::query(
            "INSERT INTO core.user_group_members (group_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        )
        .bind(group_id)
        .bind(user.id)
        .execute(&state.db)
        .await;
    }

    state.events.publish(crate::events::AppEvent::UserCreated {
        user_id: user.id,
        email: user.email.clone(),
    });

    Ok((StatusCode::CREATED, Json(json!({ "user": user }))))
}

pub async fn login(
    State(state): State<AppState>,
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
        .map_err(|e| AppError::Internal(e))?;

    // Même message dans tous les cas (pas d'énumération email/mot de passe)
    let invalid = || AppError::Validation("Identifiants invalides".into());
    let user = user_opt.ok_or_else(invalid)?;
    if !ok || user.password_hash.is_none() { return Err(invalid()); }

    // Si la 2FA est activée : émettre un jeton de session TOTP et interrompre.
    if user.totp_enabled {
        let totp_session = JwtService::generate_totp_session(
            &state.settings.auth.jwt_secret, user.id,
        )?;
        return Ok(Json(json!({ "requires_totp": true, "totp_session": totp_session })).into_response());
    }

    Ok(issue_full_tokens(&state, &headers, user, dto.device_name.as_deref(), dto.device_type.as_deref()).await?.into_response())
}

/// Émet le couple access_token / refresh_token après authentification complète.
async fn issue_full_tokens(
    state: &AppState,
    headers: &HeaderMap,
    user: crate::models::user::User,
    device_name: Option<&str>,
    device_type: Option<&str>,
) -> Result<impl IntoResponse, AppError> {
    // Durées de session lues à chaud depuis core.settings (configurables en admin)
    let ttls = crate::config::runtime::security_ttls(&state.db, &state.settings).await;

    let jwt = JwtService::new(
        state.settings.auth.jwt_secret.clone(),
        ttls.access_ttl,
    );
    let access_token = jwt.generate_access_token(&user)?;
    let (refresh_raw, refresh_hash) = JwtService::generate_refresh_token();

    let xff_owned = headers
        .get("x-forwarded-for")
        .and_then(|v| v.to_str().ok())
        .map(|v| v.split(',').next().unwrap_or(v).trim().to_string());
    let ip: Option<&str> = xff_owned.as_deref()
        .or_else(|| headers.get("x-real-ip").and_then(|v| v.to_str().ok()));
    let ua = headers
        .get("user-agent")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("");

    let expires_at = Utc::now() + ttls.refresh_ttl;

    sqlx::query(
        r#"INSERT INTO core.refresh_tokens
           (user_id, token_hash, device_name, device_type, ip_address, user_agent, expires_at)
           VALUES ($1, $2, $3, $4, $5::inet, $6, $7)"#,
    )
    .bind(user.id)
    .bind(&refresh_hash)
    .bind(device_name)
    .bind(device_type)
    .bind(ip)
    .bind(ua)
    .bind(expires_at)
    .execute(&state.db)
    .await?;

    // Limiter le nombre de sessions simultanées (révoque les plus anciennes)
    crate::config::runtime::enforce_max_sessions(&state.db, user.id, ttls.max_sessions).await;

    sqlx::query("UPDATE core.users SET last_login_at = NOW() WHERE id = $1")
        .bind(user.id)
        .execute(&state.db)
        .await?;

    let secure = if state.settings.server.secure_cookies { "; Secure" } else { "" };
    let cookie = format!(
        "refresh_token={refresh_raw}; HttpOnly{secure}; Path=/api/v1/auth; SameSite=Strict; Max-Age={}",
        ttls.refresh_ttl.as_secs()
    );

    Ok((
        StatusCode::OK,
        [(header::SET_COOKIE, cookie)],
        Json(LoginResponse { access_token, user }),
    ))
}

#[derive(Deserialize)]
pub struct TotpVerifyDto {
    pub code:         String,
    pub totp_session: String,
}

pub async fn totp_verify(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(dto): Json<TotpVerifyDto>,
) -> Result<Response, AppError> {
    let claims = JwtService::validate_totp_session(&state.settings.auth.jwt_secret, &dto.totp_session)
        .map_err(|_| AppError::Unauthorized)?;

    let user = sqlx::query_as::<_, crate::models::user::User>(
        "SELECT * FROM core.users WHERE id = $1 AND is_active = TRUE",
    )
    .bind(claims.sub)
    .fetch_optional(&state.db)
    .await?
    .ok_or(AppError::Unauthorized)?;

    let encrypted = user
        .totp_secret
        .as_deref()
        .ok_or_else(|| AppError::Validation("2FA non configurée".into()))?;

    let valid = totp_auth::verify_code(
        &state.settings.auth.jwt_secret, encrypted, &dto.code, &user.email,
    )
    .map_err(AppError::Internal)?;

    if !valid {
        return Err(AppError::Validation("Code incorrect".into()));
    }

    Ok(issue_full_tokens(&state, &headers, user, None, None).await?.into_response())
}

pub async fn refresh(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<impl IntoResponse, AppError> {
    let cookie_header = headers
        .get("cookie")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("");

    let refresh_raw = cookie_header
        .split(';')
        .find_map(|part| {
            let part = part.trim();
            part.strip_prefix("refresh_token=")
        })
        .ok_or(AppError::Unauthorized)?;

    let refresh_hash = token::hash_token(refresh_raw);

    let rt = sqlx::query_as::<_, crate::models::session::RefreshToken>(
        r#"SELECT id, user_id, token_hash, device_name, device_type,
                  host(ip_address)::text as ip_address, user_agent,
                  expires_at, created_at, last_used_at, revoked_at, revoke_reason
           FROM core.refresh_tokens
           WHERE token_hash = $1 AND revoked_at IS NULL AND expires_at > NOW()"#,
    )
    .bind(&refresh_hash)
    .fetch_optional(&state.db)
    .await?
    .ok_or(AppError::Unauthorized)?;

    let user = sqlx::query_as::<_, crate::models::user::User>(
        "SELECT * FROM core.users WHERE id = $1 AND is_active = TRUE",
    )
    .bind(rt.user_id)
    .fetch_optional(&state.db)
    .await?
    .ok_or(AppError::Unauthorized)?;

    let ttls = crate::config::runtime::security_ttls(&state.db, &state.settings).await;

    // Déconnexion par INACTIVITÉ : si le refresh token n'a pas servi depuis plus
    // que `idle_timeout`, on le révoque → l'utilisateur doit se reconnecter.
    if let Some(idle) = ttls.idle_timeout {
        let idle_chrono = chrono::Duration::from_std(idle).unwrap_or_else(|_| chrono::Duration::days(3650));
        if Utc::now() - rt.last_used_at > idle_chrono {
            sqlx::query("UPDATE core.refresh_tokens SET revoked_at = NOW(), revoke_reason = 'idle_timeout' WHERE id = $1")
                .bind(rt.id)
                .execute(&state.db)
                .await?;
            return Err(AppError::Unauthorized);
        }
    }

    // Mettre à jour last_used_at (activité)
    sqlx::query("UPDATE core.refresh_tokens SET last_used_at = NOW() WHERE id = $1")
        .bind(rt.id)
        .execute(&state.db)
        .await?;
    let jwt = JwtService::new(
        state.settings.auth.jwt_secret.clone(),
        ttls.access_ttl,
    );
    let access_token = jwt.generate_access_token(&user)?;

    Ok(Json(json!({ "access_token": access_token })))
}

pub async fn logout(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<impl IntoResponse, AppError> {
    let cookie_header = headers
        .get("cookie")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("");

    if let Some(refresh_raw) = cookie_header.split(';').find_map(|part| {
        let part = part.trim();
        part.strip_prefix("refresh_token=")
    }) {
        let refresh_hash = token::hash_token(refresh_raw);
        sqlx::query(
            "UPDATE core.refresh_tokens SET revoked_at = NOW(), revoke_reason = 'logout'
             WHERE token_hash = $1",
        )
        .bind(&refresh_hash)
        .execute(&state.db)
        .await?;
    }

    let clear_cookie = "refresh_token=; HttpOnly; Path=/api/v1/auth; SameSite=Strict; Max-Age=0";
    Ok((
        StatusCode::OK,
        [(header::SET_COOKIE, clear_cookie)],
        Json(json!({ "message": "Déconnecté" })),
    ))
}

#[derive(Deserialize)]
pub struct ForgotPasswordDto {
    pub email: String,
}

pub async fn forgot_password(
    State(state): State<AppState>,
    Json(dto): Json<ForgotPasswordDto>,
) -> impl IntoResponse {
    // Répondre identiquement quelle que soit l'existence de l'email (anti-énumération)
    let ok = Json(json!({ "message": "Si cet email existe, un lien de réinitialisation a été envoyé." }));

    let user: Option<(uuid::Uuid,)> = sqlx::query_as(
        "SELECT id FROM core.users WHERE email = $1 AND is_active = TRUE",
    )
    .bind(&dto.email)
    .fetch_optional(&state.db)
    .await
    .ok()
    .flatten();

    let Some((user_id,)) = user else { return ok; };

    let (_raw_token, token_hash) = token::generate_token();
    let expires_at = chrono::Utc::now() + chrono::Duration::hours(2);

    let inserted = sqlx::query(
        "INSERT INTO core.verification_tokens (user_id, token_hash, purpose, expires_at)
         VALUES ($1, $2, 'password_reset', $3)",
    )
    .bind(user_id)
    .bind(&token_hash)
    .bind(expires_at)
    .execute(&state.db)
    .await;

    if let Err(e) = inserted {
        tracing::error!(error = %e, "Impossible de créer le token de réinitialisation");
        return ok;
    }

    // TODO: envoyer le lien par email (raw_token est le secret à inclure dans l'URL).
    // Ne jamais logger le token brut — il a la même valeur qu'un mot de passe.
    tracing::info!(user_id = %user_id, "Token de réinitialisation de mot de passe créé");

    ok
}

#[derive(Deserialize, Validate)]
pub struct ResetPasswordDto {
    pub token: String,
    #[validate(length(min = 8))]
    pub new_password: String,
}

pub async fn reset_password(
    State(state): State<AppState>,
    Json(dto): Json<ResetPasswordDto>,
) -> Result<impl IntoResponse, AppError> {
    dto.validate()
        .map_err(|e| AppError::Validation(e.to_string()))?;

    let hash = token::hash_token(&dto.token);
    let vt = sqlx::query_as::<_, crate::models::session::VerificationToken>(
        "SELECT * FROM core.verification_tokens
         WHERE token_hash = $1 AND purpose = 'password_reset' AND used_at IS NULL AND expires_at > NOW()"
    )
    .bind(&hash)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::Validation("Token invalide ou expiré".into()))?;

    let new_hash = password::hash_password(&dto.new_password)
        .map_err(|e| AppError::Internal(e))?;

    let mut tx = state.db.begin().await?;

    sqlx::query("UPDATE core.users SET password_hash = $1 WHERE id = $2")
        .bind(&new_hash)
        .bind(vt.user_id)
        .execute(&mut *tx)
        .await?;

    sqlx::query(
        "UPDATE core.verification_tokens SET used_at = NOW() WHERE id = $1",
    )
    .bind(vt.id)
    .execute(&mut *tx)
    .await?;

    // Révoquer toutes les sessions actives
    sqlx::query(
        "UPDATE core.refresh_tokens SET revoked_at = NOW(), revoke_reason = 'password_change'
         WHERE user_id = $1 AND revoked_at IS NULL",
    )
    .bind(vt.user_id)
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;

    Ok(Json(json!({ "message": "Mot de passe réinitialisé avec succès" })))
}

// ── OAuth redirect ────────────────────────────────────────────────────────────

pub async fn oauth_redirect(
    axum::extract::Path(provider): axum::extract::Path<String>,
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<impl IntoResponse, AppError> {
    match provider.as_str() {
        "keycloak" => {
            let enabled: bool = sqlx::query_scalar(
                "SELECT (value #>> '{}' = 'true') FROM core.settings WHERE key = 'auth.oauth_keycloak_enabled'",
            )
            .fetch_optional(&state.db)
            .await?
            .unwrap_or(false);

            if !enabled {
                return Err(AppError::NotFound("Keycloak SSO non activé".into()));
            }

            let kc = state.settings.auth.keycloak()
                .ok_or_else(|| AppError::NotFound("Keycloak non configuré (issuer/client_id/client_secret manquants)".into()))?;

            let redirect_uri = build_oauth_redirect_uri(&headers, &provider);
            let pkce = OAuthPkce::generate();
            let auth_url = keycloak_auth_url(&kc, &redirect_uri, &pkce)
                .map_err(|e| AppError::Internal(e))?;

            let secure_attr = if state.settings.server.secure_cookies { "; Secure" } else { "" };
            let pkce_cookie = format!(
                "oauth_pkce={}; HttpOnly{secure_attr}; Path=/api/v1/auth; SameSite=Lax; Max-Age=600",
                pkce.to_cookie_value()
            );

            Ok((
                [(header::SET_COOKIE, pkce_cookie)],
                Redirect::to(&auth_url),
            ).into_response())
        }
        _ => Err(AppError::NotFound(format!("Provider OAuth inconnu: {provider}"))),
    }
}

// ── OAuth callback ────────────────────────────────────────────────────────────

#[derive(Deserialize)]
pub struct OAuthCallbackQuery {
    pub code:  Option<String>,
    pub state: Option<String>,
    pub error: Option<String>,
    pub error_description: Option<String>,
}

pub async fn oauth_callback(
    axum::extract::Path(provider): axum::extract::Path<String>,
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(params): Query<OAuthCallbackQuery>,
) -> Result<impl IntoResponse, AppError> {
    // Effacer le cookie PKCE dans tous les cas
    let clear_pkce = "oauth_pkce=; HttpOnly; Path=/api/v1/auth; SameSite=Lax; Max-Age=0";

    match provider.as_str() {
        "keycloak" => {
            // Erreur renvoyée par Keycloak
            if let Some(err) = params.error {
                let desc = params.error_description.unwrap_or_default();
                tracing::warn!(error = %err, description = %desc, "Keycloak a retourné une erreur");
                let url = format!("/auth/oauth/callback?error={}", urlencoding_encode(&format!("{err}: {desc}")));
                return Ok(([(header::SET_COOKIE, clear_pkce)], Redirect::to(&url)).into_response());
            }

            let code        = params.code.ok_or_else(|| AppError::Validation("Code d'autorisation manquant".into()))?;
            let state_param = params.state.ok_or_else(|| AppError::Validation("Paramètre state manquant".into()))?;

            // Lire et vérifier le cookie PKCE
            let pkce_value = extract_cookie_value(&headers, "oauth_pkce")
                .ok_or_else(|| AppError::Validation("Session OAuth expirée — veuillez réessayer".into()))?;
            let pkce = OAuthPkce::from_cookie_value(&pkce_value)
                .ok_or_else(|| AppError::Validation("Cookie OAuth corrompu".into()))?;

            if state_param != pkce.nonce {
                return Err(AppError::Validation("Vérification CSRF échouée".into()));
            }

            let kc = state.settings.auth.keycloak()
                .ok_or_else(|| AppError::Internal(anyhow::anyhow!("Config Keycloak disparue entre redirect et callback")))?;

            let redirect_uri = build_oauth_redirect_uri(&headers, &provider);
            let http = reqwest::Client::builder()
                .timeout(std::time::Duration::from_secs(15))
                .build()
                .map_err(|e| AppError::Internal(e.into()))?;

            // Échange code → access token Keycloak
            let kc_tokens = keycloak_exchange_code(&http, &kc, &code, &redirect_uri, &pkce.code_verifier)
                .await
                .map_err(|e| AppError::Internal(e))?;

            // Récupérer le profil utilisateur
            let userinfo = keycloak_userinfo(&http, &kc, &kc_tokens.access_token)
                .await
                .map_err(|e| AppError::Internal(e))?;

            let email = userinfo.email.ok_or_else(|| {
                AppError::Validation("Le profil Keycloak ne contient pas d'email (scope 'email' requis)".into())
            })?;

            // Trouver ou créer l'utilisateur Kubuno
            let user = find_or_create_keycloak_user(
                &state.db,
                &userinfo.sub,
                &email,
                userinfo.preferred_username.as_deref(),
                userinfo.name.as_deref(),
            )
            .await?;

            // Générer les tokens Kubuno
            let jwt = JwtService::new(
                state.settings.auth.jwt_secret.clone(),
                state.settings.auth.access_token_ttl,
            );
            let access_token = jwt.generate_access_token(&user)?;
            let (refresh_raw, refresh_hash) = JwtService::generate_refresh_token();

            let xff_owned2 = headers
                .get("x-forwarded-for")
                .and_then(|v| v.to_str().ok())
                .map(|v| v.split(',').next().unwrap_or(v).trim().to_string());
            let ip = xff_owned2.as_deref()
                .or_else(|| headers.get("x-real-ip").and_then(|v| v.to_str().ok()));
            let ua = headers.get(header::USER_AGENT).and_then(|v| v.to_str().ok()).unwrap_or("");
            let expires_at = Utc::now() + state.settings.auth.refresh_token_ttl;

            sqlx::query(
                r#"INSERT INTO core.refresh_tokens
                   (user_id, token_hash, device_name, device_type, ip_address, user_agent, expires_at)
                   VALUES ($1, $2, 'Keycloak SSO', 'web', $3::inet, $4, $5)"#,
            )
            .bind(user.id)
            .bind(&refresh_hash)
            .bind(ip)
            .bind(ua)
            .bind(expires_at)
            .execute(&state.db)
            .await?;

            sqlx::query("UPDATE core.users SET last_login_at = NOW() WHERE id = $1")
                .bind(user.id)
                .execute(&state.db)
                .await?;

            let secure = if state.settings.server.secure_cookies { "; Secure" } else { "" };
            let refresh_cookie = format!(
                "refresh_token={refresh_raw}; HttpOnly{secure}; Path=/api/v1/auth; SameSite=Strict; Max-Age={}",
                state.settings.auth.refresh_token_ttl.as_secs()
            );
            // Passe le JWT via un cookie éphémère (60 s) plutôt qu'en query param
            // pour éviter l'exposition dans l'historique navigateur et les logs serveur.
            let token_cookie = format!(
                "oauth_token={access_token}; Path=/auth/oauth/callback; SameSite=Strict; Max-Age=60{secure}"
            );

            let mut resp_headers = axum::http::HeaderMap::new();
            resp_headers.append(header::SET_COOKIE, clear_pkce.parse().unwrap());
            resp_headers.append(header::SET_COOKIE, refresh_cookie.parse().unwrap());
            resp_headers.append(header::SET_COOKIE, token_cookie.parse().unwrap());

            Ok((resp_headers, Redirect::to("/auth/oauth/callback")).into_response())
        }
        _ => Err(AppError::NotFound(format!("Provider OAuth inconnu: {provider}"))),
    }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

fn build_oauth_redirect_uri(headers: &HeaderMap, provider: &str) -> String {
    let host = headers
        .get("x-forwarded-host")
        .or_else(|| headers.get("host"))
        .and_then(|v| v.to_str().ok())
        .unwrap_or("localhost");
    let scheme = headers
        .get("x-forwarded-proto")
        .and_then(|v| v.to_str().ok())
        .unwrap_or(if host.contains("localhost") { "http" } else { "https" });
    format!("{scheme}://{host}/api/v1/auth/oauth/{provider}/callback")
}

fn extract_cookie_value(headers: &HeaderMap, name: &str) -> Option<String> {
    let raw = headers.get("cookie")?.to_str().ok()?;
    let prefix = format!("{name}=");
    raw.split(';')
        .find_map(|part| part.trim().strip_prefix(&prefix))
        .map(str::to_string)
}

fn urlencoding_encode(s: &str) -> String {
    url::form_urlencoded::byte_serialize(s.as_bytes()).collect()
}

async fn find_or_create_keycloak_user(
    db:           &sqlx::PgPool,
    sub:          &str,
    email:        &str,
    preferred_username: Option<&str>,
    display_name: Option<&str>,
) -> Result<crate::models::user::User, AppError> {
    // 1. Chercher par (provider, oauth_id)
    if let Some(user) = sqlx::query_as::<_, crate::models::user::User>(
        "SELECT * FROM core.users WHERE oauth_provider = 'keycloak' AND oauth_id = $1 AND is_active = TRUE",
    )
    .bind(sub)
    .fetch_optional(db)
    .await?
    {
        return Ok(user);
    }

    // 2. Chercher par email et lier à Keycloak si compte local existant
    if let Some(user) = sqlx::query_as::<_, crate::models::user::User>(
        "UPDATE core.users SET oauth_provider = 'keycloak', oauth_id = $1,
                               display_name = COALESCE(display_name, $2),
                               email_verified = TRUE
         WHERE email = $3 AND is_active = TRUE
         RETURNING *",
    )
    .bind(sub)
    .bind(display_name)
    .bind(email)
    .fetch_optional(db)
    .await?
    {
        tracing::info!(user_id = %user.id, "Compte local lié à Keycloak SSO");
        return Ok(user);
    }

    // 3. Créer un nouveau compte
    let base_username = preferred_username
        .filter(|u| !u.is_empty())
        .unwrap_or(email.split('@').next().unwrap_or("user"));

    // Déduplication du username si déjà pris
    let username = unique_username(db, base_username).await?;

    let user = sqlx::query_as::<_, crate::models::user::User>(
        r#"INSERT INTO core.users
               (email, username, display_name, oauth_provider, oauth_id, email_verified)
           VALUES ($1, $2, $3, 'keycloak', $4, TRUE)
           RETURNING *"#,
    )
    .bind(email)
    .bind(&username)
    .bind(display_name)
    .bind(sub)
    .fetch_one(db)
    .await?;

    tracing::info!(user_id = %user.id, username = %username, "Nouveau compte créé via Keycloak SSO");
    Ok(user)
}

async fn unique_username(db: &sqlx::PgPool, base: &str) -> Result<String, AppError> {
    // Nettoyer : minuscules, alphanumériques + tirets/underscores uniquement
    let base: String = base
        .chars()
        .filter(|c| c.is_alphanumeric() || *c == '_' || *c == '-')
        .take(40)
        .collect();
    let base = if base.is_empty() { "user".to_string() } else { base.to_lowercase() };

    let exists: bool = sqlx::query_scalar("SELECT EXISTS(SELECT 1 FROM core.users WHERE username = $1)")
        .bind(&base)
        .fetch_one(db)
        .await?;

    if !exists {
        return Ok(base);
    }

    // Ajouter un suffixe numérique
    for i in 2u32..=999 {
        let candidate = format!("{base}{i}");
        let exists: bool = sqlx::query_scalar("SELECT EXISTS(SELECT 1 FROM core.users WHERE username = $1)")
            .bind(&candidate)
            .fetch_one(db)
            .await?;
        if !exists {
            return Ok(candidate);
        }
    }

    // Cas extrêmement rare — suffixe UUID court
    Ok(format!("{base}_{}", uuid::Uuid::new_v4().simple().to_string().get(..6).unwrap_or("xxx")))
}
