//! The installation wizard's HTTP surface.
//!
//! Three endpoints and the static frontend. Everything else under `/api/v1/`
//! answers 503 with `setup_required`, so a client that reaches a not-yet
//! installed instance is told what is going on instead of getting a puzzling
//! 404 from the SPA fallback.

use super::config_file::{self, Assign};
use super::token::SetupToken;
use crate::config::Settings;
use axum::{
    extract::State,
    http::StatusCode,
    response::{IntoResponse, Response},
    routing::{any, get, post},
    Json, Router,
};
use rand::RngCore;
use serde::{Deserialize, Serialize};
use serde_json::json;
use sqlx::postgres::{PgConnectOptions, PgPool, PgPoolOptions};
use std::sync::atomic::{AtomicBool, Ordering};
use std::collections::HashMap;
use std::sync::Arc;
use std::time::Duration;
use tower_http::services::{ServeDir, ServeFile};

pub(crate) struct SetupState {
    pub settings: Settings,
    pub token: SetupToken,
    pub done: tokio::sync::watch::Sender<bool>,
    pub installed: Arc<AtomicBool>,
    /// Half-filled installation forms, held for the browser tab that is filling
    /// them in. See `draft` below for why they live here and not in the browser.
    pub drafts: std::sync::Mutex<HashMap<String, DraftEntry>>,
}

pub(crate) struct DraftEntry {
    saved: std::time::Instant,
    data: serde_json::Value,
}

/// A draft is dropped after this long without a write — an installation left
/// open in a forgotten tab must not sit in memory for ever.
const DRAFT_TTL: Duration = Duration::from_secs(2 * 60 * 60);
/// Cap on drafts kept at once, so an unattended port cannot be made to grow the
/// process by posting draft after draft.
const DRAFT_MAX: usize = 32;
/// A draft carries a logo as a data-URI; anything past this is not a form.
const DRAFT_MAX_BYTES: usize = 512 * 1024;

pub(crate) fn router(state: Arc<SetupState>) -> Router {
    let dist = state.settings.server.frontend_dist.clone();
    let static_files =
        ServeDir::new(&dist).fallback(ServeFile::new(format!("{dist}/index.html")));

    Router::new()
        .route("/api/v1/setup/status", get(status))
        .route("/api/v1/setup/themes", get(themes))
        .route("/api/v1/setup/draft/:id", get(get_draft).put(put_draft).delete(delete_draft))
        .route("/api/v1/setup/test-database", post(test_database))
        .route("/api/v1/setup/install", post(install))
        // Anything else the SPA or a module may call while we are not installed.
        .route("/api/v1/*rest", any(not_installed))
        .route("/internal/*rest", any(not_installed))
        .with_state(state)
        .fallback_service(static_files)
}

/// A refusal the wizard can SHOW IN THE OPERATOR'S LANGUAGE.
///
/// The server has no idea which language the screen is in — it is reached before
/// any account, any preference, any session exists. So it names the reason with
/// a stable `code` (plus whatever the sentence needs) and lets the client
/// translate it. The French `error` text stays for anything reading this API
/// without a UI: curl, a log, an installer script.
fn bad_code(code: &str, msg: impl Into<String>, params: serde_json::Value) -> Response {
    (
        StatusCode::BAD_REQUEST,
        Json(json!({ "error": msg.into(), "code": code, "params": params })),
    )
        .into_response()
}


async fn not_installed() -> Response {
    (
        StatusCode::SERVICE_UNAVAILABLE,
        Json(json!({
            "error": "Kubuno n'est pas encore installé",
            "setup_required": true,
        })),
    )
        .into_response()
}

// ── Status ───────────────────────────────────────────────────────────────────

#[derive(Serialize)]
struct Defaults {
    db_host: String,
    db_port: u16,
    db_name: String,
    db_user: String,
}

#[derive(Serialize)]
struct StatusResponse {
    setup_required: bool,
    version: &'static str,
    missing: Vec<&'static str>,
    config_path: String,
    config_writable: bool,
    token_file: String,
    defaults: Defaults,
}

async fn status(State(st): State<Arc<SetupState>>) -> Json<StatusResponse> {
    let target = config_file::target_path();
    let s = &st.settings;
    Json(StatusResponse {
        setup_required: true,
        version: env!("CARGO_PKG_VERSION"),
        missing: super::missing(s),
        config_writable: config_file::is_writable(&target),
        config_path: target.display().to_string(),
        token_file: st.token.file().display().to_string(),
        defaults: Defaults {
            db_host: s.database.host.clone().unwrap_or_else(|| "localhost".into()),
            db_port: s.database.port.unwrap_or(5432),
            db_name: s.database.database.clone().unwrap_or_else(|| "kubuno".into()),
            db_user: s.database.user.clone().unwrap_or_else(|| "kubuno".into()),
        },
    })
}

// ── Draft ────────────────────────────────────────────────────────────────────
//
// The wizard's half-filled form, kept BY THE SERVER rather than in the browser.
//
// It holds the installation token, the database password and the administrator
// password: the browser is the wrong place for those, and a refresh that lost
// them sent the operator back to the first screen with empty fields. Here they
// stay in the installer process's memory — they never touch a disk, they vanish
// when the process ends, and they are erased the moment the installation
// succeeds. The tab keeps only an unguessable identifier.

fn draft_id_is_valid(id: &str) -> bool {
    id.len() >= 32 && id.len() <= 64 && id.chars().all(|c| c.is_ascii_hexdigit())
}

/// Drops what has gone stale, and keeps the store bounded.
fn prune(store: &mut HashMap<String, DraftEntry>) {
    store.retain(|_, e| e.saved.elapsed() < DRAFT_TTL);
    while store.len() >= DRAFT_MAX {
        // Oldest first — a live tab writes on every keystroke, so the one that
        // has not written in the longest time is the safest to lose.
        let oldest = store
            .iter()
            .min_by_key(|(_, e)| e.saved)
            .map(|(k, _)| k.clone());
        match oldest {
            Some(k) => { store.remove(&k); }
            None => break,
        }
    }
}

async fn get_draft(
    State(st): State<Arc<SetupState>>,
    axum::extract::Path(id): axum::extract::Path<String>,
) -> Response {
    if !draft_id_is_valid(&id) {
        return (StatusCode::BAD_REQUEST, Json(json!({ "error": "identifiant invalide" }))).into_response();
    }
    let mut store = match st.drafts.lock() {
        Ok(s) => s,
        Err(e) => e.into_inner(),
    };
    prune(&mut store);
    match store.get(&id) {
        Some(e) => Json(json!({ "draft": e.data })).into_response(),
        None => Json(json!({ "draft": serde_json::Value::Null })).into_response(),
    }
}

async fn put_draft(
    State(st): State<Arc<SetupState>>,
    axum::extract::Path(id): axum::extract::Path<String>,
    Json(data): Json<serde_json::Value>,
) -> Response {
    if !draft_id_is_valid(&id) {
        return (StatusCode::BAD_REQUEST, Json(json!({ "error": "identifiant invalide" }))).into_response();
    }
    if serde_json::to_string(&data).map(|s| s.len()).unwrap_or(usize::MAX) > DRAFT_MAX_BYTES {
        return (StatusCode::PAYLOAD_TOO_LARGE, Json(json!({ "error": "brouillon trop volumineux" }))).into_response();
    }
    let mut store = match st.drafts.lock() {
        Ok(s) => s,
        Err(e) => e.into_inner(),
    };
    prune(&mut store);
    store.insert(id, DraftEntry { saved: std::time::Instant::now(), data });
    StatusCode::NO_CONTENT.into_response()
}

async fn delete_draft(
    State(st): State<Arc<SetupState>>,
    axum::extract::Path(id): axum::extract::Path<String>,
) -> Response {
    if let Ok(mut store) = st.drafts.lock() {
        store.remove(&id);
    }
    StatusCode::NO_CONTENT.into_response()
}

// ── Themes ───────────────────────────────────────────────────────────────────

/// The themes shipped with the instance, read straight from `themes_dir`.
///
/// They are on disk before the first boot (the package seeds them), so the
/// wizard can offer the real ones rather than an invented palette — and the
/// choice is the same object the administration console manages afterwards.
/// A few of each theme's variables travel with it so the wizard can draw a
/// faithful preview without loading the theme itself.
#[derive(Serialize)]
struct ThemeChoice {
    id: String,
    name: String,
    color_scheme: String,
    /// The theme's CSS variables, in full — not a swatch.
    ///
    /// The wizard applies them to itself the moment one is picked, so choosing a
    /// theme is something you SEE rather than a promise about later. All six
    /// shipped themes together weigh under 10 KB, which is cheaper than a second
    /// round trip per selection. (Their component stylesheets are not loaded
    /// here: serving those needs the running instance.)
    vars: std::collections::HashMap<String, String>,
}

async fn themes(State(st): State<Arc<SetupState>>) -> Json<serde_json::Value> {
    let trusted = std::collections::HashSet::new();
    let entries = crate::handlers::themes::load_all_themes(&st.settings.server.themes_dir, &trusted);
    let choices: Vec<ThemeChoice> = entries
        .into_iter()
        .map(|e| ThemeChoice {
            id: e.manifest.id,
            name: e.manifest.name,
            color_scheme: e.manifest.color_scheme,
            vars: e.manifest.vars,
        })
        .collect();
    Json(json!({ "themes": choices }))
}

// ── Database ─────────────────────────────────────────────────────────────────

#[derive(Deserialize, Clone)]
struct DbForm {
    host: String,
    port: Option<u16>,
    user: String,
    password: String,
    database: String,
}

impl DbForm {
    fn options(&self, database: &str) -> PgConnectOptions {
        PgConnectOptions::new()
            .host(self.host.trim())
            .port(self.port.unwrap_or(5432))
            .username(self.user.trim())
            .password(&self.password)
            .database(database)
    }

    /// A PostgreSQL identifier we are willing to interpolate into `CREATE
    /// DATABASE` — that statement takes no bind parameters, so the name is
    /// checked rather than escaped.
    fn database_name_is_safe(&self) -> bool {
        let n = self.database.trim();
        !n.is_empty()
            && n.len() <= 63
            && n.chars().all(|c| c.is_ascii_alphanumeric() || c == '_')
            && !n.chars().next().is_some_and(|c| c.is_ascii_digit())
    }

    fn validate(&self) -> Result<(), (&'static str, String)> {
        if self.host.trim().is_empty() {
            return Err(("db.host_required", "L'hôte de la base est requis.".to_string()));
        }
        if self.user.trim().is_empty() {
            return Err(("db.user_required", "L'utilisateur de la base est requis.".to_string()));
        }
        if !self.database_name_is_safe() {
            return Err((
                "db.name_invalid",
                "Nom de base invalide : lettres, chiffres et « _ » uniquement, sans chiffre en \
                 première position."
                    .to_string(),
            ));
        }
        Ok(())
    }
}

async fn connect(opts: PgConnectOptions) -> Result<PgPool, sqlx::Error> {
    PgPoolOptions::new()
        .max_connections(2)
        .acquire_timeout(Duration::from_secs(8))
        .connect_with(opts)
        .await
}

/// PostgreSQL's "database does not exist" — the one failure the wizard can fix
/// on its own rather than sending the administrator to a shell.
fn is_missing_database(e: &sqlx::Error) -> bool {
    matches!(e, sqlx::Error::Database(d) if d.code().as_deref() == Some("3D000"))
}

#[derive(Serialize)]
struct DbTestResponse {
    ok: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    error: Option<String>,
    /// Stable name of the failure, for the client to translate.
    #[serde(skip_serializing_if = "Option::is_none")]
    code: Option<String>,
    /// What the translated sentence needs (the database name, mostly).
    #[serde(skip_serializing_if = "Option::is_none")]
    params: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    server_version: Option<String>,
    /// The database is missing, but the account may create it.
    database_missing: bool,
    can_create_database: bool,
    /// This database already carries a Kubuno schema.
    already_initialised: bool,
}

async fn test_database(Json(form): Json<DbForm>) -> Response {
    if let Err((code, msg)) = form.validate() {
        return bad_code(code, msg, json!({}));
    }

    match connect(form.options(form.database.trim())).await {
        Ok(pool) => {
            let version: Option<String> = sqlx::query_scalar("SELECT version()")
                .fetch_one(&pool)
                .await
                .ok();
            let initialised: bool = sqlx::query_scalar(
                "SELECT EXISTS(SELECT 1 FROM information_schema.tables \
                 WHERE table_schema = 'core' AND table_name = 'users')",
            )
            .fetch_one(&pool)
            .await
            .unwrap_or(false);
            pool.close().await;
            Json(DbTestResponse {
                ok: true,
                error: None,
                code: None,
                params: None,
                server_version: version,
                database_missing: false,
                can_create_database: false,
                already_initialised: initialised,
            })
            .into_response()
        }
        Err(e) if is_missing_database(&e) => {
            // The server and the account are fine; only the database is absent.
            // Say whether we could create it, so the wizard can offer to.
            let can_create = match connect(form.options("postgres")).await {
                Ok(p) => {
                    let allowed: bool =
                        sqlx::query_scalar("SELECT pg_catalog.has_database_privilege(current_user, current_database(), 'CONNECT') AND (SELECT rolcreatedb OR rolsuper FROM pg_roles WHERE rolname = current_user)")
                            .fetch_one(&p)
                            .await
                            .unwrap_or(false);
                    p.close().await;
                    allowed
                }
                Err(_) => false,
            };
            Json(DbTestResponse {
                ok: false,
                error: Some(format!("La base « {} » n'existe pas encore.", form.database.trim())),
                code: Some("db.missing_named".into()),
                params: Some(json!({ "name": form.database.trim() })),
                server_version: None,
                database_missing: true,
                can_create_database: can_create,
                already_initialised: false,
            })
            .into_response()
        }
        Err(e) => {
            let (code, msg) = friendly_db_error(&e);
            Json(DbTestResponse {
            ok: false,
            error: Some(msg),
            code: Some(code.into()),
            params: None,
            server_version: None,
            database_missing: false,
            can_create_database: false,
            already_initialised: false,
            })
            .into_response()
        }
    }
}

/// The connection error in the administrator's terms. The credentials are never
/// echoed back.
fn friendly_db_error(e: &sqlx::Error) -> (&'static str, String) {
    match e {
        sqlx::Error::Database(d) => match d.code().as_deref() {
            Some("28P01") => ("db.bad_password", "Mot de passe refusé par PostgreSQL pour cet utilisateur.".into()),
            Some("28000") => ("db.refused", "Connexion refusée pour cet utilisateur (voir pg_hba.conf).".into()),
            Some("3D000") => ("db.missing", "Cette base n'existe pas.".into()),
            _ => ("db.other", format!("PostgreSQL a refusé la connexion : {d}")),
        },
        sqlx::Error::PoolTimedOut => (
            "db.timeout",
            "Délai dépassé : l'hôte ou le port ne répond pas.".into(),
        ),
        other => ("db.unreachable", format!("Connexion impossible : {other}")),
    }
}

// ── Install ──────────────────────────────────────────────────────────────────

#[derive(Deserialize)]
struct AdminForm {
    username: String,
    email: String,
    password: String,
}

#[derive(Deserialize)]
struct InstanceForm {
    #[serde(default)]
    name: String,
    /// Optional data-URI carrying the instance logo the operator picked in the
    /// wizard. Stored verbatim into `instance.logo_url`, exactly what the shell
    /// already reads there (a small file, so the size cap below stops it from
    /// bloating a public setting the login page fetches on every load).
    #[serde(default)]
    logo_dataurl: Option<String>,
    /// Optional accent colour as `#RRGGBB`. Written to `instance.color_primary`.
    #[serde(default)]
    color_primary: Option<String>,
    /// Optional id of one of the themes shipped with the instance. Written to
    /// `appearance.theme`, the setting the shell and the console already read.
    #[serde(default)]
    theme_id: Option<String>,
    /// The language chosen in the wizard, which becomes the instance's default
    /// (`instance.locale`) — what everyone sees until they pick their own.
    #[serde(default)]
    locale: Option<String>,
}

#[derive(Deserialize)]
struct InstallRequest {
    token: String,
    database: DbForm,
    #[serde(default)]
    create_database: bool,
    admin: AdminForm,
    #[serde(default)]
    instance: Option<InstanceForm>,
}

/// The first administrator is the most privileged account of the instance, so
/// its password is held to the length that actually resists an offline attack
/// rather than to a token minimum.
const MIN_ADMIN_PASSWORD: usize = 12;

impl AdminForm {
    fn validate(&self) -> Result<(), (&'static str, String)> {
        let u = self.username.trim();
        if u.len() < 3 {
            return Err(("admin.username_short", "Le nom d'utilisateur doit faire au moins 3 caractères.".to_string()));
        }
        if !u.chars().all(|c| c.is_alphanumeric() || c == '.' || c == '-' || c == '_') {
            return Err((
                "admin.username_chars",
                "Le nom d'utilisateur n'accepte que lettres, chiffres, « . », « - » et « _ »."
                    .to_string(),
            ));
        }
        let e = self.email.trim();
        if e.len() < 3 || !e.contains('@') || e.starts_with('@') || e.ends_with('@') {
            return Err(("admin.email_invalid", "Adresse e-mail invalide.".to_string()));
        }
        if self.password.chars().count() < MIN_ADMIN_PASSWORD {
            return Err((
                "admin.password_short",
                format!("Le mot de passe administrateur doit faire au moins {MIN_ADMIN_PASSWORD} caractères."),
            ));
        }
        Ok(())
    }
}

/// 32 random bytes as hex — what `openssl rand -hex 32` produces, which is what
/// the configuration file tells administrators to use.
fn generate_secret() -> String {
    let mut bytes = [0u8; 32];
    rand::thread_rng().fill_bytes(&mut bytes);
    bytes.iter().map(|b| format!("{b:02x}")).collect()
}

#[derive(Serialize)]
struct InstallResponse {
    ok: bool,
    /// The database already held an administrator; we kept it.
    admin_existed: bool,
    config_path: String,
}

fn is_hex_colour(v: &str) -> bool {
    let s = v.trim_start_matches('#');
    s.len() == 6 && s.chars().all(|c| c.is_ascii_hexdigit())
}

/// A data URI carrying an image, capped at ~200 KB (the encoded weight of a
/// medium-sized logo — anything heavier belongs behind the file upload the
/// admin console offers). PNG/JPEG/WebP/SVG only, refused otherwise.
fn is_reasonable_image_dataurl(v: &str) -> bool {
    if v.len() > 300_000 { return false }   // ~200 KB decoded, headers included
    let head = "data:image/";
    if !v.starts_with(head) { return false }
    let rest = &v[head.len()..];
    let (kind, tail) = match rest.split_once(';') { Some(p) => p, None => return false };
    if !matches!(kind, "png" | "jpeg" | "jpg" | "webp" | "svg+xml") { return false }
    tail.starts_with("base64,")
}

async fn install(State(st): State<Arc<SetupState>>, Json(req): Json<InstallRequest>) -> Response {
    // The instance has no accounts yet: this token is the only thing standing
    // between a freshly installed port and whoever reaches it first.
    if !st.token.verify(&req.token) {
        tracing::warn!("Installation refusée : jeton invalide");
        return (
            StatusCode::FORBIDDEN,
            Json(json!({
                "error": "Jeton d'installation invalide.",
                "code": "token.invalid",
                "params": {},
            })),
        )
            .into_response();
    }
    if let Err((code, msg)) = req.database.validate() {
        return bad_code(code, msg, json!({}));
    }
    if let Err((code, msg)) = req.admin.validate() {
        return bad_code(code, msg, json!({ "min": MIN_ADMIN_PASSWORD }));
    }
    if let Some(c) = req.instance.as_ref().and_then(|i| i.color_primary.as_deref()) {
        if !c.is_empty() && !is_hex_colour(c) {
            return bad_code("instance.color_invalid", "La couleur d'accent doit être au format #RRGGBB.", json!({}));
        }
    }
    if let Some(u) = req.instance.as_ref().and_then(|i| i.logo_dataurl.as_deref()) {
        if !u.is_empty() && !is_reasonable_image_dataurl(u) {
            return bad_code("instance.logo_invalid", "Logo invalide : PNG, JPEG, WebP ou SVG en data-URI, 200 Ko max.", json!({}));
        }
    }

    let db_name = req.database.database.trim().to_string();

    // 1. Reach the database, creating it when asked and allowed to.
    let pool = match connect(req.database.options(&db_name)).await {
        Ok(p) => p,
        Err(e) if is_missing_database(&e) && req.create_database => {
            match connect(req.database.options("postgres")).await {
                Ok(admin_pool) => {
                    // Name validated by `database_name_is_safe` — CREATE DATABASE
                    // takes no bind parameters.
                    let stmt = format!("CREATE DATABASE \"{db_name}\"");
                    if let Err(e) = sqlx::query(&stmt).execute(&admin_pool).await {
                        tracing::error!(error = %e, "Création de la base impossible");
                        admin_pool.close().await;
                        return bad_code("install.create_db_failed", format!("Création de la base impossible : {e}"), json!({ "detail": e.to_string() }));
                    }
                    admin_pool.close().await;
                    match connect(req.database.options(&db_name)).await {
                        Ok(p) => p,
                        Err(e) => { let (c, m) = friendly_db_error(&e); return bad_code(c, m, json!({})) }
                    }
                }
                Err(e) => { let (c, m) = friendly_db_error(&e); return bad_code(c, m, json!({})) }
            }
        }
        Err(e) => { let (c, m) = friendly_db_error(&e); return bad_code(c, m, json!({})) }
    };

    // 2. Schema. Idempotent, so pointing the wizard at an existing Kubuno
    //    database repairs its configuration instead of destroying its data.
    if let Err(e) = crate::database::migrations::run(&pool).await {
        tracing::error!(error = %e, "Migrations refusées pendant l'installation");
        return bad_code("install.schema_failed", format!("Création du schéma impossible : {e}"), json!({ "detail": e.to_string() }));
    }

    // 3. First administrator — unless this database already has one.
    let admin_existed: bool =
        sqlx::query_scalar("SELECT EXISTS(SELECT 1 FROM core.users WHERE role = 'admin')")
            .fetch_one(&pool)
            .await
            .unwrap_or(false);

    if !admin_existed {
        let hash = match crate::crypto::password::hash_password(&req.admin.password) {
            Ok(h) => h,
            Err(e) => {
                tracing::error!(error = %e, "Hachage du mot de passe administrateur impossible");
                return bad_code("install.hash_failed", "Impossible de préparer le mot de passe administrateur.", json!({}));
            }
        };
        let root_unit = crate::database::seed::root_org_unit(&pool).await;
        let res = sqlx::query(
            r#"
            INSERT INTO core.users
                (email, username, password_hash, display_name, role, email_verified, is_active,
                 must_change_password, org_unit_id)
            VALUES
                ($1, $2, $3, 'Administrateur', 'admin', TRUE, TRUE, FALSE, $4)
            "#,
        )
        .bind(req.admin.email.trim())
        .bind(req.admin.username.trim())
        .bind(&hash)
        .bind(root_unit)
        .execute(&pool)
        .await;
        if let Err(e) = res {
            tracing::error!(error = %e, "Création du compte administrateur impossible");
            return bad_code("install.admin_failed", format!("Création du compte administrateur impossible : {e}"), json!({ "detail": e.to_string() }));
        }

        // The console derives every entry from the role ASSIGNMENT, not from
        // `users.role`. Granting it here is what makes the account the operator
        // just created an administrator in fact and not only in name.
        let admin_id: Option<uuid::Uuid> =
            sqlx::query_scalar("SELECT id FROM core.users WHERE email = $1")
                .bind(req.admin.email.trim())
                .fetch_optional(&pool)
                .await
                .unwrap_or(None);
        match admin_id {
            Some(id) => {
                if let Err(e) = crate::authz::bootstrap::grant_instance_superadmin(&pool, id).await {
                    tracing::error!(error = %e, "Attribution de la super-administration impossible");
                    return bad_code("install.admin_failed", "Le compte administrateur n'a pas pu recevoir ses droits.", json!({ "detail": e.to_string() }));
                }
            }
            None => {
                tracing::error!("Compte administrateur introuvable juste après sa création");
                return bad_code("install.admin_failed", "Le compte administrateur n'a pas pu recevoir ses droits.", json!({}));
            }
        }
    }

    // 4. Instance name, when one was given.
    if let Some(inst) = req.instance.as_ref() {
        if !inst.name.trim().is_empty() {
            let _ = sqlx::query("UPDATE core.settings SET value = $1 WHERE key = 'instance.name'")
                .bind(serde_json::Value::String(inst.name.trim().to_string()))
                .execute(&pool)
                .await;
        }
        // Logo and accent colour follow the same key names the admin console
        // already uses (`instance.logo_url`, `instance.color_primary`), so the
        // shell and the login page read them at once with no wiring of their own.
        if let Some(u) = inst.logo_dataurl.as_deref().filter(|u| !u.is_empty()) {
            let _ = sqlx::query("UPDATE core.settings SET value = $1 WHERE key = 'instance.logo_url'")
                .bind(serde_json::Value::String(u.to_string()))
                .execute(&pool)
                .await;
        }
        if let Some(t) = inst.theme_id.as_deref().filter(|t| !t.is_empty()) {
            // Only a theme that really exists on disk: the id lands in a setting
            // the whole shell reads, and a bogus one would leave every client
            // falling back at each load.
            let known = crate::handlers::themes::load_all_themes(
                &st.settings.server.themes_dir,
                &std::collections::HashSet::new(),
            )
            .iter()
            .any(|e| e.manifest.id == t);
            if known {
                let _ = sqlx::query(
                    "INSERT INTO core.settings (key, value, category, label, is_public)
                     VALUES ('appearance.theme', $1, 'appearance', 'Thème de l''instance', TRUE)
                     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
                )
                .bind(serde_json::Value::String(t.to_string()))
                .execute(&pool)
                .await;
            } else {
                tracing::warn!(theme = %t, "Thème inconnu ignoré pendant l'installation");
            }
        }
        if let Some(l) = inst.locale.as_deref().filter(|l| !l.is_empty()) {
            // Normalised against the locales the product actually ships, so a
            // regional form (`fr-CA`) lands on one that has translations and an
            // unknown one is dropped rather than stored.
            match crate::settings::intl::normalise_locale(l) {
                Some(code) => {
                    let _ = sqlx::query(
                        "INSERT INTO core.settings (key, value, category, label, is_public)
                         VALUES ($1, $2, 'general', 'Langue de l''instance', TRUE)
                         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
                    )
                    .bind(crate::settings::intl::LOCALE_KEY)
                    .bind(serde_json::Value::String(code.to_string()))
                    .execute(&pool)
                    .await;
                }
                None => tracing::warn!(locale = %l, "Langue inconnue ignorée pendant l'installation"),
            }
        }
        if let Some(c) = inst.color_primary.as_deref().filter(|c| !c.is_empty()) {
            let hex = if c.starts_with('#') { c.to_string() } else { format!("#{c}") };
            let _ = sqlx::query("UPDATE core.settings SET value = $1 WHERE key = 'instance.color_primary'")
                .bind(serde_json::Value::String(hex))
                .execute(&pool)
                .await;
        }
    }
    pool.close().await;

    // 5. Configuration file. Written LAST: it is what makes the instance count
    //    as installed, so it is only written once everything else worked.
    let target = config_file::target_path();
    let mut assigns = vec![
        Assign::text("database", "host", req.database.host.trim()),
        Assign::raw("database", "port", req.database.port.unwrap_or(5432).to_string()),
        Assign::text("database", "user", req.database.user.trim()),
        Assign::text("database", "password", &req.database.password),
        Assign::text("database", "database", &db_name),
    ];
    // Secrets already set by an operator are left alone; placeholders are replaced.
    if super::is_placeholder(&st.settings.server.internal_secret) {
        assigns.push(Assign::text("server", "internal_secret", &generate_secret()));
    }
    if super::is_placeholder(&st.settings.auth.jwt_secret) {
        assigns.push(Assign::text("auth", "jwt_secret", &generate_secret()));
    }

    let patched = config_file::patch(&config_file::source_text(&target), &assigns);
    if let Err(e) = config_file::write_atomic(&target, &patched) {
        tracing::error!(error = %e, "Écriture de la configuration impossible");
        return bad_code(
            "install.config_failed",
            format!("La base est prête mais {} n'a pas pu être écrit : {e}", target.display()),
            json!({ "path": target.display().to_string(), "detail": e.to_string() }),
        );
    }
    tracing::info!(path = %target.display(), "Configuration écrite par l'assistant d'installation");

    // 6. Hand over to the real instance.
    // The form has served its purpose: the secrets it held go now.
    if let Ok(mut store) = st.drafts.lock() {
        store.clear();
    }
    st.token.consume();
    st.installed.store(true, Ordering::SeqCst);
    let _ = st.done.send(true);

    Json(InstallResponse {
        ok: true,
        admin_existed,
        config_path: target.display().to_string(),
    })
    .into_response()
}
