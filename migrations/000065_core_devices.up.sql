-- Device and session inventory.
--
-- ## What this is, and what it deliberately is not
--
-- Kubuno will never ship fleet management. There is no agent, nothing here can
-- wipe a personal phone, and no column below claims to. The inventory answers
-- one question — "which machines hold a live credential for this account, and
-- what do we actually know about them" — at three levels of trust, and only the
-- first two are implemented:
--
--   * `observed`  (default, zero configuration) — what the request itself
--     reveals: address, country, user agent, client kind, timestamps,
--     authentication strength. Verifiable by the server.
--   * `declared`  (native applications, opt-in) — disk encryption, screen lock,
--     platform version, as *stated by the device*. Never presented as verified;
--     the honesty of that label is the point of the feature.
--   * `attested`  — hardware/OS attestation. Out of scope. The enum value exists
--     so a future implementation does not need a migration, and nothing in the
--     core produces it today.
--
-- ## Why a table at all, when `core.refresh_tokens` already carries a device name
--
-- A refresh token row is a *session*: it dies on logout, on rotation, on idle
-- timeout. Everything the product calls "my devices" outlived it and had to be
-- re-guessed from a client-supplied string on every screen. `core.push_devices`
-- has a stable identity but no join key to the sessions, so the two views of the
-- same laptop could never be shown together. This table is the missing identity,
-- and `refresh_tokens.device_id` is the missing join.

-- ── The inventory ────────────────────────────────────────────────────────────
CREATE TABLE core.devices (
    -- PUBLIC identifier. This is what the API returns and what the console puts
    -- in a URL.
    id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id              UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,

    -- SECRET correlation identifier: SHA-256 of the correlation material (an
    -- opaque first-party cookie, a native client's device key, or a derived
    -- fingerprint). It is never serialised, never logged and never returned by
    -- any route — knowing it would let a caller claim an existing device row.
    -- Splitting it from `id` is what makes the public identifier safe to expose.
    correlation_hash     CHAR(64) NOT NULL,
    -- How the correlation was established: 'key' (opaque cookie / native device
    -- key, stable and strong) or 'fingerprint' (derived from the normalised user
    -- agent — the only thing available for sessions opened before this table
    -- existed, and honestly weaker). The console says which.
    correlation_kind     VARCHAR(16) NOT NULL DEFAULT 'key'
                             CHECK (correlation_kind IN ('key', 'fingerprint')),

    -- User-editable name. NULL falls back to the normalised description
    -- ("Firefox sur Fedora Linux"), so a device is never nameless.
    label                VARCHAR(255),

    -- Normalised from the user agent by `crate::devices::user_agent`; never
    -- trusted as an assertion, only as a reading of what the client sent.
    device_type          VARCHAR(16)  NOT NULL DEFAULT 'unknown'
                             CHECK (device_type IN ('desktop', 'mobile', 'tablet', 'tv', 'bot', 'api', 'unknown')),
    client_kind          VARCHAR(16),               -- 'web' | 'native' | 'desktop' | 'api'
    platform             VARCHAR(64),               -- 'Windows', 'macOS', 'Android', 'Linux'…
    platform_version     VARCHAR(64),
    browser              VARCHAR(64),
    browser_version      VARCHAR(64),
    user_agent           TEXT,                      -- last raw string, kept verbatim

    -- Highest level of trust this row has ever reached. `attested` is accepted
    -- by the CHECK and produced by nothing.
    signal_level         VARCHAR(16)  NOT NULL DEFAULT 'observed'
                             CHECK (signal_level IN ('observed', 'declared', 'attested')),

    -- ⚠ TRI-STATE, and the whole reason these are nullable BOOLEANs rather than
    -- `NOT NULL DEFAULT FALSE`: NULL means "unknown", and unknown must NEVER
    -- satisfy a condition that asks for "encrypted". A default of FALSE would
    -- read as "we checked and it is not encrypted", which is a different, and
    -- false, statement. Every read goes through `crate::devices::Tri`.
    disk_encrypted       BOOLEAN,
    screen_lock          BOOLEAN,
    declared_platform    VARCHAR(64),
    declared_version     VARCHAR(64),
    declared_app_version VARCHAR(64),
    declared_at          TIMESTAMPTZ,

    first_seen_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_ip              INET,
    -- ISO 3166-1 alpha-2, resolved from an OPTIONAL local database
    -- (`crate::devices::geoip`). No third-party service is ever contacted: this
    -- is a sovereignty product, and an outgoing request per sign-in is exactly
    -- what its users left the other suite to avoid. Without the database the
    -- column simply stays NULL and every screen says "unknown".
    last_country         CHAR(2),

    -- Approval state. `blocked` is the only one with teeth: it revokes the
    -- device's sessions and refuses its refreshes. `pending`/`approved` are
    -- statements an operator makes, not gates.
    approval             VARCHAR(16) NOT NULL DEFAULT 'pending'
                             CHECK (approval IN ('pending', 'approved', 'blocked')),
    approval_by          UUID REFERENCES core.users(id) ON DELETE SET NULL,
    approval_label       VARCHAR(255),   -- denormalised: survives the account
    approval_at          TIMESTAMPTZ,
    approval_reason      TEXT,

    -- One row per (account, correlation): the same laptop used by two accounts
    -- is two devices, because the inventory is a view of an account's exposure
    -- and merging them would leak one user's activity into the other's screen.
    UNIQUE (user_id, correlation_hash)
);

CREATE INDEX idx_core_devices_user      ON core.devices(user_id);
CREATE INDEX idx_core_devices_last_seen ON core.devices(last_seen_at DESC);
CREATE INDEX idx_core_devices_approval  ON core.devices(approval);
CREATE INDEX idx_core_devices_platform  ON core.devices(platform);
CREATE INDEX idx_core_devices_country   ON core.devices(last_country);

-- ── Timeline ─────────────────────────────────────────────────────────────────
-- The device sheet has to answer "what happened to this machine" without making
-- the operator cross-reference the audit trail by hand. The trail stays the
-- authority on administrative acts (and every act below also writes one); this
-- is the per-device projection, plus the events no administrator performed —
-- a session opening, a declaration arriving.
CREATE TABLE core.device_events (
    id           BIGSERIAL PRIMARY KEY,
    device_id    UUID NOT NULL REFERENCES core.devices(id) ON DELETE CASCADE,
    occurred_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- 'first_seen' | 'session_opened' | 'declared' | 'approved' | 'blocked'
    -- | 'unblocked' | 'signed_out' | 'renamed' | 'disowned'
    kind         VARCHAR(32) NOT NULL,
    ip_address   INET,
    country      CHAR(2),
    -- NULL for events the system observed rather than an operator performing.
    actor_id     UUID REFERENCES core.users(id) ON DELETE SET NULL,
    actor_label  VARCHAR(255),
    detail       TEXT
);
CREATE INDEX idx_core_device_events_device ON core.device_events(device_id, occurred_at DESC);

-- ── Sessions gain their device, their country and their authentication ───────
-- `ON DELETE SET NULL`: forgetting a device must not delete the sessions it
-- opened. "Forget" removes the inventory entry, nothing else — see the console
-- copy, which says so out loud because it is the misreading everybody makes.
ALTER TABLE core.refresh_tokens
    ADD COLUMN IF NOT EXISTS device_id     UUID REFERENCES core.devices(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS country       CHAR(2),
    -- How the holder proved who they were when this session opened:
    -- 'password' | 'password_totp' | 'backup_code' | 'sso' | 'unknown'.
    -- A session list without it cannot answer "which of these passed 2FA".
    ADD COLUMN IF NOT EXISTS auth_strength VARCHAR(20);

CREATE INDEX IF NOT EXISTS idx_core_rt_device ON core.refresh_tokens(device_id);
CREATE INDEX IF NOT EXISTS idx_core_rt_active
    ON core.refresh_tokens(last_used_at DESC)
    WHERE revoked_at IS NULL;

-- ── Settings ─────────────────────────────────────────────────────────────────
INSERT INTO core.settings (key, value, category, label, description, is_public) VALUES
    ('devices.declared_signals_enabled', 'false', 'devices',
     'Accepter les signaux déclarés par les applications natives',
     'Désactivé par défaut. Une fois activé, une application native peut déclarer sa plateforme, sa version, le chiffrement du disque et le verrouillage d''écran. Ces valeurs sont affichées comme « déclarées par l''appareil » et jamais comme vérifiées.',
     FALSE),
    ('devices.country_db_path', '""', 'devices',
     'Base de pays hors-ligne (chemin)',
     'Chemin d''un fichier CSV local « début,fin,pays » (format db-ip / GeoLite2 country-block). Aucune requête sortante n''est effectuée. Vide ou absent : le pays reste inconnu et rien d''autre ne change.',
     FALSE),
    ('devices.block_denies_refresh', 'true', 'devices',
     'Un appareil bloqué ne peut plus renouveler sa session',
     'Refuse le renouvellement du jeton et la connexion depuis un appareil bloqué. Désactiver ne conserve qu''un marquage informatif.',
     FALSE)
ON CONFLICT (key) DO NOTHING;

-- ── Privileges: none added ───────────────────────────────────────────────────
-- The inventory reuses `core.sessions.read` / `core.sessions.delete` rather than
-- minting `core.devices.*`. Two reasons: `adminNav.ts` already gates the reserved
-- `device-sessions` entry on `core.sessions.read`, and every mutation this
-- feature offers (block, sign out, forget) ends in revoking sessions — a new key
-- would have to be granted to every existing delegated role before the screen
-- worked at all, which is how a security feature ships switched off.
