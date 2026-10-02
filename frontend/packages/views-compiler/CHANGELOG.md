# Changelog — @kubuno/views-compiler

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Entries are
added under `[Unreleased]` **as the change is made**; on npm publish, the section is stamped
under the published version number.

## [Unreleased]

### Added

- **First version: the build-time tooling of `.kbview` web views.** The package compiles the declarative
  `.kbview` views of the Kubuno web UI with the same parser and validator as the desktop (shipped as
  WebAssembly, so no Rust toolchain is needed to build a module, online or offline), and contains:
  - a **Vite plugin** (`kbview()`) that turns each view into a module (its render plan, its generated
    `ViewBase` class), maps every binding and handler back to its line in the `.kbview` in the browser's
    debugger, fails the build with file, line and column on an error, and keeps the screen's state when a
    view or its code-behind is edited during development;
  - **`kbview-tsc`**, to use instead of `tsc`: it also type-checks every `{Binding …}` and every handler
    against the code-behind and reports the problems at the attribute in the `.kbview`;
  - a browser entry (`@kubuno/views-compiler/browser`) for the Visual Studio design surface.
  A view can only use the host's elements and its own module's controls: anything else is an error.
