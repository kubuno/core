use crate::{
    auth::jwt::JwtService,
    errors::AppError,
    handlers::api_tokens::resolve_token,
    models::user::User,
    state::AppState,
};
use base64::{Engine as _, engine::general_purpose::STANDARD as B64};
use axum::{
    body::Body,
    extract::{FromRequestParts, WebSocketUpgrade},
    http::{HeaderName, HeaderValue, Request, Response, StatusCode},
    response::IntoResponse,
};
use futures::{SinkExt, StreamExt};
use tokio_tungstenite::tungstenite;

pub async fn proxy_to_module(
    state: &AppState,
    module_id: &str,
    mut req: Request<Body>,
) -> Result<Response<Body>, AppError> {
    let registry = state.modules.read().await;
    let instance = registry
        .get(module_id)
        .ok_or_else(|| AppError::NotFound(format!("Module '{module_id}' non actif")))?;

    let base_url = instance.base_url.trim_end_matches('/').to_owned();
    drop(registry);

    let path_and_query = req
        .uri()
        .path_and_query()
        .map(|pq| pq.as_str())
        .unwrap_or("/");

    // Le path a déjà été stripped de /api/v1 par le nest Axum.
    // On retire aussi le préfixe /{module_id} pour que le module reçoive ses propres routes.
    // Ex: /files/folders → /folders, /files → /
    let stripped = path_and_query
        .strip_prefix(&format!("/{module_id}"))
        .map(|s| if s.is_empty() { "/" } else { s })
        .unwrap_or(path_and_query)
        .to_owned();

    let target_url = format!("{base_url}{stripped}");

    // ── Authentification interne module→module ───────────────────────────────
    // Un module (ex: Flow) peut appeler un autre module au nom d'un utilisateur,
    // de façon asynchrone (sans JWT). Il présente alors le secret interne du core
    // + l'identité voulue via X-Kubuno-User-Id. On lui fait confiance : ces appels
    // proviennent du réseau interne et le secret n'est jamais exposé au client.
    let internal_user_id = {
        let secret_ok = req.headers()
            .get("x-internal-secret")
            .and_then(|v| v.to_str().ok())
            .map(|s| s == state.settings.server.internal_secret)
            .unwrap_or(false);
        if secret_ok {
            req.headers()
                .get("x-kubuno-user-id")
                .and_then(|v| v.to_str().ok())
                .and_then(|s| uuid::Uuid::parse_str(s).ok())
        } else {
            None
        }
    };

    if let Some(uid) = internal_user_id {
        let resolved_user = sqlx::query_as::<_, User>(
            "SELECT * FROM core.users WHERE id = $1 AND is_active = TRUE",
        )
        .bind(uid)
        .fetch_optional(&state.db)
        .await
        .ok()
        .flatten();

        if let Some(user) = resolved_user {
            let headers = req.headers_mut();
            if let Ok(v) = HeaderValue::from_str(&user.id.to_string()) {
                headers.insert(HeaderName::from_static("x-kubuno-user-id"), v);
            }
            if let Ok(v) = HeaderValue::from_str(&user.role) {
                headers.insert(HeaderName::from_static("x-kubuno-user-role"), v);
            }
            if let Ok(v) = HeaderValue::from_str(&user.email) {
                headers.insert(HeaderName::from_static("x-kubuno-user-email"), v);
            }
        }
    }

    // Extraire et valider le token (JWT ou API token) pour injecter les headers utilisateur
    // Fallback: lire le cookie access_token si pas d'Authorization header (ex: <img src>, <a href>)
    let bearer = req.headers()
        .get("authorization")
        .and_then(|v| v.to_str().ok())
        .and_then(|v| v.strip_prefix("Bearer "))
        .map(|s| s.to_owned())
        .or_else(|| extract_cookie_token(req.headers()));

    if internal_user_id.is_none() {
    if let Some(token) = bearer {
        let resolved_user: Option<User> = {
            // Essai 1 : JWT
            let jwt = JwtService::new(
                state.settings.auth.jwt_secret.clone(),
                state.settings.auth.access_token_ttl,
            );
            if let Ok(claims) = jwt.validate_access_token(&token) {
                sqlx::query_as::<_, User>(
                    "SELECT * FROM core.users WHERE id = $1 AND is_active = TRUE",
                )
                .bind(claims.sub)
                .fetch_optional(&state.db)
                .await
                .ok()
                .flatten()
            } else {
                // Essai 2 : API token
                if let Some(uid) = resolve_token(&state.db, &token).await {
                    sqlx::query_as::<_, User>(
                        "SELECT * FROM core.users WHERE id = $1 AND is_active = TRUE",
                    )
                    .bind(uid)
                    .fetch_optional(&state.db)
                    .await
                    .ok()
                    .flatten()
                } else {
                    None
                }
            }
        };

        if let Some(user) = resolved_user {
            let headers = req.headers_mut();
            if let Ok(v) = HeaderValue::from_str(&user.id.to_string()) {
                headers.insert(HeaderName::from_static("x-kubuno-user-id"), v);
            }
            if let Ok(v) = HeaderValue::from_str(&user.role) {
                headers.insert(HeaderName::from_static("x-kubuno-user-role"), v);
            }
            if let Ok(v) = HeaderValue::from_str(&user.email) {
                headers.insert(HeaderName::from_static("x-kubuno-user-email"), v);
            }
        }
    }
    } // fin: authentification par token (ignorée si auth interne module→module)

    // Remplacer Authorization par le secret interne
    let headers = req.headers_mut();
    headers.remove("authorization");
    if let Ok(v) = HeaderValue::from_str(&state.settings.server.internal_secret) {
        headers.insert(HeaderName::from_static("x-internal-secret"), v);
    }

    // Construire la requête vers le module
    let client = reqwest::Client::new();
    let method = reqwest::Method::from_bytes(req.method().as_str().as_bytes())
        .map_err(|e| AppError::Internal(anyhow::anyhow!("Méthode HTTP invalide: {e}")))?;

    // Cloner les headers modifiés avant de consommer le body.
    // Supprimer les hop-by-hop headers qui ne doivent pas être forwardés.
    let mut forwarded_headers = req.headers().clone();
    for h in &["host", "connection", "transfer-encoding", "te", "upgrade", "keep-alive",
               "content-length"] {
        forwarded_headers.remove(*h);
    }

    let body_bytes = axum::body::to_bytes(req.into_body(), usize::MAX)
        .await
        .map_err(|e| AppError::Internal(anyhow::anyhow!("Lecture body: {e}")))?;

    let resp = client
        .request(method, &target_url)
        .headers(forwarded_headers)
        .body(body_bytes)
        .send()
        .await
        .map_err(|e| {
            tracing::error!(error = %e, module_id = %module_id, "Proxy module échoué");
            AppError::Internal(anyhow::anyhow!("Module injoignable: {e}"))
        })?;

    let status = StatusCode::from_u16(resp.status().as_u16())
        .unwrap_or(StatusCode::INTERNAL_SERVER_ERROR);

    // Forwarder les headers de réponse du module (Content-Type, etc.)
    // sauf les hop-by-hop headers
    let mut builder = Response::builder().status(status);
    for (name, value) in resp.headers() {
        let n = name.as_str();
        if !matches!(n, "connection" | "transfer-encoding" | "keep-alive" | "te" | "upgrade") {
            builder = builder.header(name, value);
        }
    }

    let body = resp
        .bytes()
        .await
        .map_err(|e| AppError::Internal(anyhow::anyhow!("Lecture réponse module: {e}")))?;

    Ok(builder.body(Body::from(body)).unwrap())
}

/// Returns true if this request is a WebSocket upgrade.
pub fn is_websocket_upgrade(req: &Request<Body>) -> bool {
    req.headers()
        .get("upgrade")
        .and_then(|v| v.to_str().ok())
        .map(|v| v.eq_ignore_ascii_case("websocket"))
        .unwrap_or(false)
}

/// Proxy a WebSocket upgrade request to the target module.
/// Bidirectionally forwards frames between the client and the module.
pub async fn proxy_ws_to_module(
    state: AppState,
    module_id: String,
    req: Request<Body>,
) -> axum::response::Response {
    let registry = state.modules.read().await;
    let instance = match registry.get(&module_id) {
        Some(i) => i.clone(),
        None => {
            drop(registry);
            return AppError::NotFound(format!("Module '{module_id}' non actif")).into_response();
        }
    };
    let base_url = instance.base_url.trim_end_matches('/').to_owned();
    drop(registry);

    let path_and_query = req.uri().path_and_query().map(|pq| pq.as_str()).unwrap_or("/").to_owned();
    let stripped = path_and_query
        .strip_prefix(&format!("/{module_id}"))
        .map(|s| if s.is_empty() { "/" } else { s })
        .unwrap_or(&path_and_query)
        .to_owned();

    // Convert http:// base_url → ws://
    let ws_base = base_url
        .replacen("https://", "wss://", 1)
        .replacen("http://", "ws://", 1);
    let target_ws_url = format!("{ws_base}{stripped}");

    // Resolve user: try Authorization header, then cookie, then ?token= query param
    // (browsers can't set custom headers for WebSocket, so query param is the standard fallback)
    let bearer = req.headers()
        .get("authorization")
        .and_then(|v| v.to_str().ok())
        .and_then(|v| v.strip_prefix("Bearer "))
        .map(|s| s.to_owned())
        .or_else(|| extract_cookie_token(req.headers()))
        .or_else(|| {
            req.uri().query()
                .and_then(|q| url::form_urlencoded::parse(q.as_bytes())
                    .find(|(k, _)| k == "token")
                    .map(|(_, v)| v.into_owned()))
        });

    let mut user_headers: Vec<(String, String)> = Vec::new();
    if let Some(token) = bearer {
        let jwt = JwtService::new(
            state.settings.auth.jwt_secret.clone(),
            state.settings.auth.access_token_ttl,
        );
        let resolved_user: Option<User> = if let Ok(claims) = jwt.validate_access_token(&token) {
            sqlx::query_as::<_, User>("SELECT * FROM core.users WHERE id = $1 AND is_active = TRUE")
                .bind(claims.sub)
                .fetch_optional(&state.db)
                .await
                .ok()
                .flatten()
        } else if let Some(uid) = resolve_token(&state.db, &token).await {
            sqlx::query_as::<_, User>("SELECT * FROM core.users WHERE id = $1 AND is_active = TRUE")
                .bind(uid)
                .fetch_optional(&state.db)
                .await
                .ok()
                .flatten()
        } else {
            None
        };

        if let Some(user) = resolved_user {
            user_headers.push(("x-kubuno-user-id".to_owned(), user.id.to_string()));
            user_headers.push(("x-kubuno-user-role".to_owned(), user.role.clone()));
            user_headers.push(("x-kubuno-user-email".to_owned(), user.email.clone()));
        }
    }
    user_headers.push(("x-internal-secret".to_owned(), state.settings.server.internal_secret.clone()));

    // Extract WebSocketUpgrade from the request parts
    let (mut parts, _body) = req.into_parts();
    let upgrade = match WebSocketUpgrade::from_request_parts(&mut parts, &state).await {
        Ok(u) => u,
        Err(e) => return e.into_response(),
    };

    upgrade.on_upgrade(move |client_ws| async move {
        // Build tungstenite request with WebSocket handshake headers + user headers.
        // When passing http::Request<()> to connect_async, tungstenite does NOT auto-add
        // the mandatory WebSocket headers, so we must include them ourselves.
        let ws_key: [u8; 16] = rand::random();
        let ws_key_b64 = B64.encode(ws_key);

        // Extract host[:port] from the target URL for the required Host header
        let host_header = target_ws_url
            .trim_start_matches("wss://")
            .trim_start_matches("ws://")
            .split('/')
            .next()
            .unwrap_or("127.0.0.1");

        let mut req_builder = tungstenite::handshake::client::Request::builder()
            .uri(&target_ws_url)
            .header("Host", host_header)
            .header("Connection", "Upgrade")
            .header("Upgrade", "websocket")
            .header("Sec-WebSocket-Version", "13")
            .header("Sec-WebSocket-Key", &ws_key_b64);
        for (k, v) in &user_headers {
            req_builder = req_builder.header(k.as_str(), v.as_str());
        }
        let tung_req = match req_builder.body(()) {
            Ok(r) => r,
            Err(e) => {
                tracing::error!(error = %e, "WS proxy: build request failed");
                return;
            }
        };

        let (module_ws, _) = match tokio_tungstenite::connect_async(tung_req).await {
            Ok(c) => c,
            Err(e) => {
                tracing::error!(error = %e, target = %target_ws_url, "WS proxy: connect to module failed");
                return;
            }
        };

        let (mut client_sink, mut client_stream) = client_ws.split();
        let (mut module_sink, mut module_stream) = module_ws.split();

        // Client → Module
        let c2m = tokio::spawn(async move {
            while let Some(Ok(msg)) = client_stream.next().await {
                let tung_msg = axum_to_tung(msg);
                if matches!(tung_msg, tungstenite::Message::Close(_)) {
                    let _ = module_sink.send(tung_msg).await;
                    break;
                }
                if module_sink.send(tung_msg).await.is_err() { break; }
            }
        });

        // Module → Client
        while let Some(Ok(msg)) = module_stream.next().await {
            let axum_msg = tung_to_axum(msg);
            if matches!(axum_msg, axum::extract::ws::Message::Close(_)) {
                let _ = client_sink.send(axum_msg).await;
                break;
            }
            if client_sink.send(axum_msg).await.is_err() { break; }
        }

        c2m.abort();
    }).into_response()
}

fn axum_to_tung(msg: axum::extract::ws::Message) -> tungstenite::Message {
    use axum::extract::ws::Message as A;
    use tungstenite::Message as T;
    match msg {
        A::Text(s)   => T::Text(s.to_string().into()),
        A::Binary(b) => T::Binary(b.into()),
        A::Ping(p)   => T::Ping(p.into()),
        A::Pong(p)   => T::Pong(p.into()),
        A::Close(f)  => T::Close(f.map(|cf| tungstenite::protocol::CloseFrame {
            code:   tungstenite::protocol::frame::coding::CloseCode::from(cf.code),
            reason: cf.reason.to_string().into(),
        })),
    }
}

fn tung_to_axum(msg: tungstenite::Message) -> axum::extract::ws::Message {
    use axum::extract::ws::Message as A;
    use tungstenite::Message as T;
    match msg {
        T::Text(s)   => A::Text(s.to_string().into()),
        T::Binary(b) => A::Binary(b.into()),
        T::Ping(p)   => A::Ping(p.into()),
        T::Pong(p)   => A::Pong(p.into()),
        T::Close(f)  => A::Close(f.map(|cf| axum::extract::ws::CloseFrame {
            code:   cf.code.into(),
            reason: cf.reason.to_string().into(),
        })),
        T::Frame(_)  => A::Binary(vec![]),
    }
}

fn extract_cookie_token(headers: &axum::http::HeaderMap) -> Option<String> {
    let cookie_header = headers.get("cookie")?.to_str().ok()?;
    cookie_header.split(';').find_map(|part| {
        let part = part.trim();
        part.strip_prefix("access_token=")
            .filter(|v| !v.is_empty())
            .map(|v| v.to_owned())
    })
}
