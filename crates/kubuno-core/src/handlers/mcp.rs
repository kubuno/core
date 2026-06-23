//! Endpoint MCP (Streamable HTTP) — agrège les outils déclarés par les modules
//! et proxifie leur exécution. Auth par token API (identité utilisateur).

use async_trait::async_trait;
use axum::{
    extract::State,
    http::{HeaderMap, StatusCode},
    response::{IntoResponse, Response},
    Json,
};
use kubuno_mcp::{handle_message, McpToolProvider, Tool, ToolCallResult};
use serde_json::{json, Value};
use uuid::Uuid;

use crate::{auth::middleware::InternalRequest, handlers::api_tokens::resolve_token, state::AppState};

/// Provider adossé à `core.module_instances.mcp_tools` + exécution par proxy HTTP.
struct CoreToolProvider {
    state: AppState,
}

#[async_trait]
impl McpToolProvider for CoreToolProvider {
    async fn list_tools(&self) -> Vec<Tool> {
        let rows = sqlx::query_as::<_, (Value,)>(
            "SELECT mcp_tools FROM core.module_instances
             WHERE status IN ('healthy', 'starting')",
        )
        .fetch_all(&self.state.db)
        .await
        .unwrap_or_default();

        let mut out = Vec::new();
        for (tools,) in rows {
            if let Some(arr) = tools.as_array() {
                for t in arr {
                    let Some(name) = t.get("name").and_then(|x| x.as_str()) else { continue };
                    out.push(Tool {
                        name:        name.to_string(),
                        description: t.get("description").and_then(|x| x.as_str()).unwrap_or("").to_string(),
                        input_schema: t.get("input_schema").cloned()
                            .unwrap_or_else(|| json!({ "type": "object" })),
                        annotations: t.get("annotations").cloned(),
                    });
                }
            }
        }
        out
    }

    async fn call_tool(&self, name: &str, arguments: Value, user_id: Uuid) -> ToolCallResult {
        // Localiser l'outil (base_url + route + method) parmi les instances actives
        let rows = sqlx::query_as::<_, (String, Value)>(
            "SELECT base_url, mcp_tools FROM core.module_instances
             WHERE status IN ('healthy', 'starting')",
        )
        .fetch_all(&self.state.db)
        .await
        .unwrap_or_default();

        let mut target: Option<(String, String, String)> = None; // (base_url, route, method)
        for (base_url, tools) in rows {
            if let Some(arr) = tools.as_array() {
                for t in arr {
                    if t.get("name").and_then(|x| x.as_str()) == Some(name) {
                        // Les outils UI ne s'exécutent pas côté serveur : ils sont
                        // dispatchés dans le client par l'assistant.
                        if t.pointer("/annotations/kubuno_ui").is_some() {
                            return ToolCallResult::error(format!(
                                "L'outil '{name}' est une action d'interface (à dispatcher côté client)."
                            ));
                        }
                        let route  = t.get("route").and_then(|x| x.as_str()).unwrap_or("/").to_string();
                        let method = t.get("method").and_then(|x| x.as_str()).unwrap_or("POST").to_uppercase();
                        target = Some((base_url.clone(), route, method));
                        break;
                    }
                }
            }
            if target.is_some() { break }
        }

        let Some((base_url, route, method)) = target else {
            return ToolCallResult::error(format!("Outil introuvable: {name}"));
        };

        // Charger l'utilisateur pour injecter son identité aux modules
        let user = sqlx::query_as::<_, crate::models::user::User>(
            "SELECT * FROM core.users WHERE id = $1",
        )
        .bind(user_id)
        .fetch_optional(&self.state.db)
        .await
        .ok()
        .flatten();
        let Some(user) = user else {
            return ToolCallResult::error("Utilisateur introuvable");
        };

        let url = format!("{}{}", base_url.trim_end_matches('/'), route);
        let client = reqwest::Client::new();
        let req = match method.as_str() {
            "GET" => client.get(&url).query(&arguments),
            _     => client.post(&url).json(&arguments),
        }
        .header("x-kubuno-user-id", user.id.to_string())
        .header("x-kubuno-user-role", user.role.clone())
        .header("x-kubuno-user-email", user.email.clone())
        .header("x-internal-secret", self.state.settings.server.internal_secret.clone());

        match req.send().await {
            Ok(resp) => {
                let ok = resp.status().is_success();
                let body = resp.text().await.unwrap_or_default();
                if ok { ToolCallResult::text(body) }
                else  { ToolCallResult::error(body) }
            }
            Err(e) => ToolCallResult::error(format!("Erreur d'appel du module: {e}")),
        }
    }
}

async fn mcp_enabled(state: &AppState) -> bool {
    sqlx::query_scalar::<_, Value>("SELECT value FROM core.settings WHERE key = 'mcp.enabled'")
        .fetch_optional(&state.db)
        .await
        .ok()
        .flatten()
        .and_then(|v| v.as_bool())
        .unwrap_or(false)
}

/// POST /mcp — point d'entrée JSON-RPC (Streamable HTTP, réponses JSON).
pub async fn mcp_endpoint(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(body): Json<Value>,
) -> Response {
    if !mcp_enabled(&state).await {
        return (StatusCode::NOT_FOUND, "Serveur MCP désactivé").into_response();
    }

    // Auth : token API → utilisateur
    let token = headers
        .get("authorization")
        .and_then(|v| v.to_str().ok())
        .and_then(|v| v.strip_prefix("Bearer "));
    let user_id = match token {
        Some(t) => resolve_token(&state.db, t).await,
        None => None,
    };
    let Some(user_id) = user_id else {
        return (StatusCode::UNAUTHORIZED, "Token API requis").into_response();
    };

    dispatch(&state, user_id, body).await
}

/// POST /internal/mcp — variante interne pour les modules de confiance (ex. jarvis)
/// agissant au nom d'un utilisateur. Auth : `x-internal-secret` (extracteur
/// `InternalRequest`) + identité via l'en-tête `x-kubuno-user-id`, au lieu d'un
/// token API personnel (que l'assistant ne possède pas en cours de conversation).
pub async fn internal_mcp_endpoint(
    _internal: InternalRequest,
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(body): Json<Value>,
) -> Response {
    if !mcp_enabled(&state).await {
        return (StatusCode::NOT_FOUND, "Serveur MCP désactivé").into_response();
    }

    let user_id = headers
        .get("x-kubuno-user-id")
        .and_then(|v| v.to_str().ok())
        .and_then(|v| Uuid::parse_str(v).ok());
    let Some(user_id) = user_id else {
        return (StatusCode::BAD_REQUEST, "En-tête x-kubuno-user-id requis").into_response();
    };

    dispatch(&state, user_id, body).await
}

/// Traite un message JSON-RPC unique ou un lot (array), au nom de `user_id`.
async fn dispatch(state: &AppState, user_id: Uuid, body: Value) -> Response {
    let provider = CoreToolProvider { state: state.clone() };
    let version = env!("CARGO_PKG_VERSION");

    if let Some(arr) = body.as_array() {
        let mut out = Vec::new();
        for m in arr {
            if let Some(r) = handle_message(&provider, user_id, "Kubuno", version, m).await {
                out.push(r);
            }
        }
        if out.is_empty() { return StatusCode::ACCEPTED.into_response() }
        Json(Value::Array(out)).into_response()
    } else {
        match handle_message(&provider, user_id, "Kubuno", version, &body).await {
            Some(r) => Json(r).into_response(),
            None => StatusCode::ACCEPTED.into_response(),
        }
    }
}
