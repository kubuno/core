//! User provisioning for OAuth / OIDC sign-ins: lookup, local-account linking,
//! account creation and username uniqueness.

use crate::errors::AppError;

/// Find a user by (provider, sub), or link a local account sharing the verified
/// email. Returns `None` if neither matches (caller decides whether to create).
pub(super) async fn find_oauth_user(
    db:       &sqlx::PgPool,
    provider: &str,
    sub:      &str,
    email:    &str,
) -> Result<Option<crate::models::user::User>, AppError> {
    // 1. By (provider, oauth_id)
    if let Some(user) = sqlx::query_as::<_, crate::models::user::User>(
        "SELECT * FROM core.users WHERE oauth_provider = $1 AND oauth_id = $2 AND is_active = TRUE",
    )
    .bind(provider)
    .bind(sub)
    .fetch_optional(db)
    .await?
    {
        return Ok(Some(user));
    }

    // 2. Link a pre-existing local account with the same email.
    if let Some(user) = sqlx::query_as::<_, crate::models::user::User>(
        "UPDATE core.users SET oauth_provider = $1, oauth_id = $2, email_verified = TRUE
         WHERE email = $3 AND is_active = TRUE
         RETURNING *",
    )
    .bind(provider)
    .bind(sub)
    .bind(email)
    .fetch_optional(db)
    .await?
    {
        tracing::info!(user_id = %user.id, provider = %provider, "Compte local lié au SSO");
        return Ok(Some(user));
    }

    Ok(None)
}

pub(super) async fn create_oauth_user(
    db:                 &sqlx::PgPool,
    provider:           &str,
    sub:                &str,
    email:              &str,
    preferred_username: Option<&str>,
    display_name:       Option<&str>,
) -> Result<crate::models::user::User, AppError> {
    let base_username = preferred_username
        .filter(|u| !u.is_empty())
        .unwrap_or(email.split('@').next().unwrap_or("user"));
    let username = unique_username(db, base_username).await?;

    // The identity provider does not place people in the tree, so this account
    // goes to the root — which is a place, unlike the NULL it used to get. An
    // account outside the tree is invisible to every DELEGATED administrator and
    // resolves `auth.methods` at INSTANCE level, skipping every unit-level value:
    // a policy that does not list `sso` there would lock out, the next day,
    // somebody the provider had just authenticated. Migration 000091:17-21
    // described that trap for the LDAP path; 000107 closes it for all of them.
    let root_unit = crate::database::seed::root_org_unit(db).await;

    // An account provisioned by a first SSO sign-in is an account like any other:
    // it receives the configured default rather than a constant, resolved from
    // the unit it is created in.
    let quota = crate::models::user::default_quota_for(db, root_unit).await;

    let user = sqlx::query_as::<_, crate::models::user::User>(
        r#"INSERT INTO core.users
               (email, username, display_name, oauth_provider, oauth_id, email_verified,
                quota_bytes, org_unit_id)
           VALUES ($1, $2, $3, $4, $5, TRUE, $6, $7)
           RETURNING *"#,
    )
    .bind(email)
    .bind(&username)
    .bind(display_name)
    .bind(provider)
    .bind(sub)
    .bind(quota)
    .bind(root_unit)
    .fetch_one(db)
    .await?;

    tracing::info!(user_id = %user.id, username = %username, provider = %provider, "Nouveau compte créé via SSO");
    Ok(user)
}

/// Places the account in the groups the identity provider claimed, and removes
/// it from the ones this provider granted and no longer claims.
///
/// Same discipline as the LDAP synchroniser, and for the same reason: rows the
/// import created carry `source = 'directory'` and are the only ones it may
/// take back. A membership an operator granted by hand survives every sign-in,
/// and survives the provider being detached.
///
/// Best-effort: a group that cannot be created must not cost somebody their
/// session. The failure is logged and the sign-in continues.
pub(super) async fn apply_claimed_groups(
    db:       &sqlx::PgPool,
    provider: &str,
    user_id:  uuid::Uuid,
    claimed:  &[String],
) {
    let mut ids: Vec<uuid::Uuid> = Vec::new();

    for name in claimed {
        // A claim value can be anything the provider felt like sending —
        // `/ventes`, a URN, a UUID. Trimmed and bounded; not otherwise
        // interpreted, because guessing at somebody else's naming scheme is how
        // two different groups end up merged.
        // `core.user_groups.name` is VARCHAR(100), and a colliding claim gets a
        // « (provider) » suffix below — so the base is cut short enough for that
        // suffix to still fit.
        let budget = 100usize.saturating_sub(provider.chars().count() + 12).max(8);
        let name: String = name.trim().trim_start_matches('/').chars().take(budget).collect();
        if name.is_empty() {
            continue;
        }

        // ⚠️ Matched on (provider, name) and NEVER on the name alone. Adopting a
        // group by name would let an identity provider claim `Administrateurs`
        // and drop whoever signed in into the seeded administrators group — a
        // privilege escalation with a one-line claim. A group this provider does
        // not already own is created fresh, under a name that is free.
        let existing = sqlx::query_scalar::<_, uuid::Uuid>(
            "SELECT id FROM core.user_groups WHERE oauth_provider_slug = $1 AND name = $2",
        )
        .bind(provider)
        .bind(&name)
        .fetch_optional(db)
        .await;

        let existing = match existing {
            Ok(v) => v,
            Err(e) => {
                tracing::error!(error = %e, group = %name, "SSO : recherche du groupe revendiqué");
                continue;
            }
        };
        if let Some(id) = existing {
            ids.push(id);
            continue;
        }

        // The instance-wide name is unique, so a collision with a group somebody
        // else owns is disambiguated rather than merged into.
        let mut candidate = name.clone();
        for attempt in 0..3 {
            let taken = sqlx::query_scalar::<_, bool>(
                "SELECT EXISTS(SELECT 1 FROM core.user_groups WHERE name = $1)",
            )
            .bind(&candidate)
            .fetch_one(db)
            .await;
            match taken {
                Ok(false) => break,
                Ok(true) if attempt == 0 => candidate = format!("{name} ({provider})"),
                Ok(true) => {
                    candidate = format!(
                        "{name} ({provider}-{})",
                        uuid::Uuid::new_v4().simple().to_string().chars().take(6).collect::<String>()
                    )
                }
                Err(e) => {
                    tracing::error!(error = %e, group = %name, "SSO : test d'unicité du nom de groupe");
                    candidate.clear();
                    break;
                }
            }
        }
        if candidate.is_empty() {
            continue;
        }

        let created = sqlx::query_scalar::<_, uuid::Uuid>(
            r#"INSERT INTO core.user_groups (name, description, oauth_provider_slug)
               VALUES ($1, $2, $3)
               ON CONFLICT (name) DO NOTHING
               RETURNING id"#,
        )
        .bind(&candidate)
        .bind(format!("Importé du fournisseur SSO « {provider} »"))
        .bind(provider)
        .fetch_optional(db)
        .await;

        match created {
            Ok(Some(id)) => ids.push(id),
            // Lost a race with a concurrent sign-in: the other one created it.
            Ok(None) => {
                if let Ok(Some(id)) = sqlx::query_scalar::<_, uuid::Uuid>(
                    "SELECT id FROM core.user_groups WHERE oauth_provider_slug = $1 AND name = $2",
                )
                .bind(provider)
                .bind(&candidate)
                .fetch_optional(db)
                .await
                {
                    ids.push(id);
                }
            }
            Err(e) => {
                tracing::error!(error = %e, group = %candidate, "SSO : import du groupe revendiqué");
            }
        }
    }

    if let Err(e) = sqlx::query(
        "INSERT INTO core.user_group_members (group_id, user_id, source)
         SELECT g, $1, 'directory' FROM UNNEST($2::uuid[]) AS g
         ON CONFLICT (group_id, user_id) DO NOTHING",
    )
    .bind(user_id)
    .bind(&ids)
    .execute(db)
    .await
    {
        tracing::error!(error = %e, user_id = %user_id, "SSO : adhésions revendiquées");
    }

    // Only what this provider granted, and only for this person.
    if let Err(e) = sqlx::query(
        "DELETE FROM core.user_group_members m
          USING core.user_groups g
          WHERE m.group_id = g.id
            AND m.user_id = $1
            AND m.source = 'directory'
            AND g.oauth_provider_slug = $2
            AND NOT (m.group_id = ANY($3))",
    )
    .bind(user_id)
    .bind(provider)
    .bind(&ids)
    .execute(db)
    .await
    {
        tracing::error!(error = %e, user_id = %user_id, "SSO : retrait des adhésions non revendiquées");
    }
}

async fn unique_username(db: &sqlx::PgPool, base: &str) -> Result<String, AppError> {
    // Nettoyer : minuscules, alphanumériques + tirets/underscores uniquement
    let base: String = base
        .chars()
        .filter(|c| c.is_alphanumeric() || *c == '_' || *c == '-')
        .take(40)
        .collect();
    let base = if base.is_empty() { "user".to_string() } else { base.to_lowercase() };

    let exists: bool = sqlx::query_scalar("SELECT EXISTS(SELECT 1 FROM core.users WHERE username = $1)")
        .bind(&base)
        .fetch_one(db)
        .await?;

    if !exists {
        return Ok(base);
    }

    // Ajouter un suffixe numérique
    for i in 2u32..=999 {
        let candidate = format!("{base}{i}");
        let exists: bool = sqlx::query_scalar("SELECT EXISTS(SELECT 1 FROM core.users WHERE username = $1)")
            .bind(&candidate)
            .fetch_one(db)
            .await?;
        if !exists {
            return Ok(candidate);
        }
    }

    // Cas extrêmement rare — suffixe UUID court
    Ok(format!("{base}_{}", uuid::Uuid::new_v4().simple().to_string().get(..6).unwrap_or("xxx")))
}
