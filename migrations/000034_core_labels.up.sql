-- Cross-module labels: a user-owned label can be attached to elements of ANY
-- module. A link stores a denormalized snapshot (title/href/envelope) so the
-- label browser can list and render items without querying each module.
CREATE TABLE core.labels (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id    UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    name        VARCHAR(100) NOT NULL,
    color       VARCHAR(20)  NOT NULL DEFAULT '#1a73e8',
    description TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT core_labels_owner_name UNIQUE (owner_id, name)
);
CREATE INDEX idx_core_labels_owner ON core.labels(owner_id);

CREATE TRIGGER labels_updated_at BEFORE UPDATE ON core.labels
    FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

CREATE TABLE core.label_links (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    label_id      UUID NOT NULL REFERENCES core.labels(id) ON DELETE CASCADE,
    owner_id      UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    module        VARCHAR(100) NOT NULL,
    -- Envelope type of the linked element (e.g. 'tasks.task', 'drive.file').
    resource_type VARCHAR(100) NOT NULL,
    -- Stable id of the element inside its module, or a content hash when the
    -- element has no id (e.g. a bare maps point).
    resource_id   VARCHAR(255) NOT NULL,
    title         VARCHAR(500),
    href          VARCHAR(1000),
    -- Full KubunoDataEnvelope, so the label browser renders rich cards through
    -- the same `core.data-card` renderers as clipboard paste.
    envelope      JSONB,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT core_label_links_unique UNIQUE (label_id, resource_type, resource_id)
);
CREATE INDEX idx_core_label_links_label    ON core.label_links(label_id);
CREATE INDEX idx_core_label_links_owner    ON core.label_links(owner_id);
CREATE INDEX idx_core_label_links_resource ON core.label_links(resource_type, resource_id);
CREATE INDEX idx_core_label_links_title_trgm ON core.label_links USING gin (title gin_trgm_ops);
