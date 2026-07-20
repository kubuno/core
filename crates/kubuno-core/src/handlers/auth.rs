use crate::{
    auth::{
        jwt::JwtService,
        oauth::{self, OAuthPkce},
        totp as totp_auth,
    },
    crypto::{encryption, password, token},
    errors::AppError,
    models::{
        oauth_provider::{OAuthProvider, PublicOAuthProvider},
        session::{LoginDto, LoginResponse, NativeTokenResponse},
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

#[utoipa::path(
    post,
    path = "/api/v1/auth/register",
    tag = "auth",
    request_body = CreateUserDto,
    responses(
        (status = 201, description = "Compte créé"),
        (status = 403, description = "Inscription fermée"),
        (status = 409, description = "Email ou nom d'utilisateur déjà pris")
    )
)]
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

    issue_full_tokens(&state, &headers, user, dto.device_name.as_deref(), dto.device_type.as_deref(), dto.client_type.as_deref()).await
}

/// Émet le couple access_token / refresh_token après authentification complète.
///
/// `client_type` = 'native' | 'desktop' renvoie le refresh token dans le corps
/// JSON (sans cookie) ; toute autre valeur conserve le cookie HttpOnly du web.
async fn issue_full_tokens(
    state: &AppState,
    headers: &HeaderMap,
    user: crate::models::user::User,
    device_name: Option<&str>,
    device_type: Option<&str>,
    client_type: Option<&str>,
) -> Result<Response, AppError> {
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
    // New login = root of a fresh rotation family.
    let family_id = uuid::Uuid::new_v4();
    let is_native = matches!(client_type, Some("native") | Some("desktop"));
    let stored_client_type = client_type.unwrap_or("web");

    sqlx::query(
        r#"INSERT INTO core.refresh_tokens
           (user_id, token_hash, device_name, device_type, ip_address, user_agent,
            expires_at, family_id, client_type)
           VALUES ($1, $2, $3, $4, $5::inet, $6, $7, $8, $9)"#,
    )
    .bind(user.id)
    .bind(&refresh_hash)
    .bind(device_name)
    .bind(device_type)
    .bind(ip)
    .bind(ua)
    .bind(expires_at)
    .bind(family_id)
    .bind(stored_client_type)
    .execute(&state.db)
    .await?;

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

    let secure = if state.settings.server.secure_cookies { "; Secure" } else { "" };
    let cookie = format!(
        "refresh_token={refresh_raw}; HttpOnly{secure}; Path=/api/v1/auth; SameSite=Strict; Max-Age={}",
        ttls.refresh_ttl.as_secs()
    );

    Ok((
        StatusCode::OK,
        [(header::SET_COOKIE, cookie)],
        Json(LoginResponse { access_token, user }),
    )
        .into_response())
}

#[derive(Deserialize, utoipa::ToSchema)]
pub struct TotpVerifyDto {
    pub code:         String,
    pub totp_session: String,
    /// Idem qu'au login : 'native'/'desktop' reçoivent le refresh en JSON.
    pub client_type:  Option<String>,
}

#[utoipa::path(
    post,
    path = "/api/v1/auth/totp",
    tag = "auth",
    request_body = TotpVerifyDto,
    responses(
        (status = 200, description = "2FA validée, session émise", body = NativeTokenResponse),
        (status = 401, description = "Session TOTP invalide"),
        (status = 422, description = "Code incorrect")
    )
)]
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

    issue_full_tokens(&state, &headers, user, None, None, dto.client_type.as_deref()).await
}

/// Corps optionnel pour les clients natifs : le refresh token est transmis en
/// JSON (les navigateurs continuent d'utiliser le cookie HttpOnly).
#[derive(Deserialize, utoipa::ToSchema)]
pub struct RefreshRequest {
    pub refresh_token: String,
}

/// Extrait la valeur du cookie `refresh_token`.
fn refresh_cookie(headers: &HeaderMap) -> Option<String> {
    headers
        .get("cookie")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("")
        .split(';')
        .find_map(|part| part.trim().strip_prefix("refresh_token=").map(str::to_string))
}

/// Rotation grace: heals a native client that lost the successor token (killed
/// between the server rotation and its own persistence). Eligible only when the
/// successor has NEVER been used — it then gets superseded by a fresh token in
/// the same family. Returns None when the presentation must be treated as reuse.
async fn try_rotation_grace(
    state: &AppState,
    rt: &crate::models::session::RefreshToken,
) -> Result<Option<Response>, AppError> {
    let rotated_to: Option<uuid::Uuid> =
        sqlx::query_scalar("SELECT rotated_to FROM core.refresh_tokens WHERE id = $1")
            .bind(rt.id)
            .fetch_one(&state.db)
            .await?;
    let Some(succ_id) = rotated_to else { return Ok(None) };

    // Successor must be alive and virgin (last_used_at untouched since creation):
    // if it ever served, the old-token presentation is genuine reuse.
    let succ: Option<(chrono::DateTime<Utc>,)> = sqlx::query_as(
        "SELECT expires_at FROM core.refresh_tokens
         WHERE id = $1 AND revoked_at IS NULL AND last_used_at = created_at",
    )
    .bind(succ_id)
    .fetch_optional(&state.db)
    .await?;
    if succ.is_none() {
        return Ok(None);
    }

    let user = sqlx::query_as::<_, crate::models::user::User>(
        "SELECT * FROM core.users WHERE id = $1 AND is_active = TRUE",
    )
    .bind(rt.user_id)
    .fetch_optional(&state.db)
    .await?
    .ok_or(AppError::Unauthorized)?;

    let ttls = crate::config::runtime::security_ttls(&state.db, &state.settings).await;
    let (new_raw, new_hash) = JwtService::generate_refresh_token();
    let new_expires = Utc::now() + ttls.refresh_ttl;
    let family = rt.family_id.unwrap_or(rt.id);

    let mut tx = state.db.begin().await?;
    sqlx::query(
        "UPDATE core.refresh_tokens SET revoked_at = NOW(), revoke_reason = 'rotation_grace_superseded' WHERE id = $1",
    )
    .bind(succ_id)
    .execute(&mut *tx)
    .await?;
    let new_id: uuid::Uuid = sqlx::query_scalar(
        r#"INSERT INTO core.refresh_tokens
           (user_id, token_hash, device_name, device_type, ip_address, user_agent,
            expires_at, family_id, client_type)
           VALUES ($1, $2, $3, $4, $5::inet, $6, $7, $8, $9)
           RETURNING id"#,
    )
    .bind(rt.user_id)
    .bind(&new_hash)
    .bind(rt.device_name.as_deref())
    .bind(rt.device_type.as_deref())
    .bind(rt.ip_address.as_deref())
    .bind(rt.user_agent.as_deref())
    .bind(new_expires)
    .bind(family)
    .bind(rt.client_type.as_deref().unwrap_or("native"))
    .fetch_one(&mut *tx)
    .await?;
    // Repoint (revoked_at unchanged → the grace window stays anchored at the
    // ORIGINAL rotation, a crash-loop cannot extend it indefinitely).
    sqlx::query("UPDATE core.refresh_tokens SET rotated_to = $2 WHERE id = $1")
        .bind(rt.id)
        .bind(new_id)
        .execute(&mut *tx)
        .await?;
    tx.commit().await?;

    tracing::info!(user_id = %rt.user_id, family_id = %family, "Grâce de rotation servie (successeur vierge remplacé)");

    let jwt = JwtService::new(state.settings.auth.jwt_secret.clone(), ttls.access_ttl);
    let access_token = jwt.generate_access_token(&user)?;
    Ok(Some(
        Json(NativeTokenResponse {
            access_token,
            refresh_token: new_raw,
            refresh_expires_at: new_expires,
            user,
        })
        .into_response(),
    ))
}

#[utoipa::path(
    post,
    path = "/api/v1/auth/refresh",
    tag = "auth",
    request_body(content = RefreshRequest, description = "Optionnel — clients natifs. Le web envoie le refresh via cookie."),
    responses(
        (status = 200, description = "Nouveau couple (natif, avec rotation) ou nouvel access_token (web)", body = NativeTokenResponse),
        (status = 401, description = "Refresh invalide, expiré ou réutilisé")
    )
)]
pub async fn refresh(
    State(state): State<AppState>,
    headers: HeaderMap,
    body: axum::body::Bytes,
) -> Result<Response, AppError> {
    // Source du refresh : corps JSON (natif) en priorité, sinon cookie (web).
    let body_token: Option<String> = if body.is_empty() {
        None
    } else {
        serde_json::from_slice::<RefreshRequest>(&body)
            .ok()
            .map(|r| r.refresh_token)
    };
    let is_native = body_token.is_some();
    let refresh_raw = body_token
        .or_else(|| refresh_cookie(&headers))
        .ok_or(AppError::Unauthorized)?;

    let refresh_hash = token::hash_token(&refresh_raw);

    // On récupère le token SANS filtrer sur revoked_at afin de détecter la
    // réutilisation d'un token déjà tourné (signe de vol).
    let rt = sqlx::query_as::<_, crate::models::session::RefreshToken>(
        r#"SELECT id, user_id, token_hash, device_name, device_type,
                  host(ip_address)::text as ip_address, user_agent,
                  expires_at, created_at, last_used_at, revoked_at, revoke_reason,
                  family_id, client_type
           FROM core.refresh_tokens
           WHERE token_hash = $1"#,
    )
    .bind(&refresh_hash)
    .fetch_optional(&state.db)
    .await?
    .ok_or(AppError::Unauthorized)?;

    // Détection de réutilisation : un token déjà « rotated » qu'on représente
    // ⇒ on révoque toute la famille de l'appareil (le voleur ET l'utilisateur
    // légitime devront se reconnecter).
    //
    // GRÂCE DE ROTATION : un client natif tué/crashé ENTRE la rotation serveur et
    // sa persistance du nouveau token rejoue l'ancien au redémarrage — ce n'est
    // pas un vol. Si le successeur n'a JAMAIS servi, `try_rotation_grace` le
    // remplace par un token frais au lieu de révoquer la famille ; un successeur
    // déjà utilisé y renvoie None → on retombe sur la révocation ci-dessous.
    //
    // FENÊTRE : le successeur VIERGE prouve à lui seul le cas crash (un voleur
    // ayant intercepté la rotation présenterait le successeur, pas l'ancien
    // token), donc la fenêtre est large (24 h) — une boucle de dev qui tue/relance
    // l'app bien au-delà de 60 s reste soignée. Elle reste ancrée sur le
    // `revoked_at` D'ORIGINE (la grâce ne le déplace pas), donc une crash-loop ne
    // peut pas l'étendre indéfiniment ; et le cas « successeur déjà utilisé »
    // garde la révocation immédiate (via le None de `try_rotation_grace`).
    if let Some(revoked_at) = rt.revoked_at {
        if rt.revoke_reason.as_deref() == Some("rotated") {
            const ROTATION_GRACE_SECS: i64 = 24 * 60 * 60;
            let in_grace = is_native
                && Utc::now() - revoked_at <= chrono::Duration::seconds(ROTATION_GRACE_SECS);
            if in_grace {
                if let Some(healed) = try_rotation_grace(&state, &rt).await? {
                    return Ok(healed);
                }
            }
            let family = rt.family_id.unwrap_or(rt.id);
            sqlx::query(
                "UPDATE core.refresh_tokens SET revoked_at = NOW(), revoke_reason = 'reuse_detected'
                 WHERE family_id = $1 AND revoked_at IS NULL",
            )
            .bind(family)
            .execute(&state.db)
            .await?;
            tracing::warn!(user_id = %rt.user_id, family_id = %family, "Réutilisation de refresh token détectée — famille révoquée");
        }
        return Err(AppError::Unauthorized);
    }

    if rt.expires_at <= Utc::now() {
        return Err(AppError::Unauthorized);
    }

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

    let jwt = JwtService::new(state.settings.auth.jwt_secret.clone(), ttls.access_ttl);
    let access_token = jwt.generate_access_token(&user)?;

    // Client natif : ROTATION. On révoque l'ancien refresh et on en émet un
    // nouveau dans la même famille, transmis en JSON.
    if is_native {
        let (new_raw, new_hash) = JwtService::generate_refresh_token();
        let new_expires = Utc::now() + ttls.refresh_ttl;
        let family = rt.family_id.unwrap_or(rt.id);

        let mut tx = state.db.begin().await?;
        let new_id: uuid::Uuid = sqlx::query_scalar(
            r#"INSERT INTO core.refresh_tokens
               (user_id, token_hash, device_name, device_type, ip_address, user_agent,
                expires_at, family_id, client_type)
               VALUES ($1, $2, $3, $4, $5::inet, $6, $7, $8, $9)
               RETURNING id"#,
        )
        .bind(rt.user_id)
        .bind(&new_hash)
        .bind(rt.device_name.as_deref())
        .bind(rt.device_type.as_deref())
        .bind(rt.ip_address.as_deref())
        .bind(rt.user_agent.as_deref())
        .bind(new_expires)
        .bind(family)
        .bind(rt.client_type.as_deref().unwrap_or("native"))
        .fetch_one(&mut *tx)
        .await?;
        // rotated_to feeds the rotation grace (crash between rotation and persistence).
        sqlx::query("UPDATE core.refresh_tokens SET revoked_at = NOW(), revoke_reason = 'rotated', rotated_to = $2 WHERE id = $1")
            .bind(rt.id)
            .bind(new_id)
            .execute(&mut *tx)
            .await?;
        tx.commit().await?;

        return Ok(Json(NativeTokenResponse {
            access_token,
            refresh_token: new_raw,
            refresh_expires_at: new_expires,
            user,
        })
        .into_response());
    }

    // Web : pas de rotation, on met juste à jour l'activité et on renvoie un
    // nouveau access token (le refresh reste en cookie).
    sqlx::query("UPDATE core.refresh_tokens SET last_used_at = NOW() WHERE id = $1")
        .bind(rt.id)
        .execute(&state.db)
        .await?;

    Ok(Json(json!({ "access_token": access_token })).into_response())
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
        sqlx::query(
            "UPDATE core.refresh_tokens SET revoked_at = NOW(), revoke_reason = 'logout'
             WHERE token_hash = $1 AND revoked_at IS NULL",
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
    )
        .into_response())
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

// ── OAuth / OIDC — generic providers (Keycloak, GitLab, Authentik, …) ──────────

/// HTTP client for IdP calls (discovery, token, userinfo).
fn oidc_http_client() -> Result<reqwest::Client, AppError> {
    reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(15))
        .build()
        .map_err(|e| AppError::Internal(e.into()))
}

/// Load an enabled provider by slug, 404 otherwise.
async fn load_enabled_provider(db: &sqlx::PgPool, slug: &str) -> Result<OAuthProvider, AppError> {
    sqlx::query_as::<_, OAuthProvider>(
        "SELECT * FROM core.oauth_providers WHERE slug = $1 AND enabled = TRUE",
    )
    .bind(slug)
    .fetch_optional(db)
    .await?
    .ok_or_else(|| AppError::NotFound(format!("Fournisseur SSO inconnu ou désactivé: {slug}")))
}

/// Public list of enabled providers for the login page (no secrets).
pub async fn list_public_oauth_providers(
    State(state): State<AppState>,
) -> Result<Json<serde_json::Value>, AppError> {
    let providers = sqlx::query_as::<_, OAuthProvider>(
        "SELECT * FROM core.oauth_providers WHERE enabled = TRUE ORDER BY position, display_name",
    )
    .fetch_all(&state.db)
    .await?;

    let list: Vec<PublicOAuthProvider> = providers
        .into_iter()
        .map(|p| PublicOAuthProvider {
            slug:         p.slug,
            display_name: p.display_name,
            button_color: p.button_color,
        })
        .collect();

    Ok(Json(json!({ "providers": list })))
}

pub async fn oauth_redirect(
    axum::extract::Path(provider): axum::extract::Path<String>,
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<impl IntoResponse, AppError> {
    let p = load_enabled_provider(&state.db, &provider).await?;

    let http = oidc_http_client()?;
    let disc = oauth::discover(&http, &p.issuer_url).await.map_err(AppError::Internal)?;

    let redirect_uri = build_oauth_redirect_uri(&headers, &p.slug);
    let pkce = OAuthPkce::generate();
    let auth_url = oauth::oidc_auth_url(&disc, &p.client_id, &p.scopes, &redirect_uri, &pkce)
        .map_err(AppError::Internal)?;

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
    // Clear the PKCE cookie in every branch.
    let clear_pkce = "oauth_pkce=; HttpOnly; Path=/api/v1/auth; SameSite=Lax; Max-Age=0";

    // Error returned by the IdP → bounce to the SPA callback with a message.
    if let Some(err) = params.error {
        let desc = params.error_description.unwrap_or_default();
        tracing::warn!(provider = %provider, error = %err, description = %desc, "SSO a retourné une erreur");
        let url = format!("/auth/oauth/callback?error={}", urlencoding_encode(&format!("{err}: {desc}")));
        return Ok(([(header::SET_COOKIE, clear_pkce)], Redirect::to(&url)).into_response());
    }

    let p = load_enabled_provider(&state.db, &provider).await?;

    let code        = params.code.ok_or_else(|| AppError::Validation("Code d'autorisation manquant".into()))?;
    let state_param = params.state.ok_or_else(|| AppError::Validation("Paramètre state manquant".into()))?;

    // Read and verify the PKCE cookie (CSRF protection via `state`).
    let pkce_value = extract_cookie_value(&headers, "oauth_pkce")
        .ok_or_else(|| AppError::Validation("Session OAuth expirée — veuillez réessayer".into()))?;
    let pkce = OAuthPkce::from_cookie_value(&pkce_value)
        .ok_or_else(|| AppError::Validation("Cookie OAuth corrompu".into()))?;
    if state_param != pkce.nonce {
        return Err(AppError::Validation("Vérification CSRF échouée".into()));
    }

    // Decrypt the stored client secret (empty for public clients).
    let client_secret = if p.client_secret_enc.is_empty() {
        String::new()
    } else {
        let key = oauth::secret_key(&state.settings.auth.jwt_secret);
        let bytes = encryption::decrypt(&key, &p.client_secret_enc).map_err(AppError::Internal)?;
        String::from_utf8(bytes).map_err(|e| AppError::Internal(e.into()))?
    };

    let redirect_uri = build_oauth_redirect_uri(&headers, &p.slug);
    let http = oidc_http_client()?;
    let disc = oauth::discover(&http, &p.issuer_url).await.map_err(AppError::Internal)?;

    // Exchange code → access token, then fetch the OIDC profile.
    let tokens = oauth::oidc_exchange_code(
        &http, &disc, &p.client_id, &client_secret, &code, &redirect_uri, &pkce.code_verifier,
    )
    .await
    .map_err(AppError::Internal)?;

    let userinfo = oauth::oidc_userinfo(&http, &disc, &tokens.access_token)
        .await
        .map_err(AppError::Internal)?;

    let email = userinfo.email.ok_or_else(|| {
        AppError::Validation("Le profil SSO ne contient pas d'email (scope 'email' requis)".into())
    })?;
    let preferred = userinfo.preferred_username.or(userinfo.nickname);

    // Find (or link) an existing user; otherwise create one if signup is allowed.
    let user = match find_oauth_user(&state.db, &p.slug, &userinfo.sub, &email).await? {
        Some(u) => u,
        None if !p.allow_signup => {
            let url = format!(
                "/auth/oauth/callback?error={}",
                urlencoding_encode("Création de compte via SSO désactivée pour ce fournisseur")
            );
            return Ok(([(header::SET_COOKIE, clear_pkce)], Redirect::to(&url)).into_response());
        }
        None => {
            create_oauth_user(&state.db, &p.slug, &userinfo.sub, &email, preferred.as_deref(), userinfo.name.as_deref())
                .await?
        }
    };

    // Issue Kubuno tokens.
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
    let device_name = format!("{} SSO", p.display_name);

    sqlx::query(
        r#"INSERT INTO core.refresh_tokens
           (user_id, token_hash, device_name, device_type, ip_address, user_agent, expires_at)
           VALUES ($1, $2, $3, 'web', $4::inet, $5, $6)"#,
    )
    .bind(user.id)
    .bind(&refresh_hash)
    .bind(&device_name)
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
    // JWT passed via a 60 s ephemeral cookie rather than a query param, to avoid
    // exposure in browser history and server logs.
    let token_cookie = format!(
        "oauth_token={access_token}; Path=/auth/oauth/callback; SameSite=Strict; Max-Age=60{secure}"
    );

    let mut resp_headers = axum::http::HeaderMap::new();
    resp_headers.append(header::SET_COOKIE, clear_pkce.parse().unwrap());
    resp_headers.append(header::SET_COOKIE, refresh_cookie.parse().unwrap());
    resp_headers.append(header::SET_COOKIE, token_cookie.parse().unwrap());

    Ok((resp_headers, Redirect::to("/auth/oauth/callback")).into_response())
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

/// Find a user by (provider, sub), or link a local account sharing the verified
/// email. Returns `None` if neither matches (caller decides whether to create).
async fn find_oauth_user(
    db:       &sqlx::PgPool,
    provider: &str,
    sub:      &str,
    email:    &str,
) -> Result<Option<crate::models::user::User>, AppError> {
    // 1. By (provider, oauth_id)
    if let Some(user) = sqlx::query_as::<_, crate::models::user::User>(
        "SELECT * FROM core.users WHERE oauth_provider = $1 AND oauth_id = $2 AND is_active = TRUE",
    )
    .bind(provider)
    .bind(sub)
    .fetch_optional(db)
    .await?
    {
        return Ok(Some(user));
    }

    // 2. Link a pre-existing local account with the same email.
    if let Some(user) = sqlx::query_as::<_, crate::models::user::User>(
        "UPDATE core.users SET oauth_provider = $1, oauth_id = $2, email_verified = TRUE
         WHERE email = $3 AND is_active = TRUE
         RETURNING *",
    )
    .bind(provider)
    .bind(sub)
    .bind(email)
    .fetch_optional(db)
    .await?
    {
        tracing::info!(user_id = %user.id, provider = %provider, "Compte local lié au SSO");
        return Ok(Some(user));
    }

    Ok(None)
}

async fn create_oauth_user(
    db:                 &sqlx::PgPool,
    provider:           &str,
    sub:                &str,
    email:              &str,
    preferred_username: Option<&str>,
    display_name:       Option<&str>,
) -> Result<crate::models::user::User, AppError> {
    let base_username = preferred_username
        .filter(|u| !u.is_empty())
        .unwrap_or(email.split('@').next().unwrap_or("user"));
    let username = unique_username(db, base_username).await?;

    let user = sqlx::query_as::<_, crate::models::user::User>(
        r#"INSERT INTO core.users
               (email, username, display_name, oauth_provider, oauth_id, email_verified)
           VALUES ($1, $2, $3, $4, $5, TRUE)
           RETURNING *"#,
    )
    .bind(email)
    .bind(&username)
    .bind(display_name)
    .bind(provider)
    .bind(sub)
    .fetch_one(db)
    .await?;

    tracing::info!(user_id = %user.id, username = %username, provider = %provider, "Nouveau compte créé via SSO");
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
