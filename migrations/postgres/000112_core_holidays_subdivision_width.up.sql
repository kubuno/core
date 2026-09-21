-- A subdivision identifier is not always sixteen characters of ISO 3166-2.
--
-- Migration 000111 sized `subdivision` for the codes the standard defines —
-- `6AE`, `TX`, `BY`. The upstream dataset, however, addresses a handful of
-- regions by name rather than by code ("São Paulo Capital", "Stadt Zurich",
-- "South Canterbury"), because no ISO code exists for them. The generator now
-- derives an identifier from that name (`SAO-PAULO-CAPITAL`), which is ASCII and
-- upper case — and longer than sixteen characters.
--
-- The column is widened rather than the names truncated: a truncated identifier
-- is one that collides with its neighbour the day a second region shares its
-- first sixteen letters, and this is the value the whole referential is keyed
-- and inherited by.
--
-- Forty is the generator's own cap, so `<country>-<subdivision>` still fits the
-- 64-character `code` column with room to spare.
ALTER TABLE core.holiday_calendars
    ALTER COLUMN subdivision TYPE VARCHAR(40);
