-- Qualified with the schema alias, exercising the migrator prefix rewrite.
CREATE TABLE notes.widgets (
    id   INTEGER PRIMARY KEY,
    name TEXT NOT NULL
);
CREATE INDEX notes.idx_widgets_name ON widgets(name);
