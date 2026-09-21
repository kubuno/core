-- Both tables are leaves: nothing references them, and nothing in the product
-- gates a feature on their contents (see the up migration). Dropping them
-- removes the instance identifier and the registered support contract; the
-- identifier is re-minted on the next up migration, so a down/up round trip
-- changes it. That is stated here rather than worked around: an identifier
-- that survived its own table would be a value nobody can account for.
DROP TABLE IF EXISTS core.support_contract;
DROP TABLE IF EXISTS core.instance_identity;
