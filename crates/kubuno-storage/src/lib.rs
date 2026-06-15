pub mod backend;
pub mod config;
pub mod error;
pub mod naming;
pub mod path;

pub use backend::local::LocalStorage;
pub use backend::{ByteStream, MultipartPart, StorageBackend, StorageObject};
pub use config::{StorageBackendType, StorageConfig};
pub use error::{StorageError, StorageResult};
pub use naming::{unique_dir_name, unique_file_name};

use std::sync::Arc;

/// Instancie le bon backend depuis la config.
/// Appelé une fois au démarrage dans le core et dans les modules.
pub async fn from_config(config: &StorageConfig) -> StorageResult<Arc<dyn StorageBackend>> {
    match config.backend {
        StorageBackendType::Local => {
            let storage = LocalStorage::new(config.local_path()).await?;
            Ok(Arc::new(storage))
        }
        StorageBackendType::S3 => {
            Ok(Arc::new(backend::s3::S3Storage))
        }
    }
}
