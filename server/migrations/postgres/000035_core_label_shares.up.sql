-- Label sharing: the owner of a label can share it with named users and/or
-- whole groups. `can_manage` grants full co-ownership (rename, recolor,
-- re-share, delete) and, unlike a plain share, also reveals the elements
-- labelled by the OTHER members — a plain recipient only ever sees their own.
CREATE TABLE core.label_shares (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    label_id   UUID NOT NULL REFERENCES core.labels(id) ON DELETE CASCADE,
    -- Exactly one of user_id / group_id is set (real FKs, so deleting a user or
    -- a group drops its shares automatically).
    user_id    UUID REFERENCES core.users(id) ON DELETE CASCADE,
    group_id   UUID REFERENCES core.user_groups(id) ON DELETE CASCADE,
    can_manage BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES core.users(id) ON DELETE SET NULL,
    CONSTRAINT core_label_shares_subject CHECK ((user_id IS NOT NULL) <> (group_id IS NOT NULL))
);
CREATE UNIQUE INDEX idx_core_label_shares_user  ON core.label_shares(label_id, user_id)  WHERE user_id  IS NOT NULL;
CREATE UNIQUE INDEX idx_core_label_shares_group ON core.label_shares(label_id, group_id) WHERE group_id IS NOT NULL;
CREATE INDEX idx_core_label_shares_label   ON core.label_shares(label_id);
CREATE INDEX idx_core_label_shares_subject ON core.label_shares(user_id, group_id);

-- Single source of truth for label visibility. Returns one row per label the
-- user may see, with the effective rights (the most permissive share wins when
-- several apply, e.g. a direct share plus a group share).
CREATE OR REPLACE FUNCTION core.label_access(p_user UUID)
RETURNS TABLE (label_id UUID, is_owner BOOLEAN, can_manage BOOLEAN)
LANGUAGE sql STABLE AS $$
    SELECT a.label_id, bool_or(a.is_owner), bool_or(a.can_manage)
    FROM (
        SELECT l.id AS label_id, TRUE AS is_owner, TRUE AS can_manage
          FROM core.labels l
         WHERE l.owner_id = p_user
        UNION ALL
        SELECT s.label_id, FALSE, s.can_manage
          FROM core.label_shares s
         WHERE s.user_id = p_user
        UNION ALL
        SELECT s.label_id, FALSE, s.can_manage
          FROM core.label_shares s
          JOIN core.user_group_members m ON m.group_id = s.group_id
         WHERE m.user_id = p_user
    ) a
    GROUP BY a.label_id
$$;
