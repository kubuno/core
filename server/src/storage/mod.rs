// Le core ne porte plus d'implémentation storage.
// Tout est fourni par la crate partagée kubuno-storage.
pub use kubuno_storage::{
    ByteStream, LocalStorage, MultipartPart, StorageBackend, StorageConfig, StorageError,
    StorageObject, StorageResult, from_config,
};
pub use kubuno_storage::path;

// Connecteurs de stockage distant centralisés dans le core (montages externes).
pub mod remote;

// Échantillon quotidien de la consommation de l'instance : la seule source
// possible d'une tendance, `used_bytes` étant un niveau écrasé sur place.
pub mod samples;

// Vocabulaire des catégories de stockage : ce qui est facturé au compte, ce qui
// relève du fonctionnement du module, et ce qu'un autre module détient déjà.
pub mod categories;

// Provenance de la consommation : chaque module déclare ce qu'il occupe, ventilé
// par catégorie ; le core agrège à côté de `used_bytes` et peut le recaler.
pub mod usage;
