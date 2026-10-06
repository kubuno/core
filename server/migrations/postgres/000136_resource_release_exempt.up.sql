-- 000136_resource_release_exempt.up.sql
--
-- A room that is never handed back automatically.
--
-- Rooms are given back when the meeting holding them empties out, which is right
-- for an ordinary meeting room and wrong for a few: the board room somebody keeps
-- on purpose, the space a service books ahead of a busy week. The size and
-- duration limits already spare the obvious cases; this is the exception an
-- administrator declares for a specific room, because no rule can guess it.
--
-- Defaults to FALSE: the feature applies unless somebody says otherwise, which
-- is how it behaves where it comes from.
ALTER TABLE core.resources
    ADD COLUMN release_exempt BOOLEAN NOT NULL DEFAULT FALSE;
