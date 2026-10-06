//! The platform extension points of Kubuno Desktop.
//!
//! The app is written once (this crate); what only an operating system can do goes through the traits below.
//! Each trait has a portable default, so the app builds and runs on any system with nothing registered; an OS
//! folder overrides only what it does better, in the [`Platform`] its entry point hands to [`crate::app::run`].
//!
//! | Extension point | Portable default | Windows override (`desktop/windows/kubuno-desktop-shell`) |
//! |---|---|---|
//! | [`Folders`] | `Documents` in the home directory | the Documents known folder |
//! | [`SystemIntegration`] | nothing registered with the system | the `Run` key of a start at logon |
//! | [`UiHost`] | a text summary of the sync folders ([`crate::app::TextUi`]) | the Win32 window, splash screen and tray |

use std::path::PathBuf;
use std::sync::OnceLock;

use crate::app::Launch;

/// The user's folders.
pub trait Folders: Send + Sync {
    /// The user's Documents folder, where « Exporter » copies unsent changes before a sign-out.
    /// Default: `Documents` in the home directory (`HOME`, else `USERPROFILE`), when it exists.
    fn documents_dir(&self) -> Option<PathBuf> {
        let home = std::env::var_os("HOME").or_else(|| std::env::var_os("USERPROFILE"))?;
        let documents = PathBuf::from(home).join("Documents");
        documents.is_dir().then_some(documents)
    }
}

/// What the shell registers with the system.
pub trait SystemIntegration: Send + Sync {
    /// Brings an existing start-at-logon entry up to date (called once at start, outside the sample).
    /// Default: nothing is registered, so there is nothing to refresh.
    fn refresh_autostart(&self) {}
}

/// The steps of a start an interface may show (a splash screen's status line).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum StartStep {
    /// The accounts are being loaded (credentials, token owner, broker).
    Accounts,
    /// The main window is being built.
    Window,
}

/// The user interface: what shows the app to the user and runs until it closes.
pub trait UiHost {
    /// What the command line asked for. Default: [`Launch::from_env`].
    fn launch(&self) -> Launch {
        Launch::from_env()
    }

    /// Called first, before the accounts are loaded (a splash screen, the language, COM…). Default: nothing.
    fn prepare(&self, _launch: &Launch) {}

    /// A step of the start. Default: nothing.
    fn step(&self, _step: StartStep) {}

    /// Runs the interface until it closes; returns the process exit code.
    fn run(&self, launch: &Launch) -> i32;
}

/// The portable default of every service.
#[derive(Debug, Default, Clone, Copy)]
pub struct Portable;

impl Folders for Portable {}
impl SystemIntegration for Portable {}

/// The services of one platform, handed to [`crate::app::run`] by the entry point.
pub struct Platform {
    /// A short name for logs (`windows`, `linux`, `macos`, `portable`).
    pub name: &'static str,
    pub folders: Box<dyn Folders>,
    pub integration: Box<dyn SystemIntegration>,
}

impl Platform {
    /// The portable defaults: what Linux and macOS run today.
    pub fn portable() -> Platform {
        Platform { name: "portable", folders: Box::new(Portable), integration: Box::new(Portable) }
    }
}

static CURRENT: OnceLock<Platform> = OnceLock::new();

/// Registers the platform of this process; `false` when one was registered already (the first one stays).
pub fn install(platform: Platform) -> bool {
    CURRENT.set(platform).is_ok()
}

/// The registered platform, or the portable defaults when none was (tests, a library use).
pub fn current() -> &'static Platform {
    CURRENT.get_or_init(Platform::portable)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn the_portable_platform_registers_nothing() {
        let platform = Platform::portable();
        assert_eq!(platform.name, "portable");
        platform.integration.refresh_autostart();
        if let Some(documents) = platform.folders.documents_dir() {
            assert!(documents.ends_with("Documents"));
        }
    }
}
