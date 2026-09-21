-- ── Bâtiments et ressources ──────────────────────────────────────────────────
--
-- L'annuaire ne décrit pas que des personnes. Une organisation a aussi des
-- lieux et des objets qu'on se partage : des salles de réunion, un vidéo-
-- projecteur sur chariot, deux vélos de service. Tant qu'ils n'existent nulle
-- part, chacun les réserve par message, personne ne sait ce qui existe, et deux
-- réunions atterrissent dans la même salle.
--
-- Ces objets appartiennent au **core** et non à un module :
--
--   * c'est de l'annuaire — la même nature que les comptes, les groupes et les
--     unités organisationnelles : une description de l'organisation, pas d'un
--     usage ;
--   * plusieurs modules les consomment (un agenda les réserve, une signalétique
--     les affiche, un inventaire les compte). Les loger dans le premier module
--     qui en a eu besoin obligerait tous les autres à en dépendre, ce que
--     l'architecture interdit ;
--   * le core ne connaît aucun module par son nom : il publie ce catalogue en
--     lecture sur `/internal/directory/resources`, et n'a rien à savoir de qui
--     l'appelle.
--
-- ── Ce que le schéma garantit lui-même ───────────────────────────────────────
--
-- Trois règles sont portées par la base plutôt que par le handler, parce
-- qu'elles doivent rester vraies quelle que soit la route qui écrit :
--
--   1. un étage cité par une ressource existe **dans son bâtiment** (clé
--      étrangère composite) — sinon « 3e étage » désignerait un étage d'un autre
--      immeuble, ou aucun ;
--   2. une capacité est un entier strictement positif — une salle de zéro place
--      est réservable et ne devrait pas l'être ;
--   3. la catégorie appartient à un vocabulaire fermé, et le type ne se remplit
--      que pour ce qui n'est pas une salle.

-- ── Bâtiments ────────────────────────────────────────────────────────────────
--
-- `building_key` est l'identifiant **stable** : celui qu'un administrateur
-- choisit, qui apparaît dans le nom généré des ressources, et sur lequel les
-- imports ultérieurs se recaleront. Il est distinct de `id` (technique, jamais
-- montré) et de `name` (libellé, librement modifiable) : confondre les trois est
-- ce qui fait qu'un renommage casse des références.
--
-- Pas d'espace dans la clé : elle est suivie d'un tiret puis d'un étage dans le
-- nom généré (`SIEGE-2 Amphi (40)`), et un espace y rendrait la lecture
-- ambiguë au moment précis où ce nom sert à distinguer deux salles.
CREATE TABLE core.buildings (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    building_key VARCHAR(100) NOT NULL
                     CHECK (building_key ~ '^[A-Za-z0-9._-]{1,100}$'),
    name         VARCHAR(100),
    -- Obligatoire : un bâtiment sans adresse ne répond pas à la seule question
    -- que se pose quelqu'un qui a rendez-vous là-bas.
    address      TEXT         NOT NULL CHECK (BTRIM(address) <> ''),
    -- Réservée à l'administration : ce qui ne doit pas s'afficher au moment de
    -- réserver (code d'accès, contrainte de gardiennage, note interne).
    description  VARCHAR(256),
    -- Les deux ensemble ou aucune des deux : une latitude seule ne place rien
    -- sur une carte et se propagerait comme une coordonnée valide.
    latitude     NUMERIC(9,6) CHECK (latitude  BETWEEN -90  AND 90),
    longitude    NUMERIC(9,6) CHECK (longitude BETWEEN -180 AND 180),
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    created_by   UUID REFERENCES core.users(id) ON DELETE SET NULL,
    CONSTRAINT buildings_coordinates_pair
        CHECK ((latitude IS NULL) = (longitude IS NULL))
);

-- Unicité insensible à la casse : `SIEGE` et `siege` désigneraient le même
-- immeuble pour tout le monde sauf pour la base.
CREATE UNIQUE INDEX idx_core_buildings_key ON core.buildings (LOWER(building_key));

CREATE TRIGGER buildings_updated_at
    BEFORE UPDATE ON core.buildings
    FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

-- ── Étages ───────────────────────────────────────────────────────────────────
--
-- Une table plutôt qu'un `TEXT[]` sur le bâtiment, pour une raison unique mais
-- décisive : c'est la seule forme sur laquelle une ressource peut poser une clé
-- étrangère. Avec un tableau, « 3e étage » resterait une chaîne libre, et rien
-- n'empêcherait une salle d'être au 7e d'un immeuble qui en compte quatre.
--
-- `position` porte l'ordre voulu (rez-de-chaussée d'abord, puis 2, 3, 5A…),
-- parce qu'aucun tri automatique ne le retrouve : « Accueil » ne se compare pas
-- à « 5A », et l'ordre d'un immeuble est une donnée, pas un calcul.
CREATE TABLE core.building_floors (
    building_id UUID        NOT NULL REFERENCES core.buildings(id) ON DELETE CASCADE,
    name        VARCHAR(15) NOT NULL CHECK (BTRIM(name) <> ''),
    position    SMALLINT    NOT NULL CHECK (position >= 0),
    PRIMARY KEY (building_id, name)
);

-- Deux étages ne peuvent pas occuper le même rang : « le suivant » doit avoir
-- une réponse.
CREATE UNIQUE INDEX idx_core_floors_rank
    ON core.building_floors (building_id, position);
-- Même argument que pour la clé du bâtiment : « 2 » et « 2 » à la casse près
-- sont le même étage pour l'œil.
CREATE UNIQUE INDEX idx_core_floors_name
    ON core.building_floors (building_id, LOWER(name));

-- ── Fonctionnalités ──────────────────────────────────────────────────────────
--
-- Un équipement nommé — visioconférence, tableau blanc, boucle magnétique —
-- attaché à autant de ressources qu'on veut. Objet à part, et pas une colonne
-- de plus sur les ressources : c'est ce qui permet de chercher « les salles avec
-- visioconférence » sans dépendre de la façon dont chacun l'a orthographié.
CREATE TABLE core.resource_features (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- Court : ce libellé est concaténé à la fin du nom généré de chaque
    -- ressource qui le porte.
    name        VARCHAR(60) NOT NULL CHECK (BTRIM(name) <> ''),
    description VARCHAR(256),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by  UUID REFERENCES core.users(id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX idx_core_features_name
    ON core.resource_features (LOWER(BTRIM(name)));

CREATE TRIGGER resource_features_updated_at
    BEFORE UPDATE ON core.resource_features
    FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

-- ── Ressources ───────────────────────────────────────────────────────────────
--
-- L'identifiant d'une ressource est son `id`, généré par la base et jamais
-- modifiable. C'est délibérément le seul : partout où un identifiant de
-- ressource est *fourni* par l'appelant, le corriger crée un doublon au lieu de
-- renommer, et la seule protection possible est de ne jamais offrir ce champ.
--
-- `generated_name` est calculé côté serveur (jamais saisi) et réécrit à chaque
-- écriture qui le concerne — la ressource elle-même, la clé de son bâtiment, le
-- nom d'un de ses étages ou d'une de ses fonctionnalités. Il est *stocké* et non
-- recalculé à la lecture pour que le tri, la recherche et l'export portent sur
-- exactement ce qui s'affiche.
CREATE TABLE core.resources (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- Court, parce qu'il apparaît dans une liste de choix au moment de réserver,
    -- déjà préfixé du bâtiment et de l'étage.
    name             VARCHAR(45) NOT NULL CHECK (BTRIM(name) <> ''),
    building_id      UUID        NOT NULL REFERENCES core.buildings(id) ON DELETE RESTRICT,
    -- Vocabulaire fermé. `meeting_room` a une forme de nom généré à part parce
    -- qu'une salle n'a pas de « type » : elle *est* le type.
    category         VARCHAR(20) NOT NULL
                         CHECK (category IN ('meeting_room', 'other')),
    -- « Vélo », « Salon », « Vidéoprojecteur » : ce que la ressource est, quand
    -- ce n'est pas une salle.
    resource_type    VARCHAR(45),
    floor_name       VARCHAR(15) NOT NULL,
    -- Où dans l'étage : « Aile nord », « Open-space 2 ».
    floor_section    VARCHAR(15),
    capacity         INTEGER     NOT NULL CHECK (capacity > 0),
    -- Visible au moment de réserver : la phrase qui aide à choisir.
    user_description VARCHAR(1000),
    -- Réservée à l'administration, comme pour un bâtiment.
    description      VARCHAR(1000),
    generated_name   VARCHAR(400) NOT NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by       UUID REFERENCES core.users(id) ON DELETE SET NULL,
    -- La règle 1 : l'étage cité existe, et existe *dans ce bâtiment*.
    -- `ON UPDATE CASCADE` pour qu'un étage renommé emmène ses ressources avec
    -- lui ; pas de `ON DELETE CASCADE` — supprimer un étage ne doit pas faire
    -- disparaître silencieusement les salles qui s'y trouvent.
    CONSTRAINT resources_floor_in_building
        FOREIGN KEY (building_id, floor_name)
        REFERENCES core.building_floors(building_id, name)
        ON UPDATE CASCADE,
    -- Le type ne se remplit que hors salle, et s'y remplit toujours : la forme
    -- « autre » du nom généré commence par lui, donc l'omettre produirait un nom
    -- qui débute par un tiret.
    CONSTRAINT resources_type_iff_other
        CHECK ((category = 'other') = (resource_type IS NOT NULL))
);

CREATE INDEX idx_core_resources_building ON core.resources(building_id);
CREATE INDEX idx_core_resources_category ON core.resources(category);
-- Deux ressources homonymes au même étage du même bâtiment sont
-- indiscernables dans la liste où elles comptent, celle de la réservation.
CREATE UNIQUE INDEX idx_core_resources_name
    ON core.resources (building_id, LOWER(floor_name), LOWER(BTRIM(name)));

CREATE TRIGGER resources_updated_at
    BEFORE UPDATE ON core.resources
    FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

-- ── Ressource × fonctionnalité ───────────────────────────────────────────────
CREATE TABLE core.resource_feature_links (
    resource_id UUID NOT NULL REFERENCES core.resources(id)         ON DELETE CASCADE,
    feature_id  UUID NOT NULL REFERENCES core.resource_features(id) ON DELETE CASCADE,
    PRIMARY KEY (resource_id, feature_id)
);

CREATE INDEX idx_core_rfl_feature ON core.resource_feature_links(feature_id);

-- ── Privilèges ───────────────────────────────────────────────────────────────
--
-- Deux clés, lecture et écriture. Séparées parce que la lecture est ce dont un
-- module ou un opérateur délégué a besoin (« où est cette salle, combien de
-- places »), là où l'écriture change ce que toute l'organisation voit dans son
-- agenda.
--
-- Verbes `read` et `manage` : `core.privileges` impose
-- `key = namespace.domain.verb` avec un vocabulaire de verbes fermé
-- (read, create, update, delete, manage, execute). Le sens d'un éventuel
-- troisième pouvoir devrait donc être porté par le **domaine**, jamais par un
-- verbe inventé — c'est la forme de `core.user_suspension.execute`.
--
-- Non « scopable » à une sous-arborescence : un bâtiment n'appartient à aucune
-- unité organisationnelle. Le confiner à un sous-arbre donnerait un pouvoir dont
-- la portée réelle serait plus large que sa promesse — exactement le piège que
-- `ensure_scopable` existe pour fermer.
INSERT INTO core.privileges (key, namespace, domain, verb, label, description, is_ou_scopable) VALUES
    ('core.resources.read',   'core', 'resources', 'read',   'Consulter les bâtiments et les ressources', 'Lister les bâtiments, leurs étages, les ressources réservables et leurs fonctionnalités.', FALSE),
    ('core.resources.manage', 'core', 'resources', 'manage', 'Gérer les bâtiments et les ressources',     'Créer, modifier et supprimer des bâtiments, des ressources et des fonctionnalités.',        FALSE)
ON CONFLICT (key) DO NOTHING;

-- Aucune affectation de rôle ici : le super-administrateur porte `is_superuser`
-- et détient donc déjà ces deux clés. Les lui insérer explicitement créerait une
-- seconde source de vérité qui divergerait au premier renommage.
