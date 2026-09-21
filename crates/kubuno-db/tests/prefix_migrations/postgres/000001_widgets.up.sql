-- Unqualified on purpose: the prefixed search_path decides the schema.
CREATE TABLE widgets (
    id   INTEGER PRIMARY KEY,
    name TEXT NOT NULL
);
