/// Rôles disponibles dans le système.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Role {
    Guest,
    User,
    Admin,
}

impl Role {
    pub fn from_str(s: &str) -> Self {
        match s {
            "admin" => Role::Admin,
            "guest" => Role::Guest,
            _ => Role::User,
        }
    }

    pub fn can_admin(&self) -> bool {
        *self == Role::Admin
    }
}
