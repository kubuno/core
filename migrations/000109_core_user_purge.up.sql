-- ── Suppression définitive d'un compte ───────────────────────────────────────
--
-- Jusqu'ici, supprimer un compte le **désactivait** (`is_active = FALSE`) et
-- rien d'autre. Il n'existait aucune façon d'effacer réellement une ligne : les
-- comptes s'accumulaient, y compris ceux créés pour un test de cinq minutes, et
-- une personne qui demandait l'effacement de ses données obtenait une
-- désactivation. Ce n'est pas la même promesse.
--
-- ⚠️ POINT DE SÛRETÉ QUI COMMANDE TOUT LE RESTE
--
-- `is_active = FALSE` recouvre aujourd'hui **deux** situations que rien ne
-- distingue en base : un compte suspendu (mesure temporaire, réversible, la
-- personne revient lundi) et un compte supprimé. Une purge automatique qui se
-- déclencherait sur `is_active` détruirait donc les comptes suspendus — sans
-- avertissement et sans retour.
--
-- D'où `deleted_at` : une colonne dont la présence signifie « quelqu'un a
-- demandé la suppression de ce compte, tel jour ». Elle seule arme la purge.
-- Et pour la même raison, **aucune reprise de l'existant n'est faite ici** :
-- les comptes déjà inactifs gardent `deleted_at IS NULL` et ne seront jamais
-- purgés automatiquement, parce que le système est incapable de dire lesquels
-- étaient suspendus. Les effacer demande un geste explicite, compte par compte.
ALTER TABLE core.users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

COMMENT ON COLUMN core.users.deleted_at IS
    'Date de la demande de suppression. NULL = compte vivant OU simplement suspendu. '
    'Seule cette colonne arme la purge automatique : is_active ne distingue pas '
    'la suspension de la suppression.';

-- Sert la requête de la purge, qui ne balaie jamais la table entière.
CREATE INDEX IF NOT EXISTS idx_core_users_deleted_at
    ON core.users (deleted_at) WHERE deleted_at IS NOT NULL;

-- ── Le délai de grâce ────────────────────────────────────────────────────────
--
-- 20 jours par défaut. Le chiffre n'est pas arbitraire : c'est la fenêtre que
-- les suites comparables laissent, et elle a été calibrée sur le délai réel
-- entre « on a supprimé le mauvais compte » et « quelqu'un s'en aperçoit » —
-- typiquement le retour de congés de l'intéressé.
--
-- 0 est accepté et signifie « purge à la première exécution du job ». C'est un
-- réglage d'instance : un opérateur soumis à une obligation d'effacement rapide
-- doit pouvoir le dire, et un autre qui préfère trois mois aussi.
INSERT INTO core.settings (key, value, category, label, description, is_public) VALUES (
    'users.purge_after_days',
    '20',
    'security',
    'Délai avant suppression définitive (jours)',
    'Nombre de jours pendant lesquels un compte supprimé reste récupérable. Passé ce délai, il est effacé définitivement, avec ses sessions, ses jetons et ses affectations. Les comptes seulement suspendus ne sont jamais concernés.',
    FALSE
) ON CONFLICT (key) DO NOTHING;
