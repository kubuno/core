//! The hand-off between two launches, in one process: the lock is per descriptor (Unix) or per thread (Windows),
//! so a second `acquire` from another thread meets the first one exactly as a second process would.

use std::sync::mpsc;
use std::time::Duration;

use kubuno_desktop_single_instance::{acquire, Activation, InstanceKey, Outcome};

fn unique_key(name: &str) -> InstanceKey {
    InstanceKey::dev("si-test", &format!("{name}-{}", std::process::id()))
}

fn activation(args: &[&str]) -> Activation {
    Activation { args: args.iter().map(|s| s.to_string()).collect(), cwd: Some("/work".into()) }
}

#[test]
fn a_second_launch_hands_its_arguments_to_the_first() {
    let key = unique_key("handoff");
    let (got_tx, got_rx) = mpsc::channel();
    let (done_tx, done_rx) = mpsc::channel::<()>();
    let primary_key = key.clone();
    // The first instance lives on its own thread (on Windows the mutex belongs to the thread that took it).
    let primary = std::thread::spawn(move || {
        let Outcome::Primary(mut primary) = acquire(&primary_key, &activation(&[]), Duration::from_secs(2)).expect("acquire") else {
            panic!("the first launch must be the instance");
        };
        assert!(primary.can_serve());
        primary.serve(move |a| {
            let _ = got_tx.send(a);
        });
        let _ = done_rx.recv();
        drop(primary);
    });
    // Give the first instance its lock (a launch racing it would simply wait for its pipe).
    std::thread::sleep(Duration::from_millis(200));
    let second = acquire(&key, &activation(&["--page", "settings", "C:\\docs\\a.kbdoc"]), Duration::from_secs(5)).expect("acquire");
    match second {
        Outcome::Forwarded { pid } => assert_eq!(pid, std::process::id()),
        other => panic!("the second launch must be forwarded: {other:?}"),
    }
    let got = got_rx.recv_timeout(Duration::from_secs(5)).expect("the instance got the activation");
    assert_eq!(got.args, vec!["--page", "settings", "C:\\docs\\a.kbdoc"]);
    assert_eq!(got.cwd.as_deref(), Some("/work"));
    // A third launch is forwarded too (the endpoint is re-armed after each hand-off).
    assert!(matches!(acquire(&key, &activation(&["--background"]), Duration::from_secs(5)).expect("acquire"), Outcome::Forwarded { .. }));
    assert!(got_rx.recv_timeout(Duration::from_secs(5)).expect("third").has("--background"));
    // Released: the next launch is the instance.
    let _ = done_tx.send(());
    primary.join().expect("primary thread");
    match acquire(&key, &activation(&[]), Duration::from_secs(2)).expect("acquire") {
        Outcome::Primary(_) => {}
        other => panic!("after the instance ended, a launch must become the instance: {other:?}"),
    }
}

/// Run by [`a_killed_instance_never_blocks_the_next_launch`] in a child process: holds the key named by
/// `SI_TEST_HOLDER` and serves it until killed. A no-op in a normal test run.
#[test]
fn holder_child() {
    let Ok(name) = std::env::var("SI_TEST_HOLDER") else { return };
    let key = InstanceKey::dev("si-test", &name);
    let Outcome::Primary(mut primary) = acquire(&key, &Activation::default(), Duration::from_secs(2)).expect("acquire") else {
        panic!("the child must be the instance");
    };
    primary.serve(|_| {});
    std::thread::sleep(Duration::from_secs(60));
}

#[test]
fn a_killed_instance_never_blocks_the_next_launch() {
    let name = format!("killed-{}", std::process::id());
    let key = InstanceKey::dev("si-test", &name);
    let mut child = std::process::Command::new(std::env::current_exe().expect("test exe"))
        .args(["--exact", "holder_child", "--nocapture", "--test-threads=1"])
        .env("SI_TEST_HOLDER", &name)
        .spawn()
        .expect("spawn the holder");
    // Wait until the child holds the key and answers.
    let mut forwarded = false;
    for _ in 0..50 {
        if let Outcome::Forwarded { pid } = acquire(&key, &Activation::default(), Duration::from_millis(300)).expect("acquire") {
            assert_eq!(pid, child.id());
            forwarded = true;
            break;
        }
        std::thread::sleep(Duration::from_millis(100));
    }
    assert!(forwarded, "the child never became the instance");
    // kill -9 / TerminateProcess: no destructor runs, the OS alone releases the lock.
    child.kill().expect("kill");
    let _ = child.wait();
    let started = std::time::Instant::now();
    match acquire(&key, &Activation::default(), Duration::from_secs(5)).expect("acquire") {
        Outcome::Primary(p) => assert!(p.can_serve(), "the endpoint is re-created"),
        other => panic!("after a crash the next launch must become the instance: {other:?}"),
    }
    assert!(started.elapsed() < Duration::from_secs(2), "took {:?}", started.elapsed());
}

#[test]
fn different_keys_run_side_by_side() {
    let a = unique_key("side-a");
    let b = unique_key("side-b");
    let first = acquire(&a, &Activation::default(), Duration::from_secs(1)).expect("a");
    let second = acquire(&b, &Activation::default(), Duration::from_secs(1)).expect("b");
    assert!(matches!(first, Outcome::Primary(_)) && matches!(second, Outcome::Primary(_)));
}
