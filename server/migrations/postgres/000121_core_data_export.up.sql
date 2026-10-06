-- Data export: the archive of what the instance holds about its accounts, the
-- record of every one that was produced, and the two privileges that govern it.
--
-- ## Why this exists, and why it is not the backup
--
-- Migration 000085 gave the instance a BACKUP: a data-only dump of the `core`
-- schema, in the text format `psql` restores, written for one reader — the
-- operator putting the instance back together at 3 a.m. It covers the core
-- schema and deliberately nothing else.
--
-- This is the opposite errand. An EXPORT is for a human: an organisation
-- leaving, an account exercising its right to portability, an auditor asking
-- what is held about someone. It is organised by ACCOUNT rather than by table,
-- it reaches into the MODULES (which the backup never does), it carries no
-- password hash at all — and it is produced on demand rather than on a schedule.
--
-- The two features share a job runner and nothing else. Merging them would give
-- the restore path a format nobody can restore, and the portability path a file
-- full of hashes.
--
-- ## Why an export is a high-risk operation, stated here so the schema shows it
--
-- One archive concentrates everything the instance knows about everyone. That
-- makes "run an export" a more dangerous verb than any single administrative
-- write, and the schema below carries three counter-measures that a table of
-- run history would not normally have:
--
--   * `available_at` — the archive exists but CANNOT be downloaded before it.
--     A hold (48 h by default) is the whole defence against a stolen
--     administrator session: the thief triggers the export, every other
--     administrator is alerted the same second, and the file only becomes
--     reachable two days later — by which time the session is gone and the run
--     has been cancelled.
--   * `expires_at` — the archive is deleted by the retention pass, whether or
--     not anybody downloaded it. An export left on the disk for ever is a second
--     copy of the instance with none of its access control.
--   * `download_count` / `last_downloaded_at` — an archive that was fetched
--     three times from two addresses is a fact somebody must be able to read
--     after the incident.
--
-- ## What the archive contains, stated here so the schema cannot outlive it
--
-- Included: the core's own record of each account (profile, group and unit
-- memberships, roles, devices, the audit trail of what THEY did), the
-- instance-level referentials when the scope asks for them (accounts, groups,
-- organisational units, settings, audit trail), and — for every installed module
-- that implements the export contract — that module's data for that account.
--
-- NEVER included, and enforced in `crate::data_export`, not merely promised
-- here: password hashes, refresh/verification token hashes, API tokens, TOTP
-- secrets and backup codes, OAuth client secrets, the SMTP password, the JWT and
-- internal secrets. An export is read by a human on a laptop; a credential that
-- reaches it has left the instance for good.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. The runs
-- ─────────────────────────────────────────────────────────────────────────────
--
-- One row per export, opened when the console asks and closed when the archive
-- is complete — the same discipline as `core.backup_runs`: a record written
-- only on success cannot tell "nothing ran" from "something ran and died", and
-- for THIS feature the second case means a partial archive sitting on a disk.
CREATE TABLE core.data_export_runs (
    id             UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- What was asked for. `instance` covers every active account plus the
    -- instance-level referentials; `accounts` covers the listed accounts only.
    -- The single-account portability request is an `accounts` scope of one — the
    -- same machinery, deliberately, so the narrow errand can never drift from
    -- the wide one.
    scope          VARCHAR(20)  NOT NULL CHECK (scope IN ('instance', 'accounts')),

    -- Which services the operator kept. `core` is always present (an export
    -- without the account itself is not an export); the rest are module ids, as
    -- the modules themselves declared them. Stored as given so the history keeps
    -- saying what was exported even after a module is uninstalled.
    services       TEXT[]       NOT NULL DEFAULT '{}',

    -- Whether the instance-level referentials were included. Independent of the
    -- scope: an `accounts` export may legitimately carry the org chart, and an
    -- `instance` export may legitimately be restricted to the accounts.
    with_instance  BOOLEAN      NOT NULL DEFAULT FALSE,

    -- Who asked. Never NULL — unlike a backup, an export is never triggered by
    -- a clock. `ON DELETE SET NULL` keeps the history readable after the account
    -- is gone, and `actor_label` is the denormalised name so a deleted account
    -- still reads as something other than "unknown".
    requested_by   UUID         REFERENCES core.users(id) ON DELETE SET NULL,
    actor_label    VARCHAR(255),

    status         VARCHAR(20)  NOT NULL DEFAULT 'pending'
                                    CHECK (status IN ('pending', 'running', 'ready',
                                                      'failed', 'cancelled', 'expired')),

    requested_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    started_at     TIMESTAMPTZ,
    finished_at    TIMESTAMPTZ,
    duration_ms    BIGINT       CHECK (duration_ms IS NULL OR duration_ms >= 0),

    -- The hold. Set when the run is created, from `data_export.hold_hours`, and
    -- never recomputed: extending or shortening the policy must not move the
    -- deadline of an export already in flight, in either direction.
    available_at   TIMESTAMPTZ  NOT NULL,
    -- When the retention pass deletes the file. Also set at creation, from
    -- `available_at` plus `data_export.retention_days`, for the same reason.
    expires_at     TIMESTAMPTZ  NOT NULL,

    -- Progress, as two integers rather than a percentage: a bar that says "62 %"
    -- and nothing else cannot tell a slow export from a stuck one, and the
    -- operator's real question is "how many accounts are left".
    subjects_total INTEGER      NOT NULL DEFAULT 0 CHECK (subjects_total >= 0),
    subjects_done  INTEGER      NOT NULL DEFAULT 0 CHECK (subjects_done  >= 0),

    -- Base name only, never an absolute path: `kubuno-export-20260814T103000Z-
    -- 3f2a.zip`. The directory it landed in is `destination`, kept separately so
    -- a policy change shows up in the history instead of silently rewriting
    -- where old archives are believed to be.
    file_name      VARCHAR(255),
    destination    TEXT,
    size_bytes     BIGINT       CHECK (size_bytes IS NULL OR size_bytes >= 0),
    -- Entries written into the archive. Read by the console as "is there
    -- anything in there at all?", which a byte count alone does not answer for a
    -- compressed file.
    entries_count  INTEGER      CHECK (entries_count IS NULL OR entries_count >= 0),

    -- Why it failed, in the operator's words. Composed from the failing step,
    -- never from an input, and never carrying a path outside `destination`.
    error          TEXT,

    -- The archive has been removed — by the retention pass, by an operator, or
    -- by the cancellation of a run already under way. The row stays: "an export
    -- of everyone was produced on that day" is a fact that must outlive the file
    -- by a long way, and it is the only one an investigation starts from.
    file_deleted   BOOLEAN      NOT NULL DEFAULT FALSE,
    deleted_at     TIMESTAMPTZ,

    -- Who fetched it, and how often. An archive downloaded three times is not
    -- the same event as one downloaded once.
    download_count      INTEGER     NOT NULL DEFAULT 0 CHECK (download_count >= 0),
    last_downloaded_at  TIMESTAMPTZ,
    last_downloaded_by  UUID        REFERENCES core.users(id) ON DELETE SET NULL,

    CONSTRAINT data_export_closure_coherent CHECK (
        (status IN ('pending', 'running') AND finished_at IS NULL)
     OR (status NOT IN ('pending', 'running') AND finished_at IS NOT NULL)
    ),
    -- The hold cannot be after the deletion, or the archive would expire without
    -- ever having been reachable — a feature that produces nothing but disk
    -- usage. Checked here because both values are computed once, at creation.
    CONSTRAINT data_export_window_ordered CHECK (expires_at > available_at)
);

COMMENT ON TABLE core.data_export_runs IS
    'One row per data-export request. Written by crate::data_export; the archive it '
    'describes is deleted at expires_at while the row is kept.';

CREATE INDEX idx_core_data_export_requested ON core.data_export_runs (requested_at DESC);
-- The query the retention pass runs: which archives are past their date and
-- still on the disk?
CREATE INDEX idx_core_data_export_expiring
    ON core.data_export_runs (expires_at)
    WHERE file_deleted = FALSE AND status = 'ready';
-- The guard on "is an export already under way?", asked before every request.
CREATE INDEX idx_core_data_export_active
    ON core.data_export_runs (requested_at)
    WHERE status IN ('pending', 'running');

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. The subjects
-- ─────────────────────────────────────────────────────────────────────────────
--
-- One row per account in one export. Three reasons it is a table rather than a
-- JSON column on the run:
--
--   1. **Resumption.** The export job processes a handful of accounts and
--      re-enqueues itself, so it never approaches `jobs.job_timeout_s`. It needs
--      to ask "which account is next?" without rewriting a JSON document under
--      concurrent readers.
--   2. **Partial failure is the normal case.** A module that is down must not
--      abort the export of the other twenty accounts. The failure is recorded
--      against the account it happened on, ends up in the archive's manifest,
--      and the operator can see exactly what is missing from the file they are
--      about to hand over.
--   3. **It is the answer to "whose data left".** After an incident, the
--      question is never "was there an export" — the run row says that — it is
--      "which accounts were in it", and a list that is queryable is the
--      difference between an answer and an afternoon.
CREATE TABLE core.data_export_subjects (
    id           UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    export_id    UUID         NOT NULL REFERENCES core.data_export_runs(id) ON DELETE CASCADE,

    -- The account. `ON DELETE SET NULL` rather than a cascade: an export that
    -- included somebody who has since been erased is precisely the row an
    -- investigation needs, and `user_label` is what keeps it readable.
    user_id      UUID         REFERENCES core.users(id) ON DELETE SET NULL,
    user_label   VARCHAR(255) NOT NULL,
    -- Folder this account received in the archive. Stored rather than re-derived
    -- so the manifest, the history and the file agree for ever — a username can
    -- change the day after the export.
    folder       VARCHAR(255) NOT NULL,

    status       VARCHAR(20)  NOT NULL DEFAULT 'pending'
                                  CHECK (status IN ('pending', 'done', 'partial', 'failed')),
    size_bytes   BIGINT       CHECK (size_bytes IS NULL OR size_bytes >= 0),
    -- Which services actually produced something for this account, and which
    -- ones could not. Two arrays rather than one status: "the calendar module
    -- was unreachable" and "this account has no calendar" are opposite facts and
    -- the person receiving the archive has to be able to tell them apart.
    services_ok  TEXT[]       NOT NULL DEFAULT '{}',
    services_ko  TEXT[]       NOT NULL DEFAULT '{}',
    error        TEXT,
    finished_at  TIMESTAMPTZ,

    CONSTRAINT data_export_subject_unique UNIQUE (export_id, user_id)
);

COMMENT ON TABLE core.data_export_subjects IS
    'One account inside one export: its folder in the archive and what each service produced.';

-- The claim query of the export job: the next account still to process.
CREATE INDEX idx_core_data_export_subjects_pending
    ON core.data_export_subjects (export_id) WHERE status = 'pending';
CREATE INDEX idx_core_data_export_subjects_user
    ON core.data_export_subjects (user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Privileges
-- ─────────────────────────────────────────────────────────────────────────────
--
-- Two keys, and neither is a reuse of an existing one.
--
-- `core.data_export.read` is NOT `core.audit.read`: the export page names every
-- account an archive covered and hands out the archive itself. Whoever may read
-- the audit trail may legitimately be denied that.
--
-- `core.data_export.execute` is NOT `core.backup.manage`: a backup is written
-- for the machine and stays on the server, an export is written for a human and
-- is meant to leave it. It is granted to NO seeded role, on purpose — the same
-- reasoning `core.rules.manage` follows. "Can administer" must not imply "can
-- walk out with everything", and an operator who needs it must be given it
-- deliberately, by somebody who can see they now hold it.
--
-- Neither is OU-scopable. Not an oversight: an export archive is one file, and a
-- privilege that promised to confine it to a subtree would be enforced by the
-- request builder alone — the file, once produced, has no subtree.
INSERT INTO core.privileges (key, namespace, domain, verb, label, description, is_ou_scopable) VALUES
    ('core.data_export.read',    'core', 'data_export', 'read',    'Consulter les exports de données',
     'Lire l''historique des exports, leur état d''avancement, et télécharger une archive produite.', FALSE),
    ('core.data_export.execute', 'core', 'data_export', 'execute', 'Exporter les données',
     'Déclencher la production d''une archive contenant les données de l''instance ou d''une sélection de comptes, et annuler ou supprimer une archive. Opération à haut risque : tous les administrateurs en sont notifiés.', FALSE)
ON CONFLICT (key) DO NOTHING;

-- The read-only administrator holds every `read` key of the catalogue (the
-- seeding query of migration 000044 ran long before this one existed, so the
-- grant is explicit here — same as `core.backup.read` in 000085).
--
-- And it stops there. `core.data_export.execute` is seeded onto NO role,
-- including `service-admin`: see above.
INSERT INTO core.role_privileges (role_id, privilege_key)
SELECT r.id, 'core.data_export.read'
  FROM core.roles r
 WHERE r.slug = 'read-only-admin'
ON CONFLICT DO NOTHING;

INSERT INTO core.role_privileges (role_id, privilege_key)
SELECT r.id, 'core.data_export.read'
  FROM core.roles r
 WHERE r.slug = 'service-admin'
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. The policy
-- ─────────────────────────────────────────────────────────────────────────────
--
-- Six knobs, each read by `crate::data_export::policy`. Every default is the
-- cautious end of its range: this feature's failure mode is an archive that
-- exists too easily and lives too long.
INSERT INTO core.settings (key, value, default_value, category, label, description, is_public, value_type) VALUES
    ('data_export.destination', '"/var/lib/kubuno/exports"', '"/var/lib/kubuno/exports"', 'data_export',
     'Répertoire des archives',
     'Chemin absolu où les archives sont écrites, sur le disque de l''instance. Créé au besoin avec des droits restreints (0700) : une archive contient les données personnelles de tous les comptes qu''elle couvre.',
     FALSE, 'string'),

    ('data_export.hold_hours', '48', '48', 'data_export',
     'Délai de sécurité avant mise à disposition (heures)',
     'Une archive produite n''est téléchargeable qu''après ce délai. C''est la protection principale contre un export déclenché depuis une session administrateur volée : les autres administrateurs sont prévenus immédiatement et disposent de ce délai pour annuler. Zéro supprime la protection.',
     FALSE, 'int'),

    ('data_export.retention_days', '7', '7', 'data_export',
     'Durée de disponibilité de l''archive (jours)',
     'Après ce délai, comptés à partir de la mise à disposition, l''archive est supprimée du disque automatiquement, qu''elle ait été téléchargée ou non. L''entrée d''historique, elle, est conservée.',
     FALSE, 'int'),

    ('data_export.max_file_mb', '2048', '2048', 'data_export',
     'Taille maximale d''un fichier dans l''archive (Mio)',
     'Un fichier plus volumineux n''est pas inclus : son absence est signalée dans le manifeste de l''archive, avec sa taille réelle. Évite qu''un seul objet rende l''archive inexploitable.',
     FALSE, 'int'),

    ('data_export.module_timeout_s', '600', '600', 'data_export',
     'Délai d''attente par module et par compte (secondes)',
     'Au-delà, le module est considéré injoignable pour ce compte : son absence est consignée dans le manifeste et l''export continue. Un module en panne ne doit jamais faire échouer l''export des autres.',
     FALSE, 'int'),

    ('data_export.require_2fa', 'true', 'true', 'data_export',
     'Exiger la double authentification',
     'Réserve le déclenchement d''un export aux administrateurs dont le compte est protégé par une seconde étape d''authentification. Désactiver ce contrôle rend un export possible depuis un simple mot de passe.',
     FALSE, 'bool'),

    ('data_export.min_admin_age_days', '30', '30', 'data_export',
     'Ancienneté minimale du compte demandeur (jours)',
     'Un compte administrateur créé plus récemment ne peut pas déclencher d''export. Contre le scénario où un accès obtenu sert immédiatement à créer un second compte et à tout emporter avec.',
     FALSE, 'int')
ON CONFLICT (key) DO NOTHING;
