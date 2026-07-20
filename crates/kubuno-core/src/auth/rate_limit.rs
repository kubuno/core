use axum::{
    body::Body,
    http::{HeaderName, HeaderValue, Request, StatusCode},
    middleware::Next,
    response::Response,
};
use serde_json::json;
use std::{
    collections::HashMap,
    sync::{LazyLock, Mutex},
    time::Instant,
};

struct Window {
    count:      u32,
    started_at: Instant,
}

static LIMITER: LazyLock<Mutex<HashMap<String, Window>>> =
    LazyLock::new(|| Mutex::new(HashMap::new()));

const WINDOW_SECS: u64 = 60;

fn limit_for_path(path: &str) -> u32 {
    if path.contains("forgot-password") || path.contains("reset-password") {
        // Brute-forceable and mail-sending — keep these tight.
        3
    } else if path.ends_with("/refresh") {
        // One home/office IP legitimately carries many refresh callers (browser tabs,
        // desktop daemon + doc proxy, mobile). A refresh without a valid HttpOnly
        // cookie is not brute-forceable, so a generous per-IP budget is safe.
        60
    } else {
        10
    }
}

pub async fn rate_limit_auth(req: Request<Body>, next: Next) -> Response {
    let path  = req.uri().path().to_owned();
    let ip    = req.headers()
        .get("x-forwarded-for")
        .and_then(|v| v.to_str().ok())
        .map(|s| s.split(',').next().unwrap_or("").trim().to_string())
        .or_else(|| req.headers().get("x-real-ip").and_then(|v| v.to_str().ok()).map(String::from))
        .unwrap_or_else(|| "unknown".to_string());

    let key   = format!("{ip}:{path}");
    let limit = limit_for_path(&path);

    let exceeded = {
        let mut map = LIMITER.lock().unwrap_or_else(|e| e.into_inner());
        let now     = Instant::now();
        let entry   = map.entry(key).or_insert(Window { count: 0, started_at: now });
        if now.duration_since(entry.started_at).as_secs() >= WINDOW_SECS {
            *entry = Window { count: 1, started_at: now };
            false
        } else {
            entry.count += 1;
            entry.count > limit
        }
    };

    if exceeded {
        let mut resp = axum::response::Response::new(axum::body::Body::from(
            json!({ "error": "RATE_LIMITED", "message": "Trop de tentatives, réessayez dans 60 secondes" }).to_string(),
        ));
        *resp.status_mut() = StatusCode::TOO_MANY_REQUESTS;
        resp.headers_mut().insert(
            HeaderName::from_static("content-type"),
            HeaderValue::from_static("application/json"),
        );
        resp.headers_mut().insert(
            HeaderName::from_static("retry-after"),
            HeaderValue::from_static("60"),
        );
        return resp;
    }

    next.run(req).await
}
