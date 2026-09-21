DROP TRIGGER IF EXISTS trg_admin_audit_append_only ON core.admin_audit;
DROP FUNCTION IF EXISTS core.admin_audit_append_only();
ALTER TABLE core.admin_audit
    DROP COLUMN IF EXISTS row_hash,
    DROP COLUMN IF EXISTS prev_hash;
