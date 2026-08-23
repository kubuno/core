# Changelog

All notable changes to **kubuno-core** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this
project adheres to [Semantic Versioning](https://semver.org/). Entries are added under
`[Unreleased]` **as the change is made**; `_tools/release.sh` stamps them under the version
number at release time, and CI publishes that section as the GitHub Release notes.

## [Unreleased]

### Changed

- **Redesigned the editors' dock chrome (shared `DockArea`).** Every dockable
  panel is now a rounded card floating on a neutral ground, and blocks are
  separated by a real **12 px gutter** (between docks, the viewport and stacked
  panels) instead of a hairline splitter. The active tab is a primary-tinted
  pill with a 3 px accent underline, the gutters carry the same resize handle as
  the rest of the app (a neutral hairline and a grip pill that **appear only on
  hover**), and floating windows get softer corners and a deeper shadow. The
  default dock theme now derives from the core design tokens, so the chrome
  **follows the active theme** — light, dark or an admin skin — instead of being
  pinned to light; and the whole treatment (ground, cards, tabs, handle) tracks
  whatever `DockTheme` a module passes, in either theme. Every editor (diagrams,
  projects, maths, whiteboard, the app builder) inherits it with no change on
  their side; the new `DockTheme` tokens (`ground`, `radius`, `gap`,
  `tabActiveBg`) are optional overrides.
- **The "reopen closed panels" control moved from the editor to the right rail.**
  It used to float over the editor's canvas; it now sits in the shell's right
  rail, just above the customise button, showing how many panels are closed and
  opening the same list to bring one back. An editor's dock publishes its closed
  panels to the rail, so the rail shows the control only when there is something
  to reopen (and appears for it even when no module panel is pinned).

### Fixed

- **A dock panel could be opened twice.** Asking for a panel that was already on
  screen — the ribbon's "Informations" or "Ressources" in Projects, a stale reopen
  menu, a double click — added a second copy instead of going to the one already
  there: the same panel rendered twice, in two places, disagreeing about which was
  active. Opening a panel that is already docked now brings it forward — it becomes
  the selected tab of its group, and a floating window rolled up to its title bar
  unrolls. A saved arrangement holding a duplicate (or a panel listed both as open
  and as closed, which is what offered to open it a second time) is repaired when
  it is read back, so a layout that went wrong once no longer stays wrong; two
  panel groups that ended up sharing an identifier are separated again.

### Added

- **Mail address attribution, core side.** A verified primary domain now
  emits a `domain.mail_ready` signal, and an internal endpoint lets the mail
  module read the name parts it builds an address from — so a mailbox can be
  attributed to every account automatically. The structured names are NOT
  added to the directory or people pickers.
- **First and last name on every account.** Structured given and family name
  join the profile fields: editable on your own profile, and on the
  administration sheet where an administrator can set them for anyone. Nullable
  and never guessed from the display name. They are the source the mail address
  rule reads to build an address, and — like the other profile fields — never
  disclosed by the directory or by a people picker.

- **Apps can open on a landing route distinct from their identity path.** A waffle
  app may declare `landing` alongside `path`: the launchers (Home dashboard,
  waffle menu) open `landing` when there is no per-tab history, while `path` stays
  the prefix `resolveByPath` matches. This lets a module whose entry point is a
  hub (e.g. Drive opening on its "Accueil" at `/drive/home`) keep its root
  (`/drive`) addressable for the sidebar and deep links. Falls back to `path`.

- The directory search accepts **`scope=unit`**, narrowing the answer to the
  caller's own organisational unit and its sub-units whatever the instance's
  audience policy is. It can only ever restrict, and the `directory.enabled` gate
  still applies first — it lets a module offer "my unit" as a group without
  keeping its own copy of the account list.

- **Illustrations in the image picker.** A new source offers Kubuno's own
  artwork — 96 pictures across four collections, searchable — for anyone who
  would rather pick a picture than upload one. They are drawn by the app itself,
  so the gallery needs no network, no image bank and no licence to honour.

- **Two shared form-input primitives in `@ui`, usable by every module** (every
  module has forms): `OutlinedField`, a Material-Design outlined text field whose
  label animates from inside the box up onto the border (notch, accent colour and
  3px border on focus, optional leading icon); and `FieldGroup`, which stacks
  several labelled sub-fields under ONE shared icon with a Plus/Moins chevron that
  reveals "advanced" sub-fields (Google-Contacts "Name"/"Organisation" pattern).
- **`PhoneField`** (`@ui`): a Google-Contacts-style phone input — leading icon, a
  country dial-code selector (flag + searchable dropdown, 188 countries, flag
  derived from the ISO code, no external asset), the Material number field, and an
  optional editable "Libellé" combobox (free text + presets: Domicile, Professionnel,
  Mobile…).
- **`DateField`** (`@ui`): a split date field (Day / Month dropdown / optional Year)
  with a configurable icon (cake for a birthday, calendar for a date) and the same
  optional editable "Libellé" combobox. Plus a shared **`LabelCombobox`** primitive
  (the free-text-with-suggestions label used by the phone and date fields).
- **`AddressField`** (`@ui`): a Google-Contacts-style postal-address block —
  location-pin icon, street, postal code + city, a searchable country selector,
  a Plus/Moins chevron revealing PO box / extra line / region, and an optional
  editable "Libellé". All these composite fields now share ONE deterministic
  field height, so a selector box and a text field line up exactly.
- **Impossible values are refused at the keystroke** in the composite fields:
  the day is capped by the month (and by leap years once the year is known, a
  day that stops existing after a month change is re-clamped), the year must be
  a prefix of an acceptable year — a birth date refuses even a leading "9" —
  and a phone number only accepts digits and usual separators.

## [0.1.6] - 2026-08-19

### Added

- **Documents logo**: the Office documents app now has a mark of its own, served
  as a static asset and used as the browser tab icon while in Documents.
- **Details side panel for the file explorer.** The ⓘ button next to the view
  switcher opens the shell's right panel on the selected file or folder, and the
  panel follows the selection instead of having to be reopened for each item. It
  shows the same information the "Informations" window did, including sections
  contributed by modules.
- **Breadcrumb**: an opt-in larger scale, and the current folder's own actions
  (new folder, download, rename, share, organise, information, move to bin) on
  the caret at the end of the trail.
- **Remote mounts can be repaired rather than recreated.** A mount's settings can
  now be updated, and read back with its secrets withheld — passwords, tokens and
  private keys never leave the server, and one left out on save keeps its stored
  value. The mount's name in the URL never changes, so links to it survive.
- **Remote mounts**: an SMB server can be asked which shares it offers, each with
  its real name and its description. Entering the description instead of the name
  is what makes a mount fail with "share not found", and nothing on screen said
  so.
- The explorer's background menu now offers **Import**, which used to exist only
  as a toolbar button.
- **Printable reports are now a print preview.** Opening a report from a dashboard
  card shows the document laid out on sheets of paper — the console paginates it
  itself rather than handing a long page to the browser, so what is on screen is
  what comes out of the printer, cut at the same rows. Tables are split between
  rows, never through one; a continued table repeats its column heading and says
  `(suite)`; its total travels with the last fragment only.
- **Running footer with real page numbers** (`Page 2 sur 4`), on every sheet, with
  the instance's name and the moment the reading was taken.
- **Per-sheet controls**, in a vertical gutter beside each sheet: turn *that* sheet
  to landscape, or open its menu. The document's own paper (A4 / Letter) and
  orientation stay in the toolbar. A report can therefore mix orientations — the
  wide table on its own landscape sheet, the rest portrait.
- **Cover sheet**, optional and off by default: title, instance, window, author.
- **Watermark**, text or image, with size, opacity and tilt. An uploaded picture is
  downscaled on import; the stamp is painted as the sheet's background, so adding
  one never moves a page break.
- **Thumbnail rail** of every page, right of the sheets, laid out like the drive
  viewer's; click to jump. A **floating bar** carries the page counter, the zoom and
  the printer, and **Ctrl/⌘ + wheel** zooms the sheets.
- **Right-click menu** on a sheet: turn it, turn the document, add or remove the
  cover, zoom, print.
- Reports open **"En bref"**: the peak of the series and its share, how many
  intervals counted nothing, how much the top entries concentrate, and the variation
  with the figure it is compared against. Every sentence is computed from the same
  model the tables print, and carries the figure it is derived from; one that cannot
  be computed is simply absent.
- Every report now draws **two charts** — its own, plus the complementary view (a
  ranking beside a curve, a curve beside a donut) when the data for it exists.
- **The instance's own logo** (`instance.logo_url`, a public setting that until now
  changed nothing) is honoured wherever the product mark used to be hard-coded:
  sign-in, shell, and the head of every printed report.
- Cross-module contact **@mention** infrastructure.
- **Multi-account**: several accounts can be signed into one browser at
  once, each holding its refresh token in its own HttpOnly slot cookie. New endpoints
  `GET /auth/accounts` (enumerates the browser's accounts) and `POST /auth/switch`
  (re-points the active session); `POST /auth/logout` accepts `slot` (remove one
  account) and `all` (sign out of every account). Switching hard-reloads onto the
  current module's root, so every store and cache is rebuilt under the new identity,
  and the other tabs of the browser reload too.
- **Account panel redesigned**: clickable account rows (one click
  switches), `Déconnecté` badge with re-connect/remove on dead sessions, per-account
  unread-notification badges, "Sign out of all accounts", compact sticky header on
  scroll. Styled and positioned like the app-grid popup.
- Notifications are now **compartmented per account** (one bucket per user in
  localStorage): an account never sees another's bell, and the panel reads the other
  buckets for its per-row badges.
- **Right rail and right panel**, reworked: the rail is now user-customisable — entries
  can be reordered and hidden — and a module's own entry is hidden while browsing that
  module, where it would be redundant. Below 1280px the panel becomes an overlay with a
  scrim and closes on Escape. Contacts, Drive, Assistant, Chat and Maps join Calendar,
  Notes and Tasks in contributing a mini-panel, each with its own module icon.
- `Checkbox` accepts an `indeterminate` prop: the tri-state the DOM property already
  carried, but which nothing ever drew.
- Data tables gain **copy context menus** (cell, row, column, text selection) and
  **column resizing**. On mobile the copy actions move to an always-visible overflow
  button, resizing being pointless there.
- **`Button` forwards its ref** (`forwardRef`), so a popover or tooltip can anchor on
  the button itself instead of a wrapper `<span>`.
- New **`--color-viewer-backdrop`** design token: the opaque surface behind the
  "sheets" of a viewer or editor (print preview, full-screen viewer). Dark by default
  so the white page stands out — not a modal scrim.

### Changed

- Reports carry **colour where colour means something**: each breakdown entry gets
  the swatch of its own chart slice and a bar for its share, the busiest interval of
  a series is tinted, and the variation is green or red with its arrow. The rest
  stays black on white.
- A **ranking chart is capped at ten entries** and says so, with a pointer to the
  breakdown below, which stays exhaustive. A bar list grows with its entries while
  the paper does not: past that, a ranking is taller than a landscape sheet and
  printed cut off.
- The **administration breadcrumb is pinned** to the top of the panel, and a report's
  toolbar docks under it. A trail that scrolls away is a trail you scroll back for.
- **Default interface font stack** is now `"Google Sans Text", "Google Sans", Roboto,
  Arial, sans-serif`, entirely **self-hosted**: the stylesheet loads it from the drive
  module's own `css2` font endpoint (`/api/v1/drive/fonts/css2`) — no request ever
  leaves for a third-party CDN (DM Mono included), and the leftover
  `preconnect` hints to the former third-party font CDN are gone too (a
  preconnect still opened a connection to it, leaking the visitor's IP for no
  benefit once the fonts became local).
- Header circular buttons (search, bell, settings, help, apps grid, avatar) unified at
  **36×36 px** with an 8 px right margin, aligned on the office title bar.
- The cache-control middleware now **respects a Cache-Control header set deliberately
  by a handler or proxied module** instead of overwriting everything non-hashed with
  `no-store` (needed by the font endpoints' long-lived caching).
- **New Drive logo.**
- **Icon views**: twice as much space between file and folder tiles.
- **View modes**: four instead of eight (large icons, small icons, list,
  details), shown as a segmented switch where the current one is ticked rather
  than as a drop-down menu. "Hidden items" became a direct toggle button.
- **Explorer header**: the "Import" and "New folder" buttons are gone — both
  actions live in the sidebar's "New" menu and in the background menu — and the
  view switcher moved up onto the breadcrumb's line, where it no longer
  disappears in a folder that holds only sub-folders.
- **Left sidebar**: entries are never bold; the resting and selected label
  colours are now theme tokens (`--color-text-nav`, `--color-text-nav-active`)
  so a theme can set them.
- Selection tick badges no longer sit on file and folder cards; a selected item
  is shown by its border and tint.
- **`Radio`, `Checkbox` and `Toggle` are rendered on canvas** rather than in CSS. Each
  keeps a hidden input as its source of truth and repaints on four triggers: input
  change, form reset, device-pixel-ratio change and theme change.
- **Default application background** (`--body-bg`) `#f1f4f8` → `#f8fafd`, in the base
  stylesheet and in the `kubuno-reference` theme.
- **Default search bar background** `#eaeef5` → `#e9eef6`.
- **The module area now has a 24px inner padding by default** (`MODULE_AREA_PADDING`).
  A module may still request another value, and full-bleed modules (`noPadding`), which
  manage their own chrome, are unaffected.
- **Frosted menus** are back to a plain `backdrop-filter`: the six-layer gradient mask
  degraded into visible banding at small corner radii. Menu borders are gone.
- **Windows** are glass on their 5px frame and 40px title bar only, their content
  staying opaque. The close button is 30×30 and the default 20px inner padding is gone.
- Table headers and footers, and pagination, use Roboto Flex at 14px; rows react to
  hover and alternate their background.
- Resize handles are a 5px hairline with a grip pill on hover, sitting in the gutter,
  identical on the left sidebar and the right panel.
- Administration: text is 14px by default; the navigation panel scrolls vertically and
  its "show more/less" control is gone.
- The three search bars (shell, mail, drive fonts) now read the **`--color-search-bg`**
  token instead of a hard-coded colour, and the token is unified at `#e9eef6` across
  all themes — the administration search bar included, which had drifted to its own value.
- **`--color-surface-card`** aligned with the new page background (`#f8fafd`), so widget
  cards are tone-on-tone with the page again.

### Removed

- **View modes** extra-large icons, medium icons, tiles and content.
- The **"Compact view"** display option.
- The explorer's **"Informations" window**, replaced by the side panel.
- **Local-first WASM components**: the `GET /api/v1/desktop/wasm` and
  `GET /api/v1/desktop/wasm/:name` endpoints, which served the downloadable WASM
  backends (documents, drive, notes, tasks, keestore, assistant, contacts, wiki,
  calendar) to the desktop apps, are gone — along with the `server.wasm_dir`
  setting. Desktop apps now talk to the Kubuno API directly; running a module
  backend locally is no longer supported.

### Fixed

- **Browser autofill no longer prints over a field's label.** Hovering a Chrome
  suggestion *previews* the value into the field without firing any event, so a
  floating label had no way to know the box was no longer empty and the two drew
  on top of each other. Outlined fields now detect the autofilled state itself —
  autofill keeps working rather than being switched off.

- **A printed report no longer disagrees with its preview.** Four separate defects
  produced pages the preview never showed: the administration panel's padding
  survived printing and pushed the first sheet a page down; the watermark, being an
  out-of-flow element, perturbed pagination (22 sheets came out on 17 pages); the
  stack of sheets was a flex container, which had the engine interleave blank pages;
  and a `background` shorthand quietly erased the watermark on paper.
- **A report's running footer no longer overlaps the content.** It reserves its own
  height on every sheet instead of being painted over the flow.
- Long report tables no longer print with their last column clipped: cells may wrap
  rather than push the table off the edge of the sheet, and a table continued
  overleaf keeps the column widths of the one before it.
- **Remote mounts reported every failure as an opaque 500.** An unreachable
  server, a wrong path and credentials that can no longer be decrypted now
  answer with distinct codes and a message that says what to do, and a mount
  whose credentials are unreadable is marked in error instead of staying green.
- **A remote folder that could not be listed looked empty.** The explorer now
  says the listing failed and why.
- **SMB shares appeared empty whatever went wrong.** `smbclient` reports its
  failures on standard output, which was not read: a refused share, a wrong path
  and a genuinely empty folder were indistinguishable, and "Test connection"
  answered success on a mount that could not work.
- Right-clicking inside a dialog or floating window opened the module's
  background menu over it.
- A mistyped remote address answered "remote storage unreachable" although
  nothing had been contacted; it is now reported as invalid input.
- Incorrect sidebar badge when the sidebar is collapsed.
- The account panel rendered **under the right-side rail** (stacking-context clash):
  it now portals to `<body>` like every other header dropdown.
- `Toggle` animated on a smoothstep curve mislabelled as the Material easing; it now
  samples the real `cubic-bezier(0.4, 0, 0.2, 1)`.
- Editing an administration setting could flicker back to its previous value: the
  optimistic edit was cleared before the refetch had landed.
- A canvas silently ignores a colour it cannot parse and keeps painting black, which
  turned the Calendar radio buttons into black discs when handed `var(--color-primary)`.
  Theme colours are now resolved before they reach the canvas.

[Unreleased]: https://github.com/kubuno/core/compare/v0.1.6...HEAD
[0.1.6]: https://github.com/kubuno/core/releases/tag/v0.1.6
