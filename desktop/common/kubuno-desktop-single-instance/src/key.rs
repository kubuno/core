//! What two launches compare to decide whether they are "the same instance": an [`InstanceKey`].
//!
//! A key is a digest of the program, the **user**, the **user session** and a scope:
//!
//! - [`InstanceKey::per_session`]: one instance per user session, whatever the profile, the data directory or the
//!   executable's path (Kubuno Desktop: a release, a dev build and a copy elsewhere all find each other);
//! - [`InstanceKey::per_profile`]: one instance per data directory;
//! - [`InstanceKey::per_document`]: one instance per document of a profile (an Office app: one window per
//!   document, like Word);
//! - [`InstanceKey::dev`]: a named developer instance, apart from everything else (the caller decides when it is
//!   allowed: Kubuno Desktop only honours it in debug builds or with its `dev-instance` feature).
//!
//! The user and the session are part of the digest (Windows: the user's SID and the Terminal Services session id;
//! Unix: the uid and `XDG_SESSION_ID`), so two users of one machine, or two sessions of one user, never meet.
//! Paths are compared through [`normalize_path`]: one file spelt two ways is one key.

use std::path::{Path, PathBuf};

use sha2::{Digest, Sha256};

/// The identity of a single-instance program (see the module doc). Cheap to clone; never contains a secret.
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct InstanceKey {
    app: String,
    scope: String,
    digest: String,
}

impl InstanceKey {
    /// One instance of `app` per user session.
    pub fn per_session(app: &str) -> InstanceKey {
        InstanceKey::build(app, "session", "")
    }

    /// One instance of `app` per data directory `profile` (compared normalised).
    pub fn per_profile(app: &str, profile: &Path) -> InstanceKey {
        InstanceKey::build(app, "profile", &normalize_path(profile))
    }

    /// One instance of `app` per `document` of the data directory `profile`. `document` is the caller's identity
    /// of the document: [`document_of_file`] for a local file, [`document_of_server`] for a server document.
    pub fn per_document(app: &str, profile: &Path, document: &str) -> InstanceKey {
        InstanceKey::build(app, "document", &format!("{}\n{document}", normalize_path(profile)))
    }

    /// A named developer instance of `app` (agents' sandboxed tests, a debugger session next to the real app).
    pub fn dev(app: &str, name: &str) -> InstanceKey {
        InstanceKey::build(app, "dev", name.trim())
    }

    fn build(app: &str, kind: &str, value: &str) -> InstanceKey {
        let (user, session) = (crate::sys::user_marker(), crate::sys::session_marker());
        InstanceKey::with_identity(app, kind, value, &user, &session)
    }

    /// The key for an explicit user and session (what [`InstanceKey::build`] reads from the OS); the tests use it.
    pub(crate) fn with_identity(app: &str, kind: &str, value: &str, user: &str, session: &str) -> InstanceKey {
        let mut hash = Sha256::new();
        for part in [app, user, session, kind, value] {
            hash.update(part.as_bytes());
            hash.update([0u8]);
        }
        InstanceKey { app: sanitize(app), scope: kind.to_string(), digest: hex::encode(&hash.finalize()[..10]) }
    }

    /// The program part of the OS object names (letters, digits, `-` and `_` only).
    pub fn app(&self) -> &str {
        &self.app
    }

    /// `session`, `profile`, `document` or `dev`.
    pub fn scope(&self) -> &str {
        &self.scope
    }

    /// 20 hex characters: the user, the session and the scope, hashed.
    pub fn digest(&self) -> &str {
        &self.digest
    }

    /// `<app>-<digest>`: the base of the OS object names (mutex, pipe, lock file, socket).
    pub fn object_name(&self) -> String {
        format!("kubuno-{}-{}", self.app, self.digest)
    }
}

fn sanitize(app: &str) -> String {
    let s: String = app.chars().map(|c| if c.is_ascii_alphanumeric() || c == '-' || c == '_' { c.to_ascii_lowercase() } else { '_' }).collect();
    if s.is_empty() {
        "app".to_string()
    } else {
        s
    }
}

/// A path in the form two spellings of the same file agree on: made absolute, resolved when it exists (symbolic
/// links, junctions, `..`), without the Windows verbatim prefix (`\\?\C:\…`, `\\?\UNC\server\share`), with one kind
/// of separator, no trailing separator, and case-folded on Windows and macOS (case-insensitive file systems by
/// default).
pub fn normalize_path(path: &Path) -> String {
    let absolute = std::path::absolute(path).unwrap_or_else(|_| path.to_path_buf());
    let resolved = std::fs::canonicalize(&absolute).unwrap_or(absolute);
    normalize_text(&resolved.to_string_lossy(), cfg!(windows), cfg!(any(windows, target_os = "macos")))
}

/// The textual part of [`normalize_path`], with the OS rules as parameters (tested for every OS on any OS).
pub(crate) fn normalize_text(text: &str, windows: bool, fold_case: bool) -> String {
    let mut s = text.to_string();
    if windows {
        s = s.replace('/', "\\");
        if let Some(rest) = s.strip_prefix(r"\\?\UNC\").or_else(|| s.strip_prefix(r"\\.\UNC\")) {
            s = format!(r"\\{rest}");
        } else if let Some(rest) = s.strip_prefix(r"\\?\").or_else(|| s.strip_prefix(r"\\.\")) {
            s = rest.to_string();
        }
        // Collapse doubled separators, except the two of a UNC prefix.
        let (head, tail) = if let Some(rest) = s.strip_prefix(r"\\") { (r"\\", rest.to_string()) } else { ("", s.clone()) };
        let mut collapsed = String::with_capacity(tail.len());
        for c in tail.chars() {
            if c == '\\' && collapsed.ends_with('\\') {
                continue;
            }
            collapsed.push(c);
        }
        s = format!("{head}{collapsed}");
        // `C:\` keeps its separator; `C:\docs\` loses it.
        while s.ends_with('\\') && !(s.len() == 3 && s.as_bytes()[1] == b':') && s.len() > 1 {
            s.pop();
        }
    } else {
        let mut collapsed = String::with_capacity(s.len());
        for c in s.chars() {
            if c == '/' && collapsed.ends_with('/') {
                continue;
            }
            collapsed.push(c);
        }
        s = collapsed;
        while s.len() > 1 && s.ends_with('/') {
            s.pop();
        }
    }
    if fold_case {
        s.to_lowercase()
    } else {
        s
    }
}

/// The document identity of a local file (for [`InstanceKey::per_document`]).
pub fn document_of_file(path: &Path) -> String {
    format!("file:{}", normalize_path(path))
}

/// The document identity of a document of a server (for [`InstanceKey::per_document`]): the server's URL
/// lower-cased without its trailing `/` (empty when unknown), and the document's id as the server spells it.
pub fn document_of_server(server_url: &str, doc_id: &str) -> String {
    format!("doc:{}#{}", server_url.trim().trim_end_matches('/').to_ascii_lowercase(), doc_id.trim())
}

/// A key's document identity for a path argument that may be a file or not (helper for the apps' command lines).
pub fn document_of_arg(arg: &str) -> String {
    document_of_file(&PathBuf::from(arg))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn windows_spellings_of_one_path_agree() {
        let n = |s: &str| normalize_text(s, true, true);
        let plain = n(r"C:\Users\Ana\Documents\Rapport.kbdoc");
        assert_eq!(plain, r"c:\users\ana\documents\rapport.kbdoc");
        assert_eq!(n(r"\\?\C:\Users\Ana\Documents\Rapport.kbdoc"), plain, "verbatim prefix");
        assert_eq!(n(r"c:/users/ana/documents/RAPPORT.KBDOC"), plain, "slashes and case");
        assert_eq!(n(r"C:\Users\\Ana\Documents\Rapport.kbdoc\"), plain, "doubled and trailing separators");
        assert_eq!(n(r"\\?\UNC\nas\share\a.kbdoc"), n(r"\\NAS\share\a.kbdoc"), "verbatim UNC");
        assert_eq!(n(r"C:\"), r"c:\", "a drive root keeps its separator");
        assert_ne!(n(r"C:\a\b.kbdoc"), n(r"C:\a\c.kbdoc"));
    }

    #[test]
    fn unix_paths_keep_their_case_on_linux_and_fold_it_on_macos() {
        assert_eq!(normalize_text("/home/ana//docs/A.kbdoc/", false, false), "/home/ana/docs/A.kbdoc");
        assert_ne!(normalize_text("/home/ana/A.kbdoc", false, false), normalize_text("/home/ana/a.kbdoc", false, false));
        assert_eq!(normalize_text("/Users/Ana/A.kbdoc", false, true), normalize_text("/users/ana/a.kbdoc", false, true));
        assert_eq!(normalize_text("/", false, false), "/");
    }

    #[test]
    fn an_existing_file_is_one_key_however_it_is_spelt() {
        let dir = tempfile::tempdir().expect("tmp");
        let file = dir.path().join("Rapport.kbdoc");
        std::fs::write(&file, b"x").expect("write");
        let dotted = dir.path().join("sub").join("..").join("Rapport.kbdoc");
        std::fs::create_dir(dir.path().join("sub")).expect("sub");
        assert_eq!(normalize_path(&file), normalize_path(&dotted));
        #[cfg(any(windows, target_os = "macos"))]
        assert_eq!(normalize_path(&file), normalize_path(&dir.path().join("RAPPORT.KBDOC")));
    }

    #[test]
    fn the_session_key_ignores_the_profile_and_the_executable() {
        let a = InstanceKey::with_identity("kubuno-desktop", "session", "", "S-1-5-21-1", "1");
        let b = InstanceKey::with_identity("kubuno-desktop", "session", "", "S-1-5-21-1", "1");
        assert_eq!(a, b);
        assert_eq!(a.digest().len(), 20);
        assert_eq!(a.object_name(), format!("kubuno-kubuno-desktop-{}", a.digest()));
        assert_ne!(a, InstanceKey::with_identity("kubuno-desktop", "session", "", "S-1-5-21-2", "1"), "another user");
        assert_ne!(a, InstanceKey::with_identity("kubuno-desktop", "session", "", "S-1-5-21-1", "2"), "another session");
        assert_ne!(a, InstanceKey::with_identity("kubuno-documents", "session", "", "S-1-5-21-1", "1"), "another program");
        assert_ne!(a, InstanceKey::with_identity("kubuno-desktop", "dev", "agent-1", "S-1-5-21-1", "1"), "a dev instance");
        // The real constructor is stable within a process.
        assert_eq!(InstanceKey::per_session("kubuno-desktop"), InstanceKey::per_session("kubuno-desktop"));
    }

    #[test]
    fn document_keys_follow_the_document_and_the_profile() {
        let dir = tempfile::tempdir().expect("tmp");
        let (p1, p2) = (dir.path().join("p1"), dir.path().join("p2"));
        let doc = document_of_server("HTTPS://Cloud.Example.org/", "3f2a");
        assert_eq!(doc, document_of_server("https://cloud.example.org", "3f2a"));
        let k = |profile: &Path, d: &str| InstanceKey::per_document("kubuno-documents", profile, d);
        assert_eq!(k(&p1, &doc), k(&p1, &doc));
        assert_ne!(k(&p1, &doc), k(&p1, &document_of_server("https://cloud.example.org", "77aa")), "another document");
        assert_ne!(k(&p1, &doc), k(&p2, &doc), "another profile");
        assert_ne!(k(&p1, &doc), InstanceKey::per_document("kubuno-spreadsheets", &p1, &doc), "another app");
        let file = dir.path().join("a.kbdoc");
        std::fs::write(&file, b"x").expect("write");
        assert_eq!(document_of_file(&file), document_of_arg(&file.to_string_lossy()));
        assert_eq!(InstanceKey::per_document("x", &p1, &document_of_file(&file)).scope(), "document");
    }

    #[test]
    fn app_names_are_safe_in_object_names() {
        let k = InstanceKey::with_identity("Kubuno Documents/1", "session", "", "u", "s");
        assert_eq!(k.app(), "kubuno_documents_1");
    }
}
