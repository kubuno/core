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
