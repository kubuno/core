//! Admin : navigation dans la marketplace + installation de modules.
//!
//! Réservé aux administrateurs. Le catalogue est croisé avec `core.modules` pour
//! marquer les modules déjà installés (et leur version / état activé).

use std::collections::HashMap;

use axum::{extract::{Path, State}, http::StatusCode, response::IntoResponse, Json};
use serde_json::json;
use sqlx::Row;

use crate::{
    auth::middleware::AdminUser,
    errors::AppError,
    modules::marketplace,
    state::AppState,
};

/// `GET /api/v1/admin/marketplace` — catalogue distant + état d'installation local.
pub async fn list_marketplace(
    State(state): State<AppState>,
    _admin: AdminUser,
) -> Result<Json<serde_json::Value>, AppError> {
    let catalog = marketplace::fetch_catalog().await?;

    // État local : version installée + activé, par id de module.
    let rows = sqlx::query("SELECT id, version, is_enabled FROM core.modules")
        .fetch_all(&state.db)
        .await?;
    let installed: HashMap<String, (String, bool)> = rows
        .into_iter()
        .map(|r| (r.get::<String, _>("id"), (r.get::<String, _>("version"), r.get::<bool, _>("is_enabled"))))
        .collect();

    let modules: Vec<_> = catalog
        .into_iter()
        .map(|m| {
            let local = installed.get(&m.id);
            // Désinstallable uniquement si installé depuis la marketplace (store).
            let removable = marketplace::is_store_installed(&state.settings, &m.id);
            json!({
                "id":            m.id,
                "name":          m.name,
                "version":       m.version,
                "author":        m.author,
                "official":      m.official,
                "category":      m.category,
                "accent":        m.accent,
                "summary":       m.summary,
                "description":   m.description,
                "license":       m.license,
                "tags":          m.tags,
                "rating":        m.rating,
                "updated":       m.updated,
                "links":         m.links,
                "installed":         local.is_some(),
                "installed_version": local.map(|(v, _)| v.clone()),
                "enabled":           local.map(|(_, e)| *e),
                "removable":         removable,
            })
        })
        .collect();

    Ok(Json(json!({ "modules": modules })))
}

/// `POST /api/v1/admin/marketplace/:id/install` — lance l'installation en tâche de
/// fond et répond immédiatement `202 Accepted`. Le frontend suit l'avancement via
/// `GET /api/v1/admin/marketplace/:id/status`.
pub async fn install_marketplace(
    State(state): State<AppState>,
    _admin: AdminUser,
    Path(id): Path<String>,
) -> Result<impl IntoResponse, AppError> {
    // Refuse une installation déjà en cours pour ce module.
    if let Some(p) = marketplace::get_progress(&id) {
        if !matches!(p.phase.as_str(), "done" | "error") {
            return Err(AppError::Conflict(format!("installation de « {id} » déjà en cours")));
        }
    }
    marketplace::begin(&id);
    tracing::info!(module_id = %id, "Marketplace : installation demandée par un admin");

    let settings = state.settings.clone();
    let db = state.db.clone();
    let mid = id.clone();
    tokio::spawn(async move {
        let result = marketplace::install(settings, db, &mid).await;
        match &result {
            Ok(r)  => tracing::info!(module_id = %mid, version = %r.version, started = r.started, "Marketplace : installation terminée"),
            Err(e) => tracing::error!(module_id = %mid, error = %e, "Marketplace : installation échouée"),
        }
        marketplace::finish_progress(&mid, &result);
    });

    Ok((StatusCode::ACCEPTED, Json(json!({ "status": "started", "id": id }))))
}

/// `GET /api/v1/admin/marketplace/:id/status` — état d'avancement d'une installation.
pub async fn install_status(
    State(_state): State<AppState>,
    _admin: AdminUser,
    Path(id): Path<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    Ok(Json(json!({ "id": id, "progress": marketplace::get_progress(&id) })))
}

/// `DELETE /api/v1/admin/marketplace/:id` — désinstalle un module de la marketplace.
pub async fn uninstall_marketplace(
    State(state): State<AppState>,
    _admin: AdminUser,
    Path(id): Path<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    marketplace::uninstall(state.settings.clone(), state.db.clone(), &id).await?;
    // Retrait du registre en mémoire + notification.
    state.modules.write().await.unregister(&id);
    state.events.publish(crate::events::AppEvent::ModuleUnregistered { module_id: id.clone() });
    tracing::info!(module_id = %id, "Marketplace : désinstallation demandée par un admin");
    Ok(Json(json!({ "ok": true })))
}
