use crate::{
    authz::{keys, AdminCtx},
    audit::{redact::target, snap, AdminAudit, AuditEntry},
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

/// A claim name the operator left blank falls back to the standard one rather
/// than to the empty string: an empty mapping matches nothing, and "I did not
/// fill this in" must not mean "map nothing here".
fn claim_or<'a>(value: Option<&'a str>, fallback: &'a str) -> &'a str {
    match value.map(str::trim) {
        Some(v) if !v.is_empty() => v,
        _ => fallback,
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
    ctx: AdminCtx,
) -> Result<Json<Value>, AppError> {
    ctx.require(keys::AUTH_PROVIDERS_READ)?;
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
    audit: AdminAudit,
    ctx: AdminCtx,
    Json(dto): Json<CreateOAuthProviderDto>,
) -> Result<Json<Value>, AppError> {
    ctx.require(keys::AUTH_PROVIDERS_MANAGE)?;
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

    let mut tx = audit.begin(&state.db).await?;

    let row = sqlx::query_as::<_, OAuthProvider>(
        r#"INSERT INTO core.oauth_providers
               (slug, display_name, issuer_url, client_id, client_secret_enc,
                scopes, button_color, enabled, allow_signup, position,
                claim_username, claim_email, claim_display_name, claim_groups, sync_groups)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
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
    .bind(claim_or(dto.claim_username.as_deref(), "preferred_username"))
    .bind(claim_or(dto.claim_email.as_deref(), "email"))
    .bind(claim_or(dto.claim_display_name.as_deref(), "name"))
    .bind(claim_or(dto.claim_groups.as_deref(), "groups"))
    .bind(dto.sync_groups)
    .fetch_one(&mut *tx)
    .await
    .map_err(|e| match &e {
        sqlx::Error::Database(db) if db.is_unique_violation() => {
            AppError::Conflict(format!("Un fournisseur avec le slug '{slug}' existe déjà"))
        }
        _ => {
            tracing::error!(error = %e, "create_oauth_provider");
            AppError::from(e)
        }
    })?;

    // `AdminOAuthProvider` already drops the secret, and the whitelist drops it
    // again: the client secret has no path into the trail.
    let public = AdminOAuthProvider::from(row.clone());
    tx.commit(
        AuditEntry::new("core.auth_providers.create")
            .target(target::OAUTH_PROVIDER, row.id, row.display_name.clone())
            .after(snap(target::OAUTH_PROVIDER, &public))
            .reversible(),
    )
    .await?;

    tracing::info!(slug = %row.slug, "Fournisseur SSO créé");
    Ok(Json(json!({ "provider": public })))
}

pub async fn update_oauth_provider(
    State(state): State<AppState>,
    audit: AdminAudit,
    ctx: AdminCtx,
    Path(id): Path<Uuid>,
    Json(dto): Json<UpdateOAuthProviderDto>,
) -> Result<Json<Value>, AppError> {
    ctx.require(keys::AUTH_PROVIDERS_MANAGE)?;
    if let Some(issuer) = dto.issuer_url.as_deref() {
        validate_issuer(issuer.trim())?;
    }

    // Encrypt only when a non-empty new secret is provided; otherwise keep the
    // existing one (NULL → COALESCE keeps the stored value).
    let secret_enc: Option<String> = match dto.client_secret.as_deref() {
        Some(s) if !s.is_empty() => Some(encrypt_secret(&state, s)?),
        _ => None,
    };

    let mut tx = audit.begin(&state.db).await?;

    let previous = sqlx::query_as::<_, OAuthProvider>(
        "SELECT * FROM core.oauth_providers WHERE id = $1 FOR UPDATE",
    )
    .bind(id)
    .fetch_optional(&mut *tx)
    .await
    .map_err(|e| { tracing::error!(error = %e, "update_oauth_provider: lecture"); AppError::Database(e) })?
    .ok_or_else(|| AppError::NotFound("Fournisseur SSO introuvable".into()))?;

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
               client_secret_enc = COALESCE($10, client_secret_enc),
               claim_username     = COALESCE($11, claim_username),
               claim_email        = COALESCE($12, claim_email),
               claim_display_name = COALESCE($13, claim_display_name),
               claim_groups       = COALESCE($14, claim_groups),
               sync_groups        = COALESCE($15, sync_groups)
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
    .bind(dto.claim_username.as_deref().map(str::trim).filter(|s| !s.is_empty()))
    .bind(dto.claim_email.as_deref().map(str::trim).filter(|s| !s.is_empty()))
    .bind(dto.claim_display_name.as_deref().map(str::trim).filter(|s| !s.is_empty()))
    .bind(dto.claim_groups.as_deref().map(str::trim).filter(|s| !s.is_empty()))
    .bind(dto.sync_groups)
    .fetch_optional(&mut *tx)
    .await
    .map_err(|e| { tracing::error!(error = %e, "update_oauth_provider: écriture"); AppError::Database(e) })?
    .ok_or_else(|| AppError::NotFound("Fournisseur SSO introuvable".into()))?;

    let public = AdminOAuthProvider::from(row.clone());
    let mut entry = AuditEntry::new("core.auth_providers.update")
        .target(target::OAUTH_PROVIDER, row.id, row.display_name.clone())
        .before(snap(target::OAUTH_PROVIDER, &AdminOAuthProvider::from(previous)))
        .after(snap(target::OAUTH_PROVIDER, &public))
        .reversible();
    // A rotated secret is worth knowing about even though its value never
    // appears: the note says "the credential changed", nothing more.
    if secret_enc.is_some() {
        entry = entry.detail("secret client renouvelé");
    }
    tx.commit(entry).await?;

    tracing::info!(slug = %row.slug, "Fournisseur SSO mis à jour");
    Ok(Json(json!({ "provider": public })))
}

pub async fn delete_oauth_provider(
    State(state): State<AppState>,
    audit: AdminAudit,
    ctx: AdminCtx,
    Path(id): Path<Uuid>,
) -> Result<Json<Value>, AppError> {
    ctx.require(keys::AUTH_PROVIDERS_MANAGE)?;
    let mut tx = audit.begin(&state.db).await?;

    let previous = sqlx::query_as::<_, OAuthProvider>(
        "SELECT * FROM core.oauth_providers WHERE id = $1 FOR UPDATE",
    )
    .bind(id)
    .fetch_optional(&mut *tx)
    .await
    .map_err(|e| { tracing::error!(error = %e, "delete_oauth_provider: lecture"); AppError::Database(e) })?
    .ok_or_else(|| AppError::NotFound("Fournisseur SSO introuvable".into()))?;

    sqlx::query("DELETE FROM core.oauth_providers WHERE id = $1")
        .bind(id)
        .execute(&mut *tx)
        .await
        .map_err(|e| { tracing::error!(error = %e, "delete_oauth_provider"); AppError::Database(e) })?;

    let label = previous.display_name.clone();
    tx.commit(
        AuditEntry::new("core.auth_providers.delete")
            .target(target::OAUTH_PROVIDER, id, label)
            .before(snap(target::OAUTH_PROVIDER, &AdminOAuthProvider::from(previous))),
    )
    .await?;

    Ok(Json(json!({ "message": "Fournisseur supprimé" })))
}

// ── Diagnostic ───────────────────────────────────────────────────────────────

/// Fetches the provider's discovery document and reports what came back.
///
/// The counterpart of the directory's connection probe, and it exists for the
/// same reason: an issuer URL that is off by one path segment produces a
/// redirect that fails minutes later, in the browser, with an error page nobody
/// controls. This says so in one click, with the provider's own answer.
pub async fn test_oauth_provider(
    State(state): State<AppState>,
    audit: AdminAudit,
    ctx: AdminCtx,
    Path(id): Path<Uuid>,
) -> Result<Json<Value>, AppError> {
    ctx.require(keys::AUTH_PROVIDERS_READ)?;

    let provider = sqlx::query_as::<_, OAuthProvider>(
        "SELECT * FROM core.oauth_providers WHERE id = $1",
    )
    .bind(id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| {
        tracing::error!(error = %e, "test_oauth_provider: lecture");
        AppError::Database(e)
    })?
    .ok_or_else(|| AppError::NotFound("Fournisseur SSO introuvable".into()))?;

    let started = std::time::Instant::now();
    let http = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(15))
        .build()
        .map_err(|e| AppError::Internal(e.into()))?;

    let result = match oauth::discover(&http, &provider.issuer_url).await {
        Ok(disc) => json!({
            "ok": true,
            "message": "Document de découverte récupéré",
            "issuer_url": provider.issuer_url,
            "authorization_endpoint": disc.authorization_endpoint,
            "token_endpoint": disc.token_endpoint,
            "userinfo_endpoint": disc.userinfo_endpoint,
            "end_session_endpoint": disc.end_session_endpoint,
            "has_secret": !provider.client_secret_enc.is_empty(),
            "claims": {
                "username": provider.claim_username,
                "email": provider.claim_email,
                "display_name": provider.claim_display_name,
                "groups": provider.claim_groups,
                "sync_groups": provider.sync_groups,
            },
            "elapsed_ms": started.elapsed().as_millis() as u64,
        }),
        Err(e) => json!({
            "ok": false,
            "message": "Découverte OIDC échouée",
            // The provider's own answer, truncated and verbatim: the useful part
            // is usually its 404 body or the TLS alert, not our phrasing.
            "detail": crate::directory::client::truncate(&e.to_string()),
            "hint": "L'URL d'émetteur doit être la BASE, sans « /.well-known/openid-configuration » : \
                     le core l'ajoute. Pour Keycloak, elle finit par /realms/<realm>.",
            "issuer_url": provider.issuer_url,
            "elapsed_ms": started.elapsed().as_millis() as u64,
        }),
    };

    audit
        .record(
            &state.db,
            AuditEntry::new("core.auth_providers.test")
                .target(target::OAUTH_PROVIDER, provider.id, provider.display_name.clone())
                .detail(
                    result
                        .get("message")
                        .and_then(|v| v.as_str())
                        .unwrap_or("essai")
                        .to_string(),
                ),
        )
        .await;

    Ok(Json(result))
}
