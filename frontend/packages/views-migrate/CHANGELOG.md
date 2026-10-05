# Changelog — @kubuno/views-migrate

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Entries are
added under `[Unreleased]` **as the change is made**; on npm publish, the section is stamped
under the published version number.

## [Unreleased]

## [0.1.0] - 2026-10-05

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
- Hooks are split in `useStores()` (reading nothing of the class) and `useHooks()`; their results become plain fields
  published through `View.publish`, so a view sees them on its first render and does not re-render without end.
  Lists over a getter or a field (`items-source`) map to a `Repeater` too.

### Fixed

- A screen's top-level statements declaring nothing (a `Registry.register(…)` run when the file is imported) are
  kept in the code-behind, after the class; they were dropped (the core notification settings lost their « Account and
  security » activities).
- A part or a component shown under a condition is guarded like its props, and a memoized getter depends on what its
  guard reads: computed while the condition failed, it is computed again once it holds (the core sessions screen
  showed its error state without its texts; the designer, which shows hidden elements, failed to render it).
