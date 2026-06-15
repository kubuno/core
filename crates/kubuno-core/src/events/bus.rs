use super::AppEvent;
use sqlx::PgPool;
use tokio::sync::broadcast;

pub struct EventBus {
    sender: broadcast::Sender<AppEvent>,
}

impl EventBus {
    pub fn new(capacity: usize) -> Self {
        let (sender, _) = broadcast::channel(capacity);
        Self { sender }
    }

    pub fn publish(&self, event: AppEvent) -> usize {
        self.sender.send(event).unwrap_or(0)
    }

    pub fn subscribe(&self) -> broadcast::Receiver<AppEvent> {
        self.sender.subscribe()
    }

    pub async fn publish_and_log(&self, event: AppEvent, db: &PgPool) {
        let event_type = event_type_name(&event);
        let payload = serde_json::to_value(&event).unwrap_or_default();
        self.publish(event);

        if let Err(e) = sqlx::query(
            "INSERT INTO core.event_log (event_type, payload) VALUES ($1, $2)",
        )
        .bind(event_type)
        .bind(payload)
        .execute(db)
        .await
        {
            tracing::error!(error = %e, "Échec log event en DB");
        }
    }
}

fn event_type_name(event: &AppEvent) -> &'static str {
    match event {
        AppEvent::UserCreated { .. }         => "UserCreated",
        AppEvent::UserDeleted { .. }         => "UserDeleted",
        AppEvent::UserUpdated { .. }         => "UserUpdated",
        AppEvent::QuotaUpdated { .. }        => "QuotaUpdated",
        AppEvent::FileUploaded { .. }        => "FileUploaded",
        AppEvent::FileDeleted { .. }         => "FileDeleted",
        AppEvent::FileMoved { .. }           => "FileMoved",
        AppEvent::ShareCreated { .. }        => "ShareCreated",
        AppEvent::ShareRevoked { .. }        => "ShareRevoked",
        AppEvent::MessageSent { .. }         => "MessageSent",
        AppEvent::TaskCreated { .. }         => "TaskCreated",
        AppEvent::TaskUpdated { .. }         => "TaskUpdated",
        AppEvent::TaskDeleted { .. }         => "TaskDeleted",
        AppEvent::TaskCompleted { .. }       => "TaskCompleted",
        AppEvent::EventCreated { .. }        => "EventCreated",
        AppEvent::FormSubmitted { .. }       => "FormSubmitted",
        AppEvent::NoteCreated { .. }         => "NoteCreated",
        AppEvent::PhotoImported { .. }       => "PhotoImported",
        AppEvent::AiIndexRequested { .. }    => "AiIndexRequested",
        AppEvent::ContactUpdated { .. }      => "ContactUpdated",
        AppEvent::ModuleRegistered { .. }    => "ModuleRegistered",
        AppEvent::ModuleUnregistered { .. }  => "ModuleUnregistered",
        AppEvent::ModuleHealthChanged { .. } => "ModuleHealthChanged",
        AppEvent::Custom { .. }              => "Custom",
    }
}
