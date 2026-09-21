-- Storage declarations gain a category, and the core gains the right to repair
-- the quota counter from them.
--
-- ## What migration 000095 could not express
--
-- A row said "module M holds N bytes for account U" and nothing more. That is
-- enough to draw a pie and not enough to answer either of the two questions an
-- operator actually arrives with:
--
--   * "Why is this account at 94 % — is that their work, their bin, or our
--     thumbnails?" The bin in particular: it is billed, because emptying it is
--     the account's own gesture, and it is shown apart, because "3 GiB of that
--     is your bin" is the answer that saves granting more room.
--   * "How big a disk do I need?" — which is a different number from the one
--     accounts are charged for, and until now the two were the same figure.
--
-- Splitting the row by category answers both from one channel: the account is
-- billed on the billable categories, the disk is sized on the held ones.
--
-- ## ⚠️ PRIVACY — what a category may and may not be
--
-- A category is a technical role inside the module's machinery: content, trash,
-- versions, retention, thumbnails, index, cache, staging, system, delegated. It is NEVER a
-- kind of content. There is deliberately no `photos`, no `videos`, no
-- `documents`, no `invoices` category — an administrator must be able to size a
-- server without being able to deduce what the people on it keep. The CHECK
-- below is the enforcement, `crate::storage::categories` is the vocabulary, and
-- its `no_category_names_a_kind_of_content` test is the guard against a
-- well-meaning future addition.
--
-- ## Why the primary key changes rather than a second table appearing
--
-- The category is part of the identity of a declaration, not an attribute of it:
-- "drive holds 3 GiB of content and 700 kB of thumbnails for this account" is
-- two facts, each independently replaceable. Widening the key keeps every
-- property migration 000095 relied on — a declaration is a level, re-declaring
-- is a no-op, a full sync retires what it did not mention — and costs one column.

ALTER TABLE core.storage_usage
    ADD COLUMN category VARCHAR(32) NOT NULL DEFAULT 'content';

-- Existing rows were the original channel's only meaning: user content. The
-- DEFAULT above has already labelled them, and it stays for the benefit of any
-- module still on the first version of the contract.
ALTER TABLE core.storage_usage
    ADD CONSTRAINT storage_usage_category_check
    CHECK (category IN ('content', 'trash', 'versions', 'retention', 'thumbnails',
                        'index', 'cache', 'staging', 'system', 'delegated'));

ALTER TABLE core.storage_usage DROP CONSTRAINT storage_usage_pkey;
ALTER TABLE core.storage_usage
    ADD CONSTRAINT storage_usage_pkey PRIMARY KEY (module_id, user_id, category);

COMMENT ON COLUMN core.storage_usage.category IS
    'Technical role of these bytes inside the declaring module. Never a kind of content — see crate::storage::categories.';

-- The account sheet reads every module and every category for one account.
DROP INDEX IF EXISTS core.idx_core_su_user;
CREATE INDEX idx_core_su_user ON core.storage_usage(user_id, module_id);

-- ── Repairing the quota counter ─────────────────────────────────────────────
--
-- Migration 000095 declined to derive `core.users.used_bytes` from declarations,
-- for a reason that was right at the time: "a quota that silently doubles
-- because a module is slow to declare is worse than no breakdown at all".
--
-- What has changed is that the derivation can now be made safe, so the reason no
-- longer applies:
--
--   * Only **billable** categories are summed — the ones the account can free
--     itself (its files, its bin, a revision history it can purge). A module
--     declaring its thumbnails cannot inflate anybody's quota.
--   * The correction is skipped entirely unless **every** module that has ever
--     declared is fresh AND has completed a full sync. A slow module suspends
--     the repair instead of shrinking somebody's ceiling — the exact failure
--     000095 refused to risk.
--   * Every correction is written to `core.admin_audit`, with the before and
--     after. A counter that moves on its own and leaves no trace is not
--     something an operator can be asked to trust.
--
-- Left on by default because it is the repair for a real, measured defect:
-- drive's disk scanner inserts rows in `drive.files` without ever adjusting the
-- counter, so an instance's charged total drifts below the truth and never
-- recovers. Turning it off keeps the breakdown and gives up the repair.
INSERT INTO core.settings (key, value, default_value, category, label, description, is_public, value_type) VALUES
    ('storage.usage_authoritative', 'true', 'true', 'storage',
     'Recaler la consommation des comptes sur les déclarations des modules',
     'Le compteur de quota d''un compte est réaligné, chaque heure, sur la somme de ce que les modules déclarent lui facturer (contenu et corbeille). Le recalage est suspendu tant qu''un module déclarant est en retard ou n''a pas encore transmis d''état complet, et chaque correction est journalisée. Désactiver conserve la répartition mais laisse le compteur dériver.',
     FALSE, 'bool')
ON CONFLICT (key) DO NOTHING;

-- A correction smaller than this is not written and not journalised. Without it
-- an instance whose modules round differently would produce an audit entry every
-- hour, forever, and a journal that is all noise is a journal nobody reads.
INSERT INTO core.settings (key, value, default_value, category, label, description, is_public, value_type) VALUES
    ('storage.usage_correction_min_bytes', '4096', '4096', 'storage',
     'Recalage : écart minimal pour corriger (octets)',
     'En dessous de cet écart entre le compteur d''un compte et ce que les modules lui facturent, le compteur est laissé tel quel. Évite une correction et une entrée de journal à chaque heure pour quelques octets d''arrondi.',
     FALSE, 'int')
ON CONFLICT (key) DO NOTHING;
