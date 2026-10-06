//! The key that protects data at rest — kept apart from the token-signing key.
//!
//! SMTP and directory passwords, OIDC client secrets, users' TOTP secrets and
//! migration credentials are all encrypted with a key derived from
//! `auth.jwt_secret`. That conflates two jobs with opposite lifetimes: a signing
//! key SHOULD be rotated (it only invalidates sessions), while a
//! data-encryption key must not be, or everything sealed with it becomes
//! unreadable. Rotating the JWT secret therefore silently destroyed every
//! stored secret and every enrolled second factor.
//!
//! So the root of the data keys now lives in its own file, next to the TLS
//! material, and rotating the JWT secret no longer touches it.
//!
//! **Upgrading an existing instance costs nothing**: the file is seeded with the
//! JWT secret currently in force, so every value already stored keeps decrypting
//! with exactly the same derivation. Nothing is re-encrypted, nothing can be
//! lost. An instance whose seed was a weak or public value should then run
//! `kubuno rotate-data-key`, which draws a fresh key and re-encrypts the stores.

use anyhow::{Context, Result};
use sha2::{Digest, Sha256};
use std::path::{Path, PathBuf};
use std::sync::OnceLock;

use kubuno_paths::MigrationOutcome;

static ROOT: OnceLock<String> = OnceLock::new();

/// Where the root key lives: `KUBUNO_DATA_KEY_FILE` when set, else `data.key`
/// in the instance's state directory (`kubuno-paths`), beside the TLS key, for
/// the same reason: it is instance identity, not application data — no
/// database dump carries it. Never inferred from whether a directory exists.
pub fn key_path() -> PathBuf {
    if let Ok(p) = std::env::var("KUBUNO_DATA_KEY_FILE") {
        if !p.trim().is_empty() {
            return PathBuf::from(p.trim());
        }
    }
    crate::config::paths::current().data_key_file()
}


/// Loads the root key, seeding it from `jwt_secret` the first time.
///
/// Seeding rather than generating is what makes the change free for an existing
/// instance: the derivations stay identical, so nothing already encrypted has to
/// be touched.
///
/// Before seeding, the locations older versions used (`/var/lib/kubuno` — on
/// Windows `C:\var\lib\kubuno` —, the service's former working directory, the
/// current directory) are searched, and a key found there is moved to
/// [`key_path`]: a new key is NEVER created while an old one exists. Two
/// different keys stop the start-up with an explicit error, since only the
/// operator can tell which one the data was encrypted with.
pub fn init(jwt_secret: &str) -> Result<()> {
    let path = key_path();
    let legacy = crate::config::paths::legacy_state_files(kubuno_paths::DATA_KEY);
    let root = load_or_seed(&path, &legacy, jwt_secret)?;
    let _ = ROOT.set(root);
    Ok(())
}

/// The root key at `path`, migrated from `legacy` or seeded from `jwt_secret`.
fn load_or_seed(path: &Path, legacy: &[PathBuf], jwt_secret: &str) -> Result<String> {
    let outcome = kubuno_paths::migrate_secret_file(path, legacy).map_err(|e| {
        tracing::error!(error = %e, file = %path.display(), "Data encryption key: refusing to start");
        anyhow::anyhow!("data encryption key ({}): {e}", path.display())
    })?;
    let root = match outcome {
        MigrationOutcome::InPlace { retired, .. } => {
            log_retired(&retired);
            read_root(path)?
        }
        MigrationOutcome::Migrated { from, to, retired } => {
            tracing::warn!(
                from = %from.display(),
                to = %to.display(),
                "Data encryption key moved from the location an earlier version used to the \
                 instance's state directory; the data it protects is unchanged"
            );
            log_retired(&retired);
            read_root(path)?
        }
        MigrationOutcome::NotFound => {
            harden_state_dir(path);
            write_root(path, jwt_secret)
                .with_context(|| format!("Writing the data encryption key to {}", path.display()))?;
            tracing::info!(
                file = %path.display(),
                "Data encryption key initialised from the JWT secret in force: data already \
                 encrypted stays readable, and the JWT secret can now be rotated without losing it"
            );
            jwt_secret.to_string()
        }
    };
    Ok(root)
}

fn read_root(path: &Path) -> Result<String> {
    let v = std::fs::read_to_string(path)
        .with_context(|| format!("Reading the data encryption key {}", path.display()))?;
    Ok(v.trim().to_string())
}

fn log_retired(retired: &[kubuno_paths::Retired]) {
    for r in retired {
        match &r.result {
            Ok(to) => tracing::warn!(
                old = %r.from.display(),
                renamed = %to.display(),
                "Old copy of the data encryption key renamed out of the way. Delete it once the \
                 upgrade is confirmed: it may sit in a directory other local users can read"
            ),
            Err(e) => tracing::warn!(
                old = %r.from.display(),
                error = %e,
                "Old copy of the data encryption key could not be renamed; delete it by hand \
                 once the upgrade is confirmed"
            ),
        }
    }
}

/// Off Linux the state directory holds nothing but secrets: close it, so that
/// what is created inside inherits private permissions too. On Linux it is
/// `/var/lib/kubuno`, which the package owns and shares with the data.
fn harden_state_dir(key: &Path) {
    let paths = crate::config::paths::current();
    if paths.os == kubuno_paths::Os::Linux || key.parent() != Some(paths.state_dir.as_path()) {
        return;
    }
    if let Err(e) = kubuno_paths::create_private_dir(&paths.state_dir) {
        tracing::warn!(dir = %paths.state_dir.display(), error = %e, "State directory could not be restricted");
    }
}

/// Replaces the root key on disk (used by the re-keying command): written
/// aside and renamed, readable by the service only (`0600`, or a protected
/// DACL on Windows).
pub fn write_root(path: &Path, value: &str) -> Result<()> {
    kubuno_paths::write_private(path, format!("{value}\n").as_bytes())?;
    Ok(())
}

/// A fresh root key: 32 random bytes, hex.
pub fn generate_root() -> String {
    let mut bytes = [0u8; 32];
    rand::RngCore::fill_bytes(&mut rand::thread_rng(), &mut bytes);
    bytes.iter().map(|b| format!("{b:02x}")).collect()
}

/// The per-domain key. `domain` keeps one store's key useless against another —
/// the same separation the previous derivations used, so a seeded instance
/// reproduces them byte for byte.
pub fn derive(domain: &[u8], root: &str) -> [u8; 32] {
    let mut h = Sha256::new();
    h.update(domain);
    h.update(root.as_bytes());
    h.finalize().into()
}

/// The key in force for `domain`.
///
/// Falls back to the passed JWT secret when `init` was never called — a unit
/// test, a command that does not boot the server — so nothing has to know
/// whether the process went through the bootstrap.
pub fn key(domain: &[u8], jwt_secret_fallback: &str) -> [u8; 32] {
    match ROOT.get() {
        Some(root) => derive(domain, root),
        None => derive(domain, jwt_secret_fallback),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    struct Scratch(PathBuf);
    impl Scratch {
        fn new(name: &str) -> Self {
            let d = std::env::temp_dir().join(format!("kubuno-datakey-{name}-{}", std::process::id()));
            let _ = std::fs::remove_dir_all(&d);
            std::fs::create_dir_all(&d).unwrap();
            Scratch(d)
        }
        fn put(&self, rel: &str, v: &str) -> PathBuf {
            let p = self.0.join(rel);
            std::fs::create_dir_all(p.parent().unwrap()).unwrap();
            std::fs::write(&p, v).unwrap();
            p
        }
    }
    impl Drop for Scratch {
        fn drop(&mut self) {
            let _ = std::fs::remove_dir_all(&self.0);
        }
    }

    #[test]
    fn old_location_only_is_migrated_and_never_reseeded() {
        let s = Scratch::new("old");
        let target = s.0.join("state/data.key");
        let old = s.put("var/lib/kubuno/data.key", "rotated-root\n");
        let root = load_or_seed(&target, &[old], "jwt").unwrap();
        assert_eq!(root, "rotated-root", "the old key wins over the JWT secret");
        assert_eq!(std::fs::read_to_string(&target).unwrap().trim(), "rotated-root");
    }

    #[test]
    fn new_location_only_is_read() {
        let s = Scratch::new("new");
        let target = s.put("state/data.key", "k-new\n");
        assert_eq!(load_or_seed(&target, &[s.0.join("cwd/data.key")], "jwt").unwrap(), "k-new");
    }

    #[test]
    fn identical_copies_are_accepted() {
        let s = Scratch::new("same");
        let target = s.put("state/data.key", "k\n");
        let old = s.put("legacy/data.key", "k");
        assert_eq!(load_or_seed(&target, &[old], "jwt").unwrap(), "k");
    }

    #[test]
    fn different_copies_refuse_to_start() {
        let s = Scratch::new("diff");
        let target = s.put("state/data.key", "k1\n");
        let old = s.put("legacy/data.key", "k2\n");
        let err = load_or_seed(&target, std::slice::from_ref(&old), "jwt").unwrap_err();
        assert!(err.to_string().contains("Refusing to choose"), "{err}");
        assert_eq!(std::fs::read_to_string(&target).unwrap(), "k1\n");
        assert_eq!(std::fs::read_to_string(&old).unwrap(), "k2\n");
    }

    #[test]
    fn nothing_anywhere_seeds_from_the_jwt_secret() {
        let s = Scratch::new("none");
        let target = s.0.join("state/data.key");
        assert_eq!(load_or_seed(&target, &[s.0.join("legacy/data.key")], "jwt-secret").unwrap(), "jwt-secret");
        assert_eq!(std::fs::read_to_string(&target).unwrap(), "jwt-secret\n");
    }
}
