//! Platform directories for Kubuno, in one place.
//!
//! Before this crate, the core and the modules hard-coded the Linux FHS layout
//! (`/etc/kubuno`, `/var/lib/kubuno`, …) and chose where to keep secrets by
//! checking whether `/var/lib/kubuno` happened to exist. On Windows that path is
//! drive-relative (`C:\var\lib\kubuno`, writable by every local user) and it
//! starts to exist as soon as a module is installed, so `data.key` was looked
//! up in a different place from one start to the next.
//!
//! This crate replaces every such guess with an explicit layout:
//!
//! | | Linux (system) | Windows (system) | macOS (system) |
//! |---|---|---|---|
//! | config | `/etc/kubuno` | `%ProgramData%\Kubuno` | `/Library/Application Support/Kubuno` |
//! | state (secrets) | `/var/lib/kubuno` | `%ProgramData%\Kubuno\state` | `…/Kubuno/state` |
//! | data | `/var/lib/kubuno` | `%ProgramData%\Kubuno\data` | `…/Kubuno/data` |
//! | logs | `/var/log/kubuno` | `%ProgramData%\Kubuno\logs` | `/Library/Logs/Kubuno` |
//! | cache | `/var/cache/kubuno` | `%ProgramData%\Kubuno\cache` | `/Library/Caches/Kubuno` |
//! | runtime | `/run/kubuno` | `%ProgramData%\Kubuno\run` | `…/Kubuno/run` |
//! | backups | `/var/backups/kubuno` | `<data>\backups` | `<data>/backups` |
//! | modules store | `<data>/modules-store` | `<data>\modules-store` | `<data>/modules-store` |
//! | modules config | `<config>/modules` | `<config>\modules-config` | `<config>/modules` |
//! | modules data | `<data>/modules` | `<config>\modules-data` | `<data>/modules` |
//!
//! In **user** mode (`KUBUNO_PATHS_MODE=user`: development, per-user installs)
//! the roots are the XDG directories on Linux (`~/.config/kubuno`,
//! `~/.local/share/kubuno`, `~/.local/state/kubuno`, `~/.cache/kubuno`),
//! `%LOCALAPPDATA%\Kubuno` on Windows and `~/Library/…` on macOS.
//!
//! Every directory can be overridden: by the caller (the core's `[paths]`
//! configuration section, see [`Overrides`]) and by the `KUBUNO_PATHS_*`
//! environment variables, which win. Overrides must be absolute.
//!
//! The functions are pure: they take a [`PathEnv`] (OS family, variables,
//! working directory, Windows known folders) and never look at the filesystem,
//! so the rules of every OS are tested on every host.
//!
//! The crate also provides:
//! - [`migrate_secret_file`]: brings a secret (`data.key`) from the locations
//!   older versions used to its explicit location, and refuses to choose when
//!   two different copies exist;
//! - [`write_private`], [`create_private_dir`], [`restrict_to_owner`]: `0600`/`0700`
//!   on Unix, a protected DACL (SYSTEM + Administrators + the service account)
//!   on Windows, without spawning anything.

mod env;
mod layout;
mod migrate;
mod perms;

pub use env::{Os, PathEnv};
pub use layout::{
    legacy_state_dirs, same_lexical, Mode, Overrides, Paths, PathsError, DATA_KEY, ENV_DIRS, ENV_MODE,
    INITIAL_ADMIN_PASSWORD, SETUP_TOKEN,
};
pub use migrate::{migrate_secret_file, MigrationError, MigrationOutcome, Retired};
pub use perms::{create_private_dir, restrict_to_owner, write_private, ENV_SERVICE_ACCOUNT};

/// The Rust target this binary was built for, as `(os, arch)` with the
/// `std::env::consts` spellings that `.kbpkg` file names carry.
pub fn host_target() -> (&'static str, &'static str) {
    (std::env::consts::OS, std::env::consts::ARCH)
}

#[cfg(test)]
mod tests;
