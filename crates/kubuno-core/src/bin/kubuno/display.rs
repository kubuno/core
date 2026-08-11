//! Display helpers (OCC-style CLI output).

pub const RESET: &str = "\x1b[0m";
pub const BOLD:  &str = "\x1b[1m";
pub const GREEN: &str = "\x1b[32m";
pub const YELLOW: &str = "\x1b[33m";
pub const RED:   &str = "\x1b[31m";
pub const CYAN:  &str = "\x1b[36m";

pub fn header() {
    println!("{BOLD}{CYAN}Kubuno{RESET} v{} — Console d'administration", env!("CARGO_PKG_VERSION"));
    println!();
}

pub fn ok(msg: &str)      { println!(" {GREEN}✓{RESET}  {msg}"); }
pub fn fail(msg: &str)    { eprintln!(" {RED}✗{RESET}  {msg}"); }
pub fn info(msg: &str)    { println!("    {msg}"); }
pub fn warn(msg: &str)    { println!(" {YELLOW}⚠{RESET}  {msg}"); }
pub fn section(msg: &str) { println!("{BOLD}{msg}{RESET}"); }

/// Demande une confirmation interactive : `true` si l'utilisateur a tapé
/// exactement `expected` (comparaison après trim).
pub fn confirm_exact(prompt: &str, expected: &str) -> bool {
    use std::io::{self, BufRead, Write};
    print!("{prompt}");
    io::stdout().flush().ok();
    let mut input = String::new();
    io::stdin().lock().read_line(&mut input).ok();
    input.trim() == expected
}

/// Confirmation « y/N » (accepte y, yes, o, oui — insensible à la casse).
pub fn confirm_yes_no(prompt: &str) -> bool {
    use std::io::{self, BufRead, Write};
    print!("{prompt}");
    io::stdout().flush().ok();
    let mut input = String::new();
    io::stdin().lock().read_line(&mut input).ok();
    matches!(input.trim().to_lowercase().as_str(), "y" | "yes" | "o" | "oui")
}
