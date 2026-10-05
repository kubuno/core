# Changelog — @kubuno/views-migrate

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Entries are
added under `[Unreleased]` **as the change is made**; on npm publish, the section is stamped
under the published version number.

## [Unreleased]

### Added

- **`kbview-migrate`, the codemod from React/TSX screens to `.kbview` views.** One `.tsx` screen becomes `X.kbview`
  + an `X.ts` code-behind class (+ `X.parts.tsx` for what stays React) and a report: `@ui` components by reverse
  registry lookup, HTML elements as `Panel` / `Stack` / `Label` keeping their tag (headings, lists, forms), Tailwind
  classes turned into properties where the result is pixel-identical (roles, weights, theme colours, flex rows and
  columns) and kept in `Class` otherwise, `t()` as `{Res}` (with arguments and plurals), state as `@bind` fields,
  hooks in a `useHooks()` method, derived values as getters (memoized when they build objects), inline handlers as
  methods, `cond && <X/>` and early returns as `Visible` (their getters guarded by the same conditions), lists as a
  `Repeater` over memoized rows, and what does not convert (a local or another screen's component, a raw `<input>`,
  an unmapped prop) rendered through `<ReactHost>` with a TODO comment. `--out <dir>` writes a dry run elsewhere,
  `--report` the per-file report (converted / partial with reasons / skipped).
