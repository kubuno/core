# Changelog — @kubuno/host-runtime

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Entries are
added under `[Unreleased]` **as the change is made**; on npm publish, the section is stamped
under the published version number.

## [Unreleased]

### Added

- **First version: the design host of Kubuno web views.** A ready-to-serve page that shows a `.kbview` or
  `.kbcontrol` view in the Visual Studio designer when the project's own development server is not running:
  it renders the view with the host's real elements, fonts, translations and light / dark themes, lets you
  select, move, resize and reorder elements and drop new ones from the Toolbox, and shows the project's own
  controls as labelled placeholders. It works from any address or folder, offline.
