//! `auth:recover` — restoring access to an account from the machine itself.
//!
//! ## Why this exists, and why it is only here
//!
//! Making the second factor mandatory creates a failure mode with no remedy over
//! the network: the administrator's phone is gone, their backup codes are in the
//! drawer of an office they cannot reach, and every route that could help is
//! behind the very factor they have lost. Without a way in from the console, the
//! instance is bricked.
//!
//! Since the authentication method became an administrator's per-unit decision
//! (`crate::auth::methods`), there is a **second** such failure mode, and
//! `--local-access` is its remedy: somebody narrows a unit to `["directory"]`,
//! turns the administrative fallback off, and the directory then becomes
//! unreachable. Every web route that could fix it is behind the very method that
//! stopped working. The console is the way back, and it works precisely because
//! it does not authenticate anybody — it writes `auth.methods` at the **account**
//! scope, the most specific one, ignoring any lock a level above may hold.
//!
//! ## Why it is safe to trust the console
//!
//! Reaching this command means holding a shell on the server, with read access to
//! the configuration file that contains the database credentials and the JWT
//! signing secret. Anyone in that position can already rewrite `core.users`
//! directly. This command does not widen that authority — it narrows it, by
//! offering the *supported* way to do it and by leaving a trace.
//!
//! ## What it must never become
//!
//! **This is never exposed over HTTP.** No route, no `/internal/*` endpoint, no
//! flag that turns it into one. Its entire security argument is physical (or
//! shell) access to the host; a network-reachable equivalent would be a
//! second-factor bypass with a URL.
//!
//! Every run writes an audit entry with `actor_origin = 'system'`, which is what
//! `core.admin_audit` already uses for work no human triggered through the API.
//! A recovery that left no trace would be indistinguishable from tampering.

use anyhow::{Context, Result};
use kubuno_core::{
    audit::{redact::target, AuditContext, AuditEntry},
    auth::backup_codes,
    config::Settings,
    database::pool::create_pool,
};
use sqlx::PgPool;
use uuid::Uuid;

use crate::display::*;

/// Label the trail shows for a recovery performed from the console.
const SYSTEM_ACTOR: &str = "kubuno CLI (accès local à la machine)";

struct Account {
    id: Uuid,
    email: String,
    username: String,
    role: String,
    totp_enabled: bool,
    has_password: bool,
}

async fn find_account(db: &PgPool, needle: &str) -> Result<Account> {
    let row: Option<(Uuid, String, String, String, bool, bool)> = sqlx::query_as(
        "SELECT id, email, username, role, totp_enabled, (password_hash IS NOT NULL)
           FROM core.users
          WHERE email = $1 OR username = $1",
    )
    .bind(needle)
    .fetch_optional(db)
    .await
    .context("Recherche du compte")?;

    let (id, email, username, role, totp_enabled, has_password) =
        row.with_context(|| format!("Aucun compte pour « {needle} »"))?;

    Ok(Account { id, email, username, role, totp_enabled, has_password })
}

/// Reads a password from the console, twice.
///
/// Echo is **not** suppressed: doing it portably needs a terminal crate, and the
/// whole security argument of this command is that whoever runs it already holds
/// a shell on the host. Saying so is more honest than implying secrecy the
/// implementation does not provide.
fn read_new_password() -> Result<String> {
    use std::io::Write;
    warn("La saisie est visible à l'écran (aucun masquage) — vous êtes déjà sur la machine.");
    loop {
        print!("    Nouveau mot de passe : ");
        std::io::stdout().flush().ok();
        let mut first = String::new();
        std::io::stdin().read_line(&mut first).context("Lecture du mot de passe")?;
        print!("    Confirmer            : ");
        std::io::stdout().flush().ok();
        let mut again = String::new();
        std::io::stdin().read_line(&mut again).context("Lecture du mot de passe")?;

        let first = first.trim_end_matches(['\n', '\r']).to_string();
        let again = again.trim_end_matches(['\n', '\r']).to_string();
        if first != again {
            fail("Les deux saisies diffèrent.");
            continue;
        }
        if first.chars().count() < 8 {
            fail("8 caractères minimum.");
            continue;
        }
        return Ok(first);
    }
}

pub async fn cmd_auth_recover(args: &clap::ArgMatches) -> Result<()> {
    section("Rétablissement de l'accès à un compte");
    println!();

    let needle = match args.get_one::<String>("account") {
        Some(a) => a.clone(),
        // `account` is required by clap; this arm is unreachable in practice.
        None => {
            fail("Compte manquant.");
            std::process::exit(1);
        }
    };

    let disable_2fa = args.get_flag("disable-2fa");
    let new_codes = args.get_flag("backup-codes");
    let grace_days = args.get_one::<String>("grace-days").and_then(|v| v.parse::<i64>().ok());
    let local_access = args.get_flag("local-access");
    let set_password = args.get_flag("set-password");
    let force = args.get_flag("force");

    // No flag at all means "get me back in": that is what an operator locked out
    // at 3 a.m. types, and guessing wrong in the cautious direction (doing
    // nothing) would send them to a raw SQL prompt.
    let disable_2fa = disable_2fa
        || (!new_codes && grace_days.is_none() && !local_access && !set_password);

    let settings = Settings::load().context("Chargement de la configuration")?;
    let db = create_pool(&settings.database)
        .await
        .context("Connexion à la base de données")?;

    let account = find_account(&db, &needle).await?;

    info(&format!("Compte       : {} <{}>", account.username, account.email));
    info(&format!("Rôle         : {}", account.role));
    info(&format!(
        "Second facteur : {}",
        if account.totp_enabled { "activé" } else { "désactivé" }
    ));
    println!();

    let mut planned: Vec<String> = Vec::new();
    if disable_2fa {
        planned.push("désactiver la double authentification (et supprimer les codes de secours)".into());
    }
    if new_codes {
        planned.push("générer un nouveau lot de codes de secours".into());
    }
    if let Some(days) = grace_days {
        planned.push(format!("reporter le délai de grâce administrateur de {days} jour(s)"));
    }
    if local_access {
        planned.push(
            "rouvrir le mot de passe local pour ce compte (auth.methods = [\"local\"] à la portée « compte »)"
                .into(),
        );
    }
    if set_password {
        planned.push("définir un nouveau mot de passe local".into());
    }

    for p in &planned {
        warn(p);
    }
    println!();

    if !force && !confirm_yes_no("Confirmer ? [y/N] ") {
        info("Annulé.");
        return Ok(());
    }

    let mut done: Vec<String> = Vec::new();

    if disable_2fa {
        sqlx::query(
            "UPDATE core.users
                SET totp_enabled = FALSE, totp_secret = NULL, totp_pending_secret = NULL
              WHERE id = $1",
        )
        .bind(account.id)
        .execute(&db)
        .await
        .context("Désactivation du second facteur")?;

        let dropped = backup_codes::clear(&db, account.id)
            .await
            .map_err(|e| anyhow::anyhow!("Suppression des codes de secours : {e}"))?;

        // Sessions and step-up grants belong to the compromised-or-lost state we
        // are recovering from; leaving them alive would defeat the point.
        sqlx::query(
            "UPDATE core.refresh_tokens
                SET revoked_at = NOW(), revoke_reason = 'admin'
              WHERE user_id = $1 AND revoked_at IS NULL",
        )
        .bind(account.id)
        .execute(&db)
        .await
        .context("Révocation des sessions")?;

        sqlx::query("DELETE FROM core.reauth_grants WHERE user_id = $1")
            .bind(account.id)
            .execute(&db)
            .await
            .context("Révocation des réauthentifications")?;

        ok("Double authentification désactivée, sessions révoquées.");
        done.push(format!("2FA désactivée, {dropped} code(s) de secours supprimé(s), sessions révoquées"));
    }

    if new_codes {
        if disable_2fa {
            warn("Codes de secours ignorés : le second facteur vient d'être désactivé.");
        } else {
            let codes = backup_codes::replace_all(&db, account.id)
                .await
                .map_err(|e| anyhow::anyhow!("Génération des codes de secours : {e}"))?;
            println!();
            section("Nouveaux codes de secours — notez-les maintenant, ils ne seront plus affichés");
            for code in &codes {
                println!("    {BOLD}{code}{RESET}");
            }
            println!();
            done.push(format!("{} codes de secours régénérés", codes.len()));
        }
    }

    if let Some(days) = grace_days {
        let days = days.clamp(0, 365);
        sqlx::query(
            "UPDATE core.users SET admin_2fa_grace_until = NOW() + ($2 || ' days')::interval
              WHERE id = $1",
        )
        .bind(account.id)
        .bind(days.to_string())
        .execute(&db)
        .await
        .context("Report du délai de grâce")?;
        ok(&format!("Délai de grâce administrateur reporté de {days} jour(s)."));
        done.push(format!("délai de grâce administrateur reporté de {days} jour(s)"));
    }

    if local_access {
        // A lock is the one thing an account-scope row does NOT beat: the
        // resolver gives the most *general* locked level the win, which is the
        // whole point of locking (`settings::chain::winner`). A unit locked to
        // `["directory"]` is therefore one of the ways an instance gets shut
        // out, and the recovery has to undo it. Locks on this one key are
        // cleared — loudly, and counted in the audit entry — before the
        // account-scope row is written.
        let unlocked = sqlx::query(
            "UPDATE core.setting_values SET locked = FALSE WHERE key = $1 AND locked = TRUE",
        )
        .bind(kubuno_core::auth::methods::KEY_METHODS)
        .execute(&db)
        .await
        .context("Levée des verrous sur la politique d'authentification")?
        .rows_affected();
        if unlocked > 0 {
            warn(&format!(
                "{unlocked} verrou(x) levé(s) sur « {} » — sans quoi la portée « compte » n'aurait pas primé.",
                kubuno_core::auth::methods::KEY_METHODS
            ));
            done.push(format!("{unlocked} verrou(x) levé(s) sur la politique d'authentification"));
        }

        // Written straight to `core.setting_values` at the ACCOUNT scope rather
        // than through `settings::store::set_value`, which refuses to write
        // underneath a lock. The account scope is the most specific level of
        // `core.setting_chain`, so this row now wins whatever the unit, the
        // group or the instance say.
        sqlx::query(
            r#"INSERT INTO core.setting_values (key, scope_type, scope_id, value, updated_at)
               VALUES ($1, 'user', $2, $3, NOW())
               ON CONFLICT (key, scope_type, scope_id) DO UPDATE
                   SET value = EXCLUDED.value, updated_at = NOW(), locked = FALSE"#,
        )
        .bind(kubuno_core::auth::methods::KEY_METHODS)
        .bind(account.id)
        .bind(serde_json::json!(["local"]))
        .execute(&db)
        .await
        .context("Réouverture du mot de passe local")?;

        ok("Mot de passe local rouvert pour ce compte (portée « compte », prioritaire sur l'unité).");
        info("Retirez cette exception depuis Administration → Sécurité → Authentification et SSO,");
        info("portée « compte », bouton « Rétablir », une fois l'accès normal revenu.");
        done.push("mot de passe local rouvert à la portée « compte »".into());
    }

    if set_password {
        if !account.has_password {
            info("Ce compte n'avait aucun mot de passe local (il était gouverné par un annuaire ou un fournisseur).");
        }
        let plain = read_new_password()?;
        let hash = kubuno_core::crypto::password::hash_password(&plain)
            .map_err(|e| anyhow::anyhow!("Hachage du mot de passe : {e}"))?;
        sqlx::query(
            // `password_changed_at` is stamped here too: the console recovery
            // path deliberately bypasses the instance password policy — it is
            // the escape hatch used when the policy itself is what locked
            // everybody out — but the account must not come back carrying a
            // date that makes it look permanently expired.
            "UPDATE core.users \
                SET password_hash = $2, must_change_password = TRUE, password_changed_at = NOW() \
              WHERE id = $1",
        )
        .bind(account.id)
        .bind(&hash)
        .execute(&db)
        .await
        .context("Écriture du mot de passe")?;
        ok("Mot de passe local défini (changement demandé à la première connexion).");
        // The value never appears — not in the trail, not in the log, not here.
        done.push("mot de passe local défini".into());
    }

    // The trail entry names the operation and the account, never a code or a
    // secret. `actor_origin = 'system'`: nobody signed in to do this.
    let ctx = AuditContext::system(SYSTEM_ACTOR);
    ctx.record(
        &db,
        AuditEntry::new("core.auth.recovery.cli")
            .module("core")
            .target(target::USER, account.id, format!("{} <{}>", account.username, account.email))
            .detail(if done.is_empty() { "aucune action".to_string() } else { done.join(" ; ") }),
    )
    .await;

    println!();
    ok("Entrée d'audit écrite (origine « système »).");
    Ok(())
}
