-- Runtime pieces of the background job runner (see crate::jobs).
--
-- `core.jobs` exists since migration 000005 and had no consumer at all. Two
-- things were missing to make it usable:
--   1. a wake-up signal, so a runner does not have to poll aggressively;
--   2. the settings that tune the runner from the admin panel.

-- Wake-up: every INSERT notifies the runners. The payload carries the job type
-- for observability only — a listener never trusts it, it re-queries the table
-- with FOR UPDATE SKIP LOCKED to decide what it may run.
--
-- NOTIFY is delivered at COMMIT, so a runner never sees a job it cannot yet
-- claim. A notification emitted while a listener is reconnecting IS LOST: the
-- runner's periodic poll is the safety net, this trigger only cuts latency.
CREATE OR REPLACE FUNCTION core.jobs_notify() RETURNS TRIGGER AS $$
BEGIN
    PERFORM pg_notify('kubuno_jobs', NEW.job_type);
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS jobs_notify_insert ON core.jobs;
CREATE TRIGGER jobs_notify_insert
    AFTER INSERT ON core.jobs
    FOR EACH ROW
    WHEN (NEW.status = 'pending')
    EXECUTE FUNCTION core.jobs_notify();

-- Claiming filters on job_type as well as status/run_after (a runner only
-- claims the types it has a handler for).
CREATE INDEX IF NOT EXISTS idx_core_jobs_claim
    ON core.jobs (job_type, run_after) WHERE status = 'pending';
-- Crash recovery scans the jobs left running by a dead process.
CREATE INDEX IF NOT EXISTS idx_core_jobs_running
    ON core.jobs (started_at) WHERE status = 'running';

INSERT INTO core.settings (key, value, category, label, description, is_public) VALUES
    ('jobs.concurrency',     '4',    'jobs', 'Tâches de fond en parallèle',
     'Nombre de tâches exécutées simultanément par le serveur.', FALSE),
    ('jobs.poll_interval_s', '5',    'jobs', 'Sondage de la file (secondes)',
     'Filet de sécurité si une notification PostgreSQL est perdue.', FALSE),
    ('jobs.stalled_after_s', '1800', 'jobs', 'Délai de reprise après incident (secondes)',
     'Une tâche « en cours » depuis plus longtemps est considérée orpheline et remise en file.', FALSE),
    ('jobs.job_timeout_s',   '900',  'jobs', 'Durée maximale d''une tâche (secondes)',
     'Au-delà, la tâche est interrompue et retentée.', FALSE)
ON CONFLICT (key) DO NOTHING;
