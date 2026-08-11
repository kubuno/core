-- Order matters only for the settings and privileges; the tables cascade.
DROP TABLE IF EXISTS core.holiday_unit_prefs;
DROP TABLE IF EXISTS core.holiday_exclusions;
DROP TABLE IF EXISTS core.holidays;
DROP TABLE IF EXISTS core.holiday_calendars;

DELETE FROM core.setting_values WHERE key IN
    ('intl.holiday_calendars', 'intl.holidays_enabled', 'intl.holidays_dataset');
DELETE FROM core.settings WHERE key IN
    ('intl.holiday_calendars', 'intl.holidays_enabled', 'intl.holidays_dataset');

DELETE FROM core.role_privileges WHERE privilege_key IN ('core.holidays.read', 'core.holidays.manage');
DELETE FROM core.privileges WHERE key IN ('core.holidays.read', 'core.holidays.manage');
