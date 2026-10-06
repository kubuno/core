-- Single-use backup codes for the second factor.
--
-- Why this table exists at all, and why it comes BEFORE any way of making the
-- second factor mandatory: an instance whose administrators are all required to
-- carry a TOTP secret, with no code to fall back on, is one lost phone away from
-- being permanently unreachable. Backup codes are the recovery path that makes
-- the requirement survivable.
--
-- Design notes:
--  * `code_hash` is an argon2id PHC string, exactly like `core.users.password_hash`.
--    A code is a credential; it is never stored in clear, never logged, and never
--    returned again after the single moment it is displayed.
--  * Because argon2 salts every hash, a code CANNOT be looked up by its hash: the
--    verifier reads the account's unused rows and tries them one by one. That is
--    bounded (`BATCH_SIZE` codes) and only ever runs on the rate-limited sign-in
--    path.
--  * `generation` groups a batch. Regenerating writes a new generation and deletes
--    the previous rows outright — an "old code" must stop working the instant a
--    fresh sheet is printed, not merely be marked stale.
--  * `used_at` makes consumption single-use and auditable; the partial index keeps
--    the verification read to the unused rows only.

CREATE TABLE IF NOT EXISTS core.totp_backup_codes (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    -- argon2id PHC string. Never the code itself, in any form.
    code_hash   TEXT NOT NULL,
    generation  INTEGER NOT NULL DEFAULT 1,
    used_at     TIMESTAMPTZ,
    -- Address the code was consumed from (trusted-proxy aware resolver only).
    used_ip     INET,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_core_tbc_user_unused
    ON core.totp_backup_codes(user_id) WHERE used_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_core_tbc_user
    ON core.totp_backup_codes(user_id);

-- Threshold below which the settings page warns the account it is running out of
-- codes. Public so the warning can be rendered without an administrative read.
INSERT INTO core.settings (key, value, category, label, description, is_public)
VALUES (
    'security.backup_codes_low_threshold', '3', 'security',
    'Seuil d''alerte des codes de secours',
    'En dessous de ce nombre de codes de secours restants, un avertissement est affiché.',
    TRUE
)
ON CONFLICT (key) DO NOTHING;
