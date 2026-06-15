-- Rétablit les réglages autovacuum par défaut sur les tables de collaboration.
ALTER TABLE core.collab_snapshots RESET (
    autovacuum_vacuum_scale_factor,
    autovacuum_vacuum_threshold,
    autovacuum_vacuum_cost_delay,
    autovacuum_analyze_scale_factor,
    autovacuum_analyze_threshold,
    toast.autovacuum_vacuum_scale_factor,
    toast.autovacuum_vacuum_threshold,
    toast.autovacuum_vacuum_cost_delay
);

ALTER TABLE core.collab_updates RESET (
    autovacuum_vacuum_scale_factor,
    autovacuum_vacuum_threshold,
    autovacuum_vacuum_cost_delay
);
