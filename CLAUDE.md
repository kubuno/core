# Kubuno Core — Prompt Claude Code (Rust)

## Contexte & mission

Implémenter le **core de Kubuno** : plateforme cloud self-hosted open source (AGPLv3), alternative souverainiste à Google Workspace et Microsoft 365. Le core est le "système d'exploitation" de la plateforme — il fournit les infrastructures dont les modules indépendants (files, photos, chat, agenda, ai…) ont besoin.

**Principe fondamental :** les modules sont des processus séparés (Rust ou Python) qui se connectent au core au démarrage. Le core proxifie leurs routes, distribue les events, gère leur cycle de vie. Aucun module métier dans cette session.

---

## Stack technique

| Couche | Technologie |
|---|---|
| Langage | Rust édition 2021 |
| HTTP Framework | Axum 0.7 |
| Async runtime | Tokio 1.x (full features) |
| Base de données | PostgreSQL 16 via sqlx 0.8 (compile-time checked queries) |
| Pub/Sub modules | PostgreSQL `LISTEN/NOTIFY` |
| File de jobs | PostgreSQL `SKIP LOCKED` |
| Sérialisation | serde / serde_json |
| Auth JWT | jsonwebtoken 9.x |
| Crypto | argon2 (passwords) + aes-gcm + rand |
| Config | config 0.14 + dotenvy |
| Logging | tracing + tracing-subscriber (JSON prod, pretty dev) |
| Erreurs | thiserror (lib) + anyhow (bin/handlers) |
| Validation | validator 0.18 |
| HTTP Client | reqwest 0.12 |
| WebSocket | axum intégré (tokio-tungstenite) |
| Migrations | sqlx-cli (fichiers .sql versionnés) |
| Tests | tokio::test + sqlx test transactions |
| Frontend | React 19 + TypeScript + Vite 6 + Tailwind CSS v4 + Zustand + React Query v5 |

---

## Structure du projet

```
kubuno/
├── Cargo.toml                      ← workspace root
├── crates/
│   └── kubuno-core/
│       ├── Cargo.toml
│       └── src/
│           ├── main.rs             ← bootstrap DI, lance le serveur
│           ├── lib.rs              ← ré-exports publics
│           ├── config/settings.rs  ← structs Settings, ServerSettings, DbSettings, etc.
│           ├── database/
│           │   ├── pool.rs         ← initialisation PgPool
│           │   ├── migrations.rs   ← runner de migrations
│           │   └── notify.rs       ← LISTEN/NOTIFY PostgreSQL
│           ├── crypto/
│           │   ├── password.rs     ← argon2id hash + verify
│           │   ├── token.rs        ← CSPRNG tokens
│           │   └── encryption.rs   ← AES-256-GCM
│           ├── auth/
│           │   ├── jwt.rs          ← génération/validation JWT
│           │   ├── middleware.rs   ← require_auth, require_admin, AuthUser extractor
│           │   ├── rbac.rs         ← roles, permissions, guards
│           │   └── oauth.rs        ← OAuth 2.0 / OIDC (Google, GitHub)
│           ├── models/
│           │   ├── user.rs         ← User, CreateUserDto, UpdateUserDto
│           │   ├── session.rs      ← RefreshToken, Session
│           │   └── module_reg.rs   ← RegisteredModule, ModuleHealth
│           ├── errors/app_error.rs ← AppError enum, impl IntoResponse
│           ├── events/
│           │   ├── bus.rs          ← EventBus (tokio broadcast)
│           │   └── types.rs        ← AppEvent enum exhaustif
│           ├── storage/
│           │   ├── backend.rs      ← trait StorageBackend
│           │   ├── local.rs        ← filesystem local
│           │   └── s3.rs           ← S3-compatible
│           ├── modules/
│           │   ├── registry.rs     ← ModuleRegistry
│           │   ├── manager.rs      ← install/start/stop/health-check
│           │   ├── proxy.rs        ← reverse proxy HTTP vers modules
│           │   └── manifest.rs     ← parsing module.toml
│           ├── websocket/hub.rs    ← WsHub central, rooms par user_id
│           ├── handlers/
│           │   ├── auth.rs         ← register, login, logout, refresh
│           │   ├── users.rs        ← /me GET/PATCH, sessions
│           │   ├── modules.rs      ← GET /modules, register interne
│           │   ├── health.rs       ← /health, /ready
│           │   ├── ws.rs           ← WebSocket upgrade
│           │   └── admin/          ← users.rs, settings.rs
│           ├── router/builder.rs   ← Router Axum final + layers
│           └── state/app_state.rs  ← AppState: Arc<Inner>
├── migrations/
│   ├── 000001_core_users.{up,down}.sql
│   ├── 000002_core_sessions.{up,down}.sql
│   ├── 000003_core_modules.{up,down}.sql
│   ├── 000004_core_settings.{up,down}.sql
│   └── 000005_core_jobs.{up,down}.sql
├── frontend/
│   └── src/
│       ├── core/
│       │   ├── shell/          ← Shell.tsx, Sidebar.tsx, Topbar.tsx, MobileNav.tsx
│       │   ├── slots/          ← SlotRegistry.tsx
│       │   ├── auth/           ← LoginPage.tsx, RegisterPage.tsx, OAuthCallback.tsx
│       │   ├── settings/       ← SettingsPage.tsx
│       │   ├── admin/          ← AdminPage.tsx, UsersPanel, ModulesPanel, SettingsPanel
│       │   ├── store/          ← authStore.ts, modulesStore.ts, wsStore.ts
│       │   ├── api/            ← client.ts, auth.ts, modules.ts
│       │   └── types/index.ts
│       └── index.css
├── .env.example
├── Makefile
└── README.md
```

---

## Schéma de base de données

Le core utilise le schéma PostgreSQL `core`. Chaque module aura son propre schéma.

### 000001_core_users.up.sql

```sql
CREATE SCHEMA IF NOT EXISTS core;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";
CREATE EXTENSION IF NOT EXISTS "citext";

CREATE TABLE core.users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email           CITEXT UNIQUE NOT NULL,
    username        VARCHAR(100) UNIQUE NOT NULL,
    password_hash   VARCHAR(255),
    display_name    VARCHAR(255),
    avatar_url      VARCHAR(1000),
    role            VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'guest')),
    quota_bytes     BIGINT NOT NULL DEFAULT 10737418240,
    used_bytes      BIGINT NOT NULL DEFAULT 0 CHECK (used_bytes >= 0),
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    email_verified  BOOLEAN NOT NULL DEFAULT FALSE,
    oauth_provider  VARCHAR(50),
    oauth_id        VARCHAR(255),
    preferences     JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login_at   TIMESTAMPTZ,
    CONSTRAINT oauth_unique UNIQUE (oauth_provider, oauth_id),
    CONSTRAINT password_or_oauth CHECK (password_hash IS NOT NULL OR oauth_provider IS NOT NULL)
);

CREATE INDEX idx_core_users_email  ON core.users(email);
CREATE INDEX idx_core_users_role   ON core.users(role);
CREATE INDEX idx_core_users_active ON core.users(is_active) WHERE is_active = TRUE;

CREATE OR REPLACE FUNCTION core.set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON core.users
    FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();
```

### 000002_core_sessions.up.sql

```sql
CREATE TABLE core.refresh_tokens (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id       UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    token_hash    VARCHAR(64) UNIQUE NOT NULL,  -- SHA-256 du token brut
    device_name   VARCHAR(255),
    device_type   VARCHAR(50),                  -- 'web' | 'mobile' | 'desktop' | 'api'
    ip_address    INET,
    user_agent    TEXT,
    expires_at    TIMESTAMPTZ NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at    TIMESTAMPTZ,
    revoke_reason VARCHAR(100)                  -- 'logout' | 'password_change' | 'admin'
);
CREATE INDEX idx_core_rt_user    ON core.refresh_tokens(user_id);
CREATE INDEX idx_core_rt_hash    ON core.refresh_tokens(token_hash);
CREATE INDEX idx_core_rt_expires ON core.refresh_tokens(expires_at) WHERE revoked_at IS NULL;

CREATE TABLE core.verification_tokens (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) UNIQUE NOT NULL,
    purpose    VARCHAR(50) NOT NULL CHECK (purpose IN ('email_verify', 'password_reset', 'invite')),
    expires_at TIMESTAMPTZ NOT NULL,
    used_at    TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_core_vt_hash ON core.verification_tokens(token_hash) WHERE used_at IS NULL;
```

### 000003_core_modules.up.sql

```sql
CREATE TABLE core.modules (
    id            VARCHAR(100) PRIMARY KEY,
    display_name  VARCHAR(255) NOT NULL,
    version       VARCHAR(50) NOT NULL,
    description   TEXT,
    author        VARCHAR(255),
    license       VARCHAR(50),
    homepage_url  VARCHAR(1000),
    runtime       VARCHAR(20) NOT NULL DEFAULT 'rust' CHECK (runtime IN ('rust', 'python', 'node', 'binary')),
    dependencies  TEXT[] NOT NULL DEFAULT '{}',
    is_enabled    BOOLEAN NOT NULL DEFAULT TRUE,
    is_core_module BOOLEAN NOT NULL DEFAULT FALSE,
    config        JSONB NOT NULL DEFAULT '{}',
    installed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE core.module_instances (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id         VARCHAR(100) NOT NULL REFERENCES core.modules(id) ON DELETE CASCADE,
    base_url          VARCHAR(500) NOT NULL,
    routes            JSONB NOT NULL DEFAULT '[]',
    sidebar_items     JSONB NOT NULL DEFAULT '[]',
    subscribed_events TEXT[] NOT NULL DEFAULT '{}',
    status            VARCHAR(20) NOT NULL DEFAULT 'starting'
                          CHECK (status IN ('starting', 'healthy', 'degraded', 'stopped')),
    last_heartbeat    TIMESTAMPTZ,
    pid               INTEGER,
    registered_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_core_mi_module ON core.module_instances(module_id);
CREATE INDEX idx_core_mi_status ON core.module_instances(status);

CREATE TABLE core.event_log (
    id            BIGSERIAL PRIMARY KEY,
    event_type    VARCHAR(100) NOT NULL,
    source_module VARCHAR(100),
    payload       JSONB NOT NULL DEFAULT '{}',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_core_el_type    ON core.event_log(event_type);
CREATE INDEX idx_core_el_created ON core.event_log(created_at DESC);

CREATE OR REPLACE FUNCTION core.cleanup_event_log() RETURNS void AS $$
BEGIN DELETE FROM core.event_log WHERE created_at < NOW() - INTERVAL '30 days'; END;
$$ LANGUAGE plpgsql;
```

### 000004_core_settings.up.sql

```sql
CREATE TABLE core.settings (
    key        VARCHAR(255) PRIMARY KEY,
    value      JSONB NOT NULL,
    category   VARCHAR(100) NOT NULL DEFAULT 'general',
    label      VARCHAR(255),
    description TEXT,
    is_public  BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES core.users(id) ON DELETE SET NULL
);

INSERT INTO core.settings (key, value, category, label, is_public) VALUES
    ('instance.name',               '"Kubuno"',              'general',  'Nom de l''instance',                TRUE),
    ('instance.description',        '"Mon cloud personnel"', 'general',  'Description',                       TRUE),
    ('instance.logo_url',           'null',                  'general',  'URL du logo personnalisé',          TRUE),
    ('instance.color_primary',      '"#1a73e8"',             'general',  'Couleur principale (hex)',          TRUE),
    ('auth.registration_open',      'true',                  'auth',     'Inscription publique activée',      FALSE),
    ('auth.email_verification',     'false',                 'auth',     'Vérification email obligatoire',    FALSE),
    ('auth.oauth_google_enabled',   'false',                 'auth',     'Connexion Google activée',          TRUE),
    ('auth.oauth_github_enabled',   'false',                 'auth',     'Connexion GitHub activée',          TRUE),
    ('storage.default_quota_bytes', '10737418240',           'storage',  'Quota par défaut (bytes)',          FALSE),
    ('storage.max_upload_bytes',    '5368709120',            'storage',  'Taille max upload (bytes)',         TRUE),
    ('security.jwt_access_ttl_s',   '900',                   'security', 'Durée token accès (secondes)',      FALSE),
    ('security.jwt_refresh_ttl_d',  '30',                    'security', 'Durée token refresh (jours)',       FALSE),
    ('security.max_sessions',       '10',                    'security', 'Sessions simultanées max par user', FALSE);
```

### 000005_core_jobs.up.sql

```sql
CREATE TABLE core.jobs (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_type     VARCHAR(100) NOT NULL,
    module_id    VARCHAR(100),
    payload      JSONB NOT NULL DEFAULT '{}',
    status       VARCHAR(20) NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'running', 'done', 'failed')),
    attempts     INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 3,
    error        TEXT,
    run_after    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at   TIMESTAMPTZ,
    done_at      TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_core_jobs_pending ON core.jobs (run_after) WHERE status = 'pending';

CREATE TABLE core.rate_limit_windows (
    key          VARCHAR(255) NOT NULL,
    window_start TIMESTAMPTZ NOT NULL,
    count        INTEGER NOT NULL DEFAULT 1,
    PRIMARY KEY (key, window_start)
);
CREATE INDEX idx_core_rl_key ON core.rate_limit_windows(key, window_start DESC);
```

---

## Implémentation Rust — Interfaces clés

### `src/config/settings.rs`

```rust
#[derive(Debug, Clone, Deserialize)]
pub struct Settings {
    pub server:   ServerSettings,
    pub database: DatabaseSettings,
    pub auth:     AuthSettings,
    pub storage:  StorageSettings,
    pub logging:  LoggingSettings,
}

#[derive(Debug, Clone, Deserialize)]
pub struct ServerSettings {
    pub host:            String,   // défaut: "0.0.0.0"
    pub port:            u16,      // défaut: 8080
    pub frontend_dist:   String,
    pub internal_secret: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct DatabaseSettings {
    pub url:             String,
    pub max_connections: u32,      // défaut: 20
    pub min_connections: u32,      // défaut: 2
    pub connect_timeout: Duration, // défaut: 10s
    pub run_migrations:  bool,     // défaut: true
}

#[derive(Debug, Clone, Deserialize)]
pub struct AuthSettings {
    pub jwt_secret:          String,
    pub access_token_ttl:    Duration, // défaut: 15min
    pub refresh_token_ttl:   Duration, // défaut: 30 jours
    pub oauth_google_id:     Option<String>,
    pub oauth_google_secret: Option<String>,
    pub oauth_github_id:     Option<String>,
    pub oauth_github_secret: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct StorageSettings {
    pub backend:       StorageBackend,
    pub local_path:    String,
    pub s3_bucket:     Option<String>,
    pub s3_region:     Option<String>,
    pub s3_endpoint:   Option<String>,
    pub s3_access_key: Option<String>,
    pub s3_secret_key: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
pub enum StorageBackend { Local, S3 }

#[derive(Debug, Clone, Deserialize)]
pub struct LoggingSettings {
    pub level:  String,
    pub format: LogFormat,
}

#[derive(Debug, Clone, Deserialize)]
pub enum LogFormat { Pretty, Json }

impl Settings {
    pub fn load() -> Result<Self, config::ConfigError> {
        // Ordre: defaults → config.toml → env vars (préfixe KV_)
        // Ex: KV_SERVER_PORT=9000
    }
}
```

### `src/state/app_state.rs`

```rust
#[derive(Clone)]
pub struct AppState {
    pub db:       PgPool,
    pub settings: Arc<Settings>,
    pub events:   Arc<EventBus>,
    pub modules:  Arc<RwLock<ModuleRegistry>>,
    pub storage:  Arc<dyn StorageBackend>,
    pub ws_hub:   Arc<WsHub>,
}
```

### `src/errors/app_error.rs`

```rust
#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("Non authentifié")]           Unauthorized,
    #[error("Accès refusé")]              Forbidden,
    #[error("Ressource introuvable: {0}")] NotFound(String),
    #[error("Données invalides: {0}")]    Validation(String),
    #[error("Conflit: {0}")]              Conflict(String),
    #[error("Quota dépassé")]             QuotaExceeded,
    #[error("Erreur base de données")]    Database(#[from] sqlx::Error),
    #[error("Erreur interne")]            Internal(#[from] anyhow::Error),
}
// Unauthorized→401, Forbidden→403, NotFound→404, Validation→422,
// Conflict→409, QuotaExceeded→507, Database/Internal→500
```

### `src/database/notify.rs`

```rust
// Connexion séparée du pool, écoute le canal "kubuno_events"
pub async fn start_pg_listener(db_url: &str, event_bus: Arc<EventBus>) -> Result<()> {
    // sqlx::postgres::PgListener → désérialise en AppEvent → publie dans EventBus
    // Reconnexion automatique sur perte de connexion
}

pub async fn pg_notify(db: &PgPool, event: &AppEvent) -> Result<()> {
    let payload = serde_json::to_string(event)?;
    sqlx::query("SELECT pg_notify('kubuno_events', $1)")
        .bind(&payload).execute(db).await?;
    Ok(())
}
```

### `src/auth/jwt.rs`

**Access Token (JWT, 15 min) :**
```rust
#[derive(Debug, Serialize, Deserialize)]
pub struct AccessClaims {
    pub sub:   Uuid,    // user_id
    pub email: String,
    pub role:  String,
    pub exp:   i64,
    pub iat:   i64,
    pub jti:   Uuid,
}
```

**Refresh Token (opaque, 30 jours) :** rand 32 bytes → base64url. Seul son SHA-256 stocké en DB. Envoyé **uniquement** en cookie `HttpOnly; Secure; SameSite=Strict`. Jamais dans le body.

```rust
pub struct JwtService { secret: String, access_token_ttl: Duration }

impl JwtService {
    pub fn generate_access_token(&self, user: &User) -> Result<String>;
    pub fn validate_access_token(&self, token: &str) -> Result<AccessClaims>;
    pub fn generate_refresh_token() -> (String, String); // (token_brut, hash)
}
```

### `src/auth/middleware.rs`

```rust
pub struct AuthUser(pub User);

#[async_trait]
impl<S> FromRequestParts<S> for AuthUser where S: Send + Sync {
    // Extrait JWT de Authorization: Bearer <token>, valide, charge user depuis DB
}

// require_auth: extrait AuthUser, 401 si absent/invalide
// require_admin: require_auth + vérifie role == "admin", 403 sinon
```

### `src/events/bus.rs`

```rust
pub struct EventBus { sender: broadcast::Sender<AppEvent> }

impl EventBus {
    pub fn new(capacity: usize) -> Self;                   // capacity: 1024
    pub fn publish(&self, event: AppEvent) -> usize;       // nb receivers
    pub fn subscribe(&self) -> broadcast::Receiver<AppEvent>;
    pub async fn publish_and_log(&self, event: AppEvent, db: &PgPool);
}
```

### `src/events/types.rs`

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "payload")]
pub enum AppEvent {
    // Core → modules
    UserCreated  { user_id: Uuid, email: String },
    UserDeleted  { user_id: Uuid },
    UserUpdated  { user_id: Uuid, fields: Vec<String> },
    QuotaUpdated { user_id: Uuid, used_bytes: i64, quota_bytes: i64 },

    // Modules → core + autres modules
    FileUploaded  { file_id: Uuid, user_id: Uuid, mime_type: String, size_bytes: i64, module_id: String },
    FileDeleted   { file_id: Uuid, user_id: Uuid, module_id: String },
    FileMoved     { file_id: Uuid, user_id: Uuid, module_id: String },
    ShareCreated  { share_id: Uuid, user_id: Uuid, token: String, resource_type: String, module_id: String },
    ShareRevoked  { share_id: Uuid, module_id: String },

    // Modules métier (déclarés, implémentés dans les modules)
    MessageSent      { chat_id: Uuid, from_user_id: Uuid, module_id: String },
    TaskCompleted    { task_id: Uuid, user_id: Uuid, module_id: String },
    EventCreated     { event_id: Uuid, user_id: Uuid, module_id: String },
    FormSubmitted    { form_id: Uuid, response_id: Uuid, module_id: String },
    NoteCreated      { note_id: Uuid, user_id: Uuid, module_id: String },
    PhotoImported    { photo_id: Uuid, user_id: Uuid, module_id: String },
    AiIndexRequested { resource_id: Uuid, resource_type: String, user_id: Uuid, module_id: String },
    ContactUpdated   { contact_id: Uuid, user_id: Uuid, module_id: String },

    // Core interne
    ModuleRegistered    { module_id: String, base_url: String },
    ModuleUnregistered  { module_id: String },
    ModuleHealthChanged { module_id: String, status: String },

    // Générique
    Custom { event_type: String, module_id: String, payload: serde_json::Value },
}
```

### `src/storage/backend.rs`

```rust
#[async_trait]
pub trait StorageBackend: Send + Sync {
    async fn put(&self, path: &str, data: Bytes) -> Result<()>;
    async fn put_stream(&self, path: &str, stream: impl Stream<Item=Result<Bytes>>, size_hint: Option<u64>) -> Result<()>;
    async fn get(&self, path: &str) -> Result<Bytes>;
    async fn get_stream(&self, path: &str) -> Result<impl Stream<Item=Result<Bytes>>>;
    async fn delete(&self, path: &str) -> Result<()>;
    async fn exists(&self, path: &str) -> Result<bool>;
    async fn size(&self, path: &str) -> Result<u64>;
    async fn list(&self, prefix: &str) -> Result<Vec<StorageObject>>;
    async fn init_multipart(&self, path: &str) -> Result<String>;
    async fn put_part(&self, path: &str, upload_id: &str, part_num: u32, data: Bytes) -> Result<String>;
    async fn complete_multipart(&self, path: &str, upload_id: &str, parts: Vec<MultipartPart>) -> Result<()>;
    async fn abort_multipart(&self, path: &str, upload_id: &str) -> Result<()>;
    async fn presign_get(&self, path: &str, ttl: Duration) -> Result<String>;
}
// Convention de nommage: "{module_id}/{user_id}/{filename}"
```

### `src/modules/registry.rs`

```rust
pub struct ModuleRegistry {
    installed: HashMap<String, InstalledModule>,
    instances: HashMap<String, ActiveInstance>,
}

#[derive(Debug, Clone)]
pub struct ActiveInstance {
    pub module_id:         String,
    pub base_url:          String,  // http://127.0.0.1:3101
    pub routes:            Vec<ModuleRoute>,
    pub sidebar_items:     Vec<SidebarItem>,
    pub subscribed_events: Vec<String>,
    pub registered_at:     DateTime<Utc>,
    pub last_heartbeat:    DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModuleRoute {
    pub method: String,  // "GET", "POST", "*"
    pub path:   String,  // "/files", "/files/:id"
    // monté sous /api/v1/{module_id}{path}
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SidebarItem {
    pub id:       String,
    pub label:    String,
    pub icon:     String,         // nom Lucide
    pub path:     String,
    pub position: i32,
    pub badge:    Option<String>, // clé compteur ex: "unread_messages"
}
```

### `src/modules/proxy.rs`

```rust
// GET /api/v1/files/abc123 :
// 1. module_id = "files"
// 2. Trouver instance dans registry
// 3. URL cible: http://127.0.0.1:3101/files/abc123
// 4. Forward avec headers:
//    X-Kubuno-User-Id, X-Kubuno-User-Role, X-Kubuno-User-Email
//    X-Forwarded-For, X-Internal-Secret (remplace Authorization)
// 5. Streamer la réponse

pub async fn proxy_to_module(
    state: &AppState,
    module_id: &str,
    req: Request,
    user: Option<&AuthUser>,
) -> Result<Response, AppError>;
```

### `src/websocket/hub.rs`

```rust
pub struct WsHub {
    connections: RwLock<HashMap<Uuid, Vec<mpsc::UnboundedSender<WsMessage>>>>,
}

#[derive(Debug, Clone, Serialize)]
pub struct WsMessage {
    pub r#type:  String,  // "notification" | "event" | "ping"
    pub module:  Option<String>,
    pub payload: serde_json::Value,
}

impl WsHub {
    pub async fn send_to_user(&self, user_id: Uuid, msg: WsMessage);
    pub async fn broadcast(&self, msg: WsMessage);
    pub async fn connect(&self, user_id: Uuid) -> mpsc::UnboundedReceiver<WsMessage>;
    pub async fn disconnect(&self, user_id: Uuid, sender: &mpsc::UnboundedSender<WsMessage>);
}

pub async fn event_to_ws_worker(bus: Arc<EventBus>, hub: Arc<WsHub>);
```

---

## Routes HTTP du Core

### Publiques (sans auth)

```
GET  /health                               → { status, version, uptime_s }
GET  /ready                                → 200 OK / 503
GET  /api/v1/config                        → settings is_public=true
POST /api/v1/auth/register
POST /api/v1/auth/login                    → { access_token, user } + cookie refresh_token
POST /api/v1/auth/refresh                  → nouveau access_token via cookie
POST /api/v1/auth/logout
POST /api/v1/auth/forgot-password
POST /api/v1/auth/reset-password
GET  /api/v1/auth/oauth/:provider
GET  /api/v1/auth/oauth/:provider/callback
```

### Authentifiées (require_auth)

```
GET    /api/v1/me
PATCH  /api/v1/me
PATCH  /api/v1/me/password
GET    /api/v1/me/sessions
DELETE /api/v1/me/sessions/:id
DELETE /api/v1/me/sessions
GET    /api/v1/modules
GET    /ws                                 → upgrade WebSocket (?token=)
```

### Admin (require_admin)

```
GET    /api/v1/admin/users
POST   /api/v1/admin/users
GET    /api/v1/admin/users/:id
PATCH  /api/v1/admin/users/:id
DELETE /api/v1/admin/users/:id
GET    /api/v1/admin/stats
GET    /api/v1/admin/settings
PATCH  /api/v1/admin/settings
GET    /api/v1/admin/modules
PATCH  /api/v1/admin/modules/:id
GET    /api/v1/admin/event-log
```

### Internes (modules → core, Header: X-Internal-Secret requis)

```
POST /internal/modules/register            → { module_id, base_url, routes, sidebar_items, subscribed_events, version }
POST /internal/modules/:id/heartbeat
POST /internal/modules/:id/unregister
POST /internal/events/publish
GET  /internal/events/subscribe            → SSE stream filtré
```

### Proxy dynamique + Static

```
ANY  /api/v1/:module_id/*                  → proxy vers instance active, headers X-Kubuno-* injectés
GET  /*                                    → build React (index.html fallback SPA)
```

---

## Interface Frontend — Shell Core

### Design System (inspiré Google Drive 2024)

```typescript
// tailwind.config.ts
colors: {
  primary: { DEFAULT: '#1a73e8', hover: '#1557b0', light: '#e8f0fe' },
  surface: { 0: '#ffffff', 1: '#f8f9fa', 2: '#f1f3f4', 3: '#e8eaed' },
  text:    { primary: '#202124', secondary: '#5f6368', tertiary: '#80868b' },
  border:  { DEFAULT: '#dadce0', strong: '#bdc1c6' },
  danger:  { DEFAULT: '#d93025', light: '#fce8e6' },
  success: { DEFAULT: '#1e8e3e', light: '#e6f4ea' },
  warning: { DEFAULT: '#f9ab00', light: '#fef7e0' },
},
fontFamily: {
  sans: ['Google Sans', 'Inter', 'system-ui', 'sans-serif'],
  mono: ['Google Sans Mono', 'Fira Code', 'monospace'],
},
borderRadius: { sm: '4px', DEFAULT: '8px', lg: '12px', xl: '16px' },
```

### Shell.tsx — Layout

```
┌─────────────────────────────────────────────┐
│ TOPBAR (56px, z-50)                         │
├──────────────┬──────────────────────────────┤
│ SIDEBAR      │ CONTENT AREA                 │
│ 256px fixe   │ flex-1, overflow-y-auto      │
│ (collapsible │ ← rendu par module actif     │
│  sur mobile) │                              │
└──────────────┴──────────────────────────────┘
```

**Topbar :** gauche=logo, centre=SearchBar (fond surface-2, hint `/`), droite=notifs+settings+UserAvatar dropdown.

**Sidebar :**
```typescript
type SidebarItem = {
  id: string; label: string; icon: string; path: string;
  position: number; badge?: number; section?: 'main' | 'secondary'
}

const CORE_ITEMS = [
  { id: 'home',    label: 'Accueil',   icon: 'Home',   path: '/',        position: 0  },
  { id: 'starred', label: 'Étoilés',   icon: 'Star',   path: '/starred', position: 98 },
  { id: 'trash',   label: 'Corbeille', icon: 'Trash2', path: '/trash',   position: 99 },
]
```
- Item actif: fond `primary.light`, pill bleue gauche
- Hover: fond `surface-2`
- Bouton "Nouveau" en haut: DropdownMenu avec actions modules actifs

### SlotRegistry.tsx

```typescript
type SlotName =
  | 'sidebar-new-actions' | 'topbar-actions' | 'settings-sections'
  | 'admin-panels' | 'search-providers' | 'user-menu-items' | 'dashboard-widgets'

const SlotRegistry = {
  register(slot: SlotName, moduleId: string, component: React.ComponentType): void,
  getSlot(slot: SlotName): Array<{ moduleId: string, Component: React.ComponentType }>,
}
```

### Pages

**LoginPage :** 2 colonnes (branding | formulaire), OAuth si activé, lien mot de passe oublié.

**RegisterPage :** + username, confirmer MDP, indicateur force MDP.

**SettingsPage :** onglets Profil | Sécurité | Sessions (+ sections modules). Sessions = liste refresh tokens + révoquer.

**AdminPage :** onglets Dashboard (stats cards + graphique 7j) | Utilisateurs (table paginée) | Modules (cards + toggle) | Paramètres (groupé par catégorie).

### State management

```typescript
// authStore.ts
interface AuthState {
  user: User | null; accessToken: string | null;
  isLoading: boolean; isInitialized: boolean;
  login(email: string, password: string): Promise<void>;
  logout(): Promise<void>; refreshToken(): Promise<void>;
  updateUser(updates: Partial<User>): void; initialize(): Promise<void>;
}

// modulesStore.ts
interface ModulesState {
  activeModules: ActiveModule[]; sidebarItems: SidebarItem[];
  isLoading: boolean; fetchModules(): Promise<void>;
}

// api/client.ts — Axios baseURL '/api/v1'
// REQUEST: injecte Authorization: Bearer {accessToken}
// RESPONSE 401: appelle /auth/refresh → retry une fois, sinon logout + redirect /login
```

---

## Cargo.toml workspace

```toml
[workspace]
resolver = "2"
members  = ["crates/kubuno-core"]

[workspace.package]
version = "0.1.0"; edition = "2021"; license = "AGPL-3.0"; rust-version = "1.82"

[workspace.dependencies]
tokio          = { version = "1",    features = ["full"] }
axum           = { version = "0.7",  features = ["macros", "ws", "multipart"] }
tower          = { version = "0.5",  features = ["full"] }
tower-http     = { version = "0.6",  features = ["cors", "compression-gzip", "trace", "limit", "fs"] }
async-trait    = "0.1"
sqlx           = { version = "0.8",  features = ["runtime-tokio", "postgres", "uuid", "chrono", "json", "migrate", "tls-rustls"] }
serde          = { version = "1",    features = ["derive"] }
serde_json     = "1"
jsonwebtoken   = "9"
argon2         = "0.5"
aes-gcm        = "0.10"
rand           = "0.8"
sha2           = "0.10"
base64         = "0.22"
reqwest        = { version = "0.12", features = ["json", "stream"] }
config         = "0.14"
dotenvy        = "0.15"
validator      = { version = "0.18", features = ["derive"] }
tracing        = "0.1"
tracing-subscriber = { version = "0.3", features = ["env-filter", "json"] }
thiserror      = "1"
anyhow         = "1"
uuid           = { version = "1",   features = ["v4", "serde"] }
chrono         = { version = "0.4", features = ["serde"] }
bytes          = "1"
futures        = "0.3"
```

## package.json frontend

```json
{
  "dependencies": {
    "react": "^19.0.0", "react-dom": "^19.0.0", "react-router-dom": "^7.0.0",
    "@tanstack/react-query": "^5.0.0", "zustand": "^5.0.0", "axios": "^1.7.0",
    "lucide-react": "^0.400.0", "clsx": "^2.0.0", "tailwind-merge": "^2.0.0",
    "date-fns": "^3.0.0",
    "@radix-ui/react-dialog": "^1.0.0", "@radix-ui/react-dropdown-menu": "^2.0.0",
    "@radix-ui/react-toast": "^1.0.0", "@radix-ui/react-tooltip": "^1.0.0",
    "@radix-ui/react-avatar": "^1.0.0", "@radix-ui/react-separator": "^1.0.0"
  },
  "devDependencies": {
    "typescript": "^5.5.0", "vite": "^6.0.0", "@vitejs/plugin-react": "^4.0.0",
    "tailwindcss": "^4.0.0", "@tailwindcss/vite": "^4.0.0",
    "@types/react": "^19.0.0", "@types/react-dom": "^19.0.0", "eslint": "^9.0.0"
  }
}
```

## .env.example

```bash
KV_DATABASE_URL=postgres://kubuno:dev_password@localhost:5432/kubuno
KV_AUTH_JWT_SECRET=change_me_to_at_least_48_random_characters_here
KV_SERVER_INTERNAL_SECRET=another_random_secret_for_internal_api
KV_SERVER_HOST=0.0.0.0
KV_SERVER_PORT=8080
KV_STORAGE_BACKEND=local
KV_STORAGE_LOCAL_PATH=./data/files
# KV_STORAGE_S3_BUCKET=kubuno
# KV_AUTH_OAUTH_GOOGLE_ID=
# KV_AUTH_OAUTH_GITHUB_ID=
RUST_LOG=debug
KV_LOGGING_FORMAT=pretty
```

## vite.config.ts (proxy dev)

```typescript
server: { proxy: {
  '/api':      'http://localhost:8080',
  '/ws':       { target: 'ws://localhost:8080', ws: true },
  '/internal': 'http://localhost:8080',
}}
```

---

## Ordre d'implémentation

1. **Workspace Cargo + structure dossiers** — `Cargo.toml`, dossiers, `mod.rs` vides
2. **Config** — `settings.rs` + `Settings::load()`
3. **Erreurs** — `AppError` + `impl IntoResponse`
4. **Database** — `pool.rs` + `migrations.rs`
5. **Migrations SQL** — 5 fichiers `.up.sql` et `.down.sql`
6. **Database notify** — `notify.rs` (PgListener + `pg_notify`)
7. **Crypto** — `password.rs` + `token.rs` + `encryption.rs`
8. **Modèles** — `User`, `RefreshToken`, `RegisteredModule` avec `sqlx::FromRow` + `serde`
9. **Events** — `AppEvent` + `EventBus`
10. **AppState** — toutes les dépendances assemblées
11. **Storage** — trait `StorageBackend` + `local.rs`
12. **Auth JWT** — `jwt.rs`
13. **Auth middleware** — `middleware.rs` + `AuthUser` + `require_admin`
14. **Handlers auth** — register, login, refresh, logout
15. **Handlers users** — `/me` GET/PATCH, sessions
16. **Module Registry + Manager**
17. **Module Proxy**
18. **WebSocket Hub**
19. **Handlers modules + admin**
20. **Router final** — layers cors, trace, compression, auth
21. **Main.rs** — bootstrap complet
22. **Frontend setup** — Vite + React + Router + Tailwind + stores
23. **Frontend api/client.ts** — Axios + interceptors
24. **Frontend Auth pages** — Login, Register
25. **Frontend Shell** — Topbar + Sidebar + Layout
26. **Frontend Settings + Admin pages**
27. **Frontend Slot registry**
28. **Tests d'intégration** — auth flow, module registration
29. **README + .env.example + Makefile**

---

## Critères de qualité impératifs

- **Zéro `unwrap()`** hors tests — utiliser `?`, `expect()` uniquement au bootstrap
- **Toutes les erreurs DB loggées** avec `tracing::error!` avant d'être retournées
- **Validation des inputs** dans chaque handler avant toute opération DB
- **Transactions atomiques** pour toute opération multi-tables
- **Mots de passe jamais loggés** — structs avec `password` implémentent `Debug` en masquant le champ
- **Refresh token jamais dans les logs ni JSON** — uniquement cookie HttpOnly
- **Pas d'information leakage** sur les routes publiques (pas de distinction "email inexistant" vs "mauvais MDP")
- **Schéma `core` uniquement** — aucune table hors de ce schéma
- **`/internal/*` refuse** toute requête sans `X-Internal-Secret` valide
- **Headers de sécurité** via layer `tower-http` (HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy)
- **`cargo clippy -- -D warnings`** doit passer proprement
