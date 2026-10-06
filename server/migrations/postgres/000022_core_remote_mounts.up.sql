-- Montages de stockage distant — CENTRALISÉS dans le core.
-- Le backend des connecteurs (webdav, nextcloud, owncloud, sftp, ftp, smb, nfs,
-- gdrive, dropbox) vit désormais dans le core. Le module drive proxifie vers ici.
CREATE TABLE IF NOT EXISTS core.remote_mounts (
    id                 UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id           UUID         NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    name               VARCHAR(255) NOT NULL,
    provider           VARCHAR(50)  NOT NULL
                           CHECK (provider IN ('webdav','nextcloud','owncloud','sftp','ftp','smb','nfs','gdrive','dropbox','s3')),
    config_enc         BYTEA        NOT NULL,         -- AES-256-GCM (clé = SHA-256(internal_secret))
    mount_name         VARCHAR(100) NOT NULL,
    status             VARCHAR(20)  NOT NULL DEFAULT 'disconnected'
                           CHECK (status IN ('connected','disconnected','error','syncing')),
    last_connected_at  TIMESTAMPTZ,
    last_error         TEXT,
    remote_quota_bytes BIGINT,
    remote_used_bytes  BIGINT,
    created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (owner_id, mount_name)
);
CREATE INDEX IF NOT EXISTS idx_core_rm_owner  ON core.remote_mounts(owner_id);
CREATE INDEX IF NOT EXISTS idx_core_rm_status ON core.remote_mounts(status);

CREATE TRIGGER remote_mounts_updated_at BEFORE UPDATE ON core.remote_mounts
    FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

-- Migration transparente des montages existants du module drive (config chiffrée
-- avec la MÊME clé = SHA-256(internal_secret partagé) → réutilisable telle quelle).
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_schema = 'drive' AND table_name = 'remote_connections') THEN
        INSERT INTO core.remote_mounts
            (id, owner_id, name, provider, config_enc, mount_name, status,
             last_connected_at, last_error, remote_quota_bytes, remote_used_bytes, created_at, updated_at)
        SELECT id, owner_id, name, provider, config_enc, mount_name, status,
               last_connected_at, last_error, remote_quota_bytes, remote_used_bytes, created_at, updated_at
        FROM drive.remote_connections
        WHERE owner_id IN (SELECT id FROM core.users)
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;
