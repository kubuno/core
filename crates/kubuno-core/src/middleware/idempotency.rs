//! Idempotency middleware for mutating requests.
//!
//! Offline-first clients queue mutations while offline and replay them on
//! reconnection. To avoid applying a side effect twice, a client attaches a
//! stable `Idempotency-Key` header to each mutation. The first request runs
//! normally and its successful response is stored; any later request with the
//! same key (same credential, method and path) returns the stored response
//! without re-executing.
//!
//! Scope is core routes only (module writes go through the proxy before this
//! layer); the `Idempotency-Key` header is forwarded to modules, which may
//! dedupe on their own later.

use axum::{
    body::Body,
    extract::Request,
    http::{header, Method, StatusCode},
    middleware::Next,
    response::{IntoResponse, Response},
};
use chrono::{Duration, Utc};

use crate::{crypto::token, state::AppState};

/// Réponses plus grosses que ça ne sont pas mémorisées (les mutations renvoient
/// du petit JSON ; un corps énorme signale un cas non pertinent pour l'idempotence).
const MAX_CACHED_BODY: usize = 4 * 1024 * 1024; // 4 MB
const TTL_HOURS: i64 = 24;

pub async fn idempotency(state: AppState, req: Request, next: Next) -> Response {
    // Uniquement les méthodes mutantes.
    let method = req.method().clone();
    if !matches!(
        method,
        Method::POST | Method::PUT | Method::PATCH | Method::DELETE
    ) {
        return next.run(req).await;
    }

    // Clé requise pour activer le mécanisme (sinon comportement inchangé).
    let key = match req
        .headers()
        .get("idempotency-key")
        .and_then(|v| v.to_str().ok())
    {
        Some(k) if !k.is_empty() => k.to_string(),
        _ => return next.run(req).await,
    };

    // Périmètre par credential : un hash de l'en-tête Authorization isole chaque
    // utilisateur (deux credentials différents ne collisionnent jamais).
    let actor = req
        .headers()
        .get(header::AUTHORIZATION)
        .and_then(|v| v.to_str().ok())
        .unwrap_or("anon");
    let actor_hash = token::hash_token(actor);
    let path = req.uri().path().to_string();
    let id_hash = token::hash_token(&format!("{actor_hash}|{method}|{path}|{key}"));

    // Réponse déjà mémorisée et non expirée ⇒ rejeu sans ré-exécution.
    match sqlx::query_as::<_, (i32, Option<String>, Vec<u8>)>(
        "SELECT status_code, content_type, body FROM core.idempotency_keys
         WHERE id_hash = $1 AND expires_at > NOW()",
    )
    .bind(&id_hash)
    .fetch_optional(&state.db)
    .await
    {
        Ok(Some((status, ctype, body))) => {
            let status = StatusCode::from_u16(status as u16).unwrap_or(StatusCode::OK);
            let mut builder = axum::http::Response::builder()
                .status(status)
                .header("idempotency-replayed", "true");
            if let Some(ct) = ctype {
                builder = builder.header(header::CONTENT_TYPE, ct);
            }
            return builder
                .body(Body::from(body))
                .unwrap_or_else(|_| StatusCode::INTERNAL_SERVER_ERROR.into_response());
        }
        Ok(None) => {}
        Err(e) => {
            // En cas d'erreur DB on n'empêche pas la requête : on la laisse passer
            // sans idempotence plutôt que de renvoyer une erreur.
            tracing::error!(error = %e, "Lecture idempotency_keys échouée");
            return next.run(req).await;
        }
    }

    // Première exécution : on bufferise la réponse pour pouvoir la mémoriser.
    let resp = next.run(req).await;
    let (parts, body) = resp.into_parts();
    let bytes = match axum::body::to_bytes(body, MAX_CACHED_BODY).await {
        Ok(b) => b,
        Err(_) => {
            tracing::warn!(path = %path, "Réponse trop volumineuse pour l'idempotence");
            return StatusCode::INTERNAL_SERVER_ERROR.into_response();
        }
    };

    // Ne mémoriser que les succès : les erreurs 4xx/5xx doivent rester rejouables.
    if parts.status.is_success() {
        let ctype = parts
            .headers
            .get(header::CONTENT_TYPE)
            .and_then(|v| v.to_str().ok())
            .map(|s| s.to_string());
        let expires = Utc::now() + Duration::hours(TTL_HOURS);
        if let Err(e) = sqlx::query(
            "INSERT INTO core.idempotency_keys
                (id_hash, actor_hash, method, path, status_code, content_type, body, expires_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (id_hash) DO NOTHING",
        )
        .bind(&id_hash)
        .bind(&actor_hash)
        .bind(method.as_str())
        .bind(&path)
        .bind(parts.status.as_u16() as i32)
        .bind(ctype)
        .bind(bytes.as_ref())
        .bind(expires)
        .execute(&state.db)
        .await
        {
            tracing::error!(error = %e, "Écriture idempotency_keys échouée");
        }
    }

    Response::from_parts(parts, Body::from(bytes))
}
