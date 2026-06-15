use anyhow::{Context, Result};
use clap::{Arg, ArgAction, Command};
use kubuno_core::{
    config::{settings::DatabaseSettings, Settings},
    database::{migrations, pool::create_pool, seed},
};
use kubuno_storage::StorageBackendType;
use std::ffi::OsString;
use std::io::{self, BufRead, Write};
use std::process::Command as Proc;

// ── Display helpers (OCC-style CLI output) ─────────────────────

const RESET: &str = "\x1b[0m";
const BOLD:  &str = "\x1b[1m";
const GREEN: &str = "\x1b[32m";
const YELLOW: &str = "\x1b[33m";
const RED:   &str = "\x1b[31m";
const CYAN:  &str = "\x1b[36m";

fn header() {
    println!("{BOLD}{CYAN}Kubuno{RESET} v{} — Console d'administration", env!("CARGO_PKG_VERSION"));
    println!();
}

fn ok(msg: &str)      { println!(" {GREEN}✓{RESET}  {msg}"); }
fn fail(msg: &str)    { eprintln!(" {RED}✗{RESET}  {msg}"); }
fn info(msg: &str)    { println!("    {msg}"); }
fn warn(msg: &str)    { println!(" {YELLOW}⚠{RESET}  {msg}"); }
fn section(msg: &str) { println!("{BOLD}{msg}{RESET}"); }

// ── Parsing de l'URL PostgreSQL ───────────────────────────────────

struct PgConn {
    user:     String,
    password: String,
    host:     String,
    port:     String,
    db:       String,
}

impl PgConn {
    fn from_settings(cfg: &DatabaseSettings) -> Result<Self> {
        if let Some(url) = &cfg.url {
            return Self::from_url(url);
        }
        let user     = cfg.user.as_deref().context("database.user requis")?.to_string();
        let password = cfg.password.as_deref().unwrap_or("").to_string();
        let host     = cfg.host.as_deref().unwrap_or("localhost").to_string();
        let port     = cfg.port.unwrap_or(5432).to_string();
        let db       = cfg.database.as_deref().context("database.database requis")?.to_string();
        Ok(Self { user, password, host, port, db })
    }

    fn from_url(url: &str) -> Result<Self> {
        let stripped = url
            .trim_start_matches("postgres://")
            .trim_start_matches("postgresql://");

        let (userinfo, rest) = stripped
            .split_once('@')
            .context("DATABASE_URL invalide : '@' manquant")?;

        let (user, pass) = userinfo
            .split_once(':')
            .map(|(u, p)| (u.to_string(), p.to_string()))
            .unwrap_or_else(|| (userinfo.to_string(), String::new()));

        // URL-decode les caractères spéciaux courants du mot de passe
        let password = pass
            .replace("%23", "#")
            .replace("%40", "@")
            .replace("%3A", ":")
            .replace("%2F", "/");

        let (hostport, db) = rest
            .split_once('/')
            .context("DATABASE_URL invalide : '/' manquant après l'hôte")?;

        let (host, port) = hostport
            .split_once(':')
            .map(|(h, p)| (h.to_string(), p.to_string()))
            .unwrap_or_else(|| (hostport.to_string(), "5432".to_string()));

        Ok(Self { user, password, host, port, db: db.to_string() })
    }

    fn pg_env(&self) -> Vec<(String, String)> {
        vec![("PGPASSWORD".into(), self.password.clone())]
    }

    fn pg_args(&self) -> Vec<String> {
        vec![
            "-h".into(), self.host.clone(),
            "-p".into(), self.port.clone(),
            "-U".into(), self.user.clone(),
        ]
    }
}

// ── CLI définition ────────────────────────────────────────────────

fn cli() -> Command {
    Command::new("kubuno")
        .version(env!("CARGO_PKG_VERSION"))
        .about("Console d'administration Kubuno")
        .long_about(
            "kubuno — console d'administration de la plateforme Kubuno.\n\
             \n\
             COMMANDES CORE\n\
             \n\
             db:backup          Sauvegarde la base de données PostgreSQL\n\
             db:restore         Restaure depuis une sauvegarde\n\
             db:reset           Réinitialise le schéma core (toutes les données supprimées)\n\
             db:migrate         Applique les migrations SQL en attente\n\
             db:status          Affiche la connectivité et les migrations\n\
             app:reset          Remet toute l'application à zéro\n\
             status             Affiche l'état du serveur et des modules\n\
             modules:commands   Liste les commandes CLI des modules installés\n\
             \n\
             COMMANDES MODULES (exemples)\n\
             \n\
             jarvis:models      Lister les modèles LLM disponibles\n\
             jarvis:providers   Afficher les fournisseurs LLM configurés\n\
             jarvis:agents      Lister les agents Jarvis\n\
             files:quota        Afficher les quotas de stockage\n\
             \n\
             Toute commande de la forme <module>:<cmd> est routée vers le binaire\n\
             kubuno-<module>. Utilisez `kubuno modules:commands` pour voir toutes\n\
             les commandes disponibles selon les modules installés.",
        )
        .subcommand_required(true)
        .arg_required_else_help(true)
        // ── db:backup ──
        .subcommand(
            Command::new("db:backup")
                .about("Sauvegarde la base de données PostgreSQL")
                .long_about(
                    "Exporte le schéma core en SQL clair via pg_dump.\n\
                     Nécessite que postgresql-client soit installé.",
                )
                .arg(
                    Arg::new("output")
                        .short('o')
                        .long("output")
                        .value_name("FICHIER")
                        .help("Fichier de sortie (défaut : kubuno_backup_YYYYMMDD_HHMMSS.sql)"),
                )
                .arg(
                    Arg::new("full")
                        .long("full")
                        .action(ArgAction::SetTrue)
                        .help("Sauvegarder toute la base (pas seulement le schéma core)"),
                ),
        )
        // ── db:restore ──
        .subcommand(
            Command::new("db:restore")
                .about("Restaure la base de données depuis une sauvegarde")
                .long_about(
                    "Importe un fichier SQL produit par db:backup via psql.\n\
                     Nécessite que postgresql-client soit installé.",
                )
                .arg(
                    Arg::new("file")
                        .required(true)
                        .value_name("FICHIER")
                        .help("Fichier de sauvegarde à restaurer (.sql)"),
                )
                .arg(
                    Arg::new("force")
                        .long("force")
                        .action(ArgAction::SetTrue)
                        .help("Ne pas demander de confirmation"),
                ),
        )
        // ── db:reset ──
        .subcommand(
            Command::new("db:reset")
                .about("Réinitialise la base de données (supprime et recrée le schéma core)")
                .long_about(
                    "Supprime le schéma core en CASCADE puis applique toutes\n\
                     les migrations depuis zéro. TOUTES LES DONNÉES SONT PERDUES.",
                )
                .arg(
                    Arg::new("force")
                        .long("force")
                        .action(ArgAction::SetTrue)
                        .help("Ne pas demander de confirmation (dangereux)"),
                ),
        )
        // ── db:migrate ──
        .subcommand(
            Command::new("db:migrate")
                .about("Applique les migrations SQL en attente"),
        )
        // ── db:status ──
        .subcommand(
            Command::new("db:status")
                .about("Affiche la connectivité et l'état des migrations"),
        )
        // ── app:reset ──
        .subcommand(
            Command::new("app:reset")
                .about("Remet TOUTE l'application à zéro")
                .long_about(
                    "Supprime TOUTES les données : schémas DB (core + tous les modules),\n\
                     historique de migrations et fichiers de stockage.\n\
                     Recrée ensuite le schéma core, les paramètres par défaut et le\n\
                     compte administrateur initial.\n\n\
                     Les modules relanceront automatiquement leurs propres migrations\n\
                     au prochain démarrage.\n\n\
                     CETTE OPÉRATION EST IRRÉVERSIBLE.",
                )
                .arg(
                    Arg::new("force")
                        .long("force")
                        .action(ArgAction::SetTrue)
                        .help("Ne pas demander de confirmation (dangereux)"),
                )
                .arg(
                    Arg::new("keep-files")
                        .long("keep-files")
                        .action(ArgAction::SetTrue)
                        .help("Conserver les fichiers de stockage (ne supprime que la DB)"),
                ),
        )
        // ── status ──
        .subcommand(
            Command::new("status")
                .about("Affiche l'état du serveur Kubuno"),
        )
        // ── modules:commands ──
        .subcommand(
            Command::new("modules:commands")
                .about("Liste les commandes CLI offertes par les modules installés"),
        )
        // Les commandes des modules (ex: files:upload, photos:sync…) sont routées
        // dynamiquement vers le binaire kubuno-<module>. Voir allow_external_subcommands.
        .allow_external_subcommands(true)
}

// ── Commandes ─────────────────────────────────────────────────────

async fn cmd_db_backup(args: &clap::ArgMatches) -> Result<()> {
    section("Sauvegarde de la base de données");
    println!();

    let settings = Settings::load().context("Chargement de la configuration")?;
    let conn = PgConn::from_settings(&settings.database)?;

    let output = args.get_one::<String>("output").cloned().unwrap_or_else(|| {
        let ts = chrono::Local::now().format("%Y%m%d_%H%M%S");
        format!("kubuno_backup_{ts}.sql")
    });

    info(&format!("Base    : {}", conn.db));
    info(&format!("Hôte    : {}:{}", conn.host, conn.port));
    info(&format!("Fichier : {output}"));
    println!();

    let mut pg_args = conn.pg_args();
    if !args.get_flag("full") {
        pg_args.extend(["--schema=core".into(), "-F".into(), "p".into()]);
    }
    pg_args.extend(["-f".into(), output.clone(), conn.db.clone()]);

    let status = Proc::new("pg_dump")
        .envs(conn.pg_env())
        .args(&pg_args)
        .status()
        .context("pg_dump introuvable — installez postgresql-client")?;

    if status.success() {
        ok(&format!("Sauvegarde créée : {output}"));
    } else {
        fail("pg_dump a échoué.");
        std::process::exit(1);
    }
    Ok(())
}

async fn cmd_db_restore(args: &clap::ArgMatches) -> Result<()> {
    section("Restauration de la base de données");
    println!();

    let file = args.get_one::<String>("file").unwrap();
    let force = args.get_flag("force");

    if !std::path::Path::new(file).exists() {
        fail(&format!("Fichier introuvable : {file}"));
        std::process::exit(1);
    }

    let settings = Settings::load().context("Chargement de la configuration")?;
    let conn = PgConn::from_settings(&settings.database)?;

    info(&format!("Base    : {}", conn.db));
    info(&format!("Hôte    : {}:{}", conn.host, conn.port));
    info(&format!("Fichier : {file}"));
    println!();

    if !force {
        warn("Cette opération va écraser les données existantes.");
        print!("Confirmer ? [y/N] ");
        io::stdout().flush().ok();
        let mut input = String::new();
        io::stdin().lock().read_line(&mut input).ok();
        if !matches!(input.trim().to_lowercase().as_str(), "y" | "yes" | "o" | "oui") {
            info("Opération annulée.");
            return Ok(());
        }
        println!();
    }

    let mut pg_args = conn.pg_args();
    pg_args.extend(["-d".into(), conn.db.clone(), "-f".into(), file.clone()]);

    let status = Proc::new("psql")
        .envs(conn.pg_env())
        .args(&pg_args)
        .status()
        .context("psql introuvable — installez postgresql-client")?;

    if status.success() {
        ok("Restauration terminée.");
    } else {
        fail("psql a échoué.");
        std::process::exit(1);
    }
    Ok(())
}

async fn cmd_db_reset(args: &clap::ArgMatches) -> Result<()> {
    section("Réinitialisation de la base de données");
    println!();

    let force = args.get_flag("force");

    if !force {
        warn(&format!("{RED}{BOLD}ATTENTION{RESET}{YELLOW} — Toutes les données seront SUPPRIMÉES DÉFINITIVEMENT.{RESET}"));
        print!("Tapez {BOLD}reset{RESET} pour confirmer : ");
        io::stdout().flush().ok();
        let mut input = String::new();
        io::stdin().lock().read_line(&mut input).ok();
        if input.trim() != "reset" {
            info("Opération annulée.");
            return Ok(());
        }
        println!();
    }

    let settings = Settings::load().context("Chargement de la configuration")?;
    let pool = create_pool(&settings.database)
        .await
        .context("Connexion à la base de données")?;

    info("Suppression du schéma core…");
    sqlx::query("DROP SCHEMA IF EXISTS core CASCADE")
        .execute(&pool)
        .await
        .context("Suppression du schéma core")?;
    ok("Schéma core supprimé.");

    // _sqlx_migrations est dans le schéma public — il survit au DROP SCHEMA core.
    // Sans ce DELETE, sqlx considère les migrations comme déjà appliquées et les saute,
    // laissant la base dans un état incohérent (core.users inexistante).
    sqlx::query("DELETE FROM _sqlx_migrations")
        .execute(&pool)
        .await
        .context("Réinitialisation de la table _sqlx_migrations")?;
    ok("Historique migrations réinitialisé.");

    info("Application des migrations…");
    migrations::run(&pool).await.context("Application des migrations")?;
    ok("Migrations appliquées.");

    info("Création du compte administrateur initial…");
    seed::ensure_default_admin(&pool).await.context("Seed compte admin")?;
    ok("Compte admin créé (username: admin / password: kubuno).");

    ok("Base de données réinitialisée.");

    Ok(())
}

async fn cmd_db_migrate() -> Result<()> {
    section("Application des migrations SQL");
    println!();

    let settings = Settings::load().context("Chargement de la configuration")?;
    let pool = create_pool(&settings.database)
        .await
        .context("Connexion à la base de données")?;

    migrations::run(&pool).await.context("Application des migrations")?;
    ok("Migrations appliquées.");
    Ok(())
}

async fn cmd_db_status() -> Result<()> {
    section("État de la base de données");
    println!();

    let settings = Settings::load().context("Chargement de la configuration")?;
    let conn = PgConn::from_settings(&settings.database)?;

    info(&format!("Hôte        : {}:{}", conn.host, conn.port));
    info(&format!("Base        : {}", conn.db));
    info(&format!("Utilisateur : {}", conn.user));
    println!();

    let pool = create_pool(&settings.database)
        .await
        .context("Connexion à la base de données")?;

    let (pg_version,): (String,) = sqlx::query_as("SELECT version()")
        .fetch_one(&pool)
        .await
        .context("Requête version PostgreSQL")?;
    ok(&format!("Connecté — {pg_version}"));

    let rows: Vec<(i64, String, bool)> = sqlx::query_as(
        "SELECT version, description, success FROM _sqlx_migrations ORDER BY version",
    )
    .fetch_all(&pool)
    .await
    .unwrap_or_default();

    println!();
    if rows.is_empty() {
        warn("Aucune migration appliquée.");
    } else {
        println!("  {BOLD}{:<8}  {:<50}  État{RESET}", "Version", "Description");
        println!("  {}", "─".repeat(70));
        for (ver, desc, applied) in &rows {
            let st = if *applied { format!("{GREEN}✓{RESET}") } else { format!("{RED}✗{RESET}") };
            println!("  {ver:<8}  {desc:<50}  {st}");
        }
    }
    Ok(())
}

async fn cmd_app_reset(args: &clap::ArgMatches) -> Result<()> {
    section("Réinitialisation complète de l'application");
    println!();

    let force      = args.get_flag("force");
    let keep_files = args.get_flag("keep-files");

    let settings = Settings::load().context("Chargement de la configuration")?;
    let pool     = create_pool(&settings.database)
        .await
        .context("Connexion à la base de données")?;

    // ── Découverte des schémas à supprimer ──────────────────────────────────
    let schemas: Vec<String> = sqlx::query_scalar(
        "SELECT nspname FROM pg_catalog.pg_namespace
         WHERE nspname NOT IN ('public', 'information_schema')
           AND nspname NOT LIKE 'pg_%'
         ORDER BY nspname",
    )
    .fetch_all(&pool)
    .await
    .context("Liste des schémas PostgreSQL")?;

    let storage_path = settings.storage.local_path().to_string();
    let temp_path    = settings.storage.temp_path().to_string();
    let is_local     = settings.storage.backend == StorageBackendType::Local;

    // ── Résumé de ce qui va être détruit ────────────────────────────────────
    warn(&format!(
        "{RED}{BOLD}ATTENTION — Cette opération va EFFACER DÉFINITIVEMENT :{RESET}"
    ));
    println!();

    if schemas.is_empty() {
        info("  • Aucun schéma applicatif trouvé en base de données");
    } else {
        info(&format!("  • Schémas PostgreSQL ({}) :", schemas.len()));
        for s in &schemas {
            info(&format!("      – {s}"));
        }
    }
    info("  • Historique des migrations (_sqlx_migrations)");

    if !keep_files {
        if is_local {
            info(&format!("  • Fichiers de stockage : {storage_path}"));
            info(&format!("  • Fichiers temporaires : {temp_path}"));
        } else {
            warn("  • Backend S3 détecté — les fichiers S3 ne seront PAS supprimés automatiquement.");
        }
    }

    println!();
    info("Après la réinitialisation :");
    info("  ✓ Schéma core recréé avec les paramètres par défaut");
    info("  ✓ Compte administrateur initial (admin / kubuno)");
    info("  ✓ Les modules relanceront leurs migrations au prochain démarrage");
    println!();

    // ── Confirmation ────────────────────────────────────────────────────────
    if !force {
        warn("Pour confirmer, tapez exactement : RESET KUBUNO");
        print!("Confirmation : ");
        io::stdout().flush().ok();
        let mut input = String::new();
        io::stdin().lock().read_line(&mut input).ok();
        if input.trim() != "RESET KUBUNO" {
            info("Opération annulée.");
            return Ok(());
        }
        println!();
    }

    // ── 1. Suppression des schémas ──────────────────────────────────────────
    if schemas.is_empty() {
        info("Aucun schéma à supprimer.");
    } else {
        for schema in &schemas {
            info(&format!("Suppression du schéma {schema}…"));
            sqlx::query(&format!("DROP SCHEMA IF EXISTS \"{schema}\" CASCADE"))
                .execute(&pool)
                .await
                .with_context(|| format!("Suppression du schéma {schema}"))?;
        }
        ok(&format!("{} schéma(s) supprimé(s).", schemas.len()));
    }

    // ── 2. Réinitialisation de l'historique des migrations ──────────────────
    info("Réinitialisation de _sqlx_migrations…");
    sqlx::query("DELETE FROM _sqlx_migrations")
        .execute(&pool)
        .await
        .context("Réinitialisation de _sqlx_migrations")?;
    ok("Historique des migrations réinitialisé.");

    // ── 3. Suppression des fichiers de stockage ─────────────────────────────
    if !keep_files && is_local {
        for path_str in &[&storage_path, &temp_path] {
            let p = std::path::Path::new(path_str);
            if !p.exists() {
                continue;
            }
            info(&format!("Suppression des fichiers dans {path_str}…"));
            // Supprimer le contenu sans supprimer le répertoire racine
            match std::fs::read_dir(p) {
                Ok(entries) => {
                    let mut deleted = 0u32;
                    for entry in entries.flatten() {
                        let ep = entry.path();
                        let res = if ep.is_dir() {
                            std::fs::remove_dir_all(&ep)
                        } else {
                            std::fs::remove_file(&ep)
                        };
                        match res {
                            Ok(_)  => deleted += 1,
                            Err(e) => warn(&format!("Impossible de supprimer {} : {e}", ep.display())),
                        }
                    }
                    ok(&format!("{deleted} entrée(s) supprimée(s) dans {path_str}"));
                }
                Err(e) => warn(&format!("Impossible de lire {path_str} : {e}")),
            }
        }
    } else if keep_files {
        info("Fichiers de stockage conservés (--keep-files).");
    }

    // ── 4. Recréation du schéma core et migrations ──────────────────────────
    info("Application des migrations core…");
    migrations::run(&pool).await.context("Application des migrations core")?;
    ok("Schéma core recréé avec les paramètres par défaut.");

    // ── 5. Compte administrateur initial ───────────────────────────────────
    info("Création du compte administrateur initial…");
    seed::ensure_default_admin(&pool).await.context("Seed compte admin")?;
    ok("Compte admin créé (username: admin  /  password: kubuno).");

    println!();
    ok(&format!("{GREEN}{BOLD}Réinitialisation terminée.{RESET}"));
    warn("Redémarrez kubuno-core et tous les modules pour finaliser.");

    Ok(())
}

async fn cmd_module_reset(module_id: &str, force: bool, keep_files: bool) -> Result<()> {
    section(&format!("Réinitialisation du module : {CYAN}{BOLD}{module_id}{RESET}"));
    println!();

    let settings = Settings::load().context("Chargement de la configuration")?;
    let pool = create_pool(&settings.database)
        .await
        .context("Connexion à la base de données")?;

    // Vérifier que le schéma existe
    let schema_exists: bool = sqlx::query_scalar(
        "SELECT EXISTS(SELECT 1 FROM pg_catalog.pg_namespace WHERE nspname = $1)",
    )
    .bind(module_id)
    .fetch_one(&pool)
    .await
    .unwrap_or(false);

    if !schema_exists {
        warn(&format!("Le schéma '{module_id}' n'existe pas — module déjà réinitialisé ou non installé."));
        return Ok(());
    }

    // Compter les tables pour informer l'utilisateur
    let table_count: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = $1",
    )
    .bind(module_id)
    .fetch_one(&pool)
    .await
    .unwrap_or(0);

    let storage_path = settings.storage.local_path().to_string();
    let is_local     = settings.storage.backend == StorageBackendType::Local;
    let module_storage = std::path::Path::new(&storage_path).join(module_id);
    let has_storage = is_local && module_storage.exists();

    // ── Résumé ──────────────────────────────────────────────────────────────
    warn(&format!("{RED}{BOLD}ATTENTION — Cette opération va EFFACER DÉFINITIVEMENT :{RESET}"));
    println!();
    info(&format!("  • Schéma PostgreSQL «{module_id}» ({table_count} table(s))"));
    info( "  • Historique des migrations du module");
    if !keep_files {
        if has_storage {
            info(&format!("  • Fichiers de stockage : {}", module_storage.display()));
        } else if !is_local {
            warn("  • Backend S3 détecté — les fichiers S3 ne seront PAS supprimés.");
        }
    }
    println!();
    info("Après la réinitialisation :");
    info(&format!("  ✓ Le module relancera ses migrations au prochain démarrage (systemctl restart kubuno-{module_id})"));
    println!();

    // ── Confirmation ────────────────────────────────────────────────────────
    if !force {
        let expected = format!("reset {module_id}");
        warn(&format!("Pour confirmer, tapez exactement : {BOLD}{expected}{RESET}"));
        print!("Confirmation : ");
        io::stdout().flush().ok();
        let mut input = String::new();
        io::stdin().lock().read_line(&mut input).ok();
        if input.trim() != expected {
            info("Opération annulée.");
            return Ok(());
        }
        println!();
    }

    // ── 1. Suppression du schéma ─────────────────────────────────────────────
    info(&format!("Suppression du schéma {module_id}…"));
    sqlx::query(&format!("DROP SCHEMA IF EXISTS \"{module_id}\" CASCADE"))
        .execute(&pool)
        .await
        .with_context(|| format!("Suppression du schéma {module_id}"))?;
    ok(&format!("Schéma {module_id} supprimé ({table_count} table(s))."));

    // ── 2. Suppression des fichiers de stockage ──────────────────────────────
    if !keep_files && has_storage {
        info(&format!("Suppression des fichiers dans {}…", module_storage.display()));
        let mut deleted = 0u32;
        match std::fs::read_dir(&module_storage) {
            Ok(entries) => {
                for entry in entries.flatten() {
                    let ep = entry.path();
                    let res = if ep.is_dir() { std::fs::remove_dir_all(&ep) } else { std::fs::remove_file(&ep) };
                    match res {
                        Ok(_)  => deleted += 1,
                        Err(e) => warn(&format!("Impossible de supprimer {} : {e}", ep.display())),
                    }
                }
                ok(&format!("{deleted} entrée(s) supprimée(s) dans {}", module_storage.display()));
            }
            Err(e) => warn(&format!("Lecture du dossier impossible : {e}")),
        }
    } else if keep_files {
        info("Fichiers de stockage conservés (--keep-files).");
    }

    println!();
    ok(&format!("{GREEN}{BOLD}Module {module_id} réinitialisé avec succès.{RESET}"));
    warn(&format!("Redémarrez le module : {BOLD}systemctl restart kubuno-{module_id}{RESET}"));

    Ok(())
}

/// Affiche les commandes CLI enregistrées par les modules (depuis la DB).
async fn cmd_modules_commands() -> Result<()> {
    section("Commandes CLI des modules installés");
    println!();

    let settings = Settings::load().context("Chargement de la configuration")?;
    let pool = create_pool(&settings.database)
        .await
        .context("Connexion à la base de données")?;

    // Modules actifs avec leurs commandes CLI
    let rows: Vec<(String, String, serde_json::Value)> = sqlx::query_as(
        r#"SELECT id, display_name, cli_commands
           FROM core.modules
           WHERE is_enabled = TRUE AND cli_commands != '[]'::jsonb
           ORDER BY id"#,
    )
    .fetch_all(&pool)
    .await
    .unwrap_or_default();

    if rows.is_empty() {
        info("Aucun module installé n'offre de commandes CLI.");
        info("Les modules déclarent leurs commandes dans module.toml [cli_commands].");
        return Ok(());
    }

    for (module_id, display_name, cmds) in rows {
        println!("  {BOLD}{display_name}{RESET} ({CYAN}{module_id}{RESET})");
        if let Some(arr) = cmds.as_array() {
            for cmd in arr {
                let name  = cmd["name"].as_str().unwrap_or("?");
                let desc  = cmd["description"].as_str().unwrap_or("");
                let usage = cmd["usage"].as_str().unwrap_or(name);
                println!("    {BOLD}{YELLOW}{name}{RESET}");
                if !desc.is_empty()  { println!("      {desc}"); }
                if !usage.is_empty() { println!("      Usage: {CYAN}{usage}{RESET}"); }
            }
        }
        println!();
    }

    info("Lancez n'importe laquelle avec : kubuno <module>:<commande> [args]");
    Ok(())
}

/// Dispatch d'une commande de module : kubuno files:upload → kubuno-files files:upload
/// Recherche le binaire dans (par ordre) :
///   1. Même dossier que l'exécutable `kubuno`
///   2. PATH
async fn cmd_module_dispatch(full_cmd: &str, extra_args: &[String]) -> Result<()> {
    let module_id = full_cmd
        .split(':')
        .next()
        .context("Commande invalide (format attendu: module:commande)")?;

    let binary_name = format!("kubuno-{module_id}");

    // Recherche 1 : même dossier que le binaire kubuno
    let binary = if let Ok(exe) = std::env::current_exe() {
        let sibling = exe.parent().map(|p| p.join(&binary_name));
        sibling.filter(|p| p.exists()).unwrap_or_else(|| std::path::PathBuf::from(&binary_name))
    } else {
        std::path::PathBuf::from(&binary_name)
    };

    // Construction des args : kubuno-files files:upload [extra_args]
    let mut args = vec![full_cmd.to_string()];
    args.extend_from_slice(extra_args);

    let status = Proc::new(&binary)
        .args(&args)
        .status()
        .with_context(|| {
            format!(
                "Binaire '{binary_name}' introuvable.\n\
                 Vérifiez que le module '{module_id}' est installé\n\
                 et que '{binary_name}' est dans le PATH ou à côté de 'kubuno'."
            )
        })?;

    if !status.success() {
        std::process::exit(status.code().unwrap_or(1));
    }
    Ok(())
}

async fn cmd_status() -> Result<()> {
    section("État du serveur Kubuno");
    println!();

    info(&format!("Version : {}", env!("CARGO_PKG_VERSION")));

    let settings = Settings::load().ok();
    let port = settings.as_ref().map(|s| s.server.port).unwrap_or(8080);

    match reqwest::get(format!("http://127.0.0.1:{port}/health")).await {
        Ok(resp) if resp.status().is_success() => {
            ok(&format!("Serveur actif sur le port {port}"));
            if let Ok(body) = resp.text().await {
                info(&format!("Réponse : {body}"));
            }
        }
        Ok(resp) => warn(&format!("Serveur répond HTTP {}", resp.status())),
        Err(_)   => fail(&format!("Serveur injoignable sur le port {port}")),
    }
    Ok(())
}

// ── Entrypoint ────────────────────────────────────────────────────

#[tokio::main]
async fn main() -> Result<()> {
    // Charger .env si présent (développement / Docker) — optionnel
    let _ = dotenvy::dotenv();

    header();

    let matches = cli().get_matches();

    let result = match matches.subcommand() {
        Some(("db:backup",        sub)) => cmd_db_backup(sub).await,
        Some(("db:restore",       sub)) => cmd_db_restore(sub).await,
        Some(("db:reset",         sub)) => cmd_db_reset(sub).await,
        Some(("db:migrate",       _))   => cmd_db_migrate().await,
        Some(("db:status",        _))   => cmd_db_status().await,
        Some(("app:reset",        sub)) => cmd_app_reset(sub).await,
        Some(("status",           _))   => cmd_status().await,
        Some(("modules:commands", _))   => cmd_modules_commands().await,
        // Réinitialisation d'un module : kubuno <module>:reset [--force] [--keep-files]
        // Intercepté avant le dispatch externe pour être géré par le core.
        Some((ext_cmd, sub)) if ext_cmd.ends_with(":reset") => {
            let module_id = ext_cmd.trim_end_matches(":reset");
            let extra: Vec<String> = sub
                .get_many::<OsString>("")
                .into_iter()
                .flatten()
                .map(|s| s.to_string_lossy().into_owned())
                .collect();
            let force      = extra.iter().any(|a| a == "--force");
            let keep_files = extra.iter().any(|a| a == "--keep-files");
            cmd_module_reset(module_id, force, keep_files).await
        }
        // Dispatch dynamique : kubuno <module>:<cmd> [args] → kubuno-<module> <module>:<cmd> [args]
        Some((ext_cmd, sub)) if ext_cmd.contains(':') => {
            let extra: Vec<String> = sub
                .get_many::<OsString>("")
                .into_iter()
                .flatten()
                .map(|s| s.to_string_lossy().into_owned())
                .collect();
            cmd_module_dispatch(ext_cmd, &extra).await
        }
        _ => unreachable!(),
    };

    if let Err(e) = result {
        fail(&format!("{e:#}"));
        std::process::exit(1);
    }

    Ok(())
}

// ── Tests unitaires ───────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_from_settings_individual_fields() {
        use kubuno_core::config::settings::DatabaseSettings;
        use std::time::Duration;
        let cfg = DatabaseSettings {
            url:             None,
            host:            Some("dbhost".to_string()),
            port:            Some(5433),
            user:            Some("alice".to_string()),
            password:        Some("s3cr3t".to_string()),
            database:        Some("mydb".to_string()),
            max_connections: 20,
            min_connections: 2,
            connect_timeout: Duration::from_secs(10),
            run_migrations:  false,
        };
        let conn = PgConn::from_settings(&cfg).unwrap();
        assert_eq!(conn.user, "alice");
        assert_eq!(conn.password, "s3cr3t");
        assert_eq!(conn.host, "dbhost");
        assert_eq!(conn.port, "5433");
        assert_eq!(conn.db, "mydb");
    }

    #[test]
    fn test_from_settings_with_url_fallback() {
        use kubuno_core::config::settings::DatabaseSettings;
        use std::time::Duration;
        let cfg = DatabaseSettings {
            url:             Some("postgres://u:p%23q@host:5432/db".to_string()),
            host:            None,
            port:            None,
            user:            None,
            password:        None,
            database:        None,
            max_connections: 5,
            min_connections: 1,
            connect_timeout: Duration::from_secs(5),
            run_migrations:  false,
        };
        let conn = PgConn::from_settings(&cfg).unwrap();
        assert_eq!(conn.user, "u");
        assert_eq!(conn.password, "p#q");
        assert_eq!(conn.db, "db");
    }

    #[test]
    fn test_parse_pg_url_standard() {
        let conn = PgConn::from_url("postgres://kubuno:secret@localhost:5432/kubuno").unwrap();
        assert_eq!(conn.user, "kubuno");
        assert_eq!(conn.password, "secret");
        assert_eq!(conn.host, "localhost");
        assert_eq!(conn.port, "5432");
        assert_eq!(conn.db, "kubuno");
    }

    #[test]
    fn test_parse_pg_url_encoded_password() {
        // '#' encodé en %23, '@' en %40
        let conn = PgConn::from_url(
            "postgres://kubuno:XsPVF%23xZsTC%40LyP52Zv0@localhost:5432/kubuno"
        ).unwrap();
        assert_eq!(conn.password, "XsPVF#xZsTC@LyP52Zv0");
        assert_eq!(conn.user, "kubuno");
        assert_eq!(conn.db, "kubuno");
    }

    #[test]
    fn test_parse_pg_url_default_port() {
        let conn = PgConn::from_url("postgres://user:pass@db.example.com/mydb").unwrap();
        assert_eq!(conn.port, "5432");
        assert_eq!(conn.host, "db.example.com");
        assert_eq!(conn.db, "mydb");
    }

    #[test]
    fn test_parse_pg_url_postgresql_scheme() {
        let conn = PgConn::from_url("postgresql://admin:pw@127.0.0.1:5433/testdb").unwrap();
        assert_eq!(conn.user, "admin");
        assert_eq!(conn.port, "5433");
        assert_eq!(conn.db, "testdb");
    }

    #[test]
    fn test_parse_pg_url_missing_at_fails() {
        assert!(PgConn::from_url("postgres://kubuno:secret-localhost:5432/kubuno").is_err());
    }

    #[test]
    fn test_parse_pg_url_missing_slash_fails() {
        assert!(PgConn::from_url("postgres://kubuno:secret@localhost:5432kubuno").is_err());
    }

    #[test]
    fn test_pg_args_format() {
        let conn = PgConn::from_url("postgres://u:p@myhost:5433/mydb").unwrap();
        let args = conn.pg_args();
        assert_eq!(args, vec!["-h", "myhost", "-p", "5433", "-U", "u"]);
    }

    #[test]
    fn test_cli_subcommands_exist() {
        let app = cli();
        let subcmds: Vec<&str> = app.get_subcommands().map(|c| c.get_name()).collect();
        assert!(subcmds.contains(&"db:backup"));
        assert!(subcmds.contains(&"db:restore"));
        assert!(subcmds.contains(&"db:reset"));
        assert!(subcmds.contains(&"db:migrate"));
        assert!(subcmds.contains(&"db:status"));
        assert!(subcmds.contains(&"app:reset"));
        assert!(subcmds.contains(&"status"));
    }

    #[test]
    fn test_cli_app_reset_flags() {
        let m = cli()
            .try_get_matches_from(["kubuno", "app:reset", "--force", "--keep-files"])
            .unwrap();
        let sub = m.subcommand_matches("app:reset").unwrap();
        assert!(sub.get_flag("force"));
        assert!(sub.get_flag("keep-files"));
    }

    #[test]
    fn test_cli_app_reset_no_flags() {
        // La commande doit être valide sans arguments
        assert!(cli()
            .try_get_matches_from(["kubuno", "app:reset"])
            .is_ok());
    }

    #[test]
    fn test_cli_db_backup_output_arg() {
        let m = cli()
            .try_get_matches_from(["kubuno", "db:backup", "-o", "/tmp/test.sql"])
            .unwrap();
        let sub = m.subcommand_matches("db:backup").unwrap();
        assert_eq!(sub.get_one::<String>("output").unwrap(), "/tmp/test.sql");
    }

    #[test]
    fn test_cli_db_restore_requires_file() {
        // Sans fichier → erreur
        assert!(cli()
            .try_get_matches_from(["kubuno", "db:restore"])
            .is_err());
    }

    #[test]
    fn test_cli_db_reset_force_flag() {
        let m = cli()
            .try_get_matches_from(["kubuno", "db:reset", "--force"])
            .unwrap();
        let sub = m.subcommand_matches("db:reset").unwrap();
        assert!(sub.get_flag("force"));
    }

    #[test]
    fn test_cli_module_reset_captured_as_external() {
        // files:reset doit être capturé comme sous-commande externe (allow_external_subcommands)
        let m = cli()
            .try_get_matches_from(["kubuno", "files:reset", "--force"])
            .unwrap();
        let (name, sub) = m.subcommand().unwrap();
        assert_eq!(name, "files:reset");
        let extra: Vec<String> = sub
            .get_many::<OsString>("")
            .into_iter()
            .flatten()
            .map(|s| s.to_string_lossy().into_owned())
            .collect();
        assert!(extra.contains(&"--force".to_string()));
    }

    #[test]
    fn test_cli_external_subcommand_dispatch() {
        // Vérifie que files:upload + ses args sont capturés en OsString sans panic
        let m = cli()
            .try_get_matches_from(["kubuno", "files:upload", "mon_fichier.pdf", "--token", "kubuno_xxx"])
            .unwrap();
        let (name, sub) = m.subcommand().unwrap();
        assert_eq!(name, "files:upload");
        let extra: Vec<String> = sub
            .get_many::<OsString>("")
            .into_iter()
            .flatten()
            .map(|s| s.to_string_lossy().into_owned())
            .collect();
        assert_eq!(extra, vec!["mon_fichier.pdf", "--token", "kubuno_xxx"]);
    }
}
