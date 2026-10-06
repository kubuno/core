//! Conformance-vector runner for Kubuno shared cores (SC-0).
//!
//! A shared algorithm (a `kubuno-<domain>-core` crate, or one implemented natively on several platforms) ships
//! **conformance vectors**: JSON suites of inputs and the outputs every implementation must produce. This crate
//! loads and validates a suite (format 1, `vectors/conformance-vectors.schema.json` of the core repository), runs
//! it against a function, compares with JSON semantics and reports every failing case at once. It also verifies a
//! vendored copy of a suite folder against its `VENDOR.json` checksums, so consumers run pinned vectors offline.
//!
//! Use it as a dev-dependency:
//!
//! ```ignore
//! #[test]
//! fn operators_vectors() {
//!     kubuno_vectors::assert_suite("vectors/operators.json", |input| my_core::eval(input));
//! }
//! ```
//!
//! The same format is run by the TypeScript (`@kubuno/vectors`) and Kotlin (`:core-vectors`) runners.
#![forbid(unsafe_code)]

use std::collections::{BTreeMap, BTreeSet};
use std::fmt;
use std::path::{Path, PathBuf};

use serde::Deserialize;
use serde_json::Value;
use sha2::{Digest, Sha256};

/// The file format this runner understands.
pub const FORMAT: u64 = 1;

/// Platform key of this runner in a case's `skip` map.
pub const PLATFORM: &str = "rust";

/// Platform keys a `skip` map may use.
pub const PLATFORMS: [&str; 4] = ["rust", "ts", "kotlin", "swift"];

/// Name of the manifest of a vendored suite folder.
pub const VENDOR_FILE: &str = "VENDOR.json";

/// One suite of conformance vectors.
#[derive(Debug, Clone, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Suite {
    #[serde(rename = "$schema", default)]
    pub schema: Option<String>,
    pub format: u64,
    pub suite: String,
    pub version: String,
    #[serde(default)]
    pub description: Option<String>,
    #[serde(default)]
    pub reference: Option<String>,
    pub cases: Vec<Case>,
}

/// One case: an input and the expected output.
#[derive(Debug, Clone, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Case {
    pub id: String,
    pub input: Value,
    pub expected: Value,
    #[serde(default)]
    pub note: Option<String>,
    /// Platform -> reason of a known, documented divergence.
    #[serde(default)]
    pub skip: BTreeMap<String, String>,
}

/// Manifest of a vendored suite folder (`VENDOR.json`).
#[derive(Debug, Clone, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct VendorManifest {
    pub format: u64,
    /// Repository the suites were copied from.
    pub source: String,
    /// Tag (or commit) they were copied at.
    #[serde(rename = "ref")]
    pub reference: String,
    /// Folder of the suites inside `source`.
    pub path: String,
    /// File name -> `sha256:<hex>` of its content with CRLF normalised to LF.
    pub files: BTreeMap<String, String>,
}

/// Why a suite could not be used.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Error {
    Io { path: PathBuf, message: String },
    Parse { path: PathBuf, message: String },
    Invalid { suite: String, message: String },
    Vendor { dir: PathBuf, message: String },
}

impl fmt::Display for Error {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Error::Io { path, message } => write!(f, "{}: {message}", path.display()),
            Error::Parse { path, message } => write!(f, "{}: not a vector suite: {message}", path.display()),
            Error::Invalid { suite, message } => write!(f, "suite {suite}: {message}"),
            Error::Vendor { dir, message } => {
                write!(f, "{}: vendored vectors do not match {VENDOR_FILE}: {message} (re-vendor them)", dir.display())
            }
        }
    }
}

impl std::error::Error for Error {}

/// Parses and validates a suite from its JSON text.
pub fn parse(text: &str) -> Result<Suite, Error> {
    parse_at(Path::new("<text>"), text)
}

fn parse_at(path: &Path, text: &str) -> Result<Suite, Error> {
    let suite: Suite = serde_json::from_str(text).map_err(|e| Error::Parse { path: path.to_path_buf(), message: e.to_string() })?;
    validate(&suite)?;
    Ok(suite)
}

/// Loads and validates a suite file.
pub fn load(path: impl AsRef<Path>) -> Result<Suite, Error> {
    let path = path.as_ref();
    let text = std::fs::read_to_string(path).map_err(|e| Error::Io { path: path.to_path_buf(), message: e.to_string() })?;
    parse_at(path, &text)
}

/// Checks the rules the JSON Schema states, plus unique case ids.
pub fn validate(suite: &Suite) -> Result<(), Error> {
    let invalid = |message: String| Error::Invalid { suite: suite.suite.clone(), message };
    if suite.format != FORMAT {
        return Err(invalid(format!("format {} is not supported (this runner reads format {FORMAT})", suite.format)));
    }
    if !is_suite_id(&suite.suite) {
        return Err(invalid("the suite id must look like <domain>.<area>".into()));
    }
    if !is_semver(&suite.version) {
        return Err(invalid(format!("version {:?} is not X.Y.Z", suite.version)));
    }
    if suite.cases.is_empty() {
        return Err(invalid("no cases".into()));
    }
    let mut seen = BTreeSet::new();
    for case in &suite.cases {
        if !is_case_id(&case.id) {
            return Err(invalid(format!("case id {:?} is not allowed", case.id)));
        }
        if !seen.insert(case.id.as_str()) {
            return Err(invalid(format!("duplicate case id {:?}", case.id)));
        }
        for (platform, reason) in &case.skip {
            if !PLATFORMS.contains(&platform.as_str()) {
                return Err(invalid(format!("case {}: unknown platform {platform:?} in skip", case.id)));
            }
            if reason.is_empty() {
                return Err(invalid(format!("case {}: a skip needs a reason", case.id)));
            }
        }
    }
    Ok(())
}

fn is_suite_id(s: &str) -> bool {
    let parts: Vec<&str> = s.split('.').collect();
    parts.len() >= 2
        && parts.iter().all(|p| {
            let mut chars = p.chars();
            matches!(chars.next(), Some('a'..='z')) && chars.all(|c| matches!(c, 'a'..='z' | '0'..='9' | '-'))
        })
}

fn is_case_id(s: &str) -> bool {
    let mut chars = s.chars();
    matches!(chars.next(), Some('a'..='z' | '0'..='9'))
        && chars.all(|c| matches!(c, 'a'..='z' | '0'..='9' | '.' | '_' | '/' | '-'))
}

fn is_semver(s: &str) -> bool {
    let parts: Vec<&str> = s.split('.').collect();
    parts.len() == 3
        && parts.iter().all(|p| !p.is_empty() && p.chars().all(|c| c.is_ascii_digit()) && (p.len() == 1 || !p.starts_with('0')))
}

/// JSON equality of vectors: numbers compare by value (`1 == 1.0`), object key order is irrelevant, arrays are
/// ordered.
pub fn json_eq(a: &Value, b: &Value) -> bool {
    match (a, b) {
        (Value::Number(x), Value::Number(y)) => {
            if let (Some(i), Some(j)) = (x.as_i64(), y.as_i64()) {
                return i == j;
            }
            if let (Some(i), Some(j)) = (x.as_u64(), y.as_u64()) {
                return i == j;
            }
            match (x.as_f64(), y.as_f64()) {
                (Some(i), Some(j)) => i == j,
                _ => false,
            }
        }
        (Value::Array(x), Value::Array(y)) => x.len() == y.len() && x.iter().zip(y).all(|(i, j)| json_eq(i, j)),
        (Value::Object(x), Value::Object(y)) => {
            x.len() == y.len() && x.iter().all(|(k, v)| y.get(k).is_some_and(|w| json_eq(v, w)))
        }
        _ => a == b,
    }
}

/// A failing case.
#[derive(Debug, Clone)]
pub struct Failure {
    pub id: String,
    pub expected: Value,
    pub actual: Value,
    pub note: Option<String>,
}

/// Result of running a suite.
#[derive(Debug, Clone)]
pub struct Outcome {
    pub suite: String,
    pub version: String,
    pub passed: usize,
    /// Case id -> reason.
    pub skipped: Vec<(String, String)>,
    pub failures: Vec<Failure>,
}

impl Outcome {
    pub fn is_ok(&self) -> bool {
        self.failures.is_empty()
    }

    /// Human-readable report listing every failure.
    pub fn report(&self) -> String {
        let mut out = format!(
            "suite {} {}: {} passed, {} failed, {} skipped",
            self.suite,
            self.version,
            self.passed,
            self.failures.len(),
            self.skipped.len()
        );
        for f in &self.failures {
            out.push_str(&format!(
                "\n  FAIL {}\n    expected: {}\n    actual:   {}",
                f.id,
                compact(&f.expected),
                compact(&f.actual)
            ));
            if let Some(note) = &f.note {
                out.push_str(&format!("\n    note:     {note}"));
            }
        }
        for (id, reason) in &self.skipped {
            out.push_str(&format!("\n  skip {id}: {reason}"));
        }
        out
    }

    /// Panics with the full report when a case failed (for `#[test]` functions).
    #[track_caller]
    pub fn assert_ok(&self) {
        if !self.is_ok() {
            panic!("{}", self.report());
        }
    }
}

fn compact(v: &Value) -> String {
    serde_json::to_string(v).unwrap_or_else(|_| format!("{v:?}"))
}

/// Runs every case of `suite` through `f` (cases skipped for Rust are reported, not run).
pub fn run(suite: &Suite, mut f: impl FnMut(&Value) -> Value) -> Outcome {
    let mut outcome = Outcome {
        suite: suite.suite.clone(),
        version: suite.version.clone(),
        passed: 0,
        skipped: Vec::new(),
        failures: Vec::new(),
    };
    for case in &suite.cases {
        if let Some(reason) = case.skip.get(PLATFORM) {
            outcome.skipped.push((case.id.clone(), reason.clone()));
            continue;
        }
        let actual = f(&case.input);
        if json_eq(&case.expected, &actual) {
            outcome.passed += 1;
        } else {
            outcome.failures.push(Failure {
                id: case.id.clone(),
                expected: case.expected.clone(),
                actual,
                note: case.note.clone(),
            });
        }
    }
    outcome
}

/// Loads `path`, runs it through `f` and panics with every failure (for `#[test]` functions). A relative path is
/// resolved against the current directory, which is the package root under `cargo test`.
#[track_caller]
pub fn assert_suite(path: impl AsRef<Path>, f: impl FnMut(&Value) -> Value) -> Outcome {
    let suite = match load(path) {
        Ok(s) => s,
        Err(e) => panic!("{e}"),
    };
    let outcome = run(&suite, f);
    outcome.assert_ok();
    outcome
}

/// `sha256:<hex>` of a vector file, computed after replacing every CRLF with LF so that a Windows checkout with
/// `core.autocrlf` produces the same checksum.
pub fn checksum(bytes: &[u8]) -> String {
    let mut normalised = Vec::with_capacity(bytes.len());
    let mut i = 0;
    while i < bytes.len() {
        if bytes[i] == b'\r' && bytes.get(i + 1) == Some(&b'\n') {
            i += 1;
            continue;
        }
        normalised.push(bytes[i]);
        i += 1;
    }
    format!("sha256:{}", hex::encode(Sha256::digest(&normalised)))
}

/// Reads `dir/VENDOR.json` and checks that every listed file exists with its checksum and that no other `*.json`
/// suite sits in the folder unlisted.
pub fn verify_vendor(dir: impl AsRef<Path>) -> Result<VendorManifest, Error> {
    let dir = dir.as_ref();
    let fail = |message: String| Error::Vendor { dir: dir.to_path_buf(), message };
    let manifest_path = dir.join(VENDOR_FILE);
    let text = std::fs::read_to_string(&manifest_path).map_err(|e| fail(format!("{VENDOR_FILE}: {e}")))?;
    let manifest: VendorManifest = serde_json::from_str(&text).map_err(|e| fail(format!("{VENDOR_FILE}: {e}")))?;
    if manifest.format != FORMAT {
        return Err(fail(format!("format {} is not supported", manifest.format)));
    }
    if manifest.files.is_empty() {
        return Err(fail("no files listed".into()));
    }
    for (name, expected) in &manifest.files {
        let bytes = std::fs::read(dir.join(name)).map_err(|e| fail(format!("{name}: {e}")))?;
        let actual = checksum(&bytes);
        if &actual != expected {
            return Err(fail(format!("{name}: checksum {actual}, {VENDOR_FILE} says {expected}")));
        }
    }
    let entries = std::fs::read_dir(dir).map_err(|e| fail(e.to_string()))?;
    for entry in entries.flatten() {
        let name = entry.file_name().to_string_lossy().into_owned();
        if name.ends_with(".json") && name != VENDOR_FILE && !manifest.files.contains_key(&name) {
            return Err(fail(format!("{name} is not listed")));
        }
    }
    Ok(manifest)
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn suite(cases: Value) -> String {
        json!({ "format": 1, "suite": "demo.add", "version": "1.0.0", "cases": cases }).to_string()
    }

    #[test]
    fn numbers_compare_by_value_and_keys_by_name() {
        assert!(json_eq(&json!(1), &json!(1.0)));
        assert!(json_eq(&json!({ "a": 1, "b": [1, 2] }), &json!({ "b": [1.0, 2], "a": 1 })));
        assert!(!json_eq(&json!([1, 2]), &json!([2, 1])));
        assert!(!json_eq(&json!({ "a": 1 }), &json!({ "a": 1, "b": null })));
        assert!(!json_eq(&json!("1"), &json!(1)));
    }

    #[test]
    fn runs_reports_every_failure_and_skips() {
        let s = parse(&suite(json!([
            { "id": "one", "input": [1, 1], "expected": 2 },
            { "id": "two", "input": [2, 2], "expected": 5 },
            { "id": "three", "input": [3, 3], "expected": 7 },
            { "id": "skipped", "input": [0, 0], "expected": 1, "skip": { "rust": "documented divergence" } }
        ])))
        .expect("valid suite");
        let out = run(&s, |input| {
            let a = input[0].as_i64().unwrap_or(0);
            let b = input[1].as_i64().unwrap_or(0);
            json!(a + b)
        });
        assert_eq!(out.passed, 1);
        assert_eq!(out.failures.iter().map(|f| f.id.as_str()).collect::<Vec<_>>(), ["two", "three"]);
        assert_eq!(out.skipped.len(), 1);
        assert!(out.report().contains("FAIL three"));
    }

    #[test]
    fn refuses_bad_suites() {
        let dup = suite(json!([{ "id": "a", "input": 0, "expected": 0 }, { "id": "a", "input": 0, "expected": 0 }]));
        assert!(matches!(parse(&dup), Err(Error::Invalid { .. })));
        let fmt = json!({ "format": 2, "suite": "demo.add", "version": "1.0.0", "cases": [{ "id": "a", "input": 0, "expected": 0 }] });
        assert!(matches!(parse(&fmt.to_string()), Err(Error::Invalid { .. })));
        let unknown = json!({ "format": 1, "suite": "demo.add", "version": "1.0.0", "extra": true, "cases": [] });
        assert!(matches!(parse(&unknown.to_string()), Err(Error::Parse { .. })));
        let platform = suite(json!([{ "id": "a", "input": 0, "expected": 0, "skip": { "cobol": "x" } }]));
        assert!(matches!(parse(&platform), Err(Error::Invalid { .. })));
        let version = json!({ "format": 1, "suite": "demo.add", "version": "1.0", "cases": [{ "id": "a", "input": 0, "expected": 0 }] });
        assert!(matches!(parse(&version.to_string()), Err(Error::Invalid { .. })));
        let id = json!({ "format": 1, "suite": "demo", "version": "1.0.0", "cases": [{ "id": "a", "input": 0, "expected": 0 }] });
        assert!(matches!(parse(&id.to_string()), Err(Error::Invalid { .. })));
    }

    #[test]
    fn checksum_ignores_crlf() {
        assert_eq!(checksum(b"{\r\n}\r\n"), checksum(b"{\n}\n"));
        assert_ne!(checksum(b"{\n}\n"), checksum(b"{\n }\n"));
        assert_eq!(
            checksum(b""),
            "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
        );
    }

    #[test]
    fn verifies_a_vendored_folder() {
        let dir = std::env::temp_dir().join(format!("kubuno-vectors-test-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&dir);
        std::fs::create_dir_all(&dir).expect("temp dir");
        let body = suite(json!([{ "id": "a", "input": 0, "expected": 0 }]));
        std::fs::write(dir.join("demo.json"), &body).expect("write suite");
        let manifest = json!({
            "format": 1, "source": "https://github.com/kubuno/core", "ref": "vectors-v0.1.0", "path": "vectors/demo",
            "files": { "demo.json": checksum(body.as_bytes()) }
        });
        std::fs::write(dir.join(VENDOR_FILE), manifest.to_string()).expect("write manifest");
        assert!(verify_vendor(&dir).is_ok());

        std::fs::write(dir.join("demo.json"), body.replace("1.0.0", "1.0.1")).expect("tamper");
        assert!(matches!(verify_vendor(&dir), Err(Error::Vendor { .. })));

        std::fs::write(dir.join("demo.json"), &body).expect("restore");
        std::fs::write(dir.join("stray.json"), "{}").expect("stray");
        assert!(matches!(verify_vendor(&dir), Err(Error::Vendor { .. })));
        let _ = std::fs::remove_dir_all(&dir);
    }

    #[test]
    fn the_core_repository_suites_are_valid() {
        // The sync suites live in the core repository next to this crate.
        let root = Path::new(env!("CARGO_MANIFEST_DIR")).join("../vectors/sync");
        for name in ["outbox-backoff.json", "http-classify.json"] {
            let path = root.join(name);
            if let Err(e) = load(&path) {
                panic!("{e}");
            }
        }
    }
}
