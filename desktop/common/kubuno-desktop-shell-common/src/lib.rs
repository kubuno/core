//! Kubuno Desktop, the portable app.
//!
//! What the shell does on every operating system is written once, here: the start-up sequence
//! ([`app::run`]), the accounts of the machine and the token broker the other apps borrow from
//! ([`services::session`]), the door to the sync engine with its offline sample ([`services::backend`]) and the
//! activity log ([`services::activity`]). What only an operating system can do goes through the extension points
//! of [`platform`], each with a portable default; an OS folder (`desktop/windows`, `desktop/linux`,
//! `desktop/macos`) overrides only what it does better, in the [`platform::Platform`] its entry point hands to
//! [`app::run`], together with its user interface ([`platform::UiHost`]).

pub mod app;
pub mod instance;
pub mod platform;
pub mod services;
