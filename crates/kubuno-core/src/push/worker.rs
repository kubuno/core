//! Background worker: EventBus → push notifications.

use std::sync::Arc;
use std::time::Duration;

use sqlx::PgPool;
use tokio::sync::broadcast::error::RecvError;
use uuid::Uuid;

use crate::events::EventBus;
use crate::push::{mapping, unifiedpush::UnifiedPush, PushNotification, PushProvider};

pub async fn push_worker(bus: Arc<EventBus>, db: PgPool) {
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(10))
        .build()
        .unwrap_or_else(|_| reqwest::Client::new());
    let unifiedpush = UnifiedPush;

    let mut rx = bus.subscribe();
    loop {
        match rx.recv().await {
            Ok(event) => {
                if let Some(notif) = mapping::event_to_push(&event) {
                    deliver(&client, &db, &unifiedpush, &notif).await;
                }
            }
            Err(RecvError::Lagged(n)) => {
                tracing::warn!("Worker push en retard de {n} events");
            }
            Err(RecvError::Closed) => break,
        }
    }
}

async fn deliver(
    client: &reqwest::Client,
    db: &PgPool,
    unifiedpush: &UnifiedPush,
    notif: &PushNotification,
) {
    for &user_id in &notif.user_ids {
        if !preference_enabled(db, user_id, &notif.module, &notif.event_type).await {
            continue;
        }

        let devices = match sqlx::query_as::<_, (Uuid, String, String)>(
            "SELECT id, provider, device_token FROM core.push_devices WHERE user_id = $1",
        )
        .bind(user_id)
        .fetch_all(db)
        .await
        {
            Ok(d) => d,
            Err(e) => {
                tracing::error!(error = %e, "Lecture push_devices échouée");
                continue;
            }
        };

        for (device_id, provider, token) in devices {
            let result = match provider.as_str() {
                "unifiedpush" => unifiedpush.send(client, &token, notif).await,
                // APNs/FCM acceptés à l'enregistrement, livraison ajoutée plus tard.
                other => {
                    tracing::debug!(provider = %other, "Provider push non encore implémenté — device ignoré");
                    continue;
                }
            };

            match result {
                Ok(true) => {
                    let _ = sqlx::query("UPDATE core.push_devices SET last_seen_at = NOW() WHERE id = $1")
                        .bind(device_id)
                        .execute(db)
                        .await;
                }
                Ok(false) => {
                    // Endpoint disparu (404/410) → purge du device.
                    let _ = sqlx::query("DELETE FROM core.push_devices WHERE id = $1")
                        .bind(device_id)
                        .execute(db)
                        .await;
                    tracing::info!(%device_id, "Device push purgé (endpoint disparu)");
                }
                Err(e) => {
                    tracing::warn!(error = %e, %device_id, "Envoi push échoué");
                }
            }
        }
    }
}

/// Push enabled unless an opt-out row matches. The most specific row wins.
async fn preference_enabled(db: &PgPool, user_id: Uuid, module: &str, event_type: &str) -> bool {
    sqlx::query_scalar::<_, bool>(
        r#"SELECT enabled FROM core.push_preferences
           WHERE user_id = $1
             AND module_id IN ($2, '*')
             AND event_type IN ($3, '*')
           ORDER BY ((module_id <> '*')::int + (event_type <> '*')::int) DESC
           LIMIT 1"#,
    )
    .bind(user_id)
    .bind(module)
    .bind(event_type)
    .fetch_optional(db)
    .await
    .ok()
    .flatten()
    .unwrap_or(true)
}
