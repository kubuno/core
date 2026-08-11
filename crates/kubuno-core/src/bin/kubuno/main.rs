//! `kubuno` — console d'administration de la plateforme.
//!
//! Ce fichier ne contient que l'entrypoint et le routage des sous-commandes ;
//! chaque responsabilité vit dans son propre module :
//!   - [`display`] : rendu console (couleurs, statuts, confirmations)
//!   - [`pgconn`]  : parsing de la configuration PostgreSQL
//!   - [`cli`]     : définition clap de la ligne de commande
//!   - [`db`]      : commandes `db:*`
//!   - [`reset`]   : `app:reset` et `<module>:reset`
//!   - [`auth`]    : `auth:recover` — voie de secours locale (jamais exposée par HTTP)
//!   - [`modules`] : commandes des modules, dispatch et `status`

use anyhow::Result;

mod auth;
mod cli;
mod db;
mod display;
mod modules;
mod pgconn;
mod reset;

use cli::external_args;
use display::{fail, header};

#[tokio::main]
async fn main() -> Result<()> {
    // Charger .env si présent (développement / Docker) — optionnel
    let _ = dotenvy::dotenv();

    header();

    let matches = cli::cli().get_matches();

    let result = match matches.subcommand() {
        Some(("db:backup",        sub)) => db::cmd_db_backup(sub).await,
        Some(("db:restore",       sub)) => db::cmd_db_restore(sub).await,
        Some(("db:reset",         sub)) => db::cmd_db_reset(sub).await,
        Some(("db:migrate",       _))   => db::cmd_db_migrate().await,
        Some(("db:status",        _))   => db::cmd_db_status().await,
        Some(("app:reset",        sub)) => reset::cmd_app_reset(sub).await,
        Some(("auth:recover",     sub)) => auth::cmd_auth_recover(sub).await,
        Some(("status",           _))   => modules::cmd_status().await,
        Some(("modules:commands", _))   => modules::cmd_modules_commands().await,
        // Réinitialisation d'un module : kubuno <module>:reset [--force] [--keep-files]
        // Intercepté avant le dispatch externe pour être géré par le core.
        Some((ext_cmd, sub)) if ext_cmd.ends_with(":reset") => {
            let module_id  = ext_cmd.trim_end_matches(":reset");
            let extra      = external_args(sub);
            let force      = extra.iter().any(|a| a == "--force");
            let keep_files = extra.iter().any(|a| a == "--keep-files");
            reset::cmd_module_reset(module_id, force, keep_files).await
        }
        // Dispatch dynamique : kubuno <module>:<cmd> [args] → kubuno-<module> <module>:<cmd> [args]
        Some((ext_cmd, sub)) if ext_cmd.contains(':') => {
            modules::cmd_module_dispatch(ext_cmd, &external_args(sub)).await
        }
        _ => unreachable!(),
    };

    if let Err(e) = result {
        fail(&format!("{e:#}"));
        std::process::exit(1);
    }

    Ok(())
}
