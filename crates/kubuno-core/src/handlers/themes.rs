use crate::{auth::middleware::AdminUser, errors::AppError, state::AppState};
use axum::{
    extract::{Path, State},
    Json,
};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::collections::HashMap;

// Thèmes embarqués à la compilation — toujours disponibles quelle que soit la config.
const BUILTIN_LIGHT: &str = include_str!("../../../../themes/kubuno-light.json");
const BUILTIN_DARK: &str  = include_str!("../../../../themes/kubuno-dark.json");

// IDs des thèmes livrés avec l'application — ne peuvent jamais être supprimés.
const BUILTIN_IDS: &[&str] = &["kubuno-light", "kubuno-dark"];

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ThemeDef {
    pub id:           String,
    pub name:         String,
    pub color_scheme: String,
    pub vars:         HashMap<String, String>,
}

fn is_valid_theme_id(id: &str) -> bool {
    !id.is_empty()
        && id.len() <= 64
        && id.chars().all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_')
}

/// Construit le chemin du fichier d'un thème dans `themes_dir`.
/// Retourne une erreur si l'id n'est pas valide (protection contre le path traversal).
fn theme_path(themes_dir: &str, id: &str) -> Result<String, AppError> {
    if !is_valid_theme_id(id) {
        return Err(AppError::Validation(
            "ID de thème invalide (caractères autorisés : a-z, 0-9, -, _)".into(),
        ));
    }
    Ok(format!("{}/{}.json", themes_dir, id))
}

/// GET /api/v1/themes — liste tous les thèmes disponibles (public, sans auth).
pub async fn list_themes(State(state): State<AppState>) -> Result<Json<Value>, AppError> {
    let themes = load_all_themes(&state.settings.server.themes_dir);
    Ok(Json(json!({ "themes": themes })))
}

/// POST /api/v1/admin/themes — importe un nouveau thème (admin uniquement).
pub async fn create_theme(
    State(state): State<AppState>,
    _admin: AdminUser,
    Json(theme): Json<ThemeDef>,
) -> Result<Json<Value>, AppError> {
    if BUILTIN_IDS.contains(&theme.id.as_str()) {
        return Err(AppError::Validation(
            "Impossible de remplacer un thème livré avec l'application".into(),
        ));
    }
    if theme.name.trim().is_empty() {
        return Err(AppError::Validation("Le thème doit avoir un nom".into()));
    }
    if theme.vars.is_empty() {
        return Err(AppError::Validation("Le thème doit contenir des variables de couleur".into()));
    }

    let themes_dir = &state.settings.server.themes_dir;
    let path = theme_path(themes_dir, &theme.id)?;

    // Crée le répertoire si nécessaire
    if let Err(e) = std::fs::create_dir_all(themes_dir) {
        tracing::error!("Impossible de créer le répertoire de thèmes {themes_dir}: {e}");
        return Err(AppError::Internal(anyhow::anyhow!("Impossible de créer le répertoire de thèmes")));
    }

    let json = serde_json::to_string_pretty(&theme)
        .map_err(|e| AppError::Internal(anyhow::anyhow!(e)))?;

    std::fs::write(&path, &json).map_err(|e| {
        tracing::error!("Impossible d'écrire le thème {path}: {e}");
        AppError::Internal(anyhow::anyhow!("Impossible d'enregistrer le thème"))
    })?;

    tracing::info!("Thème '{}' importé ({})", theme.id, path);
    Ok(Json(json!({ "theme": theme })))
}

/// DELETE /api/v1/admin/themes/:id — supprime un thème personnalisé (admin uniquement).
/// Les thèmes built-in ne peuvent pas être supprimés.
pub async fn delete_theme(
    State(state): State<AppState>,
    _admin: AdminUser,
    Path(id): Path<String>,
) -> Result<Json<Value>, AppError> {
    if BUILTIN_IDS.contains(&id.as_str()) {
        return Err(AppError::Forbidden);
    }

    let themes_dir = &state.settings.server.themes_dir;
    let path = theme_path(themes_dir, &id)?;

    match std::fs::remove_file(&path) {
        Ok(()) => {
            tracing::info!("Thème '{id}' supprimé");
            Ok(Json(json!({ "deleted": id })))
        }
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => {
            Err(AppError::NotFound(format!("Thème '{id}' introuvable")))
        }
        Err(e) => {
            tracing::error!("Impossible de supprimer le thème {path}: {e}");
            Err(AppError::Internal(anyhow::anyhow!("Impossible de supprimer le thème")))
        }
    }
}

// ── Utilitaire interne ────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize)]
pub struct ThemeEntry {
    #[serde(flatten)]
    pub theme:   ThemeDef,
    pub builtin: bool,
}

fn load_all_themes(themes_dir: &str) -> Vec<ThemeEntry> {
    let mut themes: Vec<ThemeEntry> = Vec::new();

    // Built-ins (embarqués dans le binaire)
    for raw in [BUILTIN_LIGHT, BUILTIN_DARK] {
        match serde_json::from_str::<ThemeDef>(raw) {
            Ok(t)  => themes.push(ThemeEntry { theme: t, builtin: true }),
            Err(e) => tracing::error!("Thème built-in invalide: {e}"),
        }
    }

    let builtin_ids: std::collections::HashSet<_> =
        themes.iter().map(|e| e.theme.id.clone()).collect();

    // Thèmes additionnels dans le répertoire configuré
    if let Ok(entries) = std::fs::read_dir(themes_dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.extension().and_then(|e| e.to_str()) != Some("json") {
                continue;
            }
            match std::fs::read_to_string(&path) {
                Ok(raw) => match serde_json::from_str::<ThemeDef>(&raw) {
                    Ok(t) => {
                        if !builtin_ids.contains(&t.id) {
                            themes.push(ThemeEntry { theme: t, builtin: false });
                        }
                    }
                    Err(e) => tracing::warn!("Thème ignoré ({path:?}): {e}"),
                },
                Err(e) => tracing::warn!("Impossible de lire le thème ({path:?}): {e}"),
            }
        }
    }

    themes
}
