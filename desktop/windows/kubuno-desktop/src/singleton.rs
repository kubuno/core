//! Windows a program opens at most once (`desktop/README.md`, "Single instance"): Settings, About,
//! the accounts, the activity, a confirmation… Opening one that is already open brings the open one to the front
//! (restored if minimised, its taskbar button flashing when the system refuses the focus) instead of creating a
//! second copy.
//!
//! ```ignore
//! // A window of its own:
//! kubuno_desktop::singleton::show("settings", || SettingsForm::new());
//! // An in-window dialog over `self` (a veil): `on_closed` only runs for the dialog this call opened.
//! if kubuno_desktop::singleton::show_in_window("confirm-delete", self, || ConfirmDialog::new(&c), on_closed) { … }
//! ```
//!
//! Keys are per UI thread (each window thread has its own registry). A form counts as open from the call until it
//! closes (its `FormClosed`, or the in-window dialog's close); one that is still not on screen after
//! [`START_TIMEOUT`] (its view failed to open) is forgotten.

use std::cell::RefCell;
use std::time::{Duration, Instant};

use crate::forms::{AsForm, DialogResult, Form};
use crate::View;

/// How long a registered form may take to open before its key is free again.
pub const START_TIMEOUT: Duration = Duration::from_secs(10);

struct Entry {
    id: u64,
    key: String,
    form: Form,
    registered: Instant,
}

thread_local! {
    static OPEN: RefCell<Vec<Entry>> = const { RefCell::new(Vec::new()) };
    static NEXT_ID: std::cell::Cell<u64> = const { std::cell::Cell::new(1) };
}

/// Whether `form` is on screen: a window of its own, or an in-window dialog of an open form.
fn is_shown(form: &Form) -> bool {
    if form.is_open() {
        return true;
    }
    crate::Application::open_forms().iter().any(|f| f.mdi_children().iter().any(|c| c == form))
}

/// The open form registered under `key` (forgetting the ones that closed).
pub fn find(key: &str) -> Option<Form> {
    OPEN.with(|open| {
        let mut open = open.borrow_mut();
        open.retain(|e| e.registered.elapsed() < START_TIMEOUT || is_shown(&e.form));
        open.iter().find(|e| e.key == key).map(|e| e.form.clone())
    })
}

/// Whether a form is open under `key`.
pub fn is_open(key: &str) -> bool {
    find(key).is_some()
}

fn register(key: &str, form: Form) -> u64 {
    let id = NEXT_ID.with(|n| {
        let id = n.get();
        n.set(id + 1);
        id
    });
    OPEN.with(|open| open.borrow_mut().push(Entry { id, key: key.to_string(), form, registered: Instant::now() }));
    id
}

fn forget(id: u64) {
    OPEN.with(|open| open.borrow_mut().retain(|e| e.id != id));
}

/// Brings `form` to the front: an in-window dialog above its siblings (and its owner window forward), a window of
/// its own shown, restored and focused.
pub fn focus(form: &Form) {
    if let Some(parent) = form.mdi_parent() {
        form.activate();
        if let Some(hwnd) = parent.handle() {
            kubuno_desktop_single_instance::windows::bring_to_front(hwnd);
        }
        return;
    }
    // An in-window dialog opened over a veil (`show_in_window`) has no MDI parent: bring its owner forward.
    let owner = crate::Application::open_forms().into_iter().find(|f| f.mdi_children().iter().any(|c| c == form));
    if let Some(owner) = owner {
        form.activate();
        if let Some(hwnd) = owner.handle() {
            kubuno_desktop_single_instance::windows::bring_to_front(hwnd);
        }
        return;
    }
    form.set_visible(true);
    if let Some(hwnd) = form.handle() {
        kubuno_desktop_single_instance::windows::bring_to_front(hwnd);
    }
}

/// Opens the view `make` builds in a window of its own (`View::show`), unless a form is already open under `key`:
/// then that one comes to the front and `make` is not called. Returns whether a new window was opened.
pub fn show<V: View + 'static>(key: &str, make: impl FnOnce() -> V) -> bool {
    if let Some(form) = find(key) {
        focus(&form);
        return false;
    }
    let view = make();
    let id = register(key, view.form().clone());
    view.form().form_closed().subscribe(move |_, _| forget(id));
    view.show();
    true
}

/// Opens the view `make` builds as an in-window dialog over `owner` (`View::show_in_window`), unless one is
/// already open under `key`: then that one comes to the front, `make` is not called and `on_closed` is dropped
/// (the open dialog keeps its own). Returns whether a new dialog was opened.
pub fn show_in_window<V: View + 'static>(key: &str, owner: &dyn AsForm, make: impl FnOnce() -> V, on_closed: impl FnOnce(DialogResult) + 'static) -> bool {
    if let Some(form) = find(key) {
        focus(&form);
        return false;
    }
    let view = make();
    let id = register(key, view.form().clone());
    view.show_in_window(owner, move |result| {
        forget(id);
        on_closed(result);
    });
    true
}
