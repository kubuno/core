//! The Windows implementations of the portable app's extension points
//! (`kubuno_desktop_shell_common::platform`): the Documents known folder, and the `Run` key of a start at logon.

use std::path::PathBuf;

use kubuno_desktop_shell_common::platform::{Folders, Platform, SystemIntegration};

/// The user's folders, from the Windows known folders.
pub struct WindowsFolders;

impl Folders for WindowsFolders {
    fn documents_dir(&self) -> Option<PathBuf> {
        use windows::Win32::UI::Shell::{FOLDERID_Documents, SHGetKnownFolderPath, KF_FLAG_DEFAULT};
        // SAFETY: a valid KNOWNFOLDERID; the returned string is freed below.
        let p = unsafe { SHGetKnownFolderPath(&FOLDERID_Documents, KF_FLAG_DEFAULT, None) }.ok()?;
        // SAFETY: on success `p` is a NUL-terminated UTF-16 string allocated by the API.
        let s = unsafe { p.to_string() }.ok();
        // SAFETY: freeing the buffer the API allocated.
        unsafe { windows::Win32::System::Com::CoTaskMemFree(Some(p.0 as *const _)) };
        s.map(PathBuf::from)
    }
}

/// What the shell registers with Windows at start.
pub struct WindowsIntegration;

impl SystemIntegration for WindowsIntegration {
    fn refresh_autostart(&self) {
        crate::services::settings::refresh_autostart_command();
    }
}

/// The Windows platform: the portable defaults with what Windows does better.
pub fn windows_platform() -> Platform {
    Platform { name: "windows", folders: Box::new(WindowsFolders), integration: Box::new(WindowsIntegration) }
}
