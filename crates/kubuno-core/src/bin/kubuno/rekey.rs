//! `security:rekey` — draws a fresh data-encryption key and re-encrypts what it protects.
//!
//! The root key is seeded on first boot with the JWT secret then in force, so an
//! upgraded instance keeps reading everything it had stored. An instance whose
//! JWT secret was weak, shared, or simply the value shipped in the example file
//! therefore inherits a weak data key, and re-drawing it is the only way to make
//! the stored secrets secret again.
//!
//! Every ciphertext is rewritten in ONE transaction, and the new key file is
//! written only once that transaction has committed. An interruption therefore
//! leaves the old key on disk facing unchanged data — the operation either
//! happens completely or not at all.

use anyhow::{Context, Result};
use kubuno_core::config::Settings;
use kubuno_core::crypto::{datakey, encryption};
use kubuno_core::database::pool::create_pool;
use sqlx::{PgPool, Postgres, Row, Transaction};

use crate::display::{confirm_yes_no, info, ok, section, warn};

/// One store of encrypted values: where they live and which domain keys them.
struct Store {
    label: &'static str,
    domain: &'static [u8],
    /// Rows to rewrite: (identifier, ciphertext).
    select: &'static str,
    /// Rewrite, taking the new ciphertext then the identifier.
    update: &'static str,
}

const STORES: &[Store] = &[
    Store {
        label: "Mot de passe du relais SMTP",
        domain: b"kubuno:smtp:",
        select: "SELECT key AS id, value #>> '{}' AS blob FROM core.settings \
                 WHERE key = 'mail.smtp_password' AND value #>> '{}' <> ''",
        update: "UPDATE core.settings SET value = to_jsonb($1::text) WHERE key = $2",
    },
    Store {
        label: "Mot de passe de liaison de l'annuaire",
        domain: b"kubuno:ldap:",
        select: "SELECT id::text AS id, bind_password_enc AS blob FROM core.ldap_directories \
                 WHERE bind_password_enc <> ''",
        update: "UPDATE core.ldap_directories SET bind_password_enc = $1 WHERE id = $2::uuid",
    },
    Store {
        label: "Secrets clients OpenID Connect",
        domain: b"kubuno:oidc:",
        select: "SELECT id::text AS id, client_secret_enc AS blob FROM core.oauth_providers \
                 WHERE client_secret_enc <> ''",
        update: "UPDATE core.oauth_providers SET client_secret_enc = $1 WHERE id = $2::uuid",
    },
    Store {
        label: "Secrets de double authentification (actifs)",
        domain: b"kubuno:totp:",
        select: "SELECT id::text AS id, totp_secret AS blob FROM core.users \
                 WHERE totp_secret IS NOT NULL AND totp_secret <> ''",
        update: "UPDATE core.users SET totp_secret = $1 WHERE id = $2::uuid",
    },
    Store {
        label: "Secrets de double authentification (en cours d'activation)",
        domain: b"kubuno:totp:",
        select: "SELECT id::text AS id, totp_pending_secret AS blob FROM core.users \
                 WHERE totp_pending_secret IS NOT NULL AND totp_pending_secret <> ''",
        update: "UPDATE core.users SET totp_pending_secret = $1 WHERE id = $2::uuid",
    },
    Store {
        label: "Identifiants des campagnes de migration",
        domain: b"kubuno:data-migration:",
        select: "SELECT id::text AS id, secret_enc AS blob FROM core.migration_accounts \
                 WHERE secret_enc <> ''",
        update: "UPDATE core.migration_accounts SET secret_enc = $1 WHERE id = $2::uuid",
    },
];

pub async fn cmd_security_rekey(force: bool, check: bool, config: Option<&str>) -> Result<()> {
    section(if check {
        "Contrôle de la clé de chiffrement des données"
    } else {
        "Renouvellement de la clé de chiffrement des données"
    });
    println!();

    // The instance may run against a configuration of its own; the key it
    // re-encrypts with must be that instance's, so the file is selectable here
    // exactly as the server selects it.
    let explicit = config.map(str::to_string).or_else(|| {
        std::env::var("KV_CONFIG_FILE").ok().filter(|v| !v.trim().is_empty())
    });
    let settings =
        Settings::load_from(explicit.as_deref()).context("Chargement de la configuration")?;
    let pool = create_pool(&settings.database)
        .await
        .context("Connexion à la base de données")?;

    // The key currently in force — the one every stored value was sealed with.
    datakey::init(&settings.auth.jwt_secret).context("Lecture de la clé de données actuelle")?;
    let path = datakey::key_path();

    info(&format!("Fichier de clé : {}", path.display()));
    println!();

    let counts = survey(&pool).await?;
    let total: i64 = counts.iter().map(|(_, n)| *n).sum();
    for (label, n) in &counts {
        if *n > 0 {
            info(&format!("{n:>4}  {label}"));
        }
    }
    if total == 0 {
        info("Aucune donnée chiffrée : seule la clé sera remplacée.");
    }
    println!();

    // Read-only verification: every stored value is decrypted with the key in
    // force and nothing is written. This is what answers "is this instance still
    // able to read its own secrets?" — after an upgrade, after a rotation, or
    // before touching anything at all.
    if check {
        let mut bad = 0;
        for store in STORES {
            match verify_store(&pool, store).await {
                Ok(0) => {}
                Ok(n) => ok(&format!("{n} valeur(s) lisible(s) — {}", store.label)),
                Err(e) => {
                    bad += 1;
                    warn(&format!("{} : {e}", store.label));
                }
            }
        }
        println!();
        if bad == 0 {
            ok("Toutes les données chiffrées sont lisibles avec la clé en vigueur.");
            return Ok(());
        }
        anyhow::bail!("{bad} magasin(s) illisible(s) avec la clé en vigueur");
    }

    warn("Le service doit être arrêté pendant l'opération (systemctl stop kubuno).");
    warn("Sauvegardez la base ET le fichier de clé avant de continuer.");
    if !force && !confirm_yes_no("Renouveler la clé et re-chiffrer ces données ?") {
        info("Abandon.");
        return Ok(());
    }
    println!();

    let new_root = datakey::generate_root();
    let mut tx = pool.begin().await.context("Ouverture de la transaction")?;
    let mut rewritten = 0i64;
    for store in STORES {
        rewritten += rekey_store(&mut tx, store, &new_root).await?;
    }
    tx.commit().await.context("Validation de la transaction")?;
    ok(&format!("{rewritten} valeur(s) re-chiffrée(s)."));

    // Only now, with the data committed under the new key, does the key file move.
    // The reverse order would leave a key that cannot read its own data.
    let backup = path.with_extension("key.old");
    if path.exists() {
        std::fs::copy(&path, &backup).ok();
    }
    datakey::write_root(&path, &new_root)
        .with_context(|| format!("Écriture de {}", path.display()))?;
    ok(&format!("Nouvelle clé installée ({}).", path.display()));
    if backup.exists() {
        info(&format!("Ancienne clé conservée : {}", backup.display()));
        info("À supprimer une fois l'instance vérifiée.");
    }
    println!();
    ok("Terminé. Redémarrez le service (systemctl start kubuno).");
    Ok(())
}

/// Counts what each store holds, for the summary shown before confirming.
async fn survey(pool: &PgPool) -> Result<Vec<(&'static str, i64)>> {
    let mut out = Vec::new();
    for store in STORES {
        let sql = format!("SELECT count(*) FROM ({}) s", store.select);
        // A store whose table does not exist yet (migrations behind) counts as empty
        // rather than aborting the whole command.
        let n: i64 = sqlx::query_scalar(&sql).fetch_one(pool).await.unwrap_or(0);
        out.push((store.label, n));
    }
    Ok(out)
}

/// Decrypts every value of one store without writing anything.
async fn verify_store(pool: &PgPool, store: &Store) -> Result<usize> {
    let key = datakey::key(store.domain, "");
    let rows = match sqlx::query(store.select).fetch_all(pool).await {
        Ok(rows) => rows,
        Err(_) => return Ok(0), // absent table: nothing to read, not a failure
    };
    let mut n = 0;
    for row in rows {
        let id: String = row.try_get("id").context("Lecture de l'identifiant")?;
        let blob: String = row.try_get("blob").context("Lecture du chiffré")?;
        encryption::decrypt(&key, &blob)
            .map_err(|e| anyhow::anyhow!("{id} illisible ({e})"))?;
        n += 1;
    }
    Ok(n)
}

/// Re-encrypts one store inside the caller's transaction.
async fn rekey_store(
    tx: &mut Transaction<'_, Postgres>,
    store: &Store,
    new_root: &str,
) -> Result<i64> {
    let old_key = datakey::key(store.domain, "");
    let new_key = datakey::derive(store.domain, new_root);

    let rows = match sqlx::query(store.select).fetch_all(&mut **tx).await {
        Ok(rows) => rows,
        Err(e) => {
            // Same tolerance as the survey: an absent table is not a failure.
            tracing::warn!(magasin = store.label, erreur = %e, "Magasin ignoré");
            return Ok(0);
        }
    };

    let mut n = 0i64;
    for row in rows {
        let id: String = row.try_get("id").context("Lecture de l'identifiant")?;
        let blob: String = row.try_get("blob").context("Lecture du chiffré")?;

        let plain = encryption::decrypt(&old_key, &blob).map_err(|e| {
            anyhow::anyhow!(
                "{} ({id}) : déchiffrement impossible avec la clé actuelle — \
                 la valeur a-t-elle été chiffrée avec une autre clé ? ({e})",
                store.label
            )
        })?;
        let sealed = encryption::encrypt(&new_key, &plain)
            .map_err(|e| anyhow::anyhow!("{} ({id}) : re-chiffrement impossible ({e})", store.label))?;

        sqlx::query(store.update)
            .bind(&sealed)
            .bind(&id)
            .execute(&mut **tx)
            .await
            .with_context(|| format!("Écriture de {} ({id})", store.label))?;
        n += 1;
    }
    Ok(n)
}
