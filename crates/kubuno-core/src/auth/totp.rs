use anyhow::{Context, Result};
use sha2::{Digest, Sha256};
use totp_rs::{Algorithm, Secret, TOTP};

use crate::crypto::encryption;

fn totp_key(jwt_secret: &str) -> [u8; 32] {
    let mut h = Sha256::new();
    h.update(b"kubuno:totp:");
    h.update(jwt_secret.as_bytes());
    h.finalize().into()
}

/// Generate a new TOTP secret. Returns (base32_secret, otpauth_uri, encrypted_blob).
pub fn generate_secret(jwt_secret: &str, email: &str) -> Result<(String, String, String)> {
    let secret = Secret::generate_secret();
    let secret_bytes = secret
        .to_bytes()
        .map_err(|e| anyhow::anyhow!("Secret TOTP: {e}"))?;
    // `Secret::Raw.to_string()` yields HEX; manual entry in authenticator apps
    // needs the BASE32 form (matching what the otpauth URI/QR encodes).
    let secret_base32 = secret.to_encoded().to_string();

    let totp = TOTP::new(
        Algorithm::SHA1,
        6,
        1,
        30,
        secret_bytes.clone(),
        Some("Kubuno".to_string()),
        email.to_string(),
    )
    .map_err(|e| anyhow::anyhow!("TOTP init: {e}"))?;

    let uri = totp.get_url();

    let key = totp_key(jwt_secret);
    let encrypted = encryption::encrypt(&key, &secret_bytes)
        .context("Chiffrement secret TOTP")?;

    Ok((secret_base32, uri, encrypted))
}

/// Verify a TOTP code against an AES-GCM-encrypted secret blob.
pub fn verify_code(jwt_secret: &str, encrypted: &str, code: &str, email: &str) -> Result<bool> {
    let key = totp_key(jwt_secret);
    let secret_bytes = encryption::decrypt(&key, encrypted)
        .context("Déchiffrement secret TOTP")?;

    let totp = TOTP::new(
        Algorithm::SHA1,
        6,
        1,
        30,
        secret_bytes,
        Some("Kubuno".to_string()),
        email.to_string(),
    )
    .map_err(|e| anyhow::anyhow!("TOTP init: {e}"))?;

    totp.check_current(code)
        .map_err(|e| anyhow::anyhow!("TOTP check: {e}"))
}
