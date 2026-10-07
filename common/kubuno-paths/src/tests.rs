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
        config_dir: Some(p("/srv/config")),
        state_dir: Some(p("/srv/state-from-config")),
        data_dir: Some(p("/srv/data")),
        ..Overrides::default()
    };
    let env = PathEnv::new(Os::Linux).with_var("KUBUNO_PATHS_STATE_DIR", "/srv/state-from-env");
    let paths = Paths::resolve(&env, &config).unwrap();
    assert_eq!(paths.state_dir, p("/srv/state-from-env"));
    assert_eq!(paths.data_dir, p("/srv/data"));
    // Derived directories follow the overridden data directory.
    assert_eq!(paths.modules_store, p("/srv/data/modules-store"));
    assert_eq!(paths.modules_data_dir, p("/srv/data/modules"));
    assert_eq!(paths.modules_config_dir, p("/srv/config/modules"));
    // A separate instance never lands in the system FHS homes either.
    assert_eq!(paths.backup_dir, p("/srv/data/backups"));
    assert_eq!(paths.log_dir, p("/srv/state-from-env/logs"));
    assert_eq!(paths.cache_dir, p("/srv/state-from-env/cache"));
    assert_eq!(paths.runtime_dir, p("/srv/state-from-env/run"));

    // Moving only the data directory keeps the system instance (and its FHS homes).
    let env = PathEnv::new(Os::Linux).with_var("KUBUNO_PATHS_DATA_DIR", "/srv/data");
    let paths = resolve(&env);
    assert_eq!(paths.backup_dir, p("/var/backups/kubuno"));
    assert_eq!(paths.log_dir, p("/var/log/kubuno"));
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
        .with_var("KUBUNO_PATHS_STATE_DIR", r"\\server\share\kubuno")
        .with_var("KUBUNO_PATHS_CONFIG_DIR", r"\\server\share\kubuno\config")
        .with_var("KUBUNO_PATHS_DATA_DIR", r"\\server\share\kubuno\data");
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
        vec![p(r"D:\var\lib\kubuno"), p(r"C:\var\lib\kubuno"), p(r"C:\ProgramData").join("Kubuno")],
        "the current working directory is never a candidate"
    );
    // Same drive: listed once.
    let env = PathEnv::new(Os::Windows)
        .with_program_data(r"C:\ProgramData")
        .with_cwd(r"\\?\c:\programdata\kubuno");
    let dirs = legacy_state_dirs(&env);
    assert_eq!(dirs, vec![p(r"C:\var\lib\kubuno"), p(r"C:\ProgramData").join("Kubuno")]);
}

#[test]
fn legacy_dirs_on_unix() {
    let env = PathEnv::new(Os::Linux).with_cwd("/home/dev/kubuno");
    assert_eq!(legacy_state_dirs(&env), vec![p("/var/lib/kubuno")]);
    let env = PathEnv::new(Os::MacOs).with_cwd("/Users/ada");
    assert_eq!(legacy_state_dirs(&env), vec![p("/var/lib/kubuno"), p("/usr/local/var/kubuno")]);
}

/// The bug this guards against: a development core on a machine that also
/// runs the packaged service looked for `data.key` in `/var/lib/kubuno` and
/// moved it into its own state directory.
#[test]
fn an_instance_with_its_own_state_dir_has_no_legacy_location() {
    for os in [Os::Linux, Os::MacOs, Os::Windows] {
        let home = if os == Os::Windows { r"C:\Users\dev" } else { "/home/dev" };
        let own = if os == Os::Windows { r"C:\Users\dev\kubuno-state" } else { "/home/dev/kubuno-state" };
        let base = PathEnv::new(os)
            .with_var("HOME", home)
            .with_program_data(r"C:\ProgramData")
            .with_local_app_data(r"C:\Users\dev\AppData\Local")
            .with_cwd(home);

        // Explicit state directory through the environment.
        let env = base
            .clone()
            .with_var("KUBUNO_PATHS_STATE_DIR", own)
            .with_var("KUBUNO_PATHS_CONFIG_DIR", own)
            .with_var("KUBUNO_PATHS_DATA_DIR", own);
        let paths = resolve(&env);
        assert!(!is_default_system_instance(&env, &paths), "{os:?}");
        assert!(legacy_state_dirs_for(&env, &paths).is_empty(), "{os:?}: env override");

        // Explicit state directory through the configuration (`[paths]`).
        let cfg = Overrides {
            config_dir: Some(p(own)),
            state_dir: Some(p(own)),
            data_dir: Some(p(own)),
            ..Overrides::default()
        };
        let paths = Paths::resolve(&base, &cfg).unwrap();
        assert!(legacy_state_dirs_for(&base, &paths).is_empty(), "{os:?}: [paths] override");

        // User mode: per-user directories, never the system ones.
        let env = base.clone().with_var(ENV_MODE, "user");
        let paths = resolve(&env);
        assert!(legacy_state_dirs_for(&env, &paths).is_empty(), "{os:?}: user mode");

        // An override that does not move the state directory keeps it the
        // system instance.
        let env = base.clone().with_var("KUBUNO_PATHS_LOG_DIR", own);
        let paths = resolve(&env);
        assert!(is_default_system_instance(&env, &paths), "{os:?}: log override only");
    }
}

#[test]
fn the_default_system_instance_keeps_its_legacy_locations_but_never_its_own_dir() {
    // Linux: the state directory IS /var/lib/kubuno, so there is nothing to
    // migrate from: the packaged service's key never moves.
    let env = PathEnv::new(Os::Linux).with_cwd("/var/lib/kubuno");
    let paths = resolve(&env);
    assert!(is_default_system_instance(&env, &paths));
    assert!(legacy_state_dirs_for(&env, &paths).is_empty());

    // Windows: the pre-`kubuno-paths` locations of the same service.
    let env = PathEnv::new(Os::Windows)
        .with_program_data(r"C:\ProgramData")
        .with_cwd(r"C:\ProgramData\Kubuno");
    let paths = resolve(&env);
    assert_eq!(
        legacy_state_dirs_for(&env, &paths),
        vec![p(r"C:\var\lib\kubuno"), p(r"C:\ProgramData").join("Kubuno")]
    );

    // macOS.
    let env = PathEnv::new(Os::MacOs).with_cwd("/");
    let paths = resolve(&env);
    assert_eq!(legacy_state_dirs_for(&env, &paths), vec![p("/var/lib/kubuno"), p("/usr/local/var/kubuno")]);
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

fn accept(_: &Path, _: &str) -> Result<(), String> {
    Ok(())
}

#[test]
fn migration_copies_the_key_and_leaves_the_source_untouched() {
    let s = Scratch::new("copy");
    let target = s.path("new/state/data.key");
    let old = s.write("var/lib/kubuno/data.key", "abc123\n");
    let before = std::fs::metadata(&old).unwrap().modified().unwrap();
    let out = migrate_secret_file(&target, &[old.clone(), s.path("other/data.key")], &accept).unwrap();
    assert_eq!(out, MigrationOutcome::Copied { from: old.clone(), to: target.clone() });
    assert_eq!(std::fs::read_to_string(&target).unwrap(), "abc123\n");
    // The source is never moved, renamed or rewritten.
    assert_eq!(std::fs::read_to_string(&old).unwrap(), "abc123\n");
    assert_eq!(std::fs::metadata(&old).unwrap().modified().unwrap(), before);
    assert!(!s.path("var/lib/kubuno/data.key.migrated").exists());
    // No temporary file is left behind.
    let left: Vec<_> = std::fs::read_dir(s.path("new/state")).unwrap().flatten().map(|e| e.file_name()).collect();
    assert_eq!(left.len(), 1, "{left:?}");

    // A second run finds the key in place, reads nothing else and reports the
    // legacy copy as stale.
    let again = migrate_secret_file(&target, std::slice::from_ref(&old), &accept).unwrap();
    assert_eq!(again, MigrationOutcome::InPlace { path: target.clone(), stale: vec![old.clone()] });
    assert!(old.exists());
}

#[test]
fn migration_refused_by_the_check_puts_nothing_in_place() {
    let s = Scratch::new("refused");
    let target = s.path("state/data.key");
    let old = s.write("legacy/data.key", "k\n");
    let err = migrate_secret_file(&target, std::slice::from_ref(&old), &|_, _| Err("foreign key".into())).unwrap_err();
    assert!(matches!(err, MigrationError::VerifyFailed { .. }), "{err}");
    assert!(err.to_string().contains("foreign key"), "{err}");
    assert!(!target.exists());
    assert_eq!(std::fs::read_to_string(&old).unwrap(), "k\n");
    assert_eq!(std::fs::read_dir(s.path("state")).unwrap().count(), 0, "no temporary file left");
}

#[test]
fn migration_check_sees_the_value_read_back_from_the_copy() {
    let s = Scratch::new("check-value");
    let target = s.path("state/data.key");
    let old = s.write("legacy/data.key", "  the-key \n");
    let seen = std::cell::RefCell::new(None);
    migrate_secret_file(&target, std::slice::from_ref(&old), &|from, v| {
        *seen.borrow_mut() = Some((from.to_path_buf(), v.to_string()));
        Ok(())
    })
    .unwrap();
    assert_eq!(seen.into_inner(), Some((old, "the-key".to_string())));
}

#[test]
fn migration_does_not_replace_a_target_that_appears_meanwhile() {
    let s = Scratch::new("race");
    let target = s.path("state/data.key");
    let old = s.write("legacy/data.key", "old\n");
    // The check runs just before the copy is linked into place: simulate
    // another process creating the target at that moment.
    let err = migrate_secret_file(&target, std::slice::from_ref(&old), &|_, _| {
        std::fs::write(&target, "concurrent\n").map_err(|e| e.to_string())
    })
    .unwrap_err();
    assert!(matches!(err, MigrationError::Io { .. }), "{err}");
    assert_eq!(std::fs::read_to_string(&target).unwrap(), "concurrent\n");
    assert_eq!(std::fs::read_to_string(&old).unwrap(), "old\n");
}

#[test]
fn migration_new_location_only_is_used_as_is() {
    let s = Scratch::new("new-only");
    let target = s.write("state/data.key", "k1\n");
    let out = migrate_secret_file(&target, &[s.path("legacy/data.key")], &accept).unwrap();
    assert_eq!(out, MigrationOutcome::InPlace { path: target.clone(), stale: vec![] });
    assert_eq!(std::fs::read_to_string(&target).unwrap(), "k1\n");
}

#[test]
fn migration_with_a_key_in_place_never_reads_or_touches_legacy_copies() {
    let s = Scratch::new("in-place");
    let target = s.write("state/data.key", "new-key\n");
    let old = s.write("legacy/data.key", "old-key\n");
    // A different legacy value is not a conflict: the instance's own key wins
    // (it may have been rotated since) and the old copy stays as it is.
    let out = migrate_secret_file(&target, std::slice::from_ref(&old), &accept).unwrap();
    assert_eq!(out, MigrationOutcome::InPlace { path: target.clone(), stale: vec![old.clone()] });
    assert_eq!(std::fs::read_to_string(&target).unwrap(), "new-key\n");
    assert_eq!(std::fs::read_to_string(&old).unwrap(), "old-key\n");
}

#[test]
fn migration_two_different_legacy_copies_refuse_and_touch_nothing() {
    let s = Scratch::new("two-legacy");
    let target = s.path("state/data.key");
    let a = s.write("a/data.key", "one");
    let b = s.write("b/data.key", "two");
    let err = migrate_secret_file(&target, &[a.clone(), b.clone()], &accept).unwrap_err();
    match &err {
        MigrationError::Conflict { found, .. } => assert_eq!(found, &vec![a.clone(), b.clone()]),
        other => panic!("unexpected error {other:?}"),
    }
    assert!(err.to_string().contains("Refusing to choose"), "{err}");
    assert!(!target.exists(), "no key is written while the conflict stands");
    assert_eq!(std::fs::read_to_string(&a).unwrap(), "one");
    assert_eq!(std::fs::read_to_string(&b).unwrap(), "two");
}

#[test]
fn migration_identical_legacy_copies_are_one_source() {
    let s = Scratch::new("two-same");
    let target = s.path("state/data.key");
    let a = s.write("a/data.key", "same\n");
    let b = s.write("b/data.key", "same");
    let out = migrate_secret_file(&target, &[a.clone(), b.clone()], &accept).unwrap();
    assert_eq!(out, MigrationOutcome::Copied { from: a.clone(), to: target.clone() });
    assert!(a.exists() && b.exists());
}

#[test]
fn migration_none_reports_not_found_and_creates_nothing() {
    let s = Scratch::new("none");
    let target = s.path("state/data.key");
    let out = migrate_secret_file(&target, &[s.path("a/data.key"), s.path("b/data.key")], &accept).unwrap();
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
    let out = migrate_secret_file(&target, &[target.clone(), blank.clone()], &accept).unwrap();
    assert_eq!(out, MigrationOutcome::InPlace { path: target.clone(), stale: vec![blank.clone()] });
    assert!(blank.exists(), "a blank file is not a copy of the key and is left alone");
}

#[cfg(unix)]
#[test]
fn migrated_key_is_private() {
    use std::os::unix::fs::PermissionsExt;
    let s = Scratch::new("private");
    let target = s.path("state/data.key");
    let old = s.write("legacy/data.key", "k");
    migrate_secret_file(&target, &[old], &accept).unwrap();
    assert_eq!(std::fs::metadata(&target).unwrap().permissions().mode() & 0o777, 0o600);
}


#[test]
fn host_target_uses_package_spellings() {
    let (os, arch) = host_target();
    assert!(["linux", "windows", "macos"].contains(&os) || !os.is_empty());
    assert!(!arch.is_empty());
    assert_eq!(Os::current().as_str(), if cfg!(windows) { "windows" } else if cfg!(target_os = "macos") { "macos" } else { "linux" });
}

// ── Separate instances ──────────────────────────────────────────────────────

#[test]
fn a_state_dir_of_its_own_requires_its_own_config_and_data_dirs() {
    for (os, own) in [(Os::Linux, "/home/dev/k"), (Os::MacOs, "/Users/dev/k"), (Os::Windows, r"C:\dev\k")] {
        let env = PathEnv::new(os).with_program_data(r"C:\ProgramData").with_var("KUBUNO_PATHS_STATE_DIR", own);
        assert_eq!(
            Paths::resolve(&env, &Overrides::default()),
            Err(PathsError::PartialOverride { missing: vec!["config_dir", "data_dir"] }),
            "{os:?}"
        );
        let err = Paths::resolve(&env.clone().with_var("KUBUNO_PATHS_CONFIG_DIR", own), &Overrides::default())
            .unwrap_err();
        assert_eq!(err, PathsError::PartialOverride { missing: vec!["data_dir"] });
        assert!(err.to_string().contains("KUBUNO_PATHS_DATA_DIR"), "{err}");
        // User mode has no system directories to leak into.
        let user = env
            .with_var(ENV_MODE, "user")
            .with_var("HOME", "/home/dev")
            .with_local_app_data(r"C:\dev\AppData");
        assert!(Paths::resolve(&user, &Overrides::default()).is_ok(), "{os:?}");
    }
    // Naming the system state directory itself is still the system instance.
    let env = PathEnv::new(Os::Linux).with_var("KUBUNO_PATHS_STATE_DIR", "/var/lib/kubuno/");
    assert_eq!(resolve(&env).config_dir, p("/etc/kubuno"));
}

// ── Configuration files ─────────────────────────────────────────────────────

fn ctx(service: bool) -> ServiceContext {
    ServiceContext { service_manager: service, ..ServiceContext::default() }
}

struct Layout {
    env: PathEnv,
    instance: Paths,
    system: Paths,
}

fn layout(env: PathEnv) -> Layout {
    let instance = resolve(&env);
    let system = default_system_layout(&env).unwrap();
    Layout { env, instance, system }
}

fn plan_for(l: &Layout, explicit: Option<&str>, local: Option<&str>, service: ServiceContext) -> ConfigPlan {
    let explicit = explicit.map(PathBuf::from);
    let local = local.map(PathBuf::from);
    let legacy = vec![p("/etc/kubuno/config.toml")];
    plan_config_files(&ConfigInputs {
        instance: &l.instance,
        system: &l.system,
        cwd: l.env.cwd(),
        explicit: explicit.as_deref(),
        local: local.as_deref(),
        legacy_system: &legacy,
        service,
    })
}

#[test]
fn the_packaged_service_reads_the_system_configuration_on_every_os() {
    // Linux: systemd unit, User=kubuno, WorkingDirectory=/var/lib/kubuno.
    let l = layout(PathEnv::new(Os::Linux).with_cwd("/var/lib/kubuno"));
    let plan = plan_for(&l, None, None, ctx(true));
    assert_eq!(plan.system, vec![p("/etc/kubuno/config.toml")]);
    assert_eq!(plan.skipped, None);
    // A config.toml in its working directory (= its state directory) is read
    // first and the system file still wins over it, exactly as before.
    let plan = plan_for(&l, None, Some("/var/lib/kubuno/config.toml"), ctx(true));
    assert_eq!(plan.local, Some(p("/var/lib/kubuno/config.toml")));
    assert_eq!(plan.system, vec![p("/etc/kubuno/config.toml")]);

    // Windows: WinSW service, working directory %ProgramData%\Kubuno (the config dir).
    let l = layout(
        PathEnv::new(Os::Windows)
            .with_program_data(r"C:\ProgramData")
            .with_cwd(r"C:\ProgramData\Kubuno"),
    );
    let plan = plan_for(&l, None, Some(r"C:\ProgramData\Kubuno\config.toml"), ctx(true));
    assert_eq!(plan.system, vec![p(r"C:\ProgramData").join("Kubuno").join("config.toml")]);
    assert_eq!(plan.instance, None, "the own file is the system file, listed once");

    // macOS: launchd daemon; the pre-kubuno-paths /etc/kubuno file comes first.
    let l = layout(PathEnv::new(Os::MacOs).with_cwd("/Library/Application Support/Kubuno"));
    let plan = plan_for(&l, None, None, ctx(true));
    assert_eq!(
        plan.system,
        vec![p("/etc/kubuno/config.toml"), p("/Library/Application Support/Kubuno/config.toml")]
    );
}

#[test]
fn an_administrator_or_the_service_account_reads_the_system_configuration() {
    let l = layout(PathEnv::new(Os::Linux).with_cwd("/root"));
    let admin = ServiceContext { privileged: true, ..ServiceContext::default() };
    assert_eq!(plan_for(&l, None, None, admin).system, vec![p("/etc/kubuno/config.toml")]);
    let account = ServiceContext { service_account: true, ..ServiceContext::default() };
    assert_eq!(plan_for(&l, None, None, account).system, vec![p("/etc/kubuno/config.toml")]);
}

#[test]
fn nothing_else_ever_reads_the_system_configuration() {
    for os in [Os::Linux, Os::MacOs, Os::Windows] {
        let (home, own) = if os == Os::Windows { (r"C:\dev", r"C:\dev\k") } else { ("/home/dev", "/home/dev/k") };
        let base = PathEnv::new(os)
            .with_var("HOME", home)
            .with_program_data(r"C:\ProgramData")
            .with_local_app_data(r"C:\dev\AppData\Local")
            .with_cwd(home);
        let local_path = PathBuf::from(home).join("config.toml");
        let local = local_path.to_str().unwrap();
        let admin = ServiceContext { privileged: true, service_manager: true, service_account: true };

        // Explicit configuration: that file only.
        let l = layout(base.clone());
        let plan = plan_for(&l, Some("/srv/kubuno.toml"), Some(local), admin);
        assert_eq!(plan.explicit, Some(p("/srv/kubuno.toml")));
        assert!(plan.system.is_empty() && plan.local.is_none() && plan.instance.is_none());
        assert_eq!(plan.skipped.unwrap().1, SystemConfigSkip::Explicit);

        // A config file of its own in a working directory that is not the
        // instance's: a development checkout.
        let plan = plan_for(&l, None, Some(local), admin);
        assert!(plan.system.is_empty(), "{os:?}");
        assert_eq!(plan.local, Some(p(local)));
        assert_eq!(plan.skipped.unwrap().1, SystemConfigSkip::LocalConfig(p(local)));

        // The default layout, but an ordinary user outside the service manager.
        let plan = plan_for(&l, None, None, ServiceContext::default());
        assert!(plan.system.is_empty());
        let (files, why) = plan.skipped.unwrap();
        assert_eq!(why, SystemConfigSkip::NotService);
        assert!(files.contains(&l.system.config_file()));

        // A state directory of its own.
        let l = layout(
            base.clone()
                .with_var("KUBUNO_PATHS_STATE_DIR", own)
                .with_var("KUBUNO_PATHS_CONFIG_DIR", own)
                .with_var("KUBUNO_PATHS_DATA_DIR", own),
        );
        let plan = plan_for(&l, None, None, admin);
        assert!(plan.system.is_empty());
        assert_eq!(plan.instance, Some(PathBuf::from(own).join("config.toml")), "its own file is read");
        assert_eq!(plan.skipped.unwrap().1, SystemConfigSkip::NotSystemInstance);

        // User mode.
        let l = layout(base.clone().with_var(ENV_MODE, "user"));
        let plan = plan_for(&l, None, None, admin);
        assert!(plan.system.is_empty());
        assert!(plan.instance.is_some());
        assert_eq!(plan.skipped.unwrap().1, SystemConfigSkip::NotSystemInstance);

        // User mode pointed at the system configuration directory: still not read.
        let sys_cfg = default_system_layout(&base).unwrap().config_dir;
        let l = layout(
            base.clone()
                .with_var(ENV_MODE, "user")
                .with_var("KUBUNO_PATHS_CONFIG_DIR", sys_cfg.to_str().unwrap()),
        );
        let plan = plan_for(&l, None, None, admin);
        assert!(plan.system.is_empty() && plan.instance.is_none(), "{os:?}");
    }
}

#[test]
fn write_target_follows_the_files_read() {
    let l = layout(PathEnv::new(Os::Linux).with_cwd("/home/dev"));
    let sys = l.system.config_file();
    let plan = plan_for(&l, None, Some("/home/dev/config.toml"), ctx(false));
    assert_eq!(plan.write_target(l.env.cwd(), &sys), p("/home/dev/config.toml"));
    let plan = plan_for(&l, None, None, ctx(false));
    assert_eq!(plan.write_target(l.env.cwd(), &sys), p("/home/dev/config.toml"), "never the system file");
    let plan = plan_for(&l, None, None, ctx(true));
    assert_eq!(plan.write_target(l.env.cwd(), &sys), sys);
    let plan = plan_for(&l, Some("/srv/x.toml"), None, ctx(true));
    assert_eq!(plan.write_target(l.env.cwd(), &sys), p("/srv/x.toml"));
}

#[test]
fn service_context_from_process_facts() {
    let linux = PathEnv::new(Os::Linux);
    let facts = ProcessFacts { pid: 4242, ppid: 1, ..ProcessFacts::default() };
    // systemd system unit.
    assert!(ServiceContext::from_facts(&linux.clone().with_var("INVOCATION_ID", "abc"), &facts).service_manager);
    // A user unit or a shell that inherited INVOCATION_ID: parent is not PID 1.
    let user_unit = ProcessFacts { ppid: 1234, ..facts };
    assert!(!ServiceContext::from_facts(&linux.clone().with_var("INVOCATION_ID", "abc"), &user_unit).is_service());
    // No INVOCATION_ID: an orphan process is not a service.
    assert!(!ServiceContext::from_facts(&linux, &facts).is_service());
    // PID 1 of a container.
    assert!(ServiceContext::from_facts(&linux, &ProcessFacts { pid: 1, ..facts }).service_manager);
    // The service account, root.
    assert!(ServiceContext::from_facts(&linux, &ProcessFacts { owns_system_state: true, ..user_unit }).is_service());
    assert!(ServiceContext::from_facts(&linux, &ProcessFacts { privileged: true, ..user_unit }).is_service());

    let mac = PathEnv::new(Os::MacOs);
    let launchd = mac.clone().with_var("XPC_SERVICE_NAME", "com.kubuno.core");
    assert!(ServiceContext::from_facts(&launchd, &facts).service_manager);
    assert!(!ServiceContext::from_facts(&mac.with_var("XPC_SERVICE_NAME", "0"), &facts).service_manager);

    let win = PathEnv::new(Os::Windows);
    assert!(ServiceContext::from_facts(&win, &ProcessFacts { session_zero: true, ..user_unit }).service_manager);
    assert!(!ServiceContext::from_facts(&win, &user_unit).is_service());
}

#[test]
fn local_config_is_found_with_any_supported_extension() {
    let s = Scratch::new("find-config");
    assert_eq!(find_config_in(&s.0), None);
    let f = s.write("config.yaml", "a: 1");
    assert_eq!(find_config_in(&s.0), Some(f));
    let t = s.write("config.toml", "a = 1");
    assert_eq!(find_config_in(&s.0), Some(t), "toml first");
}
