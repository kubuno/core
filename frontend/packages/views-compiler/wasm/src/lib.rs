//! C ABI of the web `.kbview` compiler for WebAssembly: one entry point, JSON in, JSON out.
//!
//! The host (Node or a browser, `@kubuno/views-compiler`'s `wasm.ts`) allocates a buffer with
//! [`kb_alloc`], writes a UTF-8 JSON request into it and calls [`kb_call`], which frees the request and
//! returns the response as `(ptr << 32) | len`; the host reads it and releases it with [`kb_free`].
//!
//! Requests (`op`): `version`, `session_new`, `session_free {session}`, `add_registry {session, json,
//! label, host}`, `set_user_controls {session, controls}`, `compile {session, source, options}`,
//! `handle_types {session}`, `kbres_parse {text}`, `kbres_write {strings, culture?}` (`.kbres` string resources, WV-6). Every response is `{"ok": true, "result": …}` or `{"ok": false, "error": "…"}`.

use std::cell::RefCell;

use kubuno_views_web::{CompileOptions, CompileRequest, RegistryInput, Session, UserControlRef};
use serde::Deserialize;
use serde_json::{json, Value};

thread_local! {
    static SESSIONS: RefCell<Vec<Option<Session>>> = const { RefCell::new(Vec::new()) };
}

#[derive(Deserialize)]
#[serde(tag = "op", rename_all = "snake_case")]
enum Request {
    Version,
    SessionNew,
    SessionFree { session: usize },
    AddRegistry { session: usize, json: String, label: String, host: bool },
    SetUserControls { session: usize, controls: Vec<UserControlRef> },
    Compile { session: usize, source: String, options: CompileOptions },
    HandleTypes { session: usize },
    KbresParse { text: String },
    KbresWrite { strings: Vec<KbresString>, #[serde(default)] culture: Option<String> },
}

#[derive(Deserialize, serde::Serialize)]
struct KbresString {
    name: String,
    value: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    comment: Option<String>,
}

/// 1-based line and UTF-16 column of byte `offset` in `text` (the unit of TypeScript and editors).
fn line_col(text: &str, offset: usize) -> (usize, usize) {
    let mut offset = offset.min(text.len());
    while !text.is_char_boundary(offset) {
        offset -= 1;
    }
    let before = &text[..offset];
    let line = before.matches('\n').count() + 1;
    let start = before.rfind('\n').map_or(0, |i| i + 1);
    (line, before[start..].encode_utf16().count() + 1)
}

fn kbres_parse(text: &str) -> Value {
    let (file, diags) = kubuno_resources_model::ResourceFile::read(text);
    let strings: Vec<KbresString> = file.strings().map(|(n, v, c)| KbresString { name: n.to_string(), value: v.to_string(), comment: c.map(str::to_string) }).collect();
    let others = file.entries.len() - strings.len();
    let diagnostics: Vec<Value> = diags
        .iter()
        .map(|d| {
            let (line, column) = line_col(text, d.range.start);
            let severity = if d.severity == kubuno_resources_model::Severity::Error { "error" } else { "warning" };
            json!({ "severity": severity, "line": line, "column": column, "message": d.message })
        })
        .collect();
    json!({ "culture": file.culture, "strings": strings, "others": others, "diagnostics": diagnostics })
}

fn with_session<T>(id: usize, f: impl FnOnce(&mut Session) -> T) -> Result<T, String> {
    SESSIONS.with(|s| {
        let mut sessions = s.borrow_mut();
        match sessions.get_mut(id).and_then(Option::as_mut) {
            Some(session) => Ok(f(session)),
            None => Err(format!("no compiler session {id}")),
        }
    })
}

fn handle(request: &[u8]) -> Value {
    let request: Request = match serde_json::from_slice(request) {
        Ok(r) => r,
        Err(e) => return json!({ "ok": false, "error": format!("invalid request: {e}") }),
    };
    let result: Result<Value, String> = match request {
        Request::Version => Ok(json!({ "compiler": kubuno_views_web::VERSION, "abi": kubuno_views_web::VIEWS_ABI })),
        Request::SessionNew => Ok(SESSIONS.with(|s| {
            let mut sessions = s.borrow_mut();
            sessions.push(Some(Session::new()));
            json!({ "session": sessions.len() - 1 })
        })),
        Request::SessionFree { session } => SESSIONS.with(|s| {
            if let Some(slot) = s.borrow_mut().get_mut(session) {
                *slot = None;
            }
            Ok(json!({}))
        }),
        Request::AddRegistry { session, json: text, label, host } => {
            with_session(session, |s| s.add_registry(&RegistryInput { json: text, label, host })).and_then(|r| r.map(|count| json!({ "elements": count, "problems": [] })))
        }
        Request::SetUserControls { session, controls } => with_session(session, |s| {
            s.set_user_controls(&controls);
            json!({})
        }),
        Request::Compile { session, source, options } => with_session(session, |s| {
            let out = s.compile(&CompileRequest { source, options });
            serde_json::to_value(out).unwrap_or_else(|e| json!({ "serialisation_error": e.to_string() }))
        }),
        Request::HandleTypes { session } => with_session(session, |s| json!({ "text": s.handle_types() })),
        Request::KbresParse { text } => Ok(kbres_parse(&text)),
        Request::KbresWrite { strings, culture } => {
            let file = kubuno_resources_model::ResourceFile::from_strings(culture, strings.into_iter().map(|s| (s.name, s.value, s.comment)));
            Ok(json!({ "text": file.to_text() }))
        }
    };
    match result {
        Ok(value) => json!({ "ok": true, "result": value }),
        Err(e) => json!({ "ok": false, "error": e }),
    }
}

/// Allocates `len` bytes for a request.
#[no_mangle]
pub extern "C" fn kb_alloc(len: usize) -> *mut u8 {
    let mut buf: Vec<u8> = Vec::with_capacity(len.max(1));
    let ptr = buf.as_mut_ptr();
    std::mem::forget(buf);
    ptr
}

/// Frees a buffer of `len` bytes returned by [`kb_alloc`] or [`kb_call`].
///
/// # Safety
/// `ptr`/`len` must come from `kb_alloc(len)` or from a `kb_call` response, and be freed once.
#[no_mangle]
pub unsafe extern "C" fn kb_free(ptr: *mut u8, len: usize) {
    if !ptr.is_null() {
        drop(Vec::from_raw_parts(ptr, 0, len.max(1)));
    }
}

/// Runs the JSON request at `ptr..ptr+len` (freeing it) and returns the response as `(ptr << 32) | len`.
///
/// # Safety
/// `ptr` must come from `kb_alloc(len)` with `len` initialised bytes; it is freed here.
#[no_mangle]
pub unsafe extern "C" fn kb_call(ptr: *mut u8, len: usize) -> u64 {
    let request = Vec::from_raw_parts(ptr, len, len.max(1));
    let response = handle(&request);
    drop(request);
    let mut bytes = serde_json::to_vec(&response).unwrap_or_else(|_| b"{\"ok\":false,\"error\":\"serialisation\"}".to_vec());
    bytes.shrink_to_fit();
    let out_len = bytes.len();
    let mut boxed = bytes.into_boxed_slice();
    let out_ptr = boxed.as_mut_ptr();
    std::mem::forget(boxed);
    ((out_ptr as u64) << 32) | out_len as u64
}
