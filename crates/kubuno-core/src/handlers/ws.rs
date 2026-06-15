use crate::{auth::jwt::JwtService, errors::AppError, state::AppState};
use axum::{
    extract::{
        Query,
        State,
        WebSocketUpgrade,
        ws::{Message, WebSocket},
    },
    response::IntoResponse,
};
use futures::{SinkExt, StreamExt};
use serde::Deserialize;

#[derive(Deserialize)]
pub struct WsQuery {
    pub token: String,
}

pub async fn ws_handler(
    State(state): State<AppState>,
    Query(query): Query<WsQuery>,
    ws: WebSocketUpgrade,
) -> Result<impl IntoResponse, AppError> {
    let jwt = JwtService::new(
        state.settings.auth.jwt_secret.clone(),
        state.settings.auth.access_token_ttl,
    );
    let claims = jwt.validate_access_token(&query.token)?;
    let user_id = claims.sub;

    Ok(ws.on_upgrade(move |socket| handle_socket(socket, state, user_id)))
}

async fn handle_socket(socket: WebSocket, state: AppState, user_id: uuid::Uuid) {
    let (mut sender, mut receiver) = socket.split();
    let mut rx = state.ws_hub.connect(user_id).await;

    // Forward EventBus → WebSocket client
    let send_task = tokio::spawn(async move {
        while let Some(msg) = rx.recv().await {
            if let Ok(json) = serde_json::to_string(&msg) {
                if sender.send(Message::Text(json.into())).await.is_err() {
                    break;
                }
            }
        }
    });

    // Lire les messages client (ping/pong ou fermeture)
    while let Some(Ok(msg)) = receiver.next().await {
        if matches!(msg, Message::Close(_)) {
            break;
        }
    }

    send_task.abort();
    tracing::debug!(user_id = %user_id, "WebSocket déconnecté");
}
