-- Tamper-evidence for the administrative trail (see crate::audit::chain).
--
-- Each new row is linked to the previous one by an HMAC hash chain:
--   row_hash = HMAC(K, canonical(row) || prev_hash)
-- The key K is derived from server.internal_secret and lives only in the
-- application process, never in the database. Rows written before this migration
-- keep NULL hashes and sit outside the chain (verification skips them).
ALTER TABLE core.admin_audit
    ADD COLUMN prev_hash BYTEA,
    ADD COLUMN row_hash  BYTEA;

-- Append-only guard.
--
-- A recorded row must not be edited in place. The ONLY legitimate post-insert
-- writes are the two undo back-links (`reverts_entry_id`, `reverted_by_entry_id`)
-- — set when an action is undone, or nulled by the `ON DELETE SET NULL` foreign
-- keys during retention. Those two columns are deliberately NOT part of the
-- hashed content, so allowing them to change leaves the chain intact. Every other
-- in-place change is refused.
--
-- Note: DELETE is intentionally NOT blocked — retention (core.purge_admin_audit)
-- removes rows by age. Deleting a row in the MIDDLE of the chain still breaks the
-- next row's link and is caught by verification; only wholesale truncation of the
-- oldest rows (which retention does by design) is invisible, hence the future
-- external-anchoring work noted in crate::audit::chain.
CREATE OR REPLACE FUNCTION core.admin_audit_append_only() RETURNS trigger AS $$
DECLARE
    keep_reverts BIGINT := NEW.reverts_entry_id;
    keep_revby   BIGINT := NEW.reverted_by_entry_id;
BEGIN
    -- Neutralise the two mutable back-links, then compare the whole row.
    NEW.reverts_entry_id     := OLD.reverts_entry_id;
    NEW.reverted_by_entry_id := OLD.reverted_by_entry_id;
    IF ROW(NEW.*) IS DISTINCT FROM ROW(OLD.*) THEN
        RAISE EXCEPTION 'core.admin_audit is append-only (only undo back-links may change)';
    END IF;
    -- Restore the intended change and let it through.
    NEW.reverts_entry_id     := keep_reverts;
    NEW.reverted_by_entry_id := keep_revby;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_admin_audit_append_only
    BEFORE UPDATE ON core.admin_audit
    FOR EACH ROW EXECUTE FUNCTION core.admin_audit_append_only();
