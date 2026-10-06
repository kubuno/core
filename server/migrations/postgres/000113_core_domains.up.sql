-- ── The domains this instance answers for ───────────────────────────────────
--
-- Until now the product had no idea what it was called. The closest thing was
-- `mail.public_url`, a URL an administrator typed for the links in outgoing
-- messages, and the `Host` header of whatever request happened to arrive. Both
-- describe *how somebody reached us*, not *what we are* — and neither can be
-- proven.
--
-- A domain here is a **claim plus a proof**: the name, and a DNS record only
-- somebody who controls that name could have published. That distinction is the
-- whole point of the table. Anyone can type `example.com` into a form; the
-- verification is what lets the rest of the product act on it.
--
-- ## Three kinds, and why the third is not a fourth table
--
--   * `primary`   — the instance's own name. Exactly one, always.
--   * `secondary` — another name this instance also answers for, with its own
--                   accounts.
--   * `alias`     — a second address for the accounts of another domain. It
--                   creates nobody: `alice@example.org` reaching an account
--                   whose address is `alice@example.com` is the entire feature.
--
-- The reference implementation nests aliases inside their parent domain and
-- exposes them through a separate API resource. One table with `parent_id` says
-- the same thing and keeps a single answer to "is this name ours?" — which is
-- the question every consumer actually asks.
--
-- ## What the shipped verification does NOT offer, and why
--
-- The reference offers a CNAME method beside the TXT one. It cannot be
-- transposed: a CNAME must point at a host the *vendor* controls, and a
-- self-hosted product has no such host. Offering it would mean asking an
-- administrator to point their domain at somebody else's server to prove it is
-- theirs. TXT at the apex is the whole mechanism, and it is enough.
--
-- File-based proofs (an HTML page, a meta tag) are deliberately absent for the
-- reason the reference gives publicly when it withdrew them: they prove control
-- of a *web server*, not of a *domain*, and the thing being authorised here is
-- the right to carry addresses.

CREATE TABLE core.domains (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- Stored lower-case, ASCII, without a trailing dot: it is compared against
    -- the right-hand side of e-mail addresses on hot paths, and a comparison
    -- that has to normalise first is a comparison somebody will forget to do.
    -- Internationalised names are entered in their punycode form (`xn--…`),
    -- which is what DNS carries anyway.
    name           VARCHAR(253) NOT NULL
                       CHECK (name = LOWER(name)
                              AND name ~ '^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$'),
    kind           VARCHAR(16) NOT NULL CHECK (kind IN ('primary', 'secondary', 'alias')),
    -- The domain an alias lends its name to. NULL for the other two kinds.
    parent_id      UUID REFERENCES core.domains(id) ON DELETE RESTRICT,

    -- ── The proof ────────────────────────────────────────────────────────────
    -- Minted at creation and never rotated while the domain lives: an
    -- administrator who published the record and comes back a week later must
    -- find the same string, or they will conclude the page is broken.
    verify_token   VARCHAR(64) NOT NULL,
    verified_at    TIMESTAMPTZ,
    -- What the last probe saw, so the page can say *why* it failed rather than
    -- "not verified". Cleared on success.
    last_checked_at TIMESTAMPTZ,
    last_error     TEXT,

    -- ── The mail diagnosis ───────────────────────────────────────────────────
    -- Cached, because it is a network round-trip and the page is read far more
    -- often than the DNS changes. `mx_hosts` is what the domain publishes, not
    -- what it should publish: the instance does not know what it should be, and
    -- inventing an expected value would turn a diagnosis into a verdict.
    mx_hosts       JSONB NOT NULL DEFAULT '[]'::jsonb,
    has_spf        BOOLEAN,
    has_dmarc      BOOLEAN,
    mail_checked_at TIMESTAMPTZ,

    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by     UUID REFERENCES core.users(id) ON DELETE SET NULL,

    -- An alias without a parent aliases nothing; a primary with one would be
    -- two answers to "what is this instance called".
    CONSTRAINT domains_alias_has_parent
        CHECK ((kind = 'alias') = (parent_id IS NOT NULL))
);

CREATE UNIQUE INDEX idx_core_domains_name ON core.domains (name);

-- Exactly one primary, enforced by the schema rather than by a handler: the
-- promotion path swaps two rows in one transaction, and a bug there must fail
-- loudly instead of leaving an instance with two names or none.
CREATE UNIQUE INDEX idx_core_domains_one_primary ON core.domains ((kind = 'primary')) WHERE kind = 'primary';

CREATE INDEX idx_core_domains_parent ON core.domains (parent_id);

CREATE TRIGGER domains_updated_at
    BEFORE UPDATE ON core.domains
    FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

-- ── The one policy a domain governs today ───────────────────────────────────
--
-- A setting nothing reads is a control that reports back, so this table ships
-- with a consumer rather than a promise: with the key below on, self-service
-- registration accepts an address only at a **verified** domain of this
-- instance. Off — the factory value — nothing changes, and the registry is
-- still what the console offers when an administrator types an address.
--
-- Deliberately narrow. It governs the *public* sign-up route only: an
-- administrator creating an account is somebody who already decided, and
-- refusing them an address at a domain they have not verified yet would turn a
-- helpful default into an obstacle.
INSERT INTO core.settings (key, value, default_value, category, label, description, is_public, scope, value_type) VALUES
    ('auth.registration_domains_only', 'false', 'false', 'auth',
     'Limiter l''inscription aux domaines de l''instance',
     'À l''inscription publique, n''accepter qu''une adresse dont le domaine est déclaré ET vérifié ici. Désactivé, toute adresse valide est acceptée — ce que fait le produit depuis toujours.',
     FALSE, 'global', 'bool')
ON CONFLICT (key) DO NOTHING;

-- ── Privileges ──────────────────────────────────────────────────────────────
--
-- Its own pair rather than a reuse of `core.settings.*`: declaring a domain is
-- how an instance says which addresses belong to it, and — with the key above
-- on — who may open an account. That is a different power from editing a
-- setting, and the reference implementation separates it for the same reason.
--
-- Not OU-scopable: a domain is instance-wide by construction. Confining its
-- management to a subtree would promise a narrowing the model cannot deliver.
INSERT INTO core.privileges (key, namespace, domain, verb, label, description, is_ou_scopable) VALUES
    ('core.domains.read',   'core', 'domains', 'read',   'Consulter les domaines',
     'Voir les domaines déclarés par l''instance, leur état de vérification et le diagnostic de leur messagerie.', FALSE),
    ('core.domains.manage', 'core', 'domains', 'manage', 'Gérer les domaines',
     'Ajouter un domaine, prouver sa propriété, promouvoir le domaine principal et retirer un domaine.', FALSE)
ON CONFLICT (key) DO NOTHING;
