/// The PostgreSQL schema (and, on MySQL the database / on SQLite the ATTACHed
/// file) the core owns. `kubuno_db::connect` makes it usable and every core
/// table is written `core.<table>`.
pub const SCHEMA: &str = "core";

pub mod migrations;
pub mod notify;
/// The event-bus reader for engines without `LISTEN`/`NOTIFY`: a poller over the
/// `kubuno_event_outbox` table, and the run-time choice between it and the
/// `PgListener` path.
pub mod outbox;
pub mod pool;
pub mod seed;
