//! Windows: protected DACLs and known folders, through the `windows` crate.

use std::ffi::OsString;
use std::io;
use std::os::windows::ffi::{OsStrExt, OsStringExt};
use std::path::{Path, PathBuf};

use windows::core::{GUID, PCWSTR, PWSTR};
use windows::Win32::Foundation::{CloseHandle, HANDLE};
use windows::Win32::Security::Authorization::{SetNamedSecurityInfoW, SE_FILE_OBJECT};
use windows::Win32::Security::{
    AddAccessAllowedAceEx, CreateWellKnownSid, GetLengthSid, GetTokenInformation, InitializeAcl,
    LookupAccountNameW, TokenUser, WinBuiltinAdministratorsSid, WinLocalSystemSid, ACCESS_ALLOWED_ACE,
    ACE_FLAGS, ACL, ACL_REVISION, CONTAINER_INHERIT_ACE, DACL_SECURITY_INFORMATION, OBJECT_INHERIT_ACE,
    PROTECTED_DACL_SECURITY_INFORMATION, PSID, SECURITY_MAX_SID_SIZE, SID_NAME_USE, TOKEN_QUERY, TOKEN_USER,
    WELL_KNOWN_SID_TYPE,
};
use windows::Win32::Storage::FileSystem::FILE_ALL_ACCESS;
use windows::Win32::System::Com::CoTaskMemFree;
use windows::Win32::System::Threading::{GetCurrentProcess, OpenProcessToken};
use windows::Win32::UI::Shell::{FOLDERID_LocalAppData, FOLDERID_ProgramData, SHGetKnownFolderPath, KF_FLAG_DEFAULT};

fn win_err(e: windows::core::Error) -> io::Error {
    io::Error::other(e)
}

fn wide(p: &Path) -> Vec<u16> {
    p.as_os_str().encode_wide().chain(std::iter::once(0)).collect()
}

/// An owned SID (its bytes).
#[derive(Clone, PartialEq, Eq)]
struct Sid(Vec<u8>);

impl Sid {
    fn psid(&self) -> PSID {
        PSID(self.0.as_ptr() as *mut _)
    }
}

fn well_known(kind: WELL_KNOWN_SID_TYPE) -> io::Result<Sid> {
    let mut size = SECURITY_MAX_SID_SIZE;
    let mut buf = vec![0u8; size as usize];
    // SAFETY: `buf` holds SECURITY_MAX_SID_SIZE bytes, the size passed in.
    unsafe { CreateWellKnownSid(kind, None, Some(PSID(buf.as_mut_ptr() as *mut _)), &mut size) }
        .map_err(win_err)?;
    buf.truncate(size as usize);
    Ok(Sid(buf))
}

/// The account the current process runs as.
fn process_user() -> io::Result<Sid> {
    let mut token = HANDLE::default();
    // SAFETY: plain Win32 calls on the current process's token; the buffer is
    // sized by the first call and 8-byte aligned for TOKEN_USER.
    unsafe {
        OpenProcessToken(GetCurrentProcess(), TOKEN_QUERY, &mut token).map_err(win_err)?;
        let mut len = 0u32;
        let _ = GetTokenInformation(token, TokenUser, None, 0, &mut len);
        let mut buf = vec![0u64; (len as usize).div_ceil(8).max(1)];
        let r = GetTokenInformation(token, TokenUser, Some(buf.as_mut_ptr() as *mut _), len, &mut len);
        let _ = CloseHandle(token);
        r.map_err(win_err)?;
        let tu = &*(buf.as_ptr() as *const TOKEN_USER);
        let n = GetLengthSid(tu.User.Sid) as usize;
        Ok(Sid(std::slice::from_raw_parts(tu.User.Sid.0 as *const u8, n).to_vec()))
    }
}

/// The SID of a named account (`NT SERVICE\kubuno`, `.\kubuno`, …).
fn account(name: &str) -> io::Result<Sid> {
    let name_w: Vec<u16> = name.encode_utf16().chain(std::iter::once(0)).collect();
    let mut sid_len = 0u32;
    let mut dom_len = 0u32;
    let mut kind = SID_NAME_USE::default();
    // SAFETY: first call only queries the sizes; second call gets buffers of
    // exactly those sizes.
    unsafe {
        let _ = LookupAccountNameW(
            PCWSTR::null(), PCWSTR(name_w.as_ptr()), None, &mut sid_len, None, &mut dom_len, &mut kind,
        );
        if sid_len == 0 {
            return Err(io::Error::new(io::ErrorKind::NotFound, format!("unknown account {name:?}")));
        }
        let mut sid = vec![0u8; sid_len as usize];
        let mut dom = vec![0u16; dom_len.max(1) as usize];
        LookupAccountNameW(
            PCWSTR::null(),
            PCWSTR(name_w.as_ptr()),
            Some(PSID(sid.as_mut_ptr() as *mut _)),
            &mut sid_len,
            Some(PWSTR(dom.as_mut_ptr())),
            &mut dom_len,
            &mut kind,
        )
        .map_err(win_err)?;
        sid.truncate(sid_len as usize);
        Ok(Sid(sid))
    }
}

/// The trustees of a private file: SYSTEM, Administrators, the current
/// account, and `KUBUNO_SERVICE_ACCOUNT` when set.
fn trustees() -> io::Result<Vec<Sid>> {
    let mut sids = vec![well_known(WinLocalSystemSid)?, well_known(WinBuiltinAdministratorsSid)?];
    let mut push = |s: Sid| {
        if !sids.contains(&s) {
            sids.push(s);
        }
    };
    push(process_user()?);
    if let Ok(name) = std::env::var(super::ENV_SERVICE_ACCOUNT) {
        let name = name.trim();
        if !name.is_empty() {
            push(account(name)?);
        }
    }
    Ok(sids)
}

/// Replaces the DACL of `path` by a protected one granting full control to the
/// trustees only. Directories pass their entries on to what is created inside.
pub(crate) fn restrict(path: &Path) -> io::Result<()> {
    let is_dir = std::fs::metadata(path)?.is_dir();
    let flags = if is_dir { OBJECT_INHERIT_ACE | CONTAINER_INHERIT_ACE } else { ACE_FLAGS(0) };
    let sids = trustees()?;

    let ace_base = std::mem::size_of::<ACCESS_ALLOWED_ACE>() - std::mem::size_of::<u32>();
    let size = std::mem::size_of::<ACL>() + sids.iter().map(|s| ace_base + s.0.len()).sum::<usize>();
    let size = (size + 3) & !3;
    let mut buf = vec![0u32; size / 4];
    let acl = buf.as_mut_ptr() as *mut ACL;
    let path_w = wide(path);
    // SAFETY: `buf` is DWORD-aligned and `size` bytes long, enough for the
    // header and one ACCESS_ALLOWED_ACE per SID; every SID buffer outlives the
    // calls; the path is NUL-terminated.
    unsafe {
        InitializeAcl(acl, size as u32, ACL_REVISION).map_err(win_err)?;
        for s in &sids {
            AddAccessAllowedAceEx(acl, ACL_REVISION, flags, FILE_ALL_ACCESS.0, s.psid()).map_err(win_err)?;
        }
        let err = SetNamedSecurityInfoW(
            PCWSTR(path_w.as_ptr()),
            SE_FILE_OBJECT,
            DACL_SECURITY_INFORMATION | PROTECTED_DACL_SECURITY_INFORMATION,
            None,
            None,
            Some(acl as *const ACL),
            None,
        );
        if err.0 != 0 {
            return Err(io::Error::from_raw_os_error(err.0 as i32));
        }
    }
    Ok(())
}

fn known_folder(id: &GUID) -> Option<PathBuf> {
    // SAFETY: the returned buffer is owned by us and freed with CoTaskMemFree.
    unsafe {
        let p = SHGetKnownFolderPath(id, KF_FLAG_DEFAULT, None).ok()?;
        let s = OsString::from_wide(p.as_wide());
        CoTaskMemFree(Some(p.0 as *const _));
        if s.is_empty() { None } else { Some(PathBuf::from(s)) }
    }
}

pub(crate) fn known_folder_program_data() -> Option<PathBuf> {
    known_folder(&FOLDERID_ProgramData)
}

pub(crate) fn known_folder_local_app_data() -> Option<PathBuf> {
    known_folder(&FOLDERID_LocalAppData)
}

#[cfg(test)]
pub(crate) struct AclReport {
    pub protected: bool,
    pub sids: Vec<String>,
    /// `AceFlags & (OBJECT_INHERIT | CONTAINER_INHERIT)` of each entry.
    pub inherit_flags: Vec<u8>,
}

#[cfg(test)]
fn sid_string(psid: PSID) -> io::Result<String> {
    use windows::Win32::Foundation::{LocalFree, HLOCAL};
    use windows::Win32::Security::Authorization::ConvertSidToStringSidW;
    // SAFETY: `psid` points into a live ACL; the string is freed with LocalFree.
    unsafe {
        let mut s = PWSTR::null();
        ConvertSidToStringSidW(psid, &mut s).map_err(win_err)?;
        let out = String::from_utf16_lossy(s.as_wide());
        let _ = LocalFree(Some(HLOCAL(s.0 as *mut _)));
        Ok(out)
    }
}

/// Reads back the DACL of `path` (tests).
#[cfg(test)]
pub(crate) fn inspect(path: &Path) -> io::Result<AclReport> {
    use windows::Win32::Foundation::{LocalFree, HLOCAL};
    use windows::Win32::Security::Authorization::GetNamedSecurityInfoW;
    use windows::Win32::Security::{GetAce, GetSecurityDescriptorControl, PSECURITY_DESCRIPTOR, SE_DACL_PROTECTED};

    let path_w = wide(path);
    // SAFETY: the descriptor returned by GetNamedSecurityInfoW owns the DACL
    // and is freed with LocalFree once the entries have been copied out.
    unsafe {
        let mut dacl: *mut ACL = std::ptr::null_mut();
        let mut sd = PSECURITY_DESCRIPTOR::default();
        let err = GetNamedSecurityInfoW(
            PCWSTR(path_w.as_ptr()), SE_FILE_OBJECT, DACL_SECURITY_INFORMATION,
            None, None, Some(&mut dacl), None, &mut sd,
        );
        if err.0 != 0 {
            return Err(io::Error::from_raw_os_error(err.0 as i32));
        }
        let mut control = 0u16;
        let mut rev = 0u32;
        let ctl = GetSecurityDescriptorControl(sd, &mut control, &mut rev);
        let mut report = AclReport {
            protected: control & SE_DACL_PROTECTED.0 != 0,
            sids: Vec::new(),
            inherit_flags: Vec::new(),
        };
        let mut result = ctl.map_err(win_err);
        if result.is_ok() && !dacl.is_null() {
            for i in 0..(*dacl).AceCount as u32 {
                let mut ace: *mut core::ffi::c_void = std::ptr::null_mut();
                if let Err(e) = GetAce(dacl, i, &mut ace) {
                    result = Err(win_err(e));
                    break;
                }
                let ace = ace as *const ACCESS_ALLOWED_ACE;
                let sid = PSID(std::ptr::addr_of!((*ace).SidStart) as *mut _);
                match sid_string(sid) {
                    Ok(s) => report.sids.push(s),
                    Err(e) => {
                        result = Err(e);
                        break;
                    }
                }
                report.inherit_flags.push((*ace).Header.AceFlags & 0x3);
            }
        }
        let _ = LocalFree(Some(HLOCAL(sd.0)));
        result.map(|()| report)
    }
}

/// The string SIDs [`restrict`] grants, sorted (tests).
#[cfg(test)]
pub(crate) fn expected_sids() -> io::Result<Vec<String>> {
    let mut v = trustees()?
        .iter()
        .map(|s| sid_string(s.psid()))
        .collect::<io::Result<Vec<_>>>()?;
    v.sort();
    v.dedup();
    Ok(v)
}

/// Whether the process token is elevated (an administrator prompt, or
/// SYSTEM). `false` when it cannot be determined.
pub(crate) fn process_is_elevated() -> bool {
    use windows::Win32::Security::{TokenElevation, TOKEN_ELEVATION};
    let mut token = HANDLE::default();
    // SAFETY: plain Win32 calls on the current process's token; the output
    // buffer is a TOKEN_ELEVATION of the size passed in.
    unsafe {
        if OpenProcessToken(GetCurrentProcess(), TOKEN_QUERY, &mut token).is_err() {
            return false;
        }
        let mut elevation = TOKEN_ELEVATION::default();
        let mut len = 0u32;
        let r = GetTokenInformation(
            token,
            TokenElevation,
            Some(&mut elevation as *mut TOKEN_ELEVATION as *mut _),
            std::mem::size_of::<TOKEN_ELEVATION>() as u32,
            &mut len,
        );
        let _ = CloseHandle(token);
        r.is_ok() && elevation.TokenIsElevated != 0
    }
}

/// Whether the process runs in session 0, where Windows services run and no
/// interactive user ever does.
pub(crate) fn process_in_session_zero() -> bool {
    use windows::Win32::System::RemoteDesktop::ProcessIdToSessionId;
    use windows::Win32::System::Threading::GetCurrentProcessId;
    let mut session = u32::MAX;
    // SAFETY: `session` is a valid u32 the call writes to.
    unsafe { ProcessIdToSessionId(GetCurrentProcessId(), &mut session) }.is_ok() && session == 0
}
