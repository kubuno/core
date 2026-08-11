//! Backup policy — the scheduler, the dump, and the proof it ran.
//!
//! ## The gap this closes
//!
//! The core shipped `kubuno db:backup` and nothing that ran it. Two earlier
//! attempts at this feature correctly refused to add the *setting* on its own:
//! a backup switch with no scheduler behind it turns the health indicator green
//! while the instance is still one disk failure from total loss, which is the
//! exact opposite of the service rendered. So the setting arrives here together
//! with the three things that make it true: something that runs it, something
//! that records what happened, and something that shouts when it did not.
//!
//! ## Why the dump is written in Rust
//!
//! `kubuno-seccomp` forbids `execve` in the server process, and that is a
//! security property of this product rather than a preference: the whole point
//! of the sandbox is that a compromised handler cannot spawn anything. So
//! `pg_dump` is not available to the scheduler, and reintroducing a spawn to get
//! it would trade the sandbox for a convenience.
//!
//! The alternative that was weighed and rejected — *schedule and supervise only,
//! leave the execution to a systemd unit* — fails on its own terms: the feature
//! would ship a scheduler that produces nothing, an operator would still have to
//! write and install the unit by hand, and the console would report on a file it
//! never made. That is a monitor for a backup that does not exist yet.
//!
//! What is left is the option that needs neither: a **logical, data-only dump of
//! the `core` schema, written from the connection pool** with `COPY … TO
//! STDOUT`. No external binary, no credential handed to a child process, no
//! second thing to install. The output is deliberately the exact text format
//! `psql` consumes, so the file the scheduler writes is restorable by the
//! `kubuno db:restore` command that already exists — see [`dump`].
//!
//! ## What is covered, and what is not
//!
//! Covered: every row of every table of the PostgreSQL schema `core` — accounts,
//! settings, roles, sessions, audit trail, alerts, jobs, labels — plus the
//! sequence positions.
//!
//! **Not covered**, and said on screen in as many words:
//!
//! * the **stored files** (`storage.local_path`, or the S3 bucket). What users
//!   uploaded is not in the database and is not copied by this;
//! * the **schemas of the installed modules** (drive, calendar, mail…). Each
//!   module owns its schema; the core does not reach into it;
//! * the **DDL**. The dump is data-only and restores onto an instance whose
//!   migrations have already run — which is also what keeps it small;
//! * the **configuration file**, where the JWT and internal secrets live. It is
//!   never copied into a file on disk by this feature.
//!
//! ## Layout
//!
//! * [`policy`] — the five settings, and when the next run is due;
//! * [`dump`]   — the writer: table order, `COPY`, sequences, permissions;
//! * [`runs`]   — `core.backup_runs`: open, close, list, prune;
//! * [`jobs`]   — `core.backup.run`, a type of the existing runner.
//!
//! Health and alerts are **not** duplicated here. `continuity.backup` and
//! `continuity.restore_tested` live in [`crate::health::checks`] with every
//! other check, and the failure alert lives in [`crate::alerts`] with every
//! other producer.

pub mod dump;
pub mod jobs;
pub mod policy;
pub mod runs;

pub use policy::{Frequency, Policy};
pub use runs::{BackupRun, Trigger};

/// What a backup file of this instance contains, as a list of stable identifiers
/// the console translates.
///
/// Kept here rather than in the frontend so the claim and the code that honours
/// it live in one place: whoever widens [`dump`] to cover something new has to
/// walk past this list.
pub const COVERED: &[&str] = &["core_schema_rows", "core_sequences"];

/// What it deliberately does not contain. Same reasoning, opposite direction —
/// and this is the half that must never silently shrink.
pub const NOT_COVERED: &[&str] = &[
    "stored_files",
    "module_schemas",
    "database_ddl",
    "config_file",
];
