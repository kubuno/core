//! Kubuno Desktop for macOS: the app of desktop/common with the portable platform and the text interface.
//! macOS overrides nothing yet; a native window and the macOS services join here as implementations of the
//! extension points of `kubuno_desktop_shell_common::platform` (desktop/README.md, "Platform extension points").

use kubuno_desktop_shell_common::{app, platform::Platform};

fn main() {
    let mut platform = Platform::portable();
    platform.name = "macos";
    std::process::exit(app::run(platform, &app::TextUi));
}
