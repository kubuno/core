//! The daily sample the storage trend is drawn from.
//!
//! ## Why a stored sample rather than a derived series
//!
//! Every other trend in the console is counted from an events table: sign-ups
//! are rows of `core.users` grouped by `created_at`. Consumption has no such
//! table — `core.users.used_bytes` is a **level**, overwritten in place by
//! whichever module stored the bytes. A level that is only ever overwritten has
//! no past to reconstruct, so the past has to be written down as it happens.
//!
//! ## One row per day, upserted
//!
//! The sampler runs from the alert-centre pass, i.e. every few minutes. It
//! refines the row for the day it is in rather than appending: a core restarted
//! five times in an afternoon still leaves exactly one point on the curve, and
//! two core processes sampling at once settle on the same row instead of
//! racing. The value kept for a day is therefore its **last** reading, which is
//! the honest one — a curve of daily maxima would report peaks the instance was
//! never at when somebody looked.
//!
//! ## Gaps are left as gaps
//!
//! A core that was switched off for a week writes no points for that week. The
//! console draws what was measured and nothing else: interpolating the missing
//! days would put growth on a chart that nobody observed, in the one place an
//! operator goes to decide whether to buy a disk.

use sqlx::PgPool;

use crate::errors::AppError;

/// Writes (or refreshes) today's point.
///
/// Never fails the caller's own work: the alert scan calls it and logs the
/// error, because a missing point on a curve is not worth losing an alert over.
pub async fn capture(db: &PgPool) -> Result<(), AppError> {
    sqlx::query(
        r#"INSERT INTO core.storage_samples (day, used_bytes, quota_bytes, accounts, over_quota, captured_at)
           SELECT CURRENT_DATE,
                  COALESCE(SUM(used_bytes), 0)::bigint,
                  COALESCE(SUM(quota_bytes), 0)::bigint,
                  COUNT(*)::int,
                  COUNT(*) FILTER (WHERE quota_bytes > 0 AND used_bytes >= quota_bytes)::int,
                  NOW()
             FROM core.users
           ON CONFLICT (day) DO UPDATE
               SET used_bytes  = EXCLUDED.used_bytes,
                   quota_bytes = EXCLUDED.quota_bytes,
                   accounts    = EXCLUDED.accounts,
                   over_quota  = EXCLUDED.over_quota,
                   captured_at = EXCLUDED.captured_at"#,
    )
    .execute(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, "storage: échantillon quotidien non enregistré");
        AppError::Database(e)
    })?;

    Ok(())
}
