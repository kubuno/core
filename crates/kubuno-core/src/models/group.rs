use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use validator::Validate;

#[derive(Debug, Clone, Serialize, FromRow)]
pub struct UserGroup {
    pub id:          Uuid,
    pub name:        String,
    pub description: Option<String>,
    pub permissions: serde_json::Value,  // Vec<String> sérialisé
    pub is_default:  bool,
    pub is_system:   bool,               // groupe protégé, non supprimable
    pub created_at:  DateTime<Utc>,
    pub updated_at:  DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, FromRow)]
pub struct UserGroupMember {
    pub group_id:  Uuid,
    pub user_id:   Uuid,
    pub added_at:  DateTime<Utc>,
    pub added_by:  Option<Uuid>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct CreateGroupDto {
    #[validate(length(min = 1, max = 100, message = "Nom: 1-100 caractères"))]
    pub name:        String,
    pub description: Option<String>,
    #[serde(default)]
    pub permissions: Vec<String>,
    #[serde(default)]
    pub is_default:  bool,
}

#[derive(Debug, Deserialize, Validate)]
pub struct UpdateGroupDto {
    #[validate(length(min = 1, max = 100, message = "Nom: 1-100 caractères"))]
    pub name:        Option<String>,
    pub description: Option<String>,
    pub permissions: Option<Vec<String>>,
    pub is_default:  Option<bool>,
}
