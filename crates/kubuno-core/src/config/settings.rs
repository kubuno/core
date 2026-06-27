use anyhow::Context;
use config::{Config, ConfigError, Environment, File};
use serde::Deserialize;
use sqlx::postgres::PgConnectOptions;
use std::str::FromStr;
use std::time::Duration;

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
    pub host:            String,
    pub port:            u16,
    pub frontend_dist:   String,
    pub internal_secret: String,
    /// Répertoire contenant les sous-dossiers de chaque module installé.
    pub modules_dir:     String,
    /// Répertoire contenant les fichiers de thèmes JSON.
    pub themes_dir:      String,
    /// Répertoire des composants WASM local-first téléchargeables (documents-core.wasm,
    /// drive-core.wasm…), servis via `GET /api/v1/desktop/wasm[/:name]`. Un sidecar
    /// `manifest.json` (`{ "<name>.wasm": "<version>" }`) y porte les versions.
    #[serde(default = "default_wasm_dir")]
    pub wasm_dir:        String,
    /// Origines CORS autorisées (séparées par des virgules). Vide = même origine uniquement.
    /// Exemple : http://localhost:5173,https://cloud.example.com
    #[serde(default)]
    pub cors_origins:    Vec<String>,
    /// Ajoute l'attribut Secure aux cookies (activer en production HTTPS).
    #[serde(default)]
    pub secure_cookies:  bool,
    /// Terminaison TLS native (HTTPS) dans le core. Voir [`TlsSettings`].
    #[serde(default)]
    pub tls:             TlsSettings,
}

fn default_wasm_dir() -> String {
    "/var/lib/kubuno/wasm".to_string()
}

/// Configuration HTTPS / TLS native.
///
/// Quand `enabled = true`, le core termine lui-même le TLS (HTTPS direct, sans
/// reverse-proxy). Quand `enabled = false` (défaut), il sert en HTTP nu — la
/// terminaison TLS peut alors être faite par un reverse-proxy (nginx…).
#[derive(Debug, Clone, Deserialize, Default)]
pub struct TlsSettings {
    /// Active la terminaison TLS native (HTTPS) dans le core.
    #[serde(default)]
    pub enabled: bool,
    /// Chemin du certificat PEM (chaîne complète : feuille + intermédiaires).
    #[serde(default)]
    pub cert_path: String,
    /// Chemin de la clé privée PEM (PKCS#8 ou RSA, non chiffrée).
    #[serde(default)]
    pub key_path: String,
    /// Si > 0, écoute AUSSI en HTTP nu sur ce port et redirige (308) vers HTTPS.
    /// 0 (défaut) = pas de redirection. Exemple : 80 pour rediriger le web standard.
    #[serde(default)]
    pub redirect_http_from_port: u16,
}

impl TlsSettings {
    /// Valide la cohérence quand TLS est activé : les chemins doivent être
    /// renseignés et les fichiers exister/être lisibles.
    pub fn validate(&self) -> Result<(), String> {
        if !self.enabled {
            return Ok(());
        }
        if self.cert_path.trim().is_empty() || self.key_path.trim().is_empty() {
            return Err(
                "server.tls.enabled = true exige server.tls.cert_path et server.tls.key_path".into(),
            );
        }
        for (label, path) in [("cert_path", &self.cert_path), ("key_path", &self.key_path)] {
            if !std::path::Path::new(path).is_file() {
                return Err(format!("server.tls.{label} introuvable : {path}"));
            }
        }
        Ok(())
    }
}

#[derive(Debug, Clone, Deserialize)]
pub struct DatabaseSettings {
    // Mode URL — les caractères spéciaux DOIVENT être encodés : '#' → %23, '@' → %40
    pub url: Option<String>,

    // Mode champs séparés (recommandé — aucun encodage requis)
    pub host:     Option<String>,
    pub port:     Option<u16>,
    pub user:     Option<String>,
    pub password: Option<String>,
    pub database: Option<String>,

    // Paramètres du pool (communs aux deux modes)
    pub max_connections: u32,
    pub min_connections: u32,
    #[serde(with = "duration_secs")]
    pub connect_timeout: Duration,
    pub run_migrations:  bool,
}

impl DatabaseSettings {
    /// Construit les options de connexion sqlx depuis l'URL ou les champs séparés.
    pub fn connect_options(&self) -> anyhow::Result<PgConnectOptions> {
        if let Some(url) = &self.url {
            return PgConnectOptions::from_str(url)
                .context("database.url invalide (encodez '#' → %23, '@' → %40)");
        }
        let user = self.user.as_deref()
            .context("database.user requis (ou database.url)")?;
        let password = self.password.as_deref()
            .context("database.password requis (ou database.url)")?;
        let database = self.database.as_deref()
            .context("database.database requis (ou database.url)")?;
        Ok(PgConnectOptions::new()
            .host(self.host.as_deref().unwrap_or("localhost"))
            .port(self.port.unwrap_or(5432))
            .username(user)
            .password(password)
            .database(database))
    }

    fn validate(&self) -> Result<(), String> {
        if self.url.is_none() && (self.user.is_none() || self.database.is_none()) {
            return Err(
                "database: fournissez 'url' OU les champs 'host/user/password/database'".into(),
            );
        }
        Ok(())
    }

    /// Extrait les credentials individuels (host/port/user/password/database)
    /// que la config soit en mode URL ou champs séparés.
    /// Utilisé par le superviseur pour les injecter dans les processus modules.
    pub fn credentials(&self) -> anyhow::Result<DbCredentials> {
        if let Some(raw) = &self.url {
            let parsed = url::Url::parse(raw)
                .map_err(|e| anyhow::anyhow!("database.url invalide : {e}"))?;
            return Ok(DbCredentials {
                host:     parsed.host_str().unwrap_or("localhost").to_string(),
                port:     parsed.port().unwrap_or(5432),
                user:     parsed.username().to_string(),
                password: parsed.password().unwrap_or("").to_string(),
                database: parsed.path().trim_start_matches('/').to_string(),
            });
        }
        Ok(DbCredentials {
            host:     self.host.clone().unwrap_or_else(|| "localhost".to_string()),
            port:     self.port.unwrap_or(5432),
            user:     self.user.clone().unwrap_or_default(),
            password: self.password.clone().unwrap_or_default(),
            database: self.database.clone().unwrap_or_default(),
        })
    }
}

#[derive(Debug, Clone)]
pub struct DbCredentials {
    pub host:     String,
    pub port:     u16,
    pub user:     String,
    pub password: String,
    pub database: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct AuthSettings {
    pub jwt_secret:          String,
    #[serde(with = "duration_secs")]
    pub access_token_ttl:    Duration,
    #[serde(with = "duration_days")]
    pub refresh_token_ttl:   Duration,
    pub oauth_google_id:     Option<String>,
    pub oauth_google_secret: Option<String>,
    pub oauth_github_id:     Option<String>,
    pub oauth_github_secret: Option<String>,
    // Keycloak OIDC — credentials en config (pas en DB pour la sécurité)
    pub keycloak_issuer_url:    Option<String>,
    pub keycloak_client_id:     Option<String>,
    pub keycloak_client_secret: Option<String>,
}

impl AuthSettings {
    /// Retourne la config Keycloak si les trois champs sont renseignés.
    pub fn keycloak(&self) -> Option<crate::auth::oauth::KeycloakConfig> {
        Some(crate::auth::oauth::KeycloakConfig {
            issuer_url:    self.keycloak_issuer_url.clone()?,
            client_id:     self.keycloak_client_id.clone()?,
            client_secret: self.keycloak_client_secret.clone()?,
        })
    }
}

pub use kubuno_storage::config::StorageConfig as StorageSettings;
pub use kubuno_storage::config::StorageBackendType;

#[derive(Debug, Clone, Deserialize)]
pub struct LoggingSettings {
    pub level:         String,
    pub format:        LogFormat,
    /// Répertoire où écrire access.log et error.log.
    pub log_dir:       String,
    /// Active l'écriture dans les fichiers (false = stdout uniquement).
    pub file_enabled:  bool,
    /// Politique de rotation : daily | hourly | never.
    pub rotation:      LogRotation,
    /// Nombre de fichiers rotatifs à conserver (ex: 30 → 30 jours avec daily).
    /// Ignoré si rotation = "never".
    pub max_log_files: u32,
}

#[derive(Debug, Clone, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum LogFormat {
    Pretty,
    Json,
}

#[derive(Debug, Clone, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum LogRotation {
    Daily,
    Hourly,
    Never,
}

impl Settings {
    pub fn load() -> Result<Self, ConfigError> {
        let cfg = Config::builder()
            // Defaults
            .set_default("server.host", "0.0.0.0")?
            .set_default("server.port", 8080)?
            .set_default("server.frontend_dist", "./frontend/dist")?
            .set_default("server.internal_secret", "")?
            .set_default("server.modules_dir", "/usr/lib/kubuno/modules")?
            .set_default("server.themes_dir", "/var/lib/kubuno/themes")?
            .set_default("server.cors_origins", Vec::<String>::new())?
            .set_default("server.secure_cookies", false)?
            .set_default("server.tls.enabled", false)?
            .set_default("server.tls.cert_path", "")?
            .set_default("server.tls.key_path", "")?
            .set_default("server.tls.redirect_http_from_port", 0)?
            .set_default("database.max_connections", 20)?
            .set_default("database.min_connections", 2)?
            .set_default("database.connect_timeout", 10u64)?
            .set_default("database.run_migrations", true)?
            .set_default("auth.access_token_ttl", 900u64)?
            .set_default("auth.refresh_token_ttl", 30u64)?
            .set_default("storage.backend", "local")?
            .set_default("storage.local_path", "./data/files")?
            .set_default("logging.level", "info")?
            .set_default("logging.format", "pretty")?
            .set_default("logging.log_dir", "/var/log/kubuno")?
            .set_default("logging.file_enabled", true)?
            .set_default("logging.rotation", "never")?
            .set_default("logging.max_log_files", 30u32)?
            // Ordre de priorité croissante :
            // 1. config.toml (répertoire courant — développement)
            .add_source(File::with_name("config").required(false))
            // 2. /etc/kubuno/config.toml (installation système)
            .add_source(File::with_name("/etc/kubuno/config").required(false))
            // 3. Variables d'environnement KV__ (Docker / surcharge ponctuelle)
            //    Exemple : KV__DATABASE__URL=postgres://...
            .add_source(
                Environment::with_prefix("KV")
                    .separator("__")
                    .try_parsing(true),
            )
            .build()?;

        let settings: Settings = cfg.try_deserialize()?;
        settings.database.validate()
            .map_err(ConfigError::Message)?;
        settings.server.tls.validate()
            .map_err(ConfigError::Message)?;
        Ok(settings)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use config::Config;

    fn minimal_config() -> Config {
        Config::builder()
            .set_default("server.host", "127.0.0.1").unwrap()
            .set_default("server.port", 8080u16).unwrap()
            .set_default("server.frontend_dist", "./frontend/dist").unwrap()
            .set_default("server.internal_secret", "test_secret").unwrap()
            .set_default("server.modules_dir", "/usr/lib/kubuno/modules").unwrap()
            .set_default("server.themes_dir", "/var/lib/kubuno/themes").unwrap()
            .set_default("database.url", "postgres://test@localhost/test").unwrap()
            .set_default("database.max_connections", 5u32).unwrap()
            .set_default("database.min_connections", 1u32).unwrap()
            .set_default("database.connect_timeout", 5u64).unwrap()
            .set_default("database.run_migrations", false).unwrap()
            .set_default("auth.jwt_secret", "secret_key_long_enough_for_testing_purposes").unwrap()
            .set_default("auth.access_token_ttl", 900u64).unwrap()
            .set_default("auth.refresh_token_ttl", 30u64).unwrap()
            .set_default("storage.backend", "local").unwrap()
            .set_default("storage.local_path", "./data/files").unwrap()
            .set_default("logging.level", "info").unwrap()
            .set_default("logging.format", "pretty").unwrap()
            .set_default("logging.log_dir", "/var/log/kubuno").unwrap()
            .set_default("logging.file_enabled", false).unwrap()
            .set_default("logging.rotation", "daily").unwrap()
            .set_default("logging.max_log_files", 30u32).unwrap()
            .build()
            .unwrap()
    }

    #[test]
    fn test_settings_deserialize_all_fields() {
        let settings: Settings = minimal_config().try_deserialize()
            .expect("Settings doit se désérialiser avec tous les champs");
        assert_eq!(settings.server.host, "127.0.0.1");
        assert_eq!(settings.server.port, 8080);
        assert_eq!(settings.database.url.as_deref(), Some("postgres://test@localhost/test"));
        assert!(!settings.database.run_migrations);
        assert_eq!(settings.auth.jwt_secret, "secret_key_long_enough_for_testing_purposes");
        assert_eq!(settings.storage.backend, StorageBackendType::Local);
        assert_eq!(settings.logging.format, LogFormat::Pretty);
    }

    #[test]
    fn test_settings_missing_database_credentials_fails() {
        let cfg = Config::builder()
            .set_default("server.host", "127.0.0.1").unwrap()
            .set_default("server.port", 8080u16).unwrap()
            .set_default("server.frontend_dist", "./frontend/dist").unwrap()
            .set_default("server.internal_secret", "secret").unwrap()
            .set_default("server.modules_dir", "/usr/lib/kubuno/modules").unwrap()
            .set_default("server.themes_dir", "/var/lib/kubuno/themes").unwrap()
            // ni url ni user/database — tous absents
            .set_default("database.max_connections", 5u32).unwrap()
            .set_default("database.min_connections", 1u32).unwrap()
            .set_default("database.connect_timeout", 5u64).unwrap()
            .set_default("database.run_migrations", false).unwrap()
            .set_default("auth.jwt_secret", "secret_key").unwrap()
            .set_default("auth.access_token_ttl", 900u64).unwrap()
            .set_default("auth.refresh_token_ttl", 30u64).unwrap()
            .set_default("storage.backend", "local").unwrap()
            .set_default("storage.local_path", "./data").unwrap()
            .set_default("logging.level", "info").unwrap()
            .set_default("logging.format", "pretty").unwrap()
            .set_default("logging.log_dir", "/var/log/kubuno").unwrap()
            .set_default("logging.file_enabled", false).unwrap()
            .set_default("logging.rotation", "daily").unwrap()
            .set_default("logging.max_log_files", 30u32).unwrap()
            .build().unwrap();
        let settings: Settings = cfg.try_deserialize().expect("Désérialisation doit réussir");
        let err = settings.database.validate();
        assert!(err.is_err(), "validate() doit échouer sans url ni user/database");
        let msg = err.unwrap_err();
        assert!(msg.contains("url"), "L'erreur doit mentionner 'url': {msg}");
    }

    #[test]
    fn test_duration_access_token_secs() {
        let settings: Settings = minimal_config().try_deserialize().unwrap();
        assert_eq!(settings.auth.access_token_ttl.as_secs(), 900);
        assert_eq!(settings.database.connect_timeout.as_secs(), 5);
    }

    #[test]
    fn test_duration_refresh_token_days() {
        let settings: Settings = minimal_config().try_deserialize().unwrap();
        assert_eq!(settings.auth.refresh_token_ttl.as_secs(), 30 * 86_400);
    }

    #[test]
    fn test_storage_backend_local() {
        let settings: Settings = minimal_config().try_deserialize().unwrap();
        assert_eq!(settings.storage.backend, StorageBackendType::Local);
    }

    #[test]
    fn test_storage_backend_s3() {
        let cfg = Config::builder()
            .set_default("server.host", "0.0.0.0").unwrap()
            .set_default("server.port", 8080u16).unwrap()
            .set_default("server.frontend_dist", "./frontend/dist").unwrap()
            .set_default("server.internal_secret", "secret").unwrap()
            .set_default("server.modules_dir", "/usr/lib/kubuno/modules").unwrap()
            .set_default("server.themes_dir", "/var/lib/kubuno/themes").unwrap()
            .set_default("database.url", "postgres://test@localhost/test").unwrap()
            .set_default("database.max_connections", 5u32).unwrap()
            .set_default("database.min_connections", 1u32).unwrap()
            .set_default("database.connect_timeout", 5u64).unwrap()
            .set_default("database.run_migrations", false).unwrap()
            .set_default("auth.jwt_secret", "secret_key").unwrap()
            .set_default("auth.access_token_ttl", 900u64).unwrap()
            .set_default("auth.refresh_token_ttl", 30u64).unwrap()
            .set_default("storage.backend", "s3").unwrap()
            .set_default("storage.local_path", "./data").unwrap()
            .set_default("logging.level", "info").unwrap()
            .set_default("logging.format", "json").unwrap()
            .set_default("logging.log_dir", "/var/log/kubuno").unwrap()
            .set_default("logging.file_enabled", false).unwrap()
            .set_default("logging.rotation", "daily").unwrap()
            .set_default("logging.max_log_files", 30u32).unwrap()
            .build().unwrap();
        let settings: Settings = cfg.try_deserialize().unwrap();
        assert_eq!(settings.storage.backend, StorageBackendType::S3);
        assert_eq!(settings.logging.format, LogFormat::Json);
    }

    #[test]
    fn test_env_separator_double_underscore() {
        // Vérifie que KV__AUTH__JWT_SECRET mappe bien sur auth.jwt_secret
        // (et pas auth.jwt.secret comme avec separator("_"))
        unsafe {
            std::env::set_var("KV__AUTH__JWT_SECRET", "my_test_secret_value");
            std::env::set_var("KV__DATABASE__URL", "postgres://env@localhost/testdb");
            std::env::set_var("KV__STORAGE__LOCAL_PATH", "/tmp/kubuno_test");
        }
        let result = Settings::load();
        unsafe {
            std::env::remove_var("KV__AUTH__JWT_SECRET");
            std::env::remove_var("KV__DATABASE__URL");
            std::env::remove_var("KV__STORAGE__LOCAL_PATH");
        }
        let settings = result.expect("Settings::load() doit réussir avec KV__ env vars");
        assert_eq!(settings.auth.jwt_secret, "my_test_secret_value");
        assert_eq!(settings.database.url.as_deref(), Some("postgres://env@localhost/testdb"));
        assert_eq!(settings.storage.local_path.as_deref(), Some("/tmp/kubuno_test"));
    }
}

// Serde helpers pour Duration
mod duration_secs {
    use serde::{Deserialize, Deserializer};
    use std::time::Duration;

    pub fn deserialize<'de, D>(d: D) -> Result<Duration, D::Error>
    where
        D: Deserializer<'de>,
    {
        let secs = u64::deserialize(d)?;
        Ok(Duration::from_secs(secs))
    }
}

mod duration_days {
    use serde::{Deserialize, Deserializer};
    use std::time::Duration;

    pub fn deserialize<'de, D>(d: D) -> Result<Duration, D::Error>
    where
        D: Deserializer<'de>,
    {
        let days = u64::deserialize(d)?;
        Ok(Duration::from_secs(days * 86_400))
    }
}
