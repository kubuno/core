//! Forgotten password: reset request and reset confirmation.
//!
//! ## The anti-enumeration contract
//!
//! `POST /auth/forgot-password` answers **exactly the same thing** whether the
//! address exists, belongs to a deactivated account, or is pure invention: same
//! status, same body, same headers. That is not a nicety — a route that answers
//! differently is a free membership oracle for whoever holds a leaked address
//! list.
//!
//! Concretely, every branch below returns the same `ok` value, and *nothing*
//! that follows the lookup is allowed to change it: a database failure, an
//! unconfigured relay, a full job queue — all of them log and fall through to
//! the same answer. The only public signal remains "we accepted your request".

use crate::{
    crypto::{password, token},
    errors::AppError,
    mailer,
    state::AppState,
};
use axum::{extract::State, http::HeaderMap, response::IntoResponse, Json};
use serde::Deserialize;
use serde_json::json;
use validator::Validate;

#[derive(Deserialize)]
pub struct ForgotPasswordDto {
    pub email: String,
}

pub async fn forgot_password(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(dto): Json<ForgotPasswordDto>,
) -> impl IntoResponse {
    // Répondre identiquement quelle que soit l'existence de l'email (anti-énumération)
    let ok = Json(json!({ "message": "Si cet email existe, un lien de réinitialisation a été envoyé." }));

    let email = dto.email.trim();
    // A syntactically impossible address cannot match a row; bailing out here
    // saves a query without adding an observable difference.
    if email.is_empty() || email.len() > 320 {
        return ok;
    }

    let user: Option<(uuid::Uuid, String, String, Option<String>, serde_json::Value)> =
        sqlx::query_as(
            "SELECT id, email, username, display_name, preferences \
             FROM core.users WHERE email = $1 AND is_active = TRUE",
        )
        .bind(email)
        .fetch_optional(&state.db)
        .await
        .map_err(|e| {
            tracing::error!(error = %e, "forgot_password: recherche du compte");
            e
        })
        .ok()
        .flatten();

    let Some((user_id, user_email, username, display_name, preferences)) = user else {
        return ok;
    };

    // `auth.self_service_recovery`, resolved for THIS account (migration
    // `000115`): an organisational unit whose people must go through a human
    // gets no link. Read after the lookup and answered with the same `ok` as
    // every other branch — the route stays deaf, and an administrator can still
    // reset the password from the console.
    if !crate::settings::password_policy::self_service_recovery_allowed(&state.db, user_id).await {
        tracing::info!(
            user_id = %user_id,
            "Réinitialisation autonome refusée par la politique de la portée"
        );
        return ok;
    }

    let (raw_token, token_hash) = token::generate_token();
    let expires_at = chrono::Utc::now() + chrono::Duration::hours(mailer::RESET_TOKEN_HOURS);

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

    // Le token brut n'est jamais journalisé : il vaut un mot de passe.
    let cfg = match mailer::load_config(&state.db, &state.settings.auth.jwt_secret).await {
        Ok(cfg) => cfg,
        Err(_) => {
            // Already logged by `MailConfig::load`. Same answer as always.
            return ok;
        }
    };

    let instance = mailer::instance_name(&state.db).await;
    let base = cfg.base_url(&mailer::origin_from_headers(&headers));
    let link = format!(
        "{base}/reset-password?token={}",
        url::form_urlencoded::byte_serialize(raw_token.as_bytes()).collect::<String>()
    );

    // The account's own choice first; failing that, the language its
    // organisational unit — or the instance — declares. An account that never
    // opened the language picker is not an English-speaking account.
    let audience = mailer::audience(&state.db, Some(user_id), &preferences).await;
    let recipient = mailer::Recipient {
        email:    user_email,
        name:     display_name.unwrap_or(username),
        locale:   audience.locale,
        timezone: audience.timezone,
    };

    // The answer is discarded on purpose: whether a message was queued is
    // exactly the difference this route must not expose.
    let _ = mailer::queue_password_reset(&state.db, &cfg, &instance, &recipient, &link).await;

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

    // Holding a valid link is not an exemption from the policy: this is the one
    // route on which a password is chosen by somebody who has just proved
    // nothing but access to a mailbox, so it is the last place to relax it.
    // Applied before hashing, like everywhere else.
    let policy =
        crate::settings::password_policy::PasswordPolicy::for_user(&state.db, vt.user_id).await?;
    policy.check(&dto.new_password)?;
    crate::settings::password_policy::reject_reuse(
        &state.db,
        &policy,
        vt.user_id,
        &dto.new_password,
    )
    .await?;

    let new_hash = password::hash_password(&dto.new_password)
        .map_err(AppError::Internal)?;

    let mut tx = state.db.begin().await?;

    // The user picked this password themselves: the forced-change flag is lifted,
    // and the expiry clock restarts.
    sqlx::query(
        "UPDATE core.users \
            SET password_hash = $1, must_change_password = FALSE, password_changed_at = NOW() \
          WHERE id = $2",
    )
    .bind(&new_hash)
    .bind(vt.user_id)
    .execute(&mut *tx)
    .await?;

    crate::settings::password_policy::remember(
        &mut tx,
        vt.user_id,
        &new_hash,
        policy.history_depth,
    )
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
