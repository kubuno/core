//! Commandes liées aux modules : découverte de leurs commandes CLI, dispatch vers
//! leur binaire, et état du serveur.

use anyhow::{Context, Result};
use kubuno_core::{config::Settings, database::pool::create_pool};
use std::process::Command as Proc;

use crate::display::*;

/// Affiche les commandes CLI enregistrées par les modules (depuis la DB).
pub async fn cmd_modules_commands() -> Result<()> {
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
pub async fn cmd_module_dispatch(full_cmd: &str, extra_args: &[String]) -> Result<()> {
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

pub async fn cmd_status() -> Result<()> {
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

/// `kubuno modules:install <fichier.kbpkg>` — install a module from a local package.
/// Delegates to `marketplace::install_local` (extract + verify + relocate into the
/// store). Does not start the module: the core loads it on its next launch.
pub async fn cmd_modules_install(sub: &clap::ArgMatches) -> Result<()> {
    let file = sub
        .get_one::<String>("file")
        .expect("clap garantit l'argument « file »");
    let path = std::path::PathBuf::from(file);

    section("Installation d'un module depuis un paquet local");
    println!();
    info(&format!("Paquet : {}", path.display()));

    let settings = Settings::load().context("Chargement de la configuration")?;
    let report = kubuno_core::modules::marketplace::install_local(&settings, &path)
        .await
        .map_err(|e| anyhow::anyhow!("Installation impossible : {e}"))?;

    println!();
    ok(&format!(
        "Module « {} » installé (version {})",
        report.name, report.version
    ));
    info(&format!("Identifiant : {}", report.id));
    info(&format!("Emplacement : {}", report.path));
    if !report.dependencies.is_empty() {
        info(&format!(
            "Dépendances déclarées : {}",
            report.dependencies.join(", ")
        ));
    }
    println!();
    warn("Le module sera démarré au prochain lancement du core.");
    info("Pour l'activer maintenant : systemctl restart kubuno");
    Ok(())
}

/// `kubuno modules:list` — list the modules present in the writable store.
pub async fn cmd_modules_list() -> Result<()> {
    section("Modules installés dans le store");
    println!();

    let settings = Settings::load().context("Chargement de la configuration")?;
    let store = std::path::PathBuf::from(&settings.server.modules_install_dir);

    let mut dirs: Vec<std::path::PathBuf> = match std::fs::read_dir(&store) {
        Ok(entries) => entries
            .flatten()
            .map(|e| e.path())
            .filter(|p| p.is_dir() && p.join("module.toml").is_file())
            .collect(),
        Err(_) => Vec::new(),
    };
    dirs.sort();

    if dirs.is_empty() {
        info(&format!("Aucun module dans le store ({}).", store.display()));
        info("Installez-en un : kubuno modules:install <fichier.kbpkg>");
        return Ok(());
    }

    for dir in &dirs {
        let id = dir
            .file_name()
            .and_then(|s| s.to_str())
            .unwrap_or("?");
        let version = read_module_version(dir).unwrap_or_else(|| "?".to_string());
        println!("  {GREEN}●{RESET} {BOLD}{id}{RESET}  {CYAN}{version}{RESET}");
    }
    Ok(())
}

/// Read `[module].version` from a module.toml without deserialising the whole
/// manifest — enough for a listing.
fn read_module_version(dir: &std::path::Path) -> Option<String> {
    let content = std::fs::read_to_string(dir.join("module.toml")).ok()?;
    for line in content.lines() {
        let l = line.trim();
        if let Some(rest) = l.strip_prefix("version") {
            if let Some(val) = rest.trim_start().strip_prefix('=') {
                return Some(val.trim().trim_matches('"').to_string());
            }
        }
    }
    None
}
