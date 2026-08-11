use crate::{
    authz::{keys, AdminCtx},
    audit::{redact, redact::target, retention, AdminAudit, AuditEntry},
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
    ctx: AdminCtx,
) -> Result<Json<serde_json::Value>, AppError> {
    ctx.require(keys::SETTINGS_READ)?;
    // Module-owned settings (module_id set) are managed in their module's admin
    // view (Modules → module → settings); listing them here too was flooding the
    // general Settings tab with duplicates.
    //
    // The `mail` category is excluded for a stronger reason than tidiness: one
    // of its keys holds an AES-GCM blob, and this route returns raw values. It
    // is owned by `/admin/mail/settings`, which reports the credential as a
    // boolean and is the only writer that encrypts.
    let rows = sqlx::query(
        "SELECT key, value, category, label, description, is_public FROM core.settings \
         WHERE module_id IS NULL AND category <> 'mail' ORDER BY category, key"
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
    audit: AdminAudit,
    ctx: AdminCtx,
    Json(updates): Json<HashMap<String, Value>>,
) -> Result<Json<serde_json::Value>, AppError> {
    ctx.require(keys::SETTINGS_MANAGE)?;
    // The retention floor is validated before anything is written: a compromised
    // administrator must not be able to shrink the audit window at all, and
    // refusing outright (rather than clamping) tells the operator the floor
    // exists. The same rule is duplicated as a CHECK constraint in migration
    // 000040, which closes the direct-SQL path.
    if let Some(value) = updates.get(retention::RETENTION_SETTING_KEY) {
        retention::validate_retention(value)?;
    }

    // The relay settings are refused here, not silently ignored. Accepting
    // `mail.smtp_password` on this route would store whatever string was posted
    // *in clear* under a key the rest of the code reads as ciphertext — the
    // credential would then be unusable and readable at the same time. There is
    // exactly one writer, and it encrypts.
    if let Some(key) = updates.keys().find(|k| crate::handlers::admin::mail::owns_setting(k)) {
        return Err(AppError::Validation(format!(
            "'{key}' se règle depuis Administration → Courriel (PATCH /admin/mail/settings)"
        )));
    }

    // The authentication policy is refused here for the same reason, and for a
    // sharper one: this route writes `core.settings.value`, which the scope
    // resolver no longer reads. Accepting it would let an administrator believe
    // they had changed who may sign in while nothing had changed at all — and it
    // would step around the anti-lockout guard, which lives on the scoped route.
    if let Some(key) = updates
        .keys()
        .find(|k| k.as_str() == crate::auth::methods::KEY_METHODS
                || k.as_str() == crate::auth::methods::KEY_ADMIN_FALLBACK)
    {
        return Err(AppError::Validation(format!(
            "'{key}' se règle par portée depuis Administration → Sécurité → Authentification et SSO              (PUT /admin/settings/scoped/{key}), pour qu'il puisse varier par unité organisationnelle              et passer le garde-fou anti-verrouillage"
        )));
    }

    // Bounds declared by a module (`min`/`max` on an int) are enforced here and
    // not only in the console. The panel disables its Save button when a field
    // is out of range, but the panel is one caller among possible others, and a
    // knob that drives a listener's port or a retry delay has no business
    // accepting anything the wire happens to carry.
    validate_module_bounds(&state.db, &updates).await?;

    // Every key that is about to change is audited, including the retention
    // setting itself — the one an attacker would go for first.
    let mut tx = audit.begin(&state.db).await?;
    let admin_id = audit.admin.id;

    let mut entries: Vec<AuditEntry> = Vec::with_capacity(updates.len());

    for (key, value) in &updates {
        let previous: Option<Value> = sqlx::query_scalar(
            "SELECT value FROM core.settings WHERE key = $1 FOR UPDATE",
        )
        .bind(key)
        .fetch_optional(&mut *tx)
        .await
        .map_err(|e| { tracing::error!(error = %e, key = %key, "update_settings: lecture"); AppError::Database(e) })?;

        let Some(previous) = previous else {
            return Err(AppError::NotFound(format!("Setting '{key}' inexistant")));
        };

        sqlx::query(
            r#"UPDATE core.settings
               SET value = $1, updated_at = NOW(), updated_by = $2
               WHERE key = $3"#,
        )
        .bind(value)
        .bind(admin_id)
        .bind(key)
        .execute(&mut *tx)
        .await
        .map_err(|e| { tracing::error!(error = %e, key = %key, "update_settings: écriture"); AppError::Database(e) })?;

        entries.push(
            AuditEntry::new("core.settings.change")
                .target(target::SETTING, key, key.clone())
                .before(redact::setting(key, &previous))
                .after(redact::setting(key, value))
                .reversible(),
        );
    }

    // At least one entry is required to commit; an empty PATCH has nothing to
    // audit and nothing to change either.
    let Some(last) = entries.pop() else {
        return Ok(Json(json!({ "message": "Aucun paramètre à mettre à jour", "updated": 0 })));
    };
    for entry in entries {
        tx.also(entry);
    }
    tx.commit(last).await?;

    // Réglages appliqués à chaud (sans redémarrage).
    if updates.keys().any(|k| k.starts_with("security.ddos_")) {
        crate::auth::ddos::reload_from_db(&state.db).await;
    }

    // The health report is cached for a minute, and several of its checks read
    // settings written here. Invalidating unconditionally costs one extra
    // evaluation; not invalidating tells the operator their fix did not take.
    crate::health::invalidate();

    Ok(Json(json!({ "message": "Paramètres mis à jour", "updated": updates.len() })))
}

/// Checks every module-owned key of a settings PATCH against the declaration
/// its module pushed at registration.
///
/// The declaration lives in `core.modules.config` (whole manifest), so it is
/// loaded once per module touched by the request rather than once per key.
/// Keys owned by the core itself carry no such declaration and pass through.
async fn validate_module_bounds(
    db: &sqlx::PgPool,
    updates: &HashMap<String, Value>,
) -> Result<(), AppError> {
    use crate::handlers::modules::SettingDef;

    let keys: Vec<String> = updates.keys().cloned().collect();
    let owners: Vec<(String, Option<String>)> = sqlx::query_as(
        "SELECT key, module_id FROM core.settings WHERE key = ANY($1)",
    )
    .bind(&keys)
    .fetch_all(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, "update_settings: propriétaires des réglages");
        AppError::Database(e)
    })?;

    let mut schemas: HashMap<String, Vec<SettingDef>> = HashMap::new();
    for (full_key, module_id) in owners {
        let Some(module_id) = module_id else { continue };
        let Some(value) = updates.get(&full_key) else { continue };
        if !schemas.contains_key(&module_id) {
            let schema = crate::handlers::modules::load_settings_schema(db, &module_id).await?;
            schemas.insert(module_id.clone(), schema);
        }
        // The stored key is `<module>.<key>`; the declaration is relative.
        let short = full_key
            .strip_prefix(&format!("{module_id}."))
            .unwrap_or(&full_key);
        if let Some(def) = schemas
            .get(&module_id)
            .and_then(|defs| defs.iter().find(|d| d.key == short))
        {
            def.validate_value(value)?;
        }
    }
    Ok(())
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
    ctx: AdminCtx,
) -> Result<Json<serde_json::Value>, AppError> {
    ctx.require(keys::MODULES_READ)?;
    // Internal infrastructure modules (e.g. stt) are registered for routing but
    // hidden from the admin module list.
    let modules = sqlx::query(
        "SELECT id, display_name, version, description, is_enabled, installed_at, config FROM core.modules WHERE is_core_module = FALSE ORDER BY display_name"
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
            // The pages this module's admin surface is split into. Served with
            // the inventory ON PURPOSE: the console's navigation tree grafts
            // every module's groups under it, and doing that from a per-module
            // request would mean one round trip per installed module just to
            // draw a menu.
            let groups = crate::handlers::modules::setting_groups_from_config(Some(&config));
            json!({
                "id": m.get::<String, _>("id"),
                "icon": crate::handlers::modules::module_icon_from_config(Some(&config)),
                "display_name": m.get::<String, _>("display_name"),
                "version": m.get::<String, _>("version"),
                "description": m.get::<Option<String>, _>("description"),
                "is_enabled": m.get::<bool, _>("is_enabled"),
                "installed_at": m.get::<chrono::DateTime<chrono::Utc>, _>("installed_at"),
                "settings_path": settings_path,
                "setting_groups": groups,
            })
        })
        .collect();

    Ok(Json(json!({ "modules": data })))
}

pub async fn get_admin_module(
    State(state): State<AppState>,
    _admin: AdminUser,
    ctx: AdminCtx,
    axum::extract::Path(id): axum::extract::Path<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    ctx.require(keys::MODULES_READ)?;
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
    let groups = crate::handlers::modules::setting_groups_from_config(Some(&config));

    Ok(Json(json!({
        "id": row.get::<String, _>("id"),
        "display_name": row.get::<String, _>("display_name"),
        "version": row.get::<String, _>("version"),
        "description": row.get::<Option<String>, _>("description"),
        "is_enabled": row.get::<bool, _>("is_enabled"),
        "installed_at": row.get::<chrono::DateTime<chrono::Utc>, _>("installed_at"),
        "settings_path": settings_path,
        "setting_groups": groups,
        "icon": crate::handlers::modules::module_icon_from_config(Some(&config)),
    })))
}

pub async fn toggle_module(
    State(state): State<AppState>,
    audit: AdminAudit,
    ctx: AdminCtx,
    axum::extract::Path(id): axum::extract::Path<String>,
    Json(body): Json<serde_json::Value>,
) -> Result<Json<serde_json::Value>, AppError> {
    ctx.require(keys::MODULES_MANAGE)?;
    tracing::warn!(module_id = %id, "toggle_module appelé");
    let enabled = body
        .get("is_enabled")
        .and_then(|v| v.as_bool())
        .ok_or_else(|| AppError::Validation("Champ 'is_enabled' requis (bool)".into()))?;

    // Only the flag flip is transactional-with-audit; the cascade below drives
    // the in-memory registry and the event bus, which no transaction can roll
    // back anyway.
    let mut tx = audit.begin(&state.db).await?;

    let previous: Option<(String, String, bool)> = sqlx::query_as(
        "SELECT display_name, version, is_enabled FROM core.modules WHERE id = $1 FOR UPDATE",
    )
    .bind(&id)
    .fetch_optional(&mut *tx)
    .await
    .map_err(|e| { tracing::error!(error = %e, module_id = %id, "toggle_module: lecture"); AppError::Database(e) })?;

    let Some((display_name, version, was_enabled)) = previous else {
        return Err(AppError::NotFound(format!("Module '{id}' introuvable")));
    };

    sqlx::query("UPDATE core.modules SET is_enabled = $1 WHERE id = $2")
        .bind(enabled)
        .bind(&id)
        .execute(&mut *tx)
        .await
        .map_err(|e| { tracing::error!(error = %e, module_id = %id, "toggle_module: écriture"); AppError::Database(e) })?;

    let module_snap = |is_enabled: bool| {
        redact::snapshot(
            target::MODULE,
            &json!({
                "id": &id, "display_name": &display_name,
                "version": &version, "is_enabled": is_enabled,
            }),
        )
    };
    tx.commit(
        AuditEntry::new(if enabled { "core.modules.enable" } else { "core.modules.disable" })
            .target(target::MODULE, &id, display_name.clone())
            .before(module_snap(was_enabled))
            .after(module_snap(enabled))
            .reversible(),
    )
    .await?;

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
    ctx: AdminCtx,
    axum::extract::Query(q): axum::extract::Query<HashMap<String, String>>,
) -> Result<Json<serde_json::Value>, AppError> {
    ctx.require(keys::AUDIT_READ)?;
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
