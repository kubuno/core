-- Base: what both MySQL flavours run unless a variant replaces it.
CREATE TABLE widgets (id INT PRIMARY KEY, flavor VARCHAR(20) NOT NULL DEFAULT 'base');
