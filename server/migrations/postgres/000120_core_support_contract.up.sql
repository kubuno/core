-- ── What this instance IS, and who owes it help ─────────────────────────────
--
-- The console's "Abonnement et licence" page answers two questions that had no
-- storage until now.
--
-- ## 1. Which instance is this?
--
-- The product is free software: nothing about it is licensed per seat, nothing
-- phones home, and there has never been a reason to identify an installation.
-- But an operator opening a ticket has to be able to say *which* installation
-- they are talking about, and "the one called Kubuno" is what every default
-- instance is called.
--
-- So: one identifier, minted locally, once, never transmitted anywhere by the
-- product itself. It is an opaque UUID and deliberately carries nothing — no
-- host name, no address, no account — because an identifier that encodes facts
-- about a private deployment becomes a disclosure the moment somebody pastes it
-- into a public issue.
--
-- `installed_at` is backfilled from the oldest account rather than set to NOW():
-- on an instance that has been running for a year, stamping the *upgrade* date
-- as the installation date would be a lie the page then displays with a
-- straight face. The oldest account is the seeded administrator, created by the
-- installer — the closest thing this schema has ever had to an installation
-- date. On an instance with no account yet, NOW() *is* the installation date.
--
-- One row, forever: the primary key is a constant, so a second row cannot
-- exist and no handler has to pick between two identities.
CREATE TABLE core.instance_identity (
    only_row     BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (only_row),
    instance_id  UUID        NOT NULL DEFAULT uuid_generate_v4(),
    installed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO core.instance_identity (only_row, installed_at)
VALUES (TRUE, COALESCE((SELECT MIN(created_at) FROM core.users), NOW()))
ON CONFLICT (only_row) DO NOTHING;

-- ## 2. Is anybody contractually obliged to help?
--
-- The software is AGPLv3 and is not sold. What can be sold is SUPPORT, and a
-- support contract is a fact about a *commercial relationship*, not a
-- permission: nothing in this schema, and nothing in the code that reads it,
-- may gate a feature on the presence of a row here. An instance without a
-- contract is the normal case — it is community-supported, which is a state,
-- not a degradation.
--
-- ## Why the raw key is stored, and why it never leaves
--
-- `key_text` is the token an operator pasted. It is kept so the instance can
-- re-check the signature after the trusted key set changes (a contract
-- registered before the publisher's signing key shipped can become verified
-- later, without asking the operator for the key again). It is never returned
-- by any route and never written to a log: it is the bearer proof of the
-- contract, and a page that echoed it back would turn one operator's screenshot
-- into somebody else's contract.
--
-- The columns beside it are the DECODED claims, denormalised on purpose: the
-- page reads them with a single SELECT, and `verified` records what the
-- signature check concluded *at registration*. An unverified contract is stored
-- and displayed all the same, labelled for what it is — declarative. Refusing
-- to store it would be worse: the operator would keep the information in a
-- spreadsheet, where nobody administering the instance can see it.
CREATE TABLE core.support_contract (
    only_row      BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (only_row),
    -- The pasted key. Never serialised, never logged. See above.
    key_text      TEXT         NOT NULL,
    -- Did a trusted public key validate the signature? FALSE means the claims
    -- below are what somebody typed, and the console says so.
    verified      BOOLEAN      NOT NULL DEFAULT FALSE,
    -- Which signing key validated it (`kid`), so a future rotation can tell
    -- which contracts were signed with a retired key.
    key_id        VARCHAR(64),
    -- Who the contract is with, as the publisher wrote it.
    subject       VARCHAR(255) NOT NULL,
    -- The offer's name (e.g. "Standard", "Étendu"). Free text: the publisher
    -- names its own offers, and an enumeration here would need a migration
    -- every time a commercial line changed.
    plan          VARCHAR(120),
    -- What the contract actually covers, in the publisher's words.
    perimeter     TEXT,
    -- Where to reach support. An address or a URL — validated as one of the
    -- two before it is stored, so the page can render it as a link safely.
    contact       VARCHAR(320),
    issued_at     TIMESTAMPTZ,
    expires_at    TIMESTAMPTZ,
    registered_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    registered_by UUID REFERENCES core.users(id) ON DELETE SET NULL
);

COMMENT ON TABLE core.support_contract IS
    'Le contrat de support de l''instance, s''il y en a un. Ne gouverne AUCUNE fonctionnalité : le logiciel est AGPLv3 et n''est pas vendu.';
