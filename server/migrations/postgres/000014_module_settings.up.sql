-- 000014_module_settings.up.sql
-- Paramètres configurables par module via le panneau d'administration

INSERT INTO core.settings (key, value, category, label, is_public) VALUES
  -- Photos
  ('photos.thumbnail_size',           '256',          'photos',   'Taille des miniatures (px)',               FALSE),
  ('photos.jpeg_quality',             '85',           'photos',   'Qualité JPEG des miniatures (0–100)',      FALSE),
  ('photos.trash_auto_delete_days',   '30',           'photos',   'Auto-suppression corbeille (jours, 0=jamais)', FALSE),
  ('photos.allow_public_sharing',     'true',         'photos',   'Partage public activé',                   FALSE),
  ('photos.share_link_max_days',      '30',           'photos',   'Durée max des liens de partage (jours)',  FALSE),

  -- Agenda
  ('agenda.default_timezone',              '"Europe/Paris"', 'agenda',  'Fuseau horaire par défaut',               FALSE),
  ('agenda.week_starts_on',                '"monday"',       'agenda',  'Premier jour de la semaine',              FALSE),
  ('agenda.time_format',                   '"24h"',          'agenda',  'Format d''heure (12h / 24h)',              FALSE),
  ('agenda.default_event_duration_min',    '60',             'agenda',  'Durée par défaut des événements (min)',   FALSE),

  -- Notes
  ('notes.default_editor',                 '"wysiwyg"',      'notes',   'Mode éditeur par défaut',                 FALSE),
  ('notes.autosave_interval_s',            '30',             'notes',   'Intervalle auto-save (secondes)',         FALSE),
  ('notes.enable_spell_check',             'true',           'notes',   'Correcteur orthographique actif',         FALSE),
  ('notes.enable_bidirectional_links',     'true',           'notes',   'Liens bidirectionnels actifs',            FALSE),
  ('notes.default_reminder_before_min',    '60',             'notes',   'Rappel par défaut avant échéance (min)',  FALSE),

  -- Office
  ('office.default_format',                '"docx"',         'office',  'Format de document par défaut',           FALSE),
  ('office.autosave_interval_s',           '30',             'office',  'Intervalle auto-save (secondes)',         FALSE),
  ('office.track_changes_default',         'false',          'office',  'Mode révision activé par défaut',         FALSE),
  ('office.default_margins',               '"normal"',       'office',  'Marges par défaut',                       FALSE)

ON CONFLICT (key) DO NOTHING;
