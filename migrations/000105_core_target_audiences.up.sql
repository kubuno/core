-- ── Audiences cibles ─────────────────────────────────────────────────────────
--
-- Une audience cible est une liste de destinataires *recommandés* : ce que
-- l'instance propose à quelqu'un au moment où il partage, pour qu'il n'ait pas à
-- choisir entre « une personne à la fois » et « tout le monde ». C'est la seule
-- raison d'être de cet objet : réduire le partage trop large par accident.
--
-- Ce qu'une audience n'est PAS, et pourquoi c'est une table à part plutôt qu'un
-- drapeau sur core.user_groups :
--
--   * elle n'accorde AUCUN droit. Être dans une audience ne donne accès à rien ;
--     cela rend seulement visible une proposition dans une boîte de dialogue de
--     partage. Un groupe, lui, porte des permissions (core.user_groups.permissions).
--     Fondre les deux ferait qu'élargir une suggestion élargirait des droits.
--   * elle n'est pas une liste de diffusion, et n'a pas d'adresse.
--   * elle ne s'imbrique pas : une audience ne peut pas être membre d'une autre.
--     Sans cette règle, « qui verra cette proposition » ne serait plus lisible en
--     un écran, ce qui est exactement la question à laquelle un administrateur
--     doit pouvoir répondre avant d'appliquer une audience.
--
-- Le membre d'une audience est un groupe ou un compte. Les groupes sont
-- l'usage recommandé (une audience suit alors l'organisation sans être
-- ré-éditée), mais un compte isolé reste possible pour les cas où aucun groupe
-- n'existe.

CREATE TABLE core.target_audiences (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- 40 caractères : la même limite que la console Google, pour une raison qui
    -- n'est pas de l'imitation — ce nom s'affiche dans une liste déroulante de
    -- partage, à côté d'un nom de fichier, et un libellé plus long y serait
    -- tronqué au moment précis où il doit être compris.
    name        VARCHAR(40) NOT NULL,
    -- Visible en infobulle au moment de partager : c'est la phrase qui répond à
    -- « qui est là-dedans, au juste ? » sans quitter la boîte de dialogue.
    description VARCHAR(150),
    -- L'audience « toute l'organisation », créée ci-dessous. Ni supprimable ni
    -- renommable en tant que membre-set : elle n'a pas de membres explicites,
    -- elle désigne l'ensemble des comptes actifs. Une instance a toujours au
    -- moins une audience applicable, sinon la fonction s'éteint sans le dire.
    is_everyone BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by  UUID REFERENCES core.users(id) ON DELETE SET NULL
);

-- Unicité insensible à la casse ET aux espaces de bord : deux audiences nommées
-- « Direction » et « direction  » sont indiscernables dans la liste où elles
-- comptent, celle du partage.
CREATE UNIQUE INDEX idx_core_ta_name ON core.target_audiences (LOWER(BTRIM(name)));

-- Une seule audience « tout le monde ». L'index partiel le garantit en base
-- plutôt que dans le handler, où une seconde route l'oublierait un jour.
CREATE UNIQUE INDEX idx_core_ta_everyone ON core.target_audiences (is_everyone)
    WHERE is_everyone;

CREATE TRIGGER target_audiences_updated_at
    BEFORE UPDATE ON core.target_audiences
    FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

-- ── Membres ──────────────────────────────────────────────────────────────────
--
-- `member_type` + `member_id` plutôt que deux colonnes nullables : une ligne
-- désigne exactement une chose, et la clé primaire empêche le même membre d'être
-- ajouté deux fois sous deux formes.
--
-- Pas de clé étrangère polymorphe possible, donc le nettoyage des comptes et
-- groupes supprimés se fait par les deux déclencheurs plus bas — une ligne
-- orpheline ferait apparaître un membre fantôme dans le décompte présenté à
-- l'administrateur, c'est-à-dire un mensonge sur l'étendue d'un partage.
CREATE TABLE core.target_audience_members (
    audience_id UUID NOT NULL REFERENCES core.target_audiences(id) ON DELETE CASCADE,
    member_type VARCHAR(10) NOT NULL CHECK (member_type IN ('user', 'group')),
    member_id   UUID NOT NULL,
    added_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    added_by    UUID REFERENCES core.users(id) ON DELETE SET NULL,
    PRIMARY KEY (audience_id, member_type, member_id)
);

CREATE INDEX idx_core_tam_member ON core.target_audience_members(member_type, member_id);

CREATE OR REPLACE FUNCTION core.prune_audience_member() RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM core.target_audience_members
     WHERE member_id = OLD.id
       AND member_type = TG_ARGV[0];
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_prune_audience_members
    AFTER DELETE ON core.users
    FOR EACH ROW EXECUTE FUNCTION core.prune_audience_member('user');

CREATE TRIGGER groups_prune_audience_members
    AFTER DELETE ON core.user_groups
    FOR EACH ROW EXECUTE FUNCTION core.prune_audience_member('group');

-- ── Application à un module, par unité organisationnelle ─────────────────────
--
-- Une audience existe mais ne se voit nulle part tant qu'elle n'est pas
-- *appliquée*. La politique répond à : « dans tel module, pour les comptes de
-- telle unité, quelles propositions de partage apparaissent, et dans quel
-- ordre ? »
--
-- `module_id` est une chaîne libre et non une énumération : le core ne connaît
-- aucun module par son nom. Un module déclare qu'il sait consommer des audiences
-- au moment de son enregistrement ; la console n'offre que ceux-là, et une
-- politique visant un module désinstallé se contente de ne rien produire.
-- Pas de clé étrangère vers core.modules pour la même raison : désinstaller un
-- module ne doit pas effacer silencieusement la politique que l'administrateur
-- avait écrite, il la retrouvera à la réinstallation.
--
-- `position` porte la priorité, 0 en tête. La première ligne est l'audience
-- « principale » : celle proposée par défaut. Il n'y a pas de colonne
-- `is_primary` — deux façons d'exprimer le même fait finissent toujours par se
-- contredire.
CREATE TABLE core.target_audience_policies (
    org_unit_id UUID NOT NULL REFERENCES core.org_units(id) ON DELETE CASCADE,
    module_id   VARCHAR(100) NOT NULL,
    audience_id UUID NOT NULL REFERENCES core.target_audiences(id) ON DELETE CASCADE,
    position    SMALLINT NOT NULL CHECK (position >= 0 AND position < 5),
    PRIMARY KEY (org_unit_id, module_id, audience_id)
);

-- Une seule audience par rang, sinon « la principale » serait ambiguë.
CREATE UNIQUE INDEX idx_core_tap_rank
    ON core.target_audience_policies (org_unit_id, module_id, position);

CREATE INDEX idx_core_tap_audience ON core.target_audience_policies(audience_id);

-- ── L'audience de départ ─────────────────────────────────────────────────────
--
-- Sans elle, la page s'ouvrirait vide et la fonction n'aurait aucun comportement
-- par défaut : partager reviendrait de nouveau à choisir entre une personne et
-- l'internet. Elle n'a pas de membres — `is_everyone` dit « tous les comptes
-- actifs », ce qui reste vrai après chaque création de compte, sans entretien.
INSERT INTO core.target_audiences (name, description, is_everyone)
VALUES (
    'Toute l''organisation',
    'Tous les comptes actifs de cette instance.',
    TRUE
);

-- ── Privilèges ───────────────────────────────────────────────────────────────
--
-- Deux clés propres plutôt qu'un emprunt à `core.groups.*`. La console Google
-- exige d'ailleurs deux droits distincts ici (Groups pour créer, Service
-- Settings pour appliquer), et la raison tient : composer une audience et
-- décider où elle s'applique sont deux pouvoirs différents. Le second élargit ce
-- que tout le monde voit en partageant ; le premier ne fait que préparer une
-- liste.
--
-- Non « scopable » à une sous-arborescence : une audience traverse les unités par
-- construction — c'est même son objet — donc confiner sa gestion à un sous-arbre
-- donnerait un pouvoir dont la portée réelle serait plus large que sa promesse.
-- L'application, elle, vise une unité, mais elle passe par
-- `core.audiences.apply`, qui reste instance-wide pour la même raison : appliquer
-- sur une unité parente retombe sur ses enfants.
INSERT INTO core.privileges (key, namespace, domain, verb, label, description, is_ou_scopable) VALUES
    ('core.audiences.read',   'core', 'audiences', 'read',    'Consulter les audiences cibles', 'Lister les audiences cibles, leurs membres et leur application.', FALSE),
    ('core.audiences.manage', 'core', 'audiences', 'manage',  'Gérer les audiences cibles',     'Créer, renommer, supprimer des audiences et modifier leurs membres.', FALSE),
    -- Le domaine porte le sens, pas le verbe : `core.privileges` impose
    -- key = namespace.domain.verb et un vocabulaire de verbes fermé, où
    -- « apply » n'existe pas. Même forme que `core.user_suspension.execute`.
    ('core.audience_policy.execute', 'core', 'audience_policy', 'execute', 'Appliquer les audiences cibles', 'Choisir quelles audiences sont proposées, dans quel module et pour quelle unité organisationnelle.', FALSE)
ON CONFLICT (key) DO NOTHING;

-- Aucune affectation de rôle ici. Le super-administrateur porte `is_superuser`,
-- donc il détient déjà ces trois clés — les lui insérer explicitement créerait
-- une seconde source de vérité qui divergerait au premier renommage. Les autres
-- rôles système ne les reçoivent pas : proposer une audience à toute une unité
-- n'est pas un pouvoir qu'on hérite d'un rôle taillé pour autre chose, et c'est
-- à l'administrateur de le donner sciemment.
