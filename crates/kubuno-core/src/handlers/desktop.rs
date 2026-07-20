//! Desktop local-first components: serves the downloadable WASM backends
//! (documents-core.wasm, drive-core.wasm…) that the native desktop app fetches
//! to run a module offline. Opt-in by design — without these, launching a module
//! opens the web route in the browser. Any authenticated user may download them.
//!
//! Source = `server.wasm_dir` (default `/var/lib/kubuno/wasm`). `sha256` and `size`
//! are computed live from the bytes (never stale); `version`, `notes` and `abi` come
//! from an optional sidecar `manifest.json` supporting two forms per entry:
//! `"<name>.wasm": "<version>"` (legacy string) or
//! `"<name>.wasm": { "version": "…", "notes": "…", "abi": 1 }`.

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
const COMPONENTS: &[&str] = &["documents-core.wasm", "drive-core.wasm", "notes-core.wasm", "tasks-core.wasm", "keestore-core.wasm", "jarvis-core.wasm", "contacts-core.wasm", "wiki-core.wasm", "calendar-core.wasm"];

/// Request/response frame ABI implemented by the current WASM artifacts. The desktop
/// daemon refuses to hot-swap a component whose `abi` it does not implement, so bump
/// this (per component, via the sidecar) whenever the frame layout changes.
const WASM_ABI: u32 = 1;

/// Per-component sidecar metadata (`version` + optional `notes`/`abi`/`module`/`claims`).
struct ComponentMeta {
    version: String,
    notes:   Option<String>,
    abi:     u32,
    /// Owning module id (matches `/api/v1/modules`) — lets the desktop map
    /// tile → component dynamically instead of hardcoding the pairing.
    module:  Option<String>,
    /// Route prefixes the WASM claims — lets the desktop proxy route dynamically.
    claims:  Vec<String>,
    /// Sync-entity prefixes (pull/push granularity). Defaults to `claims` when
    /// absent; declare explicitly when sync granularity differs from routing
    /// claims (e.g. tasks: one claim `/api/v1/tasks`, two sync entities).
    sync:    Vec<String>,
    /// Sync driver hint for the desktop daemon. Absent = generic entity_sync;
    /// `"blob"` = single opaque-blob module (e.g. keestore) handled by the
    /// blob-sync driver instead. Unknown values are ignored (forward-compat).
    sync_mode: Option<String>,
}

/// Reads the optional `manifest.json` sidecar. Each entry is either a plain version
/// string (legacy) or an object `{ version, notes?, abi? }`.
fn read_metas(dir: &str) -> HashMap<String, ComponentMeta> {
    let path = std::path::Path::new(dir).join("manifest.json");
    let raw: HashMap<String, Value> = match std::fs::read(&path)
        .ok()
        .and_then(|b| serde_json::from_slice(&b).ok())
    {
        Some(m) => m,
        None => return HashMap::new(),
    };
    raw.into_iter()
        .map(|(name, v)| {
            let meta = match &v {
                Value::String(s) => ComponentMeta {
                    version: s.clone(), notes: None, abi: WASM_ABI, module: None, claims: Vec::new(), sync: Vec::new(), sync_mode: None,
                },
                Value::Object(o) => ComponentMeta {
                    version: o.get("version").and_then(|x| x.as_str()).unwrap_or("0").to_string(),
                    notes:   o.get("notes").and_then(|x| x.as_str()).map(String::from),
                    abi:     o.get("abi").and_then(|x| x.as_u64()).map(|n| n as u32).unwrap_or(WASM_ABI),
                    module:  o.get("module").and_then(|x| x.as_str()).map(String::from),
                    claims:  o.get("claims").and_then(|x| x.as_array()).map(|a| {
                        a.iter().filter_map(|c| c.as_str().map(String::from)).collect()
                    }).unwrap_or_default(),
                    sync:    o.get("sync").and_then(|x| x.as_array()).map(|a| {
                        a.iter().filter_map(|c| c.as_str().map(String::from)).collect()
                    }).unwrap_or_default(),
                    sync_mode: o.get("sync_mode").and_then(|x| x.as_str()).map(String::from),
                },
                _ => ComponentMeta {
                    version: "0".to_string(), notes: None, abi: WASM_ABI, module: None, claims: Vec::new(), sync: Vec::new(), sync_mode: None,
                },
            };
            (name, meta)
        })
        .collect()
}

/// GET /api/v1/desktop/wasm — manifest of available local-first components.
pub async fn wasm_manifest(
    _user: AuthUser,
    State(state): State<AppState>,
) -> Result<Json<Value>, AppError> {
    let dir = &state.settings.server.wasm_dir;
    let metas = read_metas(dir);
    let mut components = Vec::new();
    for name in COMPONENTS {
        let path = std::path::Path::new(dir).join(name);
        if let Ok(bytes) = std::fs::read(&path) {
            let meta = metas.get(*name);
            let mut entry = json!({
                "name":    name,
                "sha256":  hex::encode(Sha256::digest(&bytes)),
                "size":    bytes.len(),
                "version": meta.map(|m| m.version.clone()).unwrap_or_else(|| "0".to_string()),
                "abi":     meta.map(|m| m.abi).unwrap_or(WASM_ABI),
            });
            if let Some(notes) = meta.and_then(|m| m.notes.clone()) {
                entry["notes"] = json!(notes);
            }
            if let Some(module) = meta.and_then(|m| m.module.clone()) {
                entry["module"] = json!(module);
            }
            if let Some(claims) = meta.map(|m| m.claims.clone()).filter(|c| !c.is_empty()) {
                entry["claims"] = json!(claims);
            }
            if let Some(sync) = meta.map(|m| m.sync.clone()).filter(|s| !s.is_empty()) {
                entry["sync"] = json!(sync);
            }
            if let Some(sync_mode) = meta.and_then(|m| m.sync_mode.clone()) {
                entry["sync_mode"] = json!(sync_mode);
            }
            components.push(entry);
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
