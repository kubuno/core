use crate::{
    auth::middleware::AdminUser,
    errors::AppError,
    modules::registry::ActiveInstance,
    state::AppState,
};
use axum::{extract::State, Json};
use chrono::Utc;
use serde_json::{json, Value};
use sqlx::Row;
use std::collections::HashMap;

pub async fn get_settings(
    State(state): State<AppState>,
    _admin: AdminUser,
) -> Result<Json<serde_json::Value>, AppError> {
    let rows = sqlx::query(
        "SELECT key, value, category, label, description, is_public FROM core.settings ORDER BY category, key"
    )
    .fetch_all(&state.db)
    .await?;

    let settings: Vec<_> = rows
        .into_iter()
        .map(|r| {
            use sqlx::Row;
            json!({
                "key": r.get::<String, _>("key"),
                "value": r.get::<Value, _>("value"),
                "category": r.get::<String, _>("category"),
                "label": r.get::<Option<String>, _>("label"),
                "description": r.get::<Option<String>, _>("description"),
                "is_public": r.get::<bool, _>("is_public"),
            })
        })
        .collect();

    Ok(Json(json!({ "settings": settings })))
}

pub async fn update_settings(
    State(state): State<AppState>,
    AdminUser(admin): AdminUser,
    Json(updates): Json<HashMap<String, Value>>,
) -> Result<Json<serde_json::Value>, AppError> {
    let mut tx = state.db.begin().await?;

    for (key, value) in &updates {
        let affected = sqlx::query(
            r#"UPDATE core.settings
               SET value = $1, updated_at = NOW(), updated_by = $2
               WHERE key = $3"#,
        )
        .bind(value)
        .bind(admin.id)
        .bind(key)
        .execute(&mut *tx)
        .await?
        .rows_affected();

        if affected == 0 {
            return Err(AppError::NotFound(format!("Setting '{key}' inexistant")));
        }
    }

    tx.commit().await?;

    // Réglages appliqués à chaud (sans redémarrage).
    if updates.keys().any(|k| k.starts_with("security.ddos_")) {
        crate::auth::ddos::reload_from_db(&state.db).await;
    }

    Ok(Json(json!({ "message": "Paramètres mis à jour", "updated": updates.len() })))
}

pub async fn public_config(
    State(state): State<AppState>,
) -> Result<Json<serde_json::Value>, AppError> {
    let rows = sqlx::query("SELECT key, value FROM core.settings WHERE is_public = TRUE")
        .fetch_all(&state.db)
        .await?;

    let config: HashMap<String, Value> = rows
        .into_iter()
        .map(|r| {
            use sqlx::Row;
            (r.get::<String, _>("key"), r.get::<Value, _>("value"))
        })
        .collect();

    Ok(Json(json!({ "config": config })))
}

pub async fn list_admin_modules(
    State(state): State<AppState>,
    _admin: AdminUser,
) -> Result<Json<serde_json::Value>, AppError> {
    let modules = sqlx::query(
        "SELECT id, display_name, version, description, is_enabled, installed_at, config FROM core.modules ORDER BY display_name"
    )
    .fetch_all(&state.db)
    .await?;

    let data: Vec<_> = modules
        .into_iter()
        .map(|m| {
            use sqlx::Row;
            let config: serde_json::Value = m.get("config");
            let settings_path = config.get("settings_path")
                .and_then(|v| v.as_str())
                .map(|s| s.to_string());
            json!({
                "id": m.get::<String, _>("id"),
                "display_name": m.get::<String, _>("display_name"),
                "version": m.get::<String, _>("version"),
                "description": m.get::<Option<String>, _>("description"),
                "is_enabled": m.get::<bool, _>("is_enabled"),
                "installed_at": m.get::<chrono::DateTime<chrono::Utc>, _>("installed_at"),
                "settings_path": settings_path,
            })
        })
        .collect();

    Ok(Json(json!({ "modules": data })))
}

pub async fn get_admin_module(
    State(state): State<AppState>,
    _admin: AdminUser,
    axum::extract::Path(id): axum::extract::Path<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    use sqlx::Row;
    let row = sqlx::query(
        "SELECT id, display_name, version, description, is_enabled, installed_at, config FROM core.modules WHERE id = $1"
    )
    .bind(&id)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound(format!("Module '{id}' introuvable")))?;

    let config: serde_json::Value = row.get("config");
    let settings_path = config.get("settings_path")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());

    Ok(Json(json!({
        "id": row.get::<String, _>("id"),
        "display_name": row.get::<String, _>("display_name"),
        "version": row.get::<String, _>("version"),
        "description": row.get::<Option<String>, _>("description"),
        "is_enabled": row.get::<bool, _>("is_enabled"),
        "installed_at": row.get::<chrono::DateTime<chrono::Utc>, _>("installed_at"),
        "settings_path": settings_path,
    })))
}

pub async fn toggle_module(
    State(state): State<AppState>,
    _admin: AdminUser,
    axum::extract::Path(id): axum::extract::Path<String>,
    Json(body): Json<serde_json::Value>,
) -> Result<Json<serde_json::Value>, AppError> {
    tracing::warn!(module_id = %id, "toggle_module appelé");
    let enabled = body
        .get("is_enabled")
        .and_then(|v| v.as_bool())
        .ok_or_else(|| AppError::Validation("Champ 'is_enabled' requis (bool)".into()))?;

    let affected = sqlx::query("UPDATE core.modules SET is_enabled = $1 WHERE id = $2")
        .bind(enabled)
        .bind(&id)
        .execute(&state.db)
        .await?
        .rows_affected();

    if affected == 0 {
        return Err(AppError::NotFound(format!("Module '{id}' introuvable")));
    }

    let mut also_disabled: Vec<String> = Vec::new();

    if !enabled {
        // Désactivation en cascade : trouver tous les modules qui dépendent de celui-ci.
        let dependents = find_all_dependents(&state.db, &id).await?;

        // Désactiver tous les dépendants en DB.
        for dep_id in &dependents {
            sqlx::query("UPDATE core.modules SET is_enabled = FALSE WHERE id = $1")
                .bind(dep_id).execute(&state.db).await?;
            sqlx::query("UPDATE core.module_instances SET status = 'stopped' WHERE module_id = $1")
                .bind(dep_id).execute(&state.db).await?;
            state.modules.write().await.unregister(dep_id);
            state.events.publish(crate::events::AppEvent::ModuleUnregistered { module_id: dep_id.clone() });
        }
        also_disabled = dependents;

        // Désactiver le module principal.
        state.modules.write().await.unregister(&id);
        sqlx::query("UPDATE core.module_instances SET status = 'stopped' WHERE module_id = $1")
            .bind(&id).execute(&state.db).await?;
        state.events.publish(crate::events::AppEvent::ModuleUnregistered { module_id: id });
    } else {
        // Activation : restaurer l'instance depuis la DB sans attendre le prochain heartbeat.
        let row = sqlx::query(
            "SELECT base_url, routes, sidebar_items, subscribed_events, registered_at \
             FROM core.module_instances WHERE module_id = $1 \
             ORDER BY registered_at DESC LIMIT 1"
        )
        .bind(&id)
        .fetch_optional(&state.db)
        .await?;

        if let Some(row) = row {
            let base_url: String = row.get("base_url");
            let instance = ActiveInstance {
                module_id:         id.clone(),
                base_url:          base_url.clone(),
                routes:            serde_json::from_value(row.get("routes")).unwrap_or_default(),
                sidebar_items:     serde_json::from_value(row.get("sidebar_items")).unwrap_or_default(),
                subscribed_events: row.get("subscribed_events"),
                registered_at:     row.get("registered_at"),
                last_heartbeat:    Utc::now(),
            };
            sqlx::query(
                "UPDATE core.module_instances SET status = 'healthy', last_heartbeat = NOW() \
                 WHERE module_id = $1"
            )
            .bind(&id).execute(&state.db).await?;
            state.modules.write().await.register(instance);
            state.events.publish(crate::events::AppEvent::ModuleRegistered {
                module_id: id,
                base_url,
            });
        }
        // Pas d'instance connue : le module se ré-enregistrera lui-même au prochain heartbeat.
    }

    Ok(Json(json!({
        "message":       if enabled { "Module activé" } else { "Module désactivé" },
        "also_disabled": also_disabled,
    })))
}

/// Retourne tous les modules qui dépendent directement ou indirectement de `module_id`.
/// Utilise une recherche BFS dans le graphe de dépendances.
async fn find_all_dependents(db: &sqlx::PgPool, module_id: &str) -> Result<Vec<String>, AppError> {
    // Charger toutes les dépendances en une seule requête pour éviter N+1.
    let rows = sqlx::query("SELECT id, dependencies FROM core.modules WHERE is_enabled = TRUE")
        .fetch_all(db)
        .await?;

    // Construire le graphe inversé : dep_id → [modules qui en dépendent]
    let mut reverse: HashMap<String, Vec<String>> = HashMap::new();
    for row in &rows {
        let id: String = row.get("id");
        let deps: Vec<String> = row.get("dependencies");
        for dep in deps {
            reverse.entry(dep).or_default().push(id.clone());
        }
    }

    // BFS depuis module_id
    let mut visited: std::collections::HashSet<String> = std::collections::HashSet::new();
    let mut queue: std::collections::VecDeque<String> = std::collections::VecDeque::new();
    queue.push_back(module_id.to_string());

    while let Some(current) = queue.pop_front() {
        if let Some(dependents) = reverse.get(&current) {
            for dep in dependents {
                if dep != module_id && !visited.contains(dep) {
                    visited.insert(dep.clone());
                    queue.push_back(dep.clone());
                }
            }
        }
    }

    Ok(visited.into_iter().collect())
}

pub async fn list_event_log(
    State(state): State<AppState>,
    _admin: AdminUser,
    axum::extract::Query(q): axum::extract::Query<HashMap<String, String>>,
) -> Result<Json<serde_json::Value>, AppError> {
    let limit: i64 = q.get("limit").and_then(|v| v.parse().ok()).unwrap_or(50).min(200);
    let offset: i64 = q.get("offset").and_then(|v| v.parse().ok()).unwrap_or(0);
    let event_type = q.get("event_type").map(|s| s.as_str());

    let rows = sqlx::query(
        r#"SELECT id, event_type, source_module, payload, created_at
           FROM core.event_log
           WHERE ($1::text IS NULL OR event_type = $1)
           ORDER BY created_at DESC
           LIMIT $2 OFFSET $3"#,
    )
    .bind(event_type)
    .bind(limit)
    .bind(offset)
    .fetch_all(&state.db)
    .await?;

    let data: Vec<_> = rows
        .into_iter()
        .map(|r| {
            use sqlx::Row;
            json!({
                "id": r.get::<i64, _>("id"),
                "event_type": r.get::<String, _>("event_type"),
                "source_module": r.get::<Option<String>, _>("source_module"),
                "payload": r.get::<serde_json::Value, _>("payload"),
                "created_at": r.get::<chrono::DateTime<chrono::Utc>, _>("created_at"),
            })
        })
        .collect();

    Ok(Json(json!({ "events": data, "limit": limit, "offset": offset })))
}
