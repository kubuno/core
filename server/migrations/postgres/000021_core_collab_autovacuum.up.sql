-- Autovacuum agressif et ciblé sur les tables de collaboration.
--
-- Ces tables ont PEU de lignes mais ENORMES (snapshots Yjs en BYTEA/TOAST). Chaque
-- consolidation réécrit un snapshot via UPSERT → laisse un tuple mort potentiellement
-- de plusieurs centaines de Mo. Avec les seuils par défaut (scale_factor 0.2),
-- l'autovacuum ne se déclenche quasiment jamais sur si peu de lignes : le bloat
-- (et le TOAST associé) s'accumule jusqu'à saturer le disque. On force un vacuum
-- dès quelques modifications, sans throttling de coût.

ALTER TABLE core.collab_snapshots SET (
    autovacuum_vacuum_scale_factor  = 0,
    autovacuum_vacuum_threshold     = 5,
    autovacuum_vacuum_cost_delay    = 0,
    autovacuum_analyze_scale_factor = 0,
    autovacuum_analyze_threshold    = 20
);

ALTER TABLE core.collab_updates SET (
    autovacuum_vacuum_scale_factor  = 0,
    autovacuum_vacuum_threshold     = 50,
    autovacuum_vacuum_cost_delay    = 0
);

-- Idem pour la table TOAST des snapshots (c'est là que vivent réellement les gros BYTEA).
ALTER TABLE core.collab_snapshots SET (
    toast.autovacuum_vacuum_scale_factor = 0,
    toast.autovacuum_vacuum_threshold    = 5,
    toast.autovacuum_vacuum_cost_delay   = 0
);
