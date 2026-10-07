//! The instance's platform directories (see the `kubuno-paths` crate).
//!
//! Resolved once per process from the environment and the optional `[paths]`
//! section of the configuration, then shared: the settings defaults, the data
//! key, the setup token, the initial administrator password, the TLS material
//! and the module store all read the same answer. No location is ever inferred
//! from whether a directory happens to exist.

use kubuno_paths::{Mode, Overrides, PathEnv, Paths, PathsError};
use serde::Deserialize;
use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::OnceLock;

static CURRENT: OnceLock<Paths> = OnceLock::new();

/// `[paths]`: optional explicit directories. The `KUBUNO_PATHS_*` environment
/// variables take precedence over it.
#[derive(Debug, Clone, Default, Deserialize)]
pub struct PathsSettings {
    /// `system` (default: the packaged service) or `user` (per-user/dev).
    #[serde(default)]
    pub mode: Option<String>,
    #[serde(default)]
    pub state_dir: Option<String>,
    #[serde(default)]
    pub data_dir: Option<String>,
    #[serde(default)]
    pub log_dir: Option<String>,
    #[serde(default)]
    pub cache_dir: Option<String>,
    #[serde(default)]
    pub runtime_dir: Option<String>,
    #[serde(default)]
    pub backup_dir: Option<String>,
}

impl PathsSettings {
    pub fn overrides(&self) -> Result<Overrides, PathsError> {
        let mode = match self.mode.as_deref().map(str::trim).filter(|m| !m.is_empty()) {
            Some(m) => Some(Mode::parse(m).ok_or_else(|| PathsError::InvalidMode(m.to_string()))?),
            None => None,
        };
        let mut o = Overrides { mode, ..Overrides::default() };
        let fields = [
            ("state_dir", &self.state_dir),
            ("data_dir", &self.data_dir),
            ("log_dir", &self.log_dir),
            ("cache_dir", &self.cache_dir),
            ("runtime_dir", &self.runtime_dir),
            ("backup_dir", &self.backup_dir),
        ];
        for (name, value) in fields {
            if let Some(v) = value.as_deref().map(str::trim).filter(|v| !v.is_empty()) {
                o.set(name, PathBuf::from(v));
            }
        }
        Ok(o)
    }
}

/// Resolves the layout for this process and makes it the current one (the
/// first resolution wins: a process has a single layout).
pub fn init(settings: &PathsSettings) -> Result<&'static Paths, PathsError> {
    if let Some(p) = CURRENT.get() {
        return Ok(p);
    }
    let paths = Paths::resolve(&PathEnv::from_process(), &settings.overrides()?)?;
    Ok(CURRENT.get_or_init(|| paths))
}

/// Set when [`current`] had to fall back to the platform defaults because the
/// environment did not resolve: the layout is then a guess, not the instance's.
static FALLBACK: AtomicBool = AtomicBool::new(false);

/// The current layout. When the configuration was never loaded (a unit test,
/// a command that does not read it), the environment alone decides; an
/// invalid environment then falls back to the platform defaults, and the
/// error surfaces at the next configuration load.
///
/// Secrets never use this fallback: see [`try_current`].
pub fn current() -> &'static Paths {
    CURRENT.get_or_init(|| {
        let env = PathEnv::from_process();
        Paths::resolve(&env, &Overrides::default()).unwrap_or_else(|_| {
            FALLBACK.store(true, Ordering::SeqCst);
            Paths::resolve(&PathEnv::new(env.os()).with_program_data(fallback_program_data(&env)), &Overrides::default())
                .unwrap_or_else(|_| last_resort())
        })
    })
}

/// The current layout, or an error when it could only be guessed. Used for
/// the instance's secrets (`data.key`, the setup token): a development
/// instance whose `KUBUNO_PATHS_*` variables are invalid must stop, not
/// silently fall back to the system instance's directories.
pub fn try_current() -> Result<&'static Paths, PathsError> {
    let paths = match CURRENT.get() {
        Some(p) => p,
        None => {
            let p = Paths::resolve(&PathEnv::from_process(), &Overrides::default())?;
            CURRENT.get_or_init(|| p)
        }
    };
    if FALLBACK.load(Ordering::SeqCst) {
        // Report the real resolution error when there still is one.
        return Err(Paths::resolve(&PathEnv::from_process(), &Overrides::default())
            .err()
            .unwrap_or(PathsError::MissingBase("the instance directories")));
    }
    Ok(paths)
}

fn fallback_program_data(env: &PathEnv) -> PathBuf {
    env.program_data().unwrap_or_else(|| PathBuf::from(r"C:\ProgramData"))
}

/// Linux defaults, used only if even the bare platform layout cannot be
/// computed (never the case on a supported OS).
fn last_resort() -> Paths {
    let lib = PathBuf::from("/var/lib/kubuno");
    Paths {
        os: kubuno_paths::Os::current(),
        mode: Mode::System,
        config_dir: PathBuf::from("/etc/kubuno"),
        state_dir: lib.clone(),
        data_dir: lib.clone(),
        log_dir: PathBuf::from("/var/log/kubuno"),
        cache_dir: PathBuf::from("/var/cache/kubuno"),
        runtime_dir: PathBuf::from("/run/kubuno"),
        backup_dir: PathBuf::from("/var/backups/kubuno"),
        modules_store: lib.join("modules-store"),
        modules_config_dir: PathBuf::from("/etc/kubuno/modules"),
        modules_data_dir: lib.join("modules"),
    }
}

/// Legacy locations this instance may take `file` from (see
/// [`kubuno_paths::legacy_state_dirs_for`]): none at all unless the instance
/// is the default system instance. A development or second instance, or one
/// whose secret file is named explicitly, never looks into another
/// instance's directory.
pub fn legacy_state_files(paths: &Paths, file: &str) -> Vec<PathBuf> {
    kubuno_paths::legacy_state_dirs_for(&PathEnv::from_process(), paths)
        .into_iter()
        .map(|d| d.join(file))
        .collect()
}

/// Warns about locations older versions used and this one no longer reads,
/// when they still hold something. Never moves anything.
pub fn warn_about_legacy_locations(modules_install_dir: &str) {
    let paths = current();
    if paths.os == kubuno_paths::Os::Linux {
        return; // The Linux layout did not change.
    }
    let configured = std::path::Path::new(modules_install_dir);
    for dir in kubuno_paths::legacy_state_dirs(&PathEnv::from_process()) {
        let old_store = dir.join("modules-store");
        if old_store.is_dir()
            && !kubuno_paths::same_lexical(&old_store, configured, paths.os)
            && std::fs::read_dir(&old_store).map(|mut d| d.next().is_some()).unwrap_or(false)
        {
            tracing::warn!(
                old = %old_store.display(),
                current = %configured.display(),
                "Modules installed by an earlier version are in a store this version no longer reads: \
                 reinstall them, or set server.modules_install_dir to the old store"
            );
        }
    }
}

/// The SQLite directory used when a configuration names none.
pub fn default_sqlite_dir() -> String {
    current().sqlite_dir().to_string_lossy().into_owned()
}
