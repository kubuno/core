//! The network changed (a cable, Wi-Fi, a VPN, waking from sleep): the window re-checks the server at once
//! instead of waiting for its backoff (`kubuno_desktop_shell_common::services::connectivity`).
//!
//! `NotifyNetworkConnectivityHintChange` calls back on a system thread whenever the connectivity level changes; the
//! callback only posts [`WM_NETWORK_CHANGED`] to the window, whose hook (`ShellWindow::install_hooks`) does the rest.

use std::sync::atomic::{AtomicIsize, Ordering};

use windows::Win32::Foundation::{HANDLE, HWND, LPARAM, NO_ERROR, WPARAM};
use windows::Win32::NetworkManagement::IpHelper::NotifyNetworkConnectivityHintChange;
use windows::Win32::Networking::WinSock::NL_NETWORK_CONNECTIVITY_HINT;
use windows::Win32::UI::WindowsAndMessaging::{PostMessageW, WM_APP};

/// Posted to the window when the network's connectivity changed (`WM_APP + 4`).
pub const WM_NETWORK_CHANGED: u32 = WM_APP + 4;

/// The window the notifications go to.
static TARGET: AtomicIsize = AtomicIsize::new(0);

unsafe extern "system" fn changed(_context: *const core::ffi::c_void, hint: NL_NETWORK_CONNECTIVITY_HINT) {
    let hwnd = TARGET.load(Ordering::Relaxed);
    if hwnd == 0 {
        return;
    }
    kubuno_desktop::tracing::debug!("[network] connectivity changed: level {}", hint.ConnectivityLevel.0);
    // SAFETY: posting to a window handle (possibly stale, which then fails harmlessly) has no memory-safety
    // requirement.
    unsafe {
        let _ = PostMessageW(Some(HWND(hwnd as *mut _)), WM_NETWORK_CHANGED, WPARAM(0), LPARAM(0));
    }
}

/// Starts posting [`WM_NETWORK_CHANGED`] to `hwnd`. Once per process: the registration lives as long as it.
pub fn watch(hwnd: isize) {
    if TARGET.swap(hwnd, Ordering::Relaxed) != 0 {
        return;
    }
    let mut handle = HANDLE::default();
    // SAFETY: `changed` is a valid callback for the whole process (the registration is never cancelled), the
    // context is unused, `handle` receives the registration.
    let status = unsafe { NotifyNetworkConnectivityHintChange(Some(changed), None, false, &mut handle) };
    if status != NO_ERROR {
        kubuno_desktop::tracing::warn!("[network] connectivity changes cannot be watched (error {}): the re-checks keep their backoff", status.0);
    }
}
