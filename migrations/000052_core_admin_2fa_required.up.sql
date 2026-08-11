-- Instance-wide requirement: administrators must carry a second factor.
--
-- DISABLED HERE, ON PURPOSE. Turning it on during a migration would, on any
-- existing instance, lock out every administrator who has not yet enrolled — with
-- no way back in through the web. The operator turns it on knowingly, from
-- Administration → Paramètres, once backup codes exist (migration 000050) and the
-- local recovery command exists (`kubuno auth:recover`).
--
-- The grace window is armed PER ACCOUNT rather than computed from the moment the
-- setting was flipped: `core.users.admin_2fa_grace_until` is stamped the first
-- time an administrator without a second factor is seen while the requirement is
-- on. An account created after the flip therefore gets the full delay too,
-- instead of inheriting a window that has already elapsed. It is cleared when the
-- account enrols, so that disabling the second factor later re-arms a fresh delay
-- instead of refusing access on the spot.
ALTER TABLE core.users
    ADD COLUMN IF NOT EXISTS admin_2fa_grace_until TIMESTAMPTZ;

INSERT INTO core.settings (key, value, category, label, description, is_public)
VALUES
    ('security.admin_2fa_required', 'false', 'security',
     'Double authentification obligatoire pour les administrateurs',
     'Les comptes administrateurs sans second facteur perdent l''accès à l''administration à l''expiration du délai de grâce. Activez-la seulement après avoir vérifié que vos administrateurs disposent de codes de secours.',
     FALSE),
    ('security.admin_2fa_grace_days', '7', 'security',
     'Délai de grâce avant application (jours)',
     'Nombre de jours laissés à un administrateur sans second facteur pour en configurer un.',
     FALSE)
ON CONFLICT (key) DO NOTHING;
