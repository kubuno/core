use crate::{
    auth::middleware::{AuthUser, InternalRequest},
    authz::{catalog::PrivilegeDef, keys, AdminCtx},
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

/// Résout le dossier on-disk d'un module en privilégiant le store marketplace
/// (`modules_install_dir`) sur les paquets système (`modules_dir`).
pub fn module_disk_dir(settings: &crate::config::Settings, id: &str) -> std::path::PathBuf {
    let store = std::path::Path::new(&settings.server.modules_install_dir).join(id);
    if store.is_dir() {
        store
    } else {
        std::path::Path::new(&settings.server.modules_dir).join(id)
    }
}

/// Jeton de cache-busting du bundle UI d'un module = hash court du CONTENU de
/// `entry.js`. `entry.js`/`entry.css` ont un nom FIXE (le host les charge sans
/// connaître de hash) et sont servis en `no-store` — mais iOS Safari resert un
/// module ES périmé depuis son cache indexé par URL tant que l'URL reste stable.
/// On suffixe donc `?v=<hash>` : l'URL change dès que le contenu change (bust
/// précis, sans faux positif comme un mtime préservé). Renvoie `None` si le
/// fichier n'existe pas (module sans UI).
///
/// Le hash n'est recalculé que lorsque le fichier change : cache mémoire clé
/// `(mtime, size)`. Les appels `/api/v1/modules` suivants ne font qu'un `stat`.
fn frontend_entry_version(path: &std::path::Path) -> Option<String> {
    use sha2::{Digest, Sha256};
    use std::sync::{LazyLock, Mutex};

    /// What is remembered about a file already hashed: modification time, size,
    /// and the digest. The pair (mtime, size) is the cheap proof that the digest
    /// still describes the file.
    type Fingerprint = (u64, u64, String);

    // path -> fingerprint ; évite de re-hasher un fichier inchangé.
    static CACHE: LazyLock<Mutex<HashMap<std::path::PathBuf, Fingerprint>>> =
        LazyLock::new(|| Mutex::new(HashMap::new()));

    let meta = std::fs::metadata(path).ok()?;
    let mtime = meta
        .modified()
        .ok()
        .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
        .map(|d| d.as_secs())
        .unwrap_or(0);
    let size = meta.len();

    if let Ok(cache) = CACHE.lock() {
        if let Some((m, s, h)) = cache.get(path) {
            if *m == mtime && *s == size {
                return Some(h.clone());
            }
        }
    }

    // Cache miss : lecture + hash hors verrou (ne pas bloquer les autres modules).
    let bytes = std::fs::read(path).ok()?;
    let digest = Sha256::digest(&bytes);
    let hash: String = digest.iter().take(6).map(|b| format!("{b:02x}")).collect();

    if let Ok(mut cache) = CACHE.lock() {
        cache.insert(path.to_path_buf(), (mtime, size, hash.clone()));
    }
    Some(hash)
}

/// Réécrit l'URL content-hashée de l'entrée UI (`entry-<hash>.js` /
/// `entry-<hash>.css`) vers le vrai nom de fichier sur disque (`entry.js` /
/// `entry.css`). Le `<hash>` DOIT être hexadécimal → aucune collision avec un
/// éventuel vrai fichier `entry-*.js`. Tout autre chemin (chunks, assets…) passe
/// inchangé. Sûr vis-à-vis de la traversée : la sortie est toujours `entry.{ext}`.
fn resolve_entry_alias(asset_path: &str) -> std::borrow::Cow<'_, str> {
    for ext in [".js", ".css"] {
        if let Some(rest) = asset_path.strip_suffix(ext) {
            if let Some(hash) = rest.strip_prefix("entry-") {
                if !hash.is_empty() && hash.bytes().all(|b| b.is_ascii_hexdigit()) {
                    return std::borrow::Cow::Owned(format!("entry{ext}"));
                }
            }
        }
    }
    std::borrow::Cow::Borrowed(asset_path)
}

#[utoipa::path(
    get,
    path = "/api/v1/modules",
    tag = "modules",
    responses((status = 200, description = "Modules actifs et leurs points d'entrée. Public : l'adresse interne (base_url) n'est servie qu'aux administrateurs."))
)]
/// `GET /api/v1/modules`
///
/// Stays **public on purpose**: the frontend loads module bundles before any
/// sign-in, because a module can serve anonymous routes (a form respondent
/// answering by link needs `forms`' bundle imported before the first render).
/// Requiring a token here would break that, so the fix is not authentication —
/// it is not leaking.
///
/// What used to leak: `base_url`, the module's **internal listening address**
/// (`http://127.0.0.1:3108`). Served to the whole internet, that is a free map
/// of the deployment's internal surface — ports, count of running modules, and
/// which of them are behind the reverse proxy. It is now emitted only to a
/// caller holding `core.modules.read`; everyone else gets the discovery fields
/// and nothing more.
pub async fn list_modules(
    State(state): State<AppState>,
    // Optional on purpose: an anonymous caller is served, just less.
    ctx: Option<AdminCtx>,
) -> Result<Json<serde_json::Value>, AppError> {
    let expose_base_url = ctx
        .map(|c| c.has(keys::MODULES_READ))
        .unwrap_or(false);

    let registry = state.modules.read().await;
    let modules: Vec<_> = registry
        .all()
        .into_iter()
        .map(|i| {
            // Bundle frontend du module (chargé à l'exécution par le host). Présent
            // seulement si le module a déposé son UI buildée dans <dir>/<id>/frontend/.
            // Les modules sans UI (ou non migrés vers le plugin runtime) renvoient null.
            let entry = module_disk_dir(&state.settings, &i.module_id)
                .join("frontend")
                .join("entry.js");
            // Cache-busting du point d'entrée UI du module : le hash du CONTENU
            // est mis DANS le nom (`entry-<hash>.js`), comme les chunks partagés
            // du core (`/shared/kubuno-shared-<hash>.js`) — pas de `?v=`. Sur
            // disque le fichier reste `entry.js` (le module l'émet à nom fixe,
            // sans connaître de hash) : `serve_module_asset` réécrit l'alias
            // hashé vers le vrai fichier. URL content-addressed → servie
            // `immutable` ET busted à chaque changement (nom d'URL différent, ce
            // qui casse aussi le cache iOS Safari indexé par URL). Le host dérive
            // le CSS avec le même hash (voir loadRemoteModules.ts). Sans rebuild
            // des modules ; les chunks internes sont déjà hashés.
            let frontend_entry = frontend_entry_version(&entry)
                .map(|v| format!("/modules/{}/entry-{}.js", i.module_id, v));
            json!({
                "module_id": i.module_id,
                // Internal address: administrators only. `null` for everyone
                // else, rather than an absent key, so clients keep one shape.
                "base_url": expose_base_url.then(|| i.base_url.clone()),
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

    // Le host demande l'entrée UI sous un nom content-hashé `entry-<hash>.js` /
    // `entry-<hash>.css` (cache-busting, cf. `list_modules`) ; sur disque le
    // fichier s'appelle `entry.js` / `entry.css`. On réécrit l'alias hashé.
    let real_asset = resolve_entry_alias(&asset_path);
    let full = module_disk_dir(&state.settings, &module_id)
        .join("frontend")
        .join(real_asset.as_ref());

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
    /// Privilèges déclarés par le module, **relatifs à lui** : `<domaine>.<verbe>`.
    /// Le core préfixe de force par `module_id` (cf. `crate::authz::catalog`) :
    /// un module ne peut jamais écrire hors de son propre espace, et surtout pas
    /// dans `core`.
    #[serde(default)]
    pub privileges:        Vec<PrivilegeDef>,
    /// Déclencheurs offerts au moteur de règles d'administration, **relatifs**
    /// au module (nom simple, sans préfixe). Le core préfixe de force par
    /// `module_id` (cf. `crate::rules::catalog`) : même discipline que pour les
    /// privilèges et les paramètres. Un module qui n'en déclare aucun n'apparaît
    /// simplement pas dans le catalogue des règles.
    #[serde(default)]
    pub rule_triggers:     Vec<crate::rules::catalog::TriggerDef>,
    /// Actions offertes au moteur de règles. Chacune DOIT porter l'endpoint
    /// interne qui l'exécute — c'est le module qui dit où le répartiteur doit
    /// frapper, le core ne connaît aucune route de module.
    #[serde(default)]
    pub rule_actions:      Vec<crate::rules::catalog::ActionDef>,
    /// Module d'infrastructure interne (ex. stt) : enregistré pour le routage,
    /// mais masqué de la liste des modules de l'administration.
    #[serde(default)]
    pub internal:          bool,
    /// Groups the module's settings are split into, one entry of the admin menu
    /// each (manifest `[[setting_groups]]`). Empty for a module that never
    /// declared any: its panel stays the single page it has always been.
    #[serde(default)]
    pub setting_groups:    Vec<SettingGroup>,
}

/// One page of a module's administration surface.
///
/// A group sits ABOVE `category`: it is an entry of the admin menu tree under
/// the module, with its own address (`/admin/modules/<module>/<group>`), and the
/// `category` of each of its settings becomes a tab inside it. Forty-eight knobs
/// on one page is a wall nobody reads; five addresses, each answering one
/// question, is a panel.
///
/// `id` is a STABLE, UNTRANSLATED slug because it travels in the URL — an
/// address may not change shape with the interface language.
#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct SettingGroup {
    pub id:          String,
    pub label:       String,
    /// Lucide icon name, shown in the menu.
    #[serde(default)]
    pub icon:        Option<String>,
    /// Menu order. Absent = after every positioned group, declaration order kept.
    #[serde(default)]
    pub position:    Option<i32>,
    /// One sentence read at the top of the page.
    #[serde(default)]
    pub description: Option<String>,
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
    /// Id of a `[[setting_groups]]` entry of the SAME manifest: which page of the
    /// module's admin surface this setting belongs to. `None` = ungrouped, which
    /// is what every module declared before groups existed.
    #[serde(default)]
    pub group:       Option<String>,
    /// Exposé dans /api/v1/config public (is_public).
    #[serde(default)]
    pub public:      bool,

    // ---------------------------------------------------------------------
    // Presentation metadata. Every field below is optional and defaulted, so a
    // manifest written before they existed still deserialises unchanged.
    //
    // They are what lets a module with seventy knobs (mail) stay readable
    // without a single line of module-specific code in the admin console: the
    // console renders the schema, and only the schema.
    // ---------------------------------------------------------------------
    /// Rare/expert knob: folded behind an "Avancé" disclosure inside its section.
    #[serde(default)]
    pub advanced:    bool,
    /// "info" | "warning" | "danger" — how loudly the console must warn before
    /// this is changed. `danger` means "can make the server unreachable or lose
    /// mail" and requires an explicit confirmation in the UI.
    #[serde(default)]
    pub risk:        Option<String>,
    /// Bounds for `type = "int"`, enforced by the console AND by the API.
    #[serde(default)]
    pub min:         Option<i64>,
    #[serde(default)]
    pub max:         Option<i64>,
    /// Suffix shown after the field ("Mo", "s", "min", "‰").
    #[serde(default)]
    pub unit:        Option<String>,
    #[serde(default)]
    pub placeholder: Option<String>,
    /// The `string` value is a LIST, one entry per line → textarea.
    #[serde(default)]
    pub multiline:   bool,
    /// Key of another `bool` setting of the SAME module. The setting is hidden
    /// while that boolean is false — a panel must shrink when a feature is off.
    #[serde(default)]
    pub depends_on:  Option<String>,
}

const VALID_SCOPES:      &[&str] = &["global", "user", "overridable"];
const VALID_VALUE_TYPES: &[&str] = &["bool", "int", "string", "enum"];
const VALID_RISKS:       &[&str] = &["info", "warning", "danger"];

impl SettingDef {
    /// Rejects a value that violates the bounds this definition declares.
    ///
    /// Called by the console-facing write path as well as by registration: a
    /// front end can be bypassed, so `min`/`max` only mean something if the API
    /// says no too.
    pub fn validate_value(&self, value: &serde_json::Value) -> Result<(), AppError> {
        if self.value_type != "int" || (self.min.is_none() && self.max.is_none()) {
            return Ok(());
        }
        // JSON numbers arrive as i64 most of the time, but a console that echoes
        // a text field can send "25". Both mean the same integer here.
        let n = match value {
            serde_json::Value::Number(n) => n.as_i64(),
            serde_json::Value::String(s) => s.trim().parse::<i64>().ok(),
            serde_json::Value::Null      => return Ok(()),
            _                            => None,
        };
        let Some(n) = n else {
            return Err(AppError::Validation(format!(
                "'{}' attend un entier",
                self.key
            )));
        };
        let label = self.label.clone().unwrap_or_else(|| self.key.clone());
        if let Some(min) = self.min {
            if n < min {
                return Err(AppError::Validation(format!(
                    "'{label}' doit être supérieur ou égal à {min}"
                )));
            }
        }
        if let Some(max) = self.max {
            if n > max {
                return Err(AppError::Validation(format!(
                    "'{label}' doit être inférieur ou égal à {max}"
                )));
            }
        }
        Ok(())
    }
}

/// Validates the presentation metadata of a whole manifest.
///
/// Unlike `scope` and `type` — tolerated with a warning since the first
/// modules shipped, and skipped one by one — a malformed *new* field aborts the
/// registration. These fields are new: nothing in the wild carries them, so
/// there is no compatibility to protect, and a knob silently dropped from an
/// administration panel is worse than a module that refuses to start.
pub fn validate_settings_schema(module_id: &str, defs: &[SettingDef]) -> Result<(), AppError> {
    let bool_keys: std::collections::HashSet<&str> = defs
        .iter()
        .filter(|d| d.value_type == "bool")
        .map(|d| d.key.as_str())
        .collect();

    for def in defs {
        let where_ = format!("{module_id}.{}", def.key);

        if let Some(risk) = &def.risk {
            if !VALID_RISKS.contains(&risk.as_str()) {
                return Err(AppError::Validation(format!(
                    "{where_}: risk '{risk}' inconnu (attendu : info, warning ou danger)"
                )));
            }
        }

        if def.min.is_some() || def.max.is_some() {
            if def.value_type != "int" {
                return Err(AppError::Validation(format!(
                    "{where_}: min/max ne s'appliquent qu'à type = \"int\" (ici \"{}\")",
                    def.value_type
                )));
            }
            if let (Some(min), Some(max)) = (def.min, def.max) {
                if min > max {
                    return Err(AppError::Validation(format!(
                        "{where_}: min ({min}) est supérieur à max ({max})"
                    )));
                }
            }
        }

        if def.multiline && def.value_type != "string" {
            return Err(AppError::Validation(format!(
                "{where_}: multiline ne s'applique qu'à type = \"string\" (ici \"{}\")",
                def.value_type
            )));
        }

        if let Some(parent) = &def.depends_on {
            if parent.trim().is_empty() {
                return Err(AppError::Validation(format!(
                    "{where_}: depends_on est vide"
                )));
            }
            if parent == &def.key {
                return Err(AppError::Validation(format!(
                    "{where_}: depends_on se référence lui-même"
                )));
            }
            // Resolved against this manifest on purpose: a typo would otherwise
            // hide the setting for good, with nothing to point at.
            if !bool_keys.contains(parent.as_str()) {
                return Err(AppError::Validation(format!(
                    "{where_}: depends_on = '{parent}' ne désigne aucun réglage \
                     booléen déclaré par ce module"
                )));
            }
        }
    }
    Ok(())
}

/// Longest acceptable group slug — it is a path segment, not a sentence.
const MAX_GROUP_ID_LEN: usize = 50;

/// Validates the `[[setting_groups]]` of a manifest and every reference to them.
///
/// A module that declares no group is valid and unchanged: `groups` empty and no
/// setting carrying a `group` passes straight through. What is refused is a
/// half-declaration — a setting pointing at a group that does not exist would
/// vanish from every page of the panel, silently, which is exactly the failure
/// mode groups exist to prevent.
///
/// `id` is checked as a URL slug because it IS one: it becomes a path segment of
/// `/admin/modules/<module>/<group>`. An accent or a space there would either be
/// percent-encoded on every link or break the route outright.
pub fn validate_setting_groups(
    module_id: &str,
    groups: &[SettingGroup],
    defs: &[SettingDef],
) -> Result<(), AppError> {
    let mut seen: std::collections::HashSet<&str> = std::collections::HashSet::new();

    for g in groups {
        let id = g.id.as_str();
        if id.is_empty() {
            return Err(AppError::Validation(format!(
                "{module_id}: un groupe de réglages a un id vide"
            )));
        }
        if id.len() > MAX_GROUP_ID_LEN {
            return Err(AppError::Validation(format!(
                "{module_id}: l'id de groupe '{id}' dépasse {MAX_GROUP_ID_LEN} caractères"
            )));
        }
        if !id
            .chars()
            .all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '-')
        {
            return Err(AppError::Validation(format!(
                "{module_id}: l'id de groupe '{id}' n'est pas un slug d'URL \
                 (minuscules, chiffres et tirets uniquement)"
            )));
        }
        if !seen.insert(id) {
            return Err(AppError::Validation(format!(
                "{module_id}: l'id de groupe '{id}' est déclaré deux fois"
            )));
        }
        if g.label.trim().is_empty() {
            return Err(AppError::Validation(format!(
                "{module_id}: le groupe '{id}' n'a pas de libellé"
            )));
        }
        if let Some(icon) = &g.icon {
            if icon.trim().is_empty() {
                return Err(AppError::Validation(format!(
                    "{module_id}: le groupe '{id}' déclare une icône vide"
                )));
            }
        }
    }

    for def in defs {
        let Some(group) = &def.group else { continue };
        if !seen.contains(group.as_str()) {
            return Err(AppError::Validation(format!(
                "{module_id}.{}: group = '{group}' ne désigne aucun \
                 [[setting_groups]] déclaré par ce module",
                def.key
            )));
        }
    }

    Ok(())
}

/// Reads back the groups a module pushed at registration, in menu order.
///
/// `position` first (ascending), then declaration order for whatever has none —
/// a sort that is stable, so a module that positions nothing keeps its manifest's
/// order rather than an arbitrary one.
/// The glyph that stands for a module: the icon of its ENTRY POINT — the
/// sidebar item with the lowest position, which is the same rule the shell and
/// the waffle menu already use to pick a module's face. Deriving it rather than
/// asking modules to declare a second icon keeps one answer to "what does this
/// application look like".
///
/// `None` when the module ships no sidebar item at all (a headless module); the
/// console then draws its neutral placeholder rather than borrowing another
/// module's glyph.
pub fn module_icon(sidebar_items: &[crate::modules::registry::SidebarItem]) -> Option<String> {
    sidebar_items
        .iter()
        .min_by_key(|item| item.position)
        .map(|item| item.icon.clone())
        .filter(|icon| !icon.trim().is_empty())
}

/// The icon stored at registration, read back from the module's config.
pub fn module_icon_from_config(config: Option<&serde_json::Value>) -> Option<String> {
    config
        .and_then(|c| c.get("icon"))
        .and_then(serde_json::Value::as_str)
        .map(str::to_string)
        .filter(|icon| !icon.trim().is_empty())
}

pub fn setting_groups_from_config(config: Option<&serde_json::Value>) -> Vec<SettingGroup> {
    let mut groups: Vec<SettingGroup> = config
        .and_then(|c| c.get("setting_groups"))
        .and_then(|g| serde_json::from_value(g.clone()).ok())
        .unwrap_or_default();
    groups.sort_by_key(|g| g.position.unwrap_or(i32::MAX));
    groups
}

/// Reads back the declarative schema a module pushed at registration.
///
/// The manifest is kept whole in `core.modules.config` (see `register_module`),
/// which is what makes every presentation field survive the round trip without
/// a column per attribute in `core.settings`.
pub async fn load_settings_schema(
    db: &sqlx::PgPool,
    module_id: &str,
) -> Result<Vec<SettingDef>, AppError> {
    let config: Option<serde_json::Value> =
        sqlx::query_scalar("SELECT config FROM core.modules WHERE id = $1")
            .bind(module_id)
            .fetch_optional(db)
            .await
            .map_err(|e| {
                tracing::error!(error = %e, module = %module_id, "lecture du schéma de réglages");
                AppError::Database(e)
            })?;

    Ok(config
        .as_ref()
        .and_then(|c| c.get("settings_schema"))
        .and_then(|s| serde_json::from_value(s.clone()).ok())
        .unwrap_or_default())
}

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

/// Refuse un appel interne agissant sur un module qui n'est pas celui de
/// l'appelant authentifié.
///
/// Un appelant NON identifié (secret maître : le core lui-même, un outil
/// d'exploitation, ou un module lancé hors supervision en développement) passe
/// comme avant — la compatibilité prime tant que `reject_master_internal_secret`
/// n'est pas activé.
fn ensure_caller_is(internal: &InternalRequest, module_id: &str) -> Result<(), AppError> {
    match internal.module_id() {
        Some(caller) if caller != module_id => {
            tracing::warn!(
                caller = %caller,
                target = %module_id,
                "Appel interne refusé : le module authentifié n'est pas celui visé"
            );
            Err(AppError::Forbidden)
        }
        _ => Ok(()),
    }
}

pub async fn register_module(
    State(state): State<AppState>,
    internal: InternalRequest,
    Json(dto): Json<RegisterModuleDto>,
) -> Result<impl axum::response::IntoResponse, AppError> {
    validate_module_id(&dto.module_id)?;
    ensure_caller_is(&internal, &dto.module_id)?;
    // Before anything is written: a manifest that declares a knob the console
    // could not render honestly is refused as a whole, not repaired silently.
    validate_settings_schema(&dto.module_id, &dto.settings_schema)?;
    // Same discipline for the pages the panel is split into: a knob assigned to
    // a group that does not exist would be rendered nowhere at all.
    validate_setting_groups(&dto.module_id, &dto.setting_groups, &dto.settings_schema)?;

    // Première inscription : is_enabled = TRUE (le module est actif par défaut).
    // Sur ON CONFLICT, is_enabled n'est PAS mis à jour — l'admin garde le contrôle.
    let display_name = dto.display_name.as_deref().unwrap_or(&dto.module_id);
    // The full settings manifest (every scope) is kept durably in core.modules.config
    // so the user-settings page can render even when the module process is down.
    // The groups travel by the same road as the schema: one JSONB document, no
    // column and no table per presentation attribute. The admin menu can then be
    // built from the module inventory alone, without a request per module.
    let config = serde_json::json!({
        "settings_path":   dto.settings_path,
        "settings_schema": dto.settings_schema,
        "setting_groups":  dto.setting_groups,
        // The module's own glyph, kept HERE rather than read back from its
        // running instance: the admin inventory lists modules that are stopped
        // or switched off, and those are precisely the rows an operator needs to
        // recognise at a glance. An icon that disappears when a module stops
        // would blank exactly the entries worth looking at.
        "icon":            module_icon(&dto.sidebar_items),
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

    // Seed the DECLARATION of every setting into core.settings, which since
    // migration 000060 is the schema table: key, type, enum domain, owning
    // module, factory default, label, visibility. The values live in
    // core.setting_values, one row per scope, and none is created here — a
    // freshly declared setting must read as "factory", not as "set at instance
    // level". The `value` column is a compatibility mirror of the instance scope
    // and is deliberately left out of the conflict update: an admin-set value is
    // never clobbered by a re-registration.
    //
    // User-scoped settings are seeded too, unlike before: without a row in the
    // schema table they have no foreign key to hang a per-account value on, and
    // the per-scope resolution could not see them at all.
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
        // A per-account preference has no instance-wide value to publish, so it
        // stays out of the public /api/v1/config whatever the manifest says:
        // what would be exposed there is a default nobody chose.
        let is_public = def.public && def.scope != "user";
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
        .bind(is_public)
        .bind(&def.scope)
        .bind(&def.value_type)
        .bind(allowed.as_ref())
        .bind(&dto.module_id)
        .execute(&mut *tx)
        .await?;
    }

    // Privilege catalogue: same forced prefixing as the settings above, and the
    // orphan flag cleared for a module that has come back.
    crate::authz::catalog::register_module_privileges(&mut tx, &dto.module_id, &dto.privileges)
        .await?;

    // Rule catalogue: what this module lets an administrator react to, and what
    // it lets a rule do to it. Third declaration of the same shape, on purpose —
    // a module widens the core's vocabulary and the core learns nothing about
    // the module beyond what it was handed.
    crate::rules::catalog::register_module(
        &mut tx,
        &dto.module_id,
        &dto.rule_triggers,
        &dto.rule_actions,
    )
    .await?;

    tx.commit().await?;

    // A module that just registered is no longer an orphan's namespace, and one
    // that never came back still is. Off the request path.
    {
        let st = state.clone();
        tokio::spawn(async move {
            if let Err(e) = crate::authz::catalog::refresh_orphans(&st.db).await {
                tracing::warn!(error = %e, "authz: réévaluation des orphelins impossible");
            }
            if let Err(e) = crate::rules::catalog::refresh_orphans(&st.db).await {
                tracing::warn!(error = %e, "rules: réévaluation des orphelins impossible");
            }
            // A module coming back can re-arm rules that were loaded as dead:
            // rebuild the memory index rather than wait for the next write.
            crate::rules::store::notify_reload(&st.db).await;
        });
    }
    crate::authz::cache::invalidate_all();

    state.modules.write().await.register(instance);

    state.events.publish(AppEvent::ModuleRegistered {
        module_id: dto.module_id.clone(),
        base_url:  dto.base_url,
    });

    // When the drive comes online, (re)build the read-only theme mirror it hosts
    // under System/Themes. Best-effort, off the request path.
    if dto.module_id == "drive" {
        let st = state.clone();
        tokio::spawn(async move { crate::handlers::theme_mirror::sync(&st).await });
    }

    Ok((StatusCode::CREATED, Json(json!({ "message": "Module enregistré" }))))
}

/// GET /api/v1/modules/:module/config
///
/// Renvoie, pour l'utilisateur courant, le schéma des paramètres du module et
/// leur résolution complète. Depuis la migration `000060` la chaîne n'est plus
/// « surcharge utilisateur ?? valeur globale ?? défaut » mais la résolution par
/// portée du core :
///
/// ```text
///   utilisateur ?? groupe ?? unité la plus proche ?? … ?? instance ?? usine
/// ```
///
/// C'est ce qui fait qu'un réglage de module posé sur une unité descend
/// réellement à ses comptes. La provenance (`source`) et le verrou
/// (`locked`) accompagnent chaque entrée : un module qui affiche un contrôle
/// désactivé doit pouvoir dire pourquoi.
///
/// Filtré par privilège : un non-admin ne voit pas les paramètres de portée
/// `global` (réservés admin).
/// A module reading back its OWN instance settings, as the administrator left
/// them in the console.
///
/// Until now a module could declare settings and the console could edit them,
/// but the module itself had no way to read the result: its own schema forbids
/// touching `core.settings`, and the user-facing config route needs a user
/// token, which a background worker does not have. That gap is why settings
/// that drive a module's *runtime* (a listener's port, say) had nowhere to live.
///
/// The caller is identified by the internal secret it presented, never by the
/// request — a module can only ever read its own keys. Only instance-scoped
/// settings are returned: `user` scope has no single value to speak of.
pub async fn internal_module_settings(
    State(state): State<AppState>,
    internal: InternalRequest,
) -> Result<Json<serde_json::Value>, AppError> {
    let module_id = internal
        .module_id()
        .ok_or(AppError::Forbidden)?
        .to_string();

    let rows: Vec<(String, serde_json::Value, Option<serde_json::Value>)> = sqlx::query_as(
        "SELECT key, value, default_value FROM core.settings \
         WHERE module_id = $1 AND scope IN ('global', 'overridable')",
    )
    .bind(&module_id)
    .fetch_all(&state.db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, module = %module_id, "réglages internes du module");
        AppError::Database(e)
    })?;

    let prefix = format!("{module_id}.");
    let mut settings = serde_json::Map::new();
    for (key, value, default_value) in rows {
        let short = key.strip_prefix(&prefix).unwrap_or(&key).to_string();
        let effective = if value.is_null() {
            default_value.unwrap_or(serde_json::Value::Null)
        } else {
            value
        };
        settings.insert(short, effective);
    }

    Ok(Json(json!({ "module": module_id, "settings": settings })))
}

pub async fn get_module_config(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
    // This route lives outside `/admin/*`, so the layer guard does not run and
    // the context is resolved here. It replaces a hand-rolled
    // `user.role == "admin"` test — the kind of check that silently stops
    // agreeing with the rest of the system the day delegation arrives.
    ctx: AdminCtx,
    AxumPath(module_id): AxumPath<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    use crate::settings::{chain, ScopeKind, SettingScope};

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

    // Pages of the panel, in menu order. Empty for a module that declares none —
    // the console then renders the single page it always did.
    let groups = setting_groups_from_config(config.as_ref());

    // "May this caller see instance-scoped settings" is a settings question, so
    // it asks for the settings privilege rather than for a role.
    let is_admin = ctx.has(keys::SETTINGS_READ);
    let user_scope = SettingScope::user(user.id);
    let mut out: Vec<serde_json::Value> = Vec::new();

    for def in &schema {
        // Les non-admins ne voient pas les paramètres purement globaux.
        if def.scope == "global" && !is_admin {
            continue;
        }
        let full_key = format!("{}.{}", module_id, def.key);
        let resolved = chain::resolve_for(&state.db, &full_key, &user_scope).await?;

        // `global` reste exposé pour les interfaces existantes, mais il désigne
        // désormais « la valeur que ce compte hérite », c'est-à-dire l'unité la
        // plus proche s'il y en a une, sinon l'instance — et non plus le seul
        // niveau instance.
        let inherited = resolved.inherited_value.clone();
        let user_val = resolved
            .chain
            .iter()
            .find(|l| l.scope_type == ScopeKind::User.as_str())
            .map(|l| l.value.clone());

        let effective = resolved
            .value
            .clone()
            .unwrap_or_else(|| def.default.clone());

        out.push(json!({
            "key":              def.key,
            "scope":            def.scope,
            "type":             def.value_type,
            "values":           def.values,
            "label":            def.label,
            "description":      def.description,
            "category":         def.category.clone().unwrap_or_else(|| module_id.clone()),
            // Which page of the panel this belongs to; null = ungrouped.
            "group":            def.group,
            "default":          def.default,
            // Presentation metadata, forwarded verbatim: the console renders
            // the schema and nothing else, so a knob added by a module shows up
            // — searchable, bounded, folded where it belongs — with no change
            // on this side of the wire.
            "advanced":         def.advanced,
            "risk":             def.risk,
            "min":              def.min,
            "max":              def.max,
            "unit":             def.unit,
            "placeholder":      def.placeholder,
            "multiline":        def.multiline,
            "depends_on":       def.depends_on,
            "global":           inherited,
            "user":             user_val,
            "effective":        effective,
            "source":           resolved.source,
            "locked":           resolved.locked_above,
            "lock_source":      resolved.lock_source,
            // Un réglage verrouillé plus haut n'est plus modifiable par le
            // compte, quelle que soit sa portée déclarée.
            "editable_by_user": (def.scope == "user" || def.scope == "overridable")
                                    && resolved.can_override(),
        }));
    }

    Ok(Json(json!({
        "module":         module_id,
        "settings":       out,
        "setting_groups": groups,
    })))
}

pub async fn module_heartbeat(
    State(state): State<AppState>,
    internal: InternalRequest,
    axum::extract::Path(module_id): axum::extract::Path<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    ensure_caller_is(&internal, &module_id)?;
    let found = state.modules.write().await.update_heartbeat(&module_id);
    if found {
        Ok(Json(json!({ "ok": true })))
    } else {
        Err(AppError::NotFound(format!("Module '{module_id}' non enregistré")))
    }
}

pub async fn unregister_module(
    State(state): State<AppState>,
    internal: InternalRequest,
    axum::extract::Path(module_id): axum::extract::Path<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    ensure_caller_is(&internal, &module_id)?;
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

#[cfg(test)]
mod tests {
    use super::*;

    fn def(key: &str, value_type: &str) -> SettingDef {
        SettingDef {
            key:         key.into(),
            scope:       "global".into(),
            value_type:  value_type.into(),
            values:      None,
            default:     serde_json::Value::Null,
            label:       None,
            description: None,
            category:    None,
            group:       None,
            public:      false,
            advanced:    false,
            risk:        None,
            min:         None,
            max:         None,
            unit:        None,
            placeholder: None,
            multiline:   false,
            depends_on:  None,
        }
    }

    /// A manifest written before the presentation fields existed must still
    /// deserialise — that is the whole compatibility promise.
    #[test]
    fn legacy_manifest_deserialises_with_defaults() {
        let raw = serde_json::json!({
            "key": "port", "scope": "global", "type": "int", "default": 25
        });
        let d: SettingDef = serde_json::from_value(raw).expect("legacy shape");
        assert!(!d.advanced);
        assert!(!d.multiline);
        assert!(d.risk.is_none());
        assert!(d.min.is_none() && d.max.is_none());
        assert!(d.unit.is_none() && d.placeholder.is_none() && d.depends_on.is_none());
        assert!(d.group.is_none());
    }

    // ── Setting groups ──────────────────────────────────────────────────────

    fn group(id: &str) -> SettingGroup {
        SettingGroup {
            id:          id.into(),
            label:       format!("Groupe {id}"),
            icon:        None,
            position:    None,
            description: None,
        }
    }

    /// Every module but `mail` declares no group at all — that has to keep
    /// registering exactly as before.
    #[test]
    fn a_manifest_without_groups_is_valid() {
        let defs = [def("port", "int"), def("host", "string")];
        assert!(validate_setting_groups("drive", &[], &defs).is_ok());
        assert!(validate_setting_groups("drive", &[], &[]).is_ok());
    }

    /// A setting may stay ungrouped even in a manifest that declares groups:
    /// splitting a panel is opt-in, setting by setting.
    #[test]
    fn a_setting_without_group_is_valid() {
        let mut grouped = def("smtp_port", "int");
        grouped.group = Some("services".into());
        let loose = def("legacy_flag", "bool");
        assert!(validate_setting_groups("mail", &[group("services")], &[grouped, loose]).is_ok());
    }

    #[test]
    fn accepts_a_well_formed_group_declaration() {
        let mut g = group("transport-tls");
        g.icon = Some("Lock".into());
        g.position = Some(3);
        g.description = Some("Le chiffrement des connexions.".into());
        let mut d = def("tls_min_version", "string");
        d.group = Some("transport-tls".into());
        assert!(validate_setting_groups("mail", &[g], &[d]).is_ok());
    }

    #[test]
    fn rejects_a_dangling_group_reference() {
        let mut d = def("spf_fail_action", "string");
        d.group = Some("authentification".into());
        let err = validate_setting_groups("mail", &[group("authentication")], &[d]).unwrap_err();
        assert!(matches!(err, AppError::Validation(ref m)
            if m.contains("mail.spf_fail_action") && m.contains("authentification")));
    }

    /// A group cannot be referenced by a module that declares none: the whole
    /// point is that the reference resolves inside the same manifest.
    #[test]
    fn rejects_a_group_reference_without_any_group() {
        let mut d = def("a", "bool");
        d.group = Some("services".into());
        assert!(validate_setting_groups("mail", &[], &[d]).is_err());
    }

    #[test]
    fn rejects_a_non_slug_group_id() {
        for bad in ["Services", "authentification générale", "with space", "under_score", "à"] {
            let err = validate_setting_groups("mail", &[group(bad)], &[]).unwrap_err();
            assert!(
                matches!(err, AppError::Validation(ref m) if m.contains("slug")),
                "id '{bad}' aurait dû être refusé comme slug"
            );
        }
        // Digits and hyphens are what a URL segment is made of.
        assert!(validate_setting_groups("mail", &[group("imap-4")], &[]).is_ok());
    }

    #[test]
    fn rejects_empty_or_duplicate_group_id() {
        let err = validate_setting_groups("mail", &[group("")], &[]).unwrap_err();
        assert!(matches!(err, AppError::Validation(ref m) if m.contains("id vide")));

        let err = validate_setting_groups("mail", &[group("a"), group("a")], &[]).unwrap_err();
        assert!(matches!(err, AppError::Validation(ref m) if m.contains("deux fois")));

        let long = "a".repeat(MAX_GROUP_ID_LEN + 1);
        assert!(validate_setting_groups("mail", &[group(&long)], &[]).is_err());
    }

    #[test]
    fn rejects_empty_group_label_or_icon() {
        let mut blank = group("services");
        blank.label = "   ".into();
        let err = validate_setting_groups("mail", &[blank], &[]).unwrap_err();
        assert!(matches!(err, AppError::Validation(ref m) if m.contains("libellé")));

        let mut no_icon = group("services");
        no_icon.icon = Some(" ".into());
        assert!(validate_setting_groups("mail", &[no_icon], &[]).is_err());
    }

    /// The manifest shape the modules actually send, and the shape the console
    /// reads back — both go through serde, so both are pinned here.
    #[test]
    fn group_round_trips_through_json() {
        let raw = serde_json::json!({
            "id": "authentication",
            "label": "Authentification et signature",
            "icon": "ShieldCheck",
            "position": 4,
            "description": "Ce qui prouve qu'un message vient de son expéditeur."
        });
        let g: SettingGroup = serde_json::from_value(raw).expect("shape complète");
        assert_eq!(g.id, "authentication");
        assert_eq!(g.position, Some(4));

        // icon/position/description are optional: a group may be a label alone.
        let minimal: SettingGroup =
            serde_json::from_value(serde_json::json!({ "id": "misc", "label": "Divers" }))
                .expect("shape minimale");
        assert!(minimal.icon.is_none() && minimal.position.is_none());

        let back = serde_json::to_value(&g).expect("sérialisation");
        assert_eq!(back["icon"], "ShieldCheck");
    }

    /// What the admin menu depends on: positioned groups first, and whatever
    /// carries no position after them, in declaration order.
    #[test]
    fn groups_are_read_back_in_menu_order() {
        let config = serde_json::json!({
            "setting_groups": [
                { "id": "z-late",  "label": "Z" },
                { "id": "second",  "label": "S", "position": 2 },
                { "id": "first",   "label": "F", "position": 1 },
                { "id": "y-late",  "label": "Y" },
            ]
        });
        let ids: Vec<String> = setting_groups_from_config(Some(&config))
            .into_iter()
            .map(|g| g.id)
            .collect();
        assert_eq!(ids, ["first", "second", "z-late", "y-late"]);

        // A module registered before groups existed has no key at all.
        assert!(setting_groups_from_config(Some(&serde_json::json!({}))).is_empty());
        assert!(setting_groups_from_config(None).is_empty());
    }

    #[test]
    fn accepts_a_well_formed_manifest() {
        let mut flag = def("greylisting_enabled", "bool");
        flag.risk = Some("warning".into());
        let mut delay = def("greylist_delay_secs", "int");
        delay.min = Some(0);
        delay.max = Some(3600);
        delay.unit = Some("s".into());
        delay.advanced = true;
        delay.depends_on = Some("greylisting_enabled".into());
        let mut list = def("blocked_domains", "string");
        list.multiline = true;
        list.placeholder = Some("exemple.test".into());
        assert!(validate_settings_schema("mail", &[flag, delay, list]).is_ok());
    }

    #[test]
    fn rejects_unknown_risk() {
        let mut d = def("relay_host", "string");
        d.risk = Some("critical".into());
        let err = validate_settings_schema("mail", &[d]).unwrap_err();
        assert!(matches!(err, AppError::Validation(ref m) if m.contains("risk 'critical'")));
    }

    #[test]
    fn rejects_inverted_bounds() {
        let mut d = def("max_size_mb", "int");
        d.min = Some(100);
        d.max = Some(10);
        let err = validate_settings_schema("mail", &[d]).unwrap_err();
        assert!(matches!(err, AppError::Validation(ref m) if m.contains("supérieur à max")));
    }

    #[test]
    fn rejects_bounds_on_non_int() {
        let mut d = def("banner", "string");
        d.max = Some(10);
        assert!(validate_settings_schema("mail", &[d]).is_err());
    }

    #[test]
    fn rejects_multiline_on_non_string() {
        let mut d = def("port", "int");
        d.multiline = true;
        assert!(validate_settings_schema("mail", &[d]).is_err());
    }

    #[test]
    fn rejects_empty_or_dangling_depends_on() {
        let mut empty = def("a", "int");
        empty.depends_on = Some("   ".into());
        assert!(validate_settings_schema("mail", &[empty]).is_err());

        let mut dangling = def("a", "int");
        dangling.depends_on = Some("typo_enabled".into());
        assert!(validate_settings_schema("mail", &[dangling]).is_err());

        // Points at a real key, but that key is not a boolean.
        let mut wrong_type = def("a", "int");
        wrong_type.depends_on = Some("host".into());
        let host = def("host", "string");
        assert!(validate_settings_schema("mail", &[wrong_type, host]).is_err());

        let mut selfref = def("a", "bool");
        selfref.depends_on = Some("a".into());
        assert!(validate_settings_schema("mail", &[selfref]).is_err());
    }

    #[test]
    fn enforces_bounds_on_write() {
        let mut d = def("retry_minutes", "int");
        d.min = Some(1);
        d.max = Some(60);
        assert!(d.validate_value(&serde_json::json!(30)).is_ok());
        // A console echoing a text field sends the number as a string.
        assert!(d.validate_value(&serde_json::json!("30")).is_ok());
        assert!(d.validate_value(&serde_json::json!(0)).is_err());
        assert!(d.validate_value(&serde_json::json!(61)).is_err());
        assert!(d.validate_value(&serde_json::json!("abc")).is_err());
        // Unbounded declarations, and non-int types, let everything through.
        let plain = def("host", "string");
        assert!(plain.validate_value(&serde_json::json!("anything")).is_ok());
    }
}
