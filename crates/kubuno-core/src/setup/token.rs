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

        // Private from the first byte (0600, or a protected DACL on Windows).
        kubuno_paths::write_private(&path, format!("{value}\n").as_bytes())
            .with_context(|| format!("Écriture du jeton d'installation dans {}", path.display()))?;
        Ok(Self { value, path })
    }

    /// Where the token lives: `KV_SETUP_TOKEN_FILE`, else the instance's state
    /// directory (`kubuno-paths`), never inferred from whether a directory exists.
    ///
    /// A token an earlier version left in one of its old locations is moved
    /// here, so a restart in the middle of an upgrade keeps the token the
    /// administrator already copied. If two different tokens exist, the one at
    /// the new location wins: a token only guards the wizard, it protects no data.
    fn path() -> PathBuf {
        let path = match std::env::var("KV_SETUP_TOKEN_FILE") {
            Ok(p) if !p.trim().is_empty() => PathBuf::from(p.trim()),
            _ => crate::config::paths::current().setup_token_file(),
        };
        let legacy = crate::config::paths::legacy_state_files(kubuno_paths::SETUP_TOKEN);
        if let Err(e) = kubuno_paths::migrate_secret_file(&path, &legacy) {
            tracing::warn!(error = %e, "Installation token: an old copy was left where it is");
        }
        path
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
