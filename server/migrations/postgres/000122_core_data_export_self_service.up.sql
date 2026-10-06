-- Self-service data export: an account asking for its OWN data, and the setting
-- that decides whether it may.
--
-- ## Why this is not a second feature
--
-- Migration 000121 built an export ADMINISTRATORS trigger: a run, its subjects,
-- an archive, a hold, an expiry, a download that is audited and counted. Its own
-- preamble already says that the single-account portability request is "an
-- `accounts` scope of one — the same machinery, deliberately, so the narrow
-- errand can never drift from the wide one".
--
-- This migration is that sentence made true. It adds no table, no job and no
-- second archive format: it adds three columns saying WHO a run was opened for
-- and under which limits, and one setting saying who is allowed to open one.
-- Everything else — the producer, the module contract, the redaction rule, the
-- retention pass — is the code 000121 shipped, unchanged.
--
-- ## The three columns
--
--   * `origin`         — 'admin' (000121) or 'self'. Every existing row is
--                        'admin', which is what the default says, and the two
--                        populations are never mixed again afterwards: the
--                        console's history, the "one export at a time" guard and
--                        the download route all filter on it.
--   * `download_limit` — how many times THIS archive may be fetched. NULL for an
--                        administrator's archive (the audit trail is the control
--                        there); a small number for a self-service one, because
--                        a link that can be replayed for ever is a copy of the
--                        account with none of its access control.
--   * `max_file_mb`    — the per-file ceiling the requester chose, when they
--                        chose one. NULL means "whatever the policy says at the
--                        time the job runs", which is exactly the behaviour of
--                        every run created before this migration.
--
-- All three are set once, at creation, and never recomputed — the same rule
-- `available_at` and `expires_at` already follow. A ceiling that moved under a
-- policy change would make an archive that was produced under one promise and
-- handed over under another.

ALTER TABLE core.data_export_runs
    ADD COLUMN origin         VARCHAR(20) NOT NULL DEFAULT 'admin'
                                  CHECK (origin IN ('admin', 'self')),
    ADD COLUMN download_limit INTEGER CHECK (download_limit IS NULL OR download_limit > 0),
    ADD COLUMN max_file_mb    INTEGER CHECK (max_file_mb    IS NULL OR max_file_mb    > 0);

COMMENT ON COLUMN core.data_export_runs.origin IS
    'admin = requested from the console for other accounts; self = an account asking for its own data.';

-- The history of one account's own requests: the query the personal page runs.
CREATE INDEX idx_core_data_export_self
    ON core.data_export_runs (requested_by, requested_at DESC)
    WHERE origin = 'self';

-- One request at a time PER ACCOUNT, enforced by the database rather than by a
-- read-then-write in the handler. The handler checks too — it owes the person a
-- sentence rather than a constraint violation — but a double-click, a retried
-- request and two browser tabs all race, and the check that survives a race is
-- the one the database makes. Instance-wide serialisation would be the wrong
-- shape here: an account's own archive is small, and one person's export must
-- never make the feature unavailable to everybody else.
CREATE UNIQUE INDEX uq_core_data_export_self_active
    ON core.data_export_runs (requested_by)
    WHERE origin = 'self' AND status IN ('pending', 'running');

-- ─────────────────────────────────────────────────────────────────────────────
-- The settings
-- ─────────────────────────────────────────────────────────────────────────────
--
-- `data_export.self_service` is declared `overridable`, unlike the seven keys of
-- 000121 which are `global`. That is the whole point of it: the instance decides
-- a default, and an organisational unit — or a group, or one account — may
-- differ. The core resolves its own settings through the chain of 000060
-- (`user ?? group ?? closest unit ?? … ?? instance ?? factory`), so no code has
-- to know where the value was written.
--
-- Default: ENABLED. Getting one's own data back is the ordinary case; the
-- instances that must refuse it are the exception, and an exception is what a
-- setting is for.
INSERT INTO core.settings (key, value, default_value, category, label, description, is_public, value_type, scope) VALUES
    ('data_export.self_service', 'true', 'true', 'data_export',
     'Autoriser chacun à exporter ses propres données',
     'Ouvre, dans les réglages du compte, une page « Télécharger mes données » : l''utilisateur choisit les services, demande une archive et la récupère quand elle est prête. L''archive ne contient que SES données et jamais celles d''un autre compte. Réglable par unité organisationnelle, par groupe ou par compte : là où ce réglage est désactivé, ni la page ni l''option n''apparaissent — la fonction disparaît de l''interface au lieu d''y figurer grisée.',
     FALSE, 'bool', 'overridable'),

    ('data_export.self_hold_hours', '0', '0', 'data_export',
     'Délai de sécurité du libre-service (heures)',
     'Attente imposée entre la production d''une archive personnelle et son téléchargement. Zéro par défaut, à la différence de l''export administrateur : le délai de 48 h protège contre l''exfiltration de TOUS les comptes depuis une session volée, alors qu''une session volée peut déjà lire dans l''interface les données du seul compte concerné ici. Le relever protège peu et retarde beaucoup une demande légitime de portabilité.',
     FALSE, 'int', 'global'),

    ('data_export.self_max_downloads', '5', '5', 'data_export',
     'Téléchargements autorisés par archive personnelle',
     'Nombre de fois qu''une archive personnelle peut être récupérée avant de devoir en redemander une. Une adresse de téléchargement rejouable indéfiniment est une copie du compte sans son contrôle d''accès. Le plafond est figé à la création de l''archive : le modifier n''affecte que les demandes suivantes.',
     FALSE, 'int', 'global')
ON CONFLICT (key) DO NOTHING;
