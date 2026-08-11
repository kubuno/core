//! Buildings and resources: the part of the directory that is not people.
//!
//! ## What problem this solves
//!
//! An organisation shares places and objects — meeting rooms, a projector on a
//! trolley, two service bicycles. Until they exist somewhere, each is booked by
//! message, nobody can list what exists, and two meetings land in the same room.
//! This is the inventory that turns "the room upstairs" into something a
//! calendar can offer, a sign can display and a report can count.
//!
//! ## Why the core owns it
//!
//! Because it is directory data, of the same nature as accounts, groups and
//! organisational units: a description of the organisation rather than of one
//! usage. Several modules consume it and none owns it; housing it in the first
//! module that needed it would make every other one depend on that module, which
//! the architecture forbids. The core publishes it read-only on
//! `/internal/directory/resources` and names no module anywhere — a caller
//! proves itself with the internal secret, and that is all the core knows.
//!
//! ## The generated name
//!
//! A resource carries two names. `name` is what an administrator types ("Amphi",
//! "Vélo 2"); `generated_name` is what everybody else reads, and it is composed
//! by the server from the structured fields:
//!
//! ```text
//!   room  : <building>-<floor>[-<section>] <name> (<capacity>) <features…>
//!   other : <type>-<building>-<floor>[-<section>]-<name> (<capacity>) <features…>
//! ```
//!
//! It is never typed and never accepted from a request body. It is *stored*
//! rather than recomputed on read so that sorting, searching and exporting all
//! operate on exactly the string that is displayed — and it is rewritten by
//! [`refresh_names`] on every write that could change it: the resource itself,
//! its building's key, one of its floors' names, or the name of a feature it
//! carries. A derived value that is only refreshed when its *own* row is touched
//! is a value that silently becomes a lie the first time something upstream is
//! renamed.
//!
//! ## Two privileges
//!
//! [`keys::RESOURCES_READ`] opens the page and answers the internal endpoint;
//! [`keys::RESOURCES_MANAGE`] writes. Reading where a room is and how many seats
//! it has is what a delegated operator or a module needs; changing it alters
//! what the whole organisation sees the next time they book something.

use axum::{
    extract::{Path, Query, State},
    Json,
};
use serde::Deserialize;
use serde_json::{json, Value};
use sqlx::{PgConnection, Row as _};
use uuid::Uuid;

use crate::{
    audit::{redact::target, AdminAudit, AuditEntry},
    auth::middleware::{AdminUser, InternalRequest},
    authz::{keys, AdminCtx},
    errors::AppError,
    state::AppState,
};

// ── Limits ───────────────────────────────────────────────────────────────────
//
// Every one of these is also a column width. They are restated here so that an
// over-long value is refused with a sentence an administrator can act on, rather
// than by the database with a `value too long for type character varying(45)`
// that names no field.
//
// `chars()` is compared, never `len()`: these are label lengths, and a byte
// count would reject a French name of forty-five accented characters.

const MAX_BUILDING_KEY:  usize = 100;
const MAX_BUILDING_NAME: usize = 100;
const MAX_ADDRESS:       usize = 500;
const MAX_ADMIN_NOTE:    usize = 256;
const MAX_FEATURE_NAME:  usize = 60;
const MAX_RESOURCE_NAME: usize = 45;
const MAX_FLOOR:         usize = 15;
const MAX_SECTION:       usize = 15;
const MAX_USER_NOTE:     usize = 1000;
/// A building with more floors than this is a data-entry accident, not a tower:
/// the list is edited as one ordered field and stops being readable long before.
const MAX_FLOORS:        usize = 200;
/// Seats. The ceiling exists only to catch a typed extra digit — a room for
/// 50 000 is somebody who meant 5 000, and the number is offered as a filter.
const MAX_CAPACITY:      i32   = 100_000;

/// The two categories. A closed vocabulary, mirrored by a `CHECK` on the column:
/// the shape of the generated name depends on it, so a third value invented by a
/// future route would produce a name nothing knows how to read.
const CATEGORY_ROOM:  &str = "meeting_room";
const CATEGORY_OTHER: &str = "other";

// ── Text hygiene ─────────────────────────────────────────────────────────────

/// Trimmed, interior whitespace collapsed.
///
/// Applied to every label before it is compared or stored: `"Salle  Bleue"` and
/// `"Salle Bleue"` must not coexist in the list where they matter, and the
/// generated name is built by joining these with separators that a stray double
/// space would make unreadable.
fn clean(raw: &str) -> String {
    raw.split_whitespace().collect::<Vec<_>>().join(" ")
}

/// `clean`, then `None` for what is left empty — an optional field that arrived
/// as `""` must be stored as absent, not as a blank string that renders as a
/// mysterious empty line.
fn clean_opt(raw: Option<&str>) -> Option<String> {
    raw.map(clean).filter(|s| !s.is_empty())
}

/// One length check, with the field named in the message.
fn max_len(value: &str, limit: usize, field: &str) -> Result<(), AppError> {
    if value.chars().count() > limit {
        return Err(AppError::Validation(format!(
            "{field} ne peut pas dépasser {limit} caractères."
        )));
    }
    Ok(())
}

// ── The generated name ───────────────────────────────────────────────────────

/// Composes the name everybody except an administrator reads.
///
/// A pure function of the structured fields, deliberately: it is the single
/// definition of the format, it is called from every write path, and it is the
/// only part of this file that can be tested without a database.
///
/// `resource_type` doubles as the category discriminator — it is `Some` exactly
/// when the resource is not a room (the column carries a `CHECK` saying so). A
/// room has no type because it *is* the type, and its head segment is separated
/// from the name by a space rather than a hyphen, which is what makes
/// `SIEGE-2 Amphi (40)` read as "second floor of SIEGE, room Amphi" rather than
/// as one long identifier.
///
/// `features` is expected already ordered; the caller reads it sorted so that
/// two resources with the same equipment produce the same suffix.
fn generated_name(
    building_key: &str,
    floor: &str,
    section: Option<&str>,
    name: &str,
    capacity: i32,
    resource_type: Option<&str>,
    features: &[String],
) -> String {
    let mut head: Vec<&str> = Vec::with_capacity(4);
    if let Some(t) = resource_type {
        head.push(t);
    }
    head.push(building_key);
    head.push(floor);
    if let Some(s) = section {
        head.push(s);
    }
    let head = head.join("-");

    // Hyphen for a non-room (its head already starts with the type, so the whole
    // thing is one hyphenated identifier), space for a room.
    let stem = if resource_type.is_some() {
        format!("{head}-{name}")
    } else {
        format!("{head} {name}")
    };

    let mut out = format!("{stem} ({capacity})");
    if !features.is_empty() {
        out.push(' ');
        out.push_str(&features.join(" "));
    }
    out
}

/// Rewrites `generated_name` for the given resources, inside the caller's
/// transaction.
///
/// Takes explicit ids rather than a predicate so that it also works *after* the
/// rows that would have matched are gone — deleting a feature cascades its links
/// away, so the resources to refresh have to be collected before the delete and
/// passed in here.
async fn refresh_names(db: &mut PgConnection, ids: &[Uuid]) -> Result<(), AppError> {
    if ids.is_empty() {
        return Ok(());
    }

    let rows = sqlx::query(
        r#"
        SELECT r.id,
               b.building_key,
               r.floor_name,
               r.floor_section,
               r.name,
               r.capacity,
               r.resource_type,
               COALESCE(ARRAY(
                   SELECT f.name
                     FROM core.resource_feature_links l
                     JOIN core.resource_features f ON f.id = l.feature_id
                    WHERE l.resource_id = r.id
                    ORDER BY LOWER(f.name)
               ), '{}') AS features
          FROM core.resources r
          JOIN core.buildings b ON b.id = r.building_id
         WHERE r.id = ANY($1)
        "#,
    )
    .bind(ids)
    .fetch_all(&mut *db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, "ressources: lecture avant recalcul des noms");
        AppError::Database(e)
    })?;

    for r in &rows {
        let name = generated_name(
            r.get::<String, _>("building_key").as_str(),
            r.get::<String, _>("floor_name").as_str(),
            r.get::<Option<String>, _>("floor_section").as_deref(),
            r.get::<String, _>("name").as_str(),
            r.get::<i32, _>("capacity"),
            r.get::<Option<String>, _>("resource_type").as_deref(),
            &r.get::<Vec<String>, _>("features"),
        );
        sqlx::query("UPDATE core.resources SET generated_name = $1 WHERE id = $2")
            .bind(&name)
            .bind(r.get::<Uuid, _>("id"))
            .execute(&mut *db)
            .await
            .map_err(|e| {
                tracing::error!(error = %e, "ressources: écriture du nom généré");
                AppError::Database(e)
            })?;
    }
    Ok(())
}

/// Ids of every resource in a building — what a change to the building's key or
/// to one of its floors invalidates.
async fn resources_of_building(
    db: &mut PgConnection,
    building_id: Uuid,
) -> Result<Vec<Uuid>, AppError> {
    sqlx::query_scalar("SELECT id FROM core.resources WHERE building_id = $1")
        .bind(building_id)
        .fetch_all(&mut *db)
        .await
        .map_err(|e| {
            tracing::error!(error = %e, "ressources: inventaire d'un bâtiment");
            AppError::Database(e)
        })
}

/// Ids of every resource carrying a feature — what renaming or removing that
/// feature invalidates.
async fn resources_with_feature(
    db: &mut PgConnection,
    feature_id: Uuid,
) -> Result<Vec<Uuid>, AppError> {
    sqlx::query_scalar("SELECT resource_id FROM core.resource_feature_links WHERE feature_id = $1")
        .bind(feature_id)
        .fetch_all(&mut *db)
        .await
        .map_err(|e| {
            tracing::error!(error = %e, "ressources: porteurs d'une fonctionnalité");
            AppError::Database(e)
        })
}

/// Turns the constraint violations this schema can produce into the sentence the
/// administrator needs, and logs anything else before it becomes a 500.
fn write_error(e: sqlx::Error, context: &'static str) -> AppError {
    let s = e.to_string();
    if s.contains("idx_core_buildings_key") {
        return AppError::Conflict("Un bâtiment porte déjà cet identifiant.".into());
    }
    if s.contains("idx_core_features_name") {
        return AppError::Conflict("Une fonctionnalité porte déjà ce nom.".into());
    }
    if s.contains("idx_core_resources_name") {
        return AppError::Conflict(
            "Une ressource porte déjà ce nom à cet étage de ce bâtiment.".into(),
        );
    }
    if s.contains("resources_floor_in_building") {
        return AppError::Validation(
            "Cet étage n'existe pas dans le bâtiment choisi. Ajoutez-le d'abord à la fiche du bâtiment.".into(),
        );
    }
    if s.contains("resources_type_iff_other") {
        return AppError::Validation(
            "Le type ne se renseigne que pour une ressource qui n'est pas une salle, et il y est obligatoire.".into(),
        );
    }
    if s.contains("buildings_coordinates_pair") {
        return AppError::Validation(
            "Latitude et longitude vont ensemble : renseignez les deux, ou aucune.".into(),
        );
    }
    tracing::error!(error = %e, context, "ressources: écriture");
    AppError::Database(e)
}

// ── Buildings ────────────────────────────────────────────────────────────────

#[derive(Debug, Deserialize)]
pub struct BuildingDto {
    pub building_key: String,
    #[serde(default)]
    pub name: Option<String>,
    pub address: String,
    #[serde(default)]
    pub description: Option<String>,
    #[serde(default)]
    pub latitude: Option<f64>,
    #[serde(default)]
    pub longitude: Option<f64>,
    /// In display order, lowest first. The order is data, not a computation:
    /// nothing sorts "Accueil" before "5A" on its own.
    #[serde(default)]
    pub floors: Vec<String>,
}

/// What a validated building looks like once the strings are clean.
struct CleanBuilding {
    key:         String,
    name:        Option<String>,
    address:     String,
    description: Option<String>,
    latitude:    Option<f64>,
    longitude:   Option<f64>,
    floors:      Vec<String>,
}

fn validate_building(dto: &BuildingDto) -> Result<CleanBuilding, AppError> {
    let key = clean(&dto.building_key);
    if key.is_empty() {
        return Err(AppError::Validation(
            "L'identifiant du bâtiment est obligatoire : c'est lui qui apparaît dans le nom des ressources.".into(),
        ));
    }
    max_len(&key, MAX_BUILDING_KEY, "L'identifiant du bâtiment")?;
    // Same alphabet as the column's CHECK. Refused here so the message can say
    // *why*: the key is followed by a hyphen and a floor inside the generated
    // name, and a space there would make that name ambiguous exactly where it is
    // used to tell two rooms apart.
    if !key
        .chars()
        .all(|c| c.is_ascii_alphanumeric() || c == '.' || c == '_' || c == '-')
    {
        return Err(AppError::Validation(
            "L'identifiant du bâtiment n'accepte que des lettres non accentuées, des chiffres, un point, un tiret ou un tiret bas — il compose le nom des ressources.".into(),
        ));
    }

    let name = clean_opt(dto.name.as_deref());
    if let Some(n) = &name {
        max_len(n, MAX_BUILDING_NAME, "Le nom du bâtiment")?;
    }

    let address = clean(&dto.address);
    if address.is_empty() {
        return Err(AppError::Validation(
            "L'adresse est obligatoire : c'est la seule question que se pose quelqu'un qui a rendez-vous là-bas.".into(),
        ));
    }
    max_len(&address, MAX_ADDRESS, "L'adresse")?;

    let description = clean_opt(dto.description.as_deref());
    if let Some(d) = &description {
        max_len(d, MAX_ADMIN_NOTE, "La description")?;
    }

    match (dto.latitude, dto.longitude) {
        (Some(la), Some(lo)) => {
            if !(-90.0..=90.0).contains(&la) || !(-180.0..=180.0).contains(&lo) {
                return Err(AppError::Validation(
                    "Coordonnées hors limites : latitude entre -90 et 90, longitude entre -180 et 180.".into(),
                ));
            }
        }
        (None, None) => {}
        // A latitude alone places nothing on a map and would travel on as a
        // valid coordinate.
        _ => {
            return Err(AppError::Validation(
                "Latitude et longitude vont ensemble : renseignez les deux, ou aucune.".into(),
            ))
        }
    }

    let mut floors = Vec::with_capacity(dto.floors.len());
    for raw in &dto.floors {
        let f = clean(raw);
        if f.is_empty() {
            continue;
        }
        max_len(&f, MAX_FLOOR, "Un nom d'étage")?;
        // Case-insensitive, because the unique index is: two floors that read
        // the same must not both exist, or a resource's floor would be ambiguous.
        if floors
            .iter()
            .any(|e: &String| e.to_lowercase() == f.to_lowercase())
        {
            return Err(AppError::Validation(format!(
                "L'étage « {f} » figure deux fois."
            )));
        }
        floors.push(f);
    }
    if floors.is_empty() {
        return Err(AppError::Validation(
            "Un bâtiment doit avoir au moins un étage : c'est ce qui permet de dire où se trouve une ressource.".into(),
        ));
    }
    if floors.len() > MAX_FLOORS {
        return Err(AppError::Validation(format!(
            "Au plus {MAX_FLOORS} étages par bâtiment."
        )));
    }

    Ok(CleanBuilding {
        key,
        name,
        address,
        description,
        latitude: dto.latitude,
        longitude: dto.longitude,
        floors,
    })
}

/// Replaces a building's floor list, in order.
///
/// Written as "insert the wanted ones, then delete what is no longer wanted"
/// rather than "delete everything, then reinsert": a floor that is kept must
/// never cease to exist mid-transaction, because resources point at it through a
/// composite foreign key, and the delete would refuse a change that is in fact
/// legal — a reorder, or an added floor.
///
/// The list is a **set of names**: a floor has no identity of its own here, so
/// "rename 5A to 5B" is indistinguishable from "remove 5A, add 5B" and is
/// refused while 5A still holds resources. That is the correct outcome rather
/// than a limitation to work around — following a rename without an identity
/// would mean guessing, and guessing wrong would move rooms between floors
/// without saying so. Reordering and adding are unaffected.
async fn write_floors(
    db: &mut PgConnection,
    building_id: Uuid,
    floors: &[String],
) -> Result<(), AppError> {
    for (rank, name) in floors.iter().enumerate() {
        sqlx::query(
            "INSERT INTO core.building_floors (building_id, name, position)
             VALUES ($1, $2, $3)
             ON CONFLICT (building_id, name) DO UPDATE SET position = EXCLUDED.position",
        )
        .bind(building_id)
        .bind(name)
        // Written negative-then-fixed would be simpler, but the unique index on
        // (building_id, position) is checked per statement, so a straight
        // renumbering can collide with a rank not yet moved. Ranks are therefore
        // parked above the existing ones first, and compacted below.
        .bind(rank as i16 + MAX_FLOORS as i16)
        .execute(&mut *db)
        .await
        .map_err(|e| write_error(e, "write_floors"))?;
    }

    sqlx::query("DELETE FROM core.building_floors WHERE building_id = $1 AND name <> ALL($2)")
        .bind(building_id)
        .bind(floors)
        .execute(&mut *db)
        .await
        .map_err(|e| {
            if e.to_string().contains("resources_floor_in_building") {
                AppError::Validation(
                    "Un étage retiré porte encore des ressources. Déplacez-les ou supprimez-les d'abord.".into(),
                )
            } else {
                tracing::error!(error = %e, "bâtiments: retrait d'étages");
                AppError::Database(e)
            }
        })?;

    sqlx::query(
        "UPDATE core.building_floors SET position = position - $2 WHERE building_id = $1",
    )
    .bind(building_id)
    .bind(MAX_FLOORS as i16)
    .execute(&mut *db)
    .await
    .map_err(|e| write_error(e, "compact_floors"))?;

    Ok(())
}

fn building_json(r: &sqlx::postgres::PgRow) -> Value {
    json!({
        "id":            r.get::<Uuid, _>("id"),
        "building_key":  r.get::<String, _>("building_key"),
        "name":          r.get::<Option<String>, _>("name"),
        "address":       r.get::<String, _>("address"),
        "description":   r.get::<Option<String>, _>("description"),
        "latitude":      r.get::<Option<f64>, _>("latitude"),
        "longitude":     r.get::<Option<f64>, _>("longitude"),
        "floors":        r.get::<Vec<String>, _>("floors"),
        "resource_count": r.get::<i64, _>("resource_count"),
    })
}

/// The one query every building listing uses. `$1` is an optional id filter, so
/// the read after a write returns exactly the same shape as the list.
const BUILDINGS_SELECT: &str = r#"
    SELECT b.id, b.building_key, b.name, b.address, b.description,
           b.latitude::float8  AS latitude,
           b.longitude::float8 AS longitude,
           COALESCE(ARRAY(
               SELECT f.name FROM core.building_floors f
                WHERE f.building_id = b.id ORDER BY f.position
           ), '{}') AS floors,
           (SELECT COUNT(*) FROM core.resources r WHERE r.building_id = b.id)::bigint
               AS resource_count
      FROM core.buildings b
     WHERE ($1::uuid IS NULL OR b.id = $1)
     ORDER BY LOWER(b.building_key)
"#;

/// `GET /admin/buildings`
pub async fn list_buildings(
    State(state): State<AppState>,
    _admin: AdminUser,
    ctx: AdminCtx,
) -> Result<Json<Value>, AppError> {
    ctx.require(keys::RESOURCES_READ)?;

    let rows = sqlx::query(BUILDINGS_SELECT)
        .bind(Option::<Uuid>::None)
        .fetch_all(&state.db)
        .await
        .map_err(|e| {
            tracing::error!(error = %e, "bâtiments: liste");
            AppError::Database(e)
        })?;

    Ok(Json(json!({
        "buildings": rows.iter().map(building_json).collect::<Vec<_>>(),
        "limits": { "floors": MAX_FLOORS, "floor_name": MAX_FLOOR },
    })))
}

/// `POST /admin/buildings`
pub async fn create_building(
    State(state): State<AppState>,
    audit: AdminAudit,
    ctx: AdminCtx,
    Json(dto): Json<BuildingDto>,
) -> Result<Json<Value>, AppError> {
    ctx.require(keys::RESOURCES_MANAGE)?;
    let b = validate_building(&dto)?;

    let mut tx = audit.begin(&state.db).await?;

    // A refused creation has no row to point at: the target is the collection,
    // labelled with the key that was attempted.
    let refuse = || AuditEntry::new("core.buildings.create").target_kind(target::BUILDING, &b.key);

    let inserted = sqlx::query_scalar::<_, Uuid>(
        "INSERT INTO core.buildings
             (building_key, name, address, description, latitude, longitude, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id",
    )
    .bind(&b.key)
    .bind(&b.name)
    .bind(&b.address)
    .bind(&b.description)
    .bind(b.latitude)
    .bind(b.longitude)
    .bind(audit.admin.id)
    .fetch_one(&mut *tx)
    .await;

    let id = match inserted {
        Ok(id) => id,
        Err(e) => return Err(tx.abort(&state.db, refuse(), write_error(e, "create_building")).await),
    };

    if let Err(e) = write_floors(&mut tx, id, &b.floors).await {
        return Err(tx.abort(&state.db, refuse(), e).await);
    }

    let after = json!({
        "id": id, "building_key": b.key, "name": b.name, "address": b.address,
        "description": b.description, "latitude": b.latitude, "longitude": b.longitude,
        "floors": b.floors,
    });

    tx.commit(
        AuditEntry::new("core.buildings.create")
            .target(target::BUILDING, id, b.key.clone())
            .after(after)
            .reversible(),
    )
    .await?;

    Ok(Json(json!({ "id": id })))
}

/// `PATCH /admin/buildings/:id`
///
/// A full replacement of the editable fields, floors included. The floor list is
/// an ordered whole — "add one" has no answer to "where?" — so it is sent
/// entire, exactly as the form shows it.
pub async fn update_building(
    State(state): State<AppState>,
    audit: AdminAudit,
    ctx: AdminCtx,
    Path(id): Path<Uuid>,
    Json(dto): Json<BuildingDto>,
) -> Result<Json<Value>, AppError> {
    ctx.require(keys::RESOURCES_MANAGE)?;
    let b = validate_building(&dto)?;

    let mut tx = audit.begin(&state.db).await?;

    let before = sqlx::query(BUILDINGS_SELECT)
        .bind(Some(id))
        .fetch_optional(&mut *tx)
        .await
        .map_err(|e| {
            tracing::error!(error = %e, "bâtiments: lecture avant modification");
            AppError::Database(e)
        })?
        .ok_or_else(|| AppError::NotFound("Bâtiment introuvable".into()))?;

    let before_json = building_json(&before);
    let refuse = || AuditEntry::new("core.buildings.update").target(target::BUILDING, id, b.key.clone());

    let updated = sqlx::query(
        "UPDATE core.buildings
            SET building_key = $1, name = $2, address = $3, description = $4,
                latitude = $5, longitude = $6
          WHERE id = $7",
    )
    .bind(&b.key)
    .bind(&b.name)
    .bind(&b.address)
    .bind(&b.description)
    .bind(b.latitude)
    .bind(b.longitude)
    .bind(id)
    .execute(&mut *tx)
    .await;

    if let Err(e) = updated {
        return Err(tx.abort(&state.db, refuse(), write_error(e, "update_building")).await);
    }

    if let Err(e) = write_floors(&mut tx, id, &b.floors).await {
        return Err(tx.abort(&state.db, refuse(), e).await);
    }

    // The key is inside every generated name of this building's resources, and
    // so is the floor. Both are recomputed for the whole building rather than
    // for what looks like it changed: comparing the old and new field values to
    // decide would be a second place where the format's dependencies are listed,
    // and the day one is added there it would be forgotten here.
    let affected = match resources_of_building(&mut tx, id).await {
        Ok(v) => v,
        Err(e) => return Err(tx.abort(&state.db, refuse(), e).await),
    };
    if let Err(e) = refresh_names(&mut tx, &affected).await {
        return Err(tx.abort(&state.db, refuse(), e).await);
    }

    tx.commit(
        AuditEntry::new("core.buildings.update")
            .target(target::BUILDING, id, b.key.clone())
            .before(before_json)
            .after(json!({
                "id": id, "building_key": b.key, "name": b.name, "address": b.address,
                "description": b.description, "latitude": b.latitude, "longitude": b.longitude,
                "floors": b.floors,
            }))
            .reversible(),
    )
    .await?;

    Ok(Json(json!({ "ok": true, "renamed_resources": affected.len() })))
}

/// `DELETE /admin/buildings/:id`
///
/// Refused while the building still holds resources. A cascade here would delete
/// rooms that appear in people's calendars, from a screen that says "delete
/// building" — the two acts are not the same and must not share one click.
pub async fn delete_building(
    State(state): State<AppState>,
    audit: AdminAudit,
    ctx: AdminCtx,
    Path(id): Path<Uuid>,
) -> Result<Json<Value>, AppError> {
    ctx.require(keys::RESOURCES_MANAGE)?;

    let mut tx = audit.begin(&state.db).await?;

    let row = sqlx::query(BUILDINGS_SELECT)
        .bind(Some(id))
        .fetch_optional(&mut *tx)
        .await
        .map_err(|e| {
            tracing::error!(error = %e, "bâtiments: lecture avant suppression");
            AppError::Database(e)
        })?
        .ok_or_else(|| AppError::NotFound("Bâtiment introuvable".into()))?;

    let key: String = row.get("building_key");
    let count: i64 = row.get("resource_count");
    let refuse = || AuditEntry::new("core.buildings.delete").target(target::BUILDING, id, key.clone());

    if count > 0 {
        return Err(tx
            .abort(
                &state.db,
                refuse(),
                AppError::Validation(format!(
                    "Ce bâtiment porte encore {count} ressource(s). Supprimez-les ou déplacez-les d'abord."
                )),
            )
            .await);
    }

    if let Err(e) = sqlx::query("DELETE FROM core.buildings WHERE id = $1")
        .bind(id)
        .execute(&mut *tx)
        .await
    {
        return Err(tx.abort(&state.db, refuse(), write_error(e, "delete_building")).await);
    }

    tx.commit(
        AuditEntry::new("core.buildings.delete")
            .target(target::BUILDING, id, key)
            .before(building_json(&row)),
    )
    .await?;

    Ok(Json(json!({ "ok": true })))
}

// ── Features ─────────────────────────────────────────────────────────────────

#[derive(Debug, Deserialize)]
pub struct FeatureDto {
    pub name: String,
    #[serde(default)]
    pub description: Option<String>,
}

fn validate_feature(dto: &FeatureDto) -> Result<(String, Option<String>), AppError> {
    let name = clean(&dto.name);
    if name.is_empty() {
        return Err(AppError::Validation(
            "Le nom de la fonctionnalité est obligatoire.".into(),
        ));
    }
    max_len(&name, MAX_FEATURE_NAME, "Le nom de la fonctionnalité")?;
    let description = clean_opt(dto.description.as_deref());
    if let Some(d) = &description {
        max_len(d, MAX_ADMIN_NOTE, "La description")?;
    }
    Ok((name, description))
}

/// `GET /admin/resource-features`
pub async fn list_features(
    State(state): State<AppState>,
    _admin: AdminUser,
    ctx: AdminCtx,
) -> Result<Json<Value>, AppError> {
    ctx.require(keys::RESOURCES_READ)?;

    let rows = sqlx::query(
        r#"SELECT f.id, f.name, f.description,
                  (SELECT COUNT(*) FROM core.resource_feature_links l
                    WHERE l.feature_id = f.id)::bigint AS resource_count
             FROM core.resource_features f
            ORDER BY LOWER(f.name)"#,
    )
    .fetch_all(&state.db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, "fonctionnalités: liste");
        AppError::Database(e)
    })?;

    let features: Vec<Value> = rows
        .iter()
        .map(|r| {
            json!({
                "id":             r.get::<Uuid, _>("id"),
                "name":           r.get::<String, _>("name"),
                "description":    r.get::<Option<String>, _>("description"),
                "resource_count": r.get::<i64, _>("resource_count"),
            })
        })
        .collect();

    Ok(Json(json!({ "features": features })))
}

/// `POST /admin/resource-features`
pub async fn create_feature(
    State(state): State<AppState>,
    audit: AdminAudit,
    ctx: AdminCtx,
    Json(dto): Json<FeatureDto>,
) -> Result<Json<Value>, AppError> {
    ctx.require(keys::RESOURCES_MANAGE)?;
    let (name, description) = validate_feature(&dto)?;

    let mut tx = audit.begin(&state.db).await?;
    let refuse =
        || AuditEntry::new("core.resource_features.create").target_kind(target::RESOURCE_FEATURE, &name);

    let inserted = sqlx::query_scalar::<_, Uuid>(
        "INSERT INTO core.resource_features (name, description, created_by)
         VALUES ($1, $2, $3) RETURNING id",
    )
    .bind(&name)
    .bind(&description)
    .bind(audit.admin.id)
    .fetch_one(&mut *tx)
    .await;

    let id = match inserted {
        Ok(id) => id,
        Err(e) => return Err(tx.abort(&state.db, refuse(), write_error(e, "create_feature")).await),
    };

    tx.commit(
        AuditEntry::new("core.resource_features.create")
            .target(target::RESOURCE_FEATURE, id, name.clone())
            .after(json!({ "id": id, "name": name, "description": description }))
            .reversible(),
    )
    .await?;

    Ok(Json(json!({ "id": id })))
}

/// `PATCH /admin/resource-features/:id`
///
/// Renaming one rewrites the generated name of every resource that carries it:
/// the feature's label is a suffix of those names, and leaving them alone would
/// make the console and the booking list disagree about the same room.
pub async fn update_feature(
    State(state): State<AppState>,
    audit: AdminAudit,
    ctx: AdminCtx,
    Path(id): Path<Uuid>,
    Json(dto): Json<FeatureDto>,
) -> Result<Json<Value>, AppError> {
    ctx.require(keys::RESOURCES_MANAGE)?;
    let (name, description) = validate_feature(&dto)?;

    let mut tx = audit.begin(&state.db).await?;

    let before = sqlx::query("SELECT name, description FROM core.resource_features WHERE id = $1")
        .bind(id)
        .fetch_optional(&mut *tx)
        .await
        .map_err(|e| {
            tracing::error!(error = %e, "fonctionnalités: lecture avant modification");
            AppError::Database(e)
        })?
        .ok_or_else(|| AppError::NotFound("Fonctionnalité introuvable".into()))?;

    let before_json = json!({
        "name":        before.get::<String, _>("name"),
        "description": before.get::<Option<String>, _>("description"),
    });
    let refuse =
        || AuditEntry::new("core.resource_features.update").target(target::RESOURCE_FEATURE, id, name.clone());

    if let Err(e) = sqlx::query(
        "UPDATE core.resource_features SET name = $1, description = $2 WHERE id = $3",
    )
    .bind(&name)
    .bind(&description)
    .bind(id)
    .execute(&mut *tx)
    .await
    {
        return Err(tx.abort(&state.db, refuse(), write_error(e, "update_feature")).await);
    }

    let affected = match resources_with_feature(&mut tx, id).await {
        Ok(v) => v,
        Err(e) => return Err(tx.abort(&state.db, refuse(), e).await),
    };
    if let Err(e) = refresh_names(&mut tx, &affected).await {
        return Err(tx.abort(&state.db, refuse(), e).await);
    }

    tx.commit(
        AuditEntry::new("core.resource_features.update")
            .target(target::RESOURCE_FEATURE, id, name.clone())
            .before(before_json)
            .after(json!({ "id": id, "name": name, "description": description }))
            .reversible(),
    )
    .await?;

    Ok(Json(json!({ "ok": true, "renamed_resources": affected.len() })))
}

/// `DELETE /admin/resource-features/:id`
///
/// Allowed even while resources carry it — unlike a building, a feature is an
/// annotation, and losing it degrades a description rather than deleting
/// something people booked. The links cascade; the resources whose generated
/// name loses that word are collected *before* the delete and refreshed after.
pub async fn delete_feature(
    State(state): State<AppState>,
    audit: AdminAudit,
    ctx: AdminCtx,
    Path(id): Path<Uuid>,
) -> Result<Json<Value>, AppError> {
    ctx.require(keys::RESOURCES_MANAGE)?;

    let mut tx = audit.begin(&state.db).await?;

    let row = sqlx::query("SELECT name, description FROM core.resource_features WHERE id = $1")
        .bind(id)
        .fetch_optional(&mut *tx)
        .await
        .map_err(|e| {
            tracing::error!(error = %e, "fonctionnalités: lecture avant suppression");
            AppError::Database(e)
        })?
        .ok_or_else(|| AppError::NotFound("Fonctionnalité introuvable".into()))?;

    let name: String = row.get("name");
    let refuse =
        || AuditEntry::new("core.resource_features.delete").target(target::RESOURCE_FEATURE, id, name.clone());

    let affected = match resources_with_feature(&mut tx, id).await {
        Ok(v) => v,
        Err(e) => return Err(tx.abort(&state.db, refuse(), e).await),
    };

    if let Err(e) = sqlx::query("DELETE FROM core.resource_features WHERE id = $1")
        .bind(id)
        .execute(&mut *tx)
        .await
    {
        return Err(tx.abort(&state.db, refuse(), write_error(e, "delete_feature")).await);
    }

    if let Err(e) = refresh_names(&mut tx, &affected).await {
        return Err(tx.abort(&state.db, refuse(), e).await);
    }

    tx.commit(
        AuditEntry::new("core.resource_features.delete")
            .target(target::RESOURCE_FEATURE, id, name.clone())
            .before(json!({
                "id": id, "name": name,
                "description": row.get::<Option<String>, _>("description"),
            }))
            .after(json!({ "renamed_resources": affected.len() })),
    )
    .await?;

    Ok(Json(json!({ "ok": true, "renamed_resources": affected.len() })))
}

// ── Resources ────────────────────────────────────────────────────────────────

#[derive(Debug, Deserialize)]
pub struct ResourceDto {
    pub name: String,
    pub building_id: Uuid,
    /// `meeting_room` or `other`.
    pub category: String,
    #[serde(default)]
    pub resource_type: Option<String>,
    pub floor_name: String,
    #[serde(default)]
    pub floor_section: Option<String>,
    pub capacity: i32,
    #[serde(default)]
    pub user_description: Option<String>,
    #[serde(default)]
    pub description: Option<String>,
    #[serde(default)]
    pub feature_ids: Vec<Uuid>,
    // No `generated_name`, and no identifier: both are the server's to decide.
    // A field the client may send is a field the client will one day disagree
    // with the server about.
}

struct CleanResource {
    name:             String,
    category:         String,
    resource_type:    Option<String>,
    floor:            String,
    section:          Option<String>,
    capacity:         i32,
    user_description: Option<String>,
    description:      Option<String>,
}

fn validate_resource(dto: &ResourceDto) -> Result<CleanResource, AppError> {
    let name = clean(&dto.name);
    if name.is_empty() {
        return Err(AppError::Validation("Le nom de la ressource est obligatoire.".into()));
    }
    max_len(&name, MAX_RESOURCE_NAME, "Le nom de la ressource")?;

    let category = dto.category.trim().to_string();
    if category != CATEGORY_ROOM && category != CATEGORY_OTHER {
        return Err(AppError::Validation(format!(
            "Catégorie inconnue : « {category} ». Attendu : {CATEGORY_ROOM}, {CATEGORY_OTHER}."
        )));
    }

    let resource_type = clean_opt(dto.resource_type.as_deref());
    // The column carries the same rule as a CHECK; it is restated here so the
    // refusal names the field instead of quoting a constraint.
    match (category.as_str(), &resource_type) {
        (CATEGORY_ROOM, Some(_)) => {
            return Err(AppError::Validation(
                "Une salle n'a pas de type : elle est le type. Laissez le champ vide.".into(),
            ))
        }
        (CATEGORY_OTHER, None) => {
            return Err(AppError::Validation(
                "Le type est obligatoire pour une ressource qui n'est pas une salle (« Vélo », « Salon », « Vidéoprojecteur »…).".into(),
            ))
        }
        _ => {}
    }
    if let Some(t) = &resource_type {
        max_len(t, MAX_RESOURCE_NAME, "Le type de la ressource")?;
    }

    let floor = clean(&dto.floor_name);
    if floor.is_empty() {
        return Err(AppError::Validation("L'étage est obligatoire.".into()));
    }
    max_len(&floor, MAX_FLOOR, "L'étage")?;

    let section = clean_opt(dto.floor_section.as_deref());
    if let Some(s) = &section {
        max_len(s, MAX_SECTION, "La partie de l'étage")?;
    }

    if dto.capacity <= 0 {
        return Err(AppError::Validation(
            "La capacité est un nombre entier de places strictement positif.".into(),
        ));
    }
    if dto.capacity > MAX_CAPACITY {
        return Err(AppError::Validation(format!(
            "La capacité dépasse {MAX_CAPACITY} : il s'agit très probablement d'un chiffre en trop."
        )));
    }

    let user_description = clean_opt(dto.user_description.as_deref());
    if let Some(d) = &user_description {
        max_len(d, MAX_USER_NOTE, "La description visible")?;
    }
    let description = clean_opt(dto.description.as_deref());
    if let Some(d) = &description {
        max_len(d, MAX_USER_NOTE, "La description")?;
    }

    Ok(CleanResource {
        name,
        category,
        resource_type,
        floor,
        section,
        capacity: dto.capacity,
        user_description,
        description,
    })
}

/// Rewrites a resource's feature links, and reports duplicates rather than
/// swallowing them: a list sent twice is a client bug, and silently collapsing
/// it hides the day the form starts double-submitting.
async fn write_features(
    db: &mut PgConnection,
    resource_id: Uuid,
    feature_ids: &[Uuid],
) -> Result<(), AppError> {
    let mut seen = std::collections::HashSet::new();
    if !feature_ids.iter().all(|id| seen.insert(*id)) {
        return Err(AppError::Validation(
            "La même fonctionnalité figure deux fois.".into(),
        ));
    }

    sqlx::query("DELETE FROM core.resource_feature_links WHERE resource_id = $1")
        .bind(resource_id)
        .execute(&mut *db)
        .await
        .map_err(|e| {
            tracing::error!(error = %e, "ressources: purge des fonctionnalités");
            AppError::Database(e)
        })?;

    for fid in feature_ids {
        sqlx::query(
            "INSERT INTO core.resource_feature_links (resource_id, feature_id) VALUES ($1, $2)",
        )
        .bind(resource_id)
        .bind(fid)
        .execute(&mut *db)
        .await
        .map_err(|e| {
            if e.to_string().contains("foreign key") {
                AppError::Validation("Une des fonctionnalités indiquées n'existe pas.".into())
            } else {
                tracing::error!(error = %e, "ressources: liaison d'une fonctionnalité");
                AppError::Database(e)
            }
        })?;
    }
    Ok(())
}

#[derive(Debug, Deserialize)]
pub struct ResourceQuery {
    #[serde(default)]
    pub building_id: Option<Uuid>,
}

/// One shape for the console, the internal endpoint and the read-after-write, so
/// that a field added for one of them cannot be missing from the others.
const RESOURCES_SELECT: &str = r#"
    SELECT r.id, r.name, r.generated_name, r.category, r.resource_type,
           r.floor_name, r.floor_section, r.capacity,
           r.user_description, r.description,
           r.building_id, b.building_key, b.name AS building_name,
           b.address AS building_address,
           b.latitude::float8  AS building_latitude,
           b.longitude::float8 AS building_longitude,
           COALESCE(ARRAY(
               SELECT f.id::text FROM core.resource_feature_links l
                 JOIN core.resource_features f ON f.id = l.feature_id
                WHERE l.resource_id = r.id ORDER BY LOWER(f.name)
           ), '{}') AS feature_ids,
           COALESCE(ARRAY(
               SELECT f.name FROM core.resource_feature_links l
                 JOIN core.resource_features f ON f.id = l.feature_id
                WHERE l.resource_id = r.id ORDER BY LOWER(f.name)
           ), '{}') AS feature_names
      FROM core.resources r
      JOIN core.buildings b ON b.id = r.building_id
     WHERE ($1::uuid IS NULL OR r.id = $1)
       AND ($2::uuid IS NULL OR r.building_id = $2)
     ORDER BY LOWER(r.generated_name)
"#;

/// The building a resource sits in, as both surfaces publish it.
///
/// One definition rather than two, and used by the console as well as by the
/// internal catalogue: "which building is this room in" must not have two
/// answers with different fields, and a column renamed in `RESOURCES_SELECT`
/// has to break in one place instead of silently in the one nobody looks at.
fn building_of(r: &sqlx::postgres::PgRow) -> Value {
    json!({
        "id":        r.get::<Uuid, _>("building_id"),
        "key":       r.get::<String, _>("building_key"),
        "name":      r.get::<Option<String>, _>("building_name"),
        "address":   r.get::<String, _>("building_address"),
        "latitude":  r.get::<Option<f64>, _>("building_latitude"),
        "longitude": r.get::<Option<f64>, _>("building_longitude"),
    })
}

fn resource_json(r: &sqlx::postgres::PgRow) -> Value {
    json!({
        "id":               r.get::<Uuid, _>("id"),
        "name":             r.get::<String, _>("name"),
        "generated_name":   r.get::<String, _>("generated_name"),
        "category":         r.get::<String, _>("category"),
        "resource_type":    r.get::<Option<String>, _>("resource_type"),
        "floor_name":       r.get::<String, _>("floor_name"),
        "floor_section":    r.get::<Option<String>, _>("floor_section"),
        "capacity":         r.get::<i32, _>("capacity"),
        "user_description": r.get::<Option<String>, _>("user_description"),
        "description":      r.get::<Option<String>, _>("description"),
        "building":         building_of(r),
        "feature_ids":      r.get::<Vec<String>, _>("feature_ids"),
        "feature_names":    r.get::<Vec<String>, _>("feature_names"),
    })
}

/// `GET /admin/resources?building_id=…`
pub async fn list_resources(
    State(state): State<AppState>,
    _admin: AdminUser,
    ctx: AdminCtx,
    Query(q): Query<ResourceQuery>,
) -> Result<Json<Value>, AppError> {
    ctx.require(keys::RESOURCES_READ)?;

    let rows = sqlx::query(RESOURCES_SELECT)
        .bind(Option::<Uuid>::None)
        .bind(q.building_id)
        .fetch_all(&state.db)
        .await
        .map_err(|e| {
            tracing::error!(error = %e, "ressources: liste");
            AppError::Database(e)
        })?;

    Ok(Json(json!({
        "resources":  rows.iter().map(resource_json).collect::<Vec<_>>(),
        "categories": [CATEGORY_ROOM, CATEGORY_OTHER],
        "limits": {
            "name": MAX_RESOURCE_NAME, "floor_name": MAX_FLOOR,
            "floor_section": MAX_SECTION, "capacity": MAX_CAPACITY,
            "description": MAX_USER_NOTE,
        },
    })))
}

/// `POST /admin/resources`
pub async fn create_resource(
    State(state): State<AppState>,
    audit: AdminAudit,
    ctx: AdminCtx,
    Json(dto): Json<ResourceDto>,
) -> Result<Json<Value>, AppError> {
    ctx.require(keys::RESOURCES_MANAGE)?;
    let r = validate_resource(&dto)?;

    let mut tx = audit.begin(&state.db).await?;
    let refuse = || AuditEntry::new("core.resources.create").target_kind(target::RESOURCE, &r.name);

    // Inserted with a placeholder the column's NOT NULL accepts, then rewritten
    // by `refresh_names` in the same transaction: composing it here would mean a
    // second implementation of the format, and two implementations of a derived
    // value diverge on the first change to either.
    let inserted = sqlx::query_scalar::<_, Uuid>(
        "INSERT INTO core.resources
             (name, building_id, category, resource_type, floor_name, floor_section,
              capacity, user_description, description, generated_name, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $1, $10)
         RETURNING id",
    )
    .bind(&r.name)
    .bind(dto.building_id)
    .bind(&r.category)
    .bind(&r.resource_type)
    .bind(&r.floor)
    .bind(&r.section)
    .bind(r.capacity)
    .bind(&r.user_description)
    .bind(&r.description)
    .bind(audit.admin.id)
    .fetch_one(&mut *tx)
    .await;

    let id = match inserted {
        Ok(id) => id,
        Err(e) => return Err(tx.abort(&state.db, refuse(), write_error(e, "create_resource")).await),
    };

    if let Err(e) = write_features(&mut tx, id, &dto.feature_ids).await {
        return Err(tx.abort(&state.db, refuse(), e).await);
    }
    if let Err(e) = refresh_names(&mut tx, &[id]).await {
        return Err(tx.abort(&state.db, refuse(), e).await);
    }

    let after = match sqlx::query(RESOURCES_SELECT)
        .bind(Some(id))
        .bind(Option::<Uuid>::None)
        .fetch_one(&mut *tx)
        .await
    {
        Ok(row) => row,
        Err(e) => {
            tracing::error!(error = %e, "ressources: relecture après création");
            return Err(tx.abort(&state.db, refuse(), AppError::Database(e)).await);
        }
    };
    let after_json = resource_json(&after);
    let generated: String = after.get("generated_name");

    tx.commit(
        AuditEntry::new("core.resources.create")
            .target(target::RESOURCE, id, generated.clone())
            .after(after_json)
            .reversible(),
    )
    .await?;

    Ok(Json(json!({ "id": id, "generated_name": generated })))
}

/// `PATCH /admin/resources/:id`
///
/// The identifier is not among the editable fields, and there is no route that
/// accepts one on creation either. That is the whole defence against the classic
/// accident of this model: where a resource identifier can be *typed*, editing
/// it does not rename the resource, it creates a second one and orphans every
/// booking pointing at the first.
pub async fn update_resource(
    State(state): State<AppState>,
    audit: AdminAudit,
    ctx: AdminCtx,
    Path(id): Path<Uuid>,
    Json(dto): Json<ResourceDto>,
) -> Result<Json<Value>, AppError> {
    ctx.require(keys::RESOURCES_MANAGE)?;
    let r = validate_resource(&dto)?;

    let mut tx = audit.begin(&state.db).await?;

    let before = sqlx::query(RESOURCES_SELECT)
        .bind(Some(id))
        .bind(Option::<Uuid>::None)
        .fetch_optional(&mut *tx)
        .await
        .map_err(|e| {
            tracing::error!(error = %e, "ressources: lecture avant modification");
            AppError::Database(e)
        })?
        .ok_or_else(|| AppError::NotFound("Ressource introuvable".into()))?;

    let before_json = resource_json(&before);
    let refuse = || {
        AuditEntry::new("core.resources.update").target(
            target::RESOURCE,
            id,
            before.get::<String, _>("generated_name"),
        )
    };

    if let Err(e) = sqlx::query(
        "UPDATE core.resources
            SET name = $1, building_id = $2, category = $3, resource_type = $4,
                floor_name = $5, floor_section = $6, capacity = $7,
                user_description = $8, description = $9
          WHERE id = $10",
    )
    .bind(&r.name)
    .bind(dto.building_id)
    .bind(&r.category)
    .bind(&r.resource_type)
    .bind(&r.floor)
    .bind(&r.section)
    .bind(r.capacity)
    .bind(&r.user_description)
    .bind(&r.description)
    .bind(id)
    .execute(&mut *tx)
    .await
    {
        return Err(tx.abort(&state.db, refuse(), write_error(e, "update_resource")).await);
    }

    if let Err(e) = write_features(&mut tx, id, &dto.feature_ids).await {
        return Err(tx.abort(&state.db, refuse(), e).await);
    }
    if let Err(e) = refresh_names(&mut tx, &[id]).await {
        return Err(tx.abort(&state.db, refuse(), e).await);
    }

    let after = match sqlx::query(RESOURCES_SELECT)
        .bind(Some(id))
        .bind(Option::<Uuid>::None)
        .fetch_one(&mut *tx)
        .await
    {
        Ok(row) => row,
        Err(e) => {
            tracing::error!(error = %e, "ressources: relecture après modification");
            return Err(tx.abort(&state.db, refuse(), AppError::Database(e)).await);
        }
    };
    let generated: String = after.get("generated_name");

    tx.commit(
        AuditEntry::new("core.resources.update")
            .target(target::RESOURCE, id, generated.clone())
            .before(before_json)
            .after(resource_json(&after))
            .reversible(),
    )
    .await?;

    Ok(Json(json!({ "ok": true, "generated_name": generated })))
}

/// `DELETE /admin/resources/:id`
pub async fn delete_resource(
    State(state): State<AppState>,
    audit: AdminAudit,
    ctx: AdminCtx,
    Path(id): Path<Uuid>,
) -> Result<Json<Value>, AppError> {
    ctx.require(keys::RESOURCES_MANAGE)?;

    let mut tx = audit.begin(&state.db).await?;

    let row = sqlx::query(RESOURCES_SELECT)
        .bind(Some(id))
        .bind(Option::<Uuid>::None)
        .fetch_optional(&mut *tx)
        .await
        .map_err(|e| {
            tracing::error!(error = %e, "ressources: lecture avant suppression");
            AppError::Database(e)
        })?
        .ok_or_else(|| AppError::NotFound("Ressource introuvable".into()))?;

    let generated: String = row.get("generated_name");
    let refuse =
        || AuditEntry::new("core.resources.delete").target(target::RESOURCE, id, generated.clone());

    if let Err(e) = sqlx::query("DELETE FROM core.resources WHERE id = $1")
        .bind(id)
        .execute(&mut *tx)
        .await
    {
        return Err(tx.abort(&state.db, refuse(), write_error(e, "delete_resource")).await);
    }

    tx.commit(
        AuditEntry::new("core.resources.delete")
            .target(target::RESOURCE, id, generated)
            .before(resource_json(&row)),
    )
    .await?;

    Ok(Json(json!({ "ok": true })))
}

// ── Overview ─────────────────────────────────────────────────────────────────

/// `GET /admin/resources/overview`
///
/// The counters, and the three things that are wrong.
///
/// The gaps are the point of the screen. Counting rows says the inventory
/// exists; naming the buildings that hold nothing, the resources nobody can
/// picture because they carry no visible description, and the features attached
/// to nothing, says whether it is *finished* — which is the question an
/// administrator actually arrives with, and the one a bare total never answers.
pub async fn overview(
    State(state): State<AppState>,
    _admin: AdminUser,
    ctx: AdminCtx,
) -> Result<Json<Value>, AppError> {
    ctx.require(keys::RESOURCES_READ)?;

    let row = sqlx::query(
        r#"
        SELECT (SELECT COUNT(*) FROM core.buildings)::bigint          AS buildings,
               (SELECT COUNT(*) FROM core.resources)::bigint          AS resources,
               (SELECT COUNT(*) FROM core.resource_features)::bigint  AS features,
               (SELECT COUNT(*) FROM core.resources
                 WHERE category = 'meeting_room')::bigint             AS rooms,
               (SELECT COALESCE(SUM(capacity), 0) FROM core.resources
                 WHERE category = 'meeting_room')::bigint             AS room_seats,
               (SELECT COUNT(*) FROM core.buildings b
                 WHERE NOT EXISTS (SELECT 1 FROM core.resources r
                                    WHERE r.building_id = b.id))::bigint
                                                                      AS empty_buildings,
               (SELECT COUNT(*) FROM core.resources
                 WHERE user_description IS NULL)::bigint              AS undescribed,
               (SELECT COUNT(*) FROM core.resource_features f
                 WHERE NOT EXISTS (SELECT 1 FROM core.resource_feature_links l
                                    WHERE l.feature_id = f.id))::bigint
                                                                      AS unused_features
        "#,
    )
    .fetch_one(&state.db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, "ressources: aperçu");
        AppError::Database(e)
    })?;

    Ok(Json(json!({
        "buildings":       row.get::<i64, _>("buildings"),
        "resources":       row.get::<i64, _>("resources"),
        "features":        row.get::<i64, _>("features"),
        "rooms":           row.get::<i64, _>("rooms"),
        "room_seats":      row.get::<i64, _>("room_seats"),
        "empty_buildings": row.get::<i64, _>("empty_buildings"),
        "undescribed":     row.get::<i64, _>("undescribed"),
        "unused_features": row.get::<i64, _>("unused_features"),
    })))
}

// ── The internal catalogue ───────────────────────────────────────────────────

/// `GET /internal/directory/resources` — the bookable catalogue, for modules.
///
/// Read-only, and deliberately the *only* door: a module that could write here
/// would be a module deciding what the directory contains, which is the
/// administrator's job. It carries no notion of who is calling — the internal
/// secret proves the caller is inside the instance, and nothing in this file
/// names a module, so any module that needs places and objects reads the same
/// answer.
///
/// It lives in this file rather than beside the other internal handlers because
/// it is the same data shaped by the same query; splitting it would put two
/// definitions of "a resource" in two places, and they would drift.
///
/// The administrator-only `description` is **not** in the response. That field
/// exists precisely to hold what must not be shown when booking (an access code,
/// a caretaking constraint), and a module that renders the catalogue would show
/// it. `user_description` is the one written to be seen.
pub async fn internal_list_resources(
    State(state): State<AppState>,
    _internal: InternalRequest,
    Query(q): Query<ResourceQuery>,
) -> Result<Json<Value>, AppError> {
    let rows = sqlx::query(RESOURCES_SELECT)
        .bind(Option::<Uuid>::None)
        .bind(q.building_id)
        .fetch_all(&state.db)
        .await
        .map_err(|e| {
            tracing::error!(error = %e, "ressources: catalogue interne");
            AppError::Database(e)
        })?;

    let resources: Vec<Value> = rows
        .iter()
        .map(|r| {
            json!({
                "id":               r.get::<Uuid, _>("id"),
                // What a module should display: the composed name is the one
                // people recognise, and the one the console shows.
                "generated_name":   r.get::<String, _>("generated_name"),
                "name":             r.get::<String, _>("name"),
                "category":         r.get::<String, _>("category"),
                "resource_type":    r.get::<Option<String>, _>("resource_type"),
                "capacity":         r.get::<i32, _>("capacity"),
                "floor_name":       r.get::<String, _>("floor_name"),
                "floor_section":    r.get::<Option<String>, _>("floor_section"),
                "user_description": r.get::<Option<String>, _>("user_description"),
                "features":         r.get::<Vec<String>, _>("feature_names"),
                "building":         building_of(r),
            })
        })
        .collect();

    Ok(Json(json!({ "resources": resources })))
}

#[cfg(test)]
mod tests {
    use super::*;

    // ── The generated name, both forms ───────────────────────────────────────

    #[test]
    fn a_room_is_named_building_floor_then_name_and_capacity() {
        assert_eq!(
            generated_name("SIEGE", "2", None, "Amphi", 40, None, &[]),
            "SIEGE-2 Amphi (40)"
        );
    }

    #[test]
    fn anything_that_is_not_a_room_leads_with_its_type() {
        assert_eq!(
            generated_name("SIEGE", "Accueil", None, "Vélo 2", 1, Some("Vélo"), &[]),
            "Vélo-SIEGE-Accueil-Vélo 2 (1)"
        );
    }

    /// The section is a structured field like the floor: it belongs to the head
    /// of the name, not to the free-text one, or two rooms in different wings of
    /// the same floor would be told apart only by what somebody typed.
    #[test]
    fn a_floor_section_joins_the_head_of_the_name() {
        assert_eq!(
            generated_name("SIEGE", "2", Some("Aile A"), "Amphi", 40, None, &[]),
            "SIEGE-2-Aile A Amphi (40)"
        );
        assert_eq!(
            generated_name("SIEGE", "2", Some("Aile A"), "Chariot", 1, Some("Projecteur"), &[]),
            "Projecteur-SIEGE-2-Aile A-Chariot (1)"
        );
    }

    #[test]
    fn features_are_appended_after_the_capacity() {
        let features = vec!["Tableau".to_string(), "Visio".to_string()];
        assert_eq!(
            generated_name("SIEGE", "2", None, "Amphi", 40, None, &features),
            "SIEGE-2 Amphi (40) Tableau Visio"
        );
    }

    /// An absent section must not leave a dangling separator: `SIEGE-2- Amphi`
    /// would read as a floor named "2-" to anyone scanning the list.
    #[test]
    fn an_absent_section_leaves_no_separator_behind() {
        let name = generated_name("SIEGE", "2", None, "Amphi", 40, None, &[]);
        assert!(!name.contains("--"), "{name}");
        assert!(!name.contains("- "), "{name}");
    }

    // ── Text hygiene ─────────────────────────────────────────────────────────

    #[test]
    fn labels_are_normalised_before_they_are_compared() {
        assert_eq!(clean("  Salle   Bleue "), "Salle Bleue");
        assert_eq!(clean("   "), "");
        assert_eq!(clean_opt(Some("  ")), None);
        assert_eq!(clean_opt(Some(" Aile  A ")), Some("Aile A".to_string()));
    }

    /// The limits count characters, not bytes: a French label of exactly
    /// forty-five accented letters is legal and a byte check would reject it.
    #[test]
    fn length_limits_count_characters_not_bytes() {
        let forty_five = "é".repeat(MAX_RESOURCE_NAME);
        assert_eq!(forty_five.len(), MAX_RESOURCE_NAME * 2, "prérequis : 2 octets par é");
        assert!(max_len(&forty_five, MAX_RESOURCE_NAME, "x").is_ok());
        assert!(max_len(&"é".repeat(MAX_RESOURCE_NAME + 1), MAX_RESOURCE_NAME, "x").is_err());
    }

    // ── Building validation ──────────────────────────────────────────────────

    fn building(key: &str, floors: &[&str]) -> BuildingDto {
        BuildingDto {
            building_key: key.into(),
            name: None,
            address: "1 rue de la Paix".into(),
            description: None,
            latitude: None,
            longitude: None,
            floors: floors.iter().map(|s| (*s).to_string()).collect(),
        }
    }

    #[test]
    fn a_building_needs_a_key_an_address_and_a_floor() {
        assert!(validate_building(&building("SIEGE", &["Accueil"])).is_ok());
        assert!(validate_building(&building("  ", &["Accueil"])).is_err());
        assert!(validate_building(&building("SIEGE", &[])).is_err());

        let mut no_address = building("SIEGE", &["Accueil"]);
        no_address.address = "   ".into();
        assert!(validate_building(&no_address).is_err());
    }

    /// The key is concatenated into every generated name of the building, right
    /// before a hyphen and a floor: a space or an accent there makes that name
    /// ambiguous exactly where it is used to tell two rooms apart.
    #[test]
    fn a_building_key_refuses_spaces_and_accents() {
        assert!(validate_building(&building("US-NYC-9TH", &["1"])).is_ok());
        assert!(validate_building(&building("SIEGE SOCIAL", &["1"])).is_err());
        assert!(validate_building(&building("SIÈGE", &["1"])).is_err());
    }

    #[test]
    fn floors_keep_their_order_and_refuse_duplicates() {
        let ok = validate_building(&building("SIEGE", &["Accueil", "2", "3", "5A"]));
        let floors = ok.map(|b| b.floors).unwrap_or_default();
        assert_eq!(floors, vec!["Accueil", "2", "3", "5A"]);
        // Case-insensitive, like the unique index.
        assert!(validate_building(&building("SIEGE", &["2", "2"])).is_err());
        assert!(validate_building(&building("SIEGE", &["RdC", "rdc"])).is_err());
    }

    #[test]
    fn coordinates_come_in_pairs_and_stay_on_the_planet() {
        let mut b = building("SIEGE", &["1"]);
        b.latitude = Some(48.8566);
        assert!(validate_building(&b).is_err(), "latitude seule");
        b.longitude = Some(2.3522);
        assert!(validate_building(&b).is_ok());
        b.latitude = Some(91.0);
        assert!(validate_building(&b).is_err(), "hors limites");
    }

    // ── Resource validation ──────────────────────────────────────────────────

    fn resource(category: &str, kind: Option<&str>) -> ResourceDto {
        ResourceDto {
            name: "Amphi".into(),
            building_id: Uuid::nil(),
            category: category.into(),
            resource_type: kind.map(str::to_string),
            floor_name: "2".into(),
            floor_section: None,
            capacity: 40,
            user_description: None,
            description: None,
            feature_ids: vec![],
        }
    }

    #[test]
    fn a_room_has_no_type_and_anything_else_must_have_one() {
        assert!(validate_resource(&resource(CATEGORY_ROOM, None)).is_ok());
        assert!(validate_resource(&resource(CATEGORY_ROOM, Some("Vélo"))).is_err());
        assert!(validate_resource(&resource(CATEGORY_OTHER, Some("Vélo"))).is_ok());
        assert!(validate_resource(&resource(CATEGORY_OTHER, None)).is_err());
    }

    #[test]
    fn the_category_vocabulary_is_closed() {
        assert!(validate_resource(&resource("phone_booth", None)).is_err());
        assert!(validate_resource(&resource("", None)).is_err());
    }

    #[test]
    fn a_capacity_is_a_strictly_positive_number_of_seats() {
        let mut r = resource(CATEGORY_ROOM, None);
        r.capacity = 0;
        assert!(validate_resource(&r).is_err());
        r.capacity = -3;
        assert!(validate_resource(&r).is_err());
        r.capacity = 1;
        assert!(validate_resource(&r).is_ok());
        r.capacity = MAX_CAPACITY + 1;
        assert!(validate_resource(&r).is_err());
    }

    #[test]
    fn a_resource_needs_a_name_and_a_floor() {
        let mut r = resource(CATEGORY_ROOM, None);
        r.name = "  ".into();
        assert!(validate_resource(&r).is_err());
        let mut r = resource(CATEGORY_ROOM, None);
        r.floor_name = "".into();
        assert!(validate_resource(&r).is_err());
    }

    /// The two floor fields are short because they are head segments of the
    /// generated name; a fifty-character "floor" would push the actual name past
    /// the width of the column it is read in.
    #[test]
    fn the_floor_fields_stay_short() {
        let mut r = resource(CATEGORY_ROOM, None);
        r.floor_name = "x".repeat(MAX_FLOOR + 1);
        assert!(validate_resource(&r).is_err());
        let mut r = resource(CATEGORY_ROOM, None);
        r.floor_section = Some("x".repeat(MAX_SECTION + 1));
        assert!(validate_resource(&r).is_err());
    }

    /// The constants must not drift past what the columns accept, or a legal
    /// request would fail with a constraint error instead of the sentence
    /// written for it.
    #[test]
    fn the_limits_match_the_columns() {
        assert_eq!(MAX_RESOURCE_NAME, 45);
        assert_eq!(MAX_FLOOR, 15);
        assert_eq!(MAX_SECTION, 15);
        assert_eq!(MAX_BUILDING_KEY, 100);
        assert_eq!(MAX_FEATURE_NAME, 60);
    }
}
