//! Where Kubuno keeps its files, per OS and per mode.

use crate::env::{Os, PathEnv};
use std::fmt;
use std::path::{Path, PathBuf};

/// Environment variable selecting the mode (`system` or `user`).
pub const ENV_MODE: &str = "KUBUNO_PATHS_MODE";

/// Who the instance runs as, which decides the family of directories.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum Mode {
    /// The packaged service: machine-wide directories (`/etc`, `/var/lib`,
    /// `%ProgramData%`, `/Library`). The default, because it is what every
    /// installer deploys and what the CLI administers.
    #[default]
    System,
    /// A per-user instance (development, or a desktop-style install): XDG
    /// directories, `%LOCALAPPDATA%`, `~/Library`.
    User,
}

impl Mode {
    pub fn parse(value: &str) -> Option<Mode> {
        match value.trim().to_ascii_lowercase().as_str() {
            "system" | "service" => Some(Mode::System),
            "user" | "dev" | "development" => Some(Mode::User),
            _ => None,
        }
    }

    pub const fn as_str(self) -> &'static str {
        match self {
            Mode::System => "system",
            Mode::User => "user",
        }
    }
}

/// Explicit locations that replace the computed ones. Every field left `None`
/// keeps the platform default. The core fills this from its `[paths]`
/// configuration section; the `KUBUNO_PATHS_*` variables then take precedence.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct Overrides {
    pub mode: Option<Mode>,
    pub config_dir: Option<PathBuf>,
    pub state_dir: Option<PathBuf>,
    pub data_dir: Option<PathBuf>,
    pub log_dir: Option<PathBuf>,
    pub cache_dir: Option<PathBuf>,
    pub runtime_dir: Option<PathBuf>,
    pub backup_dir: Option<PathBuf>,
    pub modules_store: Option<PathBuf>,
    pub modules_config_dir: Option<PathBuf>,
    pub modules_data_dir: Option<PathBuf>,
}

/// The `KUBUNO_PATHS_*` variable for each overridable directory.
pub const ENV_DIRS: [(&str, &str); 10] = [
    ("config_dir", "KUBUNO_PATHS_CONFIG_DIR"),
    ("state_dir", "KUBUNO_PATHS_STATE_DIR"),
    ("data_dir", "KUBUNO_PATHS_DATA_DIR"),
    ("log_dir", "KUBUNO_PATHS_LOG_DIR"),
    ("cache_dir", "KUBUNO_PATHS_CACHE_DIR"),
    ("runtime_dir", "KUBUNO_PATHS_RUNTIME_DIR"),
    ("backup_dir", "KUBUNO_PATHS_BACKUP_DIR"),
    ("modules_store", "KUBUNO_PATHS_MODULES_STORE"),
    ("modules_config_dir", "KUBUNO_PATHS_MODULES_CONFIG_DIR"),
    ("modules_data_dir", "KUBUNO_PATHS_MODULES_DATA_DIR"),
];

impl Overrides {
    /// The overrides carried by the environment (`KUBUNO_PATHS_MODE` and the
    /// `KUBUNO_PATHS_*_DIR` variables).
    pub fn from_env(env: &PathEnv) -> Result<Overrides, PathsError> {
        let mode = match env.var(ENV_MODE) {
            Some(v) => Some(Mode::parse(v).ok_or_else(|| PathsError::InvalidMode(v.to_string()))?),
            None => None,
        };
        let mut o = Overrides { mode, ..Overrides::default() };
        for (field, var) in ENV_DIRS {
            if let Some(p) = env.path_var(var) {
                o.set(field, p);
            }
        }
        Ok(o)
    }

    /// Sets one directory by its field name (see [`ENV_DIRS`]). Unknown names
    /// are ignored.
    pub fn set(&mut self, field: &str, value: PathBuf) {
        let slot = match field {
            "config_dir" => &mut self.config_dir,
            "state_dir" => &mut self.state_dir,
            "data_dir" => &mut self.data_dir,
            "log_dir" => &mut self.log_dir,
            "cache_dir" => &mut self.cache_dir,
            "runtime_dir" => &mut self.runtime_dir,
            "backup_dir" => &mut self.backup_dir,
            "modules_store" => &mut self.modules_store,
            "modules_config_dir" => &mut self.modules_config_dir,
            "modules_data_dir" => &mut self.modules_data_dir,
            _ => return,
        };
        *slot = Some(value);
    }

    /// `self` with every value `over` sets replaced (`over` wins).
    pub fn merged_with(mut self, over: &Overrides) -> Overrides {
        macro_rules! take {
            ($($f:ident),*) => { $( if over.$f.is_some() { self.$f = over.$f.clone(); } )* };
        }
        take!(mode, config_dir, state_dir, data_dir, log_dir, cache_dir, runtime_dir,
              backup_dir, modules_store, modules_config_dir, modules_data_dir);
        self
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum PathsError {
    /// `KUBUNO_PATHS_MODE` (or `[paths] mode`) holds something else than
    /// `system` or `user`.
    InvalidMode(String),
    /// A base directory the layout needs could not be determined.
    MissingBase(&'static str),
    /// An override is a relative path: it would depend on the working
    /// directory, which is exactly the ambiguity this crate removes.
    RelativeOverride { field: &'static str, value: PathBuf },
}

impl fmt::Display for PathsError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            PathsError::InvalidMode(v) => write!(
                f,
                "invalid Kubuno paths mode {v:?}: expected \"system\" or \"user\" ({ENV_MODE} or [paths] mode)"
            ),
            PathsError::MissingBase(what) => write!(
                f,
                "cannot determine {what}: set it in the environment or override the Kubuno directories explicitly"
            ),
            PathsError::RelativeOverride { field, value } => write!(
                f,
                "the Kubuno directory override {field} = {} is relative; use an absolute path",
                value.display()
            ),
        }
    }
}

impl std::error::Error for PathsError {}

/// The resolved directories of an instance.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Paths {
    pub os: Os,
    pub mode: Mode,
    /// `config.toml` lives here.
    pub config_dir: PathBuf,
    /// Instance identity and secrets: `data.key`, the setup token, the initial
    /// administrator password, the TLS material. Never part of a data backup.
    pub state_dir: PathBuf,
    /// Application data: files, themes, SQLite databases, exports.
    pub data_dir: PathBuf,
    pub log_dir: PathBuf,
    pub cache_dir: PathBuf,
    pub runtime_dir: PathBuf,
    pub backup_dir: PathBuf,
    /// Modules installed from `.kbpkg` packages (written by the core).
    pub modules_store: PathBuf,
    /// Per-module configuration (`<dir>/<id>/config.toml`, also the module's CWD).
    pub modules_config_dir: PathBuf,
    /// Per-module data (`<dir>/<id>/`).
    pub modules_data_dir: PathBuf,
}

/// The base directories before overrides: (config, state, data, log, cache, runtime).
struct Bases {
    config: PathBuf,
    state: PathBuf,
    data: PathBuf,
    log: PathBuf,
    cache: PathBuf,
    runtime: PathBuf,
    /// Backups outside the data tree (Linux system only); `None` = `data/backups`.
    backup: Option<PathBuf>,
}

fn bases(env: &PathEnv, mode: Mode) -> Result<Bases, PathsError> {
    Ok(match (env.os(), mode) {
        // Linux service: the FHS layout every existing package uses. `state`
        // is `/var/lib/kubuno` itself so that an existing `data.key` stays put.
        (Os::Linux, Mode::System) => Bases {
            config: PathBuf::from("/etc/kubuno"),
            state: PathBuf::from("/var/lib/kubuno"),
            data: PathBuf::from("/var/lib/kubuno"),
            log: PathBuf::from("/var/log/kubuno"),
            cache: PathBuf::from("/var/cache/kubuno"),
            runtime: PathBuf::from("/run/kubuno"),
            backup: Some(PathBuf::from("/var/backups/kubuno")),
        },
        (Os::Linux, Mode::User) => {
            let config = env.xdg_dir("XDG_CONFIG_HOME", ".config").ok_or(PathsError::MissingBase("HOME"))?;
            let data = env.xdg_dir("XDG_DATA_HOME", ".local/share").ok_or(PathsError::MissingBase("HOME"))?;
            let state = env.xdg_dir("XDG_STATE_HOME", ".local/state").ok_or(PathsError::MissingBase("HOME"))?;
            let cache = env.xdg_dir("XDG_CACHE_HOME", ".cache").ok_or(PathsError::MissingBase("HOME"))?;
            let state = state.join("kubuno");
            let runtime = match env.var("XDG_RUNTIME_DIR").filter(|v| v.starts_with('/')) {
                Some(r) => PathBuf::from(r).join("kubuno"),
                None => state.join("run"),
            };
            Bases {
                config: config.join("kubuno"),
                log: state.join("logs"),
                state,
                data: data.join("kubuno"),
                cache: cache.join("kubuno"),
                runtime,
                backup: None,
            }
        }
        (Os::Windows, _) => {
            let root = match mode {
                Mode::System => env.program_data().ok_or(PathsError::MissingBase("%ProgramData%"))?,
                Mode::User => env.local_app_data().ok_or(PathsError::MissingBase("%LOCALAPPDATA%"))?,
            };
            let base = root.join("Kubuno");
            Bases {
                config: base.clone(),
                state: base.join("state"),
                data: base.join("data"),
                log: base.join("logs"),
                cache: base.join("cache"),
                runtime: base.join("run"),
                backup: None,
            }
        }
        (Os::MacOs, _) => {
            let library = match mode {
                Mode::System => PathBuf::from("/Library"),
                Mode::User => env.home().ok_or(PathsError::MissingBase("HOME"))?.join("Library"),
            };
            let base = library.join("Application Support").join("Kubuno");
            Bases {
                config: base.clone(),
                state: base.join("state"),
                data: base.join("data"),
                log: library.join("Logs").join("Kubuno"),
                cache: library.join("Caches").join("Kubuno"),
                runtime: base.join("run"),
                backup: None,
            }
        }
    })
}

fn absolute(field: &'static str, value: Option<PathBuf>, os: Os) -> Result<Option<PathBuf>, PathsError> {
    match value {
        Some(p) if !is_absolute_for(&p, os) => Err(PathsError::RelativeOverride { field, value: p }),
        other => Ok(other),
    }
}

/// `Path::is_absolute` for the target OS rather than the host, so that the
/// Windows rules can be tested on Linux and conversely.
pub(crate) fn is_absolute_for(p: &Path, os: Os) -> bool {
    let s = p.to_string_lossy();
    match os {
        Os::Windows => {
            let b = s.as_bytes();
            (b.len() >= 3 && b[0].is_ascii_alphabetic() && b[1] == b':' && (b[2] == b'\\' || b[2] == b'/'))
                || s.starts_with(r"\\")
        }
        _ => s.starts_with('/'),
    }
}

impl Paths {
    /// The layout for `env`, with `config` overrides applied and the
    /// environment's `KUBUNO_PATHS_*` overrides applied over them.
    ///
    /// Never looks at the filesystem: the result depends on the inputs only.
    pub fn resolve(env: &PathEnv, config: &Overrides) -> Result<Paths, PathsError> {
        let o = config.clone().merged_with(&Overrides::from_env(env)?);
        let os = env.os();
        let mode = o.mode.unwrap_or_default();
        let b = bases(env, mode)?;

        let config_dir = absolute("config_dir", o.config_dir, os)?.unwrap_or(b.config);
        let state_dir = absolute("state_dir", o.state_dir, os)?.unwrap_or(b.state);
        let data_dir = absolute("data_dir", o.data_dir, os)?.unwrap_or(b.data);
        let log_dir = absolute("log_dir", o.log_dir, os)?.unwrap_or(b.log);
        let cache_dir = absolute("cache_dir", o.cache_dir, os)?.unwrap_or(b.cache);
        let runtime_dir = absolute("runtime_dir", o.runtime_dir, os)?.unwrap_or(b.runtime);
        let backup_dir = absolute("backup_dir", o.backup_dir, os)?
            .or(b.backup)
            .unwrap_or_else(|| data_dir.join("backups"));
        let modules_store = absolute("modules_store", o.modules_store, os)?
            .unwrap_or_else(|| data_dir.join("modules-store"));
        let modules_config_dir = absolute("modules_config_dir", o.modules_config_dir, os)?
            .unwrap_or_else(|| match os {
                // The name the Windows installer has always used.
                Os::Windows => config_dir.join("modules-config"),
                _ => config_dir.join("modules"),
            });
        let modules_data_dir = absolute("modules_data_dir", o.modules_data_dir, os)?
            .unwrap_or_else(|| match os {
                Os::Windows => config_dir.join("modules-data"),
                _ => data_dir.join("modules"),
            });

        Ok(Paths {
            os,
            mode,
            config_dir,
            state_dir,
            data_dir,
            log_dir,
            cache_dir,
            runtime_dir,
            backup_dir,
            modules_store,
            modules_config_dir,
            modules_data_dir,
        })
    }

    /// The layout of the current process, environment overrides only.
    pub fn from_process() -> Result<Paths, PathsError> {
        Paths::resolve(&PathEnv::from_process(), &Overrides::default())
    }

    /// The system configuration file (`<config_dir>/config.toml`).
    pub fn config_file(&self) -> PathBuf {
        self.config_dir.join("config.toml")
    }

    /// The example configuration shipped beside it.
    pub fn config_example_file(&self) -> PathBuf {
        self.config_dir.join("config.toml.example")
    }

    /// `data.key`, the root of the data-at-rest keys.
    pub fn data_key_file(&self) -> PathBuf {
        self.state_dir.join(DATA_KEY)
    }

    /// The one-time token guarding the installation wizard.
    pub fn setup_token_file(&self) -> PathBuf {
        self.state_dir.join(SETUP_TOKEN)
    }

    /// The generated first administrator password.
    pub fn initial_admin_password_file(&self) -> PathBuf {
        self.state_dir.join(INITIAL_ADMIN_PASSWORD)
    }

    /// Certificates and keys managed by the core.
    pub fn tls_dir(&self) -> PathBuf {
        self.state_dir.join("tls")
    }

    /// SQLite databases (one file per schema).
    pub fn sqlite_dir(&self) -> PathBuf {
        self.data_dir.join("db")
    }

    pub fn themes_dir(&self) -> PathBuf {
        self.data_dir.join("themes")
    }

    pub fn exports_dir(&self) -> PathBuf {
        self.data_dir.join("exports")
    }
}

pub const DATA_KEY: &str = "data.key";
pub const SETUP_TOKEN: &str = "setup-token";
pub const INITIAL_ADMIN_PASSWORD: &str = "initial-admin-password";

/// Directories where versions before `kubuno-paths` may have written the state
/// files (`data.key`, `setup-token`, `initial-admin-password`).
///
/// The old rule was "`/var/lib/kubuno` if that directory exists, else the
/// working directory". So the candidates are:
/// - `/var/lib/kubuno`, which on Windows is relative to the current drive (it
///   meant `C:\var\lib\kubuno` for a process started on `C:`), so both that
///   drive's spelling and `C:\var\lib\kubuno` are listed;
/// - the working directories the installers gave the service (`%ProgramData%\Kubuno`
///   on Windows, `/usr/local/var/kubuno` on macOS), so that a CLI started from
///   anywhere still finds the service's old key;
/// - the current working directory.
///
/// The list is deduplicated; it is up to the caller to skip the new location.
pub fn legacy_state_dirs(env: &PathEnv) -> Vec<PathBuf> {
    let mut dirs: Vec<PathBuf> = Vec::new();
    match env.os() {
        Os::Windows => {
            if let Some(drive) = env.cwd().and_then(drive_of) {
                dirs.push(PathBuf::from(format!(r"{drive}\var\lib\kubuno")));
            }
            dirs.push(PathBuf::from(r"C:\var\lib\kubuno"));
            if let Some(pd) = env.program_data() {
                dirs.push(pd.join("Kubuno"));
            }
        }
        Os::MacOs => {
            dirs.push(PathBuf::from("/var/lib/kubuno"));
            dirs.push(PathBuf::from("/usr/local/var/kubuno"));
        }
        Os::Linux => dirs.push(PathBuf::from("/var/lib/kubuno")),
    }
    if let Some(cwd) = env.cwd() {
        dirs.push(cwd.to_path_buf());
    }
    let mut out: Vec<PathBuf> = Vec::new();
    for d in dirs {
        if !out.iter().any(|o| same_lexical(o, &d, env.os())) {
            out.push(d);
        }
    }
    out
}

/// The drive (`C:`) a Windows path is on, `\\?\` prefix tolerated.
fn drive_of(p: &Path) -> Option<String> {
    let s = p.to_string_lossy();
    let s = s.strip_prefix(r"\\?\").unwrap_or(&s);
    let b = s.as_bytes();
    if b.len() >= 2 && b[0].is_ascii_alphabetic() && b[1] == b':' {
        Some(format!("{}:", (b[0] as char).to_ascii_uppercase()))
    } else {
        None
    }
}

/// Lexical path equality with the target OS's rules (Windows: case-insensitive,
/// `/` = `\`, `\\?\` ignored, trailing separators ignored).
pub fn same_lexical(a: &Path, b: &Path, os: Os) -> bool {
    fn norm(p: &Path, os: Os) -> String {
        let s = p.to_string_lossy().to_string();
        match os {
            Os::Windows => {
                let s = s.strip_prefix(r"\\?\").unwrap_or(&s).replace('/', "\\");
                s.trim_end_matches('\\').to_lowercase()
            }
            _ => {
                let t = s.trim_end_matches('/');
                if t.is_empty() { "/".to_string() } else { t.to_string() }
            }
        }
    }
    norm(a, os) == norm(b, os)
}
