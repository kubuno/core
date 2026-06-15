// Le core ne porte plus d'implémentation storage.
// Tout est fourni par la crate partagée kubuno-storage.
pub use kubuno_storage::{
    ByteStream, LocalStorage, MultipartPart, StorageBackend, StorageConfig, StorageError,
    StorageObject, StorageResult, from_config,
};
pub use kubuno_storage::path;

// Connecteurs de stockage distant centralisés dans le core (montages externes).
pub mod remote;
