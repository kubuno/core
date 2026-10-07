//! A capped exponential backoff that never gives up: `first`, then doubling after each consecutive failure, up to
//! `max`, for as long as the failures last; one success starts over. It holds no clock: callers pass `now` where it
//! matters ([`Retry`]), which is what lets the tests drive it with a fake clock.

use std::time::{Duration, Instant};

/// Consecutive failures and the delay they call for.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Backoff {
    first: Duration,
    max: Duration,
    failures: u32,
}

impl Backoff {
    /// `first` after the first failure, doubling up to `max` (`max` wins when it is the smaller).
    pub const fn new(first: Duration, max: Duration) -> Backoff {
        Backoff { first, max, failures: 0 }
    }

    /// Records a failure; the delay before the next attempt.
    pub fn failure(&mut self) -> Duration {
        self.failures = self.failures.saturating_add(1);
        self.delay()
    }

    /// Records a success: the next failure waits `first` again.
    pub fn success(&mut self) {
        self.failures = 0;
    }

    /// Consecutive failures so far.
    pub fn failures(&self) -> u32 {
        self.failures
    }

    /// The delay the current run of failures calls for (zero without failure).
    pub fn delay(&self) -> Duration {
        if self.failures == 0 {
            return Duration::ZERO;
        }
        let shift = (self.failures - 1).min(20);
        self.first.saturating_mul(1u32 << shift).min(self.max)
    }
}

/// When to try again: a [`Backoff`] anchored on the last attempt, which an outside event (the network came back,
/// the user asked) can bring forward, never more often than `min_spacing`.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Retry {
    backoff: Backoff,
    min_spacing: Duration,
    last_attempt: Option<Instant>,
    next: Option<Instant>,
}

impl Retry {
    pub const fn new(backoff: Backoff, min_spacing: Duration) -> Retry {
        Retry { backoff, min_spacing, last_attempt: None, next: None }
    }

    /// An attempt starts at `now`.
    pub fn attempt(&mut self, now: Instant) {
        self.last_attempt = Some(now);
    }

    /// The attempt failed at `now`: the next one is due after the backoff's delay.
    pub fn failed(&mut self, now: Instant) -> Instant {
        let next = now + self.backoff.failure();
        self.next = Some(next);
        next
    }

    /// The attempt succeeded: nothing is due.
    pub fn succeeded(&mut self) {
        self.backoff.success();
        self.next = None;
    }

    /// Whether an attempt may run at `now` (no failure pending, or its delay is over).
    pub fn ready(&self, now: Instant) -> bool {
        self.next.is_none_or(|t| now >= t)
    }

    /// When the next attempt is due, while failing.
    pub fn next(&self) -> Option<Instant> {
        self.next
    }

    /// An outside event asks to try again now: the pending delay is cut short unless the last attempt was less
    /// than `min_spacing` ago (then the attempt is due at the end of that spacing). The failure count stays, so a
    /// new failure keeps backing off. Returns when the attempt is due.
    pub fn bring_forward(&mut self, now: Instant) -> Instant {
        let earliest = self.last_attempt.map_or(now, |t| (t + self.min_spacing).max(now));
        let due = self.next.map_or(earliest, |t| t.min(earliest));
        if self.next.is_some() {
            self.next = Some(due);
        }
        due
    }

    /// Consecutive failures so far.
    pub fn failures(&self) -> u32 {
        self.backoff.failures()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const S: fn(u64) -> Duration = Duration::from_secs;

    #[test]
    fn the_delay_doubles_up_to_the_cap_and_never_stops() {
        let mut b = Backoff::new(S(2), S(60));
        let delays: Vec<u64> = (0..10).map(|_| b.failure().as_secs()).collect();
        assert_eq!(delays, [2, 4, 8, 16, 32, 60, 60, 60, 60, 60]);
        for _ in 0..1000 {
            b.failure();
        }
        assert_eq!(b.delay(), S(60), "still retrying, every minute, after a thousand failures");
        b.success();
        assert_eq!((b.failures(), b.delay()), (0, Duration::ZERO));
        assert_eq!(b.failure(), S(2), "a success starts over");
        assert_eq!(Backoff::new(S(5), S(1)).failure(), S(1), "the cap wins over the first delay");
    }

    /// The outage of the 2026-10-07 report on a fake clock: the server is down for four minutes, the attempts back
    /// off, and the first attempt after the server returns comes at most one cap later; the user's click brings it
    /// forward at once.
    #[test]
    fn an_outage_on_a_fake_clock() {
        let t0 = Instant::now();
        let at = |s: u64| t0 + S(s);
        let server_up = |t: Instant| t < at(0) || t >= at(260);
        let mut retry = Retry::new(Backoff::new(S(2), S(60)), S(2));
        let mut now = at(0);
        let mut attempts = Vec::new();
        loop {
            retry.attempt(now);
            attempts.push((now - t0).as_secs());
            if server_up(now) {
                retry.succeeded();
                break;
            }
            now = retry.failed(now);
            assert!(now - t0 < S(400), "the attempts never stop before the server is back");
        }
        assert_eq!(attempts, [0, 2, 6, 14, 30, 62, 122, 182, 242, 302]);
        assert!(*attempts.last().unwrap_or(&0) - 260 <= 60, "recovered at most one cap after the server came back");

        // Same outage, but the user clicks « Synchroniser maintenant » at 265 s (the server is back since 260 s).
        let mut retry = Retry::new(Backoff::new(S(2), S(60)), S(2));
        for s in [0, 2, 6, 14, 30, 62, 122, 182, 242] {
            retry.attempt(at(s));
            retry.failed(at(s));
        }
        assert_eq!(retry.next(), Some(at(302)));
        assert!(!retry.ready(at(265)));
        assert_eq!(retry.bring_forward(at(265)), at(265), "the click retries at once");
        assert!(retry.ready(at(265)));
        assert_eq!(retry.failures(), 9, "the count stays: a new failure keeps backing off");
    }

    #[test]
    fn bringing_forward_respects_the_minimum_spacing() {
        let t0 = Instant::now();
        let mut retry = Retry::new(Backoff::new(Duration::from_secs(30), Duration::from_secs(60)), Duration::from_secs(5));
        retry.attempt(t0);
        retry.failed(t0);
        // A focus event one second after the failed attempt: due at the end of the spacing, not at once.
        assert_eq!(retry.bring_forward(t0 + Duration::from_secs(1)), t0 + Duration::from_secs(5));
        assert!(!retry.ready(t0 + Duration::from_secs(4)));
        assert!(retry.ready(t0 + Duration::from_secs(5)));
        // Nothing pending: an event never schedules anything by itself.
        let mut idle = Retry::new(Backoff::new(Duration::from_secs(2), Duration::from_secs(60)), Duration::from_secs(2));
        idle.bring_forward(t0);
        assert_eq!(idle.next(), None);
        assert!(idle.ready(t0));
    }
}
