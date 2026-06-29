use crate::{
    auth::{middleware::AdminUser, oauth},
    crypto::encryption,
    errors::AppError,
    models::oauth_provider::{
        AdminOAuthProvider, CreateOAuthProviderDto, OAuthProvider, UpdateOAuthProviderDto,
    },
    state::AppState,
};
use axum::{
    extract::{Path, State},
    Json,
};
use serde_json::{json, Value};
use uuid::Uuid;

fn validate_slug(slug: &str) -> Result<(), AppError> {
    let ok = (2..=40).contains(&slug.len())
        && slug
            .chars()
            .all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '-');
    if ok {
        Ok(())
    } else {
        Err(AppError::Validation(
            "slug invalide : 2 à 40 caractères, minuscules/chiffres/tirets uniquement".into(),
        ))
    }
}

fn validate_issuer(url: &str) -> Result<(), AppError> {
    match url::Url::parse(url) {
        Ok(u) if u.scheme() == "https" || u.scheme() == "http" => Ok(()),
        _ => Err(AppError::Validation(
            "issuer_url invalide (URL http(s) attendue)".into(),
        )),
    }
}

/// Encrypt a client secret with the OIDC key derived from the JWT secret.
fn encrypt_secret(state: &AppState, secret: &str) -> Result<String, AppError> {
    if secret.is_empty() {
        return Ok(String::new());
    }
    let key = oauth::secret_key(&state.settings.auth.jwt_secret);
    encryption::encrypt(&key, secret.as_bytes()).map_err(AppError::Internal)
}

pub async fn list_oauth_providers(
    State(state): State<AppState>,
    _admin: AdminUser,
) -> Result<Json<Value>, AppError> {
    let rows = sqlx::query_as::<_, OAuthProvider>(
        "SELECT * FROM core.oauth_providers ORDER BY position, display_name",
    )
    .fetch_all(&state.db)
    .await?;

    let providers: Vec<AdminOAuthProvider> = rows.into_iter().map(Into::into).collect();
    Ok(Json(json!({ "providers": providers })))
}

pub async fn create_oauth_provider(
    State(state): State<AppState>,
    _admin: AdminUser,
    Json(dto): Json<CreateOAuthProviderDto>,
) -> Result<Json<Value>, AppError> {
    let slug = dto.slug.trim().to_lowercase();
    validate_slug(&slug)?;
    validate_issuer(dto.issuer_url.trim())?;
    if dto.display_name.trim().is_empty() || dto.client_id.trim().is_empty() {
        return Err(AppError::Validation("display_name et client_id requis".into()));
    }

    let secret_enc = encrypt_secret(&state, &dto.client_secret)?;
    let scopes = dto
        .scopes
        .filter(|s| !s.trim().is_empty())
        .unwrap_or_else(|| "openid email profile".into());

    let row = sqlx::query_as::<_, OAuthProvider>(
        r#"INSERT INTO core.oauth_providers
               (slug, display_name, issuer_url, client_id, client_secret_enc,
                scopes, button_color, enabled, allow_signup, position)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           RETURNING *"#,
    )
    .bind(&slug)
    .bind(dto.display_name.trim())
    .bind(dto.issuer_url.trim())
    .bind(dto.client_id.trim())
    .bind(&secret_enc)
    .bind(&scopes)
    .bind(dto.button_color.as_deref())
    .bind(dto.enabled)
    .bind(dto.allow_signup)
    .bind(dto.position)
    .fetch_one(&state.db)
    .await
    .map_err(|e| match &e {
        sqlx::Error::Database(db) if db.is_unique_violation() => {
            AppError::Conflict(format!("Un fournisseur avec le slug '{slug}' existe déjà"))
        }
        _ => AppError::from(e),
    })?;

    tracing::info!(slug = %row.slug, "Fournisseur SSO créé");
    Ok(Json(json!({ "provider": AdminOAuthProvider::from(row) })))
}

pub async fn update_oauth_provider(
    State(state): State<AppState>,
    _admin: AdminUser,
    Path(id): Path<Uuid>,
    Json(dto): Json<UpdateOAuthProviderDto>,
) -> Result<Json<Value>, AppError> {
    if let Some(issuer) = dto.issuer_url.as_deref() {
        validate_issuer(issuer.trim())?;
    }

    // Encrypt only when a non-empty new secret is provided; otherwise keep the
    // existing one (NULL → COALESCE keeps the stored value).
    let secret_enc: Option<String> = match dto.client_secret.as_deref() {
        Some(s) if !s.is_empty() => Some(encrypt_secret(&state, s)?),
        _ => None,
    };

    let row = sqlx::query_as::<_, OAuthProvider>(
        r#"UPDATE core.oauth_providers SET
               display_name      = COALESCE($2,  display_name),
               issuer_url        = COALESCE($3,  issuer_url),
               client_id         = COALESCE($4,  client_id),
               scopes            = COALESCE($5,  scopes),
               button_color      = COALESCE($6,  button_color),
               enabled           = COALESCE($7,  enabled),
               allow_signup      = COALESCE($8,  allow_signup),
               position          = COALESCE($9,  position),
               client_secret_enc = COALESCE($10, client_secret_enc)
           WHERE id = $1
           RETURNING *"#,
    )
    .bind(id)
    .bind(dto.display_name.as_deref().map(str::trim))
    .bind(dto.issuer_url.as_deref().map(str::trim))
    .bind(dto.client_id.as_deref().map(str::trim))
    .bind(dto.scopes.as_deref())
    .bind(dto.button_color.as_deref())
    .bind(dto.enabled)
    .bind(dto.allow_signup)
    .bind(dto.position)
    .bind(secret_enc.as_deref())
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Fournisseur SSO introuvable".into()))?;

    tracing::info!(slug = %row.slug, "Fournisseur SSO mis à jour");
    Ok(Json(json!({ "provider": AdminOAuthProvider::from(row) })))
}

pub async fn delete_oauth_provider(
    State(state): State<AppState>,
    _admin: AdminUser,
    Path(id): Path<Uuid>,
) -> Result<Json<Value>, AppError> {
    let affected = sqlx::query("DELETE FROM core.oauth_providers WHERE id = $1")
        .bind(id)
        .execute(&state.db)
        .await?
        .rows_affected();

    if affected == 0 {
        return Err(AppError::NotFound("Fournisseur SSO introuvable".into()));
    }
    Ok(Json(json!({ "message": "Fournisseur supprimé" })))
}
