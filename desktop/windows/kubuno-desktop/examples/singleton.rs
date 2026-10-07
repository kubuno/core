//! Windows opened at most once (`kubuno_desktop::singleton`): « Settings » opens a window of its own and « Confirm »
//! an in-window dialog; clicking either again while it is open brings the open one to the front instead of a copy.
//!
//! `cargo run -p kubuno-desktop --example singleton` (add `-- --auto` to run the scripted check: it opens each
//! one three times, re-opens Settings once it is on screen, logs how many copies exist, closes Settings and opens it
//! again, then quits).
#![windows_subsystem = "windows"]

use std::time::Duration;

use kubuno_desktop::prelude::*;

fn settings_window() -> Form {
    let form = Form::new().text("Settings").client_size(320.0, 120.0).start_position(StartPosition::CenterScreen);
    form.controls().add(&Label::new().text("One Settings window, whatever the clicks.").bounds(16.0, 16.0, 288.0, 24.0));
    form
}

fn confirm_dialog() -> Form {
    let form = Form::new().text("Confirm").client_size(280.0, 100.0);
    let ok = Button::new().text("OK").dialog_result(DialogResult::Ok).bounds(176.0, 48.0, 88.0, 36.0);
    form.controls().add(&ok);
    form.set_accept_button(&ok);
    form
}

fn open_settings() -> bool {
    let opened = kubuno_desktop::singleton::show("example-settings", settings_window);
    kubuno_desktop::tracing::info!("[singleton] settings: {}", if opened { "opened" } else { "already open, focused" });
    opened
}

fn open_confirm(owner: &Form) -> bool {
    let opened = kubuno_desktop::singleton::show_in_window("example-confirm", owner, confirm_dialog, |r| kubuno_desktop::tracing::info!("[singleton] confirm closed: {r:?}"));
    kubuno_desktop::tracing::info!("[singleton] confirm: {}", if opened { "opened" } else { "already open, focused" });
    opened
}

/// The distinct open forms titled `title` (windows of their own and in-window dialogs).
fn copies(title: &str) -> usize {
    let mut seen: Vec<Form> = Vec::new();
    for f in kubuno_desktop::Application::open_forms() {
        for c in std::iter::once(f.clone()).chain(f.mdi_children()) {
            if c.get_text() == title && !seen.contains(&c) {
                seen.push(c);
            }
        }
    }
    seen.len()
}

fn main() -> kubuno_desktop::Result {
    let form = Form::new().text("Singleton windows").client_size(360.0, 140.0).start_position(StartPosition::CenterScreen);
    let settings = Button::new().text("Settings").bounds(16.0, 16.0, 120.0, 36.0);
    let confirm = Button::new().text("Confirm").bounds(144.0, 16.0, 120.0, 36.0);
    form.controls().add_range(&[&settings, &confirm]);
    settings.click().subscribe(|_s, _e| {
        open_settings();
    });
    let owner = form.clone();
    confirm.click().subscribe(move |_s, _e| {
        open_confirm(&owner);
    });

    if std::env::args().any(|a| a == "--auto") {
        form.shown().subscribe(|sender: &Form, _e| {
            let results: Vec<bool> = (0..3).map(|_| open_settings()).collect();
            let dialogs: Vec<bool> = (0..3).map(|_| open_confirm(sender)).collect();
            kubuno_desktop::tracing::info!("[singleton] three opens of each: settings {results:?}, confirm {dialogs:?}");
            let Some(ui) = sender.dispatcher() else { return };
            std::thread::spawn(move || {
                std::thread::sleep(Duration::from_millis(1500));
                drop(ui.begin_invoke(|_f: &mut Form| {
                    let again = open_settings();
                    kubuno_desktop::tracing::info!(
                        "[singleton] once on screen: re-open = {again}; copies: settings {}, confirm {}",
                        copies("Settings"),
                        copies("Confirm")
                    );
                }));
                std::thread::sleep(Duration::from_millis(500));
                // Closed, the key is free again: the next open creates a window.
                drop(ui.begin_invoke(|_f: &mut Form| {
                    if let Some(s) = kubuno_desktop::singleton::find("example-settings") {
                        s.close();
                    }
                }));
                std::thread::sleep(Duration::from_millis(800));
                drop(ui.begin_invoke(|_f: &mut Form| {
                    let reopened = open_settings();
                    kubuno_desktop::tracing::info!("[singleton] after closing Settings: re-open = {reopened}");
                }));
                std::thread::sleep(Duration::from_millis(1000));
                drop(ui.begin_invoke(|_f: &mut Form| kubuno_desktop::Application::exit()));
            });
        });
    }
    kubuno_desktop::Application::run(form)
}
