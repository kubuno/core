-- Data protection: content detectors, the synchronous gate, and the audit trail
-- of what the gate decided.
--
-- This migration extends the rule engine of 000061. It does not replace any part
-- of it: a detector is a new kind of *condition leaf* in the same closed serde
-- vocabulary, and the gate is a new *entry point* into the same evaluator.
--
-- ## What a detector is, and why it is a row rather than code
--
-- "Does this text carry a bank account number" is a question whose answer
-- changes with the country, the year, and the customer — an instance in France
-- needs NIR and RIB, an instance elsewhere needs neither. Compiling the answer
-- into the binary would mean a release per policy change. A detector is
-- therefore data: a pattern, a word list or a checksum, seeded with a
-- sovereign-first catalogue an administrator may extend.
--
-- ## Three thresholds, not one, and why the third is the one that matters
--
--   * `min_confidence`      — how sure a single match must be;
--   * `min_matches`         — how many matches the part must carry;
--   * `min_unique_matches`  — how many *distinct* values those matches cover.
--
-- Without the third, one IBAN quoted fifty times in a thread satisfies "more
-- than twenty account numbers = mass leak" and the rule fires on a conversation
-- about a single invoice. Counting occurrences answers "how much text is about
-- this"; counting distinct values answers "how many people are exposed", and
-- only the second is what a leak rule means. Distinctness is computed over a
-- fingerprint of the normalised match, never over the value: nothing derived
-- from inspected content leaves the process.
--
-- ## Denial of service through a pattern an administrator wrote
--
-- Patterns are authored by an administrator and executed against content
-- produced by users. Three independent bounds, described in
-- `crate::rules::detect::scan`:
--
--   1. the engine is Rust's `regex` — a finite automaton with no backtracking,
--      so catastrophic backtracking is impossible by construction rather than
--      by review;
--   2. the *compiled* size is bounded (`size_limit`, `dfa_size_limit`) and a
--      pattern that would exceed it is refused at write time, in front of the
--      administrator who can fix it;
--   3. the *inspection time* per content part is bounded by a wall clock
--      checked between chunks, and the part itself is truncated past a byte
--      ceiling — so a linear-time engine still cannot be handed a gigabyte.
--
-- ## What is never written here
--
-- No inspected content, and no detected value — not in this migration's tables,
-- not in `core.rule_executions`, not in the audit trail, not in a log line. The
-- gate persists counters and a short reference. That reference is the whole
-- contract with a blocked user: enough to phone somebody, never enough to map
-- the policy.

-- ── Detectors ────────────────────────────────────────────────────────────────
CREATE TABLE core.content_detectors (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Stable identifier a rule references. A rule names the *key*, not the id:
    -- a rule snapshot has to stay readable years later, and `core.iban` reads
    -- while a UUID does not.
    key         VARCHAR(120) NOT NULL UNIQUE,
    label       VARCHAR(200) NOT NULL,
    description TEXT,
    -- Drives grouping in the console only. Free-form on purpose: a category
    -- enum would be one more thing to migrate the day somebody adds a detector
    -- for a class nobody anticipated.
    category    VARCHAR(40) NOT NULL DEFAULT 'other',

    -- How the detector looks: a regular expression, a list of words, or a
    -- pattern whose candidates must pass an arithmetic check.
    kind        VARCHAR(16) NOT NULL CHECK (kind IN ('regex', 'wordlist', 'checksum')),

    -- `regex`/`checksum`: the pattern. `wordlist`: NULL, the terms are compiled
    -- into an alternation with word boundaries.
    pattern     TEXT,
    -- `wordlist`: ["mot de passe", "password", …]
    terms       JSONB NOT NULL DEFAULT '[]',
    -- The arithmetic check a candidate must pass. NULL = none.
    -- A failed checksum DISCARDS the candidate rather than lowering its score:
    -- that is the difference between "sixteen digits" and "a card number".
    checksum    VARCHAR(16) CHECK (checksum IS NULL OR checksum IN
                    ('luhn', 'iban', 'nir', 'siret', 'rib_fr')),

    -- Proximity keywords. A sixteen-digit number next to "carte" is a card
    -- number; the same number in a table of order references is not.
    proximity_terms    JSONB   NOT NULL DEFAULT '[]',
    -- Characters either side of the match the keywords are looked for in.
    proximity_window   INTEGER NOT NULL DEFAULT 120
                           CHECK (proximity_window BETWEEN 0 AND 4000),
    -- When true, no keyword nearby means no match at all. Used by the detectors
    -- whose shape alone is worthless (a plaintext password is just a word).
    proximity_required BOOLEAN NOT NULL DEFAULT FALSE,

    -- Confidence, built additively and clamped to 1.
    base_confidence REAL NOT NULL DEFAULT 0.5 CHECK (base_confidence BETWEEN 0 AND 1),
    checksum_bonus  REAL NOT NULL DEFAULT 0.35 CHECK (checksum_bonus  BETWEEN 0 AND 1),
    proximity_bonus REAL NOT NULL DEFAULT 0.20 CHECK (proximity_bonus BETWEEN 0 AND 1),

    -- The three thresholds, as defaults. A rule's detector leaf may raise them;
    -- these are what the console proposes and what the test screen applies.
    min_confidence     REAL    NOT NULL DEFAULT 0.7 CHECK (min_confidence BETWEEN 0 AND 1),
    min_matches        INTEGER NOT NULL DEFAULT 1   CHECK (min_matches        BETWEEN 1 AND 10000),
    min_unique_matches INTEGER NOT NULL DEFAULT 1   CHECK (min_unique_matches BETWEEN 1 AND 10000),

    is_enabled  BOOLEAN NOT NULL DEFAULT TRUE,
    -- Seeded by this migration. A built-in may be edited and disabled — an
    -- instance whose regulator disagrees with our idea of a phone number must
    -- not have to fork the core — but never deleted, so a rule referencing it
    -- keeps meaning something.
    is_builtin  BOOLEAN NOT NULL DEFAULT FALSE,

    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by  UUID REFERENCES core.users(id) ON DELETE SET NULL,
    updated_by  UUID REFERENCES core.users(id) ON DELETE SET NULL
);
CREATE INDEX idx_core_detectors_enabled ON core.content_detectors(is_enabled) WHERE is_enabled;

CREATE TRIGGER content_detectors_updated_at BEFORE UPDATE ON core.content_detectors
    FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

COMMENT ON TABLE core.content_detectors IS
    'Détecteurs de contenu sensible : motifs, listes de mots, sommes de contrôle, proximité et seuils. Aucun contenu inspecté n''est stocké ici.';

-- ── The gate's trace in the execution log ────────────────────────────────────
-- The reference handed to a blocked user. Short, copyable, and the only thing
-- the user is told beyond "this contains sensitive data": naming the rule or the
-- detector would let anybody with a text box map the policy by bisection.
ALTER TABLE core.rule_executions
    ADD COLUMN IF NOT EXISTS gate_reference VARCHAR(16);
CREATE INDEX IF NOT EXISTS idx_core_rule_exec_gate_ref
    ON core.rule_executions(gate_reference) WHERE gate_reference IS NOT NULL;

COMMENT ON COLUMN core.rule_executions.gate_reference IS
    'Référence de requête remise à l''utilisateur bloqué par le portail. Permet de retrouver l''exécution sans rien révéler de la règle.';

-- ── Settings ─────────────────────────────────────────────────────────────────
INSERT INTO core.settings (key, value, category, label, description, is_public) VALUES
    ('rules.gate.enabled', 'true', 'rules', 'Portail de protection des données activé',
     'Lorsque désactivé, le portail autorise tout sans évaluer. Les règles restent consultables.', FALSE),

    -- Open by default, and that is a decision rather than an oversight. A gate
    -- that refuses when it is unwell converts a rules-engine hiccup into an
    -- instance-wide outage of every module that asks it a question. Regulated
    -- deployments set it to `closed` on purpose and accept that trade.
    ('rules.gate.fail_mode', '"open"', 'rules', 'Politique de défaillance du portail',
     'Que fait un module quand le portail est injoignable ou trop lent. « open » : l''opération passe et l''incident est journalisé — un moteur de règles en panne ne doit pas faire tomber le service. « closed » : l''opération est refusée, pour les instances réglementées.', FALSE),

    ('rules.gate.timeout_ms', '2000', 'rules', 'Délai maximal du portail (ms)',
     'Au-delà, la politique de défaillance s''applique : l''opération passe (open) ou est refusée (closed).', FALSE),

    ('rules.detectors.max_part_bytes', '262144', 'rules', 'Taille maximale inspectée par partie (octets)',
     'Une partie de contenu plus longue est tronquée avant inspection. Borne le coût d''une requête au portail.', FALSE),

    ('rules.detectors.max_scan_ms', '50', 'rules', 'Temps maximal d''inspection par partie (ms)',
     'L''inspection est découpée en tranches et s''arrête à ce budget. Deuxième garde-fou, indépendant de la taille : un motif écrit par un administrateur s''exécute sur du contenu produit par les utilisateurs.', FALSE),

    ('rules.detectors.max_parts', '16', 'rules', 'Nombre maximal de parties inspectées',
     'Un appel au portail au-delà de ce nombre voit les parties supplémentaires ignorées.', FALSE)
ON CONFLICT (key) DO NOTHING;


-- ── Seeded catalogue ─────────────────────────────────────────────────────────
-- Sovereign-first rather than US-centric: an instance in France needs the NIR,
-- the RIB and the SIREN long before it needs a US routing number, and the
-- catalogue an administrator opens on day one should reflect where they are.
--
-- The patterns are deliberately *loose* and the checksums *strict*: a shape that
-- over-matches plus an arithmetic check that discards the false positives beats
-- a clever pattern nobody can read. Confidence carries what is left.
--
-- Patterns are Rust `regex` syntax (`\b`, not PostgreSQL's `\m`/`\M`) and are
-- compiled **case-sensitively**: they spell out the classes they accept, so a
-- French number plate is not found inside an ordinary lower-case word. Proximity
-- keywords and word lists are matched case-insensitively — those are words, and
-- a word at the start of a sentence is the same word.
INSERT INTO core.content_detectors
    (key, label, description, category, kind, pattern, terms, checksum,
     proximity_terms, proximity_window, proximity_required,
     base_confidence, checksum_bonus, proximity_bonus,
     min_confidence, min_matches, min_unique_matches, is_builtin)
VALUES
    -- ── Identity ─────────────────────────────────────────────────────────────
    ('core.nir', 'Numéro de sécurité sociale (NIR)',
     'Numéro d''inscription au répertoire, 15 chiffres avec sa clé de contrôle. La clé (modulo 97) est vérifiée, y compris la correction corse 2A/2B.',
     'identity', 'checksum',
     '\b[12][ ]?\d{2}[ ]?\d{2}[ ]?(?:\d{2}|2[AB])[ ]?\d{3}[ ]?\d{3}[ ]?\d{2}\b',
     '[]', 'nir',
     '["sécurité sociale","securite sociale","numéro de sécurité","nir","carte vitale","assuré social","assure social"]',
     150, FALSE, 0.60, 0.35, 0.05, 0.70, 1, 1, TRUE),

    ('core.plate', 'Plaque d''immatriculation',
     'Immatriculation française, système SIV (AA-123-AA) ou ancien FNI (1234 AB 56). La forme seule est trop banale : un mot-clé de proximité est exigé.',
     'identity', 'regex',
     '\b(?:[A-Z]{2}[- ]\d{3}[- ][A-Z]{2}|\d{1,4}[ ][A-Z]{2,3}[ ]\d{2})\b',
     '[]', NULL,
     '["immatriculation","plaque","véhicule","vehicule","carte grise","voiture","automobile"]',
     150, TRUE, 0.45, 0.00, 0.30, 0.70, 1, 1, TRUE),

    -- ── Finance ──────────────────────────────────────────────────────────────
    ('core.iban', 'IBAN',
     'Numéro de compte bancaire international. Le contrôle modulo 97-10 est appliqué : une suite de caractères de la bonne forme mais fausse est écartée.',
     'finance', 'checksum',
     '\b[A-Z]{2}\d{2}(?:[ ]?[A-Z0-9]{4}){2,7}(?:[ ]?[A-Z0-9]{1,4})?\b',
     '[]', 'iban',
     '["iban","virement","rib","compte bancaire","bic","coordonnées bancaires","coordonnees bancaires"]',
     150, FALSE, 0.60, 0.35, 0.05, 0.70, 1, 1, TRUE),

    ('core.bic', 'BIC / SWIFT',
     'Code d''identification bancaire. Aucune somme de contrôle n''existe : la proximité d''un mot-clé est ce qui distingue un BIC d''un acronyme de huit lettres.',
     'finance', 'regex',
     '\b[A-Z]{4}(?:FR|BE|CH|LU|DE|ES|IT|PT|NL|GB|CA|MA|SN|CI|TN|DZ)[A-Z0-9]{2}(?:[A-Z0-9]{3})?\b',
     '[]', NULL,
     '["bic","swift","iban","virement","banque","coordonnées bancaires","coordonnees bancaires"]',
     150, TRUE, 0.45, 0.00, 0.30, 0.70, 1, 1, TRUE),

    ('core.card', 'Numéro de carte bancaire',
     'Carte de paiement, 13 à 19 chiffres. La clé de Luhn est vérifiée : sans elle, tout numéro de commande de seize chiffres serait une carte.',
     'finance', 'checksum',
     '\b(?:\d[ -]?){12,18}\d\b',
     '[]', 'luhn',
     '["carte","cb","visa","mastercard","cvv","cvc","expire","paiement","bancaire","carte bleue"]',
     120, FALSE, 0.50, 0.35, 0.15, 0.70, 1, 1, TRUE),

    ('core.rib', 'RIB français',
     'Relevé d''identité bancaire : code banque, code guichet, numéro de compte et clé RIB. La clé (modulo 97) est vérifiée, lettres du compte converties.',
     'finance', 'checksum',
     '\b\d{5}[ ]?\d{5}[ ]?[A-Z0-9]{11}[ ]?\d{2}\b',
     '[]', 'rib_fr',
     '["rib","relevé d''identité","releve d''identite","banque","guichet","virement","prélèvement","prelevement"]',
     150, FALSE, 0.55, 0.35, 0.10, 0.70, 1, 1, TRUE),

    ('core.siren', 'SIREN',
     'Identifiant d''entreprise à 9 chiffres, clé de Luhn vérifiée. Peu sensible seul : sans mot-clé adjacent, la confiance reste sous le seuil par défaut.',
     'finance', 'checksum',
     '\b\d{3}[ ]?\d{3}[ ]?\d{3}\b',
     '[]', 'luhn',
     '["siren","entreprise","société","societe","rcs","greffe","immatriculation","kbis"]',
     120, FALSE, 0.35, 0.25, 0.25, 0.70, 1, 1, TRUE),

    ('core.siret', 'SIRET',
     'Identifiant d''établissement à 14 chiffres, clé de Luhn vérifiée (règle particulière de La Poste incluse).',
     'finance', 'checksum',
     '\b\d{3}[ ]?\d{3}[ ]?\d{3}[ ]?\d{5}\b',
     '[]', 'siret',
     '["siret","établissement","etablissement","entreprise","société","societe","facture"]',
     120, FALSE, 0.50, 0.30, 0.15, 0.70, 1, 1, TRUE),

    -- ── Contact ──────────────────────────────────────────────────────────────
    ('core.email', 'Adresse électronique',
     'Adresse de courrier électronique. Très fréquente et rarement sensible seule : c''est le nombre de valeurs DISTINCTES qui fait la fuite, pas la présence.',
     'contact', 'regex',
     '\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,24}\b',
     '[]', NULL, '[]', 0, FALSE,
     0.85, 0.00, 0.00, 0.70, 1, 1, TRUE),

    ('core.phone', 'Numéro de téléphone',
     'Numéro français (0X ou +33) ou international au format E.164. La forme est trop banale pour valoir seule : un mot-clé de proximité est exigé.',
     'contact', 'regex',
     '(?:\+\d{1,3}[ .-]?)?\b0?\d(?:[ .-]?\d){7,12}\b',
     '[]', NULL,
     '["tél","tel","téléphone","telephone","portable","mobile","appeler","joindre","gsm","numéro","numero"]',
     100, TRUE, 0.45, 0.00, 0.30, 0.70, 1, 1, TRUE),

    -- ── Technical ────────────────────────────────────────────────────────────
    ('core.ip', 'Adresse IP',
     'Adresse IPv4 ou IPv6. Une adresse isolée n''est pas une fuite ; un export en contenant des centaines en est une — d''où le seuil de valeurs distinctes.',
     'technical', 'regex',
     '\b(?:(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)\b|\b(?:[0-9A-Fa-f]{1,4}:){7}[0-9A-Fa-f]{1,4}\b',
     '[]', NULL, '[]', 0, FALSE,
     0.80, 0.00, 0.00, 0.70, 1, 1, TRUE),

    -- ── Secrets ──────────────────────────────────────────────────────────────
    -- The two that justify blocking on a single occurrence: one leaked private
    -- key is a total compromise, and no threshold makes that better.
    ('core.private_key', 'Clé privée SSH ou PGP',
     'En-tête de bloc de clé privée (OpenSSH, RSA, EC, DSA, PGP). Une seule occurrence suffit : une clé privée qui sort est une compromission complète.',
     'secret', 'regex',
     '-----BEGIN (?:[A-Z0-9 ]+ )?PRIVATE KEY(?: BLOCK)?-----',
     '[]', NULL, '[]', 0, FALSE,
     0.98, 0.00, 0.00, 0.70, 1, 1, TRUE),

    ('core.api_token', 'Jeton d''API',
     'Jeton d''accès : secret interne Kubuno, jeton porteur JWT, clé d''API de forme courante, ou affectation explicite d''une clé.',
     'secret', 'regex',
     '\bkbms1\.[a-z0-9_-]+\.[A-Za-z0-9_-]{20,}\b|\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b|(?i:\b(?:api[_-]?key|api[_-]?token|secret[_-]?key|access[_-]?token)\b["'' :=]{1,4}[A-Za-z0-9_\-]{16,})',
     '[]', NULL, '[]', 0, FALSE,
     0.90, 0.00, 0.00, 0.70, 1, 1, TRUE),

    ('core.password', 'Mot de passe en clair',
     'Un mot de passe annoncé puis écrit. La forme seule ne vaut rien — c''est le signe adjacent (« : », « = », « est ») qui fait la détection, d''où la proximité obligatoire.',
     'secret', 'wordlist', NULL,
     '["mot de passe","mots de passe","motdepasse","password","passwd","mdp","pwd","passphrase"]',
     NULL,
     '[":","=","est ","sera ","voici","temporaire","provisoire","initial"]',
     40, TRUE, 0.40, 0.00, 0.40, 0.70, 1, 1, TRUE)
ON CONFLICT (key) DO NOTHING;
