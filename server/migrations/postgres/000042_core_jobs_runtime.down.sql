DELETE FROM core.settings WHERE key IN (
    'jobs.concurrency', 'jobs.poll_interval_s', 'jobs.stalled_after_s', 'jobs.job_timeout_s'
);
DROP INDEX IF EXISTS core.idx_core_jobs_running;
DROP INDEX IF EXISTS core.idx_core_jobs_claim;
DROP TRIGGER IF EXISTS jobs_notify_insert ON core.jobs;
DROP FUNCTION IF EXISTS core.jobs_notify();
