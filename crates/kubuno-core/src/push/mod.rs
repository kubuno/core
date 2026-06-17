//! Push notification delivery for native/desktop apps.
//!
//! A background [`worker`] consumes the EventBus, maps each `AppEvent` to a
//! [`PushNotification`] (see [`mapping`]) and fans it out to the recipient's
//! registered devices, honoring per-user preferences.
//!
//! Providers are pluggable via [`PushProvider`]. UnifiedPush (the de-googled
//! default, like Nextcloud) is implemented; APNs/FCM rows are accepted and
//! delivery for them is added later.

pub mod mapping;
pub mod unifiedpush;
pub mod worker;

use serde::Serialize;
use uuid::Uuid;

/// A notification ready to be delivered to one or more users' devices.
#[derive(Clone, Serialize)]
pub struct PushNotification {
    /// Recipients. Not serialized into the device payload.
    #[serde(skip)]
    pub user_ids: Vec<Uuid>,
    #[serde(rename = "type")]
    pub event_type: String,
    pub module: String,
    pub title: String,
    pub body: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub resource_id: Option<String>,
}

/// A transport able to deliver a notification to a single device token.
#[async_trait::async_trait]
pub trait PushProvider: Send + Sync {
    /// Returns `Ok(false)` when the token is gone (e.g. APNs 410) so the caller
    /// can prune the device; `Ok(true)` on success.
    async fn send(
        &self,
        client: &reqwest::Client,
        device_token: &str,
        notif: &PushNotification,
    ) -> anyhow::Result<bool>;
}
