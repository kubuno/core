-- ── Password policy ─────────────────────────────────────────────────────────
--
-- What an instance may demand of a local password, and for how long that
-- password stays valid. Every key is declared `overridable`, so it is posted
-- per organisational unit through the scope engine (`core.setting_chain`,
-- migration 000060) and can be locked at any level — the console this imitates
-- offers the same policy per unit, without the lock.
--
-- Nothing here is decorative: `crate::settings::password_policy` refuses a
-- password that breaks the policy at EVERY point where one is set (sign-up,
-- self-service change, administrative creation, administrative reset, reset by
-- e-mailed link), and `handlers/auth/login` arms the forced-change screen when
-- an existing password has expired or no longer satisfies the policy.

-- ── When the current password was chosen ────────────────────────────────────
--
-- Backfilled from `created_at` rather than left NULL. A NULL would mean "never
-- expires" for every account that predates this migration, which would make the
-- expiry setting silently inert exactly where it matters most — on the oldest
-- passwords in the instance. An operator who turns expiry on is asking for the
-- old passwords to be renewed; the value that says so is the account's own age.
ALTER TABLE core.users ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ;

UPDATE core.users
   SET password_changed_at = created_at
 WHERE password_hash IS NOT NULL
   AND password_changed_at IS NULL;

-- ── Previous passwords, so that "no reuse" can mean anything ────────────────
--
-- Hashes only, argon2id like the live one, and never the plaintext. The row is
-- written inside the same transaction as the password change, so a history that
-- disagrees with the account is not representable. `ON DELETE CASCADE` takes
-- the history with the account: a purge that left the hashes behind would keep
-- verifiable material about somebody who asked to be erased.
CREATE TABLE IF NOT EXISTS core.password_history (
    id            BIGSERIAL PRIMARY KEY,
    user_id       UUID        NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    password_hash TEXT        NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- The only access pattern: the N most recent entries of one account.
CREATE INDEX IF NOT EXISTS password_history_user_recent_idx
    ON core.password_history (user_id, created_at DESC);

-- ── The policy itself ───────────────────────────────────────────────────────

INSERT INTO core.settings (key, value, default_value, category, label, description, is_public, scope, value_type) VALUES
    ('security.password_min_length', '8', '8', 'security',
     'Longueur minimale du mot de passe',
     'Nombre minimal de caractères exigé lors du choix ou du changement d''un mot de passe local. Accepté entre 8 et 128 ; en dessous de 8, la valeur est refusée à l''écriture plutôt que silencieusement corrigée. Ne s''applique pas aux comptes gouvernés par un annuaire ou un fournisseur d''identité : leur mot de passe n''est pas détenu ici.',
     FALSE, 'overridable', 'int'),

    ('security.password_strong', 'false', 'false', 'security',
     'Exiger un mot de passe robuste',
     'Le mot de passe doit combiner au moins trois des quatre familles de caractères (minuscules, majuscules, chiffres, symboles) et ne pas être une répétition ou une suite triviale. Activé, un mot de passe qui ne satisfait pas la règle est refusé avec la raison exacte, jamais accepté puis signalé plus tard.',
     FALSE, 'overridable', 'bool'),

    ('security.password_reuse_allowed', 'false', 'false', 'security',
     'Autoriser la réutilisation d''un ancien mot de passe',
     'Désactivé, un mot de passe déjà employé par le compte est refusé — la comparaison porte sur les empreintes conservées, jamais sur des mots de passe en clair. Activé, l''historique cesse d''être consulté (il continue d''être écrit, pour que la règle redevienne effective dès sa réactivation).',
     FALSE, 'overridable', 'bool'),

    ('security.password_history_depth', '5', '5', 'security',
     'Profondeur de l''historique des mots de passe',
     'Nombre d''anciens mots de passe comparés au nouveau quand la réutilisation est interdite. Accepté entre 1 et 24 : chaque entrée coûte une vérification argon2id, volontairement lente, au moment du changement.',
     FALSE, 'overridable', 'int'),

    ('security.password_expiry_days', '0', '0', 'security',
     'Expiration du mot de passe (jours)',
     'Au-delà de cet âge, la prochaine connexion réussie impose le changement du mot de passe avant toute autre action. 0 désactive l''expiration. Les comptes existants comptent leur âge depuis leur création : activer l''expiration renouvellera donc immédiatement les mots de passe les plus anciens.',
     FALSE, 'overridable', 'int'),

    ('security.password_enforce_at_login', 'false', 'false', 'security',
     'Appliquer la politique à la prochaine connexion',
     'Le mot de passe présenté à la connexion est confronté à la politique en vigueur ; s''il ne la satisfait plus, la session s''ouvre mais impose d''abord un changement. Désactivé, un durcissement de la politique ne s''applique qu''aux mots de passe choisis après lui.',
     FALSE, 'overridable', 'bool'),

    ('auth.self_service_recovery', 'true', 'true', 'security',
     'Réinitialisation autonome du mot de passe',
     'Le formulaire « mot de passe oublié » envoie un lien de réinitialisation. Désactivé pour une portée, la demande reste acceptée à l''identique — aucune réponse ne révèle l''existence d''un compte — mais aucun lien n''est émis : seul un administrateur peut alors réinitialiser le mot de passe.',
     FALSE, 'overridable', 'bool')
ON CONFLICT (key) DO NOTHING;
