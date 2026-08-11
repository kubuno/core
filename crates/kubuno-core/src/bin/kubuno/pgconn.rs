//! Parsing de l'URL PostgreSQL et construction des arguments `psql`/`pg_dump`.

use anyhow::{Context, Result};
use kubuno_core::config::settings::DatabaseSettings;

pub struct PgConn {
    pub user:     String,
    pub password: String,
    pub host:     String,
    pub port:     String,
    pub db:       String,
}

impl PgConn {
    pub fn from_settings(cfg: &DatabaseSettings) -> Result<Self> {
        if let Some(url) = &cfg.url {
            return Self::from_url(url);
        }
        let user     = cfg.user.as_deref().context("database.user requis")?.to_string();
        let password = cfg.password.as_deref().unwrap_or("").to_string();
        let host     = cfg.host.as_deref().unwrap_or("localhost").to_string();
        let port     = cfg.port.unwrap_or(5432).to_string();
        let db       = cfg.database.as_deref().context("database.database requis")?.to_string();
        Ok(Self { user, password, host, port, db })
    }

    pub fn from_url(url: &str) -> Result<Self> {
        let stripped = url
            .trim_start_matches("postgres://")
            .trim_start_matches("postgresql://");

        let (userinfo, rest) = stripped
            .split_once('@')
            .context("DATABASE_URL invalide : '@' manquant")?;

        let (user, pass) = userinfo
            .split_once(':')
            .map(|(u, p)| (u.to_string(), p.to_string()))
            .unwrap_or_else(|| (userinfo.to_string(), String::new()));

        // URL-decode les caractères spéciaux courants du mot de passe
        let password = pass
            .replace("%23", "#")
            .replace("%40", "@")
            .replace("%3A", ":")
            .replace("%2F", "/");

        let (hostport, db) = rest
            .split_once('/')
            .context("DATABASE_URL invalide : '/' manquant après l'hôte")?;

        let (host, port) = hostport
            .split_once(':')
            .map(|(h, p)| (h.to_string(), p.to_string()))
            .unwrap_or_else(|| (hostport.to_string(), "5432".to_string()));

        Ok(Self { user, password, host, port, db: db.to_string() })
    }

    pub fn pg_env(&self) -> Vec<(String, String)> {
        vec![("PGPASSWORD".into(), self.password.clone())]
    }

    pub fn pg_args(&self) -> Vec<String> {
        vec![
            "-h".into(), self.host.clone(),
            "-p".into(), self.port.clone(),
            "-U".into(), self.user.clone(),
        ]
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use kubuno_core::config::settings::DatabaseSettings;
    use std::time::Duration;

    #[test]
    fn test_from_settings_individual_fields() {
        let cfg = DatabaseSettings {
            url:             None,
            host:            Some("dbhost".to_string()),
            port:            Some(5433),
            user:            Some("alice".to_string()),
            password:        Some("s3cr3t".to_string()),
            database:        Some("mydb".to_string()),
            max_connections: 20,
            min_connections: 2,
            connect_timeout: Duration::from_secs(10),
            run_migrations:  false,
        };
        let conn = PgConn::from_settings(&cfg).unwrap();
        assert_eq!(conn.user, "alice");
        assert_eq!(conn.password, "s3cr3t");
        assert_eq!(conn.host, "dbhost");
        assert_eq!(conn.port, "5433");
        assert_eq!(conn.db, "mydb");
    }

    #[test]
    fn test_from_settings_with_url_fallback() {
        let cfg = DatabaseSettings {
            url:             Some("postgres://u:p%23q@host:5432/db".to_string()),
            host:            None,
            port:            None,
            user:            None,
            password:        None,
            database:        None,
            max_connections: 5,
            min_connections: 1,
            connect_timeout: Duration::from_secs(5),
            run_migrations:  false,
        };
        let conn = PgConn::from_settings(&cfg).unwrap();
        assert_eq!(conn.user, "u");
        assert_eq!(conn.password, "p#q");
        assert_eq!(conn.db, "db");
    }

    #[test]
    fn test_parse_pg_url_standard() {
        let conn = PgConn::from_url("postgres://kubuno:secret@localhost:5432/kubuno").unwrap();
        assert_eq!(conn.user, "kubuno");
        assert_eq!(conn.password, "secret");
        assert_eq!(conn.host, "localhost");
        assert_eq!(conn.port, "5432");
        assert_eq!(conn.db, "kubuno");
    }

    #[test]
    fn test_parse_pg_url_encoded_password() {
        // '#' encodé en %23, '@' en %40
        let conn = PgConn::from_url(
            "postgres://kubuno:XsPVF%23xZsTC%40LyP52Zv0@localhost:5432/kubuno"
        ).unwrap();
        assert_eq!(conn.password, "XsPVF#xZsTC@LyP52Zv0");
        assert_eq!(conn.user, "kubuno");
        assert_eq!(conn.db, "kubuno");
    }

    #[test]
    fn test_parse_pg_url_default_port() {
        let conn = PgConn::from_url("postgres://user:pass@db.example.com/mydb").unwrap();
        assert_eq!(conn.port, "5432");
        assert_eq!(conn.host, "db.example.com");
        assert_eq!(conn.db, "mydb");
    }

    #[test]
    fn test_parse_pg_url_postgresql_scheme() {
        let conn = PgConn::from_url("postgresql://admin:pw@127.0.0.1:5433/testdb").unwrap();
        assert_eq!(conn.user, "admin");
        assert_eq!(conn.port, "5433");
        assert_eq!(conn.db, "testdb");
    }

    #[test]
    fn test_parse_pg_url_missing_at_fails() {
        assert!(PgConn::from_url("postgres://kubuno:secret-localhost:5432/kubuno").is_err());
    }

    #[test]
    fn test_parse_pg_url_missing_slash_fails() {
        assert!(PgConn::from_url("postgres://kubuno:secret@localhost:5432kubuno").is_err());
    }

    #[test]
    fn test_pg_args_format() {
        let conn = PgConn::from_url("postgres://u:p@myhost:5433/mydb").unwrap();
        let args = conn.pg_args();
        assert_eq!(args, vec!["-h", "myhost", "-p", "5433", "-U", "u"]);
    }
}
