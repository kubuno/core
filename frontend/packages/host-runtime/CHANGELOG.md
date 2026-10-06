# Changelog — @kubuno/host-runtime

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Entries are
added under `[Unreleased]` **as the change is made**; on npm publish, the section is stamped
under the published version number.

## [Unreleased]

## [0.1.1] - 2026-10-06

### Changed

- Built with the `@kubuno/views` runtime of this core: a component hosted by `ReactHost` renders again with its
  view, and an element in a `display: contents` wrapper keeps its parent's spacing (see `@kubuno/views`).

### Fixed

- **The Visual Studio designer's bundled page compiles with the project's own element registry.** The page accepts
  the registry the designer sends (`setHostRegistry`) instead of the one it was built with, so a module whose
  `@kubuno/ui` is newer than the designer's copy (drive) no longer shows errors such as « `Label` has no property
  `HtmlTag` » that the build does not report.

## [0.1.0] - 2026-10-06

### Added

- **First version: the design host of Kubuno web views.** A ready-to-serve page that shows a `.kbview` or
  `.kbcontrol` view in the Visual Studio designer when the project's own development server is not running:
  it renders the view with the host's real elements, fonts, translations and light / dark themes, lets you
  select, move, resize and reorder elements and drop new ones from the Toolbox, and shows the project's own
  controls as labelled placeholders. It works from any address or folder, offline.
- **Module projects in the designer with their own code.** Installed as a devDependency of a module (with
  `@kubuno/views-compiler` 0.1.2 or later), the package also provides the design page the module's development
  server shows to Visual Studio: the module's views render with their code-behinds, their own controls and React
  parts, and update as you edit them. The page and the module share one copy of React, of the host's elements, of
  the sdk and of the views runtime, as in the running host; the module's stylesheet and translations are loaded
  first (`design.setup` in `kubuno.views.json`).
