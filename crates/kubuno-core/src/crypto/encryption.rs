use aes_gcm::{
    Aes256Gcm, Key, Nonce,
    aead::{Aead, AeadCore, KeyInit, OsRng},
};
use anyhow::{Context, Result};
use base64::{Engine as _, engine::general_purpose::STANDARD};

/// Chiffre `data` avec AES-256-GCM. Retourne base64(nonce || ciphertext).
pub fn encrypt(key_bytes: &[u8; 32], data: &[u8]) -> Result<String> {
    let key = Key::<Aes256Gcm>::from_slice(key_bytes);
    let cipher = Aes256Gcm::new(key);
    let nonce = Aes256Gcm::generate_nonce(&mut OsRng);
    let ciphertext = cipher
        .encrypt(&nonce, data)
        .map_err(|e| anyhow::anyhow!("Chiffrement AES-GCM échoué: {e}"))?;
    let mut combined = nonce.to_vec();
    combined.extend_from_slice(&ciphertext);
    Ok(STANDARD.encode(combined))
}

/// Déchiffre un blob produit par `encrypt`.
pub fn decrypt(key_bytes: &[u8; 32], encoded: &str) -> Result<Vec<u8>> {
    let combined = STANDARD.decode(encoded).context("Base64 invalide")?;
    if combined.len() < 12 {
        anyhow::bail!("Données chiffrées trop courtes");
    }
    let (nonce_bytes, ciphertext) = combined.split_at(12);
    let key = Key::<Aes256Gcm>::from_slice(key_bytes);
    let cipher = Aes256Gcm::new(key);
    let nonce = Nonce::from_slice(nonce_bytes);
    cipher
        .decrypt(nonce, ciphertext)
        .map_err(|e| anyhow::anyhow!("Déchiffrement AES-GCM échoué: {e}"))
}
