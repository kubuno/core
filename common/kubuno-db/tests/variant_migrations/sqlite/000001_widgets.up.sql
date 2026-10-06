-- Test fixture: one table, created identically on every engine.
CREATE TABLE widgets (id INTEGER PRIMARY KEY, flavor VARCHAR(20) NOT NULL DEFAULT 'base');
