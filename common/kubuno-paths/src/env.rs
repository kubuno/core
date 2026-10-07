//! The environment the layout is computed from, injected so that every rule can
//! be tested for every OS on any host.

use std::collections::BTreeMap;
use std::path::{Path, PathBuf};

/// The operating-system family whose conventions apply.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum Os {
    /// Linux and every other Unix that is not macOS (FHS + XDG).
    Linux,
    Windows,
    MacOs,
}

impl Os {
    /// The family this binary was compiled for.
    pub const fn current() -> Os {
        if cfg!(windows) {
            Os::Windows
        } else if cfg!(target_os = "macos") {
            Os::MacOs
        } else {
            Os::Linux
        }
    }

    /// Name used in package file names (`std::env::consts::OS` spelling).
    pub const fn as_str(self) -> &'static str {
        match self {
            Os::Linux => "linux",
            Os::Windows => "windows",
            Os::MacOs => "macos",
        }
    }
}

/// Everything the layout depends on: the OS family, a set of environment
/// variables, the working directory and, on Windows, the two known folders.
///
/// Nothing in this crate reads the real process environment except
/// [`PathEnv::from_process`]; every other function takes a `PathEnv`.
#[derive(Debug, Clone)]
pub struct PathEnv {
    os: Os,
    vars: BTreeMap<String, String>,
    cwd: Option<PathBuf>,
    program_data: Option<PathBuf>,
    local_app_data: Option<PathBuf>,
}

impl PathEnv {
    /// An empty environment for `os` (tests build on it with the `with_*` methods).
    pub fn new(os: Os) -> Self {
        Self { os, vars: BTreeMap::new(), cwd: None, program_data: None, local_app_data: None }
    }

    /// The real environment of the current process.
    ///
    /// On Windows, `%ProgramData%` and `%LOCALAPPDATA%` come from
    /// `SHGetKnownFolderPath` first and from the environment variables only as a
    /// fallback; `HOME`/`USERPROFILE` are never used for them.
    pub fn from_process() -> Self {
        let mut env = Self::new(Os::current());
        for (k, v) in std::env::vars_os() {
            if let (Some(k), Some(v)) = (k.to_str(), v.to_str()) {
                env.vars.insert(k.to_string(), v.to_string());
            }
        }
        env.cwd = std::env::current_dir().ok();
        #[cfg(windows)]
        {
            env.program_data = crate::perms::windows::known_folder_program_data();
            env.local_app_data = crate::perms::windows::known_folder_local_app_data();
        }
        env
    }

    /// The same environment without any `KUBUNO_PATHS_*` variable: what the
    /// layout would be if nothing had been overridden.
    pub fn without_path_overrides(&self) -> Self {
        let mut env = self.clone();
        env.vars.retain(|k, _| !k.starts_with("KUBUNO_PATHS_"));
        env
    }

    pub fn with_var(mut self, key: &str, value: &str) -> Self {
        self.vars.insert(key.to_string(), value.to_string());
        self
    }

    pub fn with_cwd(mut self, cwd: impl Into<PathBuf>) -> Self {
        self.cwd = Some(cwd.into());
        self
    }

    pub fn with_program_data(mut self, dir: impl Into<PathBuf>) -> Self {
        self.program_data = Some(dir.into());
        self
    }

    pub fn with_local_app_data(mut self, dir: impl Into<PathBuf>) -> Self {
        self.local_app_data = Some(dir.into());
        self
    }

    pub fn os(&self) -> Os {
        self.os
    }

    /// A variable's value, `None` when unset or blank.
    pub fn var(&self, key: &str) -> Option<&str> {
        self.vars.get(key).map(|v| v.trim()).filter(|v| !v.is_empty())
    }

    /// A variable holding a path, `None` when unset or blank.
    pub fn path_var(&self, key: &str) -> Option<PathBuf> {
        self.var(key).map(PathBuf::from)
    }

    pub fn cwd(&self) -> Option<&Path> {
        self.cwd.as_deref()
    }

    /// `%ProgramData%`: the known folder, else the `ProgramData` variable.
    pub fn program_data(&self) -> Option<PathBuf> {
        self.program_data.clone().or_else(|| self.path_var("ProgramData"))
    }

    /// `%LOCALAPPDATA%`: the known folder, else the `LOCALAPPDATA` variable.
    pub fn local_app_data(&self) -> Option<PathBuf> {
        self.local_app_data.clone().or_else(|| self.path_var("LOCALAPPDATA"))
    }

    /// The home directory on Unix (`HOME`). Never consulted on Windows.
    pub fn home(&self) -> Option<PathBuf> {
        match self.os {
            Os::Windows => None,
            _ => self.path_var("HOME"),
        }
    }

    /// An XDG base directory: the variable when it holds an absolute path (the
    /// specification says relative values must be ignored), else `$HOME/<fallback>`.
    pub fn xdg_dir(&self, var: &str, fallback: &str) -> Option<PathBuf> {
        if let Some(v) = self.var(var) {
            if v.starts_with('/') {
                return Some(PathBuf::from(v));
            }
        }
        self.home().map(|h| h.join(fallback))
    }
}
