//! The work and the state behind the shell's views, portable: the sync engine's door (`backend`, or the
//! offline sample), the accounts (`session`), the activity log (`activity`) and the connection re-checks
//! (`connectivity`).

pub mod activity;
pub mod backend;
pub mod connectivity;
pub mod session;
