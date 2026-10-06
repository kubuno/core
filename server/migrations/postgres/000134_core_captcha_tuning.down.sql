DELETE FROM core.settings WHERE key IN
    ('security.captcha_type', 'security.captcha_length', 'security.captcha_distortion',
     'security.captcha_noise', 'security.captcha_slider_tolerance', 'security.captcha_math_max');
ALTER TABLE core.captcha_challenges DROP COLUMN IF EXISTS kind;
