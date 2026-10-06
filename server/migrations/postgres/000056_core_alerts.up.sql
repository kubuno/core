-- Alert centre: the queue of things that demand the operator's attention, with
-- a lifecycle.
--
-- ## Why this is not a third log
--
-- The instance already has `core.event_log` (what happened to the system) and
-- `core.admin_audit` (who did what). Neither is a work queue: they are read
-- backwards, after the fact, and nothing in them has a state. An operator
-- reading a log has to decide, every single time, whether a line is still true
-- and whether anybody dealt with it.
--
-- An alert is the opposite object. It is **open until somebody closes it**, it
-- carries an assignee, a history, and — the rule that governs the whole feature
-- — a set of recommended actions. A type of alert that cannot say what to do
-- about it is not created at all; it would be a second event list with a badge
-- on top, which is strictly worse than no badge.
--
-- ## Deduplication is the reason the table is usable
--
-- The producers run on a schedule. A module that has been down for a week, or a
-- job type that fails every five minutes, would otherwise write two thousand
-- rows saying the same sentence. `dedup_key` plus the partial unique index
-- below collapse them into ONE row whose `occurrences` counter grows and whose
-- `last_seen_at` moves. Raising an alert is therefore an upsert, always, and a
-- producer never has to ask "did I already say this?".
--
-- The index covers everything **except** `resolved`, and that asymmetry is
-- deliberate:
--
--   * `ignored` still absorbs recurrences. "Ignore" means "stop bothering me
--     about this", so a new occurrence must land on the ignored row (counter
--     up, no noise) rather than mint a fresh `new` one — which would make the
--     button a lie.
--   * `resolved` does not. Somebody stated the problem was fixed; if the
--     producer sees it again, it *came back*, and that is a genuinely new
--     alert with its own first_seen_at. Folding it into the old row would hide
--     a regression inside a counter.

-- ── Alerts ───────────────────────────────────────────────────────────────────
CREATE TABLE core.alerts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Producer family: 'health', 'audit', 'modules', 'jobs', 'storage'. Free
    -- text on purpose — the catalogue lives in Rust (`crate::alerts::catalog`),
    -- exactly like the health checks, because it changes with the code and a
    -- CHECK constraint would turn adding a producer into a migration.
    source          VARCHAR(60)  NOT NULL,
    -- Catalogue identifier, `<family>.<subject>` (e.g. `security.login_burst`).
    -- It is the key the console translates against and the key the recommended
    -- actions are attached to, so it must outlive refactors.
    kind            VARCHAR(100) NOT NULL,

    severity        VARCHAR(16)  NOT NULL
                        CHECK (severity IN ('critical', 'warning', 'info')),
    -- new → acknowledged → resolved, plus ignored. `ignored` is not a step of
    -- the flow: it is a decision that the alert does not apply here, reversible
    -- like every other transition.
    status          VARCHAR(16)  NOT NULL DEFAULT 'new'
                        CHECK (status IN ('new', 'acknowledged', 'resolved', 'ignored')),

    -- Denormalised English wording produced by the catalogue. The console
    -- prefers its own `admin.al_<kind>_title`; this is what an API consumer and
    -- a lagging catalogue read.
    title           VARCHAR(255) NOT NULL,
    summary         TEXT,
    -- Everything the console needs to render the detail and build the deep
    -- actions: counts, module ids, job types, check ids. Never a credential —
    -- the producers report verdicts, like the health checks do.
    payload         JSONB        NOT NULL DEFAULT '{}',

    -- What the alert is about, when it is about something in particular.
    module_id       VARCHAR(100),
    -- The account concerned (the one being brute-forced, the one just granted a
    -- privilege). SET NULL rather than CASCADE: the alert outlives the account,
    -- and deleting it is exactly the case where the trace matters most.
    subject_user_id UUID REFERENCES core.users(id)     ON DELETE SET NULL,
    org_unit_id     UUID REFERENCES core.org_units(id) ON DELETE SET NULL,

    -- Identity of the *problem*, not of the row. Two occurrences of the same
    -- problem share it; two different problems never do.
    dedup_key       VARCHAR(255) NOT NULL,
    occurrences     INTEGER      NOT NULL DEFAULT 1 CHECK (occurrences > 0),
    first_seen_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    last_seen_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    -- Exactly one assignee, or none. A list would let everybody assume somebody
    -- else is on it.
    assignee_id     UUID REFERENCES core.users(id) ON DELETE SET NULL,
    assigned_at     TIMESTAMPTZ,

    -- Set when the alert leaves the open set (resolved or ignored), cleared on
    -- reopening. Kept as a column rather than derived from the event history so
    -- "how long was this open" is a subtraction, not a join.
    closed_at       TIMESTAMPTZ,
    closed_by       UUID REFERENCES core.users(id) ON DELETE SET NULL,

    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    -- An assignee only makes sense with a timestamp, and vice versa.
    CONSTRAINT alert_assignment_coherent CHECK (
        (assignee_id IS NULL) = (assigned_at IS NULL)
    ),
    CONSTRAINT alert_closure_coherent CHECK (
        (status IN ('resolved', 'ignored')) = (closed_at IS NOT NULL)
    )
);

-- The deduplication contract. See the header: `resolved` is outside the index
-- so a problem that comes back is a new alert, while `ignored` stays inside so
-- silencing one actually silences it.
CREATE UNIQUE INDEX uniq_core_alerts_dedup
    ON core.alerts (dedup_key) WHERE status <> 'resolved';

-- The queue reads open alerts, worst first, newest first.
CREATE INDEX idx_core_alerts_open
    ON core.alerts (severity, last_seen_at DESC) WHERE status IN ('new', 'acknowledged');
CREATE INDEX idx_core_alerts_seen     ON core.alerts (last_seen_at DESC, id DESC);
CREATE INDEX idx_core_alerts_kind     ON core.alerts (kind, last_seen_at DESC);
CREATE INDEX idx_core_alerts_assignee ON core.alerts (assignee_id) WHERE assignee_id IS NOT NULL;
CREATE INDEX idx_core_alerts_subject  ON core.alerts (subject_user_id) WHERE subject_user_id IS NOT NULL;

CREATE TRIGGER alerts_updated_at BEFORE UPDATE ON core.alerts
    FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

COMMENT ON TABLE core.alerts IS
    'File des alertes d''exploitation, dédupliquées par dedup_key, avec cycle de vie.';

-- ── History ──────────────────────────────────────────────────────────────────
-- One row per thing that happened *to* the alert. The queue shows the current
-- state; this is how the state got there, which is the only way an operator
-- picking up somebody else's alert knows what has already been tried.
CREATE TABLE core.alert_events (
    id          BIGSERIAL PRIMARY KEY,
    alert_id    UUID NOT NULL REFERENCES core.alerts(id) ON DELETE CASCADE,
    kind        VARCHAR(24) NOT NULL
                    CHECK (kind IN ('created', 'status', 'severity', 'assigned', 'comment', 'recurrence')),

    -- Denormalised like the audit trail: the entry stays readable once the
    -- account is gone. NULL id + a label for work the server did on its own.
    actor_id    UUID REFERENCES core.users(id) ON DELETE SET NULL,
    actor_label VARCHAR(320) NOT NULL,

    -- Transition, for 'status', 'severity' and 'assigned'. Free text so an
    -- assignment can carry a user label rather than a raw uuid.
    from_value  VARCHAR(320),
    to_value    VARCHAR(320),
    -- Operator comment, and the note attached to a transition.
    body        TEXT,

    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_core_alert_events_alert ON core.alert_events (alert_id, occurred_at, id);

COMMENT ON TABLE core.alert_events IS
    'Fil chronologique d''une alerte : création, changements d''état, assignation, commentaires, récurrences.';

-- ── Saved filter sets ────────────────────────────────────────────────────────
-- Per operator, not per instance: "my open criticals" and "everything assigned
-- to me" are personal working sets, and a shared one would be edited out from
-- under whoever relies on it.
CREATE TABLE core.alert_views (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id   UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    name       VARCHAR(120) NOT NULL,
    -- The filter object the queue sends back verbatim. Validated by shape in
    -- the handler, never interpreted here.
    filters    JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (owner_id, name)
);
CREATE INDEX idx_core_alert_views_owner ON core.alert_views (owner_id, name);

-- ── Privileges ───────────────────────────────────────────────────────────────
-- Two keys, not one: reading the queue is what a delegated operator needs to
-- know the instance is unwell, while closing, ignoring and assigning changes
-- what everybody else believes about it.
--
-- Neither is org-unit scopable. An alert is about the instance — a module that
-- is down, a job type that fails, a volume filling up — and confining it to a
-- subtree would be decoration: the reader would still be looking at facts
-- outside their perimeter, only with a false sense of boundary.
INSERT INTO core.privileges (key, namespace, domain, verb, label, description, is_ou_scopable) VALUES
    ('core.alerts.read',   'core', 'alerts', 'read',   'Consulter les alertes',
     'Lire le centre d''alertes, ses filtres et le détail d''une alerte.', FALSE),
    ('core.alerts.manage', 'core', 'alerts', 'manage', 'Traiter les alertes',
     'Prendre en charge, assigner, commenter, clore ou ignorer une alerte, et exécuter ses actions recommandées.', FALSE)
ON CONFLICT (key) DO NOTHING;

-- The read-only administrator holds every `read` key of the catalogue; the
-- seeding query in migration 000044 ran before this one existed, so the new key
-- is granted explicitly here rather than left silently missing.
INSERT INTO core.role_privileges (role_id, privilege_key)
SELECT r.id, 'core.alerts.read'
  FROM core.roles r
 WHERE r.slug = 'read-only-admin'
ON CONFLICT DO NOTHING;

-- The service administrator operates modules, themes, the relay and the jobs
-- behind them: the alert queue is where those show up, so it gets both keys.
INSERT INTO core.role_privileges (role_id, privilege_key)
SELECT r.id, k
  FROM core.roles r,
       unnest(ARRAY['core.alerts.read', 'core.alerts.manage']) AS k
 WHERE r.slug = 'service-admin'
ON CONFLICT DO NOTHING;

-- ── Settings ─────────────────────────────────────────────────────────────────
-- Thresholds the operator can tune without a rebuild. Read by
-- `crate::alerts::producers`; each one is the point at which a fact stops being
-- normal for THIS instance.
INSERT INTO core.settings (key, value, category, label, description, is_public) VALUES
    ('alerts.enabled', 'true', 'alerts', 'Centre d''alertes activé',
     'Lorsque désactivé, les producteurs cessent d''écrire ; les alertes existantes restent consultables.', FALSE),
    ('alerts.scan_interval_s', '300', 'alerts', 'Fréquence d''analyse (secondes)',
     'Intervalle entre deux passages des producteurs d''alertes.', FALSE),
    ('alerts.login_burst_threshold', '5', 'alerts', 'Échecs de connexion avant alerte',
     'Nombre d''échecs de connexion sur un même compte dans la fenêtre ci-dessous.', FALSE),
    ('alerts.login_burst_window_min', '15', 'alerts', 'Fenêtre des échecs de connexion (minutes)',
     'Durée sur laquelle les échecs de connexion sont comptés.', FALSE),
    ('alerts.disk_warn_percent', '15', 'alerts', 'Espace disque : seuil d''avertissement (%)',
     'En dessous de ce pourcentage d''espace disponible, une alerte d''avertissement est ouverte.', FALSE),
    ('alerts.disk_critical_percent', '7', 'alerts', 'Espace disque : seuil critique (%)',
     'En dessous de ce pourcentage d''espace disponible, l''alerte passe en critique.', FALSE),
    ('alerts.retention_days', '180', 'alerts', 'Rétention des alertes closes (jours)',
     'Les alertes closes plus anciennes sont purgées avec leur historique.', FALSE)
ON CONFLICT (key) DO NOTHING;
