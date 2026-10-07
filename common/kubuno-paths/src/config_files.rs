//! Which configuration files an instance reads, and who the process runs as.
//!
//! The system configuration file (`/etc/kubuno/config.toml`,
//! `%ProgramData%\Kubuno\config.toml`, `/Library/Application Support/Kubuno/config.toml`,
//! plus the pre-`kubuno-paths` `/etc/kubuno/config.toml` on macOS) holds the
//! system instance's database credentials and secrets. Only that instance
//! reads it:
//!
//! - no configuration named explicitly (`--config` / `KV_CONFIG_FILE`);
//! - the default system layout: system mode, the platform's state directory;
//! - no configuration file of its own in the working directory, unless the
//!   working directory IS one of the instance's own directories (the
//!   packaged service runs in `/var/lib/kubuno` or `%ProgramData%\Kubuno`);
//! - running as the service: started by the service manager (systemd,
//!   launchd, the Windows service control manager, or as PID 1 of a
//!   container), as the account that owns the system state directory, or
//!   with administrative rights (`sudo kubuno …`, an elevated prompt): the
//!   administration commands act on the system instance.
//!
//! Anything else (a development core, a second instance, user mode) never
//! reads it, and the caller reports why. These checks prevent accidents; the
//! file permissions remain the barrier against a hostile local user.
//!
//! [`plan`] is pure (every fact is an input) so every rule is tested on every
//! host; [`ServiceContext::detect`] gathers the facts of the real process.

use crate::env::{Os, PathEnv};
use crate::layout::{is_system_instance, same_lexical, Paths};
use std::fmt;
use std::path::{Path, PathBuf};

/// The extensions the configuration loader recognises for `config.<ext>`.
pub const CONFIG_EXTENSIONS: [&str; 7] = ["toml", "json", "yaml", "yml", "ini", "ron", "json5"];

/// How the process was started, as far as the configuration rules care.
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub struct ServiceContext {
    /// root (effective uid 0) or an elevated administrator token.
    pub privileged: bool,
    /// Runs as the account that owns the system instance's state directory.
    pub service_account: bool,
    /// Started by the service manager, or PID 1 of a container.
    pub service_manager: bool,
}

impl ServiceContext {
    pub fn is_service(&self) -> bool {
        self.privileged || self.service_account || self.service_manager
    }

    /// One line for the logs.
    pub fn describe(&self) -> &'static str {
        if self.service_manager {
            "started by the service manager"
        } else if self.service_account {
            "running as the service account"
        } else if self.privileged {
            "running with administrative rights"
        } else {
            "running as an ordinary user, outside the service manager"
        }
    }

    /// The facts of the current process. `system_state_dir` is the default
    /// system instance's state directory: only its owner is looked at (no
    /// content is read).
    pub fn detect(env: &PathEnv, system_state_dir: &Path) -> Self {
        let facts = ProcessFacts::current(system_state_dir);
        Self::from_facts(env, &facts)
    }

    /// [`detect`](Self::detect) on given facts (testable on every host).
    pub fn from_facts(env: &PathEnv, f: &ProcessFacts) -> Self {
        let service_manager = match env.os() {
            // systemd sets INVOCATION_ID for the units it starts; a system
            // unit's parent is PID 1 (a user unit's is the user manager).
            Os::Linux => f.pid == 1 || (env.var("INVOCATION_ID").is_some() && f.ppid == 1),
            // launchd sets XPC_SERVICE_NAME to the job label ("0" outside a job).
            Os::MacOs => f.pid == 1 || (env.var("XPC_SERVICE_NAME").is_some_and(|v| v != "0") && f.ppid == 1),
            // Services run in session 0, interactive users never do.
            Os::Windows => f.session_zero,
        };
        ServiceContext {
            privileged: f.privileged,
            service_account: f.owns_system_state,
            service_manager,
        }
    }
}

/// Raw facts about the process.
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub struct ProcessFacts {
    pub pid: u32,
    pub ppid: u32,
    pub privileged: bool,
    /// The process's effective user owns the system state directory.
    pub owns_system_state: bool,
    /// Windows: the process runs in session 0 (services).
    pub session_zero: bool,
}

impl ProcessFacts {
    pub fn current(system_state_dir: &Path) -> Self {
        #[cfg(unix)]
        {
            use std::os::unix::fs::MetadataExt;
            // SAFETY: geteuid and getppid cannot fail and take no pointer.
            let (euid, ppid) = unsafe { (libc::geteuid(), libc::getppid()) };
            let owner = std::fs::metadata(system_state_dir).ok().map(|m| m.uid());
            ProcessFacts {
                pid: std::process::id(),
                ppid: u32::try_from(ppid).unwrap_or(0),
                privileged: euid == 0,
                owns_system_state: owner == Some(euid) && euid != 0,
                session_zero: false,
            }
        }
        #[cfg(windows)]
        {
            let _ = system_state_dir;
            ProcessFacts {
                pid: std::process::id(),
                ppid: 0,
                privileged: crate::perms::windows::process_is_elevated(),
                owns_system_state: false,
                session_zero: crate::perms::windows::process_in_session_zero(),
            }
        }
        #[cfg(not(any(unix, windows)))]
        {
            let _ = system_state_dir;
            ProcessFacts { pid: std::process::id(), ..ProcessFacts::default() }
        }
    }
}

/// Why the system configuration was not read.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum SystemConfigSkip {
    /// `--config` / `KV_CONFIG_FILE` names the configuration.
    Explicit,
    /// Not the default system instance (user mode, or a state directory of its own).
    NotSystemInstance,
    /// The configuration directory is overridden (`KUBUNO_PATHS_CONFIG_DIR`):
    /// the instance reads its own file there instead.
    OwnConfigDir(PathBuf),
    /// A configuration file of its own sits in the working directory.
    LocalConfig(PathBuf),
    /// The default layout, but neither the service nor an administrator.
    NotService,
}

impl fmt::Display for SystemConfigSkip {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            SystemConfigSkip::Explicit => write!(f, "a configuration file is named explicitly (--config / KV_CONFIG_FILE)"),
            SystemConfigSkip::NotSystemInstance => write!(
                f,
                "this is not the system instance (user mode, or a state directory of its own)"
            ),
            SystemConfigSkip::OwnConfigDir(p) => write!(
                f,
                "the configuration directory is overridden: this instance reads {} instead",
                p.display()
            ),
            SystemConfigSkip::LocalConfig(p) => write!(
                f,
                "this instance has its own configuration file {} in its working directory",
                p.display()
            ),
            SystemConfigSkip::NotService => write!(
                f,
                "the process is neither the service (service manager, service account) nor run with \
                 administrative rights; run administration commands with sudo / as Administrator, or \
                 name the configuration with --config / KV_CONFIG_FILE"
            ),
        }
    }
}

/// Facts the plan is computed from.
#[derive(Debug, Clone)]
pub struct ConfigInputs<'a> {
    /// This instance's layout (environment overrides applied).
    pub instance: &'a Paths,
    /// The default system instance's layout on this machine.
    pub system: &'a Paths,
    pub cwd: Option<&'a Path>,
    /// `--config` / `KV_CONFIG_FILE`.
    pub explicit: Option<&'a Path>,
    /// The `config.<ext>` file found in the working directory, if any.
    pub local: Option<&'a Path>,
    /// System files of earlier versions (macOS: `/etc/kubuno/config.toml`).
    pub legacy_system: &'a [PathBuf],
    pub service: ServiceContext,
}

/// The configuration files to read, in increasing priority.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ConfigPlan {
    /// The file named explicitly: the only one read when set.
    pub explicit: Option<PathBuf>,
    /// `config.<ext>` in the working directory (lowest priority).
    pub local: Option<PathBuf>,
    /// The instance's own `<config_dir>/config.toml`, when that directory is
    /// not the system one (user mode, `KUBUNO_PATHS_CONFIG_DIR`).
    pub instance: Option<PathBuf>,
    /// System files to read, in order (empty when skipped).
    pub system: Vec<PathBuf>,
    /// System files NOT read, and why.
    pub skipped: Option<(Vec<PathBuf>, SystemConfigSkip)>,
}

impl ConfigPlan {
    /// Where an installer should write this instance's configuration.
    pub fn write_target(&self, cwd: Option<&Path>, system_file: &Path) -> PathBuf {
        if let Some(e) = &self.explicit {
            return e.clone();
        }
        if let Some(s) = self.system.iter().rev().find(|p| p.exists()) {
            return s.clone();
        }
        if let Some(i) = self.instance.as_ref().filter(|p| p.exists()) {
            return i.clone();
        }
        if let Some(l) = &self.local {
            return l.clone();
        }
        if let Some(i) = &self.instance {
            return i.clone();
        }
        if self.skipped.is_none() {
            return system_file.to_path_buf();
        }
        match cwd {
            Some(d) => d.join("config.toml"),
            None => system_file.to_path_buf(),
        }
    }
}

/// The `config.<ext>` file in `dir`, if any (first recognised extension).
pub fn find_config_in(dir: &Path) -> Option<PathBuf> {
    CONFIG_EXTENSIONS.iter().map(|e| dir.join(format!("config.{e}"))).find(|p| p.is_file())
}

/// Decides which configuration files the instance reads. See the module
/// documentation for the rules.
pub fn plan(i: &ConfigInputs<'_>) -> ConfigPlan {
    let os = i.instance.os;
    let mut system_files: Vec<PathBuf> = Vec::new();
    if os == Os::MacOs {
        system_files.extend(i.legacy_system.iter().cloned());
    }
    system_files.push(i.system.config_file());

    if let Some(e) = i.explicit {
        return ConfigPlan {
            explicit: Some(e.to_path_buf()),
            local: None,
            instance: None,
            system: Vec::new(),
            skipped: Some((system_files, SystemConfigSkip::Explicit)),
        };
    }

    let own = i.instance.config_file();
    let own_is_system = system_files.iter().any(|s| same_lexical(s, &own, os));
    let instance = (!own_is_system).then_some(own);

    // A working directory that is one of the instance's own directories is
    // where the service runs, not a development checkout.
    let cwd_is_instance_dir = i.cwd.is_some_and(|c| {
        [&i.instance.state_dir, &i.instance.data_dir, &i.instance.config_dir]
            .iter()
            .any(|d| same_lexical(c, d, os))
    });
    let local = i.local.map(Path::to_path_buf);

    let skip = if !is_system_instance(i.instance, i.system) {
        Some(SystemConfigSkip::NotSystemInstance)
    } else if let Some(own) = &instance {
        Some(SystemConfigSkip::OwnConfigDir(own.clone()))
    } else if let Some(l) = local.as_ref().filter(|_| !cwd_is_instance_dir) {
        Some(SystemConfigSkip::LocalConfig(l.clone()))
    } else if !i.service.is_service() {
        Some(SystemConfigSkip::NotService)
    } else {
        None
    };

    match skip {
        None => ConfigPlan { explicit: None, local, instance, system: system_files, skipped: None },
        Some(reason) => ConfigPlan {
            explicit: None,
            local,
            instance,
            system: Vec::new(),
            skipped: Some((system_files, reason)),
        },
    }
}
