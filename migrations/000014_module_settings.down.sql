-- 000014_module_settings.down.sql

DELETE FROM core.settings WHERE key IN (
  'photos.thumbnail_size',
  'photos.jpeg_quality',
  'photos.trash_auto_delete_days',
  'photos.allow_public_sharing',
  'photos.share_link_max_days',
  'agenda.default_timezone',
  'agenda.week_starts_on',
  'agenda.time_format',
  'agenda.default_event_duration_min',
  'notes.default_editor',
  'notes.autosave_interval_s',
  'notes.enable_spell_check',
  'notes.enable_bidirectional_links',
  'notes.default_reminder_before_min',
  'office.default_format',
  'office.autosave_interval_s',
  'office.track_changes_default',
  'office.default_margins'
);
