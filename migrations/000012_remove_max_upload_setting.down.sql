INSERT INTO core.settings (key, value, category, label, is_public) VALUES
    ('storage.max_upload_bytes', '5368709120', 'storage', 'Taille max upload (bytes)', TRUE)
ON CONFLICT (key) DO NOTHING;
