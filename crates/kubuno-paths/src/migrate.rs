//! Moving a secret file from the locations older versions used to its
//! explicit location, without ever losing or silently replacing it.
//!
//! The rules, in order:
//! 1. every candidate (the target and each legacy location) is read; a missing
//!    or blank file does not count, an unreadable one is an error (it could
//!    hold the only copy);
//! 2. if two candidates hold **different** values, nothing is touched and
//!    [`MigrationError::Conflict`] lists them: only a person can tell which one
//!    the data was encrypted with;
//! 3. if the target holds the value, it is used; identical legacy copies are
//!    retired;
//! 4. otherwise, if a legacy location holds it, the value is written to the
//!    target with private permissions, read back, and the legacy copy retired;
//! 5. otherwise nothing exists anywhere and the caller may create the file.
//!
//! "Retired" means renamed to `<name>.migrated` (or `.migrated-2`, …), never
//! deleted: the bytes stay recoverable, but a later key rotation can no longer
//! be mistaken for a conflict with a stale copy.

use crate::env::Os;
use crate::layout::same_lexical;
use std::fmt;
use std::io;
use std::path::{Path, PathBuf};

/// What [`migrate_secret_file`] did.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum MigrationOutcome {
    /// The target already holds the value.
    InPlace { path: PathBuf, retired: Vec<Retired> },
    /// The value was copied from `from` to `to`.
    Migrated { from: PathBuf, to: PathBuf, retired: Vec<Retired> },
    /// No candidate holds a value.
    NotFound,
}

/// A legacy copy that was (or could not be) renamed out of the way.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Retired {
    pub from: PathBuf,
    /// The new name, or the reason the rename failed (the copy then stays).
    pub result: Result<PathBuf, String>,
}

#[derive(Debug)]
pub enum MigrationError {
    /// Different values were found; `found` lists every location holding one.
    Conflict { target: PathBuf, found: Vec<PathBuf> },
    /// A candidate exists but cannot be read, or the target cannot be written.
    Io { path: PathBuf, source: io::Error },
    /// The value written to the target did not read back identically.
    VerifyFailed { path: PathBuf },
}

impl fmt::Display for MigrationError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            MigrationError::Conflict { target, found } => {
                let list = found.iter().map(|p| p.display().to_string()).collect::<Vec<_>>().join(", ");
                write!(
                    f,
                    "different versions of {} were found: {list}. Refusing to choose one: \
                     keep the file your data was encrypted with at {} and move the other(s) away",
                    target.file_name().map(|n| n.to_string_lossy().to_string()).unwrap_or_default(),
                    target.display()
                )
            }
            MigrationError::Io { path, source } => write!(f, "{}: {source}", path.display()),
            MigrationError::VerifyFailed { path } => {
                write!(f, "{}: the value written does not read back identically", path.display())
            }
        }
    }
}

impl std::error::Error for MigrationError {
    fn source(&self) -> Option<&(dyn std::error::Error + 'static)> {
        match self {
            MigrationError::Io { source, .. } => Some(source),
            _ => None,
        }
    }
}

/// Reads a candidate: `Ok(None)` when absent or blank.
fn read_value(path: &Path) -> Result<Option<String>, MigrationError> {
    match std::fs::read_to_string(path) {
        Ok(v) => {
            let v = v.trim();
            Ok(if v.is_empty() { None } else { Some(v.to_string()) })
        }
        Err(e) if e.kind() == io::ErrorKind::NotFound => Ok(None),
        Err(e) => Err(MigrationError::Io { path: path.to_path_buf(), source: e }),
    }
}

/// Same file? Canonical comparison when both exist, lexical otherwise.
fn same_file(a: &Path, b: &Path) -> bool {
    if let (Ok(ca), Ok(cb)) = (std::fs::canonicalize(a), std::fs::canonicalize(b)) {
        return ca == cb;
    }
    same_lexical(a, b, Os::current())
}

fn retire(path: &Path) -> Retired {
    let name = path.file_name().map(|n| n.to_string_lossy().to_string()).unwrap_or_default();
    let mut n = 1;
    loop {
        let suffix = if n == 1 { ".migrated".to_string() } else { format!(".migrated-{n}") };
        let dest = path.with_file_name(format!("{name}{suffix}"));
        if !dest.exists() {
            let result = std::fs::rename(path, &dest).map(|()| {
                // The copy may sit in a directory every local user can read
                // (`C:\var\lib\kubuno`): at least close the file itself.
                let _ = crate::perms::restrict_to_owner(&dest);
                dest
            });
            return Retired { from: path.to_path_buf(), result: result.map_err(|e| e.to_string()) };
        }
        n += 1;
        if n > 100 {
            return Retired { from: path.to_path_buf(), result: Err("too many retired copies".into()) };
        }
    }
}

/// Brings the secret file at `target` into place from `legacy` locations.
/// See the module documentation for the rules.
pub fn migrate_secret_file(target: &Path, legacy: &[PathBuf]) -> Result<MigrationOutcome, MigrationError> {
    let current = read_value(target)?;

    let mut found: Vec<(PathBuf, String)> = Vec::new();
    for p in legacy {
        if same_file(p, target) || found.iter().any(|(q, _)| same_file(p, q)) {
            continue;
        }
        if let Some(v) = read_value(p)? {
            found.push((p.clone(), v));
        }
    }

    // Rule 2: any disagreement stops everything.
    let reference = current.clone().or_else(|| found.first().map(|(_, v)| v.clone()));
    if let Some(reference) = &reference {
        if found.iter().any(|(_, v)| v != reference) {
            let mut all = Vec::new();
            if current.is_some() {
                all.push(target.to_path_buf());
            }
            all.extend(found.iter().map(|(p, _)| p.clone()));
            return Err(MigrationError::Conflict { target: target.to_path_buf(), found: all });
        }
    }

    match (current, found.first()) {
        (Some(_), _) => {
            let retired = found.iter().map(|(p, _)| retire(p)).collect();
            Ok(MigrationOutcome::InPlace { path: target.to_path_buf(), retired })
        }
        (None, Some((from, value))) => {
            crate::perms::write_private(target, format!("{value}\n").as_bytes())
                .map_err(|e| MigrationError::Io { path: target.to_path_buf(), source: e })?;
            if read_value(target)?.as_deref() != Some(value.as_str()) {
                return Err(MigrationError::VerifyFailed { path: target.to_path_buf() });
            }
            let from = from.clone();
            let retired = found.iter().map(|(p, _)| retire(p)).collect();
            Ok(MigrationOutcome::Migrated { from, to: target.to_path_buf(), retired })
        }
        (None, None) => Ok(MigrationOutcome::NotFound),
    }
}
