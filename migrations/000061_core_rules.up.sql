-- Administration rule engine: "when x happens, do y", declared by administrators
-- and executed by the instance.
--
-- ## The rule the whole design rests on: the core knows no module
--
-- Everything a rule can react to (a *trigger*) and everything a rule can do (an
-- *action*) lives in a catalogue that modules fill at registration — the same
-- path `settings_schema` and the privilege catalogue already take, with the same
-- forced prefixing by the module identifier. The core declares its own triggers
-- and actions **through that same path**, into these same two tables. There is
-- no core-only branch, no hard-coded module name anywhere in the engine, and
-- adding a module requires zero lines here.
--
-- ## Conditions are data, never an expression language
--
-- `core.rules.conditions` holds a tree of a closed vocabulary
-- (`all` / `any` / `not` / a comparison drawn from a fixed operator enum),
-- deserialised by serde into `crate::rules::condition::Condition`. Depth and
-- leaf count are bounded and validated on every write. A rule is therefore
-- auditable by reading it, testable without running it, and offers no surface
-- for injection — which a mini-language, however small, always eventually does.
--
-- ## Why versions, and why in the same transaction
--
-- An execution row names the rule *version* it ran under. Without a snapshot
-- taken atomically with the write, "which rule suspended this account in March"
-- has no answer once the rule has been edited — and an engine that can suspend
-- accounts without a defensible answer to that question should not exist.
--
-- ## What the execution log deliberately does NOT contain
--
-- Never the inspected content. A rule reads facts derived from an event (an
-- address, a setting key, a file name); persisting them would turn this table
-- into a copy of everything the instance handles, indexed by nothing, kept
-- forever. Rows carry structural fields (which rule, which version, which mode,
-- which outcome, which actor, which resource *reference*) and counters. That is
-- enough to answer "what did the engine do" and never enough to answer "what
-- did it read".

-- ── Trigger catalogue ────────────────────────────────────────────────────────
-- One row per event a rule may react to. Filled by modules at registration and
-- by the core at startup, through `crate::rules::catalog::register`.
CREATE TABLE core.rule_triggers (
    -- `<module_id>.<name>`. The prefix is added by the core, never chosen by
    -- the declaring module — a namespace a module can choose is a namespace it
    -- can claim, and the first thing a careless module would claim is `core`.
    key           VARCHAR(160) PRIMARY KEY,
    module_id     VARCHAR(100) NOT NULL,
    -- The event type on the bus this trigger listens to. Free text: the bus
    -- carries a generic `Custom` envelope whose real type is a string, and the
    -- set of types is open by construction.
    event_type    VARCHAR(160) NOT NULL,
    label         VARCHAR(200) NOT NULL,
    description   TEXT,
    -- Queryable fields, each with the operators it accepts:
    --   [{ "name": "email", "type": "string", "label": "…",
    --      "operators": ["eq","contains","ends_with"] }]
    -- A rule may only compare a field this array declares, with an operator
    -- this array allows. That is what makes "no expression language" hold end
    -- to end: the vocabulary is closed at the field level too.
    fields        JSONB NOT NULL DEFAULT '[]',
    -- Uninstalling a module keeps its triggers, flagged. Deleting them would
    -- cascade into rules that reference them and silently change what the
    -- instance does — the same reasoning as `core.privileges.is_orphan`.
    is_orphan     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_core_rule_triggers_event  ON core.rule_triggers(event_type);
CREATE INDEX idx_core_rule_triggers_module ON core.rule_triggers(module_id);

CREATE TRIGGER rule_triggers_updated_at BEFORE UPDATE ON core.rule_triggers
    FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

COMMENT ON TABLE core.rule_triggers IS
    'Catalogue des déclencheurs : ce à quoi une règle peut réagir. Alimenté par les modules à l''enregistrement.';

-- ── Action catalogue ─────────────────────────────────────────────────────────
CREATE TABLE core.rule_actions (
    key           VARCHAR(160) PRIMARY KEY,
    module_id     VARCHAR(100) NOT NULL,
    label         VARCHAR(200) NOT NULL,
    description   TEXT,
    -- Internal route on the declaring module, POSTed by the dispatcher against
    -- the module's registered base URL. NULL for an action the core performs
    -- in process — see `crate::rules::dispatch` for why the core does not call
    -- itself over HTTP, and why that is the only asymmetry in the mechanism.
    endpoint      VARCHAR(500),
    -- Parameter schema, same shape as the settings manifest:
    --   [{ "name": "reason", "type": "string", "required": false, "label": "…" }]
    params_schema JSONB NOT NULL DEFAULT '[]',
    -- Does the rest of the rule's action list wait for this one? A blocking
    -- action that fails stops the ones after it; a non-blocking one never does.
    is_blocking   BOOLEAN NOT NULL DEFAULT FALSE,
    -- Can an operator undo the effect? Recorded on every execution so the
    -- console can tell "this can be walked back" from "this cannot".
    is_reversible BOOLEAN NOT NULL DEFAULT FALSE,
    is_orphan     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_core_rule_actions_module ON core.rule_actions(module_id);

CREATE TRIGGER rule_actions_updated_at BEFORE UPDATE ON core.rule_actions
    FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

COMMENT ON TABLE core.rule_actions IS
    'Catalogue des actions : ce qu''une règle peut faire. Alimenté par les modules à l''enregistrement.';

-- ── Rules ────────────────────────────────────────────────────────────────────
CREATE TABLE core.rules (
    id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name               VARCHAR(200) NOT NULL,
    description        TEXT,

    -- RESTRICT, not CASCADE: a trigger cannot be pulled out from under a rule
    -- that references it. Orphaning is how a departed module is handled.
    trigger_key        VARCHAR(160) NOT NULL REFERENCES core.rule_triggers(key) ON DELETE RESTRICT,

    -- The condition tree. `{"type":"all","of":[]}` matches everything, which is
    -- the honest default: a rule with no condition fires on every occurrence of
    -- its trigger, and the console says so.
    conditions         JSONB NOT NULL DEFAULT '{"type":"all","of":[]}',
    -- [{ "action": "core.suspend_account", "params": { … } }]
    actions            JSONB NOT NULL DEFAULT '[]',

    -- The five degrees of caution. `backtest` is NOT here: it is a run against
    -- history, not a state a rule sits in.
    mode               VARCHAR(16) NOT NULL DEFAULT 'inactive'
                           CHECK (mode IN ('inactive', 'simulate', 'monitor', 'enforce')),

    -- { "include": [{"type":"org_unit","id":"…","descendants":true}, …],
    --   "exclude": [ … ] }
    -- Empty include = the whole instance. Exclude always wins.
    scope              JSONB NOT NULL DEFAULT '{"include":[],"exclude":[]}',

    -- "More than N times in T seconds", counted per subject. NULL = fire on
    -- every match.
    threshold_count    INTEGER,
    threshold_window_s INTEGER,
    CONSTRAINT rule_threshold_coherent CHECK (
        (threshold_count IS NULL AND threshold_window_s IS NULL)
        OR (threshold_count >= 2 AND threshold_window_s BETWEEN 10 AND 604800)
    ),

    -- Progressive rollout. Deterministic per subject (see
    -- `crate::rules::engine::in_rollout`): a subject that is in the pilot stays
    -- in it between two evaluations, otherwise the pilot measures noise.
    rollout_percent    SMALLINT NOT NULL DEFAULT 100
                           CHECK (rollout_percent BETWEEN 0 AND 100),

    severity           VARCHAR(16) NOT NULL DEFAULT 'warning'
                           CHECK (severity IN ('critical', 'warning', 'info')),
    -- Lower runs first. Ties broken by creation order, so the ordering is total.
    priority           INTEGER NOT NULL DEFAULT 100,

    -- Bumped by every write; the matching snapshot lands in core.rule_versions
    -- inside the same transaction.
    version            INTEGER NOT NULL DEFAULT 1,

    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by         UUID REFERENCES core.users(id) ON DELETE SET NULL,
    updated_by         UUID REFERENCES core.users(id) ON DELETE SET NULL
);
CREATE INDEX idx_core_rules_trigger ON core.rules(trigger_key);
CREATE INDEX idx_core_rules_active  ON core.rules(mode) WHERE mode <> 'inactive';

CREATE TRIGGER rules_updated_at BEFORE UPDATE ON core.rules
    FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

COMMENT ON TABLE core.rules IS
    'Règles d''administration : déclencheur, arbre de conditions, actions, portée, seuil, mode de prudence.';

-- ── Versions ─────────────────────────────────────────────────────────────────
-- One immutable snapshot per write. Written in the SAME transaction as the rule
-- itself: an execution names a version, and a version that might not exist would
-- make the execution log unreadable exactly when it matters.
CREATE TABLE core.rule_versions (
    id          BIGSERIAL PRIMARY KEY,
    rule_id     UUID    NOT NULL REFERENCES core.rules(id) ON DELETE CASCADE,
    version     INTEGER NOT NULL,
    -- The complete definition as it stood. Deliberately denormalised: reading
    -- history must not depend on the current shape of core.rules.
    snapshot    JSONB   NOT NULL,
    change_note VARCHAR(500),
    changed_by  UUID REFERENCES core.users(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (rule_id, version)
);
CREATE INDEX idx_core_rule_versions_rule ON core.rule_versions(rule_id, version DESC);

-- ── Execution log ────────────────────────────────────────────────────────────
CREATE TABLE core.rule_executions (
    id             BIGSERIAL PRIMARY KEY,
    rule_id        UUID    NOT NULL REFERENCES core.rules(id) ON DELETE CASCADE,
    rule_version   INTEGER NOT NULL,

    -- Mode in force when this ran, including `backtest` which no rule sits in.
    mode           VARCHAR(16) NOT NULL
                       CHECK (mode IN ('simulate', 'monitor', 'enforce', 'backtest')),

    -- What the engine decided. `no_match` is written in `simulate` only: in
    -- `enforce` every event of the trigger's type would write one, which on a
    -- busy instance is a table nobody can keep.
    outcome        VARCHAR(24) NOT NULL
                       CHECK (outcome IN ('matched', 'acted', 'no_match',
                                          'out_of_scope', 'out_of_rollout',
                                          'below_threshold', 'depth_exceeded',
                                          'error')),

    -- Structural references only. Never a value the rule inspected.
    event_type     VARCHAR(160) NOT NULL,
    actor_user_id  UUID REFERENCES core.users(id) ON DELETE SET NULL,
    org_unit_id    UUID REFERENCES core.org_units(id) ON DELETE SET NULL,
    resource_type  VARCHAR(60),
    resource_id    VARCHAR(120),

    -- Counters and per-action verdicts: { "actions": [{"action":"…","status":"ok"}],
    -- "leaves_evaluated": 3 }. Verdicts and counts, never inspected content.
    detail         JSONB NOT NULL DEFAULT '{}',
    actions_total  SMALLINT NOT NULL DEFAULT 0,
    actions_ok     SMALLINT NOT NULL DEFAULT 0,
    actions_failed SMALLINT NOT NULL DEFAULT 0,

    -- Feedback-loop counter carried by the fact that produced this execution.
    depth          SMALLINT NOT NULL DEFAULT 0,
    duration_ms    INTEGER  NOT NULL DEFAULT 0,
    occurred_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_core_rule_exec_rule    ON core.rule_executions(rule_id, occurred_at DESC);
CREATE INDEX idx_core_rule_exec_time    ON core.rule_executions(occurred_at DESC);
CREATE INDEX idx_core_rule_exec_outcome ON core.rule_executions(outcome, occurred_at DESC);

COMMENT ON TABLE core.rule_executions IS
    'Journal d''exécution du moteur de règles. Champs structurels et compteurs uniquement — jamais le contenu inspecté.';

-- ── Threshold hits ───────────────────────────────────────────────────────────
-- Only rules that declare a threshold write here, one row per match, purged
-- past the widest configured window. A rolling count over `NOW() - T` rather
-- than a tumbling counter: "more than 5 times in 15 minutes" must mean that at
-- every instant, not only inside an arbitrary quarter-hour boundary.
CREATE TABLE core.rule_hits (
    id          BIGSERIAL PRIMARY KEY,
    rule_id     UUID NOT NULL REFERENCES core.rules(id) ON DELETE CASCADE,
    -- Identity of the thing being counted (usually the subject account). Opaque
    -- to SQL and never rendered: it is a key, not content.
    subject_key VARCHAR(200) NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_core_rule_hits_window ON core.rule_hits(rule_id, subject_key, occurred_at DESC);

-- ── Backtests ────────────────────────────────────────────────────────────────
-- "How many things would this rule have touched last week?" Replays
-- core.event_log (30-day retention) through the evaluator, with no action and
-- no alert, driven by the existing job runner.
CREATE TABLE core.rule_backtests (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_id      UUID    NOT NULL REFERENCES core.rules(id) ON DELETE CASCADE,
    rule_version INTEGER NOT NULL,
    window_from  TIMESTAMPTZ NOT NULL,
    window_to    TIMESTAMPTZ NOT NULL,
    status       VARCHAR(16) NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'running', 'done', 'failed')),
    -- Aggregates only: events scanned, matches, would-have-acted, per day, per
    -- organisational unit — plus the limitations the reader must know about.
    report       JSONB NOT NULL DEFAULT '{}',
    error        TEXT,
    requested_by UUID REFERENCES core.users(id) ON DELETE SET NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);
CREATE INDEX idx_core_rule_backtests_rule ON core.rule_backtests(rule_id, created_at DESC);

-- ── Simulation alerts are a wall, not a filter ───────────────────────────────
-- A rule in simulation still raises its alerts — that is the point: an operator
-- must see what the rule *would* have said. But those alerts may never be
-- counted in a badge or trigger a notification, or "simulation" would be a
-- synonym for "enabled, loudly". The flag is applied by every default query in
-- `crate::alerts::store`; showing them requires asking for them by name.
ALTER TABLE core.alerts
    ADD COLUMN IF NOT EXISTS is_simulation BOOLEAN NOT NULL DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_core_alerts_simulation
    ON core.alerts(is_simulation) WHERE is_simulation = TRUE;

-- ── Event log: the two defects that made it unusable for replay ──────────────
-- `publish_and_log` never wrote `source_module` (the column has existed since
-- migration 000003 and was always NULL), and the stored `event_type` was the
-- name of the internal enum variant — so nearly every row said `Custom`, the
-- real type being buried in the payload. Both are fixed in `crate::events::bus`;
-- these columns support the replay the backtest needs.
ALTER TABLE core.event_log
    -- Feedback-loop counter: an event produced by a rule action carries its
    -- parent's depth plus one.
    ADD COLUMN IF NOT EXISTS depth SMALLINT NOT NULL DEFAULT 0,
    -- The rule whose action caused this event, when there is one.
    ADD COLUMN IF NOT EXISTS cause_rule_id UUID;
CREATE INDEX IF NOT EXISTS idx_core_el_type_created
    ON core.event_log(event_type, created_at DESC);

-- ── Privileges ───────────────────────────────────────────────────────────────
-- Two keys, and `core.rules.manage` is deliberately NOT part of ordinary
-- administration. Writing a rule is the power to suspend accounts, revoke
-- sessions and force password changes — at machine speed, on a population the
-- author describes rather than names. It therefore stands apart from
-- `core.settings.manage` and from every existing delegated role: only a
-- super-user holds it until somebody grants it on purpose.
--
-- Neither is org-unit scopable: a rule's scope is a property of the rule, not of
-- its author, and "confined to Marketing" would be a decoration over an object
-- whose whole job is to describe a population.
INSERT INTO core.privileges (key, namespace, domain, verb, label, description, is_ou_scopable) VALUES
    ('core.rules.read',   'core', 'rules', 'read',   'Consulter les règles',
     'Lire les règles d''administration, leur catalogue, leur historique et leur journal d''exécution.', FALSE),
    ('core.rules.manage', 'core', 'rules', 'manage', 'Écrire les règles d''administration',
     'Créer, modifier, activer et supprimer des règles. Écrire une règle, c''est pouvoir suspendre des comptes et révoquer des sessions automatiquement : ce privilège est distinct de l''administration courante.', FALSE)
ON CONFLICT (key) DO NOTHING;

-- The read-only administrator holds every `read` key of the catalogue.
INSERT INTO core.role_privileges (role_id, privilege_key)
SELECT r.id, 'core.rules.read'
  FROM core.roles r
 WHERE r.slug = 'read-only-admin'
ON CONFLICT DO NOTHING;

-- `core.rules.manage` is granted to NO seeded role on purpose. See above.

-- ── Settings ─────────────────────────────────────────────────────────────────
INSERT INTO core.settings (key, value, category, label, description, is_public) VALUES
    ('rules.enabled', 'true', 'rules', 'Moteur de règles activé',
     'Lorsque désactivé, aucune règle n''est évaluée ; les règles et leur journal restent consultables.', FALSE),
    ('rules.max_depth', '3', 'rules', 'Profondeur maximale de rétroaction',
     'Une action qui modifie l''instance émet un événement, lui-même déclencheur. Au-delà de cette profondeur, l''évaluation est refusée et une alerte est levée.', FALSE),
    ('rules.max_condition_depth', '5', 'rules', 'Profondeur maximale d''un arbre de conditions',
     'Plafond validé à l''écriture d''une règle.', FALSE),
    ('rules.max_condition_leaves', '32', 'rules', 'Nombre maximal de comparaisons dans une règle',
     'Plafond validé à l''écriture d''une règle.', FALSE),
    ('rules.execution_retention_days', '90', 'rules', 'Rétention du journal d''exécution (jours)',
     'Les exécutions plus anciennes sont purgées.', FALSE),
    ('rules.backtest_max_events', '200000', 'rules', 'Événements maximum rejoués par un test rétrospectif',
     'Borne le coût d''un test rétrospectif sur une instance très active.', FALSE)
ON CONFLICT (key) DO NOTHING;
