use async_trait::async_trait;
use bytes::Bytes;
use chrono::{DateTime, Utc};
use futures::Stream;
use serde::{Deserialize, Serialize};
use std::pin::Pin;
use thiserror::Error;

pub type ByteStream = Pin<Box<dyn Stream<Item = Result<Bytes, RemoteError>> + Send>>;

#[derive(Debug, Clone, PartialEq)]
pub enum RemoteEntryType {
    File,
    Directory,
}

#[derive(Debug, Clone)]
pub struct RemoteEntry {
    pub name:        String,
    pub path:        String,
    pub entry_type:  RemoteEntryType,
    pub size_bytes:  Option<u64>,
    pub modified_at: Option<DateTime<Utc>>,
    pub mime_type:   Option<String>,
    pub remote_id:   Option<String>,
    pub etag:        Option<String>,
}

impl RemoteEntry {
    pub fn is_dir(&self) -> bool {
        self.entry_type == RemoteEntryType::Directory
    }
}

#[derive(Debug, Error)]
pub enum RemoteError {
    #[error("Authentification échouée: {0}")]
    Auth(String),

    #[error("Ressource introuvable: {0}")]
    NotFound(String),

    #[error("Accès refusé: {0}")]
    Forbidden(String),

    #[error("Erreur réseau: {0}")]
    Network(String),

    #[error("Erreur du provider: {0}")]
    Provider(String),

    #[error("Opération non supportée: {0}")]
    Unsupported(String),

    #[error("Quota dépassé")]
    QuotaExceeded,

    #[error("Erreur d'E/S: {0}")]
    Io(#[from] std::io::Error),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RemoteQuota {
    pub total_bytes: Option<u64>,
    pub used_bytes:  Option<u64>,
    pub free_bytes:  Option<u64>,
}

/// Config universelle pour tous les providers.
/// Chaque provider utilise les champs dont il a besoin.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConnectorConfig {
    // WebDAV / Nextcloud / ownCloud
    pub url:           Option<String>,
    pub username:      Option<String>,
    pub password:      Option<String>,
    // SFTP
    pub host:          Option<String>,
    pub port:          Option<u16>,
    pub private_key:   Option<String>,   // PEM string
    pub known_hosts:   Option<String>,
    // OAuth (Google Drive, Dropbox)
    pub access_token:  Option<String>,
    pub refresh_token: Option<String>,
    pub client_id:     Option<String>,
    pub client_secret: Option<String>,
    pub token_expiry:  Option<DateTime<Utc>>,
    // SMB
    pub share_name:    Option<String>,
    pub domain:        Option<String>,
    // NFS
    pub export_path:   Option<String>,
    pub mount_options: Option<String>,
    // S3-compatible
    pub bucket:        Option<String>,
    pub region:        Option<String>,
    pub endpoint:      Option<String>,
    pub access_key:    Option<String>,
    pub secret_key:    Option<String>,
    // Chemin de base sur le remote (ex: "/Documents" pour ne monter qu'un sous-répertoire)
    pub base_path:     Option<String>,
}

impl ConnectorConfig {
    pub fn base_path(&self) -> &str {
        self.base_path.as_deref().unwrap_or("/")
    }
}

#[async_trait]
pub trait RemoteConnector: Send + Sync {
    fn provider_name(&self) -> &'static str;

    /// Teste la connexion et renvoie les infos de quota si disponibles.
    async fn connect(&self) -> Result<Option<RemoteQuota>, RemoteError>;

    /// Liste le contenu d'un répertoire (chemin relatif à base_path).
    async fn list_dir(&self, path: &str) -> Result<Vec<RemoteEntry>, RemoteError>;

    /// Récupère les métadonnées d'un fichier/dossier.
    async fn stat(&self, path: &str) -> Result<RemoteEntry, RemoteError>;

    /// Télécharge un fichier et renvoie un stream d'octets.
    async fn get_file(&self, path: &str) -> Result<ByteStream, RemoteError>;

    /// Upload un fichier (stream → remote).
    async fn put_file(
        &self,
        path: &str,
        stream: Pin<Box<dyn Stream<Item = Result<Bytes, std::io::Error>> + Send>>,
        size_hint: Option<u64>,
    ) -> Result<RemoteEntry, RemoteError>;

    /// Crée un répertoire (récursivement si nécessaire).
    async fn create_dir(&self, path: &str) -> Result<(), RemoteError>;

    /// Supprime un fichier ou un répertoire vide.
    async fn delete(&self, path: &str) -> Result<(), RemoteError>;

    /// Supprime récursivement un répertoire et son contenu.
    async fn delete_recursive(&self, path: &str) -> Result<(), RemoteError> {
        let entries = self.list_dir(path).await?;
        for entry in entries {
            if entry.is_dir() {
                Box::pin(self.delete_recursive(&entry.path)).await?;
            } else {
                self.delete(&entry.path).await?;
            }
        }
        self.delete(path).await
    }

    /// Renomme ou déplace un fichier/dossier.
    async fn rename(&self, from: &str, to: &str) -> Result<(), RemoteError>;

    /// Copie un fichier (peut ne pas être supporté par tous les providers).
    async fn copy_file(&self, from: &str, to: &str) -> Result<RemoteEntry, RemoteError> {
        let _ = (from, to);
        Err(RemoteError::Unsupported("copy non supportée par ce provider".into()))
    }

    /// Génère une URL temporaire de téléchargement (presigned URL).
    /// Renvoie None si le provider ne supporte pas cette fonctionnalité.
    async fn presign_get(&self, _path: &str, _ttl_secs: u64) -> Option<String> {
        None
    }

    /// Renvoie true si la connexion est encore valide (sans requête réseau).
    fn is_token_valid(&self) -> bool {
        true
    }
}
