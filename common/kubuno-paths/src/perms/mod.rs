//! Files and directories only the service can read.
//!
//! - Unix: files `0600`, directories `0700`. When the process runs as root
//!   (the CLI under `sudo`), a file written into a directory owned by the
//!   service account is handed to that account, or the service could not read
//!   it any more.
//! - Windows: a protected DACL (no inherited entries) granting full control to
//!   `SYSTEM`, `BUILTIN\Administrators` and the account the process runs as,
//!   plus the account named by `KUBUNO_SERVICE_ACCOUNT` when set. Under
//!   `%ProgramData%` the inherited ACL would otherwise give `BUILTIN\Users`
//!   read access.
//!
//! Nothing here spawns a process (`icacls`, `chmod`): the seccomp rule forbids
//! it, and the APIs are available in-process on every OS.

use std::io;
use std::path::{Path, PathBuf};

#[cfg(windows)]
pub(crate) mod windows;

/// Environment variable naming an extra account (e.g. `NT SERVICE\kubuno`)
/// granted access to private files on Windows.
pub const ENV_SERVICE_ACCOUNT: &str = "KUBUNO_SERVICE_ACCOUNT";

/// Writes `contents` to `path` so that only the service can read it.
///
/// The file is written aside, restricted *before* the contents go in, then
/// renamed over `path`: no reader ever sees a partial file, and no window
/// exists where the secret sits in a file with inherited permissions. Missing
/// parent directories are created (with default permissions: they usually
/// exist already and belong to the installer).
pub fn write_private(path: &Path, contents: &[u8]) -> io::Result<()> {
    let dir = match path.parent() {
        Some(d) if !d.as_os_str().is_empty() => d.to_path_buf(),
        _ => PathBuf::from("."),
    };
    std::fs::create_dir_all(&dir)?;
    let name = path.file_name().map(|n| n.to_string_lossy().to_string()).unwrap_or_default();
    let tmp = dir.join(format!(".{name}.tmp-{}", std::process::id()));
    let _ = std::fs::remove_file(&tmp);

    let result = (|| {
        let mut f = create_private_file(&tmp)?;
        io::Write::write_all(&mut f, contents)?;
        f.sync_all()?;
        drop(f);
        #[cfg(unix)]
        unix::align_owner_with_parent(&tmp, &dir);
        std::fs::rename(&tmp, path)
    })();
    if result.is_err() {
        let _ = std::fs::remove_file(&tmp);
    }
    result
}

/// Creates `path` (and its parents) and restricts the leaf directory to the
/// service; on Windows its entries are inherited by everything created inside.
pub fn create_private_dir(path: &Path) -> io::Result<()> {
    std::fs::create_dir_all(path)?;
    restrict_to_owner(path)
}

/// Restricts an existing file or directory (`0600`/`0700`, or the protected DACL).
pub fn restrict_to_owner(path: &Path) -> io::Result<()> {
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let mode = if std::fs::metadata(path)?.is_dir() { 0o700 } else { 0o600 };
        std::fs::set_permissions(path, std::fs::Permissions::from_mode(mode))
    }
    #[cfg(windows)]
    {
        windows::restrict(path)
    }
    #[cfg(not(any(unix, windows)))]
    {
        let _ = path;
        Ok(())
    }
}

/// Creates a new, empty file that is already private.
fn create_private_file(path: &Path) -> io::Result<std::fs::File> {
    #[cfg(unix)]
    {
        use std::os::unix::fs::OpenOptionsExt;
        std::fs::OpenOptions::new().write(true).create_new(true).mode(0o600).open(path)
    }
    #[cfg(not(unix))]
    {
        let f = std::fs::OpenOptions::new().write(true).create_new(true).open(path)?;
        if let Err(e) = restrict_to_owner(path) {
            drop(f);
            let _ = std::fs::remove_file(path);
            return Err(e);
        }
        Ok(f)
    }
}

#[cfg(unix)]
mod unix {
    use std::os::unix::fs::MetadataExt;
    use std::path::Path;

    /// Gives `file` the owner of `dir` when they differ and the process is
    /// allowed to (i.e. runs as root). Best-effort: an unprivileged process
    /// simply keeps the file as its own.
    pub(super) fn align_owner_with_parent(file: &Path, dir: &Path) {
        let (Ok(f), Ok(d)) = (std::fs::metadata(file), std::fs::metadata(dir)) else { return };
        if f.uid() != d.uid() || f.gid() != d.gid() {
            let _ = std::os::unix::fs::chown(file, Some(d.uid()), Some(d.gid()));
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn scratch(name: &str) -> PathBuf {
        let d = std::env::temp_dir().join(format!("kubuno-paths-perms-{name}-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&d);
        std::fs::create_dir_all(&d).unwrap();
        d
    }

    #[test]
    fn write_private_replaces_content_and_leaves_no_temp_file() {
        let d = scratch("write");
        let f = d.join("secret");
        write_private(&f, b"one\n").unwrap();
        write_private(&f, b"two\n").unwrap();
        assert_eq!(std::fs::read_to_string(&f).unwrap(), "two\n");
        let names: Vec<_> = std::fs::read_dir(&d).unwrap().map(|e| e.unwrap().file_name()).collect();
        assert_eq!(names.len(), 1, "temporary file left behind: {names:?}");
        let _ = std::fs::remove_dir_all(&d);
    }

    #[test]
    fn write_private_creates_missing_parents() {
        let d = scratch("parents");
        let f = d.join("a").join("b").join("secret");
        write_private(&f, b"x").unwrap();
        assert_eq!(std::fs::read(&f).unwrap(), b"x");
        let _ = std::fs::remove_dir_all(&d);
    }

    #[cfg(unix)]
    #[test]
    fn unix_modes_are_0600_and_0700() {
        use std::os::unix::fs::PermissionsExt;
        let d = scratch("modes");
        let f = d.join("secret");
        write_private(&f, b"x").unwrap();
        assert_eq!(std::fs::metadata(&f).unwrap().permissions().mode() & 0o777, 0o600);
        let sub = d.join("private");
        create_private_dir(&sub).unwrap();
        assert_eq!(std::fs::metadata(&sub).unwrap().permissions().mode() & 0o777, 0o700);
        let _ = std::fs::remove_dir_all(&d);
    }

    #[cfg(windows)]
    #[test]
    fn windows_file_dacl_is_protected_and_limited() {
        let d = scratch("dacl-file");
        let f = d.join("secret");
        write_private(&f, b"x").unwrap();
        let report = windows::inspect(&f).unwrap();
        assert!(report.protected, "the DACL must not inherit from %ProgramData% or the temp dir");
        let expected = windows::expected_sids().unwrap();
        let mut got = report.sids.clone();
        got.sort();
        got.dedup();
        assert_eq!(got, expected, "unexpected trustees: {:?}", report.sids);
        assert!(!report.sids.iter().any(|s| s == "S-1-5-32-545"), "BUILTIN\\Users must not be granted");
        assert!(!report.sids.iter().any(|s| s == "S-1-5-11"), "Authenticated Users must not be granted");
        assert!(!report.sids.iter().any(|s| s == "S-1-1-0"), "Everyone must not be granted");
        assert!(report.inherit_flags.iter().all(|f| *f == 0), "a file's entries carry no inheritance flags");
        // The owner can still read it back.
        assert_eq!(std::fs::read(&f).unwrap(), b"x");
        let _ = std::fs::remove_dir_all(&d);
    }

    #[cfg(windows)]
    #[test]
    fn windows_dir_dacl_is_inherited_by_new_files() {
        let d = scratch("dacl-dir");
        let sub = d.join("state");
        create_private_dir(&sub).unwrap();
        let report = windows::inspect(&sub).unwrap();
        assert!(report.protected);
        assert!(report.inherit_flags.iter().all(|f| *f == 3), "OBJECT_INHERIT | CONTAINER_INHERIT expected");
        // A file created normally inside inherits the restricted entries only.
        let child = sub.join("plain.txt");
        std::fs::write(&child, b"y").unwrap();
        let child_report = windows::inspect(&child).unwrap();
        let expected = windows::expected_sids().unwrap();
        let mut got = child_report.sids.clone();
        got.sort();
        got.dedup();
        assert_eq!(got, expected);
        let _ = std::fs::remove_dir_all(&d);
    }
}
