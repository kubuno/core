-- Backup policy: the schedule, the run history, and the two privileges that
-- govern them.
--
-- ## Why this migration exists
--
-- The core shipped `kubuno db:backup` and nothing that ran it. The health check
-- `continuity.backup` said so honestly — a permanent `Blocked` reading "no
-- policy, manual command only" — because a setting nothing reads is worse than
-- no setting at all: it turns the indicator green while the instance is still
-- one disk failure away from total loss.
--
-- What was missing was never the setting. It was the scheduler, the execution
-- and, above all, the RECORD: a backup nobody can prove ran is not a backup.
-- This migration adds the record; `crate::backup` adds the rest, as a job type
-- of the runner that already exists (`core.jobs`).
--
-- ## What the backup covers, stated here so the schema cannot outlive the claim
--
-- The dump written by `core.backup.run` contains **the data of the PostgreSQL
-- schema `core`, and nothing else**:
--
--   * NOT the stored files (`storage.local_path`, S3 objects) — the bytes users
--     uploaded are not in the database and are not copied;
--   * NOT the schemas of the installed modules (drive, calendar, mail…) — each
--     module owns its own schema and its own backup story;
--   * NOT the DDL — the dump is data-only and is restored onto an instance that
--     has already run its migrations;
--   * NOT the configuration file — which is where the JWT and internal secrets
--     live, and which is deliberately never copied into a file on disk.
--
-- Every one of those exclusions is repeated on screen. A partial backup
-- presented as a complete one is worse than none, because it is the one an
-- operator stops worrying about.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. The run history
-- ─────────────────────────────────────────────────────────────────────────────
--
-- One row per attempt, opened before the work starts and closed after it ends.
-- Opening it first is the whole point: a process killed mid-dump leaves a
-- `running` row that is visibly stuck, where a row written only on success would
-- leave no trace at all and the console would report "never run" — the exact
-- lie this feature exists to stop telling.
--
-- `trigger_kind` and not `trigger`: TRIGGER is a reserved word, and a column
-- that needs quoting everywhere is a column somebody eventually mis-quotes.
CREATE TABLE core.backup_runs (
    id            UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),

    trigger_kind  VARCHAR(20)  NOT NULL CHECK (trigger_kind IN ('scheduled', 'manual')),
    -- Who asked for it. NULL for a scheduled run — nobody did, the clock did.
    -- `ON DELETE SET NULL` keeps the history readable after the account is gone;
    -- `actor_label` is the denormalised name so a deleted account still reads as
    -- something other than "unknown".
    triggered_by  UUID         REFERENCES core.users(id) ON DELETE SET NULL,
    actor_label   VARCHAR(255),

    status        VARCHAR(20)  NOT NULL DEFAULT 'running'
                                   CHECK (status IN ('running', 'success', 'failed')),
    started_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    finished_at   TIMESTAMPTZ,
    duration_ms   BIGINT       CHECK (duration_ms IS NULL OR duration_ms >= 0),

    -- Base name only, never an absolute path, and never anything derived from a
    -- credential: `kubuno-core-20260804T031500Z.sql`. The directory it landed in
    -- is `destination`, kept separately so a policy change is visible in the
    -- history instead of silently rewriting where old files are believed to be.
    file_name     VARCHAR(255),
    destination   TEXT,
    size_bytes    BIGINT       CHECK (size_bytes IS NULL OR size_bytes >= 0),
    tables_count  INTEGER      CHECK (tables_count IS NULL OR tables_count >= 0),
    rows_count    BIGINT       CHECK (rows_count IS NULL OR rows_count >= 0),

    -- Why it failed, in the operator's words. Truncated by the writer; it never
    -- carries a connection string or a password — the dump code has no access to
    -- either, and the message is composed from the failing step, not the input.
    error         TEXT,

    -- The file this run produced has since been removed by the retention pass.
    -- The row stays: "a backup ran that day" is a different fact from "the file
    -- is still there", and conflating them is how an operator discovers the
    -- window is shorter than they thought at the worst possible moment.
    file_pruned   BOOLEAN      NOT NULL DEFAULT FALSE,

    CONSTRAINT backup_run_closure_coherent CHECK (
        (status =  'running' AND finished_at IS NULL)
     OR (status <> 'running' AND finished_at IS NOT NULL)
    )
);

COMMENT ON TABLE core.backup_runs IS
    'One row per backup attempt of the core schema. Written by core.backup.run.';

CREATE INDEX idx_core_backup_runs_started ON core.backup_runs (started_at DESC);
-- The one query the health check and the alert producer both run: "when did a
-- backup last actually succeed?".
CREATE INDEX idx_core_backup_runs_success
    ON core.backup_runs (finished_at DESC) WHERE status = 'success';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Privileges
-- ─────────────────────────────────────────────────────────────────────────────
--
-- Two keys rather than a reuse of `core.settings.*`. Running a backup writes a
-- file containing every account, every hash and every setting of the instance:
-- that is a narrower thing to be trusted with than "may edit a setting", and it
-- deserves to be named. Neither is OU-scopable — a backup is an instance fact
-- and cannot be confined to a subtree.
INSERT INTO core.privileges (key, namespace, domain, verb, label, description, is_ou_scopable) VALUES
    ('core.backup.read',   'core', 'backup', 'read',   'Consulter les sauvegardes',
     'Lire la politique de sauvegarde, l''historique des exécutions et l''état de la dernière.', FALSE),
    ('core.backup.manage', 'core', 'backup', 'manage', 'Déclencher une sauvegarde',
     'Lancer une sauvegarde immédiate et déclarer qu''une restauration a été testée. Modifier la politique reste régi par core.settings.manage.', FALSE)
ON CONFLICT (key) DO NOTHING;

-- The read-only administrator holds every `read` key of the catalogue; the
-- seeding query of migration 000044 ran long before this one existed, so the
-- grant is explicit here (same as `core.storage.read` in 000075).
INSERT INTO core.role_privileges (role_id, privilege_key)
SELECT r.id, 'core.backup.read'
  FROM core.roles r
 WHERE r.slug = 'read-only-admin'
ON CONFLICT DO NOTHING;

-- The service administrator runs the instance: they already hold
-- `core.settings.*` and the mail relay, and continuity is squarely their job.
INSERT INTO core.role_privileges (role_id, privilege_key)
SELECT r.id, k
  FROM core.roles r,
       unnest(ARRAY['core.backup.read', 'core.backup.manage']) AS k
 WHERE r.slug = 'service-admin'
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. The policy
-- ─────────────────────────────────────────────────────────────────────────────
--
-- Five knobs, and not one more. Each is read by `crate::backup::policy`; a sixth
-- that nothing read is exactly the thing two previous attempts refused to add.
--
-- `backup.enabled` defaults to FALSE on purpose. Switching a scheduler on at
-- migration time, writing gigabytes to a directory the operator never chose,
-- would be a surprise with a disk-full at the end of it. The health check says
-- loudly that it is off; that is the honest default.
INSERT INTO core.settings (key, value, default_value, category, label, description, is_public, value_type) VALUES
    ('backup.enabled', 'false', 'false', 'backup', 'Sauvegarde automatique activée',
     'Planifie une sauvegarde des données du schéma « core » selon la fréquence choisie. Ne sauvegarde ni les fichiers stockés, ni les schémas des modules installés.',
     FALSE, 'bool'),

    ('backup.destination', '"/var/backups/kubuno"', '"/var/backups/kubuno"', 'backup',
     'Répertoire de destination',
     'Chemin absolu où les fichiers sont écrits. Créé au besoin, avec des droits restreints (0700) : un fichier de sauvegarde contient les empreintes de tous les mots de passe de l''instance.',
     FALSE, 'string'),

    ('backup.retention_count', '7', '7', 'backup', 'Sauvegardes conservées',
     'Après chaque exécution réussie, les fichiers les plus anciens au-delà de ce nombre sont supprimés. Seuls les fichiers produits par cette politique sont concernés.',
     FALSE, 'int'),

    ('backup.hour_utc', '3', '3', 'backup', 'Heure d''exécution (UTC)',
     'Heure de déclenchement, exprimée en temps universel (UTC) : le core n''a pas de fuseau d''instance.',
     FALSE, 'int'),

    -- The last declarative fact of the feature: an operator saying "I restored
    -- one, it worked". Nothing verifies it and the screen says so. It is still
    -- worth recording, because the alternative is a reference framework asking
    -- "have you tested a restore?" and the product having no answer at all.
    ('backup.last_restore_test_at', 'null', 'null', 'backup',
     'Dernière restauration testée (déclarative)',
     'Horodatage déclaré par un administrateur ayant restauré une sauvegarde ailleurs. Purement déclaratif : la plateforme ne vérifie rien et ne restaure jamais d''elle-même.',
     FALSE, NULL)
ON CONFLICT (key) DO NOTHING;

-- The frequency is a closed set, declared as such so the API refuses anything
-- else before it reaches the scheduler. `weekly` runs on Sunday at the same
-- hour — stated in the description rather than made into a sixth setting.
INSERT INTO core.settings (key, value, default_value, category, label, description, is_public, value_type, allowed_values) VALUES
    ('backup.frequency', '"daily"', '"daily"', 'backup', 'Fréquence',
     'Quotidienne, ou hebdomadaire — le dimanche à l''heure choisie.',
     FALSE, 'enum', '["daily", "weekly"]'::jsonb)
ON CONFLICT (key) DO NOTHING;
