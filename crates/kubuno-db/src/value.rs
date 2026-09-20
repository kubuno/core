//! A bind parameter that is not tied to any one engine.
//!
//! sqlx's `.bind()` is monomorphic: `Query<'q, Postgres, _>` only accepts
//! values that `Encode` for PostgreSQL. With the engine chosen at run time we
//! do not know which of the three that is until we hold the pool, so a bound
//! value is carried as a [`DbValue`] and encoded against the concrete driver at
//! the moment of execution (see `exec.rs`).
//!
//! Every variant wraps an `Option`, so a `NULL` keeps its column type: binding
//! `DbValue::Uuid(None)` sends a typed NULL, which PostgreSQL — strict about
//! parameter types — needs, where a bare untyped NULL of the wrong type would
//! be refused.

use chrono::{DateTime, NaiveDate, Utc};
use serde_json::Value as JsonValue;
use uuid::Uuid;

/// One bind parameter, engine-agnostic. Build these with [`params!`] rather
/// than by hand.
#[derive(Debug, Clone, PartialEq)]
pub enum DbValue {
    /// An untyped SQL `NULL`. Prefer a typed `None` (e.g. `Uuid(None)`) so the
    /// parameter carries a type; this exists only for the rare literal NULL of
    /// no particular column.
    Null,
    Bool(Option<bool>),
    I16(Option<i16>),
    I32(Option<i32>),
    I64(Option<i64>),
    F32(Option<f32>),
    F64(Option<f64>),
    Text(Option<String>),
    Blob(Option<Vec<u8>>),
    Uuid(Option<Uuid>),
    Json(Option<JsonValue>),
    DateTimeUtc(Option<DateTime<Utc>>),
    NaiveDate(Option<NaiveDate>),
}

macro_rules! from_scalar {
    ($t:ty, $variant:ident) => {
        impl From<$t> for DbValue {
            fn from(v: $t) -> Self {
                DbValue::$variant(Some(v))
            }
        }
        impl From<Option<$t>> for DbValue {
            fn from(v: Option<$t>) -> Self {
                DbValue::$variant(v)
            }
        }
    };
}

from_scalar!(bool, Bool);
from_scalar!(i16, I16);
from_scalar!(i32, I32);
from_scalar!(i64, I64);
from_scalar!(f32, F32);
from_scalar!(f64, F64);
from_scalar!(String, Text);
from_scalar!(Vec<u8>, Blob);
from_scalar!(Uuid, Uuid);
from_scalar!(JsonValue, Json);
from_scalar!(DateTime<Utc>, DateTimeUtc);
from_scalar!(NaiveDate, NaiveDate);

// Borrowed forms that turn up at call sites (`&str`, a `&Uuid` field, …).
impl From<&str> for DbValue {
    fn from(v: &str) -> Self {
        DbValue::Text(Some(v.to_owned()))
    }
}
impl From<&String> for DbValue {
    fn from(v: &String) -> Self {
        DbValue::Text(Some(v.clone()))
    }
}
impl From<Option<&str>> for DbValue {
    fn from(v: Option<&str>) -> Self {
        DbValue::Text(v.map(str::to_owned))
    }
}
impl From<&Uuid> for DbValue {
    fn from(v: &Uuid) -> Self {
        DbValue::Uuid(Some(*v))
    }
}
impl From<&[u8]> for DbValue {
    fn from(v: &[u8]) -> Self {
        DbValue::Blob(Some(v.to_vec()))
    }
}

/// Builds a `Vec<DbValue>` from a comma-separated list, in bind order.
///
/// ```ignore
/// db.execute("UPDATE keestore.vaults SET last_accessed_at = $1 WHERE owner_id = $2",
///            params![now, user_id]).await?;
/// ```
#[macro_export]
macro_rules! params {
    () => { ::std::vec::Vec::<$crate::DbValue>::new() };
    ($($v:expr),+ $(,)?) => {
        ::std::vec![$($crate::DbValue::from($v)),+]
    };
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn scalars_and_options_convert() {
        assert_eq!(DbValue::from(7i64), DbValue::I64(Some(7)));
        assert_eq!(DbValue::from(None::<i64>), DbValue::I64(None));
        assert_eq!(DbValue::from("x"), DbValue::Text(Some("x".into())));
        let u = Uuid::nil();
        assert_eq!(DbValue::from(&u), DbValue::Uuid(Some(u)));
    }

    #[test]
    fn params_macro_orders_and_counts() {
        let u = Uuid::nil();
        let p = params![u, 3i64, "s"];
        assert_eq!(p.len(), 3);
        assert_eq!(p[1], DbValue::I64(Some(3)));
        assert!(params![].is_empty());
    }
}
