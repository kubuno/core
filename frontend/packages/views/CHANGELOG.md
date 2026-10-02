# Changelog — @kubuno/views

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Entries are
added under `[Unreleased]` **as the change is made**; on npm publish, the section is stamped
under the published version number.

## [Unreleased]

### Added

- **First version: the type surface of the `.kbview` views runtime.** Modules that write their screens
  as `.kbview` views build against it: the code-behind base class (`View`, `@bind`), the typed handles of
  named elements, the event args, the runtime elements (`Repeater`, `Timer`, `Query`, `Mutation`,
  `ReactHost`), `MessageBox` and `Dialog`. The implementation is served by the Kubuno host at runtime
  (keep `@kubuno/views` external in module builds).
