//! Was this `.kbpkg` built for the machine it is being installed on?
//!
//! A package's layout is the same on every OS, but its content is not: it
//! carries one native executable. Installed on the wrong OS or architecture it
//! unpacks fine and then fails to start with a bare "No such file". So the
//! target is checked at install time, from every source available:
//! 1. the `target` the manifest declares (`[package] target` or
//!    `[module] target`, a Rust triple), when present;
//! 2. the `-<os>-<arch>.kbpkg` suffix `build_kbpkg.sh` gives the file;
//! 3. the header of the executable itself (ELF, PE or Mach-O), which cannot
//!    lie about what it is.
//!
//! Any source that disagrees with the host refuses the install.

use std::io::Read;
use std::path::Path;

use crate::modules::manifest::ModuleManifest;

/// An `(os, arch)` pair with the `std::env::consts` spellings.
#[derive(Debug, Clone, PartialEq, Eq)]
pub(super) struct Target {
    pub os: String,
    /// `x86_64`, `aarch64`, or `universal` (a macOS fat binary).
    pub arch: String,
}

impl Target {
    fn new(os: &str, arch: &str) -> Self {
        Target { os: os.to_string(), arch: arch.to_string() }
    }

    pub(super) fn host() -> Self {
        let (os, arch) = kubuno_paths::host_target();
        Target::new(os, arch)
    }

    fn runs_on(&self, host: &Target) -> bool {
        self.os == host.os && (self.arch == host.arch || (self.arch == "universal" && self.os == "macos"))
    }
}

impl std::fmt::Display for Target {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}/{}", self.os, self.arch)
    }
}

/// `<id>-<version>-<os>-<arch>.kbpkg` → `(os, arch)`, when the name ends that way.
pub(super) fn from_file_name(name: &str) -> Option<Target> {
    let lower = name.to_ascii_lowercase();
    let stem = lower.strip_suffix(".kbpkg")?;
    let mut parts = stem.rsplitn(3, '-');
    let arch = parts.next()?;
    let os = parts.next()?;
    parts.next()?; // something must precede the target
    let os = match os {
        "linux" | "windows" | "macos" => os,
        "darwin" => "macos",
        _ => return None,
    };
    let arch = match arch {
        "x86_64" | "amd64" => "x86_64",
        "aarch64" | "arm64" => "aarch64",
        "universal" => "universal",
        _ => return None,
    };
    Some(Target::new(os, arch))
}

/// A Rust target triple (`x86_64-unknown-linux-gnu`, `aarch64-apple-darwin`,
/// `x86_64-pc-windows-msvc`) → `(os, arch)`.
pub(super) fn from_triple(triple: &str) -> Option<Target> {
    let t = triple.trim().to_ascii_lowercase();
    let arch = t.split('-').next()?;
    let arch = match arch {
        "x86_64" | "amd64" => "x86_64",
        "aarch64" | "arm64" => "aarch64",
        "universal" => "universal",
        other => other,
    };
    let os = if t.contains("windows") {
        "windows"
    } else if t.contains("apple") || t.contains("darwin") {
        "macos"
    } else if t.contains("linux") {
        "linux"
    } else {
        return None;
    };
    Some(Target::new(os, arch))
}

/// Reads the executable format from the first bytes of a file.
pub(super) fn from_binary_header(b: &[u8]) -> Option<Target> {
    let u16le = |at: usize| b.get(at..at + 2).map(|s| u16::from_le_bytes([s[0], s[1]]));
    let u16be = |at: usize| b.get(at..at + 2).map(|s| u16::from_be_bytes([s[0], s[1]]));
    let u32le = |at: usize| b.get(at..at + 4).map(|s| u32::from_le_bytes([s[0], s[1], s[2], s[3]]));

    // ELF: e_machine at offset 18, in the byte order given by EI_DATA.
    if b.starts_with(b"\x7fELF") {
        let machine = if b.get(5) == Some(&2) { u16be(18)? } else { u16le(18)? };
        let arch = match machine {
            0x3E => "x86_64".to_string(),
            0xB7 => "aarch64".to_string(),
            0x03 => "x86".to_string(),
            0x28 => "arm".to_string(),
            m => format!("elf-machine-{m:#x}"),
        };
        return Some(Target { os: "linux".into(), arch });
    }
    // PE: "MZ", then the "PE\0\0" header at e_lfanew, then Machine.
    if b.starts_with(b"MZ") {
        let pe = u32le(0x3C)? as usize;
        if b.get(pe..pe + 4)? != b"PE\0\0" {
            return None;
        }
        let arch = match u16le(pe + 4)? {
            0x8664 => "x86_64".to_string(),
            0xAA64 => "aarch64".to_string(),
            0x014C => "x86".to_string(),
            m => format!("pe-machine-{m:#x}"),
        };
        return Some(Target { os: "windows".into(), arch });
    }
    // Mach-O 64-bit (little-endian) and universal ("fat") binaries.
    match u32le(0)? {
        0xFEED_FACF => {
            let arch = match u32le(4)? {
                0x0100_0007 => "x86_64".to_string(),
                0x0100_000C => "aarch64".to_string(),
                c => format!("macho-cpu-{c:#x}"),
            };
            Some(Target { os: "macos".into(), arch })
        }
        0xBEBA_FECA => Some(Target::new("macos", "universal")),
        _ => None,
    }
}

/// The target the manifest declares, if any.
fn declared(manifest_toml: &str) -> Option<String> {
    let v: toml::Value = toml::from_str(manifest_toml).ok()?;
    ["package", "module"]
        .iter()
        .find_map(|t| v.get(t)?.get("target")?.as_str().map(str::to_string))
}

/// Refuses a package whose target is not this host. `file_name` is the
/// package's file name when known (local installs).
pub(super) fn check(
    file_name: Option<&str>,
    module_dir: &Path,
    manifest_toml: &str,
    manifest: &ModuleManifest,
) -> Result<(), String> {
    check_against(&Target::host(), file_name, module_dir, manifest_toml, manifest)
}

fn check_against(
    host: &Target,
    file_name: Option<&str>,
    module_dir: &Path,
    manifest_toml: &str,
    manifest: &ModuleManifest,
) -> Result<(), String> {
    let refuse = |found: &Target, source: &str| {
        Err(format!(
            "this package was built for {found} ({source}), but this server runs {host}: \
             install the package built for {host} instead ({}-{}-{}-{}.kbpkg)",
            manifest.module.id, manifest.module.version, host.os, host.arch
        ))
    };

    if let Some(triple) = declared(manifest_toml) {
        match from_triple(&triple) {
            Some(t) if !t.runs_on(host) => return refuse(&t, &format!("module.toml target {triple}")),
            Some(_) => {}
            None => return Err(format!("module.toml declares an unknown target {triple:?}")),
        }
    }
    if let Some(t) = file_name.and_then(from_file_name) {
        if !t.runs_on(host) {
            return refuse(&t, "package file name");
        }
    }
    // Interpreted runtimes carry no native code of their own.
    if matches!(manifest.module.runtime.as_str(), "python" | "node") {
        return Ok(());
    }
    let exe = manifest.entrypoint_path(module_dir);
    let mut head = Vec::with_capacity(4096);
    if let Ok(f) = std::fs::File::open(&exe) {
        let _ = f.take(4096).read_to_end(&mut head);
    } else {
        return Err(format!(
            "the package has no executable at {} (declared entrypoint {:?})",
            exe.strip_prefix(module_dir).unwrap_or(&exe).display(),
            manifest.process.entrypoint
        ));
    }
    match from_binary_header(&head) {
        Some(t) if !t.runs_on(host) => refuse(&t, "executable header"),
        // A recognised match, or a format we cannot read (a script): accept.
        _ => Ok(()),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn elf(machine: u16) -> Vec<u8> {
        let mut b = vec![0u8; 64];
        b[..4].copy_from_slice(b"\x7fELF");
        b[4] = 2; // 64-bit
        b[5] = 1; // little-endian
        b[18..20].copy_from_slice(&machine.to_le_bytes());
        b
    }

    fn pe(machine: u16) -> Vec<u8> {
        let mut b = vec![0u8; 0x100];
        b[..2].copy_from_slice(b"MZ");
        b[0x3C..0x40].copy_from_slice(&0x80u32.to_le_bytes());
        b[0x80..0x84].copy_from_slice(b"PE\0\0");
        b[0x84..0x86].copy_from_slice(&machine.to_le_bytes());
        b
    }

    fn macho(cpu: u32) -> Vec<u8> {
        let mut b = vec![0u8; 32];
        b[..4].copy_from_slice(&0xFEED_FACFu32.to_le_bytes());
        b[4..8].copy_from_slice(&cpu.to_le_bytes());
        b
    }

    fn host_binary() -> Vec<u8> {
        match (std::env::consts::OS, std::env::consts::ARCH) {
            ("windows", "aarch64") => pe(0xAA64),
            ("windows", _) => pe(0x8664),
            ("macos", "aarch64") => macho(0x0100_000C),
            ("macos", _) => macho(0x0100_0007),
            (_, "aarch64") => elf(0xB7),
            _ => elf(0x3E),
        }
    }

    #[test]
    fn headers_are_recognised() {
        assert_eq!(from_binary_header(&elf(0x3E)), Some(Target::new("linux", "x86_64")));
        assert_eq!(from_binary_header(&elf(0xB7)), Some(Target::new("linux", "aarch64")));
        assert_eq!(from_binary_header(&pe(0x8664)), Some(Target::new("windows", "x86_64")));
        assert_eq!(from_binary_header(&pe(0xAA64)), Some(Target::new("windows", "aarch64")));
        assert_eq!(from_binary_header(&macho(0x0100_000C)), Some(Target::new("macos", "aarch64")));
        assert_eq!(from_binary_header(&macho(0x0100_0007)), Some(Target::new("macos", "x86_64")));
        assert_eq!(from_binary_header(&[0xCA, 0xFE, 0xBA, 0xBE, 0, 0, 0, 2]), Some(Target::new("macos", "universal")));
        assert_eq!(from_binary_header(b"#!/bin/sh\n"), None);
        assert_eq!(from_binary_header(b"MZ"), None, "truncated PE");
    }

    #[test]
    fn file_names_and_triples_are_parsed() {
        assert_eq!(from_file_name("calendar-0.1.8-linux-x86_64.kbpkg"), Some(Target::new("linux", "x86_64")));
        assert_eq!(from_file_name("drive-0.2.0-macos-aarch64.KBPKG"), Some(Target::new("macos", "aarch64")));
        assert_eq!(from_file_name("drive-0.2.0-windows-x86_64.kbpkg"), Some(Target::new("windows", "x86_64")));
        assert_eq!(from_file_name("drive.kbpkg"), None);
        assert_eq!(from_file_name("my-module.kbpkg"), None);
        assert_eq!(from_triple("x86_64-unknown-linux-gnu"), Some(Target::new("linux", "x86_64")));
        assert_eq!(from_triple("aarch64-apple-darwin"), Some(Target::new("macos", "aarch64")));
        assert_eq!(from_triple("x86_64-pc-windows-msvc"), Some(Target::new("windows", "x86_64")));
        assert_eq!(from_triple("wasm32-unknown-unknown"), None);
    }

    const MANIFEST: &str = r#"
[module]
id = "demo"
display_name = "Demo"
version = "1.2.3"
runtime = "rust"

[process]
entrypoint = "kubuno-demo"

[server]
host = "127.0.0.1"
port = 3999
"#;

    fn module_with(binary: &[u8], toml_src: &str) -> (std::path::PathBuf, ModuleManifest) {
        let dir = std::env::temp_dir().join(format!(
            "kbtarget-{}-{}",
            std::process::id(),
            uuid::Uuid::new_v4()
        ));
        std::fs::create_dir_all(&dir).unwrap();
        std::fs::write(dir.join("kubuno-demo"), binary).unwrap();
        let m: ModuleManifest = toml::from_str(toml_src).unwrap();
        (dir, m)
    }

    #[test]
    fn a_package_for_this_host_is_accepted() {
        let (dir, m) = module_with(&host_binary(), MANIFEST);
        let host = Target::host();
        let name = format!("demo-1.2.3-{}-{}.kbpkg", host.os, host.arch);
        assert_eq!(check(Some(&name), &dir, MANIFEST, &m), Ok(()));
        let _ = std::fs::remove_dir_all(&dir);
    }

    #[test]
    fn a_binary_for_another_os_is_refused_with_a_clear_message() {
        let linux = Target::new("linux", "x86_64");
        let (dir, m) = module_with(&pe(0x8664), MANIFEST);
        let err = check_against(&linux, None, &dir, MANIFEST, &m).unwrap_err();
        assert!(err.contains("built for windows/x86_64 (executable header)"), "{err}");
        assert!(err.contains("demo-1.2.3-linux-x86_64.kbpkg"), "{err}");
        let _ = std::fs::remove_dir_all(&dir);
    }

    #[test]
    fn another_architecture_is_refused() {
        let host = Target::new("linux", "x86_64");
        let (dir, m) = module_with(&elf(0xB7), MANIFEST);
        assert!(check_against(&host, None, &dir, MANIFEST, &m).unwrap_err().contains("linux/aarch64"));
        let _ = std::fs::remove_dir_all(&dir);
    }

    #[test]
    fn the_file_name_and_the_declared_target_are_checked_too() {
        let host = Target::new("windows", "x86_64");
        let (dir, m) = module_with(&pe(0x8664), MANIFEST);
        let err = check_against(&host, Some("demo-1.2.3-linux-x86_64.kbpkg"), &dir, MANIFEST, &m).unwrap_err();
        assert!(err.contains("package file name"), "{err}");

        let declared = format!("{MANIFEST}\n[package]\ntarget = \"aarch64-apple-darwin\"\n");
        let err = check_against(&host, None, &dir, &declared, &m).unwrap_err();
        assert!(err.contains("module.toml target aarch64-apple-darwin"), "{err}");
        let _ = std::fs::remove_dir_all(&dir);
    }

    #[test]
    fn a_universal_macos_binary_runs_on_both_mac_architectures() {
        let fat = [0xCA, 0xFE, 0xBA, 0xBE, 0, 0, 0, 2];
        let (dir, m) = module_with(&fat, MANIFEST);
        assert!(check_against(&Target::new("macos", "aarch64"), None, &dir, MANIFEST, &m).is_ok());
        assert!(check_against(&Target::new("linux", "x86_64"), None, &dir, MANIFEST, &m).is_err());
        let _ = std::fs::remove_dir_all(&dir);
    }

    #[test]
    fn a_missing_executable_is_reported() {
        let (dir, m) = module_with(&host_binary(), MANIFEST);
        std::fs::remove_file(dir.join("kubuno-demo")).unwrap();
        assert!(check(None, &dir, MANIFEST, &m).unwrap_err().contains("no executable"));
        let _ = std::fs::remove_dir_all(&dir);
    }
}
