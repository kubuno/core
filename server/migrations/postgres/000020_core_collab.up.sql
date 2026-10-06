-- Collaboration temps réel (Yjs) — service GÉNÉRIQUE du core, utilisable par TOUS
-- les modules qui éditent des fichiers kubuno (.kb***). Le core ne comprend pas la
-- structure Yjs : il relaie/stocke des updates binaires opaques (concaténables) +
-- un snapshot consolidé. La « salle » (room) est une chaîne libre choisie par le
-- module appelant, ex. "office-document:<uuid>", "paintsharp-layer:<uuid>", "notes:<uuid>".
-- Le fichier .kb*** visible reste le snapshot JSON/applicatif (écrit par les clients).

CREATE TABLE IF NOT EXISTS core.collab_updates (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room        VARCHAR(200) NOT NULL,
    update_data BYTEA        NOT NULL,   -- update Yjs binaire (opaque)
    origin      UUID,                    -- user_id (audit)
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_core_collab_updates_room
    ON core.collab_updates (room, created_at ASC);

CREATE TABLE IF NOT EXISTS core.collab_snapshots (
    room       VARCHAR(200) PRIMARY KEY,
    snapshot   BYTEA        NOT NULL,    -- état Yjs consolidé (concaténation d'updates)
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
