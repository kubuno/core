use crate::{
    auth::jwt::JwtService,
    auth::token_scope::{self, TokenGrant},
    errors::AppError,
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
    // de façon asynchrone (sans JWT). Il présente alors son secret interne
    // + l'identité voulue via X-Kubuno-User-Id. On lui fait confiance : ces appels
    // proviennent du réseau interne et le secret n'est jamais exposé au client.
    //
    // Le secret présenté identifie désormais l'appelant (secret dérivé par
    // module) ; le secret maître reste accepté sans identification.
    let caller = req
        .headers()
        .get("x-internal-secret")
        .and_then(|v| v.to_str().ok())
        .and_then(|s| state.settings.server.authenticate_internal(s));

    let internal_user_id = caller.as_ref().and_then(|c| {
        tracing::debug!(
            caller = %c.label(),
            target = %module_id,
            "Appel interne module→module authentifié"
        );
        req.headers()
            .get("x-kubuno-user-id")
            .and_then(|v| v.to_str().ok())
            .and_then(|s| uuid::Uuid::parse_str(s).ok())
    });

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
        let (resolved_user, grant) = resolve_caller(state, &token).await;

        if let Some(user) = resolved_user {
            // The role a module sees. For a session it is the account's own; for
            // an API token it is derived from the token's scopes, because
            // forwarding the owner's role verbatim is what made a personal token
            // an administration key inside every module at once.
            let role = match grant.as_ref() {
                Some(g) => token_scope::module_role_for(g, &user.role),
                None => user.role.clone(),
            };
            let headers = req.headers_mut();
            if let Ok(v) = HeaderValue::from_str(&user.id.to_string()) {
                headers.insert(HeaderName::from_static("x-kubuno-user-id"), v);
            }
            if let Ok(v) = HeaderValue::from_str(&role) {
                headers.insert(HeaderName::from_static("x-kubuno-user-role"), v);
            }
            if let Ok(v) = HeaderValue::from_str(&user.email) {
                headers.insert(HeaderName::from_static("x-kubuno-user-email"), v);
            }
            annotate_origin(headers, grant.as_ref());
        }
    }
    } // fin: authentification par token (ignorée si auth interne module→module)

    // Remplacer Authorization par le secret interne du module cible (celui qu'il
    // possède : le module compare le header reçu à sa propre valeur).
    let headers = req.headers_mut();
    headers.remove("authorization");
    if let Ok(v) = HeaderValue::from_str(&state.settings.server.module_secret(module_id)) {
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

    // Stream the module response instead of buffering it fully: required for
    // infinite responses (live radio/audio streams) and avoids holding large
    // files in memory. Hop-by-hop headers were already stripped above.
    let body = Body::from_stream(resp.bytes_stream());

    Ok(builder.body(body).unwrap())
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
        let (resolved_user, grant) = resolve_caller(&state, &token).await;

        if let Some(user) = resolved_user {
            let role = match grant.as_ref() {
                Some(g) => token_scope::module_role_for(g, &user.role),
                None => user.role.clone(),
            };
            user_headers.push(("x-kubuno-user-id".to_owned(), user.id.to_string()));
            user_headers.push(("x-kubuno-user-role".to_owned(), role));
            user_headers.push(("x-kubuno-user-email".to_owned(), user.email.clone()));
            user_headers.push((
                "x-kubuno-auth-origin".to_owned(),
                if grant.is_some() { "api_token" } else { "session" }.to_owned(),
            ));
            if let Some(g) = grant.as_ref().filter(|g| !g.is_legacy) {
                user_headers.push(("x-kubuno-token-scopes".to_owned(), g.scopes.join(",")));
            }
        }
    }
    // Secret interne du module cible (celui qu'il détient), pas le secret maître.
    user_headers.push((
        "x-internal-secret".to_owned(),
        state.settings.server.module_secret(&module_id),
    ));

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
        A::Text(s)   => T::Text(s.to_string()),
        A::Binary(b) => T::Binary(b),
        A::Ping(p)   => T::Ping(p),
        A::Pong(p)   => T::Pong(p),
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
        T::Text(s)   => A::Text(s.to_string()),
        T::Binary(b) => A::Binary(b),
        T::Ping(p)   => A::Ping(p),
        T::Pong(p)   => A::Pong(p),
        T::Close(f)  => A::Close(f.map(|cf| axum::extract::ws::CloseFrame {
            code:   cf.code.into(),
            reason: cf.reason.to_string().into(),
        })),
        T::Frame(_)  => A::Binary(vec![]),
    }
}

/// Resolves a bearer into the account it names **and** the grant behind it.
///
/// Shared by the HTTP and the WebSocket path so the two cannot drift: a refusal
/// or a role rule added here applies to both. Returns `(None, None)` for anything
/// that does not resolve — the proxy then forwards no identity headers at all,
/// which is what an unauthenticated call should look like to a module.
///
/// The grant is `Some` only for an API token; a session yields `(user, None)` and
/// keeps the account's own role.
async fn resolve_caller(
    state: &AppState,
    token: &str,
) -> (Option<User>, Option<TokenGrant>) {
    let jwt = JwtService::new(
        state.settings.auth.jwt_secret.clone(),
        state.settings.auth.access_token_ttl,
    );

    if let Ok(claims) = jwt.validate_access_token(token) {
        let user = load_active_user(state, claims.sub).await;
        return (user, None);
    }

    // API token. Every refusal — revoked, expired, owner deactivated, legacy past
    // its grace window — is decided by `resolve_grant`, the one path all three
    // entry points share.
    match token_scope::resolve_grant(&state.db, token).await {
        Ok(grant) => {
            let user = load_active_user(state, grant.user_id).await;
            (user, Some(grant))
        }
        Err(_) => (None, None),
    }
}

async fn load_active_user(state: &AppState, id: uuid::Uuid) -> Option<User> {
    match sqlx::query_as::<_, User>(
        "SELECT * FROM core.users WHERE id = $1 AND is_active = TRUE",
    )
    .bind(id)
    .fetch_optional(&state.db)
    .await
    {
        Ok(u) => u,
        Err(e) => {
            tracing::error!(error = %e, user_id = %id, "Proxy : chargement de l'utilisateur");
            None
        }
    }
}

/// Tells the module how the caller authenticated, and with what scopes.
///
/// Informational: the core has already narrowed the role above, so a module that
/// ignores these headers is not less safe than before. A module that reads them
/// can be stricter — refuse a programmatic call on a route meant for a person,
/// say — without the core having to know that route exists.
fn annotate_origin(headers: &mut axum::http::HeaderMap, grant: Option<&TokenGrant>) {
    let origin = if grant.is_some() { "api_token" } else { "session" };
    if let Ok(v) = HeaderValue::from_str(origin) {
        headers.insert(HeaderName::from_static("x-kubuno-auth-origin"), v);
    }
    // A legacy token has no scope list to publish; its header is omitted rather
    // than sent empty, which would read as "scoped to nothing".
    match grant.filter(|g| !g.is_legacy) {
        Some(g) => {
            if let Ok(v) = HeaderValue::from_str(&g.scopes.join(",")) {
                headers.insert(HeaderName::from_static("x-kubuno-token-scopes"), v);
            }
        }
        None => {
            headers.remove("x-kubuno-token-scopes");
        }
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
