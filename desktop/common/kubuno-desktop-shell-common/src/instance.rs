//! Kubuno Desktop runs **once per user session** (`desktop/README.md`, "Single instance").
//!
//! The key is the user and the session only ([`InstanceKey::per_session`]): not the profile, not the data
//! directory, not the executable's path. A release, a development build and a copy from another folder all find
//! each other. A second launch hands its command line to the running instance (which shows and focuses its window,
//! and honours `--page`), then exits with code 0 without a splash screen; a launch with `--background` (the start
//! at logon) changes nothing in a running instance.
//!
//! The only way to run a second shell is a **developer instance**, compiled in debug builds only (or with the
//! `dev-instance` feature, which release packaging never enables): `--dev-instance <name>` or
//! `KUBUNO_DEV_INSTANCE=<name>` (agents running a sandboxed shell, `KUBUNO_SANDBOX_DIR`, pass one: a sandbox alone is
//! still the session's instance), and, in those builds, the offline sample of a debugging session (F5). Each
//! developer instance is single too, under its name.

use std::sync::{Mutex, PoisonError};


use kubuno_desktop_single_instance::{acquire, Activation, InstanceKey, Outcome, Primary};

/// The program name of the key.
pub const APP: &str = "kubuno-desktop";
/// The flag of a developer instance (debug builds, or the `dev-instance` feature).
pub const DEV_INSTANCE_FLAG: &str = "--dev-instance";
/// The variable of a developer instance (debug builds, or the `dev-instance` feature).
pub const DEV_INSTANCE_ENV: &str = "KUBUNO_DEV_INSTANCE";

/// Whether this build honours developer instances.
pub const DEV_INSTANCES_ALLOWED: bool = cfg!(any(debug_assertions, feature = "dev-instance"));

/// The developer instance named by the launch, if this build allows them (`allowed`) and it names one: the flag,
/// else the variable, else the offline sample.
pub fn dev_instance_name(allowed: bool, args: &[String], env: Option<&str>, sample: bool) -> Option<String> {
    if !allowed {
        return None;
    }
    let flag = args.iter().position(|a| a == DEV_INSTANCE_FLAG).and_then(|i| args.get(i + 1)).map(|s| s.trim().to_string());
    flag.filter(|s| !s.is_empty() && !s.starts_with("--"))
        .or_else(|| env.map(str::trim).filter(|s| !s.is_empty()).map(str::to_string))
        .or_else(|| sample.then(|| "sample".to_string()))
}

/// The key of this launch.
pub fn key_for(args: &[String], sample: bool) -> InstanceKey {
    let env = std::env::var(DEV_INSTANCE_ENV).ok();
    match dev_instance_name(DEV_INSTANCES_ALLOWED, args, env.as_deref(), sample) {
        Some(name) => InstanceKey::dev(APP, &name),
        None => InstanceKey::per_session(APP),
    }
}

/// What the start does after [`claim`].
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Claim {
    /// This process is the instance: run.
    Run,
    /// Another instance took over (or cannot be reached): exit with this code without showing anything.
    Exit(i32),
}

/// The instance this process holds, kept for the life of the process.
static PRIMARY: Mutex<Option<Primary>> = Mutex::new(None);

type Handler = Box<dyn Fn(Activation) + Send>;

/// Who acts on a later launch, and what arrived before there was one.
struct Inbox {
    handler: Option<Handler>,
    pending: Vec<Activation>,
}

static INBOX: Mutex<Inbox> = Mutex::new(Inbox { handler: None, pending: Vec::new() });

fn deliver(activation: Activation) {
    let mut inbox = INBOX.lock().unwrap_or_else(PoisonError::into_inner);
    match inbox.handler.as_ref() {
        Some(handler) => handler(activation),
        None => inbox.pending.push(activation),
    }
}

/// Takes the session's instance, or hands this launch to the running one. Must run on the thread that lives as
/// long as the process (the main thread): on Windows the lock belongs to it.
pub fn claim(args: &[String], sample: bool) -> Claim {
    let key = key_for(args, sample);
    let activation = Activation { args: args.to_vec(), cwd: std::env::current_dir().ok().map(|d| d.to_string_lossy().into_owned()) };
    match acquire(&key, &activation, kubuno_desktop_single_instance::DEFAULT_WAIT) {
        Ok(Outcome::Primary(mut primary)) => {
            if key.scope() == "dev" {
                tracing::info!("[shell] developer instance {} (debug build): other Kubuno Desktop instances may run", key.digest());
            }
            // Served at once, before the window exists: a launch during the start-up is queued, not kept waiting.
            primary.serve(deliver);
            *PRIMARY.lock().unwrap_or_else(PoisonError::into_inner) = Some(primary);
            Claim::Run
        }
        Ok(Outcome::Forwarded { pid }) => {
            tracing::info!("[shell] Kubuno Desktop already runs (process {pid}): this launch was handed to it ({args:?})");
            Claim::Exit(0)
        }
        Ok(Outcome::Unreachable(e)) => {
            tracing::error!("[shell] Kubuno Desktop already runs but does not answer ({e}); not starting a second one");
            Claim::Exit(1)
        }
        Err(e) => {
            // The lock itself failed (no runtime directory…): better a shell than none.
            tracing::error!("[shell] the single-instance lock is unavailable ({e}); starting anyway");
            Claim::Run
        }
    }
}

/// Sets who acts on a later launch (the window, once it exists; called on any thread, `handler` runs on a
/// background thread). Launches that arrived before are delivered now, in order.
pub fn on_activation(handler: impl Fn(Activation) + Send + 'static) {
    let mut inbox = INBOX.lock().unwrap_or_else(PoisonError::into_inner);
    for activation in std::mem::take(&mut inbox.pending) {
        handler(activation);
    }
    inbox.handler = Some(Box::new(handler));
}


#[cfg(test)]
mod tests {
    use super::*;

    const TEST_WAIT: std::time::Duration = std::time::Duration::from_secs(5);

    fn args(list: &[&str]) -> Vec<String> {
        list.iter().map(|s| s.to_string()).collect()
    }

    #[test]
    fn a_release_build_never_runs_a_developer_instance() {
        let a = args(&["--dev-instance", "agent-1"]);
        assert_eq!(dev_instance_name(false, &a, Some("x"), true), None, "everything is ignored when not allowed");
    }

    #[test]
    fn developer_instances_are_explicit() {
        assert_eq!(dev_instance_name(true, &args(&[]), None, false), None, "a plain launch is the session's instance");
        assert_eq!(dev_instance_name(true, &args(&["--page", "settings"]), None, false), None);
        assert_eq!(dev_instance_name(true, &args(&["--dev-instance", "agent-1"]), Some("env"), true).as_deref(), Some("agent-1"));
        assert_eq!(dev_instance_name(true, &args(&["--dev-instance", "--page"]), Some("env"), false).as_deref(), Some("env"), "a flag without a value");
        assert_eq!(dev_instance_name(true, &args(&[]), Some(" "), false), None, "a blank variable is no opt-in");
        assert_eq!(dev_instance_name(true, &args(&[]), None, true).as_deref(), Some("sample"));
    }

    #[test]
    fn the_session_key_does_not_depend_on_the_profile() {
        // Same user and session, whatever the data directory: one key (a sandboxed profile included; the developer instances aside).
        if DEV_INSTANCES_ALLOWED && (std::env::var(DEV_INSTANCE_ENV).is_ok()) {
            return;
        }
        assert_eq!(key_for(&args(&[]), false), InstanceKey::per_session(APP));
        assert_eq!(key_for(&args(&["--page", "settings", "--background"]), false), InstanceKey::per_session(APP));
        assert_eq!(key_for(&args(&["--dev-instance", "a"]), false) == InstanceKey::per_session(APP), !DEV_INSTANCES_ALLOWED);
    }

    #[test]
    fn launches_before_the_window_are_queued_then_delivered_in_order() {
        deliver(Activation { args: args(&["--page", "settings"]), cwd: None });
        deliver(Activation { args: args(&["--page", "activity"]), cwd: None });
        let (tx, rx) = std::sync::mpsc::channel();
        on_activation(move |a| {
            let _ = tx.send(a.args.join(" "));
        });
        assert_eq!(rx.recv_timeout(TEST_WAIT).ok().as_deref(), Some("--page settings"));
        assert_eq!(rx.recv_timeout(TEST_WAIT).ok().as_deref(), Some("--page activity"));
        deliver(Activation { args: args(&["--background"]), cwd: None });
        assert_eq!(rx.recv_timeout(TEST_WAIT).ok().as_deref(), Some("--background"));
    }
}
