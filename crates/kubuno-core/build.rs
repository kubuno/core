fn main() {
    // Force recompilation when migration files are added or modified.
    // Without this, cargo skips recompiling even though sqlx::migrate! embeds
    // migrations at compile time, causing new .sql files to be silently ignored.
    println!("cargo:rerun-if-changed=../../migrations");
}
