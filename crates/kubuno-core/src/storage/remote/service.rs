//! Service de montages distants — cache de connecteurs + chiffrement des configs.
//! La clé dérive de l'internal_secret partagé (MÊME dérivation que l'ancien module
//! drive → les configs migrées restent déchiffrables sans re-chiffrement).

use std::collections::HashMap;
use std::sync::Arc;

use sqlx::PgPool;
use tokio::sync::RwLock;
use uuid::Uuid;

use super::{build_connector, ConnectorConfig, RemoteConnector, RemoteError};

pub struct RemoteMountService {
    db:    PgPool,
    key:   Vec<u8>,
    cache: RwLock<HashMap<Uuid, Arc<dyn RemoteConnector>>>,
}

impl RemoteMountService {
    pub fn new(db: PgPool, internal_secret: &str) -> Self {
        use sha2::{Digest, Sha256};
        let mut hasher = Sha256::new();
        hasher.update(internal_secret.as_bytes());
        hasher.update(b"remotes_config_key");
        Self { db, key: hasher.finalize().to_vec(), cache: RwLock::new(HashMap::new()) }
    }

    pub fn db(&self) -> &PgPool { &self.db }

    pub fn encrypt_config(&self, config: &serde_json::Value) -> Vec<u8> {
        use aes_gcm::{aead::{generic_array::GenericArray, rand_core::RngCore, Aead, OsRng}, Aes256Gcm, KeyInit};
        let cipher = Aes256Gcm::new(GenericArray::from_slice(&self.key[..32]));
        let mut nonce_bytes = [0u8; 12];
        OsRng.fill_bytes(&mut nonce_bytes);
        let nonce = GenericArray::from_slice(&nonce_bytes);
        let ciphertext = cipher.encrypt(nonce, config.to_string().as_bytes()).unwrap_or_default();
        let mut result = nonce_bytes.to_vec();
        result.extend(ciphertext);
        result
    }

    pub fn decrypt_config(&self, data: &[u8]) -> Option<serde_json::Value> {
        use aes_gcm::{aead::{generic_array::GenericArray, Aead}, Aes256Gcm, KeyInit};
        if data.len() < 12 { return None; }
        let cipher = Aes256Gcm::new(GenericArray::from_slice(&self.key[..32]));
        let nonce  = GenericArray::from_slice(&data[..12]);
        cipher.decrypt(nonce, &data[12..]).ok()
            .and_then(|bytes| serde_json::from_slice(&bytes).ok())
    }

    /// Construit un connecteur depuis un provider + une config en clair.
    pub fn connector_from(&self, provider: &str, config: &serde_json::Value) -> Result<Arc<dyn RemoteConnector>, RemoteError> {
        let cfg: ConnectorConfig = serde_json::from_value(config.clone())
            .map_err(|e| RemoteError::Auth(format!("config invalide: {e}")))?;
        build_connector(provider, &cfg)
    }

    /// Charge (et met en cache) le connecteur d'un montage possédé.
    pub async fn get_connector(&self, id: Uuid, owner: Uuid) -> Result<Arc<dyn RemoteConnector>, RemoteError> {
        if let Some(c) = self.cache.read().await.get(&id) { return Ok(c.clone()); }
        let row = sqlx::query_as::<_, (String, Vec<u8>)>(
            "SELECT provider, config_enc FROM core.remote_mounts WHERE id = $1 AND owner_id = $2",
        )
        .bind(id).bind(owner)
        .fetch_optional(&self.db).await
        .map_err(|e| RemoteError::Provider(e.to_string()))?
        .ok_or_else(|| RemoteError::NotFound(format!("Montage {id}")))?;

        let config = self.decrypt_config(&row.1)
            .ok_or_else(|| RemoteError::Auth("config illisible".into()))?;
        let conn = self.connector_from(&row.0, &config)?;
        self.cache.write().await.insert(id, conn.clone());
        Ok(conn)
    }

    pub async fn invalidate(&self, id: Uuid) {
        self.cache.write().await.remove(&id);
    }
}
