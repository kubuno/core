use serde::Deserialize;
use std::path::{Path, PathBuf};

/// Contenu complet d'un fichier module.toml
#[derive(Debug, Clone, Deserialize)]
pub struct ModuleManifest {
    pub module:        ModuleInfo,
    pub process:       ProcessInfo,
    pub server:        ServerInfo,
    #[serde(default)]
    pub routes:        RoutesInfo,
    #[serde(default)]
    pub sidebar_items: Vec<SidebarItemManifest>,
    #[serde(default)]
    pub events:        EventsInfo,
}

#[derive(Debug, Clone, Deserialize)]
pub struct ModuleInfo {
    pub id:            String,
    pub display_name:  String,
    pub version:       String,
    pub description:   Option<String>,
    pub author:        Option<String>,
    pub license:       Option<String>,
    pub homepage_url:  Option<String>,
    /// "rust" | "python" | "node" | "binary"
    pub runtime:       String,
    #[serde(default)]
    pub dependencies:  Vec<String>,
    /// Route vers la page de paramètres du module (ex: "/files/settings")
    pub settings_path: Option<String>,
    /// Module d'infrastructure interne (ex. stt) : enregistré pour le routage
    /// mais masqué de la liste des modules de l'administration.
    #[serde(default)]
    pub internal:      bool,
}

#[derive(Debug, Clone, Deserialize)]
pub struct ProcessInfo {
    /// Chemin de l'exécutable/script relatif au répertoire du module.
    pub entrypoint: String,
    #[serde(default)]
    pub args: Vec<String>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct ServerInfo {
    pub host: String,
    pub port: u16,
}

#[derive(Debug, Clone, Deserialize, Default)]
pub struct RoutesInfo {
    #[serde(default)]
    pub patterns: Vec<RoutePattern>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct RoutePattern {
    pub method: String,
    pub path:   String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct SidebarItemManifest {
    pub id:       String,
    pub label:    String,
    pub icon:     String,
    pub path:     String,
    pub position: i32,
    #[serde(default)]
    pub badge:    Option<String>,
    #[serde(default)]
    pub section:  Option<String>,
}

#[derive(Debug, Clone, Deserialize, Default)]
pub struct EventsInfo {
    #[serde(default)]
    pub subscribed: Vec<String>,
    #[serde(default)]
    pub publishes:  Vec<String>,
}

impl ModuleManifest {
    pub fn from_toml(content: &str) -> Result<Self, toml::de::Error> {
        toml::from_str(content)
    }

    /// Construit la commande tokio selon le runtime.
    /// `module_dir` : /usr/lib/kubuno/modules/<id>/
    pub fn build_tokio_command(&self, module_dir: &Path) -> tokio::process::Command {
        let entrypoint = module_dir.join(&self.process.entrypoint);

        let mut cmd = match self.module.runtime.as_str() {
            "python" => {
                let mut c = tokio::process::Command::new("python3");
                c.arg(&entrypoint);
                c
            }
            "node" => {
                let mut c = tokio::process::Command::new("node");
                c.arg(&entrypoint);
                c
            }
            // "rust" | "binary" | tout autre → exécutable direct
            _ => tokio::process::Command::new(&entrypoint),
        };

        for arg in &self.process.args {
            cmd.arg(arg);
        }
        cmd
    }

    /// URL de base du module (proxy + enregistrement).
    pub fn base_url(&self) -> String {
        format!("http://{}:{}", self.server.host, self.server.port)
    }
}

/// Charge tous les manifests depuis le répertoire des modules installés.
/// Chaque sous-répertoire contenant un `module.toml` est un module.
pub fn load_all(modules_dir: &Path) -> Vec<(PathBuf, ModuleManifest)> {
    let mut manifests = Vec::new();

    let entries = match std::fs::read_dir(modules_dir) {
        Ok(e) => e,
        Err(e) => {
            tracing::warn!(
                dir   = %modules_dir.display(),
                error = %e,
                "Impossible de lire le répertoire des modules"
            );
            return manifests;
        }
    };

    for entry in entries.flatten() {
        let module_dir = entry.path();
        if !module_dir.is_dir() {
            continue;
        }

        let toml_path = module_dir.join("module.toml");
        if !toml_path.exists() {
            continue;
        }

        match std::fs::read_to_string(&toml_path) {
            Ok(content) => match ModuleManifest::from_toml(&content) {
                Ok(manifest) => {
                    tracing::info!(
                        module_id      = %manifest.module.id,
                        runtime        = %manifest.module.runtime,
                        version        = %manifest.module.version,
                        sidebar_items  = manifest.sidebar_items.len(),
                        routes         = manifest.routes.patterns.len(),
                        "Module découvert"
                    );
                    manifests.push((module_dir, manifest));
                }
                Err(e) => {
                    tracing::error!(
                        path  = %toml_path.display(),
                        error = %e,
                        "module.toml invalide"
                    );
                }
            },
            Err(e) => {
                tracing::error!(
                    path  = %toml_path.display(),
                    error = %e,
                    "Lecture module.toml impossible"
                );
            }
        }
    }

    manifests
}
