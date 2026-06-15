use async_trait::async_trait;
use bytes::Bytes;
use chrono::{DateTime, Utc};
use futures::Stream;
use reqwest::Client;
use serde::Deserialize;
use std::pin::Pin;

use super::connector::{
    ByteStream, ConnectorConfig, RemoteConnector, RemoteEntry, RemoteEntryType, RemoteError,
    RemoteQuota,
};

const API_URL:    &str = "https://api.dropboxapi.com/2";
const CONTENT_URL: &str = "https://content.dropboxapi.com/2";

#[derive(Debug, Deserialize)]
struct DbxEntry {
    #[serde(rename = ".tag")]
    tag:               String,
    name:              String,
    #[serde(rename = "path_display")]
    path_display:      String,
    size:              Option<u64>,
    #[serde(rename = "client_modified")]
    client_modified:   Option<String>,
    id:                Option<String>,
    rev:               Option<String>,
}

#[derive(Debug, Deserialize)]
struct DbxList {
    entries:     Vec<DbxEntry>,
    has_more:    bool,
    cursor:      Option<String>,
}

#[derive(Debug, Deserialize)]
struct DbxSpace {
    used: u64,
    allocation: DbxAllocation,
}

#[derive(Debug, Deserialize)]
struct DbxAllocation {
    allocated: Option<u64>,
}

pub struct DropboxConnector {
    client:       Client,
    access_token: String,
    base_path:    String,
}

impl DropboxConnector {
    pub fn new(config: &ConnectorConfig) -> Result<Self, RemoteError> {
        let access_token = config.access_token.clone()
            .ok_or_else(|| RemoteError::Auth("Token Dropbox manquant".into()))?;

        let client = Client::builder()
            .user_agent("Kubuno/1.0")
            .timeout(std::time::Duration::from_secs(60))
            .build()
            .map_err(|e| RemoteError::Network(e.to_string()))?;

        Ok(Self {
            client,
            access_token,
            base_path: config.base_path.clone().unwrap_or_default(),
        })
    }

    fn auth(&self) -> String { format!("Bearer {}", self.access_token) }

    fn full_path(&self, path: &str) -> String {
        let base = self.base_path.trim_end_matches('/');
        let rel  = path.trim_start_matches('/');
        if rel.is_empty() {
            if base.is_empty() { String::new() } else { base.to_string() }
        } else {
            format!("{base}/{rel}")
        }
    }

    fn entry_from_dbx(&self, e: DbxEntry) -> RemoteEntry {
        let is_dir = e.tag == "folder";
        let mtime  = e.client_modified.as_deref()
            .and_then(|s| DateTime::parse_from_rfc3339(s).ok())
            .map(|d| d.with_timezone(&Utc));

        // Make path relative to base_path
        let base = self.base_path.trim_end_matches('/');
        let rel  = e.path_display.strip_prefix(base)
            .unwrap_or(&e.path_display)
            .trim_start_matches('/')
            .to_string();

        RemoteEntry {
            name: e.name,
            path: rel,
            entry_type: if is_dir { RemoteEntryType::Directory } else { RemoteEntryType::File },
            size_bytes: e.size,
            modified_at: mtime,
            mime_type: None,
            remote_id: e.id,
            etag: e.rev,
        }
    }
}

#[async_trait]
impl RemoteConnector for DropboxConnector {
    fn provider_name(&self) -> &'static str { "dropbox" }

    async fn connect(&self) -> Result<Option<RemoteQuota>, RemoteError> {
        let resp = self.client
            .post(format!("{API_URL}/users/get_space_usage"))
            .header("Authorization", self.auth())
            .header("Content-Type", "application/json")
            .body("{}")
            .send()
            .await
            .map_err(|e| RemoteError::Network(e.to_string()))?;

        if resp.status() == reqwest::StatusCode::UNAUTHORIZED {
            return Err(RemoteError::Auth("Token Dropbox invalide".into()));
        }

        let space: DbxSpace = resp.json().await
            .map_err(|e| RemoteError::Provider(e.to_string()))?;

        let total = space.allocation.allocated;
        Ok(Some(RemoteQuota {
            total_bytes: total,
            used_bytes:  Some(space.used),
            free_bytes:  total.map(|t| t.saturating_sub(space.used)),
        }))
    }

    async fn list_dir(&self, path: &str) -> Result<Vec<RemoteEntry>, RemoteError> {
        let full = self.full_path(path);
        let body = serde_json::json!({ "path": full });

        let resp = self.client
            .post(format!("{API_URL}/files/list_folder"))
            .header("Authorization", self.auth())
            .json(&body)
            .send()
            .await
            .map_err(|e| RemoteError::Network(e.to_string()))?;

        if !resp.status().is_success() {
            let err = resp.text().await.unwrap_or_default();
            return Err(RemoteError::Provider(err));
        }

        let list: DbxList = resp.json().await
            .map_err(|e| RemoteError::Provider(e.to_string()))?;

        Ok(list.entries.into_iter().map(|e| self.entry_from_dbx(e)).collect())
    }

    async fn stat(&self, path: &str) -> Result<RemoteEntry, RemoteError> {
        let full = self.full_path(path);
        let body = serde_json::json!({ "path": full });

        let resp = self.client
            .post(format!("{API_URL}/files/get_metadata"))
            .header("Authorization", self.auth())
            .json(&body)
            .send()
            .await
            .map_err(|e| RemoteError::Network(e.to_string()))?;

        let entry: DbxEntry = resp.json().await
            .map_err(|e| RemoteError::Provider(e.to_string()))?;

        Ok(self.entry_from_dbx(entry))
    }

    async fn get_file(&self, path: &str) -> Result<ByteStream, RemoteError> {
        let full = self.full_path(path);
        let resp = self.client
            .post(format!("{CONTENT_URL}/files/download"))
            .header("Authorization", self.auth())
            .header("Dropbox-API-Arg", serde_json::json!({ "path": full }).to_string())
            .send()
            .await
            .map_err(|e| RemoteError::Network(e.to_string()))?;

        if !resp.status().is_success() {
            return Err(RemoteError::Provider(format!("Dropbox download: {}", resp.status())));
        }

        use futures::StreamExt;
        let stream = resp.bytes_stream();
        let mapped: ByteStream = Box::pin(stream.map(|r| r.map_err(|e| RemoteError::Network(e.to_string()))));
        Ok(mapped)
    }

    async fn put_file(
        &self,
        path: &str,
        mut stream: Pin<Box<dyn Stream<Item = Result<Bytes, std::io::Error>> + Send>>,
        _size_hint: Option<u64>,
    ) -> Result<RemoteEntry, RemoteError> {
        use futures::StreamExt;

        let full = self.full_path(path);
        let mut data = Vec::new();
        while let Some(chunk) = stream.next().await {
            data.extend_from_slice(&chunk.map_err(|e| RemoteError::Io(e))?);
        }

        let api_arg = serde_json::json!({ "path": full, "mode": "overwrite" });
        let resp = self.client
            .post(format!("{CONTENT_URL}/files/upload"))
            .header("Authorization", self.auth())
            .header("Dropbox-API-Arg", api_arg.to_string())
            .header("Content-Type", "application/octet-stream")
            .body(data)
            .send()
            .await
            .map_err(|e| RemoteError::Network(e.to_string()))?;

        if !resp.status().is_success() {
            return Err(RemoteError::Provider(format!("Dropbox upload: {}", resp.status())));
        }

        self.stat(path).await
    }

    async fn create_dir(&self, path: &str) -> Result<(), RemoteError> {
        let full = self.full_path(path);
        let body = serde_json::json!({ "path": full, "autorename": false });

        let resp = self.client
            .post(format!("{API_URL}/files/create_folder_v2"))
            .header("Authorization", self.auth())
            .json(&body)
            .send()
            .await
            .map_err(|e| RemoteError::Network(e.to_string()))?;

        // 409 = already exists
        if resp.status().is_success() || resp.status() == reqwest::StatusCode::CONFLICT {
            Ok(())
        } else {
            Err(RemoteError::Provider(format!("Dropbox mkdir: {}", resp.status())))
        }
    }

    async fn delete(&self, path: &str) -> Result<(), RemoteError> {
        let full = self.full_path(path);
        let body = serde_json::json!({ "path": full });

        let resp = self.client
            .post(format!("{API_URL}/files/delete_v2"))
            .header("Authorization", self.auth())
            .json(&body)
            .send()
            .await
            .map_err(|e| RemoteError::Network(e.to_string()))?;

        if resp.status().is_success() || resp.status() == reqwest::StatusCode::NOT_FOUND {
            Ok(())
        } else {
            Err(RemoteError::Provider(format!("Dropbox delete: {}", resp.status())))
        }
    }

    async fn rename(&self, from: &str, to: &str) -> Result<(), RemoteError> {
        let from_full = self.full_path(from);
        let to_full   = self.full_path(to);
        let body = serde_json::json!({ "from_path": from_full, "to_path": to_full });

        let resp = self.client
            .post(format!("{API_URL}/files/move_v2"))
            .header("Authorization", self.auth())
            .json(&body)
            .send()
            .await
            .map_err(|e| RemoteError::Network(e.to_string()))?;

        if resp.status().is_success() { Ok(()) } else {
            Err(RemoteError::Provider(format!("Dropbox move: {}", resp.status())))
        }
    }
}
