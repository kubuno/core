-- Narrowing back would refuse the rows already loaded, so the identifiers that
-- no longer fit are dropped with their calendars first — the same thing the
-- widening was introduced to avoid, and the reason this direction is only ever
-- taken on an instance rolling the whole feature back.
DELETE FROM core.holiday_calendars WHERE LENGTH(subdivision) > 16;

ALTER TABLE core.holiday_calendars
    ALTER COLUMN subdivision TYPE VARCHAR(16);
