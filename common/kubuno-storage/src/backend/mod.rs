use async_trait::async_trait;
use bytes::Bytes;
use futures::Stream;
use std::pin::Pin;

use crate::error::StorageResult;

pub type ByteStream = Pin<Box<dyn Stream<Item = StorageResult<Bytes>> + Send>>;

#[derive(Debug, Clone)]
pub struct StorageObject {
    pub path:         String,
    pub size:         u64,
    pub content_type: Option<String>,
}

#[derive(Debug, Clone)]
pub struct MultipartPart {
    pub part_number: u32,
    pub etag:        String,
}

#[async_trait]
pub trait StorageBackend: Send + Sync {
    async fn put(&self, path: &str, data: Bytes) -> StorageResult<()>;
    async fn put_stream(&self, path: &str, stream: ByteStream, size_hint: Option<u64>) -> StorageResult<()>;
    async fn get(&self, path: &str) -> StorageResult<Bytes>;
    async fn get_stream(&self, path: &str) -> StorageResult<ByteStream>;
    async fn get_range(&self, path: &str, start: u64, end: u64) -> StorageResult<ByteStream>;
    async fn delete(&self, path: &str) -> StorageResult<()>;
    async fn delete_dir(&self, path: &str) -> StorageResult<()>;
    async fn exists(&self, path: &str) -> StorageResult<bool>;
    async fn size(&self, path: &str) -> StorageResult<u64>;
    async fn list(&self, prefix: &str) -> StorageResult<Vec<StorageObject>>;
    async fn copy(&self, from: &str, to: &str) -> StorageResult<()>;

    async fn mv(&self, from: &str, to: &str) -> StorageResult<()> {
        // Déplacer un fichier SUR LUI-MÊME (copy puis delete) le détruirait :
        // copy(from, from) tronque le fichier, delete(from) le supprime.
        if from == to {
            return Ok(());
        }
        self.copy(from, to).await?;
        self.delete(from).await
    }

    /// Crée un répertoire (et ses parents manquants). No-op si déjà existant.
    async fn create_dir(&self, path: &str) -> StorageResult<()>;

    /// Déplace/renomme un répertoire atomiquement.
    /// Pour S3, équivalent à copier tous les objets sous le nouveau préfixe et supprimer les anciens.
    async fn mv_dir(&self, from: &str, to: &str) -> StorageResult<()>;

    async fn init_multipart(&self, path: &str) -> StorageResult<String>;
    async fn put_part(&self, path: &str, upload_id: &str, part_number: u32, data: Bytes) -> StorageResult<String>;
    async fn complete_multipart(&self, path: &str, upload_id: &str, parts: Vec<MultipartPart>) -> StorageResult<()>;
    async fn abort_multipart(&self, path: &str, upload_id: &str) -> StorageResult<()>;

    async fn presign_get(&self, path: &str, ttl_seconds: u64) -> StorageResult<String>;
}

pub mod local;
pub mod s3;
