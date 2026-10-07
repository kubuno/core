//! Bringing a secret file into its explicit location from the locations older
//! versions used, without ever moving, losing or silently replacing it.
//!
//! The rules, in order:
//! 1. if the target holds a value, it is used and NOTHING else is read or
//!    touched: legacy copies that still exist are only reported (by existence,
//!    never read) so the caller can tell the operator to remove them;
//! 2. otherwise every legacy candidate is read; a missing or blank file does
//!    not count, an unreadable one is an error (it could hold the only copy);
//! 3. if two candidates hold **different** values, nothing is touched and
//!    [`MigrationError::Conflict`] lists them: only a person can tell which one
//!    the data was encrypted with;
//! 4. if one value is found, it is **copied**: written to a private temporary
//!    file beside the target, read back, checked by the caller's `verify`
//!    callback (and the source re-read to make sure it did not change), then
//!    linked into place atomically, failing if the target appeared meanwhile.
//!    The source is left exactly as it was: never renamed, never deleted;
//! 5. otherwise nothing exists anywhere and the caller may create the file.
//!
//! Which legacy candidates an instance may look at at all is decided by the
//! caller (see [`crate::legacy_state_dirs_for`]): only the default system
//! instance has any.

use crate::env::Os;
use crate::layout::same_lexical;
use std::fmt;
use std::io;
use std::path::{Path, PathBuf};

/// What [`migrate_secret_file`] did.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum MigrationOutcome {
    /// The target already holds the value. `stale` lists legacy files that
    /// still exist (not read, not touched).
    InPlace { path: PathBuf, stale: Vec<PathBuf> },
    /// The value was copied from `from` to `to`; `from` is unchanged.
    Copied { from: PathBuf, to: PathBuf },
    /// No candidate holds a value.
    NotFound,
}

#[derive(Debug)]
pub enum MigrationError {
    /// Different values were found; `found` lists every location holding one.
    Conflict { target: PathBuf, found: Vec<PathBuf> },
    /// A candidate exists but cannot be read, or the target cannot be written.
    Io { path: PathBuf, source: io::Error },
    /// The copy did not verify (read-back mismatch, source changed, or the
    /// caller's check refused it). Nothing was put in place.
    VerifyFailed { path: PathBuf, reason: String },
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
            MigrationError::VerifyFailed { path, reason } => {
                write!(f, "{}: the copy was not put in place: {reason}", path.display())
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

/// Brings the secret file at `target` into place from `legacy` locations.
/// See the module documentation for the rules.
///
/// `verify(source, value)` is called with the value read back from the
/// temporary copy before it is put in place; returning `Err` aborts the copy
/// and leaves both locations untouched.
pub fn migrate_secret_file(
    target: &Path,
    legacy: &[PathBuf],
    verify: &dyn Fn(&Path, &str) -> Result<(), String>,
) -> Result<MigrationOutcome, MigrationError> {
    let candidates: Vec<&PathBuf> = legacy.iter().filter(|p| !same_file(p, target)).collect();

    // Rule 1: the target wins, the legacy copies are not even read.
    if read_value(target)?.is_some() {
        let stale = candidates.iter().filter(|p| p.is_file()).map(|p| p.to_path_buf()).collect();
        return Ok(MigrationOutcome::InPlace { path: target.to_path_buf(), stale });
    }

    let mut found: Vec<(PathBuf, String)> = Vec::new();
    for p in candidates {
        if found.iter().any(|(q, _)| same_file(p, q)) {
            continue;
        }
        if let Some(v) = read_value(p)? {
            found.push((p.clone(), v));
        }
    }

    // Rule 3: any disagreement stops everything.
    if let Some((_, reference)) = found.first() {
        if found.iter().any(|(_, v)| v != reference) {
            let all = found.iter().map(|(p, _)| p.clone()).collect();
            return Err(MigrationError::Conflict { target: target.to_path_buf(), found: all });
        }
    }

    match found.into_iter().next() {
        Some((from, value)) => {
            copy_verified(&from, &value, target, verify)?;
            Ok(MigrationOutcome::Copied { from, to: target.to_path_buf() })
        }
        None => Ok(MigrationOutcome::NotFound),
    }
}

/// Rule 4: copy, verify, link into place without overwriting. The source is
/// only ever read.
fn copy_verified(
    from: &Path,
    value: &str,
    target: &Path,
    verify: &dyn Fn(&Path, &str) -> Result<(), String>,
) -> Result<(), MigrationError> {
    let io_err = |path: &Path| {
        let path = path.to_path_buf();
        move |source: io::Error| MigrationError::Io { path, source }
    };
    let dir = match target.parent() {
        Some(d) if !d.as_os_str().is_empty() => d.to_path_buf(),
        _ => PathBuf::from("."),
    };
    let name = target.file_name().map(|n| n.to_string_lossy().to_string()).unwrap_or_default();
    let tmp = dir.join(format!(".{name}.copy-{}", std::process::id()));

    let result = (|| {
        crate::perms::write_private(&tmp, format!("{value}\n").as_bytes()).map_err(io_err(&tmp))?;
        let copied = read_value(&tmp)?;
        if copied.as_deref() != Some(value) {
            return Err(MigrationError::VerifyFailed {
                path: target.to_path_buf(),
                reason: "the copy does not read back identically".into(),
            });
        }
        if read_value(from)?.as_deref() != Some(value) {
            return Err(MigrationError::VerifyFailed {
                path: target.to_path_buf(),
                reason: format!("{} changed while it was being copied", from.display()),
            });
        }
        verify(from, value).map_err(|reason| MigrationError::VerifyFailed { path: target.to_path_buf(), reason })?;
        link_into_place(&tmp, target).map_err(io_err(target))
    })();
    let _ = std::fs::remove_file(&tmp);
    result
}

/// Puts `tmp` at `target` atomically, never replacing an existing `target`
/// (another process may have created it meanwhile). A hard link is atomic and
/// fails if the destination exists, on Unix and NTFS alike; on a filesystem
/// without hard links, an existence check followed by a rename is the fallback.
fn link_into_place(tmp: &Path, target: &Path) -> io::Result<()> {
    match std::fs::hard_link(tmp, target) {
        Ok(()) => Ok(()),
        Err(e) if e.kind() == io::ErrorKind::AlreadyExists || target.exists() => Err(io::Error::new(
            io::ErrorKind::AlreadyExists,
            format!("{} appeared while the copy was being made; nothing was replaced", target.display()),
        )),
        Err(_) => std::fs::rename(tmp, target),
    }
}
