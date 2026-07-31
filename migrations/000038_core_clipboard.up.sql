-- Roaming CLIPBOARD HISTORY, per user and across modules.
--
-- The browser's own clipboard holds ONE item, is not shared between tabs and is
-- lost on reload; module-scoped JS slots (the spreadsheet's object clipboard,
-- the editors' cell buffers) are worse still. This table keeps the last clips a
-- user made — as the same cross-module JSON envelope the `core.data-card`
-- renderers already understand — so any module, tab or device can paste them
-- back.
--
-- Payloads are capped by the handler (see handlers/clipboard.rs); `fingerprint`
-- deduplicates re-copies of the same content, bumping the existing row instead
-- of filling the history with identical entries (Windows 11 behaviour).
CREATE TABLE core.clipboard_items (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id    UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    -- Producing module ('office', 'maps'…) and envelope type ('office.shape').
    module      VARCHAR(100) NOT NULL,
    kind        VARCHAR(100) NOT NULL,
    title       VARCHAR(500),
    -- Human-readable summary, shown in the history list. Capped by the handler.
    preview     TEXT,
    -- Full envelope (or module payload). Never logged.
    payload     JSONB NOT NULL,
    -- Deep-link back into the producing module, when it has one.
    href        VARCHAR(1000),
    -- Pinned items survive the trim and « Effacer l'historique ».
    pinned      BOOLEAN NOT NULL DEFAULT FALSE,
    -- SHA-256 of the payload, for deduplication.
    fingerprint VARCHAR(64) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT core_clipboard_owner_fingerprint UNIQUE (owner_id, fingerprint)
);
CREATE INDEX idx_core_clipboard_owner_recent ON core.clipboard_items(owner_id, created_at DESC);

CREATE TRIGGER clipboard_items_updated_at BEFORE UPDATE ON core.clipboard_items
    FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();
