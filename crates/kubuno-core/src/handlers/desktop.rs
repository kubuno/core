//! Desktop local-first components: serves the downloadable WASM backends
//! (documents-core.wasm, drive-core.wasm…) that the native desktop app fetches
//! to run a module offline. Opt-in by design — without these, launching a module
//! opens the web route in the browser. Any authenticated user may download them.
//!
//! Source = `server.wasm_dir` (default `/var/lib/kubuno/wasm`). `sha256` and `size`
//! are computed live from the bytes (never stale); `version` is read from an
//! optional sidecar `manifest.json` (`{ "<name>.wasm": "<version>" }`).

use axum::{
    body::Body,
    extract::{Path, State},
    http::header,
    response::Response,
    Json,
};
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use std::collections::HashMap;

use crate::{auth::middleware::AuthUser, errors::AppError, state::AppState};

/// Allow-list of servable components. Restricting to known names removes any path
/// traversal surface — `:name` can never escape `wasm_dir`.
const COMPONENTS: &[&str] = &["documents-core.wasm", "drive-core.wasm"];

/// Reads the optional `manifest.json` sidecar mapping `<name> → version`.
fn read_versions(dir: &str) -> HashMap<String, String> {
    let path = std::path::Path::new(dir).join("manifest.json");
    std::fs::read(&path)
        .ok()
        .and_then(|b| serde_json::from_slice::<HashMap<String, String>>(&b).ok())
        .unwrap_or_default()
}

/// GET /api/v1/desktop/wasm — manifest of available local-first components.
pub async fn wasm_manifest(
    _user: AuthUser,
    State(state): State<AppState>,
) -> Result<Json<Value>, AppError> {
    let dir = &state.settings.server.wasm_dir;
    let versions = read_versions(dir);
    let mut components = Vec::new();
    for name in COMPONENTS {
        let path = std::path::Path::new(dir).join(name);
        if let Ok(bytes) = std::fs::read(&path) {
            components.push(json!({
                "name":    name,
                "sha256":  hex::encode(Sha256::digest(&bytes)),
                "size":    bytes.len(),
                "version": versions.get(*name).cloned().unwrap_or_else(|| "0".to_string()),
            }));
        }
    }
    Ok(Json(json!({ "components": components })))
}

/// GET /api/v1/desktop/wasm/:name — the raw bytes of a component (`application/wasm`).
pub async fn wasm_file(
    _user: AuthUser,
    State(state): State<AppState>,
    Path(name): Path<String>,
) -> Result<Response, AppError> {
    if !COMPONENTS.contains(&name.as_str()) {
        return Err(AppError::NotFound(format!("composant {name} inconnu")));
    }
    let path = std::path::Path::new(&state.settings.server.wasm_dir).join(&name);
    let bytes = std::fs::read(&path)
        .map_err(|_| AppError::NotFound(format!("composant {name} introuvable")))?;
    Response::builder()
        .header(header::CONTENT_TYPE, "application/wasm")
        .header(header::CACHE_CONTROL, "no-cache")
        .body(Body::from(bytes))
        .map_err(|e| AppError::Internal(anyhow::anyhow!(e)))
}
