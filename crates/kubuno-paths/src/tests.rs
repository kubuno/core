use super::*;
use std::path::{Path, PathBuf};

fn p(s: &str) -> PathBuf {
    PathBuf::from(s)
}

fn resolve(env: &PathEnv) -> Paths {
    Paths::resolve(env, &Overrides::default()).unwrap()
}

// ── Layout per OS ───────────────────────────────────────────────────────────

#[test]
fn linux_system_layout_is_the_historical_fhs_one() {
    let paths = resolve(&PathEnv::new(Os::Linux));
    assert_eq!(paths.mode, Mode::System);
    assert_eq!(paths.config_dir, p("/etc/kubuno"));
    assert_eq!(paths.config_file(), p("/etc/kubuno/config.toml"));
    assert_eq!(paths.data_key_file(), p("/var/lib/kubuno/data.key"));
    assert_eq!(paths.setup_token_file(), p("/var/lib/kubuno/setup-token"));
    assert_eq!(paths.initial_admin_password_file(), p("/var/lib/kubuno/initial-admin-password"));
    assert_eq!(paths.tls_dir(), p("/var/lib/kubuno/tls"));
    assert_eq!(paths.log_dir, p("/var/log/kubuno"));
    assert_eq!(paths.backup_dir, p("/var/backups/kubuno"));
    assert_eq!(paths.modules_store, p("/var/lib/kubuno/modules-store"));
    assert_eq!(paths.modules_config_dir, p("/etc/kubuno/modules"));
    assert_eq!(paths.modules_data_dir, p("/var/lib/kubuno/modules"));
    assert_eq!(paths.themes_dir(), p("/var/lib/kubuno/themes"));
    assert_eq!(paths.sqlite_dir(), p("/var/lib/kubuno/db"));
    assert_eq!(paths.exports_dir(), p("/var/lib/kubuno/exports"));
    assert_eq!(paths.cache_dir, p("/var/cache/kubuno"));
    assert_eq!(paths.runtime_dir, p("/run/kubuno"));
}

#[test]
fn linux_user_layout_follows_xdg() {
    let env = PathEnv::new(Os::Linux).with_var(ENV_MODE, "user").with_var("HOME", "/home/ada");
    let paths = resolve(&env);
    assert_eq!(paths.mode, Mode::User);
    assert_eq!(paths.config_dir, p("/home/ada/.config/kubuno"));
    assert_eq!(paths.data_dir, p("/home/ada/.local/share/kubuno"));
    assert_eq!(paths.state_dir, p("/home/ada/.local/state/kubuno"));
    assert_eq!(paths.log_dir, p("/home/ada/.local/state/kubuno/logs"));
    assert_eq!(paths.cache_dir, p("/home/ada/.cache/kubuno"));
    assert_eq!(paths.runtime_dir, p("/home/ada/.local/state/kubuno/run"));
    assert_eq!(paths.modules_store, p("/home/ada/.local/share/kubuno/modules-store"));

    // XDG variables win when absolute, are ignored when relative.
    let env = env
        .with_var("XDG_CONFIG_HOME", "/cfg")
        .with_var("XDG_DATA_HOME", "relative/data")
        .with_var("XDG_RUNTIME_DIR", "/run/user/1000");
    let paths = resolve(&env);
    assert_eq!(paths.config_dir, p("/cfg/kubuno"));
    assert_eq!(paths.data_dir, p("/home/ada/.local/share/kubuno"));
    assert_eq!(paths.runtime_dir, p("/run/user/1000/kubuno"));
}

#[test]
fn linux_user_mode_without_home_is_an_explicit_error() {
    let env = PathEnv::new(Os::Linux).with_var(ENV_MODE, "user");
    assert_eq!(Paths::resolve(&env, &Overrides::default()), Err(PathsError::MissingBase("HOME")));
}

#[test]
fn windows_system_layout_lives_under_program_data() {
    let pd = p(r"C:\ProgramData");
    let env = PathEnv::new(Os::Windows).with_program_data(pd.clone());
    let paths = resolve(&env);
    let base = pd.join("Kubuno");
    assert_eq!(paths.config_file(), base.join("config.toml"));
    assert_eq!(paths.state_dir, base.join("state"));
    assert_eq!(paths.data_key_file(), base.join("state").join("data.key"));
    assert_eq!(paths.data_dir, base.join("data"));
    assert_eq!(paths.log_dir, base.join("logs"));
    assert_eq!(paths.backup_dir, base.join("data").join("backups"));
    assert_eq!(paths.modules_store, base.join("data").join("modules-store"));
    // The names the Windows installer has always written.
    assert_eq!(paths.modules_config_dir, base.join("modules-config"));
    assert_eq!(paths.modules_data_dir, base.join("modules-data"));
}

#[test]
fn windows_program_data_falls_back_to_the_variable_never_to_the_profile() {
    let env = PathEnv::new(Os::Windows)
        .with_var("ProgramData", r"D:\PD")
        .with_var("USERPROFILE", r"C:\Users\ada")
        .with_var("HOME", r"C:\Users\ada");
    assert_eq!(resolve(&env).config_dir, p(r"D:\PD").join("Kubuno"));

    let env = PathEnv::new(Os::Windows).with_var("USERPROFILE", r"C:\Users\ada").with_var("HOME", "/c/Users/ada");
    assert_eq!(Paths::resolve(&env, &Overrides::default()), Err(PathsError::MissingBase("%ProgramData%")));
}

#[test]
fn windows_user_layout_lives_under_local_app_data() {
    let lad = p(r"C:\Users\ada\AppData\Local");
    let env = PathEnv::new(Os::Windows)
        .with_var(ENV_MODE, "user")
        .with_program_data(r"C:\ProgramData")
        .with_local_app_data(lad.clone());
    let paths = resolve(&env);
    assert_eq!(paths.config_dir, lad.join("Kubuno"));
    assert_eq!(paths.state_dir, lad.join("Kubuno").join("state"));
}

#[test]
fn macos_system_layout_lives_under_library() {
    let paths = resolve(&PathEnv::new(Os::MacOs));
    let base = p("/Library/Application Support/Kubuno");
    assert_eq!(paths.config_file(), base.join("config.toml"));
    assert_eq!(paths.data_key_file(), base.join("state").join("data.key"));
    assert_eq!(paths.data_dir, base.join("data"));
    assert_eq!(paths.log_dir, p("/Library/Logs/Kubuno"));
    assert_eq!(paths.cache_dir, p("/Library/Caches/Kubuno"));
    assert_eq!(paths.modules_store, base.join("data").join("modules-store"));
    assert_eq!(paths.modules_config_dir, base.join("modules"));
    assert_eq!(paths.modules_data_dir, base.join("data").join("modules"));
}

#[test]
fn macos_user_layout_lives_under_the_home_library() {
    let env = PathEnv::new(Os::MacOs).with_var(ENV_MODE, "user").with_var("HOME", "/Users/ada");
    let paths = resolve(&env);
    assert_eq!(paths.config_dir, p("/Users/ada/Library/Application Support/Kubuno"));
    assert_eq!(paths.log_dir, p("/Users/ada/Library/Logs/Kubuno"));
}

// ── Overrides ───────────────────────────────────────────────────────────────

#[test]
fn environment_overrides_win_over_configuration_overrides() {
    let config = Overrides {
        state_dir: Some(p("/srv/state-from-config")),
        data_dir: Some(p("/srv/data")),
        ..Overrides::default()
    };
    let env = PathEnv::new(Os::Linux).with_var("KUBUNO_PATHS_STATE_DIR", "/srv/state-from-env");
    let paths = Paths::resolve(&env, &config).unwrap();
    assert_eq!(paths.state_dir, p("/srv/state-from-env"));
    assert_eq!(paths.data_dir, p("/srv/data"));
    // Derived directories follow the overridden data directory…
    assert_eq!(paths.modules_store, p("/srv/data/modules-store"));
    assert_eq!(paths.modules_data_dir, p("/srv/data/modules"));
    // …but not the ones with their own FHS home.
    assert_eq!(paths.backup_dir, p("/var/backups/kubuno"));
}

#[test]
fn every_directory_has_an_environment_override() {
    let mut env = PathEnv::new(Os::Linux);
    for (field, var) in ENV_DIRS {
        env = env.with_var(var, &format!("/o/{field}"));
    }
    let paths = resolve(&env);
    assert_eq!(paths.config_dir, p("/o/config_dir"));
    assert_eq!(paths.state_dir, p("/o/state_dir"));
    assert_eq!(paths.data_dir, p("/o/data_dir"));
    assert_eq!(paths.log_dir, p("/o/log_dir"));
    assert_eq!(paths.cache_dir, p("/o/cache_dir"));
    assert_eq!(paths.runtime_dir, p("/o/runtime_dir"));
    assert_eq!(paths.backup_dir, p("/o/backup_dir"));
    assert_eq!(paths.modules_store, p("/o/modules_store"));
    assert_eq!(paths.modules_config_dir, p("/o/modules_config_dir"));
    assert_eq!(paths.modules_data_dir, p("/o/modules_data_dir"));
}

#[test]
fn mode_comes_from_configuration_unless_the_environment_says_otherwise() {
    let config = Overrides { mode: Some(Mode::User), ..Overrides::default() };
    let env = PathEnv::new(Os::Linux).with_var("HOME", "/home/ada");
    assert_eq!(Paths::resolve(&env, &config).unwrap().mode, Mode::User);
    let env = env.with_var(ENV_MODE, "system");
    assert_eq!(Paths::resolve(&env, &config).unwrap().mode, Mode::System);
}

#[test]
fn invalid_mode_and_relative_overrides_are_rejected() {
    let env = PathEnv::new(Os::Linux).with_var(ENV_MODE, "portable");
    assert_eq!(
        Paths::resolve(&env, &Overrides::default()),
        Err(PathsError::InvalidMode("portable".into()))
    );
    let env = PathEnv::new(Os::Linux).with_var("KUBUNO_PATHS_STATE_DIR", "state");
    assert!(matches!(
        Paths::resolve(&env, &Overrides::default()),
        Err(PathsError::RelativeOverride { field: "state_dir", .. })
    ));
    // `/var/lib/kubuno` is NOT absolute on Windows: it is drive-relative.
    let env = PathEnv::new(Os::Windows)
        .with_program_data(r"C:\ProgramData")
        .with_var("KUBUNO_PATHS_STATE_DIR", "/var/lib/kubuno");
    assert!(matches!(
        Paths::resolve(&env, &Overrides::default()),
        Err(PathsError::RelativeOverride { field: "state_dir", .. })
    ));
    let env = PathEnv::new(Os::Windows)
        .with_program_data(r"C:\ProgramData")
        .with_var("KUBUNO_PATHS_STATE_DIR", r"\\server\share\kubuno");
    assert!(Paths::resolve(&env, &Overrides::default()).is_ok());
}

#[test]
fn blank_variables_count_as_unset() {
    let env = PathEnv::new(Os::Linux).with_var("KUBUNO_PATHS_STATE_DIR", "   ").with_var(ENV_MODE, "");
    assert_eq!(resolve(&env).state_dir, p("/var/lib/kubuno"));
}

#[test]
fn resolution_never_depends_on_the_working_directory() {
    let a = resolve(&PathEnv::new(Os::Linux).with_cwd("/tmp"));
    let b = resolve(&PathEnv::new(Os::Linux).with_cwd("/home/ada/src"));
    assert_eq!(a, b);
}

// ── Legacy locations ────────────────────────────────────────────────────────

#[test]
fn legacy_dirs_on_windows_include_the_drive_relative_var_lib_and_the_service_cwd() {
    let env = PathEnv::new(Os::Windows)
        .with_program_data(r"C:\ProgramData")
        .with_cwd(r"D:\work");
    let dirs = legacy_state_dirs(&env);
    assert_eq!(
        dirs,
        vec![
            p(r"D:\var\lib\kubuno"),
            p(r"C:\var\lib\kubuno"),
            p(r"C:\ProgramData").join("Kubuno"),
            p(r"D:\work"),
        ]
    );
    // Same drive: listed once; the service CWD equal to the current one too.
    let env = PathEnv::new(Os::Windows)
        .with_program_data(r"C:\ProgramData")
        .with_cwd(r"\\?\c:\programdata\kubuno");
    let dirs = legacy_state_dirs(&env);
    assert_eq!(dirs, vec![p(r"C:\var\lib\kubuno"), p(r"C:\ProgramData").join("Kubuno")]);
}

#[test]
fn legacy_dirs_on_unix() {
    let env = PathEnv::new(Os::Linux).with_cwd("/var/lib/kubuno/");
    assert_eq!(legacy_state_dirs(&env), vec![p("/var/lib/kubuno")]);
    let env = PathEnv::new(Os::MacOs).with_cwd("/Users/ada");
    assert_eq!(
        legacy_state_dirs(&env),
        vec![p("/var/lib/kubuno"), p("/usr/local/var/kubuno"), p("/Users/ada")]
    );
}

#[test]
fn lexical_comparison_follows_the_target_os() {
    assert!(same_lexical(Path::new(r"C:\A\b"), Path::new("c:/a/B/"), Os::Windows));
    assert!(!same_lexical(Path::new("/a/B"), Path::new("/a/b"), Os::Linux));
    assert!(same_lexical(Path::new("/a/b/"), Path::new("/a/b"), Os::MacOs));
}

// ── Secret migration ───────────────────────────────────────────────────────

struct Scratch(PathBuf);

impl Scratch {
    fn new(name: &str) -> Self {
        let d = std::env::temp_dir().join(format!("kubuno-paths-mig-{name}-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&d);
        std::fs::create_dir_all(&d).unwrap();
        Scratch(d)
    }
    fn path(&self, rel: &str) -> PathBuf {
        self.0.join(rel)
    }
    fn write(&self, rel: &str, content: &str) -> PathBuf {
        let f = self.path(rel);
        std::fs::create_dir_all(f.parent().unwrap()).unwrap();
        std::fs::write(&f, content).unwrap();
        f
    }
}

impl Drop for Scratch {
    fn drop(&mut self) {
        let _ = std::fs::remove_dir_all(&self.0);
    }
}

#[test]
fn migration_old_location_only_moves_the_key_and_retires_the_old_copy() {
    let s = Scratch::new("old-only");
    let target = s.path("new/state/data.key");
    let old = s.write("var/lib/kubuno/data.key", "abc123\n");
    let out = migrate_secret_file(&target, &[s.path("var/lib/kubuno/data.key"), s.path("cwd/data.key")]).unwrap();
    match out {
        MigrationOutcome::Migrated { from, to, retired } => {
            assert_eq!(from, old);
            assert_eq!(to, target);
            assert_eq!(retired.len(), 1);
            assert_eq!(retired[0].result, Ok(s.path("var/lib/kubuno/data.key.migrated")));
        }
        other => panic!("unexpected outcome {other:?}"),
    }
    assert_eq!(std::fs::read_to_string(&target).unwrap(), "abc123\n");
    assert!(!old.exists(), "the legacy copy is renamed, not left in place");
    assert_eq!(std::fs::read_to_string(s.path("var/lib/kubuno/data.key.migrated")).unwrap(), "abc123\n");

    // A second run finds the key in place and does nothing else.
    let again = migrate_secret_file(&target, &[s.path("var/lib/kubuno/data.key")]).unwrap();
    assert_eq!(again, MigrationOutcome::InPlace { path: target.clone(), retired: vec![] });
}

#[test]
fn migration_new_location_only_is_used_as_is() {
    let s = Scratch::new("new-only");
    let target = s.write("state/data.key", "k1\n");
    let out = migrate_secret_file(&target, &[s.path("legacy/data.key")]).unwrap();
    assert_eq!(out, MigrationOutcome::InPlace { path: target.clone(), retired: vec![] });
    assert_eq!(std::fs::read_to_string(&target).unwrap(), "k1\n");
}

#[test]
fn migration_both_identical_keeps_the_new_one_and_retires_the_old() {
    let s = Scratch::new("identical");
    let target = s.write("state/data.key", "same\n");
    let old = s.write("legacy/data.key", "same");
    let out = migrate_secret_file(&target, std::slice::from_ref(&old)).unwrap();
    match out {
        MigrationOutcome::InPlace { retired, .. } => {
            assert_eq!(retired.len(), 1);
            assert!(retired[0].result.is_ok());
        }
        other => panic!("unexpected outcome {other:?}"),
    }
    assert!(!old.exists());
    assert_eq!(std::fs::read_to_string(&target).unwrap(), "same\n");
}

#[test]
fn migration_both_different_refuses_and_touches_nothing() {
    let s = Scratch::new("different");
    let target = s.write("state/data.key", "new-key\n");
    let old = s.write("legacy/data.key", "old-key\n");
    let err = migrate_secret_file(&target, std::slice::from_ref(&old)).unwrap_err();
    match &err {
        MigrationError::Conflict { found, .. } => assert_eq!(found, &vec![target.clone(), old.clone()]),
        other => panic!("unexpected error {other:?}"),
    }
    let msg = err.to_string();
    assert!(msg.contains("Refusing to choose"), "{msg}");
    assert_eq!(std::fs::read_to_string(&target).unwrap(), "new-key\n");
    assert_eq!(std::fs::read_to_string(&old).unwrap(), "old-key\n");
}

#[test]
fn migration_two_different_legacy_copies_refuse_even_without_a_new_one() {
    let s = Scratch::new("two-legacy");
    let target = s.path("state/data.key");
    let a = s.write("a/data.key", "one");
    let b = s.write("b/data.key", "two");
    let err = migrate_secret_file(&target, &[a.clone(), b.clone()]).unwrap_err();
    assert!(matches!(err, MigrationError::Conflict { .. }));
    assert!(!target.exists(), "no key is written while the conflict stands");
}

#[test]
fn migration_none_reports_not_found_and_creates_nothing() {
    let s = Scratch::new("none");
    let target = s.path("state/data.key");
    let out = migrate_secret_file(&target, &[s.path("a/data.key"), s.path("b/data.key")]).unwrap();
    assert_eq!(out, MigrationOutcome::NotFound);
    assert!(!target.exists());
}

#[test]
fn migration_ignores_blank_files_and_the_target_listed_as_legacy() {
    let s = Scratch::new("blank");
    let target = s.write("state/data.key", "k\n");
    let blank = s.write("legacy/data.key", "  \n");
    // The target itself appears among the legacy candidates (Linux: the old and
    // new locations are the same file).
    let out = migrate_secret_file(&target, &[target.clone(), blank.clone()]).unwrap();
    assert_eq!(out, MigrationOutcome::InPlace { path: target.clone(), retired: vec![] });
    assert!(blank.exists(), "a blank file is not a copy of the key and is left alone");
}

#[test]
fn migration_retires_next_to_an_earlier_retired_copy() {
    let s = Scratch::new("retired-twice");
    let target = s.path("state/data.key");
    s.write("legacy/data.key.migrated", "older");
    let old = s.write("legacy/data.key", "k");
    let out = migrate_secret_file(&target, std::slice::from_ref(&old)).unwrap();
    match out {
        MigrationOutcome::Migrated { retired, .. } => {
            assert_eq!(retired[0].result, Ok(s.path("legacy/data.key.migrated-2")));
        }
        other => panic!("unexpected outcome {other:?}"),
    }
    assert_eq!(std::fs::read_to_string(s.path("legacy/data.key.migrated")).unwrap(), "older");
}

#[cfg(unix)]
#[test]
fn migrated_key_is_private() {
    use std::os::unix::fs::PermissionsExt;
    let s = Scratch::new("private");
    let target = s.path("state/data.key");
    let old = s.write("legacy/data.key", "k");
    migrate_secret_file(&target, &[old]).unwrap();
    assert_eq!(std::fs::metadata(&target).unwrap().permissions().mode() & 0o777, 0o600);
}

#[test]
fn host_target_uses_package_spellings() {
    let (os, arch) = host_target();
    assert!(["linux", "windows", "macos"].contains(&os) || !os.is_empty());
    assert!(!arch.is_empty());
    assert_eq!(Os::current().as_str(), if cfg!(windows) { "windows" } else if cfg!(target_os = "macos") { "macos" } else { "linux" });
}
