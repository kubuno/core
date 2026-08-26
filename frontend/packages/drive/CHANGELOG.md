# Changelog — @kubuno/drive

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Entries are
added under `[Unreleased]` **as the change is made**; on npm publish, the section is stamped
under the published version number.

## [Unreleased]


### Added

- `FileItem.is_protected` — the flag the platform's own files carry. Drive's
  interface already read it, and the type surface did not declare it, so any
  module typechecking against the published package failed on a field its own
  API returns.
### Added

- `FileInfoContent`: the body of the details window, on its own, so it can be
  mounted in a panel as well as in a window.
- `StorageSource.statFolder` (optional): a folder's own record. A listing only
  ever returns a folder's children, so nothing could describe the folder the
  explorer stands in.

### Changed

- `ViewMode` is narrowed to `'lg' | 'sm' | 'list' | 'details'`; `xl`, `md`,
  `tiles` and `content` are gone, along with `ViewSpec.kind: 'tiles'` and the
  `'large'` row density. A stored preference naming a removed mode falls back to
  large icons.
- `ViewMenu` renders a segmented switch plus a hidden-items toggle. Its name and
  props are deliberately unchanged so modules built against 0.1.5 keep working.

### Removed

- `onToggle` from the file and folder card/row props: the selection tick badges
  it drove are gone.

## [0.1.5] - undated

- Published to npm before this changelog was introduced.
