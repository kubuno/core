# Changelog — @kubuno/views-migrate

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Entries are
added under `[Unreleased]` **as the change is made**; on npm publish, the section is stamped
under the published version number.

## [Unreleased]

### Fixed

- A nullable value read inside a callback of a getter or of a component's props is read through a local constant (the narrowing holds there, as in the TSX); a boolean in a text run prints nothing (`{busy && ' · busy'}`); a component returning `cond ? <A/> : <B/>` is recognised; a code-behind keeping a helper component is a `.tsx`; row-scoped part props are typed from the non-null rows; a narrowed intermediate property (`reading.trash.used_bytes`) is passed to a part; an identifier inside a string or a URL path no longer counts as a use (unused imports).
- Code-behinds of larger screens: a hook result is published as soon as its hook ran (a later hook's dependencies read getters built on it — a module's page crashed); getters and hook fields carry their written types when they can (no type depending on itself); a local component rendered by the code itself is imported from the parts file; a type declared in the component body moves to the module level; `list?.map(…)` gives no rows instead of failing; a functional state update keeps its parameter.
- Code-behinds that did not type-check: a binding path through a value that can be null (now a guarded getter); a
  template row whose parameter is called `key`; a hook reading what another hook gave (both now in `useHooks()`, read
  through local constants so the TSX's narrowing still applies); functions declared after an early return and
  handlers of elements shown under a condition (they start with the same conditions); a nullable value read inside a
  callback; an unreachable `?? ''`; an event passed to a function that takes none; a part's helper using another
  helper; an exported helper of the screen dropped. The codemod's row-guard regular expressions held backspace
  characters instead of `\b` (template conditions leaked into page getters).
- The code-behind was deleted right after being written when it was a `.tsx` (Windows paths), and importers using
  the name of a component also exported by default were not switched to the view.

### Added

- More conversions: a list, map or set filled by statements of the body (`const rows = []; walk(root)`, a `for` loop) is computed in its getter with the local functions it calls; a branch block's own early returns (`if (!scoped) { …; if (n === 0) return null; … }`); a property narrowed where a part sits (`menu.pos && <Menu pos={menu.pos}/>`) is passed to the part as a prop of its own; with `--write`, the `defaultValue` of a key no bundle has goes into the fallback language's bundle (the view shows the same text in every language).
- More conversions: an early return whose block computes constants first (`if (outcome) { const n = …; return <A/> }`), several children of a one-child element (`Card`, `FloatingWindow`) wrapped in a layout-neutral panel, `checked={cond}` on a radio (`SelectedValue` against `Value="true"`), an icon prop's theme colour (`IconColor`), and the props object of a ReactHost typed as the component's props (inline callbacks keep their parameter types).
- **`--split`: a file exporting several screens is cut into one file per screen before the conversion** (each then
  becomes its own view): the helpers only one screen uses move with it, the shared ones stay exported, and the
  project's importers are switched to the new files.
- New conversions: object props fed field by field, nested ones included (`action={{ label, onClick }}` →
  `ActionLabel` + `OnAction`, a window's `actions` → `ConfirmText` / `OnConfirm` / `CancelText`…); elements
  given as props written as property elements (`<Card.Actions>`); `t={t}` → `HostStrings` (left out where it changes
  nothing); `@ui/<Component>` imports read as `@ui`; a component with spread props rendered by a ReactHost directly
  (no part); an icon prop's `size` → `IconSize`; a field's `className` → `FieldClass`; a boolean for an enum
  property (`indeterminate={some}` → `CheckState`) through a lookup getter.

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
