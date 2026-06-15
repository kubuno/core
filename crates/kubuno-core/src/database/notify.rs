use crate::events::{AppEvent, EventBus};
use anyhow::Result;
use sqlx::PgPool;
use sqlx::postgres::PgListener;
use std::sync::Arc;

pub async fn start_pg_listener(pool: &PgPool, event_bus: Arc<EventBus>) -> Result<()> {
    let mut listener = PgListener::connect_with(pool).await?;
    listener.listen("kubuno_events").await?;
    tracing::info!("PgListener démarré sur le canal 'kubuno_events'");

    tokio::spawn(async move {
        loop {
            match listener.recv().await {
                Ok(notification) => {
                    match serde_json::from_str::<AppEvent>(notification.payload()) {
                        Ok(event) => {
                            event_bus.publish(event);
                        }
                        Err(e) => {
                            tracing::warn!(error = %e, payload = notification.payload(), "Notification PG non désérialisable");
                        }
                    }
                }
                Err(e) => {
                    tracing::error!(error = %e, "Erreur PgListener, tentative de reconnexion…");
                    tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;
                }
            }
        }
    });

    Ok(())
}

pub async fn pg_notify(db: &PgPool, event: &AppEvent) -> Result<()> {
    let payload = serde_json::to_string(event)?;
    sqlx::query("SELECT pg_notify('kubuno_events', $1)")
        .bind(&payload)
        .execute(db)
        .await?;
    Ok(())
}
