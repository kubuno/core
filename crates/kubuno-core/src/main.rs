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

    let addr = format!("{}:{}", settings.server.host, settings.server.port);
    let listener = tokio::net::TcpListener::bind(&addr)
        .await
        .with_context(|| format!("Bind sur {addr}"))?;

    tracing::info!("Serveur démarré sur http://{addr}");

    axum::serve(listener, app.into_make_service_with_connect_info::<std::net::SocketAddr>())
        .await
        .context("Erreur du serveur HTTP")?;

    Ok(())
}
