-- Unqualified on purpose: the connection database decides the schema.
CREATE TABLE widgets (
    id   INTEGER PRIMARY KEY,
    name VARCHAR(255) NOT NULL
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
