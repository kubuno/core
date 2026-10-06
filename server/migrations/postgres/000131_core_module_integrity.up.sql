-- What the marketplace has already proven about a module.
--
-- The server checks a downloaded package against the digest the catalogue
-- publishes, and refuses the install when they differ. But a MISSING digest was
-- only a warning: the install went ahead unverified. That left the whole check
-- one deletion away from being disabled — an attacker able to touch the
-- catalogue had merely to remove the digest to be waved through.
--
-- This table remembers that a module was once installed with a verified digest.
-- From then on, an artefact offered without one is refused rather than warned
-- about: what has been proven once cannot quietly stop being proven.
CREATE TABLE core.module_integrity (
    module_id      VARCHAR(100) PRIMARY KEY,
    -- Digest of the artefact accepted last, kept for the audit trail rather than
    -- for comparison: a new version legitimately carries a different one.
    last_sha256    VARCHAR(64)  NOT NULL,
    first_seen_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    last_seen_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE core.module_integrity IS
    'Modules déjà installés avec une empreinte vérifiée : une version ultérieure sans empreinte est refusée.';
