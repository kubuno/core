# @kubuno/views-migrate

The codemod that turns a Kubuno web screen written in React/TSX into a `.kbview` view with a TypeScript code-behind
(the format of the Kubuno views, designed in Visual Studio). A devDependency of web projects that migrate.

```bash
npx kbview-migrate --project . --report migrate-report.json src/settings/SettingsTab.tsx   # dry run: the report only
npx kbview-migrate --project . --out /tmp/migrated src/settings/SettingsTab.tsx           # the files, elsewhere
npx kbview-migrate --project . --write src/settings/SettingsTab.tsx                        # in place
```

For every file the report says **converted** (everything became view elements), **partial** (some parts stay React,
rendered by `<ReactHost>` elements marked `TODO(views-migrate)` in the view, each with its reason) or **skipped** (the
file could not be converted: the reason says why — several exported components, an unsupported statement…).

What the codemod does, and what it leaves:

| TSX | View / code-behind |
|---|---|
| `@ui` components | their `.kbview` element (reverse lookup of the registry: props, events, enum values) |
| `div`, `section`, `form`, `ul`/`li`… | `Panel` (`HtmlTag` when not a `div`), `Stack` for a plain flex box |
| `p`, `span`, `h1`–`h6` with text | `Label` (`HtmlTag`, `Role`, `FontWeight`, colours; the rest of the classes in `Class`) |
| `t('key', { count, defaultValue })` | `{Res key, Count={Binding n}}`; a `defaultValue` of a key missing from the bundles is reported |
| `useState` | `@bind accessor` (a static initial value) or kept in `useHooks()` |
| other hooks | `useHooks()`, their results published as fields in `use()` (typed from it, nothing to import) |
| derived constants | getters (`View.memo` when they build an object or a list) |
| inline handlers, local functions | methods |
| `cond && <X/>`, `a ? <A/> : <B/>`, `if (c) return <A/>` | `Visible` bindings; the getters inside are guarded by the conditions |
| `list.map(item => <Row/>)` | `Repeater` over a memoized rows getter, keyed by the item's `key` |
| a local helper component, another screen | `<ReactHost Component=… Props=…/>` (the local ones move to `X.parts.tsx`) |

Run `kbview-tsc -b` after a conversion: the generated files must type-check before the screen is kept, and the visual
and accessibility parity of the screen must be checked (vskubuno `docs/WEB-VIEWS.md` §7).
