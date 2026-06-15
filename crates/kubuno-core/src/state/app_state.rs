use crate::{
    config::Settings,
    events::EventBus,
    modules::registry::ModuleRegistry,
    websocket::hub::WsHub,
};
use kubuno_storage::StorageBackend;
use sqlx::PgPool;
use std::sync::Arc;
use tokio::sync::RwLock;

use crate::storage::remote::RemoteMountService;

#[derive(Clone)]
pub struct AppState {
    pub db:       PgPool,
    pub settings: Arc<Settings>,
    pub events:   Arc<EventBus>,
    pub modules:  Arc<RwLock<ModuleRegistry>>,
    pub storage:  Arc<dyn StorageBackend>,
    pub ws_hub:   Arc<WsHub>,
    /// Montages distants centralisés (connecteurs + cache + chiffrement).
    pub remote_mounts: Arc<RemoteMountService>,
}
