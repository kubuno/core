use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("Non authentifié")]
    Unauthorized,

    #[error("Accès refusé")]
    Forbidden,

    /// The account still carries the password it was seeded with: administrative
    /// writes stay closed until the owner picks a new one.
    #[error("Changement de mot de passe requis avant toute action d'administration")]
    PasswordChangeRequired,

    /// The action is sensitive and the caller has not proved presence recently.
    ///
    /// Distinct from [`AppError::Forbidden`] on purpose: a bare "accès refusé" is
    /// indistinguishable from a genuine lack of authorisation, so a client cannot
    /// tell whether to offer a way forward. This one carries a code the client
    /// acts on — open the re-authentication dialog, then replay the request.
    #[error("Réauthentification requise pour cette action sensible")]
    ReauthRequired,

    /// The caller is a personal API token: no second factor, nobody at the
    /// keyboard, so the challenge can never be met. Final, not retryable — a
    /// `ReauthRequired` here would send an unattended script into a loop.
    #[error("Cette action sensible exige une personne : un jeton d'API ne peut pas la réaliser")]
    ReauthImpossible,

    /// A personal API token issued before scopes existed, presented after its
    /// migration grace window closed.
    ///
    /// Distinguishable from a plain 401 on purpose: nothing is wrong with the
    /// network, the account or the token's own expiry — the credential belongs to
    /// a policy that has been withdrawn, and the only way forward is to reissue
    /// one with explicit scopes. A 401 would send the holder debugging the wrong
    /// thing, and the client's refresh interceptor chasing a token it cannot mint.
    #[error(
        "Ce jeton d'API a été émis avant les portées et sa période de transition est terminée. \
         Réémettez un jeton en sélectionnant explicitement ses portées \
         (Paramètres → Jetons d'API)."
    )]
    ApiTokenLegacyExpired,

    /// A legacy token attempting an administrative write. Refused immediately,
    /// with no grace period — this is the defect the scoping work exists to close.
    #[error(
        "Un jeton d'API sans portées ne peut pas effectuer d'écriture d'administration. \
         Réémettez un jeton en sélectionnant explicitement ses portées."
    )]
    ApiTokenLegacyAdminWrite,

    /// The token authenticated, but does not carry the scope this route needs.
    #[error("Ce jeton d'API ne porte pas la portée requise pour cette opération : {0}")]
    ApiTokenScopeMissing(String),

    /// The instance requires administrators to carry a second factor and this
    /// account's grace window has closed.
    #[error(
        "Double authentification obligatoire pour les administrateurs : \
         le délai de grâce est écoulé. Configurez-la dans Paramètres → Sécurité \
         pour retrouver l'accès à l'administration."
    )]
    TwoFactorRequired,

    /// A more general scope has locked this setting. Distinct from a plain
    /// [`AppError::Forbidden`] on purpose: nothing is wrong with the caller's
    /// privileges, so "accès refusé" would send an administrator auditing roles
    /// instead of looking one level up in the organisational tree. The dedicated
    /// code is what lets the console name the level that holds the lock.
    #[error("{0}")]
    SettingLocked(String),

    #[error("Ressource introuvable: {0}")]
    NotFound(String),

    #[error("Données invalides: {0}")]
    Validation(String),

    #[error("Conflit: {0}")]
    Conflict(String),

    #[error("Quota dépassé")]
    QuotaExceeded,

    #[error("Erreur base de données")]
    Database(#[from] sqlx::Error),

    #[error("Erreur interne")]
    Internal(#[from] anyhow::Error),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, code, message) = match &self {
            AppError::Unauthorized    => (StatusCode::UNAUTHORIZED,            "UNAUTHORIZED",     self.to_string()),
            AppError::Forbidden       => (StatusCode::FORBIDDEN,               "FORBIDDEN",        self.to_string()),
            AppError::PasswordChangeRequired => {
                (StatusCode::FORBIDDEN, "PASSWORD_CHANGE_REQUIRED", self.to_string())
            }
            // 403 rather than 401: a 401 is what the client's refresh interceptor
            // reacts to, and re-minting the access token is precisely what does
            // NOT help here. The dedicated codes below are what the client keys on.
            AppError::ReauthRequired  => (StatusCode::FORBIDDEN,               "REAUTH_REQUIRED",      self.to_string()),
            AppError::ReauthImpossible => (StatusCode::FORBIDDEN,              "REAUTH_NOT_AVAILABLE", self.to_string()),
            // 401 rather than 403: the credential itself is no longer accepted,
            // which is what the code says. The client must stop replaying it.
            AppError::ApiTokenLegacyExpired => {
                (StatusCode::UNAUTHORIZED, "API_TOKEN_LEGACY_EXPIRED", self.to_string())
            }
            AppError::ApiTokenLegacyAdminWrite => {
                (StatusCode::FORBIDDEN, "API_TOKEN_LEGACY_ADMIN_WRITE", self.to_string())
            }
            AppError::ApiTokenScopeMissing(_) => {
                (StatusCode::FORBIDDEN, "API_TOKEN_SCOPE_MISSING", self.to_string())
            }
            AppError::TwoFactorRequired => (StatusCode::FORBIDDEN,             "TWO_FACTOR_REQUIRED",  self.to_string()),
            AppError::SettingLocked(_) => (StatusCode::FORBIDDEN,              "SETTING_LOCKED",   self.to_string()),
            AppError::NotFound(_)     => (StatusCode::NOT_FOUND,               "NOT_FOUND",        self.to_string()),
            AppError::Validation(_)   => (StatusCode::UNPROCESSABLE_ENTITY,    "VALIDATION_ERROR", self.to_string()),
            AppError::Conflict(_)     => (StatusCode::CONFLICT,                "CONFLICT",         self.to_string()),
            AppError::QuotaExceeded   => (StatusCode::INSUFFICIENT_STORAGE,    "QUOTA_EXCEEDED",   self.to_string()),
            AppError::Database(e) => {
                tracing::error!(error = %e, "Database error");
                (StatusCode::INTERNAL_SERVER_ERROR, "DATABASE_ERROR", "Erreur base de données".to_string())
            }
            AppError::Internal(e) => {
                tracing::error!(error = %e, "Internal error");
                (StatusCode::INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", "Erreur interne".to_string())
            }
        };

        (status, Json(json!({ "error": code, "message": message }))).into_response()
    }
}
