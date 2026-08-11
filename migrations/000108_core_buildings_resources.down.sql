DELETE FROM core.privileges
 WHERE key IN ('core.resources.read', 'core.resources.manage');

DROP TABLE IF EXISTS core.resource_feature_links;
DROP TABLE IF EXISTS core.resources;
DROP TABLE IF EXISTS core.resource_features;
DROP TABLE IF EXISTS core.building_floors;
DROP TABLE IF EXISTS core.buildings;
