//! Keeps the shell's connection state honest while the server comes and goes.
//!
//! The window's connection state (the rail's dot, the launcher's server line and sync card, the header) comes from
//! the last launcher refresh. Before this module nothing refreshed it after a failure: a server down for a few
//! minutes left « Serveur injoignable » on screen for good, while the file sync, on its own 30 s poll, had long
//! reconnected. Now, while the server is unreachable, the window re-checks it on a capped exponential backoff that
//! never stops (2 s, 4 s, 8 s… then every 60 s), and at once when something says it may be back: the network
//! changed, the window got the focus, the user clicked « Synchroniser maintenant » ([`poke`], which also cuts the
//! token owner's own refresh cooldown short). While it is reachable, a light re-check runs every
//! [`ONLINE_RECHECK`], and sooner after file-sync activity ([`recheck`]: a failing sync shows the server down).
//!
//! [`Reconnect`] is the pure state machine (tested on a fake clock); [`start`], [`report`], [`idle`] and [`poke`]
//! run it on a background thread for the window.

use std::sync::{Condvar, Mutex, OnceLock, PoisonError};
use std::time::{Duration, Instant};

use kubuno_desktop_account::backoff::{Backoff, Retry};

/// The first re-check after a failure.
pub const FIRST_RETRY: Duration = Duration::from_secs(2);
/// The longest wait between two re-checks while the server is unreachable.
pub const MAX_RETRY: Duration = Duration::from_secs(60);
/// The shortest time between two re-checks an outside event may cause.
pub const MIN_SPACING: Duration = Duration::from_secs(2);
/// The re-check while the server is reachable (a server that goes down shows within a minute, even without file
/// activity).
pub const ONLINE_RECHECK: Duration = Duration::from_secs(60);
/// The shortest time between two re-checks the file sync's activity may cause while the server is reachable.
pub const ACTIVITY_SPACING: Duration = Duration::from_secs(30);
/// A re-check whose result never came back counts as failed after this long.
pub const PROBE_TIMEOUT: Duration = Duration::from_secs(90);

/// When the window should re-check the server (see the module doc).
#[derive(Debug, Clone)]
pub struct Reconnect {
    retry: Retry,
    reachable: Option<bool>,
    probing_since: Option<Instant>,
    last_check: Option<Instant>,
    next_check: Option<Instant>,
}

impl Default for Reconnect {
    fn default() -> Self {
        Reconnect::new()
    }
}

impl Reconnect {
    pub fn new() -> Reconnect {
        Reconnect { retry: Retry::new(Backoff::new(FIRST_RETRY, MAX_RETRY), MIN_SPACING), reachable: None, probing_since: None, last_check: None, next_check: None }
    }

    /// A re-check (a launcher refresh) starts at `now`.
    pub fn probe_started(&mut self, now: Instant) {
        self.probing_since = Some(now);
        self.last_check = Some(now);
        self.retry.attempt(now);
    }

    /// A launcher refresh ended: the server answered (`reachable`, a refused session included: that is no network
    /// matter) or not.
    pub fn reported(&mut self, reachable: bool, now: Instant) {
        self.probing_since = None;
        self.reachable = Some(reachable);
        if reachable {
            self.retry.succeeded();
            self.next_check = Some(now + ONLINE_RECHECK);
        } else {
            self.next_check = Some(self.retry.failed(now));
        }
    }

    /// Nothing to check (no account): no re-check until the next report.
    pub fn idle(&mut self) {
        self.probing_since = None;
        self.reachable = None;
        self.retry.succeeded();
        self.next_check = None;
    }

    /// Something says the server may be back: while it is unreachable, the next re-check is brought forward (at
    /// once, or [`MIN_SPACING`] after the last one). Nothing changes while it is reachable.
    pub fn poke(&mut self, now: Instant) {
        if self.reachable == Some(false) {
            self.next_check = Some(self.retry.bring_forward(now));
        }
    }

    /// The file sync reported something (a cycle, an error): re-check soon. While the server is unreachable this is a
    /// [`Reconnect::poke`]; while it is reachable the re-check comes at most every [`ACTIVITY_SPACING`].
    pub fn activity(&mut self, now: Instant) {
        match self.reachable {
            Some(false) => self.poke(now),
            Some(true) if self.probing_since.is_none() => {
                let earliest = self.last_check.map_or(now, |t| (t + ACTIVITY_SPACING).max(now));
                self.next_check = Some(self.next_check.map_or(earliest, |t| t.min(earliest)));
            }
            _ => {}
        }
    }

    /// Whether a re-check should start at `now`. A re-check that never reported for [`PROBE_TIMEOUT`] counts as a
    /// failure.
    pub fn due(&mut self, now: Instant) -> bool {
        if let Some(since) = self.probing_since {
            if now.saturating_duration_since(since) < PROBE_TIMEOUT {
                return false;
            }
            self.reported(false, now);
        }
        self.next_check.is_some_and(|t| now >= t)
    }

    /// When the driver should look again.
    pub fn next_wake(&self) -> Option<Instant> {
        match self.probing_since {
            Some(since) => Some(since + PROBE_TIMEOUT),
            None => self.next_check,
        }
    }

    /// The server's state as last reported.
    pub fn reachable(&self) -> Option<bool> {
        self.reachable
    }

    /// Consecutive failed re-checks.
    pub fn failures(&self) -> u32 {
        self.retry.failures()
    }
}

struct Driver {
    state: Mutex<Reconnect>,
    wake: Condvar,
}

static DRIVER: OnceLock<Driver> = OnceLock::new();

fn driver() -> &'static Driver {
    DRIVER.get_or_init(|| Driver { state: Mutex::new(Reconnect::new()), wake: Condvar::new() })
}

/// Starts the re-checks: `probe` runs on a background thread whenever one is due; it asks the window for a
/// launcher refresh, whose end calls [`report`] (or [`idle`]). Once per process; later calls do nothing.
pub fn start(probe: impl Fn() + Send + 'static) {
    static STARTED: OnceLock<()> = OnceLock::new();
    if STARTED.set(()).is_err() {
        return;
    }
    let spawned = std::thread::Builder::new().name("kubuno-reconnect".into()).spawn(move || {
        let d = driver();
        let mut state = d.state.lock().unwrap_or_else(PoisonError::into_inner);
        loop {
            let now = Instant::now();
            if state.due(now) {
                state.probe_started(now);
                tracing::debug!(failures = state.failures(), "[connectivity] re-checking the server");
                drop(state);
                probe();
                state = d.state.lock().unwrap_or_else(PoisonError::into_inner);
                continue;
            }
            let wait = state.next_wake().map_or(MAX_RETRY, |t| t.saturating_duration_since(now)).clamp(Duration::from_millis(50), MAX_RETRY);
            state = d.wake.wait_timeout(state, wait).unwrap_or_else(PoisonError::into_inner).0;
        }
    });
    if let Err(e) = spawned {
        tracing::error!("[connectivity] the re-check thread cannot start: {e}");
    }
}

/// The end of a launcher refresh (see [`Reconnect::reported`]).
pub fn report(reachable: bool) {
    let d = driver();
    let mut state = d.state.lock().unwrap_or_else(PoisonError::into_inner);
    let was = state.reachable();
    state.reported(reachable, Instant::now());
    if was != Some(reachable) {
        if reachable {
            tracing::info!("[connectivity] the server is reachable");
        } else {
            tracing::warn!("[connectivity] the server is unreachable: re-checking with a backoff (at most every {} s)", MAX_RETRY.as_secs());
        }
    }
    d.wake.notify_all();
}

/// The file sync reported something: re-check soon (see [`Reconnect::activity`]).
pub fn recheck() {
    let d = driver();
    d.state.lock().unwrap_or_else(PoisonError::into_inner).activity(Instant::now());
    d.wake.notify_all();
}

/// Nothing to check (no account).
pub fn idle() {
    let d = driver();
    d.state.lock().unwrap_or_else(PoisonError::into_inner).idle();
    d.wake.notify_all();
}

/// Something says the server may be back (`reason`: `network`, `focus`, `sync-now`…): re-check soon, and let the
/// token owner refresh without waiting for the end of its cooldown.
pub fn poke(reason: &str) {
    crate::services::session::retry_now();
    let d = driver();
    let mut state = d.state.lock().unwrap_or_else(PoisonError::into_inner);
    if state.reachable() == Some(false) {
        tracing::debug!("[connectivity] re-check brought forward ({reason})");
    }
    state.poke(Instant::now());
    d.wake.notify_all();
}

#[cfg(test)]
mod tests {
    use super::*;

    const S: fn(u64) -> Duration = Duration::from_secs;

    /// Drives the state machine like the driver does, on a fake clock, against a server that is down between
    /// `down.0` and `down.1` seconds. Returns the times of the re-checks.
    fn run(down: (u64, u64), until: u64, pokes: &[u64]) -> (Vec<u64>, Reconnect) {
        let t0 = Instant::now();
        let mut r = Reconnect::new();
        let mut checks = Vec::new();
        // The window's first refresh at start.
        r.probe_started(t0);
        r.reported(!(down.0 == 0), t0);
        checks.push(0);
        for s in 1..=until {
            let now = t0 + S(s);
            if pokes.contains(&s) {
                r.poke(now);
            }
            if r.due(now) {
                r.probe_started(now);
                checks.push(s);
                r.reported(!(s >= down.0 && s < down.1), now);
            }
        }
        (checks, r)
    }

    #[test]
    fn re_checks_back_off_while_down_and_never_stop() {
        // Down from the start for ten minutes.
        let (checks, r) = run((0, 600), 700, &[]);
        assert_eq!(&checks[..8], &[0, 2, 6, 14, 30, 62, 122, 182]);
        let gaps: Vec<u64> = checks.windows(2).map(|w| w[1] - w[0]).collect();
        assert!(gaps.iter().all(|g| *g <= 60), "never more than a minute apart: {gaps:?}");
        let first_up = checks.iter().copied().find(|s| *s >= 600).expect("a re-check after the server came back");
        assert!(first_up - 600 <= 60, "recovered {}s after the server came back", first_up - 600);
        assert_eq!(r.reachable(), Some(true));
        assert_eq!(r.failures(), 0);
    }

    #[test]
    fn the_report_s_outage_recovers_within_a_minute() {
        // 2026-10-07: down 14:12-14:16 (here 0-260 s after the first failure), back at 260 s.
        let (checks, r) = run((0, 260), 400, &[]);
        let first_up = checks.iter().copied().find(|s| *s >= 260).expect("re-check after recovery");
        assert!(first_up <= 320, "{checks:?}");
        assert_eq!(r.reachable(), Some(true));
    }

    #[test]
    fn a_poke_re_checks_at_once_while_down_and_never_while_up() {
        // Down 0-100 s; the window gets the focus at 101 s (the backoff alone would wait until 122 s).
        let (checks, _) = run((0, 100), 130, &[101]);
        assert!(checks.contains(&101), "{checks:?}");
        assert!(!checks.contains(&122), "the poke's success cancels the pending backoff: {checks:?}");
        // While up, pokes do not cause re-checks (only the one a minute).
        let (checks, _) = run((1000, 1001), 150, &[10, 20, 30]);
        assert_eq!(checks, vec![0, 60, 120]);
    }

    #[test]
    fn pokes_cannot_hammer_the_server() {
        let t0 = Instant::now();
        let mut r = Reconnect::new();
        r.probe_started(t0);
        r.reported(false, t0);
        // A burst of focus changes in the same second right after a failed check: one re-check, MIN_SPACING later.
        for _ in 0..10 {
            r.poke(t0 + Duration::from_millis(500));
        }
        assert!(!r.due(t0 + Duration::from_millis(900)));
        assert!(r.due(t0 + MIN_SPACING));
    }

    #[test]
    fn sync_activity_re_checks_a_reachable_server_soon_but_not_often() {
        let t0 = Instant::now();
        let mut r = Reconnect::new();
        r.probe_started(t0);
        r.reported(true, t0);
        // A sync error 5 s later: re-check 30 s after the last one, not a minute.
        r.activity(t0 + S(5));
        assert!(!r.due(t0 + S(29)));
        assert!(r.due(t0 + ACTIVITY_SPACING));
        r.probe_started(t0 + S(30));
        r.reported(false, t0 + S(30));
        // Now down: activity is a poke (after the minimum spacing).
        r.activity(t0 + S(31));
        assert!(r.due(t0 + S(32)));
    }

    #[test]
    fn a_lost_report_counts_as_a_failure() {
        let t0 = Instant::now();
        let mut r = Reconnect::new();
        r.probe_started(t0);
        assert!(!r.due(t0 + S(10)), "waiting for the report");
        assert_eq!(r.next_wake(), Some(t0 + PROBE_TIMEOUT));
        assert!(!r.due(t0 + PROBE_TIMEOUT), "timed out: counted as a failure, next check after the backoff");
        assert_eq!(r.reachable(), Some(false));
        assert!(r.due(t0 + PROBE_TIMEOUT + FIRST_RETRY));
    }

    #[test]
    fn without_an_account_nothing_is_checked() {
        let t0 = Instant::now();
        let mut r = Reconnect::new();
        r.probe_started(t0);
        r.reported(false, t0);
        r.idle();
        assert!(!r.due(t0 + S(3600)));
        assert_eq!(r.next_wake(), None);
    }
}
