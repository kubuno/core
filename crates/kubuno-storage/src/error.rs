#[derive(Debug, thiserror::Error)]
pub enum StorageError {
    #[error("Fichier introuvable: {0}")]
    NotFound(String),

    #[error("Chemin invalide: {0}")]
    InvalidPath(String),

    #[error("Erreur I/O: {0}")]
    Io(#[from] std::io::Error),

    #[error("Erreur S3: {0}")]
    S3(String),

    #[error("Upload multipart introuvable: {0}")]
    MultipartNotFound(String),

    #[error("Erreur interne: {0}")]
    Internal(String),
}

pub type StorageResult<T> = Result<T, StorageError>;
