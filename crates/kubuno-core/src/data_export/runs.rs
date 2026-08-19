//! `core.data_export_runs` and `core.data_export_subjects` — the record of every
//! archive the instance ever produced.
//!
//! ## The rule of this file
//!
//! **The row is opened before the work starts, and it outlives the file.** The
//! first half is the discipline `core.backup_runs` follows, for the same reason:
//! a history written only on success cannot tell "nothing ran" from "something
//! ran and died".
//!
//! The second half is specific to this feature and is the more important one. An
//! archive is deleted — by the retention pass, by an operator, by a
//! cancellation. The row is not. "An export covering these 214 accounts was
//! produced on 14 August, by this person, and downloaded twice" is a fact an
//! investigation starts from, and it must survive the file it describes by
//! years. Every deletion path in this module therefore sets `file_deleted` and
//! keeps everything else.
//!
//! Nothing here ever stores a path outside `destination`, and `error` is
//! composed from the failing step rather than from an input.

use chrono::{DateTime, Utc};
use serde::Serialize;
use sqlx::{PgPool, Row};
use uuid::Uuid;

use crate::errors::AppError;

/// `error` is unbounded `TEXT`; a runaway message is still pointless to keep in
/// full, and the console renders it inline.
const MAX_ERROR_LEN: usize = 2_000;

/// A run left `running` by a process that died. Generous: an export of a large
/// instance genuinely takes hours, and closing a live run as "interrupted" would
/// destroy work and lie about it.
pub const STALE_RUN_HOURS: i64 = 24;

// ── Wire types ───────────────────────────────────────────────────────────────

/// One row of the history, as the API serves it.
#[derive(Debug, Clone, Serialize)]
pub struct ExportRun {
    pub id: Uuid,
    pub scope: String,
    /// `admin` (requested from the console) or `self` (an account asking for its
    /// own data). Migration `000122`.
    pub origin: String,
    pub services: Vec<String>,
    pub with_instance: bool,
    pub requested_by: Option<Uuid>,
    pub actor_label: Option<String>,
    pub status: String,
    pub requested_at: DateTime<Utc>,
    pub started_at: Option<DateTime<Utc>>,
    pub finished_at: Option<DateTime<Utc>>,
    pub duration_ms: Option<i64>,
    /// When the archive becomes downloadable. In the future while the hold runs.
    pub available_at: DateTime<Utc>,
    /// When the retention pass removes it.
    pub expires_at: DateTime<Utc>,
    pub subjects_total: i32,
    pub subjects_done: i32,
    pub file_name: Option<String>,
    pub destination: Option<String>,
    pub size_bytes: Option<i64>,
    pub entries_count: Option<i32>,
    pub error: Option<String>,
    pub file_deleted: bool,
    pub deleted_at: Option<DateTime<Utc>>,
    pub download_count: i32,
    pub last_downloaded_at: Option<DateTime<Utc>>,
    /// How many times this archive may be fetched in all. `None` = no ceiling,
    /// which is what an administrator's archive carries (the audit trail is the
    /// control there).
    pub download_limit: Option<i32>,
    /// The per-file ceiling frozen at creation, when the requester chose one.
    /// `None` = whatever the policy says when the job runs.
    pub max_file_mb: Option<i32>,
}

impl ExportRun {
    fn from_row(row: &sqlx::postgres::PgRow) -> Result<Self, sqlx::Error> {
        Ok(Self {
            id: row.try_get("id")?,
            scope: row.try_get("scope")?,
            origin: row.try_get("origin")?,
            services: row.try_get("services")?,
            with_instance: row.try_get("with_instance")?,
            requested_by: row.try_get("requested_by")?,
            actor_label: row.try_get("actor_label")?,
            status: row.try_get("status")?,
            requested_at: row.try_get("requested_at")?,
            started_at: row.try_get("started_at")?,
            finished_at: row.try_get("finished_at")?,
            duration_ms: row.try_get("duration_ms")?,
            available_at: row.try_get("available_at")?,
            expires_at: row.try_get("expires_at")?,
            subjects_total: row.try_get("subjects_total")?,
            subjects_done: row.try_get("subjects_done")?,
            file_name: row.try_get("file_name")?,
            destination: row.try_get("destination")?,
            size_bytes: row.try_get("size_bytes")?,
            entries_count: row.try_get("entries_count")?,
            error: row.try_get("error")?,
            file_deleted: row.try_get("file_deleted")?,
            deleted_at: row.try_get("deleted_at")?,
            download_count: row.try_get("download_count")?,
            last_downloaded_at: row.try_get("last_downloaded_at")?,
            download_limit: row.try_get("download_limit")?,
            max_file_mb: row.try_get("max_file_mb")?,
        })
    }

    /// Downloads still allowed, or `None` when there is no ceiling.
    ///
    /// Saturated at zero: a counter that ran past its ceiling (a limit lowered
    /// by hand in the database) must read as "none left", never as a negative
    /// number the interface would then render.
    pub fn downloads_left(&self) -> Option<i32> {
        self.download_limit
            .map(|limit| (limit - self.download_count).max(0))
    }

    /// True when the ceiling has been reached. Always false without a ceiling.
    pub fn download_exhausted(&self) -> bool {
        matches!(self.downloads_left(), Some(0))
    }

    /// Can this archive be handed over right now?
    ///
    /// Four conditions, and the caller must never re-derive them from two of
    /// them: the run finished, the hold has elapsed, the file has not been
    /// removed, and the retention has not passed.
    pub fn is_downloadable(&self, now: DateTime<Utc>) -> bool {
        self.status == "ready" && !self.file_deleted && now >= self.available_at && now < self.expires_at
    }
}

/// One account inside one export.
#[derive(Debug, Clone, Serialize)]
pub struct ExportSubject {
    pub id: Uuid,
    pub user_id: Option<Uuid>,
    pub user_label: String,
    pub folder: String,
    pub status: String,
    pub size_bytes: Option<i64>,
    pub services_ok: Vec<String>,
    pub services_ko: Vec<String>,
    pub error: Option<String>,
}

impl ExportSubject {
    fn from_row(row: &sqlx::postgres::PgRow) -> Result<Self, sqlx::Error> {
        Ok(Self {
            id: row.try_get("id")?,
            user_id: row.try_get("user_id")?,
            user_label: row.try_get("user_label")?,
            folder: row.try_get("folder")?,
            status: row.try_get("status")?,
            size_bytes: row.try_get("size_bytes")?,
            services_ok: row.try_get("services_ok")?,
            services_ko: row.try_get("services_ko")?,
            error: row.try_get("error")?,
        })
    }
}

/// What the console — or an account asking for its own data — asked for,
/// validated.
pub struct NewExport {
    pub scope: String,
    /// `ORIGIN_ADMIN` or `ORIGIN_SELF`.
    pub origin: &'static str,
    pub services: Vec<String>,
    pub with_instance: bool,
    pub requested_by: Uuid,
    pub actor_label: String,
    pub available_at: DateTime<Utc>,
    pub expires_at: DateTime<Utc>,
    pub destination: String,
    /// Download ceiling of this archive, `None` for no ceiling.
    pub download_limit: Option<i32>,
    /// Per-file ceiling chosen by the requester, `None` to follow the policy.
    pub max_file_mb: Option<i32>,
    /// `(user_id, label, folder)`, folders already made unique by the caller.
    pub subjects: Vec<(Uuid, String, String)>,
}

/// Requested from the administration console, for other accounts.
pub const ORIGIN_ADMIN: &str = "admin";

/// Requested by an account, for itself, from its own settings.
pub const ORIGIN_SELF: &str = "self";

fn truncate(message: &str) -> String {
    if message.len() <= MAX_ERROR_LEN {
        return message.to_string();
    }
    let mut end = MAX_ERROR_LEN;
    while end > 0 && !message.is_char_boundary(end) {
        end -= 1;
    }
    format!("{}…", &message[..end])
}

// ── Creation ─────────────────────────────────────────────────────────────────

/// Opens a run and its subjects, atomically.
///
/// One transaction, deliberately: a run whose subject list is half written would
/// export half an organisation and report success. The whole point of the
/// subjects table is that it says who is in the archive, and a partial answer
/// there is worse than none.
pub async fn create(db: &PgPool, new: &NewExport) -> Result<Uuid, AppError> {
    let mut tx = db.begin().await.map_err(|e| {
        tracing::error!(error = %e, "export: ouverture de transaction impossible");
        AppError::Database(e)
    })?;

    let id: Uuid = sqlx::query_scalar(
        "INSERT INTO core.data_export_runs \
             (scope, origin, services, with_instance, requested_by, actor_label, \
              available_at, expires_at, destination, subjects_total, \
              download_limit, max_file_mb) \
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id",
    )
    .bind(&new.scope)
    .bind(new.origin)
    .bind(&new.services)
    .bind(new.with_instance)
    .bind(new.requested_by)
    .bind(&new.actor_label)
    .bind(new.available_at)
    .bind(new.expires_at)
    .bind(&new.destination)
    .bind(new.subjects.len() as i32)
    .bind(new.download_limit)
    .bind(new.max_file_mb)
    .fetch_one(&mut *tx)
    .await
    .map_err(|e| {
        // The unique index `uq_core_data_export_self_active` lands here when two
        // requests for the same account race. The caller turns it into a
        // sentence; what matters at this level is that the second one never
        // opens a second run.
        tracing::error!(error = %e, origin = %new.origin,
            "export: ouverture d'une exécution impossible");
        match e.as_database_error().and_then(|d| d.constraint()) {
            Some("uq_core_data_export_self_active") => AppError::Conflict(
                "Une demande d'export est déjà en cours pour ce compte".into(),
            ),
            _ => AppError::Database(e),
        }
    })?;

    for (user_id, label, folder) in &new.subjects {
        sqlx::query(
            "INSERT INTO core.data_export_subjects (export_id, user_id, user_label, folder) \
             VALUES ($1, $2, $3, $4)",
        )
        .bind(id)
        .bind(user_id)
        .bind(label)
        .bind(folder)
        .execute(&mut *tx)
        .await
        .map_err(|e| {
            tracing::error!(error = %e, export_id = %id, "export: inscription d'un compte impossible");
            AppError::Database(e)
        })?;
    }

    tx.commit().await.map_err(|e| {
        tracing::error!(error = %e, "export: validation de la transaction impossible");
        AppError::Database(e)
    })?;
    Ok(id)
}

// ── Reads ────────────────────────────────────────────────────────────────────

const RUN_COLUMNS: &str = "id, scope, origin, services, with_instance, requested_by, actor_label, status, \
     requested_at, started_at, finished_at, duration_ms, available_at, expires_at, \
     subjects_total, subjects_done, file_name, destination, size_bytes, entries_count, \
     error, file_deleted, deleted_at, download_count, last_downloaded_at, \
     download_limit, max_file_mb";

pub async fn get(db: &PgPool, id: Uuid) -> Result<Option<ExportRun>, AppError> {
    let row = sqlx::query(&format!(
        "SELECT {RUN_COLUMNS} FROM core.data_export_runs WHERE id = $1"
    ))
    .bind(id)
    .fetch_optional(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, export_id = %id, "export: lecture d'une exécution impossible");
        AppError::Database(e)
    })?;

    row.as_ref()
        .map(ExportRun::from_row)
        .transpose()
        .map_err(|e| {
            tracing::error!(error = %e, "export: décodage d'une exécution impossible");
            AppError::Database(e)
        })
}

/// One **administrative** run, or `None`.
///
/// What the console reads, everywhere it reads one. A personal archive is not an
/// administrative object: it is produced without the alert and without the hold
/// that make an administrative export supervisable, and `core.data_export.read`
/// — held by the read-only administrator out of the box — must therefore not be
/// a way to fetch one. Whoever needs somebody else's data asks for it with
/// `core.data_export.execute`, which tells every administrator and waits.
pub async fn get_admin(db: &PgPool, id: Uuid) -> Result<Option<ExportRun>, AppError> {
    let row = sqlx::query(&format!(
        "SELECT {RUN_COLUMNS} FROM core.data_export_runs WHERE id = $1 AND origin = 'admin'"
    ))
    .bind(id)
    .fetch_optional(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, export_id = %id, "export: lecture d'une exécution impossible");
        AppError::Database(e)
    })?;

    row.as_ref()
        .map(ExportRun::from_row)
        .transpose()
        .map_err(|e| {
            tracing::error!(error = %e, "export: décodage d'une exécution impossible");
            AppError::Database(e)
        })
}

/// One run **owned by** `user_id`, or `None`.
///
/// The read the personal routes use, and the only one they use: the owner is a
/// condition of the query rather than a check performed on the result, so a
/// handler cannot forget it and cannot be given an id belonging to somebody
/// else. `origin` is part of the predicate too — an administrator's archive
/// covering several accounts is not "one's own data" even when the requester
/// happens to be its author.
pub async fn get_own(db: &PgPool, id: Uuid, user_id: Uuid) -> Result<Option<ExportRun>, AppError> {
    let row = sqlx::query(&format!(
        "SELECT {RUN_COLUMNS} FROM core.data_export_runs \
          WHERE id = $1 AND requested_by = $2 AND origin = 'self'"
    ))
    .bind(id)
    .bind(user_id)
    .fetch_optional(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, export_id = %id, "export: lecture d'une demande personnelle impossible");
        AppError::Database(e)
    })?;

    row.as_ref()
        .map(ExportRun::from_row)
        .transpose()
        .map_err(|e| {
            tracing::error!(error = %e, "export: décodage d'une demande personnelle impossible");
            AppError::Database(e)
        })
}

/// The most recent **administrative** runs, newest first.
///
/// Personal requests are excluded for the same reason [`get_admin`] excludes
/// them, plus a practical one: on an instance where everybody exercises their
/// portability right, they would be the entire history and the operator would
/// stop reading it.
pub async fn list(db: &PgPool, limit: i64) -> Result<Vec<ExportRun>, AppError> {
    let limit = limit.clamp(1, 200);
    let rows = sqlx::query(&format!(
        "SELECT {RUN_COLUMNS} FROM core.data_export_runs \
          WHERE origin = 'admin' ORDER BY requested_at DESC LIMIT $1"
    ))
    .bind(limit)
    .fetch_all(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, "export: lecture de l'historique impossible");
        AppError::Database(e)
    })?;

    rows.iter()
        .map(ExportRun::from_row)
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| {
            tracing::error!(error = %e, "export: décodage de l'historique impossible");
            AppError::Database(e)
        })
}

/// The **administrative** run currently pending or under way, if any.
///
/// One administrative export at a time, instance-wide. Not a technical limit —
/// two concurrent exports would work — but a deliberate one: they compete for
/// the same disk and the same modules, and, more to the point, "how many exports
/// are running?" must have an answer an operator can hold in their head while
/// deciding whether the one they are looking at is legitimate.
///
/// Personal requests are deliberately **outside** that count. An archive of one
/// account is small, and letting one person's portability request block the
/// console — or the console block everybody's portability — would make each
/// feature the other's outage.
pub async fn active_admin(db: &PgPool) -> Result<Option<ExportRun>, AppError> {
    active_where(db, "origin = 'admin'", None).await
}

/// The personal request of `user_id` that has not finished, if any.
///
/// The readable half of `uq_core_data_export_self_active`: the index makes two
/// concurrent requests impossible, this makes the refusal a sentence instead of
/// a constraint violation.
pub async fn active_for_user(db: &PgPool, user_id: Uuid) -> Result<Option<ExportRun>, AppError> {
    active_where(db, "origin = 'self' AND requested_by = $1", Some(user_id)).await
}

/// Shared body of the two lookups above. `predicate` is a literal written here,
/// never anything that came from a request.
async fn active_where(
    db: &PgPool,
    predicate: &str,
    bind: Option<Uuid>,
) -> Result<Option<ExportRun>, AppError> {
    let sql = format!(
        "SELECT {RUN_COLUMNS} FROM core.data_export_runs \
          WHERE status IN ('pending', 'running') AND {predicate} \
          ORDER BY requested_at LIMIT 1"
    );
    let query = sqlx::query(&sql);
    let query = match bind {
        Some(id) => query.bind(id),
        None => query,
    };

    let row = query.fetch_optional(db).await.map_err(|e| {
        tracing::error!(error = %e, "export: lecture de l'exécution en cours impossible");
        AppError::Database(e)
    })?;

    row.as_ref()
        .map(ExportRun::from_row)
        .transpose()
        .map_err(|e| {
            tracing::error!(error = %e, "export: décodage de l'exécution en cours impossible");
            AppError::Database(e)
        })
}

/// One account's own requests, newest first.
pub async fn list_own(db: &PgPool, user_id: Uuid, limit: i64) -> Result<Vec<ExportRun>, AppError> {
    let rows = sqlx::query(&format!(
        "SELECT {RUN_COLUMNS} FROM core.data_export_runs \
          WHERE origin = 'self' AND requested_by = $1 \
          ORDER BY requested_at DESC LIMIT $2"
    ))
    .bind(user_id)
    .bind(limit.clamp(1, 50))
    .fetch_all(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, "export: lecture de l'historique personnel impossible");
        AppError::Database(e)
    })?;

    rows.iter()
        .map(ExportRun::from_row)
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| {
            tracing::error!(error = %e, "export: décodage de l'historique personnel impossible");
            AppError::Database(e)
        })
}

/// Every account of a run, in a stable order.
pub async fn subjects(db: &PgPool, export_id: Uuid) -> Result<Vec<ExportSubject>, AppError> {
    let rows = sqlx::query(
        "SELECT id, user_id, user_label, folder, status, size_bytes, services_ok, services_ko, error \
           FROM core.data_export_subjects WHERE export_id = $1 ORDER BY folder",
    )
    .bind(export_id)
    .fetch_all(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, export_id = %export_id, "export: lecture des comptes impossible");
        AppError::Database(e)
    })?;

    rows.iter()
        .map(ExportSubject::from_row)
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| {
            tracing::error!(error = %e, "export: décodage des comptes impossible");
            AppError::Database(e)
        })
}

/// The next accounts still to process, oldest first.
pub async fn pending_subjects(
    db: &PgPool,
    export_id: Uuid,
    limit: i64,
) -> Result<Vec<ExportSubject>, AppError> {
    let rows = sqlx::query(
        "SELECT id, user_id, user_label, folder, status, size_bytes, services_ok, services_ko, error \
           FROM core.data_export_subjects \
          WHERE export_id = $1 AND status = 'pending' ORDER BY folder LIMIT $2",
    )
    .bind(export_id)
    .bind(limit.clamp(1, 100))
    .fetch_all(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, export_id = %export_id, "export: lecture des comptes restants impossible");
        AppError::Database(e)
    })?;

    rows.iter()
        .map(ExportSubject::from_row)
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| {
            tracing::error!(error = %e, "export: décodage des comptes restants impossible");
            AppError::Database(e)
        })
}

// ── Transitions ──────────────────────────────────────────────────────────────

/// Moves a `pending` run to `running`. Returns `false` when somebody else got
/// there first, or when the run was cancelled in between — which is how a
/// cancellation during the hold actually stops the work.
pub async fn start(db: &PgPool, id: Uuid) -> Result<bool, AppError> {
    let done = sqlx::query(
        "UPDATE core.data_export_runs SET status = 'running', started_at = COALESCE(started_at, NOW()) \
          WHERE id = $1 AND status = 'pending'",
    )
    .bind(id)
    .execute(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, export_id = %id, "export: démarrage impossible");
        AppError::Database(e)
    })?;
    Ok(done.rows_affected() == 1)
}

/// Closes one account, and moves the run's counter in the same statement pair.
#[allow(clippy::too_many_arguments)]
pub async fn finish_subject(
    db: &PgPool,
    export_id: Uuid,
    subject_id: Uuid,
    status: &str,
    size_bytes: u64,
    services_ok: &[String],
    services_ko: &[String],
    error: Option<&str>,
) -> Result<(), AppError> {
    let mut tx = db.begin().await.map_err(|e| {
        tracing::error!(error = %e, "export: ouverture de transaction impossible");
        AppError::Database(e)
    })?;

    sqlx::query(
        "UPDATE core.data_export_subjects \
            SET status = $2, size_bytes = $3, services_ok = $4, services_ko = $5, \
                error = $6, finished_at = NOW() \
          WHERE id = $1",
    )
    .bind(subject_id)
    .bind(status)
    .bind(size_bytes.min(i64::MAX as u64) as i64)
    .bind(services_ok)
    .bind(services_ko)
    .bind(error.map(truncate))
    .execute(&mut *tx)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, subject_id = %subject_id, "export: clôture d'un compte impossible");
        AppError::Database(e)
    })?;

    // Recounted from the subjects rather than incremented: an increment is
    // wrong the first time a job is retried after a crash, and the progress
    // figure is what an operator uses to decide whether to wait or to cancel.
    sqlx::query(
        "UPDATE core.data_export_runs r \
            SET subjects_done = (SELECT COUNT(*) FROM core.data_export_subjects s \
                                  WHERE s.export_id = r.id AND s.status <> 'pending') \
          WHERE r.id = $1",
    )
    .bind(export_id)
    .execute(&mut *tx)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, export_id = %export_id, "export: mise à jour de l'avancement impossible");
        AppError::Database(e)
    })?;

    tx.commit().await.map_err(|e| {
        tracing::error!(error = %e, "export: validation de la transaction impossible");
        AppError::Database(e)
    })?;
    Ok(())
}

/// Closes a run as ready. The archive exists; the hold decides when it can be
/// fetched.
pub async fn succeed(
    db: &PgPool,
    id: Uuid,
    file_name: &str,
    size_bytes: u64,
    entries: usize,
    duration_ms: i64,
) -> Result<(), AppError> {
    sqlx::query(
        "UPDATE core.data_export_runs \
            SET status = 'ready', finished_at = NOW(), duration_ms = $2, \
                file_name = $3, size_bytes = $4, entries_count = $5, error = NULL \
          WHERE id = $1 AND status = 'running'",
    )
    .bind(id)
    .bind(duration_ms.max(0))
    .bind(file_name)
    .bind(size_bytes.min(i64::MAX as u64) as i64)
    .bind(entries.min(i32::MAX as usize) as i32)
    .execute(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, export_id = %id, "export: clôture d'une exécution réussie impossible");
        AppError::Database(e)
    })?;
    Ok(())
}

/// Closes a run as failed.
pub async fn fail(db: &PgPool, id: Uuid, error: &str, duration_ms: i64) -> Result<(), AppError> {
    sqlx::query(
        "UPDATE core.data_export_runs \
            SET status = 'failed', finished_at = NOW(), duration_ms = $2, error = $3 \
          WHERE id = $1 AND status IN ('pending', 'running')",
    )
    .bind(id)
    .bind(duration_ms.max(0))
    .bind(truncate(error))
    .execute(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, export_id = %id, "export: clôture d'une exécution en échec impossible");
        AppError::Database(e)
    })?;
    Ok(())
}

/// Cancels a run that has not finished. Returns `false` when it was already
/// closed — a cancellation that arrives one second late must say so rather than
/// pretend to have stopped something.
pub async fn cancel(db: &PgPool, id: Uuid, reason: &str) -> Result<bool, AppError> {
    let done = sqlx::query(
        "UPDATE core.data_export_runs \
            SET status = 'cancelled', finished_at = NOW(), error = $2, \
                file_deleted = TRUE, deleted_at = NOW() \
          WHERE id = $1 AND status IN ('pending', 'running')",
    )
    .bind(id)
    .bind(truncate(reason))
    .execute(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, export_id = %id, "export: annulation impossible");
        AppError::Database(e)
    })?;
    Ok(done.rows_affected() == 1)
}

/// Records that the archive of a finished run is gone, and why.
///
/// `status` moves to `expired` when the retention pass removed it, and stays
/// `ready` when an operator did: "it aged out" and "somebody deleted it" are
/// different facts and the history has to keep both.
pub async fn mark_file_deleted(db: &PgPool, id: Uuid, expired: bool) -> Result<(), AppError> {
    sqlx::query(
        "UPDATE core.data_export_runs \
            SET file_deleted = TRUE, deleted_at = NOW(), \
                status = CASE WHEN $2 AND status = 'ready' THEN 'expired' ELSE status END \
          WHERE id = $1",
    )
    .bind(id)
    .bind(expired)
    .execute(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, export_id = %id, "export: marquage de suppression impossible");
        AppError::Database(e)
    })?;
    Ok(())
}

/// Records a download. Best-effort by design: a counter that could not be
/// written must never prevent the archive from being served — the operator has
/// the right to it, and the audit entry is written on the other side of this
/// call whatever happens here.
pub async fn record_download(db: &PgPool, id: Uuid, by: Uuid) {
    if let Err(e) = sqlx::query(
        "UPDATE core.data_export_runs \
            SET download_count = download_count + 1, last_downloaded_at = NOW(), \
                last_downloaded_by = $2 \
          WHERE id = $1",
    )
    .bind(id)
    .bind(by)
    .execute(db)
    .await
    {
        tracing::error!(error = %e, export_id = %id, "export: compteur de téléchargement non écrit");
    }
}

/// Claims one download **against the ceiling**, atomically.
///
/// Returns the number of downloads left afterwards, or `None` when the ceiling
/// was already reached — in which case nothing was written and the caller must
/// refuse.
///
/// Deliberately not the best-effort [`record_download`]: that one may fail
/// silently because an administrator's right to their archive must not depend on
/// a counter, whereas here the counter **is** the rule. Expressed as a single
/// conditional `UPDATE` rather than a read followed by a write, because two tabs
/// pressing the button at the same moment is the ordinary case, not the exotic
/// one.
pub async fn claim_download(
    db: &PgPool,
    id: Uuid,
    by: Uuid,
) -> Result<Option<i32>, AppError> {
    let left: Option<i32> = sqlx::query_scalar(
        "UPDATE core.data_export_runs \
            SET download_count = download_count + 1, last_downloaded_at = NOW(), \
                last_downloaded_by = $2 \
          WHERE id = $1 \
            AND (download_limit IS NULL OR download_count < download_limit) \
        RETURNING GREATEST(COALESCE(download_limit, 2147483647) - download_count, 0)",
    )
    .bind(id)
    .bind(by)
    .fetch_optional(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, export_id = %id, "export: décompte de téléchargement impossible");
        AppError::Database(e)
    })?;
    Ok(left)
}

/// Runs whose archive is past its date and still on the disk.
pub async fn expired_files(db: &PgPool) -> Result<Vec<(Uuid, String, String)>, AppError> {
    let rows: Vec<(Uuid, String, String)> = sqlx::query_as(
        "SELECT id, destination, file_name FROM core.data_export_runs \
          WHERE status = 'ready' AND file_deleted = FALSE AND expires_at <= NOW() \
            AND destination IS NOT NULL AND file_name IS NOT NULL",
    )
    .fetch_all(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, "export: lecture des archives expirées impossible");
        AppError::Database(e)
    })?;
    Ok(rows)
}

/// Closes rows left `running` by a process that died mid-export.
///
/// The equivalent of [`crate::backup::runs::close_stalled`]: without it, the
/// console would report an export in progress for a process that stopped last
/// month, and the "one at a time" guard would refuse every new request for ever.
pub async fn close_stalled(db: &PgPool) -> Result<u64, AppError> {
    let rows = sqlx::query(
        "UPDATE core.data_export_runs \
            SET status = 'failed', finished_at = NOW(), \
                file_deleted = TRUE, deleted_at = NOW(), \
                error = 'Export interrompu (processus arrêté en cours d''exécution)' \
          WHERE status IN ('pending', 'running') \
            AND requested_at < NOW() - make_interval(hours => $1::int)",
    )
    .bind(STALE_RUN_HOURS as i32)
    .execute(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, "export: reprise des exécutions interrompues impossible");
        AppError::Database(e)
    })?;
    Ok(rows.rows_affected())
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::TimeZone;

    fn at(d: u32) -> DateTime<Utc> {
        Utc.with_ymd_and_hms(2026, 8, d, 12, 0, 0)
            .single()
            .expect("date de test valide")
    }

    fn run(status: &str, deleted: bool) -> ExportRun {
        ExportRun {
            id: Uuid::nil(),
            scope: "instance".into(),
            origin: ORIGIN_ADMIN.into(),
            services: vec!["core".into()],
            with_instance: true,
            requested_by: None,
            actor_label: None,
            status: status.into(),
            requested_at: at(10),
            started_at: None,
            finished_at: None,
            duration_ms: None,
            available_at: at(12),
            expires_at: at(19),
            subjects_total: 1,
            subjects_done: 1,
            file_name: Some("kubuno-export.zip".into()),
            destination: Some("/var/lib/kubuno/exports".into()),
            size_bytes: Some(10),
            entries_count: Some(3),
            error: None,
            file_deleted: deleted,
            deleted_at: None,
            download_count: 0,
            last_downloaded_at: None,
            download_limit: None,
            max_file_mb: None,
        }
    }

    /// The four conditions of a download, each tested alone: this is the guard
    /// that stands between a stolen session and every account's data.
    #[test]
    fn an_archive_is_downloadable_only_inside_its_window() {
        let ready = run("ready", false);
        assert!(!ready.is_downloadable(at(11)), "avant la mise à disposition");
        assert!(ready.is_downloadable(at(12)), "à l'heure exacte");
        assert!(ready.is_downloadable(at(18)), "pendant la fenêtre");
        assert!(!ready.is_downloadable(at(19)), "à l'expiration");
        assert!(!ready.is_downloadable(at(20)), "après l'expiration");

        assert!(!run("ready", true).is_downloadable(at(15)), "fichier supprimé");
        assert!(!run("running", false).is_downloadable(at(15)), "non terminé");
        assert!(!run("failed", false).is_downloadable(at(15)), "en échec");
        assert!(!run("cancelled", false).is_downloadable(at(15)), "annulé");
    }

    /// The ceiling of a personal archive: what the interface displays, and what
    /// the download route refuses on. An administrator's archive has none.
    #[test]
    fn the_download_ceiling_counts_down_and_stops_at_zero() {
        let mut r = run("ready", false);
        assert_eq!(r.downloads_left(), None, "pas de plafond côté administration");
        assert!(!r.download_exhausted());

        r.download_limit = Some(5);
        assert_eq!(r.downloads_left(), Some(5));
        r.download_count = 3;
        assert_eq!(r.downloads_left(), Some(2));
        r.download_count = 5;
        assert_eq!(r.downloads_left(), Some(0));
        assert!(r.download_exhausted());

        // A ceiling lowered by hand under an already higher counter must read as
        // "none left", never as a negative number on screen.
        r.download_count = 9;
        assert_eq!(r.downloads_left(), Some(0));
        assert!(r.download_exhausted());
    }

    #[test]
    fn a_long_error_is_cut_on_a_character_boundary() {
        let long = "é".repeat(4_000);
        let out = truncate(&long);
        assert!(out.len() <= MAX_ERROR_LEN + 4);
        assert!(out.ends_with('…'));
        assert_eq!(truncate("court"), "court");
    }
}
