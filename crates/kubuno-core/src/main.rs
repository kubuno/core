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

    // Mandataires inverses autorisés à définir X-Forwarded-For / X-Real-IP.
    // À installer AVANT le démarrage du serveur : toute résolution d'adresse
    // client (limitation de débit, anti-DDoS, sessions, journal d'accès) en dépend.
    kubuno_core::auth::client_ip::init(&settings.server.trusted_proxy_cidrs);

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
    kubuno_core::auth::ddos::set_jwt_secret(&settings.auth.jwt_secret);
    kubuno_core::auth::ddos::reload_from_db(&pool).await;

    // Inventaire des appareils : base de pays hors-ligne (optionnelle, aucun
    // appel sortant) puis rattachement des sessions antérieures à l'inventaire.
    kubuno_core::devices::bootstrap(&pool).await;

    // Référentiel des jours fériés : le jeu de données livré, chargé une fois
    // par version. Jamais bloquant — une instance qui échoue ici sert ce qu'elle
    // a déjà, et toutes les lectures tolèrent un référentiel vide.
    kubuno_core::holidays::seed::ensure_dataset(&pool).await;

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

    // Worker EventBus → modules abonnés. Met en file une livraison par module
    // dont `subscribed_events` nomme le type — la file (core.jobs) porte les
    // réessais, pour qu'un module redémarré reçoive quand même l'événement.
    // Avant lui, `subscribed_events` était stocké, affiché, et lu par personne :
    // les traitements « UserDeleted » des modules ne s'exécutaient jamais.
    tokio::spawn(kubuno_core::events::dispatch::fanout_worker(
        Arc::clone(&event_bus),
        pool.clone(),
    ));

    // Exécuteur de tâches de fond (core.jobs).
    // Un nouveau type de tâche s'ajoute ICI, sans toucher à l'exécuteur :
    //     job_registry.register_fn("mon.type", |ctx, job| async move { … });
    let mut job_registry = kubuno_core::jobs::JobRegistry::new();
    kubuno_core::jobs::builtin::register(&mut job_registry);
    // Courriels sortants (core.send_email) : le secret JWT est capturé car le
    // gestionnaire doit déchiffrer le mot de passe SMTP stocké.
    kubuno_core::mailer::register_jobs(&mut job_registry, &settings.auth.jwt_secret);
    // Centre d'alertes (core.alerts.scan) : les producteurs ont besoin de la
    // configuration (évaluation de santé, volume de données), que le contexte
    // de tâche ne transporte pas — d'où la capture.
    kubuno_core::alerts::jobs::register(&mut job_registry, Arc::new(settings.clone()));
    // Moteur de règles (core.rules.action / .backtest / .maintenance) : les
    // réglages serveur sont capturés car exécuter l'action d'un MODULE est un
    // appel interne portant le secret dérivé DE CE MODULE, et le contexte de
    // tâche ne transporte qu'un pool.
    kubuno_core::rules::jobs::register(
        &mut job_registry,
        Arc::new(settings.server.clone()),
    );
    // Sauvegarde planifiée du schéma core (core.backup.run / .run_now). Écrite
    // en Rust depuis le pool : kubuno-seccomp interdit execve, donc pg_dump
    // n'est pas lançable depuis le serveur — cf. crate::backup.
    kubuno_core::backup::jobs::register(&mut job_registry);
    // Livraison des événements aux modules (core.events.deliver). Les réglages
    // serveur sont capturés : l'appel porte le secret interne DU MODULE VISÉ,
    // dérivé par module, et le contexte de tâche ne transporte qu'un pool.
    kubuno_core::events::dispatch::register(
        &mut job_registry,
        Arc::new(settings.server.clone()),
    );
    // Import périodique des annuaires LDAP / Active Directory
    // (core.directory_sync). Le secret JWT est capturé : le gestionnaire doit
    // déchiffrer le mot de passe du compte de service, et un contexte de tâche
    // ne transporte qu'un pool.
    kubuno_core::directory::job::register(&mut job_registry, settings.auth.jwt_secret.clone());
    // Migration de données (core.data_migration.step) : deux captures, car un
    // contexte de tâche ne transporte qu'un pool. Les réglages serveur, parce
    // que faire travailler un module est un appel interne portant le secret
    // dérivé DE CE MODULE ; le secret JWT, parce que les identifiants du serveur
    // source sont scellés au repos et doivent être ouverts pour être transmis.
    kubuno_core::data_migration::jobs::register(
        &mut job_registry,
        Arc::new(settings.server.clone()),
        Arc::new(settings.auth.jwt_secret.clone()),
    );
    // Export de données (core.data_export.run / .prune) : les réglages serveur
    // sont capturés, car demander à un module les données d'un compte est un
    // appel interne portant le secret dérivé DE CE MODULE, et un contexte de
    // tâche ne transporte qu'un pool. Cf. crate::data_export::contract.
    kubuno_core::data_export::jobs::register(&mut job_registry, Arc::new(settings.server.clone()));
    let job_cfg = kubuno_core::jobs::JobRunnerConfig::from_db(&pool).await;
    let jobs = kubuno_core::jobs::runner::start(
        pool.clone(),
        Arc::new(job_registry),
        job_cfg,
    )
    .await;
    // Tâches récurrentes du core (purges du journal d'événements et du journal
    // d'audit administratif) — idempotent, ne double pas au redémarrage.
    kubuno_core::jobs::builtin::schedule(&pool).await;
    // Analyse périodique du centre d'alertes — même discipline : idempotent,
    // ré-armé par son propre gestionnaire après chaque passage réussi.
    kubuno_core::alerts::jobs::schedule(&pool).await;
    // Un cycle par annuaire dont la synchronisation périodique est armée.
    kubuno_core::directory::job::schedule_all(&pool).await;
    // Entretien du moteur de règles (purge du journal d'exécution et des
    // compteurs de seuil) — même discipline idempotente.
    kubuno_core::rules::jobs::schedule(&pool).await;
    // Sauvegarde automatique — même discipline : idempotente, ré-armée par son
    // propre gestionnaire, et planifiée à l'heure de la politique (jamais à
    // l'instant du démarrage : un redéploiement ne doit pas déclencher un dump).
    kubuno_core::backup::jobs::schedule(&pool).await;
    // Une campagne de migration laissée « en cours » par un redémarrage reprend
    // d'elle-même. Rien n'est mis en file s'il n'y a rien à migrer : cette
    // chaîne ne tourne que tant qu'il reste du travail.
    kubuno_core::data_migration::jobs::resume(&pool).await;
    // Purge horaire des archives d'export dont la rétention est écoulée. Même
    // discipline idempotente : l'entrée d'historique survit toujours au fichier.
    kubuno_core::data_export::jobs::schedule(&pool).await;

    // Moteur de règles d'administration : déclare le catalogue du core, construit
    // l'index en mémoire, écoute les changements et s'abonne au bus. Démarré
    // APRÈS le PgListener (l'index se recharge par NOTIFY) et après l'exécuteur
    // de tâches (les actions y sont mises en file).
    kubuno_core::rules::start(pool.clone(), Arc::clone(&event_bus)).await;

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

    // Fréquentation des applications : compteur en mémoire alimenté par le proxy,
    // consolidé en base une fois par minute. Démarré ici pour que le compteur
    // existe avant la première requête proxifiée.
    let usage = Arc::new(kubuno_core::modules::usage::UsageMeter::new());
    tokio::spawn(kubuno_core::modules::usage::flusher(
        pool.clone(),
        Arc::clone(&usage),
    ));

    // Live TLS state — shared with the response layer (HSTS) and the admin
    // handlers (hot certificate reload). Populated below once the serving mode
    // is decided.
    let tls_runtime = Arc::new(kubuno_core::network::TlsRuntime::new());

    let state = AppState {
        db:       pool,
        settings: Arc::new(settings.clone()),
        events:   event_bus,
        modules:  registry,
        storage,
        ws_hub,
        remote_mounts,
        usage,
        tls:      Arc::clone(&tls_runtime),
    };

    kubuno_core::handlers::health::init_start_time();

    let frontend_dist = settings.server.frontend_dist.clone();
    // The DB handle is needed after `state` is moved into the router, to resolve
    // the console-managed network configuration.
    let db = state.db.clone();
    let app = builder::build(state, frontend_dist);

    let http_addr: std::net::SocketAddr = format!("{}:{}", settings.server.host, settings.server.port)
        .parse()
        .with_context(|| format!("Adresse d'écoute invalide : {}:{}", settings.server.host, settings.server.port))?;

    let secure_cookies = settings.server.secure_cookies;
    let warn_insecure_cookies = |reason: &str| {
        if !secure_cookies {
            tracing::warn!(
                "{reason} mais server.secure_cookies = false — activez secure_cookies \
                 pour que les cookies (refresh token) soient marqués Secure."
            );
        }
    };

    let file_tls = &settings.server.tls;
    let serve_result: Result<()> = if file_tls.enabled {
        // ── Legacy path: TLS pinned in config.toml. An explicit operator file
        //    override always wins over the console; the panel reports it as
        //    file-managed and read-only. ──
        kubuno_core::network::runtime::install_crypto_provider();
        let rustls_config = axum_server::tls_rustls::RustlsConfig::from_pem_file(
            &file_tls.cert_path,
            &file_tls.key_path,
        )
        .await
        .with_context(|| {
            format!(
                "Chargement du certificat/clé TLS ({} / {})",
                file_tls.cert_path, file_tls.key_path
            )
        })?;
        tls_runtime.set_reload(rustls_config.clone());
        set_hsts_from_db(&db, &tls_runtime).await;
        if file_tls.redirect_http_from_port > 0 {
            spawn_https_redirect(
                settings.server.host.clone(),
                file_tls.redirect_http_from_port,
                http_addr.port(),
            );
        }
        warn_insecure_cookies("server.tls.enabled = true");
        serve_https(http_addr, rustls_config, app).await
    } else {
        // ── Console-managed path: the serving mode is read from the instance's
        //    `network.*` settings and the active certificate in the database. ──
        let net = kubuno_core::network::NetworkConfig::load(&db).await;
        if net.https_enabled {
            match kubuno_core::network::cert::active_material(&db, &settings.auth.jwt_secret).await {
                Some((cert_pem, key_pem)) => {
                    match kubuno_core::network::runtime::build_server_config(
                        cert_pem.as_bytes(),
                        key_pem.as_bytes(),
                        net.tls_min_version,
                    ) {
                        Ok(server_config) => {
                            let rustls_config =
                                axum_server::tls_rustls::RustlsConfig::from_config(server_config);
                            tls_runtime.set_reload(rustls_config.clone());
                            if let Some(hv) = net
                                .hsts
                                .header_value()
                                .and_then(|s| axum::http::HeaderValue::from_str(&s).ok())
                            {
                                tls_runtime.set_hsts(Some(hv));
                            }
                            let https_addr: std::net::SocketAddr =
                                format!("{}:{}", settings.server.host, net.https_port)
                                    .parse()
                                    .with_context(|| {
                                        format!(
                                            "Adresse HTTPS invalide : {}:{}",
                                            settings.server.host, net.https_port
                                        )
                                    })?;
                            if net.http_redirect_to_https {
                                spawn_https_redirect(
                                    settings.server.host.clone(),
                                    net.http_redirect_port,
                                    https_addr.port(),
                                );
                            }
                            warn_insecure_cookies("network.https_enabled = true");
                            serve_https(https_addr, rustls_config, app).await
                        }
                        Err(e) => {
                            tracing::error!(
                                error = %e,
                                "réseau : certificat actif inexploitable — démarrage en HTTP. \
                                 Ré-importez un certificat depuis la console."
                            );
                            serve_http(http_addr, app).await
                        }
                    }
                }
                None => {
                    tracing::warn!(
                        "network.https_enabled = true mais aucun certificat actif — démarrage en HTTP. \
                         Importez un certificat depuis la console puis redémarrez le service."
                    );
                    serve_http(http_addr, app).await
                }
            }
        } else {
            serve_http(http_addr, app).await
        }
    };

    // L'exécuteur de tâches s'arrête APRÈS le serveur : il cesse de réclamer de
    // nouvelles tâches puis laisse celles en cours se terminer. Une tâche coupée
    // en deux serait rejouée depuis le début au démarrage suivant — tous les
    // gestionnaires ne sont pas idempotents.
    jobs.shutdown(std::time::Duration::from_secs(30)).await;

    serve_result?;
    Ok(())
}

/// Attend SIGTERM (systemctl stop/restart) ou Ctrl-C (exécution manuelle).
async fn shutdown_signal() {
    let ctrl_c = async {
        let _ = tokio::signal::ctrl_c().await;
    };

    #[cfg(unix)]
    let terminate = async {
        match tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate()) {
            Ok(mut sig) => {
                sig.recv().await;
            }
            Err(e) => {
                tracing::error!(error = %e, "Écoute de SIGTERM impossible");
                std::future::pending::<()>().await;
            }
        }
    };

    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    tokio::select! {
        _ = ctrl_c    => {}
        _ = terminate => {}
    }
}

/// Sert l'application en HTTPS (TLS natif via rustls) avec arrêt en douceur.
async fn serve_https(
    addr: std::net::SocketAddr,
    config: axum_server::tls_rustls::RustlsConfig,
    app: axum::Router,
) -> Result<()> {
    // Arrêt en douceur : axum-server pilote la fin de service via un Handle.
    let handle = axum_server::Handle::new();
    {
        let handle = handle.clone();
        tokio::spawn(async move {
            shutdown_signal().await;
            tracing::info!("Signal d'arrêt reçu — fin de service HTTPS en douceur");
            handle.graceful_shutdown(Some(std::time::Duration::from_secs(15)));
        });
    }

    tracing::info!("Serveur démarré sur https://{addr} (TLS natif)");
    axum_server::bind_rustls(addr, config)
        .handle(handle)
        .serve(app.into_make_service_with_connect_info::<std::net::SocketAddr>())
        .await
        .context("Erreur du serveur HTTPS")
}

/// Sert l'application en HTTP nu avec arrêt en douceur.
async fn serve_http(addr: std::net::SocketAddr, app: axum::Router) -> Result<()> {
    let listener = tokio::net::TcpListener::bind(&addr)
        .await
        .with_context(|| format!("Bind sur {addr}"))?;

    tracing::info!("Serveur démarré sur http://{addr}");
    axum::serve(
        listener,
        app.into_make_service_with_connect_info::<std::net::SocketAddr>(),
    )
    .with_graceful_shutdown(async {
        shutdown_signal().await;
        tracing::info!("Signal d'arrêt reçu — fin de service HTTP en douceur");
    })
    .await
    .context("Erreur du serveur HTTP")
}

/// Seeds the HSTS header holder from the instance's `network.*` settings, for a
/// server that is about to serve over HTTPS.
async fn set_hsts_from_db(
    db: &sqlx::PgPool,
    tls_runtime: &std::sync::Arc<kubuno_core::network::TlsRuntime>,
) {
    let net = kubuno_core::network::NetworkConfig::load(db).await;
    let hv = net
        .hsts
        .header_value()
        .and_then(|s| axum::http::HeaderValue::from_str(&s).ok());
    tls_runtime.set_hsts(hv);
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
