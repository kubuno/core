use serde::Deserialize;

#[derive(Debug, Clone, Deserialize)]
pub struct StorageConfig {
    pub backend:       StorageBackendType,
    pub local_path:    Option<String>,
    pub temp_path:     Option<String>,
    pub s3_bucket:     Option<String>,
    pub s3_region:     Option<String>,
    pub s3_endpoint:   Option<String>,
    pub s3_access_key: Option<String>,
    pub s3_secret_key: Option<String>,
}

#[derive(Debug, Clone, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum StorageBackendType {
    Local,
    S3,
}

impl StorageConfig {
    pub fn local_path(&self) -> &str {
        self.local_path.as_deref().unwrap_or("./data/files")
    }

    pub fn temp_path(&self) -> &str {
        self.temp_path.as_deref().unwrap_or("./data/tmp")
    }
}
