//! The writer: a logical, data-only dump of the `core` schema, produced from
//! the connection pool.
//!
//! ## Why the output is `psql` text format
//!
//! Because a backup nobody can restore is a file, not a backup. Every block
//! below is exactly what `pg_dump --data-only --disable-triggers` emits, so the
//! file this writes is loadable by the `kubuno db:restore` command that already
//! exists — no new restore path, no new format, nothing to learn in the hour an
//! operator is least able to learn it.
//!
//! ## The four things that make it actually restorable
//!
//! * **One snapshot.** Every table is read on the *same* connection inside a
//!   single `REPEATABLE READ, READ ONLY` transaction. Dumping table by table
//!   from a pool would interleave writes and produce a file whose foreign keys
//!   do not close.
//! * **Dependency order.** Tables are emitted parents-first (Kahn over
//!   `pg_constraint`), because foreign keys are *system* triggers and stay
//!   enforced whatever else is disabled.
//! * **User triggers off during the load.** `core.settings` carries an
//!   `AFTER INSERT` trigger that mirrors values into `core.setting_values`
//!   (migration `000060`). Restoring both tables with that trigger live makes
//!   the second `COPY` collide with rows the first one caused. `ALTER TABLE …
//!   DISABLE TRIGGER USER` needs table ownership, not superuser — unlike
//!   `session_replication_role`, which the instance account cannot set.
//! * **Sequences.** Emitted as `setval` after the data, or the first insert
//!   after a restore collides with a key that is already there.
//!
//! ## What it refuses to do
//!
//! It never spawns anything (`kubuno-seccomp` forbids `execve`, and that is the
//! point of the sandbox), never reads the configuration file, and never writes a
//! connection string, a password or a token into the file, the file *name* or a
//! log line. The dump does contain password **hashes** — that is what a database
//! backup is — which is why the directory is created `0700` and the file `0600`.

use std::collections::{HashMap, HashSet, VecDeque};
use std::path::{Path, PathBuf};

use anyhow::{bail, Context};
use chrono::{DateTime, Utc};
use futures::StreamExt;
use sqlx::{PgPool, Row};
use tokio::io::AsyncWriteExt;

/// The schema this feature backs up. Deliberately a constant and not a
/// parameter: the core owns exactly one schema, and a dump that could be
/// pointed at somebody else's would be a data-exfiltration primitive with a
/// scheduler attached.
pub const SCHEMA: &str = "core";

/// Free space required before a dump is even attempted. A backup that fills the
/// volume it is protecting takes the instance down to save it.
const MIN_FREE_BYTES: u64 = 256 * 1024 * 1024;

/// Free space below which a dump in progress is abandoned. Lower than the entry
/// bar: the file being written is already accounted for in what is left.
const ABORT_FREE_BYTES: u64 = 64 * 1024 * 1024;

/// Suffix of a dump still being written. Renamed into place only once the file
/// is complete and fsynced, so a crash never leaves something that *looks* like
/// a backup and is half a table short.
const PARTIAL_SUFFIX: &str = ".part";

/// What one completed dump produced.
#[derive(Debug, Clone)]
pub struct DumpOutcome {
    pub file_name: String,
    pub path: PathBuf,
    pub size_bytes: u64,
    pub tables: usize,
    pub rows: u64,
}

/// The name a dump taken at `at` receives.
///
/// Sortable as text, so the retention pass can order the directory without
/// stat-ing anything, and it carries nothing but a timestamp — never the
/// instance name, never a host, never anything derived from a credential.
pub fn file_name_for(at: DateTime<Utc>) -> String {
    format!("kubuno-core-{}.sql", at.format("%Y%m%dT%H%M%SZ"))
}

/// True when `name` is a file this feature produced.
///
/// Used by the retention pass, which must delete only its own output: a
/// destination directory is an operator's directory, and anything else in it is
/// somebody else's file.
pub fn is_dump_file(name: &str) -> bool {
    let Some(rest) = name.strip_prefix("kubuno-core-") else {
        return false;
    };
    let Some(stamp) = rest.strip_suffix(".sql") else {
        return false;
    };
    stamp.len() == 16
        && stamp.char_indices().all(|(i, c)| match i {
            8 => c == 'T',
            15 => c == 'Z',
            _ => c.is_ascii_digit(),
        })
}

/// Doubles embedded quotes, the only escape a quoted SQL identifier needs.
/// The names come from the catalogue, not from a user, but building SQL by
/// concatenation without quoting is a habit that eventually meets one that does.
fn quote_ident(raw: &str) -> String {
    format!("\"{}\"", raw.replace('"', "\"\""))
}

/// Escapes a single-quoted SQL literal, for the `setval` calls.
fn quote_literal(raw: &str) -> String {
    format!("'{}'", raw.replace('\'', "''"))
}

struct TableSpec {
    name: String,
    columns: Vec<String>,
}

/// Creates the destination if needed, with permissions that match what the file
/// will contain.
async fn ensure_directory(destination: &Path) -> anyhow::Result<()> {
    tokio::fs::create_dir_all(destination)
        .await
        .with_context(|| format!("Création du répertoire de sauvegarde {}", destination.display()))?;

    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        // 0700 and not 0755: the files inside carry every password hash of the
        // instance. Applied on every run, so a directory created by hand with
        // loose permissions is tightened rather than trusted.
        let perms = std::fs::Permissions::from_mode(0o700);
        if let Err(e) = tokio::fs::set_permissions(destination, perms).await {
            tracing::warn!(
                error = %e,
                répertoire = %destination.display(),
                "backup: droits 0700 non appliqués au répertoire de destination"
            );
        }
    }
    Ok(())
}

fn free_bytes(destination: &Path) -> Option<u64> {
    crate::health::disk::usage_of(destination).map(|u| u.available_bytes)
}

/// Tables of the schema, ordered parents-first.
///
/// Self-references are skipped (a tree table depends on itself and would
/// otherwise never become ready) and a genuine cycle degrades into "emit the
/// rest alphabetically" with a warning rather than dropping tables: an
/// incomplete backup that says nothing is the failure mode this whole feature
/// exists to remove.
async fn ordered_tables(conn: &mut sqlx::PgConnection) -> anyhow::Result<Vec<String>> {
    let rows = sqlx::query(
        "SELECT c.relname AS name \
           FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace \
          WHERE n.nspname = $1 AND c.relkind = 'r' AND NOT c.relispartition \
          ORDER BY c.relname",
    )
    .bind(SCHEMA)
    .fetch_all(&mut *conn)
    .await
    .context("Lecture de la liste des tables")?;

    let names: Vec<String> = rows.iter().map(|r| r.get::<String, _>("name")).collect();
    let known: HashSet<&str> = names.iter().map(String::as_str).collect();

    let edges = sqlx::query(
        "SELECT child.relname AS child, parent.relname AS parent \
           FROM pg_constraint con \
           JOIN pg_class child  ON child.oid  = con.conrelid \
           JOIN pg_class parent ON parent.oid = con.confrelid \
           JOIN pg_namespace nc ON nc.oid = child.relnamespace \
           JOIN pg_namespace np ON np.oid = parent.relnamespace \
          WHERE con.contype = 'f' AND nc.nspname = $1 AND np.nspname = $1",
    )
    .bind(SCHEMA)
    .fetch_all(&mut *conn)
    .await
    .context("Lecture des dépendances de clés étrangères")?;

    // parent → children, plus the in-degree of each child.
    let mut children: HashMap<String, Vec<String>> = HashMap::new();
    let mut indegree: HashMap<&str, usize> = names.iter().map(|n| (n.as_str(), 0)).collect();
    let mut seen: HashSet<(String, String)> = HashSet::new();

    for row in &edges {
        let child: String = row.get("child");
        let parent: String = row.get("parent");
        if child == parent || !known.contains(child.as_str()) || !known.contains(parent.as_str()) {
            continue;
        }
        // Two foreign keys between the same pair of tables are one dependency.
        if !seen.insert((parent.clone(), child.clone())) {
            continue;
        }
        children.entry(parent).or_default().push(child.clone());
        if let Some(d) = indegree.get_mut(child.as_str()) {
            *d += 1;
        }
    }

    let mut queue: VecDeque<String> = names
        .iter()
        .filter(|n| indegree.get(n.as_str()).copied().unwrap_or(0) == 0)
        .cloned()
        .collect();
    let mut ordered: Vec<String> = Vec::with_capacity(names.len());

    while let Some(name) = queue.pop_front() {
        ordered.push(name.clone());
        for child in children.get(&name).into_iter().flatten() {
            if let Some(d) = indegree.get_mut(child.as_str()) {
                *d -= 1;
                if *d == 0 {
                    queue.push_back(child.clone());
                }
            }
        }
    }

    if ordered.len() < names.len() {
        let missing: Vec<String> = names
            .iter()
            .filter(|n| !ordered.contains(n))
            .cloned()
            .collect();
        tracing::warn!(
            tables = ?missing,
            "backup: cycle de clés étrangères — ces tables sont écrites en fin de fichier"
        );
        ordered.extend(missing);
    }

    Ok(ordered)
}

/// Columns of one table, in physical order, excluding dropped and generated
/// ones — a generated column cannot be the target of a `COPY … FROM`.
async fn columns_of(conn: &mut sqlx::PgConnection, table: &str) -> anyhow::Result<Vec<String>> {
    let rows = sqlx::query(
        "SELECT a.attname AS name \
           FROM pg_attribute a \
           JOIN pg_class c     ON c.oid = a.attrelid \
           JOIN pg_namespace n ON n.oid = c.relnamespace \
          WHERE n.nspname = $1 AND c.relname = $2 \
            AND a.attnum > 0 AND NOT a.attisdropped AND a.attgenerated = '' \
          ORDER BY a.attnum",
    )
    .bind(SCHEMA)
    .bind(table)
    .fetch_all(&mut *conn)
    .await
    .with_context(|| format!("Lecture des colonnes de {SCHEMA}.{table}"))?;

    Ok(rows.iter().map(|r| r.get::<String, _>("name")).collect())
}

/// Sequences of the schema with their current position.
async fn sequence_positions(conn: &mut sqlx::PgConnection) -> anyhow::Result<Vec<(String, i64, bool)>> {
    let rows = sqlx::query(
        "SELECT sequencename AS name, last_value \
           FROM pg_sequences WHERE schemaname = $1 ORDER BY sequencename",
    )
    .bind(SCHEMA)
    .fetch_all(&mut *conn)
    .await
    .context("Lecture des séquences")?;

    let mut out = Vec::with_capacity(rows.len());
    for row in &rows {
        let name: String = row.get("name");
        // `pg_sequences.last_value` is NULL until the sequence has been used
        // once. `setval(…, 1, false)` then reproduces "never called", which is
        // what a fresh table needs — `setval(…, 1, true)` would silently burn
        // the first identifier.
        match row.try_get::<Option<i64>, _>("last_value") {
            Ok(Some(v)) => out.push((name, v, true)),
            Ok(None) => out.push((name, 1, false)),
            Err(e) => {
                tracing::warn!(error = %e, séquence = %name, "backup: position de séquence illisible");
            }
        }
    }
    Ok(out)
}

/// Writes one complete dump into `destination` and returns what it contains.
///
/// The file is written under a `.part` name and renamed only after a successful
/// `fsync`, so a partially written dump is never mistaken for a usable one — by
/// the retention pass, by the console, or by an operator at 3 a.m.
pub async fn write_dump(db: &PgPool, destination: &Path) -> anyhow::Result<DumpOutcome> {
    ensure_directory(destination).await?;

    if let Some(free) = free_bytes(destination) {
        if free < MIN_FREE_BYTES {
            bail!(
                "Espace disque insuffisant sur {} : {} Mio disponibles, {} Mio requis",
                destination.display(),
                free / (1024 * 1024),
                MIN_FREE_BYTES / (1024 * 1024)
            );
        }
    }

    let started = Utc::now();
    let file_name = file_name_for(started);
    let final_path = destination.join(&file_name);
    let partial_path = destination.join(format!("{file_name}{PARTIAL_SUFFIX}"));

    match write_into(db, destination, &partial_path, started).await {
        Ok((tables, rows)) => {
            tokio::fs::rename(&partial_path, &final_path)
                .await
                .with_context(|| format!("Publication de {}", final_path.display()))?;
            let size_bytes = tokio::fs::metadata(&final_path)
                .await
                .map(|m| m.len())
                .unwrap_or(0);
            Ok(DumpOutcome {
                file_name,
                path: final_path,
                size_bytes,
                tables,
                rows,
            })
        }
        Err(e) => {
            // Best effort: a leftover `.part` is inert (the retention pass does
            // not recognise it, the console never lists it) but it holds disk.
            if let Err(rm) = tokio::fs::remove_file(&partial_path).await {
                tracing::warn!(error = %rm, fichier = %partial_path.display(), "backup: fragment non supprimé");
            }
            Err(e)
        }
    }
}

/// The body of the dump. Split out so [`write_dump`] can clean up on any error
/// without a dozen `?`-sites each remembering to do it.
async fn write_into(
    db: &PgPool,
    destination: &Path,
    partial_path: &Path,
    started: DateTime<Utc>,
) -> anyhow::Result<(usize, u64)> {
    let file = tokio::fs::File::create(partial_path)
        .await
        .with_context(|| format!("Création de {}", partial_path.display()))?;

    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        // Before a single byte is written: the window between `create` and
        // `set_permissions` is the only moment the file is world-readable.
        if let Err(e) = file.set_permissions(std::fs::Permissions::from_mode(0o600)).await {
            tracing::warn!(error = %e, "backup: droits 0600 non appliqués au fichier");
        }
    }

    let mut out = tokio::io::BufWriter::with_capacity(256 * 1024, file);

    // ── The reading connection ──────────────────────────────────────────────
    // One connection, one snapshot. `REPEATABLE READ` is what makes the file
    // internally consistent; `READ ONLY` makes it impossible for this code path
    // to write anything at all, whatever it is asked to do later.
    let mut conn = db
        .acquire()
        .await
        .context("Réservation d'une connexion pour la sauvegarde")?;

    sqlx::query("BEGIN ISOLATION LEVEL REPEATABLE READ, READ ONLY")
        .execute(&mut *conn)
        .await
        .context("Ouverture de la transaction de sauvegarde")?;

    let table_names = ordered_tables(&mut conn).await?;
    let mut tables: Vec<TableSpec> = Vec::with_capacity(table_names.len());
    for name in table_names {
        let columns = columns_of(&mut conn, &name).await?;
        if columns.is_empty() {
            tracing::warn!(table = %name, "backup: table sans colonne exportable, ignorée");
            continue;
        }
        tables.push(TableSpec { name, columns });
    }
    let sequences = sequence_positions(&mut conn).await?;

    // ── Header ──────────────────────────────────────────────────────────────
    // Written for the person reading it during an incident, not for a parser.
    let header = format!(
        "--\n\
         -- Kubuno — sauvegarde logique des DONNÉES du schéma « {SCHEMA} »\n\
         -- Kubuno — logical DATA-ONLY backup of schema \"{SCHEMA}\"\n\
         --\n\
         -- Produite le / taken at : {}\n\
         -- Tables : {}\n\
         --\n\
         -- CONTENU : les lignes des tables du schéma « {SCHEMA} » et la position des\n\
         --           séquences. Rien d'autre.\n\
         -- NON INCLUS : les fichiers stockés (téléversements), les schémas des modules\n\
         --           installés, la structure (DDL) et le fichier de configuration.\n\
         --\n\
         -- RESTAURATION : sur une instance dont les migrations sont déjà appliquées et\n\
         --           dont le schéma « {SCHEMA} » est vide.\n\
         --               kubuno db:restore <ce-fichier>\n\
         --           Les déclencheurs applicatifs sont désactivés le temps du\n\
         --           chargement puis réactivés (voir ALTER TABLE ci-dessous).\n\
         --\n\
         SET statement_timeout = 0;\n\
         SET lock_timeout = 0;\n\
         SET client_encoding = 'UTF8';\n\
         SET standard_conforming_strings = on;\n\
         SET check_function_bodies = false;\n\
         SET client_min_messages = warning;\n\
         \n\
         BEGIN;\n\
         \n",
        started.to_rfc3339(),
        tables.len(),
    );
    out.write_all(header.as_bytes()).await?;

    // ── Triggers off ────────────────────────────────────────────────────────
    out.write_all(b"-- Deferred application triggers (see the module header).\n")
        .await?;
    for spec in &tables {
        let stmt = format!(
            "ALTER TABLE {}.{} DISABLE TRIGGER USER;\n",
            quote_ident(SCHEMA),
            quote_ident(&spec.name)
        );
        out.write_all(stmt.as_bytes()).await?;
    }
    out.write_all(b"\n").await?;

    // ── Data ────────────────────────────────────────────────────────────────
    let mut total_rows: u64 = 0;
    for spec in &tables {
        // Checked between tables rather than per chunk: cheap, and it still
        // stops a runaway dump long before the volume is full.
        if let Some(free) = free_bytes(destination) {
            if free < ABORT_FREE_BYTES {
                bail!(
                    "Sauvegarde interrompue : il ne reste que {} Mio sur {}",
                    free / (1024 * 1024),
                    destination.display()
                );
            }
        }

        let column_list = spec
            .columns
            .iter()
            .map(|c| quote_ident(c))
            .collect::<Vec<_>>()
            .join(", ");
        let qualified = format!("{}.{}", quote_ident(SCHEMA), quote_ident(&spec.name));

        out.write_all(format!("COPY {qualified} ({column_list}) FROM stdin;\n").as_bytes())
            .await?;

        let statement = format!("COPY {qualified} ({column_list}) TO STDOUT");
        let mut stream = conn
            .copy_out_raw(&statement)
            .await
            .with_context(|| format!("Export de {qualified}"))?;

        let mut rows: u64 = 0;
        while let Some(chunk) = stream.next().await {
            let chunk = chunk.with_context(|| format!("Lecture du flux de {qualified}"))?;
            // In `COPY` text format every value's own newline is escaped as
            // `\n`, so a raw newline is exactly one row terminator. Counting
            // them is not an estimate.
            rows += chunk.iter().filter(|b| **b == b'\n').count() as u64;
            out.write_all(&chunk).await?;
        }
        drop(stream);

        out.write_all(b"\\.\n\n").await?;
        total_rows += rows;
    }

    // ── Sequences ───────────────────────────────────────────────────────────
    if !sequences.is_empty() {
        out.write_all(b"-- Sequence positions.\n").await?;
        for (name, last_value, is_called) in &sequences {
            let qualified = format!("{SCHEMA}.{name}");
            let stmt = format!(
                "SELECT pg_catalog.setval({}, {}, {});\n",
                quote_literal(&qualified),
                last_value,
                if *is_called { "true" } else { "false" }
            );
            out.write_all(stmt.as_bytes()).await?;
        }
        out.write_all(b"\n").await?;
    }

    // ── Triggers back on ────────────────────────────────────────────────────
    for spec in &tables {
        let stmt = format!(
            "ALTER TABLE {}.{} ENABLE TRIGGER USER;\n",
            quote_ident(SCHEMA),
            quote_ident(&spec.name)
        );
        out.write_all(stmt.as_bytes()).await?;
    }
    out.write_all(b"\nCOMMIT;\n").await?;

    // The read transaction is closed explicitly so the connection returns to the
    // pool clean rather than being recycled by the pool's own reset.
    if let Err(e) = sqlx::query("COMMIT").execute(&mut *conn).await {
        tracing::warn!(error = %e, "backup: clôture de la transaction de lecture");
    }
    drop(conn);

    out.flush().await.context("Vidage du tampon d'écriture")?;
    // `fsync` before the rename: without it, a power loss can publish a name
    // whose content never reached the platter.
    out.into_inner()
        .sync_all()
        .await
        .context("Synchronisation du fichier de sauvegarde")?;

    Ok((tables.len(), total_rows))
}

/// Applies the retention policy to `destination`.
///
/// Only files this feature produced are candidates ([`is_dump_file`]); anything
/// else in the directory belongs to the operator and is never touched. Returns
/// the names actually removed, so the run history can mark the corresponding
/// rows rather than leaving the console claiming a file that is gone.
pub async fn prune(destination: &Path, keep: i64) -> anyhow::Result<Vec<String>> {
    let keep = keep.max(1) as usize;

    let mut entries = match tokio::fs::read_dir(destination).await {
        Ok(e) => e,
        // A destination that does not exist holds nothing to prune. Not an
        // error: the first run creates it.
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => return Ok(Vec::new()),
        Err(e) => {
            return Err(e).with_context(|| format!("Lecture de {}", destination.display()))
        }
    };

    let mut names: Vec<String> = Vec::new();
    while let Some(entry) = entries
        .next_entry()
        .await
        .with_context(|| format!("Parcours de {}", destination.display()))?
    {
        let name = entry.file_name().to_string_lossy().into_owned();
        if is_dump_file(&name) {
            names.push(name);
        }
    }

    // The name carries a sortable UTC timestamp, so lexicographic order is
    // chronological order — no `stat` on every file, and no dependence on an
    // mtime a copy would have rewritten.
    names.sort();
    if names.len() <= keep {
        return Ok(Vec::new());
    }

    let doomed: Vec<String> = names[..names.len() - keep].to_vec();
    let mut removed = Vec::with_capacity(doomed.len());
    for name in doomed {
        let path = destination.join(&name);
        match tokio::fs::remove_file(&path).await {
            Ok(()) => removed.push(name),
            Err(e) => {
                // Logged, not fatal: a file that could not be removed must not
                // turn a successful backup into a failed one.
                tracing::error!(error = %e, fichier = %path.display(), "backup: rotation impossible");
            }
        }
    }
    Ok(removed)
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::TimeZone;

    #[test]
    fn the_file_name_is_a_sortable_timestamp_and_nothing_else() {
        let at = Utc
            .with_ymd_and_hms(2026, 8, 4, 3, 15, 0)
            .single()
            .expect("date de test valide");
        assert_eq!(file_name_for(at), "kubuno-core-20260804T031500Z.sql");
        assert!(is_dump_file(&file_name_for(at)));
    }

    /// The rule the retention pass depends on: it deletes files, so it must
    /// recognise **only** its own.
    #[test]
    fn only_our_own_files_are_recognised() {
        assert!(is_dump_file("kubuno-core-20260804T031500Z.sql"));
        assert!(!is_dump_file("kubuno-core-20260804T031500Z.sql.part"));
        assert!(!is_dump_file("kubuno_backup_20260804_031500.sql")); // the CLI's own
        assert!(!is_dump_file("notes-importantes.sql"));
        assert!(!is_dump_file("kubuno-core-.sql"));
        assert!(!is_dump_file("kubuno-core-20260804X031500Z.sql"));
        assert!(!is_dump_file("kubuno-core-2026080aT031500Z.sql"));
        assert!(!is_dump_file(".."));
    }

    #[test]
    fn chronological_order_is_lexicographic_order() {
        let mut names = [
            file_name_for(Utc.with_ymd_and_hms(2026, 8, 4, 3, 0, 0).single().expect("date")),
            file_name_for(Utc.with_ymd_and_hms(2025, 12, 31, 23, 0, 0).single().expect("date")),
            file_name_for(Utc.with_ymd_and_hms(2026, 8, 4, 3, 0, 1).single().expect("date")),
        ];
        let oldest = names[1].clone();
        names.sort();
        assert_eq!(names[0], oldest, "le plus ancien doit être supprimé en premier");
    }

    #[test]
    fn identifiers_and_literals_are_escaped() {
        assert_eq!(quote_ident("users"), "\"users\"");
        assert_eq!(quote_ident("we\"ird"), "\"we\"\"ird\"");
        assert_eq!(quote_literal("core.jobs"), "'core.jobs'");
        assert_eq!(quote_literal("l'apostrophe"), "'l''apostrophe'");
    }

    /// Retention is a deletion loop; the arithmetic that decides what it deletes
    /// is worth a test of its own.
    #[tokio::test]
    async fn retention_keeps_the_newest_and_never_touches_a_stranger() {
        let dir = std::env::temp_dir().join(format!("kubuno-backup-test-{}", uuid::Uuid::new_v4()));
        tokio::fs::create_dir_all(&dir).await.expect("répertoire de test");

        let stamps = [
            (2026, 8, 1, 3, 0, 0),
            (2026, 8, 2, 3, 0, 0),
            (2026, 8, 3, 3, 0, 0),
            (2026, 8, 4, 3, 0, 0),
        ];
        for (y, m, d, h, mi, s) in stamps {
            let name = file_name_for(
                Utc.with_ymd_and_hms(y, m, d, h, mi, s).single().expect("date"),
            );
            tokio::fs::write(dir.join(&name), b"-- test\n").await.expect("écriture");
        }
        // A file the operator put there, and a fragment of an interrupted run.
        tokio::fs::write(dir.join("archive-perso.sql"), b"x").await.expect("écriture");
        tokio::fs::write(dir.join("kubuno-core-20260805T030000Z.sql.part"), b"x")
            .await
            .expect("écriture");

        let removed = prune(&dir, 2).await.expect("rotation");
        assert_eq!(removed.len(), 2, "deux fichiers doivent partir : {removed:?}");
        assert!(removed.contains(&"kubuno-core-20260801T030000Z.sql".to_string()));
        assert!(removed.contains(&"kubuno-core-20260802T030000Z.sql".to_string()));

        assert!(dir.join("kubuno-core-20260804T030000Z.sql").exists());
        assert!(dir.join("kubuno-core-20260803T030000Z.sql").exists());
        assert!(dir.join("archive-perso.sql").exists(), "un fichier étranger n'est jamais supprimé");
        assert!(dir.join("kubuno-core-20260805T030000Z.sql.part").exists());

        // Keeping more than there is removes nothing, and a floor of one is
        // enforced whatever the caller passes.
        assert!(prune(&dir, 50).await.expect("rotation").is_empty());
        assert_eq!(prune(&dir, 0).await.expect("rotation").len(), 1);

        tokio::fs::remove_dir_all(&dir).await.ok();
    }

    #[tokio::test]
    async fn pruning_a_missing_directory_is_not_an_error() {
        let dir = std::env::temp_dir().join(format!("kubuno-absent-{}", uuid::Uuid::new_v4()));
        assert!(prune(&dir, 3).await.expect("répertoire absent").is_empty());
    }
}
