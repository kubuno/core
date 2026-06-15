-- storage.max_upload_bytes est désormais géré uniquement dans la config du module files
DELETE FROM core.settings WHERE key = 'storage.max_upload_bytes';
