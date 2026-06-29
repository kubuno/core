use crate::auth::ddos::{concurrency_limit, global_rate_limit};
use crate::auth::rate_limit::rate_limit_auth;
use crate::logging::apache_log_middleware;
use crate::{
    handlers::{
        admin::{
            groups::{
                list_groups, get_group, create_group, update_group, delete_group,
                add_member, remove_member,
            },
            oauth_providers::{
                create_oauth_provider, delete_oauth_provider, list_oauth_providers,
                update_oauth_provider,
            },
            settings::{
                get_admin_module, get_settings, list_admin_modules, list_event_log, public_config,
                toggle_module, update_settings,
            },
            users::{
                admin_stats, create_user, delete_user, get_user, list_users, update_user,
                list_user_sessions, revoke_user_session, revoke_all_user_sessions,
            },
        },
        auth::{
            forgot_password, list_public_oauth_providers, login, logout, oauth_callback,
            oauth_redirect, refresh, register, reset_password, totp_verify,
        },
        health::{health, ready},
        themes::{create_theme, delete_theme, list_themes},
        modules::{
            get_module_config, list_modules, module_heartbeat, module_log, publish_event,
            register_module, serve_module_asset, unregister_module,
        },
        users::{
            change_password, get_me, me_activity, list_sessions, revoke_all_sessions, revoke_session,
            update_me, search_users, lookup_users, upload_avatar, get_avatar, get_avatar_original, linked_account_login,
            setup_totp, enable_totp, disable_totp,
        },
        api_tokens::{list as list_api_tokens, create as create_api_token, revoke as revoke_api_token},
        ws::ws_handler,
    },
    modules::proxy::{is_websocket_upgrade, proxy_to_module, proxy_ws_to_module},
    state::AppState,
};
use axum::{
    Router,
    body::Body,
    extract::DefaultBodyLimit,
    http::{HeaderName, HeaderValue, Method, Request, StatusCode, Uri,
        header::{AUTHORIZATION, CONTENT_TYPE},
    },
    middleware::{self, Next},
    response::{IntoResponse, Response},
    routing::{delete, get, patch, post},
};
use std::time::Duration;
use tower_http::{
    compression::CompressionLayer,
    cors::{AllowOrigin, CorsLayer},
    services::{ServeDir, ServeFile},
    set_header::SetResponseHeaderLayer,
    timeout::TimeoutLayer,
    trace::TraceLayer,
};

pub fn build(state: AppState, frontend_dist: String) -> Router {
    // Auth routes with rate limiting (10 req/min for login/register, 3/min for password reset)
    let auth_routes = Router::new()
        .route("/register",                  post(register))
        .route("/login",                     post(login))
        .route("/refresh",                   post(refresh))
        .route("/logout",                    post(logout))
        .route("/forgot-password",           post(forgot_password))
        .route("/reset-password",            post(reset_password))
        .route("/oauth/:provider",          get(oauth_redirect))
        .route("/oauth/:provider/callback", get(oauth_callback))
        .route("/providers",                get(list_public_oauth_providers))
        .route("/totp",                     post(totp_verify))
        .layer(middleware::from_fn(rate_limit_auth));

    let api_v1 = Router::new()
        // ── Auth public ──────────────────────────────────────────
        .nest("/auth", auth_routes)
        // ── Config publique ──────────────────────────────────────
        .route("/config",                   get(public_config))
        // ── Spec OpenAPI + doc interactive (publiques) ───────────
        .route("/openapi.json", get(crate::openapi::openapi_json))
        .route("/docs",         get(crate::openapi::docs))
        // ── Thèmes (public) ──────────────────────────────────────
        .route("/themes", get(list_themes))
        // ── Thèmes admin ─────────────────────────────────────────
        .route("/admin/themes",      post(create_theme))
        .route("/admin/themes/:id", delete(delete_theme))
        // ── Modules (public) ─────────────────────────────────────
        .route("/modules", get(list_modules))
        // Paramètres résolus d'un module pour l'utilisateur courant (authentifié).
        .route("/modules/:module/config", get(get_module_config))
        // ── Composants WASM local-first (authentifié) ────────────
        .route("/desktop/wasm",         get(crate::handlers::desktop::wasm_manifest))
        .route("/desktop/wasm/:name",   get(crate::handlers::desktop::wasm_file))
        // ── User profile (authentifié) ───────────────────────────
        .route("/me",                   get(get_me).patch(update_me))
        .route("/me/activity",          get(me_activity))
        .route("/me/avatar",                post(upload_avatar))
        .route("/users/:id/avatar",        get(get_avatar))
        .route("/users/:id/avatar/original", get(get_avatar_original))
        .route("/linked-account/login",    post(linked_account_login))
        .route("/me/password",          patch(change_password))
        .route("/users/search",         get(search_users))
        .route("/users/lookup",         get(lookup_users))
        .route("/me/sessions",          get(list_sessions).delete(revoke_all_sessions))
        .route("/me/sessions/:id",     delete(revoke_session))
        // API tokens personnels
        .route("/me/api-tokens",        get(list_api_tokens).post(create_api_token))
        .route("/me/api-tokens/:id",   delete(revoke_api_token))
        // 2FA / TOTP
        .route("/me/2fa/setup",         post(setup_totp))
        .route("/me/2fa/enable",        post(enable_totp))
        .route("/me/2fa",              delete(disable_totp))
        // Notifications push (devices + préférences)
        .route("/me/push/devices",      post(crate::handlers::push::register_device))
        .route("/me/push/devices/:id", delete(crate::handlers::push::delete_device))
        .route("/me/push/preferences",  get(crate::handlers::push::list_preferences).patch(crate::handlers::push::set_preference))
        // ── Admin ────────────────────────────────────────────────
        .route("/admin/users",          get(list_users).post(create_user))
        .route("/admin/users/:id",     get(get_user).patch(update_user).delete(delete_user))
        .route("/admin/users/:id/sessions",      get(list_user_sessions).delete(revoke_all_user_sessions))
        .route("/admin/users/:id/sessions/:sid", delete(revoke_user_session))
        .route("/admin/stats",          get(admin_stats))
        .route("/admin/settings",       get(get_settings).patch(update_settings))
        .route("/admin/oauth-providers",      get(list_oauth_providers).post(create_oauth_provider))
        .route("/admin/oauth-providers/:id", patch(update_oauth_provider).delete(delete_oauth_provider))
        .route("/admin/modules",        get(list_admin_modules))
        .route("/admin/modules/:id",   get(get_admin_module).patch(toggle_module))
        .route("/admin/event-log",      get(list_event_log))
        // ── Groupes d'utilisateurs ────────────────────────────────
        .route("/admin/groups",                          get(list_groups).post(create_group))
        .route("/admin/groups/:id",                     get(get_group).patch(update_group).delete(delete_group))
        .route("/admin/groups/:id/members",             post(add_member))
        .route("/admin/groups/:id/members/:user_id",   delete(remove_member))
        // Coupe les requêtes REST anormalement lentes (slowloris applicatif).
        // N'est PAS appliqué à /ws ni au proxy de modules (connexions longues /
        // streaming), interceptés avant ce sous-routeur.
        .layer(TimeoutLayer::with_status_code(StatusCode::REQUEST_TIMEOUT, Duration::from_secs(60)))
        // Idempotence des écritures (rejeu offline) : court-circuite les requêtes
        // mutantes portant un Idempotency-Key déjà vu. No-op sur les GET.
        .layer({
            let st = state.clone();
            middleware::from_fn(move |req: Request<Body>, next: Next| {
                let st = st.clone();
                async move { crate::middleware::idempotency::idempotency(st, req, next).await }
            })
        });

    let internal = Router::new()
        .route("/modules/register",         post(register_module))
        .route("/modules/:id/heartbeat",   post(module_heartbeat))
        .route("/modules/:id/unregister",  post(unregister_module))
        .route("/modules/:id/log",         post(module_log))
        .route("/events/publish",           post(publish_event))
        // Passerelle MCP interne : l'assistant (jarvis) liste/exécute les outils
        // des modules au nom d'un utilisateur (identité via en-tête, pas de token API).
        .route("/mcp",                      post(crate::handlers::mcp::internal_mcp_endpoint))
        // Montages distants centralisés (le module drive proxifie vers ici).
        .route("/storage/mounts/:user_id",                  get(crate::handlers::storage_mounts::list).post(crate::handlers::storage_mounts::create))
        .route("/storage/mounts/:user_id/:id",              axum::routing::delete(crate::handlers::storage_mounts::delete))
        .route("/storage/mounts/:user_id/:id/test",         post(crate::handlers::storage_mounts::test))
        .route("/storage/mounts/:user_id/:id/browse",       get(crate::handlers::storage_mounts::browse_root))
        .route("/storage/mounts/:user_id/:id/browse/*path", get(crate::handlers::storage_mounts::browse))
        .route("/storage/mounts/:user_id/:id/file/*path",   get(crate::handlers::storage_mounts::get_file))
        .route("/storage/mounts/:user_id/:id/upload/*path", post(crate::handlers::storage_mounts::upload))
        .route("/storage/mounts/:user_id/:id/entry/*path",  axum::routing::delete(crate::handlers::storage_mounts::delete_entry))
        .route("/storage/mounts/:user_id/:id/rename/*path", post(crate::handlers::storage_mounts::rename_entry))
        .route("/storage/mounts/:user_id/:id/mkdir/*path",  post(crate::handlers::storage_mounts::create_dir))
        .layer(TimeoutLayer::with_status_code(StatusCode::REQUEST_TIMEOUT, Duration::from_secs(30)));

    let cors = {
        let origins = state.settings.server.cors_origins.clone();
        let allow = if origins.is_empty() {
            AllowOrigin::list([])
        } else {
            let parsed: Vec<_> = origins.iter()
                .filter_map(|o| o.parse().ok())
                .collect();
            AllowOrigin::list(parsed)
        };
        CorsLayer::new()
            .allow_origin(allow)
            .allow_methods([Method::GET, Method::POST, Method::PATCH, Method::DELETE, Method::PUT, Method::OPTIONS])
            .allow_headers([AUTHORIZATION, CONTENT_TYPE])
            .allow_credentials(false)
    };

    let static_files = ServeDir::new(&frontend_dist)
        .fallback(ServeFile::new(format!("{frontend_dist}/index.html")));

    // CSP : l'import map ESM du host est un <script type="importmap"> inline.
    // La CSP interdit l'inline sans hash, donc on lit le sha256 émis par le build
    // (frontend_dist/importmap.sha256) et on l'ajoute à script-src. Absent → pas
    // de hash (dev/host sans plugins runtime) ; l'app fonctionne quand même.
    let csp = {
        let hash = std::fs::read_to_string(
            std::path::Path::new(&frontend_dist).join("importmap.sha256"),
        )
        .ok()
        .map(|s| s.trim().to_string())
        .filter(|s| s.starts_with("sha256-"));
        let script_src = match hash {
            Some(h) => format!("script-src 'self' https://cdn.jsdelivr.net 'unsafe-eval' '{h}'"),
            None => "script-src 'self' https://cdn.jsdelivr.net 'unsafe-eval'".to_string(),
        };
        format!(
            "default-src 'self'; {script_src}; \
             style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com; \
             img-src 'self' data: blob: https:; \
             media-src 'self' blob:; \
             connect-src 'self' ws: wss: blob: https: http:; \
             worker-src 'self' blob:; \
             font-src 'self' data: https://cdn.jsdelivr.net https://fonts.gstatic.com; \
             frame-src 'self' https://www.youtube-nocookie.com https://www.youtube.com; \
             object-src 'none'; base-uri 'self'; form-action 'self'"
        )
    };
    let csp_header = HeaderValue::from_str(&csp)
        .expect("CSP header value invalide");

    // Le middleware de proxy intercepte les requêtes vers les modules actifs
    // AVANT le routage, ce qui évite tout conflit avec les routes paramétrées.
    let proxy_state = state.clone();
    let proxy_middleware = middleware::from_fn(move |req: Request<Body>, next: Next| {
        let state = proxy_state.clone();
        async move { module_proxy_middleware(state, req, next).await }
    });

    Router::new()
        .route("/health", get(health))
        .route("/ready",  get(ready))
        .route("/ws",     get(ws_handler))
        .route("/collab/:room/sync", get(crate::collab::collab_handler))
        .route("/mcp",    post(crate::handlers::mcp::mcp_endpoint))
        // Assets frontend des modules (bundles UI chargés à l'exécution par le host).
        .route("/modules/:id/*path", get(serve_module_asset))
        .nest("/api/v1",  api_v1)
        .nest("/internal", internal)
        .fallback_service(static_files)
        .layer(proxy_middleware)
        .layer(DefaultBodyLimit::max(100 * 1024 * 1024)) // 100 MB; modules set their own limits
        .layer(middleware::from_fn(cache_control_middleware))
        .layer(middleware::from_fn(apache_log_middleware))
        .layer(cors)
        .layer(CompressionLayer::new())
        .layer(TraceLayer::new_for_http())
        .layer(SetResponseHeaderLayer::overriding(
            HeaderName::from_static("x-content-type-options"),
            HeaderValue::from_static("nosniff"),
        ))
        .layer(SetResponseHeaderLayer::overriding(
            HeaderName::from_static("x-frame-options"),
            HeaderValue::from_static("DENY"),
        ))
        .layer(SetResponseHeaderLayer::overriding(
            HeaderName::from_static("referrer-policy"),
            HeaderValue::from_static("strict-origin-when-cross-origin"),
        ))
        .layer(SetResponseHeaderLayer::overriding(
            HeaderName::from_static("strict-transport-security"),
            HeaderValue::from_static("max-age=31536000; includeSubDomains"),
        ))
        .layer(SetResponseHeaderLayer::overriding(
            HeaderName::from_static("content-security-policy"),
            csp_header,
        ))
        .layer(SetResponseHeaderLayer::overriding(
            HeaderName::from_static("permissions-policy"),
            // Allow same-origin access to camera/mic/screen-capture so the chat
            // module can run WebRTC audio/video calls. Third parties stay blocked.
            HeaderValue::from_static("camera=(self), microphone=(self), display-capture=(self), geolocation=()"),
        ))
        // ── Protections anti-DDoS (les plus externes : filtrent avant tout
        //    travail coûteux). global_rate_limit amortit un flood par IP ;
        //    concurrency_limit est le garde-fou ultime qui borne la mémoire/les
        //    tâches en sheddant (503) quand le serveur est saturé. Les deux
        //    laissent passer les connexions longues (WebSocket). ──
        .layer(middleware::from_fn(concurrency_limit))
        .layer(middleware::from_fn(global_rate_limit))
        .with_state(state)
}

/// Middleware : si le chemin est /api/v1/{module_id}/... et que ce module est actif,
/// proxifie directement. Sinon laisse passer vers le routeur (routes internes du core).
async fn module_proxy_middleware(
    state: AppState,
    req: Request<Body>,
    next: Next,
) -> Response {
    let path = req.uri().path().to_owned();

    if let Some(api_path) = path.strip_prefix("/api/v1/") {
        let module_id = api_path.split('/').next().unwrap_or("").to_string();
        if !module_id.is_empty() {
            let is_active = state.modules.read().await.get(&module_id).is_some();
            if is_active {
                let rewritten = rewrite_uri_strip_prefix(req.uri(), "/api/v1");
                let (mut parts, body) = req.into_parts();
                parts.uri = rewritten;
                let proxied_req = Request::from_parts(parts, body);

                // WebSocket upgrades need a TCP tunnel, not a reqwest proxy
                if is_websocket_upgrade(&proxied_req) {
                    return proxy_ws_to_module(state, module_id, proxied_req).await;
                }

                return match proxy_to_module(&state, &module_id, proxied_req).await {
                    Ok(resp)  => resp.into_response(),
                    Err(e)    => e.into_response(),
                };
            }
        }
    }

    next.run(req).await
}

/// Cache-Control :
///   - /assets/* (noms hashés par Vite) → immutable 1 an
///   - tout le reste (index.html, routes SPA, API) → no-store
async fn cache_control_middleware(req: Request<Body>, next: Next) -> Response {
    let path = req.uri().path().to_owned();
    let mut response = next.run(req).await;
    let value = if path.starts_with("/assets/") {
        "public, max-age=31536000, immutable"
    } else {
        "no-store"
    };
    if let Ok(v) = HeaderValue::from_str(value) {
        response.headers_mut().insert(axum::http::header::CACHE_CONTROL, v);
    }
    response
}

fn rewrite_uri_strip_prefix(uri: &Uri, prefix: &str) -> Uri {
    let path_and_query = uri.path_and_query().map(|pq| pq.as_str()).unwrap_or("/");
    let stripped = path_and_query
        .strip_prefix(prefix)
        .filter(|s| s.is_empty() || s.starts_with('/'))
        .unwrap_or(path_and_query);
    let new_pq = if stripped.is_empty() { "/" } else { stripped };
    let mut parts = uri.clone().into_parts();
    parts.path_and_query = new_pq.parse().ok();
    Uri::from_parts(parts).unwrap_or_else(|_| uri.clone())
}
