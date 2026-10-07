//! The Windows backend: a named mutex for the lock, a named pipe for the hand-off (both with a DACL granting the
//! current user only, both named after the user's SID and session through the key's digest), and the window
//! helpers a running instance uses to come to the front.

use std::io::{self, Read, Write};
use std::time::{Duration, Instant};

use windows_sys::Win32::Foundation::{
    CloseHandle, GetLastError, LocalFree, ERROR_FILE_NOT_FOUND, ERROR_PIPE_BUSY, ERROR_PIPE_CONNECTED, GENERIC_READ, GENERIC_WRITE, HANDLE, HWND,
    INVALID_HANDLE_VALUE, WAIT_ABANDONED, WAIT_OBJECT_0, WAIT_TIMEOUT,
};
use windows_sys::Win32::Security::Authorization::{ConvertSidToStringSidW, ConvertStringSecurityDescriptorToSecurityDescriptorW, SDDL_REVISION_1};
use windows_sys::Win32::Security::{
    GetTokenInformation, TokenUser, PSECURITY_DESCRIPTOR, SECURITY_ATTRIBUTES, TOKEN_QUERY, TOKEN_USER,
};
use windows_sys::Win32::Storage::FileSystem::{
    CreateFileW, FlushFileBuffers, ReadFile, WriteFile, FILE_FLAG_FIRST_PIPE_INSTANCE, OPEN_EXISTING, PIPE_ACCESS_DUPLEX, SECURITY_IDENTIFICATION,
    SECURITY_SQOS_PRESENT,
};
use windows_sys::Win32::System::Pipes::{
    ConnectNamedPipe, CreateNamedPipeW, DisconnectNamedPipe, GetNamedPipeServerProcessId, WaitNamedPipeW, PIPE_READMODE_BYTE,
    PIPE_REJECT_REMOTE_CLIENTS, PIPE_TYPE_BYTE, PIPE_UNLIMITED_INSTANCES, PIPE_WAIT,
};
use windows_sys::Win32::System::RemoteDesktop::ProcessIdToSessionId;
use windows_sys::Win32::System::Threading::{CreateMutexW, GetCurrentProcess, GetCurrentProcessId, OpenProcessToken, ReleaseMutex, WaitForSingleObject};
use windows_sys::Win32::UI::WindowsAndMessaging::{
    AllowSetForegroundWindow, BringWindowToTop, EnumWindows, FlashWindowEx, GetForegroundWindow, GetWindow, GetWindowLongPtrW, GetWindowThreadProcessId,
    IsIconic, IsWindowVisible, SetForegroundWindow, ShowWindow, FLASHWINFO, FLASHW_ALL, FLASHW_TIMERNOFG, GWL_EXSTYLE, GW_OWNER, SW_RESTORE, SW_SHOW,
    WS_EX_TOOLWINDOW,
};

use crate::key::InstanceKey;

fn wide(s: &str) -> Vec<u16> {
    s.encode_utf16().chain(std::iter::once(0)).collect()
}

/// The current user's SID in string form (`S-1-5-21-…`), or an empty string when it cannot be read.
fn current_user_sid() -> io::Result<String> {
    let mut token: HANDLE = std::ptr::null_mut();
    // SAFETY: the pseudo-handle of the current process; `token` receives a handle closed below.
    if unsafe { OpenProcessToken(GetCurrentProcess(), TOKEN_QUERY, &mut token) } == 0 {
        return Err(io::Error::last_os_error());
    }
    let result = (|| {
        let mut len = 0u32;
        // SAFETY: size query with a null buffer, as documented.
        unsafe { GetTokenInformation(token, TokenUser, std::ptr::null_mut(), 0, &mut len) };
        if len == 0 {
            return Err(io::Error::last_os_error());
        }
        // u64 elements keep the buffer aligned for TOKEN_USER.
        let mut buf = vec![0u64; (len as usize).div_ceil(8)];
        // SAFETY: `buf` holds at least `len` bytes.
        if unsafe { GetTokenInformation(token, TokenUser, buf.as_mut_ptr().cast(), len, &mut len) } == 0 {
            return Err(io::Error::last_os_error());
        }
        // SAFETY: GetTokenInformation(TokenUser) filled a TOKEN_USER at the start of `buf`.
        let sid = unsafe { (*(buf.as_ptr() as *const TOKEN_USER)).User.Sid };
        let mut text: *mut u16 = std::ptr::null_mut();
        // SAFETY: `sid` points into `buf`, alive for the call; `text` is LocalAlloc'ed by the API.
        if unsafe { ConvertSidToStringSidW(sid, &mut text) } == 0 || text.is_null() {
            return Err(io::Error::last_os_error());
        }
        // SAFETY: `text` is a NUL-terminated UTF-16 string returned by the API, freed right after.
        let s = unsafe {
            let mut n = 0usize;
            while *text.add(n) != 0 {
                n += 1;
            }
            let s = String::from_utf16_lossy(std::slice::from_raw_parts(text, n));
            LocalFree(text.cast());
            s
        };
        Ok(s)
    })();
    // SAFETY: `token` was opened above.
    unsafe { CloseHandle(token) };
    result
}

/// The user part of a key: the SID.
pub(crate) fn user_marker() -> String {
    current_user_sid().unwrap_or_else(|e| {
        tracing::warn!(error = %e, "single instance: the user SID cannot be read; the key falls back to the user name");
        std::env::var("USERNAME").unwrap_or_default()
    })
}

/// The session part of a key: the Terminal Services session id of this process.
pub(crate) fn session_marker() -> String {
    let mut session = 0u32;
    // SAFETY: plain query of the current process's session.
    if unsafe { ProcessIdToSessionId(GetCurrentProcessId(), &mut session) } == 0 {
        return String::new();
    }
    session.to_string()
}

/// A security descriptor granting full access to the current user only.
struct UserOnly {
    descriptor: PSECURITY_DESCRIPTOR,
    attributes: SECURITY_ATTRIBUTES,
}

impl UserOnly {
    fn new() -> io::Result<UserOnly> {
        let sddl = wide(&format!("D:P(A;;GA;;;{})", current_user_sid()?));
        let mut descriptor: PSECURITY_DESCRIPTOR = std::ptr::null_mut();
        // SAFETY: `sddl` is NUL-terminated; `descriptor` receives a LocalAlloc'ed block freed in Drop.
        let ok = unsafe { ConvertStringSecurityDescriptorToSecurityDescriptorW(sddl.as_ptr(), SDDL_REVISION_1, &mut descriptor, std::ptr::null_mut()) };
        if ok == 0 || descriptor.is_null() {
            return Err(io::Error::last_os_error());
        }
        let attributes = SECURITY_ATTRIBUTES { nLength: std::mem::size_of::<SECURITY_ATTRIBUTES>() as u32, lpSecurityDescriptor: descriptor, bInheritHandle: 0 };
        Ok(UserOnly { descriptor, attributes })
    }

    fn as_ptr(&self) -> *const SECURITY_ATTRIBUTES {
        &self.attributes
    }
}

impl Drop for UserOnly {
    fn drop(&mut self) {
        // SAFETY: allocated by ConvertStringSecurityDescriptorToSecurityDescriptorW.
        unsafe { LocalFree(self.descriptor) };
    }
}

fn mutex_name(key: &InstanceKey) -> String {
    format!(r"Local\{}", key.object_name())
}

fn pipe_name(key: &InstanceKey) -> String {
    format!(r"\\.\pipe\{}", key.object_name())
}

/// The instance lock: a named mutex owned by the thread that took it. The OS marks it *abandoned* when that thread
/// or its process ends without releasing it, and the next launch takes it then (a crash never blocks a launch).
pub(crate) struct Lock {
    mutex: HANDLE,
}

// SAFETY: a mutex handle is a kernel object reference, usable from any thread (only the release needs the owner).
unsafe impl Send for Lock {}

impl Lock {
    /// Takes the lock of `key`, or `None` when another thread or process holds it.
    pub(crate) fn try_acquire(key: &InstanceKey) -> io::Result<Option<Lock>> {
        let name = wide(&mutex_name(key));
        let security = UserOnly::new()?;
        // SAFETY: `name` is NUL-terminated and `security` outlives the call.
        let mutex = unsafe { CreateMutexW(security.as_ptr(), 0, name.as_ptr()) };
        if mutex.is_null() {
            return Err(io::Error::last_os_error());
        }
        // SAFETY: `mutex` is the handle just returned.
        match unsafe { WaitForSingleObject(mutex, 0) } {
            WAIT_OBJECT_0 => Ok(Some(Lock { mutex })),
            WAIT_ABANDONED => {
                tracing::warn!("single instance: the previous instance ended without releasing its lock (crash?); this launch takes over");
                Ok(Some(Lock { mutex }))
            }
            WAIT_TIMEOUT => {
                // SAFETY: closing our reference; the holder keeps the mutex alive.
                unsafe { CloseHandle(mutex) };
                Ok(None)
            }
            _ => {
                let e = io::Error::last_os_error();
                // SAFETY: as above.
                unsafe { CloseHandle(mutex) };
                Err(e)
            }
        }
    }
}

impl Drop for Lock {
    fn drop(&mut self) {
        // SAFETY: releasing fails harmlessly on a thread that does not own the mutex (it is then abandoned when the
        // owner thread ends); closing our handle is always valid.
        unsafe {
            ReleaseMutex(self.mutex);
            CloseHandle(self.mutex);
        }
    }
}

/// One end of the hand-off pipe.
pub(crate) struct Conn {
    handle: HANDLE,
    server: bool,
}

// SAFETY: a pipe handle can be used from any thread; each `Conn` is used by one thread at a time.
unsafe impl Send for Conn {}

impl Read for Conn {
    fn read(&mut self, buf: &mut [u8]) -> io::Result<usize> {
        let mut read = 0u32;
        let len = u32::try_from(buf.len()).unwrap_or(u32::MAX);
        // SAFETY: `buf` holds `len` bytes; synchronous I/O (no OVERLAPPED).
        if unsafe { ReadFile(self.handle, buf.as_mut_ptr(), len, &mut read, std::ptr::null_mut()) } == 0 {
            let e = io::Error::last_os_error();
            // ERROR_BROKEN_PIPE: the other end closed, which is an end of file here.
            if e.raw_os_error() == Some(109) {
                return Ok(0);
            }
            return Err(e);
        }
        Ok(read as usize)
    }
}

impl Write for Conn {
    fn write(&mut self, buf: &[u8]) -> io::Result<usize> {
        let mut written = 0u32;
        let len = u32::try_from(buf.len()).unwrap_or(u32::MAX);
        // SAFETY: `buf` holds `len` bytes; synchronous I/O.
        if unsafe { WriteFile(self.handle, buf.as_ptr(), len, &mut written, std::ptr::null_mut()) } == 0 {
            return Err(io::Error::last_os_error());
        }
        Ok(written as usize)
    }

    fn flush(&mut self) -> io::Result<()> {
        // SAFETY: a pipe handle we own.
        if unsafe { FlushFileBuffers(self.handle) } == 0 {
            return Err(io::Error::last_os_error());
        }
        Ok(())
    }
}

impl Drop for Conn {
    fn drop(&mut self) {
        // SAFETY: a handle we own; a server end is disconnected first so the client sees the end of the pipe.
        unsafe {
            if self.server {
                DisconnectNamedPipe(self.handle);
            }
            CloseHandle(self.handle);
        }
    }
}

/// The hand-off endpoint: a pipe instance waiting for the next launch.
pub(crate) struct Listener {
    name: Vec<u16>,
    security: UserOnly,
    pending: HANDLE,
}

// SAFETY: the pending pipe handle and the descriptor are only used by the thread that owns the listener.
unsafe impl Send for Listener {}

impl Listener {
    fn create(name: &[u16], security: &UserOnly, first: bool) -> io::Result<HANDLE> {
        let open_mode = PIPE_ACCESS_DUPLEX | if first { FILE_FLAG_FIRST_PIPE_INSTANCE } else { 0 };
        // SAFETY: `name` is NUL-terminated and `security` outlives the call.
        let handle = unsafe {
            CreateNamedPipeW(
                name.as_ptr(),
                open_mode,
                PIPE_TYPE_BYTE | PIPE_READMODE_BYTE | PIPE_WAIT | PIPE_REJECT_REMOTE_CLIENTS,
                PIPE_UNLIMITED_INSTANCES,
                64 * 1024,
                64 * 1024,
                0,
                security.as_ptr(),
            )
        };
        if handle == INVALID_HANDLE_VALUE {
            return Err(io::Error::last_os_error());
        }
        Ok(handle)
    }

    /// Creates the first pipe instance (`FILE_FLAG_FIRST_PIPE_INSTANCE`: a squatter makes this fail instead of
    /// sharing the name).
    pub(crate) fn bind(key: &InstanceKey) -> io::Result<Listener> {
        let name = wide(&pipe_name(key));
        let security = UserOnly::new()?;
        let pending = Listener::create(&name, &security, true)?;
        Ok(Listener { name, security, pending })
    }

    /// Waits for the next launch. The next pipe instance is created before this one is handed out, so the name
    /// never disappears between two launches.
    pub(crate) fn accept(&mut self) -> io::Result<Conn> {
        // SAFETY: `pending` is a server pipe instance we own; synchronous wait.
        if unsafe { ConnectNamedPipe(self.pending, std::ptr::null_mut()) } == 0 {
            // SAFETY: plain query of the calling thread's last error.
            let code = unsafe { GetLastError() };
            if code != ERROR_PIPE_CONNECTED {
                return Err(io::Error::from_raw_os_error(code as i32));
            }
        }
        let next = Listener::create(&self.name, &self.security, false)?;
        let connected = std::mem::replace(&mut self.pending, next);
        Ok(Conn { handle: connected, server: true })
    }
}

impl Drop for Listener {
    fn drop(&mut self) {
        // SAFETY: the pending instance is ours.
        unsafe { CloseHandle(self.pending) };
    }
}

/// Connects to the running instance's pipe; the connection and the server's process id.
pub(crate) fn connect(key: &InstanceKey, deadline: Instant) -> io::Result<(Conn, u32)> {
    let name = wide(&pipe_name(key));
    loop {
        // SAFETY: `name` is NUL-terminated. SECURITY_IDENTIFICATION: the server may identify this client but never
        // impersonate it.
        let handle = unsafe {
            CreateFileW(
                name.as_ptr(),
                GENERIC_READ | GENERIC_WRITE,
                0,
                std::ptr::null(),
                OPEN_EXISTING,
                SECURITY_SQOS_PRESENT | SECURITY_IDENTIFICATION,
                std::ptr::null_mut(),
            )
        };
        if handle != INVALID_HANDLE_VALUE {
            let mut pid = 0u32;
            // SAFETY: a connected client end we own.
            unsafe { GetNamedPipeServerProcessId(handle, &mut pid) };
            return Ok((Conn { handle, server: false }, pid));
        }
        // SAFETY: plain query of the calling thread's last error.
        let code = unsafe { GetLastError() };
        if Instant::now() >= deadline {
            return Err(io::Error::from_raw_os_error(code as i32));
        }
        match code {
            // Every instance is taken for a moment (another launch is being answered).
            // SAFETY: `name` is NUL-terminated.
            ERROR_PIPE_BUSY => unsafe {
                WaitNamedPipeW(name.as_ptr(), 250);
            },
            // The instance is still starting (it holds the lock, its pipe is not there yet), or it just ended.
            ERROR_FILE_NOT_FOUND => std::thread::sleep(Duration::from_millis(50)),
            _ => return Err(io::Error::from_raw_os_error(code as i32)),
        }
    }
}

/// Lets process `pid` (the running instance) take the foreground: the launch that the user just started holds that
/// right, and passes it on.
pub(crate) fn allow_foreground(pid: u32) {
    // SAFETY: plain call; failure only means the instance's window flashes instead of coming forward.
    if pid != 0 && unsafe { AllowSetForegroundWindow(pid) } == 0 {
        tracing::info!("single instance: this launch holds no foreground right to pass on (not started by the user's click): the running window will flash");
    }
}

/// Shows `hwnd`, restores it when minimised and brings it to the front. When the system refuses the foreground
/// (focus-stealing prevention), the taskbar button flashes until the user switches to it. Returns whether the
/// window is now in the foreground.
pub fn bring_to_front(hwnd: isize) -> bool {
    let hwnd = hwnd as HWND;
    if hwnd.is_null() {
        return false;
    }
    // SAFETY: plain window-state calls; a stale handle makes them fail harmlessly.
    unsafe {
        if IsIconic(hwnd) != 0 {
            ShowWindow(hwnd, SW_RESTORE);
        } else if IsWindowVisible(hwnd) == 0 {
            ShowWindow(hwnd, SW_SHOW);
        }
        BringWindowToTop(hwnd);
        let foreground = SetForegroundWindow(hwnd) != 0 && GetForegroundWindow() == hwnd;
        if !foreground {
            let flash = FLASHWINFO {
                cbSize: std::mem::size_of::<FLASHWINFO>() as u32,
                hwnd,
                dwFlags: FLASHW_ALL | FLASHW_TIMERNOFG,
                uCount: 0,
                dwTimeout: 0,
            };
            FlashWindowEx(&flash);
        }
        foreground
    }
}

/// The main windows of this process: visible, top-level, unowned, not tool windows, topmost in Z order first.
pub fn process_main_windows() -> Vec<isize> {
    unsafe extern "system" fn collect(hwnd: HWND, lparam: isize) -> i32 {
        // SAFETY: `lparam` is the `&mut Vec<isize>` passed to EnumWindows below, alive for the enumeration.
        let found = unsafe { &mut *(lparam as *mut Vec<isize>) };
        let mut pid = 0u32;
        // SAFETY: plain window queries on a handle the enumeration hands out.
        unsafe {
            GetWindowThreadProcessId(hwnd, &mut pid);
            if pid == GetCurrentProcessId()
                && IsWindowVisible(hwnd) != 0
                && GetWindow(hwnd, GW_OWNER).is_null()
                && (GetWindowLongPtrW(hwnd, GWL_EXSTYLE) as u32 & WS_EX_TOOLWINDOW) == 0
            {
                found.push(hwnd as isize);
            }
        }
        1
    }
    let mut found: Vec<isize> = Vec::new();
    // SAFETY: the callback only uses `lparam` as the vector above, which outlives the call.
    unsafe { EnumWindows(Some(collect), &mut found as *mut Vec<isize> as isize) };
    found
}

/// Brings this process's main window (the topmost one) to the front: what a document app does when a second
/// launch asks for the document it already shows. `None` when the process has no window yet, else whether the
/// window is now in the foreground (`false`: its taskbar button flashes).
pub fn focus_process_window() -> Option<bool> {
    process_main_windows().first().map(|&hwnd| bring_to_front(hwnd))
}
