-- ═══════════════════════════════════════════════════════════════════════════
--  Data migration — importing an organisation's data from a third-party
--  provider into the accounts of this instance.
-- ═══════════════════════════════════════════════════════════════════════════
--
-- ── What lives here, and what deliberately does not ────────────────────────
--
-- The core owns the *campaign*: which service is being migrated, which source
-- server it is read from, which source login maps to which local account, and
-- how far each of those accounts has got. It owns nothing of the data itself.
--
-- It cannot: the core writes the `core` schema and only that schema. A mailbox
-- lives in the `mail` schema, a contact in `contacts` — tables the core has no
-- business reading and no right to write. So the work is done by the MODULE
-- that owns the destination, and these two tables are the ledger the core keeps
-- while that module works: the plan, the progress, and the failures.
--
-- The consequence worth stating: a campaign whose module is not installed is
-- not merely idle, it is impossible. `module_id` records which module was
-- asked, and the console refuses to open a campaign for a service no installed
-- module claims, rather than queueing work nothing will ever pick up.
--
-- ── Why the credential is a column and not a prompt ────────────────────────
--
-- A migration of two hundred mailboxes runs for hours, resumes after a restart
-- and retries what failed a day later. Holding each source password in the
-- administrator's browser for that long is not an option, so it is stored — and
-- because it is stored, it is stored ENCRYPTED (AES-256-GCM, key derived from
-- the instance secret; see `crypto::encryption`) in `secret_enc`, is never
-- selected into any API response, and never appears in a log or in the audit
-- trail. The column is `TEXT` because that is what `encryption::encrypt`
-- returns: base64(nonce ‖ ciphertext).
--
-- There is no column for a source password on the CAMPAIGN. A campaign holds
-- the server, never a credential: one shared credential for an entire
-- organisation is the shape that turns a migration into a breach.
--
-- ── Why progress is a cursor and not a percentage ──────────────────────────
--
-- `cursor` is opaque JSON, produced and consumed by the module alone. The core
-- stores it and hands it back on the next chunk; it never parses it. That is
-- what keeps folder semantics — IMAP UIDs, special-use flags, modified UTF-7 —
-- inside the module that understands them, and lets a second service be added
-- later without touching this table. `items_copied` and `items_total` are the
-- only two numbers the core reads, because they are the only two a progress bar
-- needs.

-- ── The campaign ───────────────────────────────────────────────────────────
CREATE TABLE core.migration_campaigns (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- What an operator recognises the campaign by. Free text: an instance may
    -- run several campaigns against the same server (a pilot, then the rest).
    name            VARCHAR(200) NOT NULL,
    -- One service per campaign, exactly as the reference console does it: a
    -- mailbox and an address book are different sources, different credentials
    -- and different failure modes, and merging them into one run means neither
    -- can be retried without the other.
    service         VARCHAR(30)  NOT NULL CHECK (service IN ('mail')),
    -- The module that will do the work. Recorded rather than derived, so a
    -- finished campaign still says who ran it after the service→module map has
    -- moved on.
    module_id       VARCHAR(100) NOT NULL,
    source_kind     VARCHAR(20)  NOT NULL CHECK (source_kind IN ('imap')),
    source_host     VARCHAR(255) NOT NULL,
    source_port     INTEGER      NOT NULL CHECK (source_port BETWEEN 1 AND 65535),
    source_security VARCHAR(10)  NOT NULL CHECK (source_security IN ('ssl', 'starttls', 'none')),
    -- Data range. NULL = everything the source holds.
    since_date      DATE,
    -- Folders left behind, by name. Empty array = take everything.
    exclude_folders TEXT[]       NOT NULL DEFAULT '{}',
    -- draft   : being composed, nothing has run
    -- running : the background job is walking its accounts
    -- paused  : an operator interrupted it; the cursors are kept
    -- done    : no account is left to process (some may have failed)
    -- failed  : the campaign itself could not run (module gone, for instance)
    status          VARCHAR(20)  NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft', 'running', 'paused', 'done', 'failed')),
    created_by      UUID REFERENCES core.users(id) ON DELETE SET NULL,
    -- The name the administrator had when they opened it, kept for the report:
    -- an account that has since been deleted must not erase who decided this.
    actor_label     VARCHAR(255),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    started_at      TIMESTAMPTZ,
    finished_at     TIMESTAMPTZ,
    error           TEXT
);

CREATE INDEX idx_migration_campaigns_status  ON core.migration_campaigns(status);
CREATE INDEX idx_migration_campaigns_created ON core.migration_campaigns(created_at DESC);

-- ── One source account → one local account ─────────────────────────────────
CREATE TABLE core.migration_accounts (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id    UUID NOT NULL REFERENCES core.migration_campaigns(id) ON DELETE CASCADE,
    -- The login presented to the source server. Usually an address, not always.
    source_login   VARCHAR(320) NOT NULL,
    -- base64(nonce ‖ ciphertext) of the source password. Never read outside the
    -- job that hands it to the module, never returned by an API.
    secret_enc     TEXT NOT NULL,
    -- Deleting the destination account cancels its migration: copying a mailbox
    -- into an account that no longer exists has no meaning.
    target_user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    -- pending   : mapped, nothing copied yet
    -- running   : at least one chunk has run; `cursor` says where it stopped
    -- done      : the module reported the source exhausted
    -- failed    : the module reported an error; retryable from the console
    -- cancelled : the campaign was deleted or the mapping withdrawn
    status         VARCHAR(20) NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending', 'running', 'done', 'failed', 'cancelled')),
    items_copied   INTEGER NOT NULL DEFAULT 0 CHECK (items_copied >= 0),
    -- The module's best estimate of the total, refined as it discovers folders.
    -- Zero means "not known yet", never "nothing to do".
    items_total    INTEGER NOT NULL DEFAULT 0 CHECK (items_total >= 0),
    -- Opaque to the core. See the header.
    cursor         JSONB,
    attempts       INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
    error          TEXT,
    started_at     TIMESTAMPTZ,
    finished_at    TIMESTAMPTZ,
    -- Bumped after every chunk. Also the stall detector: a row left `running`
    -- by a killed process is put back in the queue once it stops being touched.
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- The same source login twice in one campaign would migrate it twice.
    UNIQUE (campaign_id, source_login)
);

CREATE INDEX idx_migration_accounts_campaign ON core.migration_accounts(campaign_id, status);
-- The claim order of the background job: least recently touched first, which
-- is what shares one worker fairly between the accounts of a campaign.
CREATE INDEX idx_migration_accounts_claim    ON core.migration_accounts(status, updated_at)
    WHERE status IN ('pending', 'running');
CREATE INDEX idx_migration_accounts_target   ON core.migration_accounts(target_user_id);

-- ── Privileges ─────────────────────────────────────────────────────────────
-- Two, and held apart on purpose. Reading a campaign shows who is being
-- migrated where; running one authenticates against a third-party server on
-- behalf of the whole organisation and writes into other people's mailboxes.
-- Not instance-scopable: a campaign names accounts across the whole directory,
-- so an organisational-unit-scoped grant of it would be a promise the feature
-- cannot keep.
INSERT INTO core.privileges (key, namespace, domain, verb, label, description, is_ou_scopable) VALUES
    ('core.data_migration.read',   'core', 'data_migration', 'read',
     'Consulter les migrations de données',
     'Voir les campagnes de migration, la correspondance des comptes et leur avancement.', FALSE),
    ('core.data_migration.manage', 'core', 'data_migration', 'manage',
     'Gérer les migrations de données',
     'Créer une campagne, enregistrer les identifiants du serveur source, lancer, interrompre et relancer une migration.', FALSE)
ON CONFLICT (key) DO NOTHING;
