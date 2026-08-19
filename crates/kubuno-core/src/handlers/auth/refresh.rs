//! Refresh token rotation (`POST /auth/refresh`): reuse detection, idle timeout
//! and the rotation grace window for native clients.

use crate::{
    auth::jwt::JwtService,
    crypto::token,
    errors::AppError,
    models::session::NativeTokenResponse,
    state::AppState,
};
use axum::{
    extract::State,
    http::HeaderMap,
    response::{IntoResponse, Response},
    Json,
};
use chrono::Utc;
use serde_json::json;

use super::tokens::{refresh_cookie, RefreshRequest};

/// What a session already knows about its device, carried across a rotation.
#[derive(Debug, Default, Clone)]
pub(super) struct SessionInventory {
    pub(super) device_id: Option<uuid::Uuid>,
    country: Option<String>,
    auth_strength: Option<String>,
}

/// Reads it back. Best-effort: a rotation must never fail because the inventory
/// could not be consulted — the session is what keeps the user signed in, the
/// inventory is what tells an operator about it.
pub(super) async fn session_inventory(state: &AppState, session_id: uuid::Uuid) -> SessionInventory {
    let row: Option<(Option<uuid::Uuid>, Option<String>, Option<String>)> = sqlx::query_as(
        "SELECT device_id, country, auth_strength FROM core.refresh_tokens WHERE id = $1",
    )
    .bind(session_id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, "refresh: lecture de l'appareil de la session");
        e
    })
    .ok()
    .flatten();

    match row {
        Some((device_id, country, auth_strength)) => SessionInventory {
            device_id,
            country,
            auth_strength,
        },
        None => SessionInventory::default(),
    }
}

/// Is the device this session belongs to blocked?
///
/// The check lives on the refresh path because that is the only moment a
/// blocked machine comes back: an access token already issued keeps working
/// until it expires (fifteen minutes), and revoking the sessions at block time —
/// which the console does — closes that window from the other side.
pub(super) async fn device_is_blocked(state: &AppState, device_id: Option<uuid::Uuid>) -> bool {
    let Some(device_id) = device_id else {
        return false;
    };
    let approval: Option<String> =
        sqlx::query_scalar("SELECT approval FROM core.devices WHERE id = $1")
            .bind(device_id)
            .fetch_optional(&state.db)
            .await
            .map_err(|e| {
                tracing::error!(error = %e, device_id = %device_id, "refresh: lecture de l'approbation de l'appareil");
                e
            })
            .ok()
            .flatten();

    if approval.as_deref() != Some(crate::devices::Approval::Blocked.as_str()) {
        return false;
    }
    crate::devices::declared::block_denies_refresh(&state.db).await
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

    let inventory = session_inventory(state, rt.id).await;

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
            expires_at, family_id, client_type, device_id, country, auth_strength)
           VALUES ($1, $2, $3, $4, $5::inet, $6, $7, $8, $9, $10, $11, $12)
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
    // Rotation issues a NEW row for the SAME device: losing the link here would
    // empty the inventory of every native client after its first refresh.
    .bind(inventory.device_id)
    .bind(inventory.country.as_deref())
    .bind(inventory.auth_strength.as_deref())
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

    // Appareil bloqué : la session ne se renouvelle plus et se ferme.
    let inventory = session_inventory(&state, rt.id).await;
    if device_is_blocked(&state, inventory.device_id).await {
        sqlx::query(
            "UPDATE core.refresh_tokens SET revoked_at = NOW(), revoke_reason = 'device_blocked'
             WHERE id = $1 AND revoked_at IS NULL",
        )
        .bind(rt.id)
        .execute(&state.db)
        .await
        .map_err(|e| {
            tracing::error!(error = %e, "refresh: fermeture d'une session d'appareil bloqué");
            AppError::Database(e)
        })?;
        tracing::warn!(user_id = %rt.user_id, "Renouvellement refusé : appareil bloqué");
        return Err(AppError::Unauthorized);
    }

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
                expires_at, family_id, client_type, device_id, country, auth_strength)
               VALUES ($1, $2, $3, $4, $5::inet, $6, $7, $8, $9, $10, $11, $12)
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
        // Same device, new row: the inventory link is carried across the
        // rotation, otherwise every native client would vanish from it on its
        // first refresh.
        .bind(inventory.device_id)
        .bind(inventory.country.as_deref())
        .bind(inventory.auth_strength.as_deref())
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

    // "Last seen" must mean last seen, not last signed in: a browser open for a
    // fortnight would otherwise look abandoned in the inventory.
    if let Some(device_id) = inventory.device_id {
        if let Err(e) = sqlx::query("UPDATE core.devices SET last_seen_at = NOW() WHERE id = $1")
            .bind(device_id)
            .execute(&state.db)
            .await
        {
            tracing::error!(error = %e, device_id = %device_id, "refresh: mise à jour de l'activité de l'appareil");
        }
    }

    Ok(Json(json!({ "access_token": access_token })).into_response())
}
