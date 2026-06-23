use anyhow::{Context, Result};
use clap::Parser;
use kubuno_core::{
    config::Settings,
    database::{migrations, notify::start_pg_listener, pool::create_pool, seed},
    events::EventBus,
    modules::registry::ModuleRegistry,
    router::builder,
    state::AppState,
    websocket::hub::{WsHub, event_to_ws_worker},
};
use std::sync::Arc;
use tokio::sync::RwLock;

/// Serveur HTTP du core Kubuno.
///
/// La configuration est chargée depuis config.toml puis surchargée
/// par les variables d'environnement préfixées KV_ (ex: KV_SERVER_PORT=9000).
/// Un fichier .env est chargé automatiquement s'il est présent.
#[derive(Parser, Debug)]
#[command(
    name    = "kubuno-core",
    version = env!("CARGO_PKG_VERSION"),
    about   = "Serveur core de la plateforme Kubuno",
    long_about = "\
Kubuno Core est le serveur HTTP principal de la plateforme Kubuno.\n\
Il applique les migrations SQL au démarrage, expose les routes REST\n\
et WebSocket, proxifie les requêtes vers les modules actifs et gère\n\
l'authentification JWT.\n\
\n\
Variables d'environnement importantes :\n\
  KV_DATABASE_URL          URL PostgreSQL (ex: postgres://user:pass@host/db)\n\
  KV_AUTH_JWT_SECRET       Secret JWT (min. 32 caractères)\n\
  KV_SERVER_PORT           Port d'écoute (défaut : 8080)\n\
  KV_SERVER_HOST           Adresse d'écoute (défaut : 0.0.0.0)\n\
  KV_STORAGE_BACKEND       Backend de stockage : local | s3\n\
  RUST_LOG                 Niveau de log (ex: debug, info, warn)"
)]
struct Cli {
    /// Chemin vers le fichier de configuration (défaut : config.toml dans le répertoire courant)
    #[arg(short, long, value_name = "FICHIER", env = "KV_CONFIG_FILE")]
    config: Option<String>,
}

#[tokio::main]
async fn main() -> Result<()> {
    // Charger .env si présent (développement / Docker) — optionnel
    let _ = dotenvy::dotenv();

    // Parser les arguments — affiche l'aide et quitte proprement sur --help / --version
    let _cli = Cli::parse();

    let settings = Settings::load().context("Chargement de la configuration")?;

    // Initialiser le logging (stdout + fichiers access.log / error.log)
    // Les guards doivent rester en vie jusqu'à la fin du processus.
    let _log_guards = kubuno_core::logging::init(&settings.logging);

    tracing::info!("Kubuno Core v{} démarrage…", env!("CARGO_PKG_VERSION"));

    // Pool PostgreSQL
    let pool = create_pool(&settings.database)
        .await
        .context("Initialisation du pool PostgreSQL")?;

    // Migrations
    if settings.database.run_migrations {
        migrations::run(&pool).await?;
    }

    // Réglages anti-DDoS : amorce env puis source de vérité = core.settings
    // (pilotables à chaud depuis le panneau d'administration).
    kubuno_core::auth::ddos::seed_from_env();
    kubuno_core::auth::ddos::reload_from_db(&pool).await;

    // Seed : compte administrateur initial
    seed::ensure_default_admin(&pool)
        .await
        .context("Création du compte administrateur initial")?;

    // Infrastructure
    let event_bus = Arc::new(EventBus::new(1024));
    let ws_hub    = Arc::new(WsHub::new());
    let registry  = Arc::new(RwLock::new(ModuleRegistry::new()));

    // Storage backend
    let storage = kubuno_storage::from_config(&settings.storage)
        .await
        .context("Initialisation du backend de stockage")?;

    // PgListener pour pub/sub inter-modules
    start_pg_listener(&pool, Arc::clone(&event_bus))
        .await
        .context("Démarrage du PgListener")?;

    // Worker EventBus → WebSocket
    tokio::spawn(event_to_ws_worker(Arc::clone(&event_bus), Arc::clone(&ws_hub)));

    // Worker EventBus → notifications push (UnifiedPush / APNs / FCM)
    tokio::spawn(kubuno_core::push::worker::push_worker(
        Arc::clone(&event_bus),
        pool.clone(),
    ));

    // Recompactage GC unique des snapshots collab (résorbe le bloat hérité de
    // l'ancienne concaténation sans GC). En arrière-plan : ne retarde pas le boot.
    tokio::spawn(kubuno_core::collab::recompact_all(pool.clone()));

    // Lancer et superviser les modules installés
    // start_all scanne modules_dir, synce la DB (core.modules), puis démarre
    // uniquement les modules où is_enabled = TRUE.
    let modules_dir = std::path::PathBuf::from(&settings.server.modules_dir);
    kubuno_core::modules::manager::start_all(
        Arc::new(settings.clone()),
        &modules_dir,
        pool.clone(),
    ).await;

    let remote_mounts = Arc::new(
        kubuno_core::storage::remote::RemoteMountService::new(
            pool.clone(), &settings.server.internal_secret,
        )
    );

    let state = AppState {
        db:       pool,
        settings: Arc::new(settings.clone()),
        events:   event_bus,
        modules:  registry,
        storage,
        ws_hub,
        remote_mounts,
    };

    kubuno_core::handlers::health::init_start_time();

    let frontend_dist = settings.server.frontend_dist.clone();
    let app = builder::build(state, frontend_dist);

    let addr: std::net::SocketAddr = format!("{}:{}", settings.server.host, settings.server.port)
        .parse()
        .with_context(|| format!("Adresse d'écoute invalide : {}:{}", settings.server.host, settings.server.port))?;

    let tls = &settings.server.tls;
    if tls.enabled {
        // Terminaison TLS native (HTTPS) dans le core.
        // Provider crypto explicite (ring) — rustls 0.23 exige un provider par
        // défaut installé au niveau du process, sinon panique au handshake.
        let _ = rustls::crypto::ring::default_provider().install_default();

        let rustls_config = axum_server::tls_rustls::RustlsConfig::from_pem_file(
            &tls.cert_path,
            &tls.key_path,
        )
        .await
        .with_context(|| format!(
            "Chargement du certificat/clé TLS ({} / {})",
            tls.cert_path, tls.key_path
        ))?;

        // Redirection optionnelle HTTP → HTTPS.
        if tls.redirect_http_from_port > 0 {
            spawn_https_redirect(settings.server.host.clone(), tls.redirect_http_from_port, addr.port());
        }

        if !settings.server.secure_cookies {
            tracing::warn!(
                "server.tls.enabled = true mais server.secure_cookies = false — \
                 activez secure_cookies pour que les cookies (refresh token) soient marqués Secure."
            );
        }

        tracing::info!("Serveur démarré sur https://{addr} (TLS natif)");
        axum_server::bind_rustls(addr, rustls_config)
            .serve(app.into_make_service_with_connect_info::<std::net::SocketAddr>())
            .await
            .context("Erreur du serveur HTTPS")?;
    } else {
        let listener = tokio::net::TcpListener::bind(&addr)
            .await
            .with_context(|| format!("Bind sur {addr}"))?;

        tracing::info!("Serveur démarré sur http://{addr}");
        axum::serve(listener, app.into_make_service_with_connect_info::<std::net::SocketAddr>())
            .await
            .context("Erreur du serveur HTTP")?;
    }

    Ok(())
}

/// Lance, en tâche de fond, un petit serveur HTTP qui redirige (308) tout le
/// trafic vers HTTPS. Le domaine est repris de l'en-tête `Host` de la requête
/// (à défaut, l'hôte d'écoute configuré). Le port HTTPS n'est ajouté que s'il
/// diffère de 443.
fn spawn_https_redirect(bind_host: String, http_port: u16, https_port: u16) {
    use axum::{
        extract::OriginalUri,
        http::{header, HeaderMap},
        response::Redirect,
        routing::any,
        Router,
    };
    tokio::spawn(async move {
        let fallback_host = bind_host.clone();
        let handler = move |headers: HeaderMap, OriginalUri(uri): OriginalUri| {
            let fallback_host = fallback_host.clone();
            async move {
                let host_hdr = headers
                    .get(header::HOST)
                    .and_then(|v| v.to_str().ok())
                    .unwrap_or("");
                let domain = host_hdr
                    .split(':')
                    .next()
                    .filter(|s| !s.is_empty())
                    .unwrap_or(fallback_host.as_str());
                let authority = if https_port == 443 {
                    domain.to_string()
                } else {
                    format!("{domain}:{https_port}")
                };
                let path = uri.path_and_query().map(|p| p.as_str()).unwrap_or("/");
                Redirect::permanent(&format!("https://{authority}{path}"))
            }
        };
        let app = Router::new().fallback(any(handler));
        let addr = format!("{bind_host}:{http_port}");
        match tokio::net::TcpListener::bind(&addr).await {
            Ok(listener) => {
                tracing::info!("Redirection HTTP→HTTPS active sur http://{addr}");
                if let Err(e) = axum::serve(listener, app).await {
                    tracing::error!("Serveur de redirection HTTP→HTTPS arrêté : {e}");
                }
            }
            Err(e) => tracing::error!("Bind du port de redirection {addr} échoué : {e}"),
        }
    });
}
