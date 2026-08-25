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

static ROOT: OnceLock<String> = OnceLock::new();

/// Where the root key lives. Beside the TLS key, for the same reason: it is
/// instance identity, not application data — no database dump carries it.
pub fn key_path() -> PathBuf {
    if let Ok(p) = std::env::var("KUBUNO_DATA_KEY_FILE") {
        if !p.trim().is_empty() {
            return PathBuf::from(p);
        }
    }
    let state = Path::new("/var/lib/kubuno");
    if state.is_dir() {
        return state.join("data.key");
    }
    PathBuf::from("data.key")
}

/// Loads the root key, seeding it from `jwt_secret` the first time.
///
/// Seeding rather than generating is what makes the change free for an existing
/// instance: the derivations stay identical, so nothing already encrypted has to
/// be touched.
pub fn init(jwt_secret: &str) -> Result<()> {
    let path = key_path();
    let root = match std::fs::read_to_string(&path) {
        Ok(v) if !v.trim().is_empty() => v.trim().to_string(),
        _ => {
            write_root(&path, jwt_secret)
                .with_context(|| format!("Écriture de la clé de données dans {}", path.display()))?;
            tracing::info!(
                file = %path.display(),
                "Clé de chiffrement des données initialisée depuis le secret JWT en vigueur — \
                 les données déjà chiffrées restent lisibles, et le secret JWT peut désormais \
                 être changé sans les perdre"
            );
            jwt_secret.to_string()
        }
    };
    let _ = ROOT.set(root);
    Ok(())
}

/// Replaces the root key on disk (used by the re-keying command).
pub fn write_root(path: &Path, value: &str) -> Result<()> {
    if let Some(dir) = path.parent() {
        let _ = std::fs::create_dir_all(dir);
    }
    std::fs::write(path, format!("{value}\n"))?;
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        std::fs::set_permissions(path, std::fs::Permissions::from_mode(0o600))?;
    }
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
