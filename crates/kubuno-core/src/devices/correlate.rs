//! Deciding *which* device a request comes from, and keeping the inventory row
//! in step with it.
//!
//! ## Three sources, in decreasing order of honesty
//!
//! 1. **A native client's device key** (`X-Kubuno-Device-Key`) — the application
//!    generates it once, stores it in the OS keychain, and sends it on every
//!    authentication. Strong.
//! 2. **A first-party opaque cookie** (`kb_device`) — minted by the server on
//!    the first browser sign-in that has none. HttpOnly, so no script can read
//!    or forge it, and it carries nothing but a random value. Strong.
//! 3. **A fingerprint derived from the normalised user agent** — the fallback,
//!    and the only thing available for sessions opened before this table
//!    existed. Honestly weaker: two identical laptops of the same account
//!    collapse into one row. The console shows which of the two kinds a device
//!    was correlated by, rather than presenting the guess as a fact.
//!
//! ## The correlation identifier is a secret
//!
//! Whatever the source, the material is hashed (SHA-256) and only the hash is
//! stored, in `core.devices.correlation_hash`. It is never serialised, never
//! logged, and never accepted as an input: a caller who knew it could claim
//! somebody else's inventory row. The API speaks exclusively in
//! `core.devices.id`, a public UUID that grants nothing on its own.

use chrono::{DateTime, Utc};
use sha2::{Digest, Sha256};
use sqlx::{PgExecutor, PgPool};
use uuid::Uuid;

use super::model::{event_kind, AuthStrength};
use super::user_agent::{self, Normalised};
use crate::errors::AppError;

/// Name of the first-party correlation cookie.
pub const DEVICE_COOKIE: &str = "kb_device";
/// Header a native application uses instead of the cookie.
pub const DEVICE_HEADER: &str = "x-kubuno-device-key";
/// Two years: long enough that a laptop keeps its identity across a holiday,
/// short enough that an abandoned machine eventually falls out of the inventory
/// by itself.
const COOKIE_MAX_AGE: i64 = 60 * 60 * 24 * 730;

/// How a request was tied to an inventory row.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct DeviceKey {
    /// Correlation material. **Never** logged, never serialised.
    raw: String,
    /// `"key"` or `"fingerprint"`, mirrored into `correlation_kind`.
    pub kind: &'static str,
    /// Present when the server had to mint a cookie: the caller must send it
    /// back on the response, otherwise the next sign-in falls back to the
    /// fingerprint and the inventory splits.
    pub mint: Option<String>,
}

impl DeviceKey {
    /// SHA-256 of the material, hex. The only form that ever reaches the
    /// database.
    pub fn hash(&self) -> String {
        hex::encode(Sha256::digest(self.raw.as_bytes()))
    }
}

// `Debug` on the struct would print `raw`. Deriving it and then remembering not
// to log the value is the kind of discipline that lasts until the first
// `tracing::debug!(?key)`, so the field is private and this is the manual impl.
impl std::fmt::Display for DeviceKey {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "DeviceKey({})", self.kind)
    }
}

/// Reads the correlation cookie out of a `Cookie` header value.
fn cookie_value(cookies: &str) -> Option<String> {
    cookies.split(';').find_map(|part| {
        part.trim()
            .strip_prefix(&format!("{DEVICE_COOKIE}="))
            .map(str::to_string)
            .filter(|v| !v.is_empty())
    })
}

/// Builds the `Set-Cookie` value for a freshly minted key.
pub fn mint_cookie(value: &str, secure: bool) -> String {
    let secure = if secure { "; Secure" } else { "" };
    // `Path=/` and not `/api/v1/auth`: the cookie has to reach `/me/devices` so
    // the personal screen can mark "this device" without the client having to
    // hold anything itself. HttpOnly keeps it out of reach of scripts, and it
    // carries no information beyond a random value.
    format!("{DEVICE_COOKIE}={value}; HttpOnly{secure}; Path=/; SameSite=Lax; Max-Age={COOKIE_MAX_AGE}")
}

/// Resolves the correlation key of an authenticating request.
///
/// `header` / `cookies` are the raw header values; `normalised` is the reading
/// of the user agent, used only by the fingerprint fallback.
pub fn resolve(
    header: Option<&str>,
    cookies: Option<&str>,
    user_id: Uuid,
    client_type: &str,
    normalised: &Normalised,
    accepts_cookie: bool,
) -> DeviceKey {
    if let Some(key) = header.map(str::trim).filter(|k| !k.is_empty()) {
        return DeviceKey {
            raw: format!("k:{key}"),
            kind: "key",
            mint: None,
        };
    }
    if let Some(existing) = cookies.and_then(cookie_value) {
        return DeviceKey {
            raw: format!("k:{existing}"),
            kind: "key",
            mint: None,
        };
    }
    if accepts_cookie {
        let (fresh, _) = crate::crypto::token::generate_token();
        return DeviceKey {
            raw: format!("k:{fresh}"),
            kind: "key",
            mint: Some(fresh),
        };
    }
    DeviceKey {
        raw: format!(
            "f:{user_id}:{client_type}:{}",
            normalised.fingerprint_material()
        ),
        kind: "fingerprint",
        mint: None,
    }
}

/// Fingerprint key without minting anything — used by the backfill, which
/// reconciles rows that were written before any cookie existed.
pub fn fingerprint_key(user_id: Uuid, client_type: &str, normalised: &Normalised) -> DeviceKey {
    DeviceKey {
        raw: format!(
            "f:{user_id}:{client_type}:{}",
            normalised.fingerprint_material()
        ),
        kind: "fingerprint",
        mint: None,
    }
}

/// Outcome of an upsert.
pub struct Touched {
    pub device_id: Uuid,
    pub approval: String,
    pub created: bool,
}

/// Creates or refreshes the inventory row for a device that just authenticated.
///
/// Observed fields are always refreshed (a laptop that moved country must say
/// so). Declared fields are never touched here — only the declaration route
/// writes them, and only when the operator switched declarations on.
#[allow(clippy::too_many_arguments)]
pub async fn upsert(
    db: &PgPool,
    user_id: Uuid,
    key: &DeviceKey,
    normalised: &Normalised,
    raw_ua: &str,
    client_type: &str,
    ip: Option<&str>,
    country: Option<&str>,
) -> Result<Touched, AppError> {
    let row: (Uuid, String, DateTime<Utc>, DateTime<Utc>) = sqlx::query_as(
        r#"INSERT INTO core.devices
               (user_id, correlation_hash, correlation_kind, device_type, client_kind,
                platform, platform_version, browser, browser_version, user_agent,
                last_ip, last_country)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::inet, $12)
           ON CONFLICT (user_id, correlation_hash) DO UPDATE SET
               device_type      = EXCLUDED.device_type,
               client_kind      = EXCLUDED.client_kind,
               platform         = EXCLUDED.platform,
               platform_version = EXCLUDED.platform_version,
               browser          = EXCLUDED.browser,
               browser_version  = EXCLUDED.browser_version,
               user_agent       = EXCLUDED.user_agent,
               last_ip          = EXCLUDED.last_ip,
               last_country     = COALESCE(EXCLUDED.last_country, core.devices.last_country),
               last_seen_at     = NOW()
           RETURNING id, approval, first_seen_at, last_seen_at"#,
    )
    .bind(user_id)
    .bind(key.hash())
    .bind(key.kind)
    .bind(&normalised.device_type)
    .bind(client_type)
    .bind(normalised.platform.as_deref())
    .bind(normalised.platform_version.as_deref())
    .bind(normalised.browser.as_deref())
    .bind(normalised.browser_version.as_deref())
    .bind(raw_ua)
    .bind(ip)
    .bind(country)
    .fetch_one(db)
    .await
    .map_err(|e| {
        // The key is not in this log line, and must never be added to it.
        tracing::error!(error = %e, user_id = %user_id, "devices: upsert de l'appareil");
        AppError::Database(e)
    })?;

    let (device_id, approval, first_seen, last_seen) = row;
    let created = first_seen == last_seen;
    if created {
        record_event(
            db,
            device_id,
            event_kind::FIRST_SEEN,
            ip,
            country,
            None,
            None,
            Some(&normalised.describe()),
        )
        .await;
    }

    Ok(Touched {
        device_id,
        approval,
        created,
    })
}

/// Ties a freshly issued session to its device and records what the request
/// revealed about it.
pub async fn attach_session<'e, E: PgExecutor<'e>>(
    executor: E,
    session_id: Uuid,
    device_id: Uuid,
    country: Option<&str>,
    strength: AuthStrength,
) -> Result<(), AppError> {
    sqlx::query(
        "UPDATE core.refresh_tokens
            SET device_id = $2, country = $3, auth_strength = $4
          WHERE id = $1",
    )
    .bind(session_id)
    .bind(device_id)
    .bind(country)
    .bind(strength.as_str())
    .execute(executor)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, session_id = %session_id, "devices: rattachement de la session");
        AppError::Database(e)
    })?;
    Ok(())
}

/// Appends a line to a device timeline.
///
/// Best-effort: a timeline that could not be written must never turn a
/// successful sign-in into a 500. The failure is logged loudly instead — the
/// administrative audit trail, which *is* transactional, remains the authority
/// on every operator action.
#[allow(clippy::too_many_arguments)]
pub async fn record_event(
    db: &PgPool,
    device_id: Uuid,
    kind: &str,
    ip: Option<&str>,
    country: Option<&str>,
    actor_id: Option<Uuid>,
    actor_label: Option<&str>,
    detail: Option<&str>,
) {
    let result = sqlx::query(
        "INSERT INTO core.device_events
             (device_id, kind, ip_address, country, actor_id, actor_label, detail)
         VALUES ($1, $2, $3::inet, $4, $5, $6, $7)",
    )
    .bind(device_id)
    .bind(kind)
    .bind(ip)
    .bind(country)
    .bind(actor_id)
    .bind(actor_label)
    .bind(detail)
    .execute(db)
    .await;

    if let Err(e) = result {
        tracing::error!(error = %e, device_id = %device_id, kind = %kind, "devices: écriture d'un événement d'appareil");
    }
}

/// Same, inside a caller-supplied transaction, so an administrative act and its
/// timeline line commit together.
#[allow(clippy::too_many_arguments)]
pub async fn record_event_tx<'e, E: PgExecutor<'e>>(
    executor: E,
    device_id: Uuid,
    kind: &str,
    actor_id: Option<Uuid>,
    actor_label: Option<&str>,
    detail: Option<&str>,
) -> Result<(), AppError> {
    sqlx::query(
        "INSERT INTO core.device_events (device_id, kind, actor_id, actor_label, detail)
         VALUES ($1, $2, $3, $4, $5)",
    )
    .bind(device_id)
    .bind(kind)
    .bind(actor_id)
    .bind(actor_label)
    .bind(detail)
    .execute(executor)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, device_id = %device_id, kind = %kind, "devices: événement d'appareil (transaction)");
        AppError::Database(e)
    })?;
    Ok(())
}

/// Attaches every session that predates the inventory to a device, by
/// fingerprint.
///
/// Runs once at startup and is cheap afterwards: it only ever looks at rows
/// where `device_id IS NULL`, and there are none after the first pass. Doing it
/// in Rust rather than in the migration is what lets it use the very same
/// normaliser as the live path — an SQL approximation of the parser would file
/// the same laptop under two different devices depending on which code touched
/// it first.
/// One row of the backfill scan: `(session, account, user agent, client, address)`.
type LegacySession = (Uuid, Uuid, Option<String>, Option<String>, Option<String>);

pub async fn backfill(db: &PgPool) -> Result<u64, AppError> {
    let rows: Vec<LegacySession> = sqlx::query_as(
        r#"SELECT id, user_id, user_agent, client_type, host(ip_address)::text
             FROM core.refresh_tokens
            WHERE device_id IS NULL
              AND revoked_at IS NULL
              AND expires_at > NOW()
            ORDER BY created_at
            LIMIT 5000"#,
    )
    .fetch_all(db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, "devices: lecture des sessions à rattacher");
        AppError::Database(e)
    })?;

    if rows.is_empty() {
        return Ok(0);
    }

    let mut attached = 0u64;
    for (session_id, user_id, ua, client_type, ip) in rows {
        let raw_ua = ua.unwrap_or_default();
        let normalised = user_agent::normalise(&raw_ua);
        let client = client_type.unwrap_or_else(|| "web".into());
        let key = fingerprint_key(user_id, &client, &normalised);
        let country = super::geoip::lookup_str(ip.as_deref());

        let touched = upsert(
            db,
            user_id,
            &key,
            &normalised,
            &raw_ua,
            &client,
            ip.as_deref(),
            country.as_deref(),
        )
        .await?;

        attach_session(
            db,
            session_id,
            touched.device_id,
            country.as_deref(),
            AuthStrength::Unknown,
        )
        .await?;
        attached += 1;
    }

    tracing::info!(sessions = attached, "Sessions existantes rattachées à un appareil");
    Ok(attached)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn norm(ua: &str) -> Normalised {
        user_agent::normalise(ua)
    }

    const CHROME: &str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";
    const SAFARI: &str = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15";

    #[test]
    fn a_native_device_key_wins_over_everything_else() {
        let user = Uuid::from_u128(1);
        let key = resolve(
            Some("abc123"),
            Some("kb_device=zzz"),
            user,
            "native",
            &norm(CHROME),
            true,
        );
        assert_eq!(key.kind, "key");
        assert_eq!(key.mint, None);
        // Same header ⇒ same row, whatever the cookie says.
        let again = resolve(Some("abc123"), None, user, "native", &norm(SAFARI), false);
        assert_eq!(key.hash(), again.hash());
    }

    #[test]
    fn an_existing_cookie_is_reused_and_nothing_is_minted() {
        let user = Uuid::from_u128(2);
        let key = resolve(None, Some("a=1; kb_device=opaque; b=2"), user, "web", &norm(CHROME), true);
        assert_eq!(key.kind, "key");
        assert_eq!(key.mint, None);
    }

    #[test]
    fn a_browser_without_a_cookie_gets_one_minted() {
        let user = Uuid::from_u128(3);
        let key = resolve(None, None, user, "web", &norm(CHROME), true);
        assert_eq!(key.kind, "key");
        let minted = key.mint.clone().expect("un cookie doit être émis");
        assert!(!minted.is_empty());
        // The cookie the browser will send back resolves to the same row.
        let next = resolve(
            None,
            Some(&format!("kb_device={minted}")),
            user,
            "web",
            &norm(CHROME),
            true,
        );
        assert_eq!(key.hash(), next.hash());
    }

    #[test]
    fn without_a_cookie_channel_the_fingerprint_is_the_fallback() {
        let user = Uuid::from_u128(4);
        let key = resolve(None, None, user, "api", &norm(CHROME), false);
        assert_eq!(key.kind, "fingerprint");
        assert_eq!(key.mint, None);
    }

    /// Two different machines of the same account must not be one row…
    #[test]
    fn the_fingerprint_separates_two_machines() {
        let user = Uuid::from_u128(5);
        let laptop = fingerprint_key(user, "web", &norm(SAFARI));
        let desktop = fingerprint_key(user, "web", &norm(CHROME));
        assert_ne!(laptop.hash(), desktop.hash());
    }

    /// …and the same machine used by two accounts must not be one row either:
    /// the inventory is a view of one account's exposure.
    #[test]
    fn the_fingerprint_separates_two_accounts() {
        let a = fingerprint_key(Uuid::from_u128(6), "web", &norm(CHROME));
        let b = fingerprint_key(Uuid::from_u128(7), "web", &norm(CHROME));
        assert_ne!(a.hash(), b.hash());
    }

    /// A browser update must not mint a new device.
    #[test]
    fn a_browser_update_keeps_the_same_fingerprint() {
        let user = Uuid::from_u128(8);
        let before = fingerprint_key(user, "web", &norm(CHROME));
        let after = fingerprint_key(
            user,
            "web",
            &norm("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"),
        );
        assert_eq!(before.hash(), after.hash());
    }

    /// The stored identifier is a hash: 64 hex characters, and none of the
    /// material is recoverable from it.
    #[test]
    fn only_a_hash_is_ever_stored() {
        let key = resolve(Some("secret-material"), None, Uuid::from_u128(9), "native", &norm(CHROME), false);
        let hash = key.hash();
        assert_eq!(hash.len(), 64);
        assert!(hash.chars().all(|c| c.is_ascii_hexdigit()));
        assert!(!hash.contains("secret-material"));
        // Nor does the only textual rendering the type offers.
        assert_eq!(key.to_string(), "DeviceKey(key)");
    }

    #[test]
    fn the_minted_cookie_is_http_only_and_scoped_to_the_whole_site() {
        let value = mint_cookie("abc", true);
        assert!(value.contains("HttpOnly"));
        assert!(value.contains("Secure"));
        assert!(value.contains("Path=/"));
        assert!(value.contains("SameSite=Lax"));
        assert!(!mint_cookie("abc", false).contains("Secure"));
    }
}
