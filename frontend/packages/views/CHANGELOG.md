# Changelog — @kubuno/views

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Entries are
added under `[Unreleased]` **as the change is made**; on npm publish, the section is stamped
under the published version number.

## [Unreleased]

## [0.1.0] - 2026-10-05

### Added

- **Layout elements: `Stack`, `Panel`, `UserControl` and `ScrollArea`.** A stack places its children along a
  direction with a gap; a panel (and a user control's root) docks its children as bands on its edges, the
  last one filling the rest, mirrored in right-to-left languages, or places them by position; a scroll area
  scrolls its child. A container marked as a push button renders a real button, one with an address a real
  link.
- **The row of a repeated element in its events.** An event raised by an element of a `Repeater`'s template
  carries that row's item and position (`e.row`, `e.rowIndex`).

### Fixed

- **A view re-reads what it shows from its props when its host passes new ones.** Elements bound to a getter
  over `this.props` kept their first value.

- **First version: the type surface of the `.kbview` views runtime.** Modules that write their screens
  as `.kbview` views build against it: the code-behind base class (`View`, `@bind`), the typed handles of
  named elements, the event args, the runtime elements (`Repeater`, `Timer`, `Query`, `Mutation`,
  `ReactHost`), `MessageBox` and `Dialog`. The implementation is served by the Kubuno host at runtime
  (keep `@kubuno/views` external in module builds).
