//! Kubuno Desktop for Windows (`kubuno-desktop.exe`) — `Program.cs`: the portable app of desktop/common
//! (`kubuno_desktop_shell_common::app::run`) with the Windows platform registered and the Win32 window as its
//! user interface. Everything else is in the library (`lib.rs`) and in the common app.
//!
//! `kubuno-desktop.exe [--background] [--sample|--live] [--light|--dark] [--culture fr|en] [--no-splash]
//! [--page launcher|settings|accounts|activity|labels|login|admin[:<section>]]`
//!
//! `--background` is the start at logon (the `Run` key): hidden in the notification area, no
//! splash screen. `--sample` shows the offline sample: fixed data, no server, nothing read from or
//! written to the configuration, nothing registered with the system. A Debug build started under a
//! debugger (F5) runs the sample by default; `--live` opts out.

// A GUI application: no console window, in Debug too (like a Windows Forms `WinExe`). Its logs,
// `println!`s and panics go to the debugger's Output window or to %LOCALAPPDATA%\Kubuno\logs.
#![windows_subsystem = "windows"]

fn main() {
    kubuno_desktop::ui::diagnostics::set_display_name("Kubuno Desktop");
    let ui = kubuno_desktop_shell::platform::ui_host::WindowsUi::from_args();
    let code = kubuno_desktop_shell_common::app::run(kubuno_desktop_shell::platform::system::windows_platform(), &ui);
    std::process::exit(code);
}
