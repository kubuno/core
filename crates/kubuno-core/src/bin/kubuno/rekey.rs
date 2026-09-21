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
use kubuno_db::{params, Backend, DbPool, DbTx, DbValue};
use uuid::Uuid;

use crate::display::{confirm_yes_no, info, ok, section, warn};

/// How a store's identifier column is typed, which decides how it round-trips.
enum IdKind {
    /// A text primary key (`core.settings."key"`).
    Text,
    /// A UUID primary key — binary off PostgreSQL, so it is read and bound as a
    /// `Uuid` rather than through the `id::text` / `$n::uuid` casts PostgreSQL
    /// alone accepts.
    Uuid,
}

/// One store of encrypted values: where they live and which domain keys them.
///
/// The `SELECT` and `UPDATE` are assembled per engine ([`Store::select`],
/// [`Store::update`]) because two things had no portable spelling: reading a
/// JSON-column value as text (`value #>> '{}'`) and writing one back
/// (`to_jsonb($1::text)`). The dialect layer produces the local form of each,
/// and the identifier round-trips through its real type instead of a cast.
struct Store {
    label: &'static str,
    domain: &'static [u8],
    /// Schema-qualified table.
    table: &'static str,
    /// Identifier column, already quoted where it is a reserved word.
    id_col: &'static str,
    /// Column holding the ciphertext.
    blob_col: &'static str,
    /// Whether `blob_col` is a JSON column (`core.settings.value`): the value is
    /// then a JSON string, read through `json_text` and written through
    /// `json_string`, rather than a plain text column.
    blob_json: bool,
    /// A portable predicate ANDed with "the ciphertext is non-empty". Empty for
    /// none. Written in source, so no request data reaches the statement.
    extra_where: &'static str,
    id_kind: IdKind,
}

impl Store {
    /// The `SELECT id, blob` this store reads, in the local dialect.
    fn select(&self, backend: Backend) -> String {
        let blob = if self.blob_json {
            backend.json_text(self.blob_col, &[])
        } else {
            self.blob_col.to_string()
        };
        let mut where_ = String::new();
        if !self.extra_where.is_empty() {
            where_.push_str(self.extra_where);
            where_.push_str(" AND ");
        }
        where_.push_str(&format!("{blob} <> ''"));
        format!(
            "SELECT {id} AS id, {blob} AS blob FROM {table} WHERE {where_}",
            id = self.id_col,
            table = self.table,
        )
    }

    /// The `UPDATE` that rewrites one row: the new ciphertext ($1), then the
    /// identifier ($2).
    fn update(&self, backend: Backend) -> String {
        let value = if self.blob_json {
            backend.json_string(1)
        } else {
            "$1".to_string()
        };
        format!(
            "UPDATE {table} SET {col} = {value} WHERE {id} = $2",
            table = self.table,
            col = self.blob_col,
            id = self.id_col,
        )
    }
}

/// One encrypted value with a text identifier (`core.settings."key"`).
#[derive(sqlx::FromRow)]
struct TextEncRow {
    id: String,
    blob: String,
}

/// One encrypted value with a UUID identifier — read as a real `Uuid`, so it
/// round-trips on the engines that store it as bytes.
#[derive(sqlx::FromRow)]
struct UuidEncRow {
    id: Uuid,
    blob: String,
}

/// A store row normalised for the rewrite loop: the id as a bind value and as a
/// display string, plus the ciphertext.
struct Enc {
    id_value: DbValue,
    id_display: String,
    blob: String,
}

/// Reads a store's rows, whatever its identifier type, into the uniform [`Enc`].
async fn load_store(pool: &DbPool, store: &Store) -> Result<Vec<Enc>, sqlx::Error> {
    let sql = store.select(pool.backend());
    match store.id_kind {
        IdKind::Text => {
            let rows = pool.fetch_all_as::<TextEncRow>(&sql, params![]).await?;
            Ok(rows
                .into_iter()
                .map(|r| Enc {
                    id_value: DbValue::from(r.id.clone()),
                    id_display: r.id,
                    blob: r.blob,
                })
                .collect())
        }
        IdKind::Uuid => {
            let rows = pool.fetch_all_as::<UuidEncRow>(&sql, params![]).await?;
            Ok(rows
                .into_iter()
                .map(|r| Enc {
                    id_value: DbValue::from(r.id),
                    id_display: r.id.to_string(),
                    blob: r.blob,
                })
                .collect())
        }
    }
}

const STORES: &[Store] = &[
    Store {
        label: "Mot de passe du relais SMTP",
        domain: b"kubuno:smtp:",
        table: "core.settings",
        id_col: "\"key\"",
        blob_col: "value",
        blob_json: true,
        extra_where: "\"key\" = 'mail.smtp_password'",
        id_kind: IdKind::Text,
    },
    Store {
        label: "Mot de passe de liaison de l'annuaire",
        domain: b"kubuno:ldap:",
        table: "core.ldap_directories",
        id_col: "id",
        blob_col: "bind_password_enc",
        blob_json: false,
        extra_where: "",
        id_kind: IdKind::Uuid,
    },
    Store {
        label: "Secrets clients OpenID Connect",
        domain: b"kubuno:oidc:",
        table: "core.oauth_providers",
        id_col: "id",
        blob_col: "client_secret_enc",
        blob_json: false,
        extra_where: "",
        id_kind: IdKind::Uuid,
    },
    Store {
        label: "Secrets de double authentification (actifs)",
        domain: b"kubuno:totp:",
        table: "core.users",
        id_col: "id",
        blob_col: "totp_secret",
        blob_json: false,
        extra_where: "totp_secret IS NOT NULL",
        id_kind: IdKind::Uuid,
    },
    Store {
        label: "Secrets de double authentification (en cours d'activation)",
        domain: b"kubuno:totp:",
        table: "core.users",
        id_col: "id",
        blob_col: "totp_pending_secret",
        blob_json: false,
        extra_where: "totp_pending_secret IS NOT NULL",
        id_kind: IdKind::Uuid,
    },
    Store {
        label: "Identifiants des campagnes de migration",
        domain: b"kubuno:data-migration:",
        table: "core.migration_accounts",
        id_col: "id",
        blob_col: "secret_enc",
        blob_json: false,
        extra_where: "",
        id_kind: IdKind::Uuid,
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
        rewritten += rekey_store(&pool, &mut tx, store, &new_root).await?;
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
async fn survey(pool: &DbPool) -> Result<Vec<(&'static str, i64)>> {
    let backend = pool.backend();
    let mut out = Vec::new();
    for store in STORES {
        // `count(*)` is cast to a portable bigint so every engine decodes as i64.
        let sql = format!("SELECT {} FROM ({}) s", backend.count_bigint("*"), store.select(backend));
        // A store whose table does not exist yet (migrations behind) counts as empty
        // rather than aborting the whole command.
        let n: i64 = pool.fetch_scalar::<i64>(&sql, params![]).await.unwrap_or(0);
        out.push((store.label, n));
    }
    Ok(out)
}

/// Decrypts every value of one store without writing anything.
async fn verify_store(pool: &DbPool, store: &Store) -> Result<usize> {
    let key = datakey::key(store.domain, "");
    let rows = match load_store(pool, store).await {
        Ok(rows) => rows,
        Err(_) => return Ok(0), // absent table: nothing to read, not a failure
    };
    let mut n = 0;
    for row in rows {
        encryption::decrypt(&key, &row.blob)
            .map_err(|e| anyhow::anyhow!("{} illisible ({e})", row.id_display))?;
        n += 1;
    }
    Ok(n)
}

/// Re-encrypts one store. The rows are read through the pool (a transaction
/// cannot fetch more than one row at a time), and every rewrite is applied on
/// the caller's transaction, so the writes still commit all-or-nothing. The
/// service is stopped for the duration, so nothing writes between the read and
/// the rewrite.
async fn rekey_store(
    pool: &DbPool,
    tx: &mut DbTx,
    store: &Store,
    new_root: &str,
) -> Result<i64> {
    let old_key = datakey::key(store.domain, "");
    let new_key = datakey::derive(store.domain, new_root);
    let update = store.update(pool.backend());

    let rows = match load_store(pool, store).await {
        Ok(rows) => rows,
        Err(e) => {
            // Same tolerance as the survey: an absent table is not a failure.
            tracing::warn!(store = store.label, error = %e, "Store skipped");
            return Ok(0);
        }
    };

    let mut n = 0i64;
    for row in rows {
        let id = row.id_display;
        let plain = encryption::decrypt(&old_key, &row.blob).map_err(|e| {
            anyhow::anyhow!(
                "{} ({id}) : déchiffrement impossible avec la clé actuelle — \
                 la valeur a-t-elle été chiffrée avec une autre clé ? ({e})",
                store.label
            )
        })?;
        let sealed = encryption::encrypt(&new_key, &plain)
            .map_err(|e| anyhow::anyhow!("{} ({id}) : re-chiffrement impossible ({e})", store.label))?;

        tx.execute(&update, params![&sealed, row.id_value])
            .await
            .with_context(|| format!("Écriture de {} ({id})", store.label))?;
        n += 1;
    }
    Ok(n)
}
