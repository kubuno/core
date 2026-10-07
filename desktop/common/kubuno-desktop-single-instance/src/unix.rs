//! The Linux and macOS backend: `flock` on a lock file for the lock, a Unix domain socket for the hand-off, both in
//! a per-user runtime directory (`0700`, owner checked); the socket is `0600` and each peer's uid must be ours.

use std::fs::{File, OpenOptions};
use std::io;
use std::os::fd::AsRawFd;
use std::os::unix::fs::{MetadataExt, OpenOptionsExt, PermissionsExt};
use std::os::unix::net::{UnixListener, UnixStream};
use std::path::PathBuf;
use std::time::{Duration, Instant};

use crate::key::InstanceKey;

fn effective_uid() -> u32 {
    // SAFETY: geteuid has no preconditions and cannot fail.
    unsafe { libc::geteuid() }
}

/// The user part of a key: the uid.
pub(crate) fn user_marker() -> String {
    effective_uid().to_string()
}

/// The session part of a key: the login session (`XDG_SESSION_ID`, set by logind) on Linux; macOS has one GUI
/// session per user.
pub(crate) fn session_marker() -> String {
    if cfg!(target_os = "macos") {
        return String::new();
    }
    std::env::var("XDG_SESSION_ID").unwrap_or_default()
}

/// The per-user directory of the lock files and sockets: `$XDG_RUNTIME_DIR/kubuno` on Linux, else
/// `<temp>/kubuno-<uid>` (on macOS `$TMPDIR` is already per user). Created `0700`; refused when another user owns it.
fn runtime_dir() -> io::Result<PathBuf> {
    let xdg = std::env::var_os("XDG_RUNTIME_DIR").filter(|v| !v.is_empty()).map(PathBuf::from).filter(|p| p.is_absolute());
    let dir = match xdg {
        Some(run) if cfg!(not(target_os = "macos")) => run.join("kubuno"),
        _ => std::env::temp_dir().join(format!("kubuno-{}", effective_uid())),
    };
    match std::fs::create_dir(&dir) {
        Ok(()) => std::fs::set_permissions(&dir, std::fs::Permissions::from_mode(0o700))?,
        Err(e) if e.kind() == io::ErrorKind::AlreadyExists => {}
        Err(e) => return Err(e),
    }
    let meta = std::fs::symlink_metadata(&dir)?;
    if !meta.is_dir() || meta.uid() != effective_uid() {
        return Err(io::Error::new(io::ErrorKind::PermissionDenied, format!("{} is not a directory of this user", dir.display())));
    }
    if meta.mode() & 0o077 != 0 {
        std::fs::set_permissions(&dir, std::fs::Permissions::from_mode(0o700))?;
    }
    Ok(dir)
}

fn lock_path(key: &InstanceKey) -> io::Result<PathBuf> {
    Ok(runtime_dir()?.join(format!("{}.lock", key.object_name())))
}

fn socket_path(key: &InstanceKey) -> io::Result<PathBuf> {
    Ok(runtime_dir()?.join(format!("{}.sock", key.object_name())))
}

/// The instance lock: an exclusive `flock` on the lock file, released by the kernel when the process ends.
pub(crate) struct Lock {
    _file: File,
}

impl Lock {
    /// Takes the lock of `key`, or `None` when another process (or another descriptor of this one) holds it.
    pub(crate) fn try_acquire(key: &InstanceKey) -> io::Result<Option<Lock>> {
        let file = OpenOptions::new().read(true).write(true).create(true).truncate(false).mode(0o600).open(lock_path(key)?)?;
        // SAFETY: a valid descriptor owned by `file`.
        if unsafe { libc::flock(file.as_raw_fd(), libc::LOCK_EX | libc::LOCK_NB) } == 0 {
            return Ok(Some(Lock { _file: file }));
        }
        let e = io::Error::last_os_error();
        if e.kind() == io::ErrorKind::WouldBlock {
            Ok(None)
        } else {
            Err(e)
        }
    }
}

/// The uid and pid of a connected peer.
fn peer(stream: &UnixStream) -> io::Result<(u32, u32)> {
    #[cfg(any(target_os = "linux", target_os = "android"))]
    {
        let mut cred = libc::ucred { pid: 0, uid: 0, gid: 0 };
        let mut len = std::mem::size_of::<libc::ucred>() as libc::socklen_t;
        // SAFETY: `cred` and `len` describe a writable ucred, as SO_PEERCRED expects.
        let rc = unsafe { libc::getsockopt(stream.as_raw_fd(), libc::SOL_SOCKET, libc::SO_PEERCRED, (&mut cred as *mut libc::ucred).cast(), &mut len) };
        if rc != 0 {
            return Err(io::Error::last_os_error());
        }
        Ok((cred.uid, u32::try_from(cred.pid).unwrap_or(0)))
    }
    #[cfg(not(any(target_os = "linux", target_os = "android")))]
    {
        let (mut uid, mut gid) = (0, 0);
        // SAFETY: plain query with two writable integers.
        if unsafe { libc::getpeereid(stream.as_raw_fd(), &mut uid, &mut gid) } != 0 {
            return Err(io::Error::last_os_error());
        }
        Ok((uid, 0))
    }
}

/// The hand-off endpoint.
pub(crate) struct Listener {
    listener: UnixListener,
}

impl Listener {
    /// Binds the socket. Called under the lock: a socket file left by a crashed instance is removed first.
    pub(crate) fn bind(key: &InstanceKey) -> io::Result<Listener> {
        let path = socket_path(key)?;
        match std::fs::remove_file(&path) {
            Ok(()) => tracing::info!(path = %path.display(), "single instance: removed the socket a previous instance left behind"),
            Err(e) if e.kind() == io::ErrorKind::NotFound => {}
            Err(e) => return Err(e),
        }
        let listener = UnixListener::bind(&path)?;
        std::fs::set_permissions(&path, std::fs::Permissions::from_mode(0o600))?;
        Ok(Listener { listener })
    }

    /// Waits for the next launch of the same user (others are dropped).
    pub(crate) fn accept(&mut self) -> io::Result<UnixStream> {
        loop {
            let (stream, _) = self.listener.accept()?;
            match peer(&stream) {
                Ok((uid, _)) if uid == effective_uid() => return Ok(stream),
                Ok((uid, pid)) => tracing::warn!(uid, pid, "single instance: a connection of another user was refused"),
                Err(e) => tracing::warn!(error = %e, "single instance: the peer of a connection cannot be identified; refused"),
            }
        }
    }
}

/// Connects to the running instance's socket; the stream and the server's process id (0 when unknown).
pub(crate) fn connect(key: &InstanceKey, deadline: Instant) -> io::Result<(UnixStream, u32)> {
    let path = socket_path(key)?;
    loop {
        match UnixStream::connect(&path) {
            Ok(stream) => {
                let (uid, pid) = peer(&stream)?;
                if uid != effective_uid() {
                    return Err(io::Error::new(io::ErrorKind::PermissionDenied, "the instance socket belongs to another user"));
                }
                return Ok((stream, pid));
            }
            // Not bound yet (the instance is starting) or left by a crashed one (the next primary removes it).
            Err(e) if Instant::now() < deadline && matches!(e.kind(), io::ErrorKind::NotFound | io::ErrorKind::ConnectionRefused) => {
                std::thread::sleep(Duration::from_millis(50));
            }
            Err(e) => return Err(e),
        }
    }
}

/// Nothing to grant on Unix: the window system decides (a running app activates its own window).
pub(crate) fn allow_foreground(_pid: u32) {}
