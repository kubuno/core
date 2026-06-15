use crate::{database::pool::check_connection, state::AppState};
use axum::{extract::State, http::StatusCode, response::IntoResponse, Json};
use serde_json::json;
use std::time::{SystemTime, UNIX_EPOCH};

static START_TIME: std::sync::OnceLock<u64> = std::sync::OnceLock::new();

pub fn init_start_time() {
    START_TIME.get_or_init(|| {
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs()
    });
}

pub async fn health() -> impl IntoResponse {
    let uptime = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs()
        .saturating_sub(*START_TIME.get().unwrap_or(&0));

    Json(json!({
        "status": "ok",
        "version": env!("CARGO_PKG_VERSION"),
        "uptime_s": uptime,
    }))
}

pub async fn ready(State(state): State<AppState>) -> impl IntoResponse {
    match check_connection(&state.db).await {
        Ok(_) => (StatusCode::OK, Json(json!({ "status": "ready" }))).into_response(),
        Err(_) => (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({ "status": "not_ready", "reason": "database_unavailable" })),
        )
            .into_response(),
    }
}
