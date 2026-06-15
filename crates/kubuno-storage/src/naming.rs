/// Génère un nom de **fichier** unique en ajoutant " (2)", " (3)"... si le nom existe déjà.
///
/// Le suffixe est inséré entre le stem et l'extension :
/// `rapport.pdf` → `rapport (2).pdf` → `rapport (3).pdf` …
///
/// La comparaison est sensible à la casse (comportement filesystem Linux).
pub fn unique_file_name(desired: &str, existing: &[String]) -> String {
    if !existing.iter().any(|n| n == desired) {
        return desired.to_string();
    }
    let path = std::path::Path::new(desired);
    let stem = path.file_stem().and_then(|s| s.to_str()).unwrap_or(desired);
    let ext  = path.extension().and_then(|s| s.to_str());
    for i in 2usize.. {
        let candidate = match ext {
            Some(e) => format!("{stem} ({i}).{e}"),
            None    => format!("{stem} ({i})"),
        };
        if !existing.iter().any(|n| n == &candidate) {
            return candidate;
        }
    }
    unreachable!()
}

/// Génère un nom de **répertoire** unique en ajoutant " (2)", " (3)"... si le nom existe déjà.
///
/// Le suffixe est ajouté en fin de nom (pas de découpage stem/extension) :
/// `Documents` → `Documents (2)` → `Documents (3)` …
pub fn unique_dir_name(desired: &str, existing: &[String]) -> String {
    if !existing.iter().any(|n| n == desired) {
        return desired.to_string();
    }
    for i in 2usize.. {
        let candidate = format!("{desired} ({i})");
        if !existing.iter().any(|n| n == &candidate) {
            return candidate;
        }
    }
    unreachable!()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn file_no_conflict() {
        assert_eq!(unique_file_name("rapport.pdf", &[]), "rapport.pdf");
    }

    #[test]
    fn file_first_conflict() {
        let existing = vec!["rapport.pdf".into()];
        assert_eq!(unique_file_name("rapport.pdf", &existing), "rapport (2).pdf");
    }

    #[test]
    fn file_multiple_conflicts() {
        let existing = vec!["rapport.pdf".into(), "rapport (2).pdf".into()];
        assert_eq!(unique_file_name("rapport.pdf", &existing), "rapport (3).pdf");
    }

    #[test]
    fn file_no_extension() {
        let existing = vec!["Makefile".into()];
        assert_eq!(unique_file_name("Makefile", &existing), "Makefile (2)");
    }

    #[test]
    fn dir_no_conflict() {
        assert_eq!(unique_dir_name("Documents", &[]), "Documents");
    }

    #[test]
    fn dir_first_conflict() {
        let existing = vec!["Documents".into()];
        assert_eq!(unique_dir_name("Documents", &existing), "Documents (2)");
    }

    #[test]
    fn dir_multiple_conflicts() {
        let existing = vec!["Documents".into(), "Documents (2)".into()];
        assert_eq!(unique_dir_name("Documents", &existing), "Documents (3)");
    }
}

/// Nom de fichier sans son extension (ex. "Budget 2026.kbcal" → "Budget 2026").
pub fn strip_ext(name: &str) -> String {
    std::path::Path::new(name).file_stem().and_then(|s| s.to_str()).unwrap_or(name).to_string()
}
