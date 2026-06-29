use crate::{
    auth::middleware::{AuthUser, InternalRequest},
    errors::AppError,
    events::AppEvent,
    modules::registry::{ActiveInstance, ModuleRoute, SidebarItem},
    state::AppState,
};
use axum::{
    body::Body,
    extract::{Path as AxumPath, State},
    http::{header, HeaderValue, StatusCode},
    response::Response,
    Json,
};
use chrono::Utc;
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::collections::HashMap;

#[utoipa::path(
    get,
    path = "/api/v1/modules",
    tag = "modules",
    responses((status = 200, description = "Modules actifs et leurs routes/points d'entrée (public, sert la découverte des clients)"))
)]
pub async fn list_modules(
    State(state): State<AppState>,
) -> Result<Json<serde_json::Value>, AppError> {
    let modules_dir = state.settings.server.modules_dir.clone();
    let registry = state.modules.read().await;
    let modules: Vec<_> = registry
        .all()
        .into_iter()
        .map(|i| {
            // Bundle frontend du module (chargé à l'exécution par le host). Présent
            // seulement si le module a déposé son UI buildée dans <dir>/<id>/frontend/.
            // Les modules sans UI (ou non migrés vers le plugin runtime) renvoient null.
            let entry = std::path::Path::new(&modules_dir)
                .join(&i.module_id)
                .join("frontend")
                .join("entry.js");
            let frontend_entry = entry
                .is_file()
                .then(|| format!("/modules/{}/entry.js", i.module_id));
            json!({
                "module_id": i.module_id,
                "base_url": i.base_url,
                "sidebar_items": i.sidebar_items,
                "frontend_entry": frontend_entry,
                "registered_at": i.registered_at,
                "last_heartbeat": i.last_heartbeat,
            })
        })
        .collect();

    Ok(Json(json!({ "modules": modules })))
}

/// Sert un asset statique du bundle frontend d'un module :
/// `GET /modules/<id>/frontend/<chemin>` -> `<modules_dir>/<id>/frontend/<chemin>`.
///
/// Aucune connaissance des modules dans le core : convention de dossier pure
/// (façon « extension PHP »). Un module tiers dépose son UI buildée, le core la
/// sert. Restreint au sous-dossier `frontend/` et protégé contre la traversée.
pub async fn serve_module_asset(
    State(state): State<AppState>,
    AxumPath((module_id, asset_path)): AxumPath<(String, String)>,
) -> Result<Response, AppError> {
    if module_id.is_empty()
        || !module_id.chars().all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_')
    {
        return Err(AppError::NotFound("module".into()));
    }
    // Anti-traversée : aucun segment vide ni `..`.
    if asset_path
        .split('/')
        .any(|seg| seg.is_empty() || seg == "." || seg == "..")
    {
        return Err(AppError::NotFound("asset".into()));
    }

    let full = std::path::Path::new(&state.settings.server.modules_dir)
        .join(&module_id)
        .join("frontend")
        .join(&asset_path);

    let data = tokio::fs::read(&full)
        .await
        .map_err(|_| AppError::NotFound("asset".into()))?;

    let content_type = match asset_path.rsplit('.').next() {
        Some("js") | Some("mjs") => "text/javascript; charset=utf-8",
        Some("css")              => "text/css; charset=utf-8",
        Some("svg")              => "image/svg+xml",
        Some("json") | Some("map") => "application/json; charset=utf-8",
        Some("woff2")            => "font/woff2",
        Some("woff")             => "font/woff",
        Some("png")              => "image/png",
        Some("jpg") | Some("jpeg") => "image/jpeg",
        Some("webp")             => "image/webp",
        Some("wasm")             => "application/wasm",
        _                        => "application/octet-stream",
    };

    let mut resp = Response::new(Body::from(data));
    resp.headers_mut()
        .insert(header::CONTENT_TYPE, HeaderValue::from_static(content_type));
    Ok(resp)
}

#[derive(Deserialize)]
pub struct RegisterModuleDto {
    pub module_id:         String,
    pub display_name:      Option<String>,
    pub description:       Option<String>,
    pub base_url:          String,
    pub routes:            Vec<ModuleRoute>,
    pub sidebar_items:     Vec<SidebarItem>,
    pub subscribed_events: Vec<String>,
    pub version:           String,
    pub settings_path:     Option<String>,
    /// Commandes CLI offertes par le module.
    /// Format : [{ "name": "files:upload", "description": "...", "usage": "..." }]
    #[serde(default)]
    pub cli_commands:      Vec<serde_json::Value>,
    /// Outils MCP exposés par le module.
    /// Format : [{ "name", "description", "input_schema", "route", "method" }]
    #[serde(default)]
    pub mcp_tools:         Vec<serde_json::Value>,
    /// Schéma déclaratif des paramètres du module (manifeste `[[settings]]`).
    /// Le core sème les portées `global`/`overridable` dans core.settings et
    /// résout la valeur effective (override utilisateur ?? défaut global).
    #[serde(default)]
    pub settings_schema:   Vec<SettingDef>,
    /// Module d'infrastructure interne (ex. stt) : enregistré pour le routage,
    /// mais masqué de la liste des modules de l'administration.
    #[serde(default)]
    pub internal:          bool,
}

/// Une déclaration de paramètre poussée par un module à l'enregistrement.
/// `key` est relatif au module (sans préfixe) ; le core le stocke sous
/// `<module_id>.<key>` dans core.settings.
#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct SettingDef {
    pub key:         String,
    /// "global" (admin only), "user" (par utilisateur), "overridable"
    /// (défaut global surchargeable par l'utilisateur).
    pub scope:       String,
    /// "bool" | "int" | "string" | "enum"
    #[serde(rename = "type")]
    pub value_type:  String,
    /// Domaine des valeurs autorisées pour `type = "enum"`.
    #[serde(default)]
    pub values:      Option<Vec<serde_json::Value>>,
    /// Valeur par défaut (sortie d'usine).
    pub default:     serde_json::Value,
    #[serde(default)]
    pub label:       Option<String>,
    #[serde(default)]
    pub description: Option<String>,
    /// Sous-catégorie d'affichage (sinon = module_id).
    #[serde(default)]
    pub category:    Option<String>,
    /// Exposé dans /api/v1/config public (is_public).
    #[serde(default)]
    pub public:      bool,
}

const VALID_SCOPES:      &[&str] = &["global", "user", "overridable"];
const VALID_VALUE_TYPES: &[&str] = &["bool", "int", "string", "enum"];

const RESERVED_MODULE_IDS: &[&str] = &[
    "admin", "auth", "me", "config", "modules", "ws", "health", "ready",
    "internal", "api", "static", "assets",
];

fn validate_module_id(id: &str) -> Result<(), AppError> {
    if id.is_empty() || id.len() > 50 {
        return Err(AppError::Validation("module_id: 1-50 caractères".into()));
    }
    if !id.chars().all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_') {
        return Err(AppError::Validation(
            "module_id: uniquement lettres, chiffres, tirets et underscores".into(),
        ));
    }
    if RESERVED_MODULE_IDS.contains(&id) {
        return Err(AppError::Validation(format!(
            "L'identifiant '{id}' est réservé par le core"
        )));
    }
    Ok(())
}

pub async fn register_module(
    State(state): State<AppState>,
    _internal: InternalRequest,
    Json(dto): Json<RegisterModuleDto>,
) -> Result<impl axum::response::IntoResponse, AppError> {
    validate_module_id(&dto.module_id)?;

    // Première inscription : is_enabled = TRUE (le module est actif par défaut).
    // Sur ON CONFLICT, is_enabled n'est PAS mis à jour — l'admin garde le contrôle.
    let display_name = dto.display_name.as_deref().unwrap_or(&dto.module_id);
    // The full settings manifest (every scope) is kept durably in core.modules.config
    // so the user-settings page can render even when the module process is down.
    let config = serde_json::json!({
        "settings_path":   dto.settings_path,
        "settings_schema": dto.settings_schema,
    });
    let cli_commands = serde_json::Value::Array(dto.cli_commands.clone());
    sqlx::query(
        r#"INSERT INTO core.modules (id, display_name, description, version, runtime, is_enabled, config, cli_commands, is_core_module)
           VALUES ($1, $2, $3, $4, 'rust', TRUE, $5, $6, $7)
           ON CONFLICT (id) DO UPDATE
               SET version        = EXCLUDED.version,
                   display_name   = EXCLUDED.display_name,
                   description    = EXCLUDED.description,
                   config         = EXCLUDED.config,
                   cli_commands   = EXCLUDED.cli_commands,
                   is_core_module = core.modules.is_core_module OR EXCLUDED.is_core_module,
                   updated_at     = NOW()"#,
    )
    .bind(&dto.module_id)
    .bind(display_name)
    .bind(dto.description.as_deref())
    .bind(&dto.version)
    .bind(&config)
    .bind(&cli_commands)
    .bind(dto.internal)
    .execute(&state.db)
    .await?;

    // Vérifier si le module est activé — FALSE uniquement si l'admin l'a désactivé après coup
    let is_enabled: bool = sqlx::query_scalar(
        "SELECT is_enabled FROM core.modules WHERE id = $1",
    )
    .bind(&dto.module_id)
    .fetch_one(&state.db)
    .await?;

    if !is_enabled {
        tracing::info!(module_id = %dto.module_id, "Module désactivé, enregistrement refusé");
        return Err(AppError::Forbidden);
    }

    let now = Utc::now();
    let instance = ActiveInstance {
        module_id:         dto.module_id.clone(),
        base_url:          dto.base_url.clone(),
        routes:            dto.routes,
        sidebar_items:     dto.sidebar_items,
        subscribed_events: dto.subscribed_events,
        registered_at:     now,
        last_heartbeat:    now,
    };

    // Remplace l'instance précédente du module (un seul processus actif à la fois)
    let mut tx = state.db.begin().await?;
    sqlx::query("DELETE FROM core.module_instances WHERE module_id = $1")
        .bind(&dto.module_id)
        .execute(&mut *tx)
        .await?;
    sqlx::query(
        r#"INSERT INTO core.module_instances
           (module_id, base_url, routes, sidebar_items, subscribed_events, mcp_tools, status, pid, registered_at)
           VALUES ($1, $2, $3, $4, $5, $6, 'healthy', NULL, NOW())"#,
    )
    .bind(&dto.module_id)
    .bind(&dto.base_url)
    .bind(serde_json::to_value(&instance.routes).unwrap_or_default())
    .bind(serde_json::to_value(&instance.sidebar_items).unwrap_or_default())
    .bind(&instance.subscribed_events)
    .bind(serde_json::Value::Array(dto.mcp_tools.clone()))
    .execute(&mut *tx)
    .await?;

    // Seed instance-level settings (scope global|overridable) into core.settings so
    // the admin edits them through the existing /admin/settings surface. The value
    // column is preserved on conflict (an admin-set value is never clobbered by a
    // re-registration); only metadata and the factory default are refreshed.
    for def in &dto.settings_schema {
        if !VALID_SCOPES.contains(&def.scope.as_str()) {
            tracing::warn!(module_id = %dto.module_id, key = %def.key, scope = %def.scope,
                "Paramètre ignoré : portée invalide");
            continue;
        }
        if !VALID_VALUE_TYPES.contains(&def.value_type.as_str()) {
            tracing::warn!(module_id = %dto.module_id, key = %def.key, value_type = %def.value_type,
                "Paramètre ignoré : type invalide");
            continue;
        }
        // User-only settings live in core.users.preferences, not core.settings.
        if def.scope == "user" {
            continue;
        }
        let full_key = format!("{}.{}", dto.module_id, def.key);
        let category = def.category.clone().unwrap_or_else(|| dto.module_id.clone());
        let allowed  = def.values.clone().map(serde_json::Value::Array);
        sqlx::query(
            r#"INSERT INTO core.settings
                   (key, value, default_value, category, label, description, is_public,
                    scope, value_type, allowed_values, module_id)
               VALUES ($1, $2, $2, $3, $4, $5, $6, $7, $8, $9, $10)
               ON CONFLICT (key) DO UPDATE SET
                   default_value  = EXCLUDED.default_value,
                   category       = EXCLUDED.category,
                   label          = EXCLUDED.label,
                   description    = EXCLUDED.description,
                   is_public      = EXCLUDED.is_public,
                   scope          = EXCLUDED.scope,
                   value_type     = EXCLUDED.value_type,
                   allowed_values = EXCLUDED.allowed_values,
                   module_id      = EXCLUDED.module_id"#,
        )
        .bind(&full_key)
        .bind(&def.default)
        .bind(&category)
        .bind(def.label.as_deref())
        .bind(def.description.as_deref())
        .bind(def.public)
        .bind(&def.scope)
        .bind(&def.value_type)
        .bind(allowed.as_ref())
        .bind(&dto.module_id)
        .execute(&mut *tx)
        .await?;
    }

    tx.commit().await?;

    state.modules.write().await.register(instance);

    state.events.publish(AppEvent::ModuleRegistered {
        module_id: dto.module_id.clone(),
        base_url:  dto.base_url,
    });

    Ok((StatusCode::CREATED, Json(json!({ "message": "Module enregistré" }))))
}

/// GET /api/v1/modules/:module/config
///
/// Renvoie, pour l'utilisateur courant, le schéma des paramètres du module et leur
/// résolution : valeur globale (instance), surcharge utilisateur, et valeur
/// **effective** (override ?? défaut global ?? défaut d'usine). Filtré par rôle :
/// un non-admin ne voit pas les paramètres de portée `global` (réservés admin).
pub async fn get_module_config(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
    AxumPath(module_id): AxumPath<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    use sqlx::Row;

    // 1. Schéma déclaré (durable, lu depuis core.modules.config).
    let config: Option<serde_json::Value> = sqlx::query_scalar(
        "SELECT config FROM core.modules WHERE id = $1",
    )
    .bind(&module_id)
    .fetch_optional(&state.db)
    .await?;

    let schema: Vec<SettingDef> = config
        .as_ref()
        .and_then(|c| c.get("settings_schema"))
        .and_then(|s| serde_json::from_value(s.clone()).ok())
        .unwrap_or_default();

    // 2. Valeurs d'instance (global + overridable) depuis core.settings.
    let rows = sqlx::query(
        "SELECT key, value FROM core.settings WHERE module_id = $1",
    )
    .bind(&module_id)
    .fetch_all(&state.db)
    .await?;
    let mut global_values: HashMap<String, serde_json::Value> = HashMap::new();
    for r in rows {
        global_values.insert(r.get::<String, _>("key"), r.get::<serde_json::Value, _>("value"));
    }

    // 3. Surcharges de l'utilisateur (core.users.preferences[module_id]).
    let user_prefs = user
        .preferences
        .get(&module_id)
        .cloned()
        .unwrap_or(serde_json::Value::Null);

    let is_admin = user.role == "admin";
    let mut out: Vec<serde_json::Value> = Vec::new();

    for def in &schema {
        // Les non-admins ne voient pas les paramètres purement globaux.
        if def.scope == "global" && !is_admin {
            continue;
        }
        let full_key = format!("{}.{}", module_id, def.key);
        let global = global_values.get(&full_key).cloned();
        // A stored JSON null means "no override" (the user reverted to the instance
        // default), so it must not shadow the global value.
        let user_val = user_prefs
            .get(&def.key)
            .filter(|v| !v.is_null())
            .cloned();

        let effective = match def.scope.as_str() {
            "user" => user_val.clone().unwrap_or_else(|| def.default.clone()),
            "overridable" => user_val
                .clone()
                .or_else(|| global.clone())
                .unwrap_or_else(|| def.default.clone()),
            _ /* global */ => global.clone().unwrap_or_else(|| def.default.clone()),
        };

        out.push(json!({
            "key":              def.key,
            "scope":            def.scope,
            "type":             def.value_type,
            "values":           def.values,
            "label":            def.label,
            "description":      def.description,
            "category":         def.category.clone().unwrap_or_else(|| module_id.clone()),
            "default":          def.default,
            "global":           global,
            "user":             user_val,
            "effective":        effective,
            "editable_by_user": def.scope == "user" || def.scope == "overridable",
        }));
    }

    Ok(Json(json!({ "module": module_id, "settings": out })))
}

pub async fn module_heartbeat(
    State(state): State<AppState>,
    _internal: InternalRequest,
    axum::extract::Path(module_id): axum::extract::Path<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    let found = state.modules.write().await.update_heartbeat(&module_id);
    if found {
        Ok(Json(json!({ "ok": true })))
    } else {
        Err(AppError::NotFound(format!("Module '{module_id}' non enregistré")))
    }
}

pub async fn unregister_module(
    State(state): State<AppState>,
    _internal: InternalRequest,
    axum::extract::Path(module_id): axum::extract::Path<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    state.modules.write().await.unregister(&module_id);
    crate::modules::manager::mark_stopped(&state.db, &module_id).await?;
    state.events.publish(AppEvent::ModuleUnregistered { module_id });
    Ok(Json(json!({ "message": "Module désenregistré" })))
}

pub async fn publish_event(
    State(state): State<AppState>,
    _internal: InternalRequest,
    Json(event): Json<AppEvent>,
) -> Result<Json<serde_json::Value>, AppError> {
    state.events.publish_and_log(event, &state.db).await;
    Ok(Json(json!({ "ok": true })))
}

#[derive(Deserialize)]
pub struct ModuleLogEntry {
    pub level:   String,
    pub message: String,
    #[serde(default)]
    pub fields:  serde_json::Value,
}

/// Permet à un module d'écrire dans les logs du core (access.log / error.log).
///
/// WARN et ERROR sont routés vers error.log, INFO/DEBUG vers stdout uniquement.
/// Le module_id apparaît dans chaque ligne comme champ structuré.
pub async fn module_log(
    State(_state): State<AppState>,
    _internal: InternalRequest,
    axum::extract::Path(module_id): axum::extract::Path<String>,
    Json(entry): Json<ModuleLogEntry>,
) -> Result<Json<serde_json::Value>, AppError> {
    // target "module" est capturé par le filtre error.log pour WARN/ERROR
    match entry.level.as_str() {
        "error" => tracing::error!(target: "module", module = %module_id, fields = %entry.fields, "{}", entry.message),
        "warn"  => tracing::warn!(target: "module",  module = %module_id, fields = %entry.fields, "{}", entry.message),
        "debug" => tracing::debug!(target: "module", module = %module_id, fields = %entry.fields, "{}", entry.message),
        "trace" => tracing::trace!(target: "module", module = %module_id, fields = %entry.fields, "{}", entry.message),
        _       => tracing::info!(target: "module",  module = %module_id, fields = %entry.fields, "{}", entry.message),
    }
    Ok(Json(json!({ "ok": true })))
}
