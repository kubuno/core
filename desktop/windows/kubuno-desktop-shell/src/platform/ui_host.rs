//! The Windows user interface of Kubuno Desktop: the splash screen, then the main form ([`ShellWindow`]), as the
//! portable app's [`UiHost`] (`kubuno_desktop_shell_common::app::run` calls it).

use std::sync::OnceLock;

use kubuno_desktop::View;
use kubuno_desktop_shell_common::app::Launch;
use kubuno_desktop_shell_common::platform::{StartStep, UiHost};

use crate::{Options, Resources, ShellWindow};

/// The Win32 window, its splash screen and the rest of the shell's command line (`--page`, `--light`/`--dark`,
/// `--culture`).
pub struct WindowsUi {
    options: Options,
    splash: OnceLock<kubuno_desktop::Splash>,
}

impl WindowsUi {
    /// Reads the process's command line (the sample by default in a Debug build under a debugger).
    pub fn from_args() -> WindowsUi {
        WindowsUi { options: Options::from_args(), splash: OnceLock::new() }
    }

    fn splash_step(&self, status: &str, progress: f32) {
        if let Some(splash) = self.splash.get() {
            splash.step(status, progress);
        }
    }
}

impl UiHost for WindowsUi {
    fn launch(&self) -> Launch {
        Launch { background: self.options.background, sample: self.options.sample }
    }

    fn prepare(&self, launch: &Launch) {
        if let Some(culture) = &self.options.culture {
            kubuno_desktop::resources::set_culture(culture);
        }
        // The splash screen, first of all: it paints on its own thread while the rest starts, and fades out once
        // the window is on screen. None at logon, when the shell starts hidden in the notification area.
        let splash = kubuno_desktop::SplashScreen::new()
            .artwork(kubuno_desktop::Artwork::Kubuno)
            .product("Kubuno Desktop")
            .version(env!("CARGO_PKG_VERSION"))
            .license(env!("CARGO_PKG_LICENSE"))
            .enabled(!launch.background)
            .show();
        crate::set_splash(splash.clone());
        let _ = self.splash.set(splash);
        // COM is initialised here too because the engine may reach the shell's COM objects (the folder picker,
        // WinRT) before the window exists.
        // SAFETY: initialising COM on this thread has no memory-safety requirement; a second initialisation by the
        // host is a harmless no-op.
        unsafe {
            let _ = windows::Win32::System::Com::CoInitializeEx(None, windows::Win32::System::Com::COINIT_APARTMENTTHREADED);
        }
    }

    fn step(&self, step: StartStep) {
        match step {
            StartStep::Accounts => self.splash_step(Resources::splash_accounts(), 0.12),
            StartStep::Window => self.splash_step(Resources::splash_window(), 0.3),
        }
    }

    fn run(&self, _launch: &Launch) -> i32 {
        let window = ShellWindow::new(self.options.clone());
        kubuno_desktop::Application::set_theme(crate::services::settings::theme());
        self.splash_step(Resources::splash_open(), 0.55);
        if let Some(splash) = self.splash.get() {
            splash.close_when(window.form());
        }
        match kubuno_desktop::Application::run(window) {
            Ok(()) => 0,
            Err(e) => {
                kubuno_desktop::tracing::error!("[shell] {e}");
                1
            }
        }
    }
}
