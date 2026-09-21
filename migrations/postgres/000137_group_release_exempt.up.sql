-- 000137_group_release_exempt.up.sql
--
-- A group whose meetings never lose their room.
--
-- The room-level exception (`core.resources.release_exempt`, migration 000136)
-- protects a PLACE. This one protects a POPULATION: the meetings of a team whose
-- room must stay held whatever the guest list does — a management committee, an
-- on-call rota — wherever they happen to be meeting.
--
-- Carried by the group rather than by a list of groups kept in a setting: a
-- group already has an administration screen, and a setting naming groups by
-- identifier would rot the day one is renamed or deleted, silently widening the
-- rule instead of narrowing it.
ALTER TABLE core.user_groups
    ADD COLUMN release_exempt BOOLEAN NOT NULL DEFAULT FALSE;
