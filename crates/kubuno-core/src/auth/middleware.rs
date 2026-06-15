use crate::{
    auth::jwt::JwtService,
    errors::AppError,
    handlers::api_tokens::resolve_token,
    models::user::User,
    state::AppState,
};
use axum::{
    extract::FromRequestParts,
    http::{HeaderMap, request::Parts},
};

/// Extracteur injecté dans les handlers authentifiés.
#[derive(Debug, Clone)]
pub struct AuthUser(pub User);

impl AuthUser {
    pub fn user(&self) -> &User {
        &self.0
    }
}

#[axum::async_trait]
impl FromRequestParts<AppState> for AuthUser {
    type Rejection = AppError;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &AppState,
    ) -> Result<Self, Self::Rejection> {
        let token = extract_bearer(&parts.headers).ok_or(AppError::Unauthorized)?;

        // Essai 1 : JWT access token
        let jwt = JwtService::new(
            state.settings.auth.jwt_secret.clone(),
            state.settings.auth.access_token_ttl,
        );
        if let Ok(claims) = jwt.validate_access_token(token) {
            let user = sqlx::query_as::<_, User>(
                "SELECT * FROM core.users WHERE id = $1 AND is_active = TRUE",
            )
            .bind(claims.sub)
            .fetch_optional(&state.db)
            .await
            .map_err(AppError::Database)?
            .ok_or(AppError::Unauthorized)?;
            return Ok(AuthUser(user));
        }

        // Essai 2 : API token personnel (préfixe kubuno_)
        let user_id = resolve_token(&state.db, token)
            .await
            .ok_or(AppError::Unauthorized)?;

        let user = sqlx::query_as::<_, User>(
            "SELECT * FROM core.users WHERE id = $1 AND is_active = TRUE",
        )
        .bind(user_id)
        .fetch_optional(&state.db)
        .await
        .map_err(AppError::Database)?
        .ok_or(AppError::Unauthorized)?;

        Ok(AuthUser(user))
    }
}

/// Extracteur pour les handlers admin uniquement.
pub struct AdminUser(pub User);

#[axum::async_trait]
impl FromRequestParts<AppState> for AdminUser {
    type Rejection = AppError;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &AppState,
    ) -> Result<Self, Self::Rejection> {
        let AuthUser(user) = AuthUser::from_request_parts(parts, state).await?;
        if user.role != "admin" {
            return Err(AppError::Forbidden);
        }
        Ok(AdminUser(user))
    }
}

/// Extracteur pour les appels internes (modules → core).
pub struct InternalRequest;

#[axum::async_trait]
impl FromRequestParts<AppState> for InternalRequest {
    type Rejection = AppError;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &AppState,
    ) -> Result<Self, Self::Rejection> {
        let secret = parts
            .headers
            .get("x-internal-secret")
            .and_then(|v| v.to_str().ok())
            .ok_or(AppError::Unauthorized)?;

        if secret != state.settings.server.internal_secret {
            return Err(AppError::Unauthorized);
        }
        Ok(InternalRequest)
    }
}

fn extract_bearer(headers: &HeaderMap) -> Option<&str> {
    headers
        .get("authorization")
        .and_then(|v| v.to_str().ok())
        .and_then(|v| v.strip_prefix("Bearer "))
}
