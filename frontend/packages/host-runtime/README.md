<!--
  SPDX-FileCopyrightText: 2026 Kubuno contributors
  SPDX-License-Identifier: AGPL-3.0-or-later
-->

# @kubuno/host-runtime

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](https://github.com/kubuno/core/blob/main/LICENSE)

**The design host of [Kubuno](https://github.com/kubuno/core) web views: a ready-to-serve page that renders
`.kbview` / `.kbcontrol` views in the Visual Studio designer.**

The Kubuno extension for Visual Studio shows a web view in a WebView2 document pane. When the project's own
Vite development server runs, the pane loads the page that server provides (`/__kubuno_design__/`, see
[`@kubuno/views-compiler`](../views-compiler)), with the project's real controls and code-behinds. When it
does not (no `node_modules` yet, the server failing, offline), the pane falls back to **this package**: a
static build of the same page in *bundled* mode.

## What is inside

- the host runtime the page renders with: React, the real `@ui` elements and `@kubuno/sdk`, the
  `@kubuno/views` runtime in design mode, the `.kbview` compiler's WebAssembly and the host registry;
- the host CSS with the **production fonts** (byte-identical copies of the core's `public/fonts`, with
  their licence texts), the core's translations (the designer offers French, English and Arabic), and the
  light and dark Kubuno themes (`kubuno-reference`, `kubuno-dark`).

Every URL in the build is relative: serve `dist/` from any origin or folder (Visual Studio maps it to
`https://kubuno-design.invalid/`).

## Bundled mode

The page speaks the designer's protocol with Visual Studio (`window.chrome.webview`): it compiles the unsaved
buffer, renders it, and turns selection, move, resize, reorder, delete and Toolbox drops into edit requests.
The project's own controls cannot run without its development server: they are shown as **labelled
placeholders** (a dashed box with the element's name, and its content inside), their registry entries arriving
from Visual Studio. The toolbar says so. Code-behinds do not run either: a binding resolves against the view's
sample data (`<view>.design.json` → `dataContext`, else its `props`).

## Build

```bash
cd core/frontend
npm run build:design-host     # → packages/host-runtime/dist (not committed)
```

`dist/index.html` is the page, `dist/entry.js` its script (also exported as `@kubuno/host-runtime/entry`).

## License

AGPL-3.0-or-later. The fonts keep their own licences (SIL Open Font License 1.1 for Plus Jakarta Sans, Outfit
and DM Mono; Apache 2.0 for Roboto), shipped next to them in `dist/fonts/`.
