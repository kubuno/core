//! The work and the state behind the views, which the views do not draw: the sync engine's door
//! (`backend`, or the offline sample), the accounts (`session`), the background sync loop (`sync`), the
//! launcher's fetch (`apps`) with its offline cache of logos, avatar and module list (`logos`), the activity log (`activity`), the preferences (`settings`), the waffle's
//! favourites (`favorites`), the command line (`options`) and the connection re-checks (`connectivity`).

pub mod activity;
pub mod apps;
pub mod favorites;
pub mod logos;
pub mod options;
pub mod settings;
pub mod sync;

// The portable app (desktop/common/kubuno-desktop-shell-common): the sync engine's door with its offline sample,
// and the accounts. Re-exported under their former paths, which the views use.
pub use kubuno_desktop_shell_common::services::{backend, connectivity, session};
