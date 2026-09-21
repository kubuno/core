-- ── Qui utilise quelle application, et quand ────────────────────────────────
--
-- Le tableau de bord d'administration savait tout compter sauf la chose qu'un
-- exploitant regarde en premier : **l'usage réel des applications**. Aucune
-- table ne le portait, et aucun module ne le déclarait.
--
-- Or le core le sait déjà, sans rien demander à personne : **toute** requête
-- d'un navigateur vers un module traverse son proxy inverse
-- (`crates/kubuno-core/src/modules/proxy.rs`). À cet endroit, et à cet endroit
-- seulement, se croisent l'identité du compte et l'identifiant du module. Cette
-- table est la trace — volontairement minuscule — de ce croisement.
--
-- ## Ce qui est enregistré, et ce qui ne l'est JAMAIS
--
-- Une ligne = (jour, module, compte, nombre d'appels). Rien d'autre.
--
--   * **Pas d'URL, pas de chemin, pas de méthode HTTP.** « Ce compte a utilisé
--     drive mardi » est une donnée d'exploitation ; « ce compte a ouvert
--     /drive/files/<id> à 14 h 03 » est une surveillance. La première suffit à
--     décider d'un déploiement, la seconde ne sert qu'à surveiller quelqu'un.
--   * **Pas d'adresse IP, pas d'agent utilisateur, pas de contenu.** Le
--     répertoire des appareils (`core.devices`) porte déjà ces faits-là, sous
--     son propre privilège et avec sa propre rétention.
--   * **Pas d'horodatage plus fin que le jour.** Le compteur est agrégé à la
--     journée à l'écriture, dans le fuseau de l'instance : il est structurellement
--     incapable de reconstituer un emploi du temps.
--
-- ## Une ligne par (jour, module, compte) — jamais une par requête
--
-- Un journal d'accès ferait grossir la base d'un ordre de grandeur pour un
-- tableau de bord qui n'affiche que des sommes. Le compteur est incrémenté en
-- mémoire dans le processus (coût : une entrée de table de hachage) puis
-- consolidé périodiquement en un seul `INSERT … ON CONFLICT DO UPDATE` par
-- lot — hors du chemin de la réponse, qui n'attend jamais la base.
--
-- ## Rétention
--
-- 90 jours par défaut (`usage.retention_days`), purgés par la tâche
-- `core.purge_module_usage`. Le chiffre s'aligne sur `rules.execution_retention_days`,
-- la rétention la plus courte déjà en vigueur pour un journal exploitable : une
-- donnée de fréquentation ne mérite pas d'être gardée plus longtemps qu'un
-- journal d'exécution, et le sélecteur de période du tableau de bord s'arrête de
-- toute façon à 180 jours.
--
-- `ON DELETE CASCADE` : l'effacement d'un compte efface ce qu'il a fréquenté.
-- C'est la seule façon qu'une purge de compte soit une vraie purge.
CREATE TABLE core.module_usage_daily (
    -- Jour civil DANS LE FUSEAU DE L'INSTANCE, estampillé à l'incrément. C'est
    -- ce qui permet à la série du tableau de bord d'être lue telle quelle, sans
    -- conversion, sur le même axe que les autres panneaux.
    day        DATE         NOT NULL,
    -- Identifiant du module tel qu'il est enregistré (`core.modules.id`). Pas de
    -- clé étrangère : un module désinstallé ne doit pas emporter l'historique de
    -- sa propre fréquentation, qui est précisément ce qu'on regarde pour décider
    -- de le désinstaller.
    module_id  VARCHAR(100) NOT NULL,
    user_id    UUID         NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    -- Nombre d'appels proxifiés. Sert à distinguer un usage soutenu d'un simple
    -- passage ; le tableau de bord compte surtout des comptes DISTINCTS, pour
    -- lesquels la seule existence de la ligne suffit.
    hits       BIGINT       NOT NULL DEFAULT 0 CHECK (hits >= 0),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    PRIMARY KEY (day, module_id, user_id)
);

-- Sert la fenêtre du tableau de bord (`day BETWEEN … AND …`) et la purge.
CREATE INDEX idx_core_module_usage_day ON core.module_usage_daily (day);

COMMENT ON TABLE core.module_usage_daily IS
    'Fréquentation des modules, agrégée par (jour, module, compte). Écrite par le '
    'proxy du core hors du chemin de réponse. Ne contient ni URL, ni adresse IP, '
    'ni contenu. Purgée par core.purge_module_usage selon usage.retention_days.';

INSERT INTO core.settings (key, value, category, label, description, is_public) VALUES
    ('usage.retention_days', '90', 'general', 'Rétention des compteurs de fréquentation (jours)',
     'Au-delà, les compteurs (jour, module, compte) du tableau de bord sont effacés. 0 désactive la conservation.', FALSE)
ON CONFLICT (key) DO NOTHING;
