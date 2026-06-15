//! Service de collaboration temps réel (Yjs) GÉNÉRIQUE du core.
//!
//! Tout module qui édite un fichier kubuno (.kb***) peut ouvrir une session
//! collaborative en connectant son `Y.Doc` au WebSocket `/collab/:room/sync`.
//! Le core ne comprend PAS la structure Yjs : il relaie des updates binaires
//! opaques (concaténables) entre les clients d'une même `room` et les persiste
//! (journal d'updates + snapshot consolidé) pour que les retardataires se
//! resynchronisent. Le fichier `.kb***` visible reste écrit par les clients
//! (snapshot applicatif JSON) — ici on ne garde que l'état CRDT transitoire.
//!
//! Auth : JWT via `?token=` (les navigateurs ne peuvent pas poser d'en-têtes sur
//! un upgrade WebSocket). N'importe quel utilisateur authentifié peut rejoindre
//! une room (le module contrôle qui obtient l'identifiant d'entité ; un ACL par
//! room pourra être ajouté plus tard).

use std::{
    collections::{HashMap, HashSet},
    sync::Arc,
    sync::OnceLock,
};

use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        Path, Query, State,
    },
    response::IntoResponse,
};
use futures::{SinkExt, StreamExt};
use serde::Deserialize;
use tokio::sync::{broadcast, Mutex, RwLock};
use uuid::Uuid;
use yrs::{
    encoding::read::Cursor,
    updates::decoder::{Decode, DecoderV1},
    Doc, ReadTxn, StateVector, Transact, Update,
};

use crate::{auth::jwt::JwtService, errors::AppError, state::AppState};

/// Au-delà de ce nombre d'updates en journal, on consolide (GC) la room.
const CONSOLIDATE_THRESHOLD: i64 = 30;
/// …ou au-delà de cette taille cumulée de journal (un insert d'image suffit à déclencher).
const CONSOLIDATE_BYTES: i64 = 512 * 1024;

/// Rooms dont une consolidation est déjà en cours : évite les consolidations
/// concurrentes (course read/delete) et l'empilement de tâches sur une même room.
static CONSOLIDATING: OnceLock<Mutex<HashSet<String>>> = OnceLock::new();
fn consolidating() -> &'static Mutex<HashSet<String>> {
    CONSOLIDATING.get_or_init(|| Mutex::new(HashSet::new()))
}

// ── Fusion Yjs avec ramasse-miettes (GC) ──────────────────────────────────────

/// Applique un blob d'updates Yjs potentiellement CONCATÉNÉ (format hérité où le
/// core empilait les updates par simple concaténation binaire). On boucle un
/// décodeur streaming jusqu'à épuisement du buffer ; un update tronqué/illisible
/// arrête proprement le traitement de ce blob sans paniquer.
fn apply_concat(doc: &Doc, blob: &[u8]) {
    if blob.is_empty() {
        return;
    }
    let mut dec = DecoderV1::new(Cursor::new(blob));
    // Boucle jusqu'à la fin du buffer ; un update tronqué/corrompu rompt proprement.
    while let Ok(update) = Update::decode(&mut dec) {
        if doc.transact_mut().apply_update(update).is_err() {
            break;
        }
    }
}

/// Fusionne un snapshot + une liste d'updates en un seul état Yjs **compact** :
/// le `Doc` yrs a le GC activé par défaut, donc les contenus supprimés/remplacés
/// (anciennes images, tombstones) ET les dumps d'état redondants (re-`encodeState`
/// envoyés à chaque reconnexion client) sont éliminés. Fonction CPU pure, sans I/O.
fn merge_gc(snapshot: Option<Vec<u8>>, updates: Vec<Vec<u8>>) -> Vec<u8> {
    let doc = Doc::new(); // GC activé (skip_gc = false par défaut)
    if let Some(s) = snapshot {
        apply_concat(&doc, &s);
    }
    for u in &updates {
        apply_concat(&doc, u);
    }
    let txn = doc.transact();
    txn.encode_state_as_update_v1(&StateVector::default())
}

// ── Persistance (snapshot consolidé + journal d'updates) ──────────────────────

pub struct CollabStore;

impl CollabStore {
    /// État Yjs d'une room : snapshot consolidé puis updates incrémentaux.
    pub async fn load(db: &sqlx::PgPool, room: &str) -> Result<Vec<Vec<u8>>, sqlx::Error> {
        let mut parts: Vec<Vec<u8>> = Vec::new();
        let snap: Option<(Vec<u8>,)> =
            sqlx::query_as("SELECT snapshot FROM core.collab_snapshots WHERE room = $1")
                .bind(room)
                .fetch_optional(db)
                .await?;
        if let Some((s,)) = snap {
            if !s.is_empty() {
                parts.push(s);
            }
        }
        let updates: Vec<(Vec<u8>,)> = sqlx::query_as(
            "SELECT update_data FROM core.collab_updates WHERE room = $1 ORDER BY created_at ASC",
        )
        .bind(room)
        .fetch_all(db)
        .await?;
        parts.extend(updates.into_iter().map(|(d,)| d));
        Ok(parts)
    }

    /// Persiste un update incrémental ; déclenche une consolidation en arrière-plan
    /// au-delà du seuil (nombre OU taille cumulée du journal). La sauvegarde reste
    /// rapide : le travail CPU de fusion n'est jamais sur le chemin chaud.
    pub async fn save(db: &sqlx::PgPool, room: &str, data: &[u8], origin: Uuid) -> Result<(), sqlx::Error> {
        sqlx::query("INSERT INTO core.collab_updates (room, update_data, origin) VALUES ($1, $2, $3)")
            .bind(room)
            .bind(data)
            .bind(origin)
            .execute(db)
            .await?;
        let (count, bytes): (i64, i64) = sqlx::query_as(
            "SELECT COUNT(*), COALESCE(SUM(octet_length(update_data)), 0)::bigint \
             FROM core.collab_updates WHERE room = $1",
        )
        .bind(room)
        .fetch_one(db)
        .await?;
        if count >= CONSOLIDATE_THRESHOLD || bytes >= CONSOLIDATE_BYTES {
            Self::spawn_consolidate(db.clone(), room.to_string());
        }
        Ok(())
    }

    /// Lance une consolidation en arrière-plan, au plus une par room à la fois.
    fn spawn_consolidate(db: sqlx::PgPool, room: String) {
        tokio::spawn(async move {
            {
                let mut set = consolidating().lock().await;
                if !set.insert(room.clone()) {
                    return; // déjà en cours pour cette room
                }
            }
            if let Err(e) = Self::consolidate(&db, &room, false).await {
                tracing::error!(error = %e, room = %room, "collab: consolidation");
            }
            consolidating().lock().await.remove(&room);
        });
    }

    /// Fusionne snapshot + updates via un `Y.Doc` (yrs) avec GC : produit un snapshot
    /// compact (contenus supprimés et dumps d'état redondants éliminés), puis purge
    /// les updates consolidés. La suppression est limitée aux `id` réellement lus :
    /// un update arrivé pendant la fusion survit (appliqué à la prochaine passe).
    ///
    /// `force = true` recompacte même sans nouvel update — utilisé pour migrer les
    /// anciens snapshots concaténés (qui n'ont pas de journal en attente).
    pub async fn consolidate(db: &sqlx::PgPool, room: &str, force: bool) -> Result<(), sqlx::Error> {
        let rows: Vec<(Uuid, Vec<u8>)> = sqlx::query_as(
            "SELECT id, update_data FROM core.collab_updates WHERE room = $1 ORDER BY created_at ASC",
        )
        .bind(room)
        .fetch_all(db)
        .await?;
        if rows.is_empty() && !force {
            return Ok(());
        }

        let snap: Option<(Vec<u8>,)> =
            sqlx::query_as("SELECT snapshot FROM core.collab_snapshots WHERE room = $1")
                .bind(room)
                .fetch_optional(db)
                .await?;
        let snap_bytes = snap.map(|(s,)| s);
        let had_snapshot = snap_bytes.is_some();
        let prev_len = snap_bytes.as_ref().map(Vec::len).unwrap_or(0);

        let ids: Vec<Uuid> = rows.iter().map(|(id, _)| *id).collect();
        let update_data: Vec<Vec<u8>> = rows.into_iter().map(|(_, d)| d).collect();

        // Décodage/ré-encodage Yjs : travail CPU isolé du runtime async.
        let merged = tokio::task::spawn_blocking(move || merge_gc(snap_bytes, update_data))
            .await
            .map_err(|e| sqlx::Error::Protocol(format!("consolidation interrompue: {e}")))?;

        // Rien à écrire / rien à gagner : pas de nouvel update et snapshot déjà compact.
        if ids.is_empty() && (!had_snapshot || merged.len() >= prev_len) {
            return Ok(());
        }

        let mut tx = db.begin().await?;
        sqlx::query(
            "INSERT INTO core.collab_snapshots (room, snapshot, updated_at) VALUES ($1, $2, NOW())
             ON CONFLICT (room) DO UPDATE SET snapshot = EXCLUDED.snapshot, updated_at = NOW()",
        )
        .bind(room)
        .bind(&merged)
        .execute(&mut *tx)
        .await?;
        if !ids.is_empty() {
            sqlx::query("DELETE FROM core.collab_updates WHERE room = $1 AND id = ANY($2)")
                .bind(room)
                .bind(&ids)
                .execute(&mut *tx)
                .await?;
        }
        tx.commit().await?;

        if prev_len > 0 && merged.len() < prev_len {
            tracing::info!(
                room = %room,
                avant_octets = prev_len,
                apres_octets = merged.len(),
                updates = ids.len(),
                "collab: snapshot recompacté (GC)"
            );
        }
        Ok(())
    }
}

/// Migration unique au démarrage : recompacte (GC) tous les snapshots collab
/// existants pour éliminer le bloat hérité de l'ancienne concaténation (dumps
/// d'état redondants, contenus supprimés jamais ramassés). Séquentiel — un seul
/// `Y.Doc` en mémoire à la fois — et idempotent (réexécutable sans dommage).
pub async fn recompact_all(db: sqlx::PgPool) {
    let rooms: Vec<(String,)> = match sqlx::query_as(
        "SELECT room FROM core.collab_snapshots \
         UNION SELECT DISTINCT room FROM core.collab_updates",
    )
    .fetch_all(&db)
    .await
    {
        Ok(r) => r,
        Err(e) => {
            tracing::error!(error = %e, "collab: recompactage (liste des rooms)");
            return;
        }
    };
    if rooms.is_empty() {
        return;
    }
    tracing::info!(rooms = rooms.len(), "collab: recompactage GC des snapshots au démarrage…");
    for (room,) in rooms {
        {
            let mut set = consolidating().lock().await;
            if !set.insert(room.clone()) {
                continue;
            }
        }
        if let Err(e) = CollabStore::consolidate(&db, &room, true).await {
            tracing::error!(error = %e, room = %room, "collab: recompactage");
        }
        consolidating().lock().await.remove(&room);
    }
    tracing::info!("collab: recompactage GC terminé");
}

// ── Hub de diffusion (room → abonnés) ─────────────────────────────────────────

/// Trame relayée : update Yjs binaire ou message d'awareness texte (curseurs).
#[derive(Clone)]
enum Frame {
    Bin(Vec<u8>),
    Txt(String),
}

#[derive(Clone)]
struct CollabHub {
    rooms: Arc<RwLock<HashMap<String, broadcast::Sender<Frame>>>>,
}

impl CollabHub {
    fn new() -> Self {
        CollabHub { rooms: Arc::new(RwLock::new(HashMap::new())) }
    }
    async fn subscribe(&self, room: &str) -> broadcast::Receiver<Frame> {
        {
            let r = self.rooms.read().await;
            if let Some(tx) = r.get(room) {
                return tx.subscribe();
            }
        }
        let mut w = self.rooms.write().await;
        let tx = w.entry(room.to_string()).or_insert_with(|| broadcast::channel(512).0);
        tx.subscribe()
    }
    async fn broadcast(&self, room: &str, frame: Frame) {
        let r = self.rooms.read().await;
        if let Some(tx) = r.get(room) {
            let _ = tx.send(frame);
        }
    }
}

static HUB: OnceLock<CollabHub> = OnceLock::new();
fn hub() -> &'static CollabHub {
    HUB.get_or_init(CollabHub::new)
}

// ── Handler WebSocket ─────────────────────────────────────────────────────────

#[derive(Deserialize)]
pub struct CollabQuery {
    pub token: String,
}

pub async fn collab_handler(
    State(state): State<AppState>,
    Path(room): Path<String>,
    Query(query): Query<CollabQuery>,
    ws: WebSocketUpgrade,
) -> Result<impl IntoResponse, AppError> {
    let jwt = JwtService::new(
        state.settings.auth.jwt_secret.clone(),
        state.settings.auth.access_token_ttl,
    );
    let claims = jwt.validate_access_token(&query.token)?;
    let user_id = claims.sub;

    // ACL générique : le module propriétaire de la room peut refuser l'accès.
    if !authorize_room(&state, &room, user_id).await {
        return Err(AppError::Forbidden);
    }

    Ok(ws.on_upgrade(move |socket| handle(socket, state, room, user_id)))
}

/// Demande au module propriétaire d'une room s'il autorise `user_id` à la rejoindre.
///
/// La room est de la forme `<module_id>-<entité>:<uuid>` ou `<module_id>:<uuid>`.
/// On résout le module via le registry (préfixe le plus long), puis on appelle son
/// endpoint interne `POST /internal/collab/authorize`. **Fail-open** : seul un `403`
/// explicite refuse l'accès ; un module sans ce endpoint (404), une erreur réseau
/// ou un module inconnu laissent passer (rétro-compatibilité, robustesse).
async fn authorize_room(state: &AppState, room: &str, user_id: Uuid) -> bool {
    // Résolution du module propriétaire (id le plus long qui préfixe la room).
    let base_url = {
        let registry = state.modules.read().await;
        let mut best: Option<(usize, String)> = None;
        for inst in registry.all() {
            let id = &inst.module_id;
            let matches = room == id
                || room.starts_with(&format!("{id}-"))
                || room.starts_with(&format!("{id}:"));
            if matches && best.as_ref().map(|(len, _)| id.len() > *len).unwrap_or(true) {
                best = Some((id.len(), inst.base_url.trim_end_matches('/').to_owned()));
            }
        }
        match best {
            Some((_, url)) => url,
            None => return true, // aucun module → room interne au core, on laisse passer
        }
    };

    let url = format!("{base_url}/internal/collab/authorize");
    let client = reqwest::Client::new();
    let resp = client
        .post(&url)
        .header("X-Internal-Secret", &state.settings.server.internal_secret)
        .json(&serde_json::json!({ "room": room, "user_id": user_id }))
        .timeout(std::time::Duration::from_secs(3))
        .send()
        .await;

    match resp {
        Ok(r) if r.status() == reqwest::StatusCode::FORBIDDEN => {
            tracing::info!(room = %room, %user_id, "collab: accès refusé par le module");
            false
        }
        Ok(_) => true,
        Err(e) => {
            tracing::warn!(error = %e, room = %room, "collab: autorisation injoignable (fail-open)");
            true
        }
    }
}

async fn handle(socket: WebSocket, state: AppState, room: String, user_id: Uuid) {
    let mut rx = hub().subscribe(&room).await;
    let (mut sender, mut receiver) = socket.split();

    // Sync initiale : snapshot + updates persistés. On annonce d'abord si la salle
    // est VIDE (aucun état) → le client sait alors qu'il peut « seed » le Y.Doc
    // depuis le contenu JSON existant (sans risque de duplication entre clients).
    match CollabStore::load(&state.db, &room).await {
        Ok(parts) => {
            let empty = parts.is_empty();
            let init = format!("{{\"type\":\"sync\",\"empty\":{empty}}}");
            if sender.send(Message::Text(init.into())).await.is_err() { return; }
            for part in parts {
                if sender.send(Message::Binary(part.into())).await.is_err() {
                    return;
                }
            }
        }
        Err(e) => {
            tracing::error!(error = %e, room = %room, "collab: chargement");
            return;
        }
    }

    loop {
        tokio::select! {
            msg = receiver.next() => {
                match msg {
                    Some(Ok(Message::Binary(data))) => {
                        let data = data.to_vec();
                        if let Err(e) = CollabStore::save(&state.db, &room, &data, user_id).await {
                            tracing::error!(error = %e, room = %room, "collab: save");
                        }
                        hub().broadcast(&room, Frame::Bin(data)).await;
                    }
                    Some(Ok(Message::Text(txt))) => {
                        // Awareness (curseurs/présence) : relais tel quel, non persisté.
                        hub().broadcast(&room, Frame::Txt(txt.to_string())).await;
                    }
                    Some(Ok(Message::Close(_))) | None => break,
                    Some(Ok(_)) => {}
                    Some(Err(_)) => break,
                }
            }
            Ok(frame) = rx.recv() => {
                let out = match frame {
                    Frame::Bin(d) => Message::Binary(d.into()),
                    Frame::Txt(t) => Message::Text(t.into()),
                };
                if sender.send(out).await.is_err() {
                    break;
                }
            }
        }
    }
}
