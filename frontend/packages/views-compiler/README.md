<!--
  SPDX-FileCopyrightText: 2026 Kubuno contributors
  SPDX-License-Identifier: AGPL-3.0-or-later
-->

# @kubuno/views-compiler

[![npm](https://img.shields.io/npm/v/@kubuno/views-compiler.svg)](https://www.npmjs.com/package/@kubuno/views-compiler)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](https://github.com/kubuno/core/blob/main/LICENSE)

**The build-time side of `.kbview` views for the [Kubuno](https://github.com/kubuno/core) web UI.**

A `.kbview` file describes a screen declaratively — the same XML format, element names, `{Binding}` and
`{Res}` grammar as the Kubuno desktop views — and a same-stem TypeScript **code-behind** class holds its
state and handlers (WinForms style). This package turns the view into code the browser runs and checks
it against the code-behind:

- **The compiler, as WebAssembly.** The parser and validator are the Rust crates shared with the desktop
  and the language server (`kubuno-views-syntax`, `kubuno-views-web`). The package ships the built
  `wasm/kubuno-views-web.wasm`: installing it never needs a Rust toolchain, and a module still builds
  offline. The same `.wasm` runs in Node (Vite plugin, `kbview-tsc`) and in a browser
  (`@kubuno/views-compiler/browser`, the Visual Studio design surface).
- **A Vite plugin**, `kbview()`: `X.kbview` becomes an ES module exporting the render **plan** (components
  imported from `@ui` / `@kubuno/sdk` / your own controls, Lucide icons imported by name, every binding
  with a precompiled getter/setter) and the generated **`ViewBase`** class the code-behind extends. Source
  maps point every accessor and every handler call to its attribute in the `.kbview`. Errors fail the build
  and appear in the dev overlay with file, line and column.
- **Generated types**: `.kubuno/views/**/X.kbview.d.ts` (one typed handle per `x:Name`, one abstract method
  per handler) and `X.kbview.check.ts` (every binding written as TypeScript against your code-behind).
- **`kbview-tsc`**: `tsc` plus the views. It compiles every view, writes the generated files, runs your
  project's TypeScript and reports binding and handler errors **at the `.kbview` attribute**:

  ```
  src/Settings.kbview(12,34): error TS2339: Property 'titel' does not exist on type 'Settings'.
  src/Settings.kbview(14,40): error TS2515: handler 'save_click' of Button.OnClick is missing from the code-behind: …
  ```
- **HMR that keeps state**: editing a `.kbview` swaps the new plan into the live view (fields, `@bind`
  values and element handles kept); editing the code-behind moves the live instances onto the new class.

The runtime that renders plans is **`@kubuno/views`**, provided by the Kubuno host through its import map.

## Install

```bash
npm install -D @kubuno/views-compiler @kubuno/views
```

Peer dependencies: `typescript` (always) and `vite` (for the plugin). Node.js ≥ 20.19.

## Set up a module

`vite.config.ts` — add the plugin and keep `@kubuno/views` external like the other host singletons:

```ts
import react from '@vitejs/plugin-react'
import { kbview } from '@kubuno/views-compiler'

const SHARED = ['react', 'react-dom', 'react/jsx-runtime', '@ui', '@kubuno/sdk', '@kubuno/views' /* … */]

export default defineConfig({
  plugins: [kbview(), react()],
  build: { rollupOptions: { external: SHARED } },
})
```

`tsconfig.json` — let TypeScript see the generated files next to your sources:

```jsonc
{
  "compilerOptions": { "rootDirs": [".", ".kubuno/views"] },
  "include": ["src", ".kubuno/views"]
}
```

`package.json` — type-check with `kbview-tsc` instead of `tsc`:

```json
{ "scripts": { "typecheck": "kbview-tsc -b", "build": "kbview-tsc -b && vite build" } }
```

Add `.kubuno/views/` to `.gitignore`: generated files are never committed.

Optional `kubuno.views.json` at the project root:

```json
{
  "target": "web",
  "registries": ["src/kbview-controls.json"],
  "sources": ["src"],
  "hostRegistry": "node_modules/@kubuno/ui/kbview-registry.web.json"
}
```

`registries` lists the project's own control registries (same schema as the host's), whose `web.module`
paths are relative to the registry file. By default the host registry is found in
`node_modules/@kubuno/ui`.

## A view and its code-behind

```xml
<!-- src/Counter.kbview -->
<Card Title="{Res counter_title}">
  <Button x:Name="inc" Text="{Binding label}" OnClick="inc_click"/>
</Card>
```

```ts
// src/Counter.ts
import { bind, type Button, type MouseEventArgs } from '@kubuno/views'
import { ViewBase } from './Counter.kbview'

export class Counter extends ViewBase {
  @bind accessor count = 0
  get label() { return `Clicked ${this.count} times` }
  inc_click(_sender: Button, _e: MouseEventArgs) { this.count++ }
}
export default Counter.component()
```

`@bind accessor` is a standard (TC39) decorator; the plugin lowers it for the browser. The class must be
exported under the file's name.

## Module isolation

A view may only use the host's elements (`@ui`, `@kubuno/sdk`, `@kubuno/views`) and its own project's
controls and user controls (`.kbcontrol`). A control resolving to anything else — another module's
package — is a compile **error**, and the generated code only imports host singletons, `lucide-react` and
the project's own files.

## The Visual Studio design surface

In `vite serve`, the plugin also serves the page the Kubuno extension for Visual Studio shows in its web view
designer, so the designer renders your views with **your project's own controls and code-behinds**:

| Route | What |
|---|---|
| `/__kubuno_design__/` | the design page (its entry: `kubuno.views.json` → `design.entry`, else `@kubuno/host-runtime/entry`) |
| `/__kubuno_design__/project.json` | the registries (host, then the project's, with project-local modules as `/src/…`), the user controls, the plan ABI and the compiler version |
| `/__kubuno_design__/themes/<id>/…` | the Kubuno themes of `design.themes` (`theme.json` and CSS only) |

While the server listens, `.kubuno/design-server.json` (`{version, urls, designPath, pid, root}`) tells Visual
Studio where to find it; the file is removed when the server stops. Turn the route off with
`kbview({ designServer: false })`.

```json
{ "design": { "entry": "src/views/design/entry.tsx", "themes": "../themes" } }
```

## Rebuilding the WebAssembly (maintainers)

```bash
npm run build:wasm                                   # the git tag of wasm/Cargo.toml
node scripts/build-wasm.mjs --desktop ../desktop     # a local kubuno/desktop checkout
```

Needs Rust with the `wasm32-unknown-unknown` target; Linux, Windows and macOS alike. `wasm/BUILD-INFO.json`
records the compiler tag, the toolchain and the checksum of the committed `.wasm`.

## Tests

```bash
npm run test:views    # from core/frontend: compiler, kbview-tsc, Vite plugin, HMR in Chrome, runtime conformance
```

The HMR test drives a real headless Chrome (`KBVIEW_CHROME`, else the usual install path); it is skipped
when none is found.

## License

[AGPL-3.0-or-later](https://github.com/kubuno/core/blob/main/LICENSE) © Kubuno contributors.
