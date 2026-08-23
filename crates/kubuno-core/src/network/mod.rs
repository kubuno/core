//! HTTP / HTTPS configuration managed from the administration console.
//!
//! The core keeps terminating TLS with **rustls** (memory-safe, audited, already
//! a dependency); nothing here reimplements any part of TLS. This module only:
//!
//!   * reads the instance's `network.*` settings ([`config`]),
//!   * stores the certificate the server should serve, with its private key
//!     encrypted at rest ([`cert`]),
//!   * holds the live TLS state and builds/reloads the rustls config
//!     ([`runtime`]).
//!
//! Turning HTTPS on/off or moving a port binds or unbinds a socket and therefore
//! needs a restart; replacing the certificate and changing HSTS take effect
//! live via [`runtime::reload_certificate`] and [`runtime::refresh_runtime`].

pub mod cert;
pub mod config;
pub mod runtime;

pub use config::{NetworkConfig, TlsMinVersion};
pub use runtime::TlsRuntime;
