//! The activity log of the shell (`kubuno_desktop_shell_common::services::activity`, portable), and how its ages
//! read in the views' language.

use std::time::Duration;

pub use kubuno_desktop_shell_common::services::activity::*;

/// Renders an age the way a person reads it. Deliberately coarse: the exact
/// second of a sync helps nobody, and it avoids a date-formatting dependency.
pub fn age(d: Duration) -> String {
    let s = d.as_secs();
    match s {
        0..=45 => crate::Resources::age_now().to_string(),
        46..=5400 => crate::Resources::age_minutes().replace("{0}", &((s + 30) / 60).to_string()),
        _ if s < 172_800 => crate::Resources::age_hours().replace("{0}", &((s + 1800) / 3600).to_string()),
        _ => crate::Resources::age_days().replace("{0}", &((s + 43_200) / 86_400).to_string()),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn ages_read_like_a_person_says_them() {
        kubuno_desktop::resources::set_culture("fr");
        assert_eq!(age(Duration::from_secs(10)), "à l'instant");
        assert_eq!(age(Duration::from_secs(600)), "il y a 10 min");
        assert_eq!(age(Duration::from_secs(7200)), "il y a 2 h");
        assert_eq!(age(Duration::from_secs(3 * 86_400)), "il y a 3 j");
    }
}
