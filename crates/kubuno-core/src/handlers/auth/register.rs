//! Public sign up (`POST /auth/register`).

use crate::{
    crypto::password, errors::AppError, models::user::CreateUserDto, state::AppState,
};
use axum::{extract::State, http::StatusCode, response::IntoResponse, Json};
use serde_json::json;
use validator::Validate;

#[utoipa::path(
    post,
    path = "/api/v1/auth/register",
    tag = "auth",
    request_body = CreateUserDto,
    responses(
        (status = 201, description = "Compte créé"),
        (status = 403, description = "Inscription fermée"),
        (status = 409, description = "Email ou nom d'utilisateur déjà pris")
    )
)]
pub async fn register(
    State(state): State<AppState>,
    Json(dto): Json<CreateUserDto>,
) -> Result<impl IntoResponse, AppError> {
    dto.validate()
        .map_err(|e| AppError::Validation(e.to_string()))?;

    // Vérifier si inscription ouverte
    let open: bool = sqlx::query_scalar(
        "SELECT (value::text = 'true') FROM core.settings WHERE key = 'auth.registration_open'",
    )
    .fetch_optional(&state.db)
    .await?
    .unwrap_or(true);

    if !open {
        return Err(AppError::Forbidden);
    }

    // The one policy the domain registry governs. Off by default, so an instance
    // that never declared a domain behaves exactly as it always has.
    //
    // Checked against **verified** domains only: a registry entry nobody has
    // proven would let whoever typed it decide who may open an account here.
    // The refusal names the accepted domains — an address at the wrong domain is
    // a mistake, not an attack, and hiding the list would only make it a
    // guessing game. Nothing about existing accounts is disclosed by it.
    let restricted: bool = crate::settings::instance_value(&state.db, "auth.registration_domains_only")
        .await
        .and_then(|v| v.as_bool())
        .unwrap_or(false);
    if restricted {
        let domain = dto.email.rsplit('@').next().unwrap_or_default().to_ascii_lowercase();
        if !crate::domains::store::is_verified(&state.db, &domain).await {
            let accepted = crate::domains::store::verified_names(&state.db).await;
            return Err(AppError::Validation(if accepted.is_empty() {
                "Les inscriptions sont réservées aux adresses des domaines de cette instance.".into()
            } else {
                format!(
                    "Les inscriptions sont réservées aux adresses de : {}.",
                    accepted.join(", ")
                )
            }));
        }
    }

    // Vérifier unicité email + username (même message pour éviter l'énumération)
    let exists: bool = sqlx::query_scalar(
        "SELECT EXISTS(SELECT 1 FROM core.users WHERE email = $1 OR username = $2)",
    )
    .bind(&dto.email)
    .bind(&dto.username)
    .fetch_one(&state.db)
    .await?;

    if exists {
        return Err(AppError::Conflict("Email ou nom d'utilisateur déjà utilisé".into()));
    }

    let hash = password::hash_password(&dto.password)
        .map_err(AppError::Internal)?;

    // A public sign-up names no unit, so it lands at the root of the tree — not
    // outside it. An account outside the tree is invisible to every DELEGATED
    // administrator (`handlers/admin/users.rs` filters by subtree) and resolves
    // its settings as `default → instance`, SKIPPING every unit-level value,
    // locked ones included. Migration 000107 makes that state unrepresentable;
    // naming the unit here is what makes the intention readable at the call site.
    let root_unit = crate::database::seed::root_org_unit(&state.db).await;

    // The configured default, not the column default — and resolved FROM THE
    // UNIT the account is being created in, so a per-unit (or locked) quota set
    // on the root applies to the people who sign up into it. Until this was
    // read, raising `storage.default_quota_bytes` changed nothing for the
    // accounts it was raised for.
    let quota = crate::models::user::default_quota_for(&state.db, root_unit).await;

    let user = sqlx::query_as::<_, crate::models::user::User>(
        r#"INSERT INTO core.users
               (email, username, password_hash, display_name, quota_bytes, org_unit_id)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING *"#,
    )
    .bind(&dto.email)
    .bind(&dto.username)
    .bind(&hash)
    .bind(dto.display_name.as_deref())
    .bind(quota)
    .bind(root_unit)
    .fetch_one(&state.db)
    .await?;

    // Ajouter l'utilisateur aux groupes par défaut
    let default_groups: Vec<uuid::Uuid> = sqlx::query_scalar(
        "SELECT id FROM core.user_groups WHERE is_default = TRUE",
    )
    .fetch_all(&state.db)
    .await
    .unwrap_or_default();

    for group_id in default_groups {
        let _ = sqlx::query(
            "INSERT INTO core.user_group_members (group_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        )
        .bind(group_id)
        .bind(user.id)
        .execute(&state.db)
        .await;
    }

    state.events.publish(crate::events::AppEvent::UserCreated {
        user_id: user.id,
        email: user.email.clone(),
    });

    Ok((StatusCode::CREATED, Json(json!({ "user": user }))))
}
