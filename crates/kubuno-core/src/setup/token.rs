//! The proof that whoever runs the installer is the machine's administrator.
//!
//! Between the first boot and the end of the installation, the instance has no
//! accounts: the wizard is the one moment when an unauthenticated visitor could
//! claim the instance. WordPress and Nextcloud accept whoever gets there first;
//! here the wizard also asks for a one-time token written to a file only the
//! service user can read (and echoed in the service log), so claiming the
//! instance requires access to the machine, not just to the port.

use anyhow::{Context, Result};
use rand::RngCore;
use std::fs;
use std::path::{Path, PathBuf};

pub struct SetupToken {
    value: String,
    path: PathBuf,
}

impl SetupToken {
    /// Reuses the token of an earlier setup boot when one is still on disk (a
    /// restart mid-installation must not invalidate the token the administrator
    /// already copied), otherwise mints a fresh one.
    pub fn create_or_load() -> Result<Self> {
        let path = Self::path();
        if let Ok(existing) = fs::read_to_string(&path) {
            let existing = existing.trim().to_string();
            if existing.len() >= 32 {
                return Ok(Self { value: existing, path });
            }
        }

        let mut bytes = [0u8; 24];
        rand::thread_rng().fill_bytes(&mut bytes);
        let value = bytes.iter().map(|b| format!("{b:02x}")).collect::<String>();

        if let Some(dir) = path.parent() {
            let _ = fs::create_dir_all(dir);
        }
        fs::write(&path, format!("{value}\n"))
            .with_context(|| format!("Écriture du jeton d'installation dans {}", path.display()))?;
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            let _ = fs::set_permissions(&path, fs::Permissions::from_mode(0o600));
        }
        Ok(Self { value, path })
    }

    /// Where the token lives: `KV_SETUP_TOKEN_FILE`, else the service's state
    /// directory, else beside the binary (development).
    fn path() -> PathBuf {
        if let Ok(p) = std::env::var("KV_SETUP_TOKEN_FILE") {
            if !p.trim().is_empty() {
                return PathBuf::from(p);
            }
        }
        let state = Path::new("/var/lib/kubuno");
        if state.is_dir() {
            return state.join("setup-token");
        }
        PathBuf::from("setup-token")
    }

    pub fn file(&self) -> &Path {
        &self.path
    }

    /// Compares in constant time: a token checked with `==` leaks its prefix
    /// through timing, and this one is the only thing guarding the installation.
    pub fn verify(&self, given: &str) -> bool {
        let a = self.value.as_bytes();
        let b = given.trim().as_bytes();
        if a.len() != b.len() {
            return false;
        }
        let mut diff = 0u8;
        for (x, y) in a.iter().zip(b.iter()) {
            diff |= x ^ y;
        }
        diff == 0
    }

    /// Removes the token once the instance is installed: it protects a window
    /// that is now closed, and a secret nobody needs is only a liability.
    pub fn consume(&self) {
        let _ = fs::remove_file(&self.path);
    }

    /// Printed in the service log so an administrator with `journalctl` never
    /// has to hunt for the file.
    pub fn announce(&self) {
        tracing::warn!(
            "╔══════════════════════════════════════════════════════════════════╗"
        );
        tracing::warn!("  KUBUNO N'EST PAS ENCORE INSTALLÉ — assistant d'installation actif");
        tracing::warn!("  Jeton d'installation : {}", self.value);
        tracing::warn!("  (également dans {})", self.path.display());
        tracing::warn!(
            "╚══════════════════════════════════════════════════════════════════╝"
        );
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn verify_is_exact() {
        let t = SetupToken { value: "abcdef".into(), path: PathBuf::from("/dev/null") };
        assert!(t.verify("abcdef"));
        assert!(t.verify(" abcdef\n"), "les espaces autour sont tolérés (copier-coller)");
        assert!(!t.verify("abcdee"));
        assert!(!t.verify("abcde"));
        assert!(!t.verify(""));
    }
}
