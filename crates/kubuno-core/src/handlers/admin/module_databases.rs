//! Admin console: point a module at its own database engine/server.
//!
//! By default every module inherits the core's own database (its engine and
//! credentials are injected by the supervisor). These endpoints let a
//! superadministrator store a per-module override in `core.module_databases`,
//! test the connection with the same engine-aware probe the install wizard uses,
//! and restart the module so it reconnects (and self-migrates) on the new
//! target.
//!
//! The override password is encrypted at rest with the module-database key
//! (`crate::modules::db_config`) and is never returned in a response.

use crate::{
    authz::AdminCtx,
    auth::middleware::AdminUser,
    config::DbCredentials,
    errors::AppError,
    modules::db_config,
    state::AppState,
};
use axum::{
    extract::{Path, State},
    response::Response,
    Json,
};
use kubuno_db::{params, Backend, DbPool};
use serde::Deserialize;
use serde_json::{json, Value};

/// The engines an override may target. Kept in sync with `kubuno_db::Backend`.
const ENGINES: [&str; 3] = ["postgres", "mysql", "sqlite"];

/// What the admin panel submits. Mirrors the install wizard's fields so the same
/// form component drives both.
#[derive(Deserialize)]
pub struct ModuleDbDto {
    /// `postgres` | `mysql` | `sqlite`.
    engine:        String,
    #[serde(default)]
    host:          String,
    #[serde(default)]
    port:          Option<u16>,
    #[serde(default)]
    user:          String,
    /// The new password. Absent/omitted keeps the stored one on an update; an
    /// explicit empty string clears it.
    #[serde(default)]
    password:      Option<String>,
    #[serde(default)]
    database:      String,
    #[serde(default)]
    path:          Option<String>,
    #[serde(default)]
    schema_prefix: Option<String>,
    /// `false` keeps the row but makes the module inherit again.
    #[serde(default = "default_true")]
    enabled:       bool,
}

fn default_true() -> bool {
    true
}

/// A bare SQL identifier we are willing to interpolate into `CREATE SCHEMA` /
/// `CREATE DATABASE` (no bind parameters there). Lowercase, digits and `_`,
/// never leading with a digit.
fn is_bare_ident(s: &str) -> bool {
    !s.is_empty()
        && s.len() <= 64
        && s.bytes().all(|b| b.is_ascii_lowercase() || b.is_ascii_digit() || b == b'_')
        && !s.as_bytes()[0].is_ascii_digit()
}

/// Mirrors `kubuno_db::SchemaPrefix`: empty (none) or `^[a-z0-9_]{1,32}$`.
fn schema_prefix_is_valid(p: &str) -> bool {
    p.is_empty()
        || (p.len() <= 32 && p.bytes().all(|b| b.is_ascii_lowercase() || b.is_ascii_digit() || b == b'_'))
}

fn validate(dto: &ModuleDbDto) -> Result<(), AppError> {
    if !ENGINES.contains(&dto.engine.as_str()) {
        return Err(AppError::Validation(format!("Moteur inconnu : {}", dto.engine)));
    }
    let prefix = dto.schema_prefix.as_deref().unwrap_or("").trim();
    if !schema_prefix_is_valid(prefix) {
        return Err(AppError::Validation(
            "Préfixe de schéma invalide : minuscules, chiffres et « _ » uniquement, 32 max.".into(),
        ));
    }
    match Backend::parse(&dto.engine) {
        Some(Backend::Sqlite) => {}
        _ => {
            if dto.host.trim().is_empty() {
                return Err(AppError::Validation("L'hôte de la base est requis.".into()));
            }
            if dto.user.trim().is_empty() {
                return Err(AppError::Validation("L'utilisateur de la base est requis.".into()));
            }
        }
    }
    Ok(())
}

/// The current row (if any), decoded but WITHOUT the password.
async fn load_row(db: &DbPool, module_id: &str) -> Result<Option<db_config::ModuleDbRow>, AppError> {
    Ok(db
        .fetch_optional_as::<db_config::ModuleDbRow>(
            "SELECT module_id, engine, host, port, db_user, password_enc, db_name, db_path, \
                    schema_prefix, enabled \
             FROM core.module_databases WHERE module_id = $1",
            params![module_id],
        )
        .await?)
}

async fn module_exists(db: &DbPool, module_id: &str) -> Result<bool, AppError> {
    let found = db
        .fetch_optional_row(
            "SELECT id FROM core.modules WHERE id = $1",
            params![module_id],
        )
        .await?;
    Ok(found.is_some())
}

/// GET — the module's current override (no secret) plus what it inherits.
pub async fn get_module_database(
    State(state): State<AppState>,
    _admin: AdminUser,
    ctx: AdminCtx,
    Path(id): Path<String>,
) -> Result<Json<Value>, AppError> {
    ctx.require_superuser("gestion de la base de données d'un module")?;
    if !module_exists(&state.db, &id).await? {
        return Err(AppError::NotFound(format!("Module '{id}' introuvable")));
    }

    let inherited_engine = state.settings.database.engine.clone();
    let row = load_row(&state.db, &id).await?;

    let override_json = row.map(|r| {
        json!({
            "engine":        r.engine,
            "host":          r.host,
            "port":          if r.port <= 0 { Value::Null } else { json!(r.port) },
            "user":          r.db_user,
            // Never the secret — only whether one is stored.
            "has_password":  !r.password_enc.is_empty(),
            "database":      r.db_name,
            "path":          r.db_path,
            "schema_prefix": r.schema_prefix,
            "enabled":       r.enabled,
        })
    });

    Ok(Json(json!({
        "module_id":        id,
        "inherited_engine": inherited_engine,
        "engines":          ENGINES,
        "override":         override_json,
    })))
}

/// Builds the credentials an override describes, for a connection test or a
/// pre-flight schema creation. `password` is the plaintext to use.
fn credentials_from_dto(dto: &ModuleDbDto, password: String) -> DbCredentials {
    let default_port = match Backend::parse(&dto.engine) {
        Some(Backend::MySql) => 3306,
        _ => 5432,
    };
    DbCredentials {
        engine:   dto.engine.clone(),
        host:     dto.host.trim().to_string(),
        port:     dto.port.unwrap_or(default_port),
        user:     dto.user.trim().to_string(),
        password,
        database: dto.database.trim().to_string(),
        path:     dto.path.clone().unwrap_or_default(),
    }
}

/// Best-effort pre-flight: prove the credentials can create the module's schema
/// (PostgreSQL) or database (MySQL), or that the SQLite directory is writable.
/// The module runs the authoritative `ensure_schema` + migrations at boot; this
/// only turns a bad credential into an immediate, clear error at save time.
async fn ensure_target(
    creds: &DbCredentials,
    prefix: Option<&str>,
    module_schema: &str,
) -> Result<(), String> {
    use std::time::Duration;
    let eff = match prefix {
        Some(p) if !p.is_empty() => format!("{p}{module_schema}"),
        _ => module_schema.to_string(),
    };
    match Backend::parse(&creds.engine) {
        Some(Backend::Postgres) => {
            use sqlx::postgres::{PgConnectOptions, PgPoolOptions};
            if creds.database.is_empty() {
                return Err("Nom de base PostgreSQL requis.".into());
            }
            let opts = PgConnectOptions::new()
                .host(&creds.host)
                .port(creds.port)
                .username(&creds.user)
                .password(&creds.password)
                .database(&creds.database);
            let pool = PgPoolOptions::new()
                .max_connections(1)
                .acquire_timeout(Duration::from_secs(8))
                .connect_with(opts)
                .await
                .map_err(|e| format!("Connexion impossible : {e}"))?;
            // `eff` is a validated bare identifier (see `is_bare_ident`), so the
            // interpolation is safe — attested to the sqlx guard with
            // `AssertSqlSafe`. CREATE SCHEMA takes no bind parameters.
            let res = if is_bare_ident(&eff) {
                sqlx::query(sqlx::AssertSqlSafe(format!("CREATE SCHEMA IF NOT EXISTS \"{eff}\"")))
                    .execute(&pool)
                    .await
                    .map(|_| ())
                    .map_err(|e| format!("Création du schéma « {eff} » refusée : {e}"))
            } else {
                Ok(())
            };
            pool.close().await;
            res
        }
        Some(Backend::MySql) => {
            use sqlx::mysql::{MySqlConnectOptions, MySqlPoolOptions};
            let opts = MySqlConnectOptions::new()
                .host(&creds.host)
                .port(creds.port)
                .username(&creds.user)
                .password(&creds.password);
            let pool = MySqlPoolOptions::new()
                .max_connections(1)
                .acquire_timeout(Duration::from_secs(8))
                .connect_with(opts)
                .await
                .map_err(|e| format!("Connexion impossible : {e}"))?;
            // `eff` is a validated bare identifier; attested to the sqlx guard.
            let res = if is_bare_ident(&eff) {
                sqlx::query(sqlx::AssertSqlSafe(format!("CREATE DATABASE IF NOT EXISTS `{eff}`")))
                    .execute(&pool)
                    .await
                    .map(|_| ())
                    .map_err(|e| format!("Création de la base « {eff} » refusée : {e}"))
            } else {
                Ok(())
            };
            pool.close().await;
            res
        }
        Some(Backend::Sqlite) => {
            let dir = if creds.path.trim().is_empty() {
                "/var/lib/kubuno/db".to_string()
            } else {
                creds.path.trim().to_string()
            };
            std::fs::create_dir_all(&dir).map_err(|e| format!("Répertoire inaccessible « {dir} » : {e}"))?;
            let probe = std::path::Path::new(&dir).join(".kubuno-write-probe");
            std::fs::File::create(&probe)
                .map_err(|e| format!("Le répertoire « {dir} » n'est pas accessible en écriture : {e}"))?;
            let _ = std::fs::remove_file(&probe);
            Ok(())
        }
        None => Err(format!("Moteur inconnu : {}", creds.engine)),
    }
}

/// POST /test — engine-aware connection probe, reusing the install wizard's
/// logic. Returns its JSON verbatim (version / database_missing / can_create…).
pub async fn test_module_database(
    State(state): State<AppState>,
    _admin: AdminUser,
    ctx: AdminCtx,
    Path(id): Path<String>,
    Json(dto): Json<ModuleDbDto>,
) -> Result<Response, AppError> {
    ctx.require_superuser("test de la base de données d'un module")?;
    if !module_exists(&state.db, &id).await? {
        return Err(AppError::NotFound(format!("Module '{id}' introuvable")));
    }
    validate(&dto)?;

    // For a test, resolve the password to probe with: the submitted one, or the
    // stored one when the field was left untouched on an existing override.
    let password = match &dto.password {
        Some(p) => p.clone(),
        None => match load_row(&state.db, &id).await? {
            Some(r) => db_config::decrypt_password(&state.settings.auth.jwt_secret, &r.password_enc)
                .map_err(AppError::Internal)?,
            None => String::new(),
        },
    };

    let form = json!({
        "engine":        dto.engine,
        "host":          dto.host,
        "port":          dto.port,
        "user":          dto.user,
        "password":      password,
        // On MySQL the module's database is its schema name, not this field; on
        // PostgreSQL it is the physical database. Passing the module id keeps the
        // probe meaningful on MySQL and harmless on the others.
        "database":      if dto.database.trim().is_empty() { id.clone() } else { dto.database.trim().to_string() },
        "schema_prefix": dto.schema_prefix,
        "path":          dto.path,
    });
    let db_form: crate::setup::handlers::DbForm =
        serde_json::from_value(form).map_err(|e| AppError::Internal(e.into()))?;
    Ok(crate::setup::handlers::run_db_test(db_form).await)
}

/// PUT — store (or update) the override, verify the target, and restart the
/// module so it reconnects on it.
pub async fn put_module_database(
    State(state): State<AppState>,
    _admin: AdminUser,
    ctx: AdminCtx,
    Path(id): Path<String>,
    Json(dto): Json<ModuleDbDto>,
) -> Result<Json<Value>, AppError> {
    ctx.require_superuser("gestion de la base de données d'un module")?;
    if !module_exists(&state.db, &id).await? {
        return Err(AppError::NotFound(format!("Module '{id}' introuvable")));
    }
    validate(&dto)?;

    // Resolve the plaintext password: the new one, or the stored one when the
    // caller left it untouched.
    let existing = load_row(&state.db, &id).await?;
    let password = match &dto.password {
        Some(p) => p.clone(),
        None => match &existing {
            Some(r) => db_config::decrypt_password(&state.settings.auth.jwt_secret, &r.password_enc)
                .map_err(AppError::Internal)?,
            None => String::new(),
        },
    };

    // Verify the target BEFORE storing, so a bad credential is rejected with a
    // clear message instead of leaving the module in a crash loop.
    if dto.enabled {
        let creds = credentials_from_dto(&dto, password.clone());
        let prefix = dto.schema_prefix.as_deref().map(str::trim).filter(|p| !p.is_empty());
        if let Err(msg) = ensure_target(&creds, prefix, &id).await {
            return Err(AppError::Validation(msg));
        }
    }

    let password_enc = db_config::encrypt_password(&state.settings.auth.jwt_secret, &password).map_err(AppError::Internal)?;
    let prefix_store = dto.schema_prefix.as_deref().map(str::trim).filter(|p| !p.is_empty());
    let port_store: i32 = dto.port.map(i32::from).unwrap_or(0);

    let conflict = state.db.backend().upsert(
        "core.module_databases",
        &["module_id"],
        &[
            kubuno_db::dialect::Assign::Incoming("engine"),
            kubuno_db::dialect::Assign::Incoming("host"),
            kubuno_db::dialect::Assign::Incoming("port"),
            kubuno_db::dialect::Assign::Incoming("db_user"),
            kubuno_db::dialect::Assign::Incoming("password_enc"),
            kubuno_db::dialect::Assign::Incoming("db_name"),
            kubuno_db::dialect::Assign::Incoming("db_path"),
            kubuno_db::dialect::Assign::Incoming("schema_prefix"),
            kubuno_db::dialect::Assign::Incoming("enabled"),
        ],
    );
    let sql = format!(
        "INSERT INTO core.module_databases \
            (module_id, engine, host, port, db_user, password_enc, db_name, db_path, schema_prefix, enabled) \
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10){conflict}"
    );
    state
        .db
        .execute(
            &sql,
            params![
                id.clone(),
                dto.engine.clone(),
                dto.host.trim(),
                port_store,
                dto.user.trim(),
                password_enc,
                dto.database.trim(),
                dto.path.clone().unwrap_or_default(),
                prefix_store,
                dto.enabled,
            ],
        )
        .await
        .map_err(|e| {
            tracing::error!(module_id = %id, error = %e, "Écriture de l'override DB");
            AppError::Database(e)
        })?;

    let restarted = crate::modules::manager::restart_module(state.settings.clone(), state.db.clone(), &id).await;
    tracing::warn!(module_id = %id, engine = %dto.engine, enabled = dto.enabled, restarted, "Override DB du module enregistré");

    Ok(Json(json!({ "ok": true, "restarted": restarted })))
}

/// DELETE — drop the override; the module reverts to the inherited database on
/// its next start, which is triggered here.
pub async fn delete_module_database(
    State(state): State<AppState>,
    _admin: AdminUser,
    ctx: AdminCtx,
    Path(id): Path<String>,
) -> Result<Json<Value>, AppError> {
    ctx.require_superuser("gestion de la base de données d'un module")?;
    if !module_exists(&state.db, &id).await? {
        return Err(AppError::NotFound(format!("Module '{id}' introuvable")));
    }

    state
        .db
        .execute("DELETE FROM core.module_databases WHERE module_id = $1", params![id.clone()])
        .await
        .map_err(AppError::Database)?;

    let restarted = crate::modules::manager::restart_module(state.settings.clone(), state.db.clone(), &id).await;
    tracing::warn!(module_id = %id, restarted, "Override DB du module supprimé — retour au SGBD principal");

    Ok(Json(json!({ "ok": true, "restarted": restarted })))
}
