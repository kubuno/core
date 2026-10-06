DROP TRIGGER IF EXISTS groups_prune_audience_members ON core.user_groups;
DROP TRIGGER IF EXISTS users_prune_audience_members  ON core.users;
DROP FUNCTION IF EXISTS core.prune_audience_member();

DROP TABLE IF EXISTS core.target_audience_policies;
DROP TABLE IF EXISTS core.target_audience_members;
DROP TABLE IF EXISTS core.target_audiences;
