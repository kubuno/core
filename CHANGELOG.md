# Changelog

All notable changes to **kubuno-core** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this
project adheres to [Semantic Versioning](https://semver.org/). Entries are added under
`[Unreleased]` **as the change is made**; `_tools/release.sh` stamps them under the version
number at release time, and CI publishes that section as the GitHub Release notes.

## [Unreleased]

### Added

- **A fresh MySQL/MariaDB or SQLite install starts fully set up.** The built-in
  catalogue — every administrative setting and its default, the permission list,
  the built-in roles and their grants, the base user groups, the "everyone"
  audience, the root organisation unit and the sensitive-content detectors — is
  now seeded on these engines exactly as on PostgreSQL, so the admin console,
  permissions and settings work on the first boot instead of showing empty
  lists. Each installation also mints its own unique instance identity on first
  start.

### Changed

- **Administration, permissions and settings inheritance work on MySQL/MariaDB
  and SQLite.** The organisation-unit tree (a unit's sub-units and its parent
  chain), delegated administration confined to a subtree, the "who is a full
  administrator" checks, shared labels, and the per-scope settings inheritance
  (factory default → instance → organisation unit → group → account, locks
  included) previously ran only on PostgreSQL because they relied on
  PostgreSQL-only database functions. They now run on all three supported
  engines, so a delegated administrator sees the right accounts, a scoped
  setting resolves to the right value, and the account directory, session list
  and administrative pages load whichever engine the instance uses. When an
  organisation unit, group or account is deleted, the setting overrides that
  belonged to it are removed on every engine, and a setting changed in the admin
  console is reflected everywhere it is read.

- **Settings and other reserved-word columns work on MySQL/MariaDB.** The
  database session now quotes identifiers the same way as PostgreSQL and SQLite,
  so tables and columns whose names are MySQL reserved words (such as the
  settings `key`) are read and written correctly on MySQL/MariaDB.

- **The whole server runs on the database engine you choose.** The core now
  opens its database through the run-time engine layer instead of a PostgreSQL-
  only connection, so an administrator can install on PostgreSQL, MySQL/MariaDB
  or SQLite by naming the engine in configuration — the same binary connects to
  whichever is chosen, applies the matching schema, and reads and writes through
  it everywhere.
- **Modules inherit the server's database engine.** When the core launches an
  installed module it now passes on which engine (and, for SQLite, which file
  location) it is using, so a module always connects to the same kind of
  database as the server rather than assuming PostgreSQL.

- **Background work runs on every database engine.** Scheduled and retried
  background jobs — sending an invitation, running a backup, an export — no
  longer depend on a PostgreSQL-only locking trick to hand each job to exactly
  one worker. The same queue now behaves identically on PostgreSQL, MySQL/MariaDB
  and SQLite, so a smaller instance can run on SQLite with no loss of function.
- **Live updates reach you without PostgreSQL.** The event bus that pushes
  changes between the server's parts (and on to modules and open browser tabs)
  used a PostgreSQL-only notification channel. On MySQL/MariaDB and SQLite those
  events are now recorded and delivered by a background reader instead, each
  event delivered exactly once even when several server processes share one
  database — so nothing is silently lost on a non-PostgreSQL install.
- **The server's own schema is prepared per engine.** The core's database
  schema is split so the right form is applied for the engine an administrator
  chooses; the existing PostgreSQL form is unchanged and keeps its history.
- **MySQL/MariaDB and SQLite installs get the complete core schema.** The whole
  server schema — every table an administrator's instance needs (accounts,
  sessions, API tokens, the module catalogue, roles and rules, jobs, audit,
  devices, domains, alerts, holidays, storage accounting, settings and the rest)
  — is now authored for MySQL/MariaDB and SQLite as a single consolidated form
  matching the PostgreSQL one, so a fresh install on either engine builds the
  same structure the PostgreSQL install has always had.
- **A module's PostgreSQL migrations keep working untouched.** The engine puts
  the module's schema on PostgreSQL's search path on every connection, as each
  module's own start-up used to. A migration written before multi-engine
  support, which named its tables without a schema prefix, therefore stays
  byte-for-byte the same — so an existing PostgreSQL instance still recognises
  it and does not refuse to start.
- **Dynamic searches work on every engine.** Queries whose shape is decided at
  run time — a filter panel where each control is optional, an "in this list"
  of unknown length — are built through a small dialect-aware builder instead of
  a PostgreSQL-only one. Values still travel only as bound parameters, never as
  text, so the search box cannot be turned into a way to reach the database.
- **List columns work the same on every engine.** A column that holds a small
  list of tags or ids — a PostgreSQL array in the past — is now stored as a JSON
  array, which MySQL and SQLite also understand. Writing one takes the plain Rust
  vector, reading it gives the vector back, and a "does this list contain X?"
  filter is written once and runs on all three engines (indexed on PostgreSQL).
  A module that used a PostgreSQL array converts its column with a single added
  migration, without rewriting the ones already in production.

- **Full-text search now works the same on every database engine.** Search used
  to rely on PostgreSQL-only machinery (`to_tsvector`, `ts_rank`, the `unaccent`
  extension, `pg_trgm`), so it only worked on PostgreSQL. A new shared component
  reduces text to its French word stems and strips accents in the application
  itself, storing the result in an ordinary text column; a query is reduced the
  same way and matched against it. Because this happens before the database is
  touched, a search returns the same results and the same ordering whether the
  server runs on PostgreSQL, MySQL/MariaDB or SQLite — and no database extension
  is required. A plural finds the singular ("chevaux" finds "cheval") and an
  accent-free query finds accented words ("resume" finds "résumé"); titles can
  be ranked above body text as before. (Fuzzy matching of misspellings, which
  the old PostgreSQL-only setup offered, is not part of this.)
- **The database engine can now be chosen at run time, in one binary.** A
  single build carries all three drivers, and the server picks PostgreSQL,
  MySQL/MariaDB or SQLite from its configuration at start-up — an administrator
  can switch without reinstalling. This removes the per-engine build: one
  artefact runs on any of the three. Each engine's concurrency discipline
  lives in the shared layer, invisible to the modules — on SQLite, writes are
  serialised through a single-writer queue with WAL and automatic retry, and
  MySQL connections are set to UTC and a case-sensitive collation.
- **Kubuno can be built against MySQL/MariaDB or SQLite, not only PostgreSQL.**
  A new shared component holds everything the three engines disagree about —
  how bind parameters are numbered, how an "insert or update" is written, how a
  freshly written row is read back, how JSON is reached into, what an aggregate
  returns — so a module states its query once and it runs on whichever engine
  the server was installed with. The engine is chosen when the component is
  built, which means one package per engine; an installation cannot switch
  engine without reinstalling.
- **A portability check for queries.** Statements that no other engine can
  express are now refused as they are written rather than misbehaving later,
  including two that would have been dangerous: a parameter used out of order
  or twice, and the PostgreSQL "does this key exist" operator, which would
  otherwise have been mistaken for a parameter and shifted every value after it
  by one.
- **Local-first sync now works the same on all three engines.** The change
  journal that powers offline-capable modules (a monotonic sequence per record,
  tombstones for deletions, and a delta feed a client resumes from a cursor)
  used to rely on a PostgreSQL sequence and database triggers that neither
  MySQL/MariaDB nor SQLite can reproduce. It is now a portable primitive driven
  from the application, so a module written once syncs correctly whichever
  engine the server runs, with the counter proven collision-free under
  concurrent writers on every engine.
- **The administration console's reads and maintenance run on every engine.**
  The device and session inventory and its search (including the client
  address), the label browser, the "edit my profile" update, the personal-data
  export (account and instance sheets), and the retention purges of the audit
  trail and the rule-threshold hits no longer depend on PostgreSQL-only SQL
  (native arrays, `json_agg`/`row_to_json`, the `inet` address accessor,
  `make_interval`, per-row `FOR UPDATE`, or a stored function). They are
  assembled in the application where needed and behave identically on
  PostgreSQL, MySQL/MariaDB and SQLite. On SQLite, a row's "last updated"
  timestamp is now kept current by a trigger, matching PostgreSQL's function and
  MySQL's `ON UPDATE`.

### Fixed

- **The tamper-evident administrative audit trail is written and verified on
  every engine.** Recording an administrative action and re-checking the audit
  hash chain now work on PostgreSQL, MySQL/MariaDB and SQLite: the engine-
  assigned entry id is read back the correct way for each engine, and the
  reserved-word columns and the client address are spelled per engine — so
  actions are logged, and can be checked for tampering, whichever database the
  instance runs on.

### Known limitations

- On MySQL and SQLite, events a module publishes are recorded durably but not
  yet delivered: the core still listens only to PostgreSQL's notification
  channel and needs a reader for the new event table. The compile-time-checked
  queries of the core, media and drive are PostgreSQL-only for now.
- A few administrative **reporting** views and one maintenance tool remain
  PostgreSQL-only and are not yet portable: the target-audience reach figures
  (a `LATERAL` join), the per-domain account count (`SPLIT_PART`), the sign-up
  activity chart (`generate_series`), the audit drill-down's cell truncation
  (`left(...)`), and the secret re-encryption CLI (`rekey`). They are unused on a
  MySQL/SQLite install's normal operation but would error if opened there.

### Security

- **Database driver updated past an unfixable advisory.** The previous line
  pulled in an RSA implementation vulnerable to a timing side-channel
  (RUSTSEC-2023-0071) for which no fix will ever exist. The new line does not
  depend on it at all, and it refuses any SQL string built at run time unless it
  has been audited — the queries here were checked and marked.

## [0.1.12] - 2026-09-18

### Fixed

- **Installing a module with `sudo` no longer locks the server out of its own
  module store.** `kubuno modules:install` is documented as a `sudo` command, and
  on a fresh installation it was the first thing to create
  `/var/lib/kubuno/modules-store` — as `root`. The server, which runs under an
  unprivileged account, could then no longer write there, and every later
  installation from the Marketplace failed with a permission error that named no
  cause. The packages now create the store for the service account, and an
  install run with elevated rights hands what it created back to the account that
  owns the data directory, repairing an installation already in that state.
  The server also creates the store at startup when it is missing, so the
  directory belongs to it whoever installs the first module.
- **The setup assistant can write the configuration it produces.** The packages
  shipped `/etc/kubuno` owned by `root` while the server runs under its own
  account. Since the configuration file is written by atomic rename, which needs
  write access to the *directory*, the assistant failed at its last step — after
  it had already created the database. The directory now belongs to the service
  group and carries the setgid bit.
- **A module installed from a package gets its configuration.** Only the old
  layout was recognised, so a module installed from a `.kbpkg` never received
  one. It then resolved its paths relative to its working directory — which is
  its configuration directory — and wrote user files under `/etc`. The packaged
  example is now installed as the effective configuration on first install; an
  existing file is never overwritten.
- **A failed installation now says why.** "Erreur interne" was all an
  administrator got, on the banner, in the API response, in the audit trail AND
  in the server log — leaving no way to diagnose a failure even with shell access
  to the machine. The cause chain now reaches the surfaces only an administrator
  reads: the log, the audit entry and the installation status. Public responses
  stay generic.
- **The Marketplace no longer offers a downgrade.** Versions were compared as
  plain text, so any difference lit up the "Update" button: an instance running
  0.1.10 was invited to install 0.1.8. They are compared as version numbers now,
  and the button appears only for a strictly newer release.
- **A successful install reports the version it actually installed.** The banner
  and the server log named the version the catalogue announced, while the
  package downloaded was the latest release — so a catalogue lagging behind made
  them name a version that was never installed.
- **An unknown audit filter is refused instead of ignored.** `?result=error`
  silently returned the whole journal, which reads exactly like a journal
  holding no failure. Unknown parameters are now rejected.

### Security

- **TLS library updated to a patched release.** The pinned `rustls` carried
  RUSTSEC-2026-0285 (medium). Every outbound HTTPS connection the server makes —
  the marketplace catalogue, certificate issuance, remote storage — goes through
  it.

### Changed

- **The quality gate runs the unit suites.** It only compiled them: an assertion
  left behind by a change of bound stayed red from 0.1.6 to 0.1.11 because
  nothing ever executed it. Running them also exposed three authorisation
  cache tests racing each other over a process-wide static — they now take
  turns, so a pass no longer depends on which machine runs them.

## [0.1.11] - 2026-09-18

### Added

- **A label field, `LabelField`.** Chips for the labels an element carries and a
  list to add or drop one, for putting the instance's labels on something from
  inside its own form rather than from a context menu. Presentational: it is
  handed the labels that exist and the ones chosen, and reports back — which is
  what lets it work on something that does not exist yet.

- **A help bubble, `HelpBubble`.** The filled answer behind a "?": the
  instance's accent, white text, and an arrow pointing at the control that
  raised the question — which a floating white card never does, and which
  matters most where several little "?" sit near each other. It goes on
  whichever side of that control has room (below, above, right, left) and the
  arrow follows, always on the edge facing it. Near a screen edge the bubble
  slides back into view rather than the arrow giving up and parking in a corner,
  where it would name whatever happened to be beside it. Only the tip of the
  arrow shows, and its point is square.


### Changed

- **The × on a mention chip fills its side of the chip.** Its box was narrower
  than it was tall and the leftover interline piled up above and below it, so
  its hover square sat inset at the top and bottom while sitting flush on the
  right — three different margins, visible the moment you pointed at it. It is
  now a square as tall as the chip's line, flush against the name and against
  the chip's inner edge; what keeps it off the outer edge is a two-pixel rim
  around the chip, drawn in the accent. Whole pixels, deliberately: at a
  fraction of the text size, the chip's edge and the square's edge fell on
  different phases of the screen's pixel grid, so they were drawn differently
  and the gap below LOOKED larger than the one above even though the layout had
  them equal to a hundredth of a pixel.

- **The × on a mention chip is centred.** It was a typed character, and a
  glyph sits wherever its typeface puts it inside the em box — low, here — so it
  read a touch below the middle however the button was aligned, and the offset
  would have moved again with a different font. It is now drawn rather than
  typed, which centres it by construction at any size.

- **A mention reads as one object, not as coloured words.** The chip a `@`
  mention leaves behind was a pale tint with the accent as its ink, which at a
  glance was hard to tell from emphasised text. It is now a solid block in the
  accent with white text, the square-ish corners the instance uses for its other
  chips, and a white × set slightly apart so it reads as a button rather than
  the last letter of the name.

### Added

- **Typing `@` always has someone to suggest: the instance's own people.** The
  mention fields asked the modules and nobody else, so on an instance without a
  contacts module — or simply one holding nobody by that name — `@` did nothing
  at all, which reads as broken rather than empty. The core now offers its own
  directory under the same extension point and the same rules as any module, so
  the administrator's sharing policy applies untouched: a closed directory
  suggests nobody, a narrowed one suggests the caller's own unit, and an address
  travels only when the policy shares it.

- **A person's directory card, for whoever shows a name.** One endpoint answers
  what the directory publishes about one account — the display name and photo it
  always gave, plus how the name is pronounced, the pronouns asked for, the work
  location, the introduction and the organisational unit. It obeys the same three
  sharing keys as the people search: a closed directory answers "not found", a
  narrowed one answers only within the caller's own unit, and the address is
  omitted unless the policy shares it. Gender and date of birth are absent by
  construction and must stay so.

### Changed

- **New Kubuno logo.** The platform's mark — shown in the top bar, the loading
  screen, the sidebar, the browser tab (favicon) and as the default instance
  logo — has been replaced with the new brand logo.

### Fixed

- **A field stops looking focused once you have moved on.** The focus stroke was
  painted on `:focus`, and a field whose trigger is a button — a date or time
  picker, a dropdown — keeps that focus after a mouse click. It therefore stayed
  lit until something else was clicked, and in browsers that do not hand focus
  back to the page when you click a blank area, it never went out at all. The
  stroke now follows `:focus-visible`: it shows for keyboard focus and for text
  entry, and an open list or panel lights its own field while it is open.

- **A picker or a dropdown inside a window closes when you click outside it.**
  Several of them listened for the click on the document while it was bubbling,
  so an ancestor that stops the event — a floating window does, to decide which
  window a press brings forward — left them open for ever: the panel stayed on
  screen and its field stayed lit. They listen during capture now, where nothing
  below them can take the event away. Affects the date and time pickers, the
  font and size pickers, the address, phone and label fields, and two popovers.

### Changed

- **Hovering a tab tints it — which it never actually did.** The active tab now
  answers in its own blue (#eaeffa) and the others in grey. The grey was meant
  to be there already, but it was written as a utility class, and a utility ends
  up in a cascade layer whose order is settled by whichever stylesheet names it
  first; with a dozen module stylesheets loading after the host's, the browsers'
  own transparent button background won. The rule was generated, the class was
  on the tab, the pointer was over it, and nothing painted. It is plain
  unlayered CSS now, which cannot lose that argument.

- **A tab strip is 48 px tall, and says so.** Its height came out of the
  label's line box plus two paddings — 38.28 px, a number nobody chose and that
  a different font or a taller alphabet would have changed again. The height is
  stated once now, so it holds whatever the label turns out to be. (The small
  size and the pill variant are unchanged: a pill is a chip around a label, not
  a strip.)

- **The tab indicator slides to the tab you picked.** It was a mark drawn under
  each tab, so changing tab put one out and another in — two events the eye has
  to join up by itself. It is one mark for the whole strip now, and it travels:
  it says which tab, and where it came from. It takes the width of its tab as it
  goes, is placed without animation the first time the strip appears, and holds
  still for a reader who has asked for less movement.

- **A form looks like a form whether or not it lives in a window.** The tinted
  canvas and the filled fields were tied to windows; a quick-create card or a
  side panel showing the same form fell back to white boxes with drawn borders,
  so the same form read as two different kinds of thing. The surface and the
  fields now have one definition, which a window takes through its content area
  and any other panel takes by wearing `kb-form-surface`. The two colours live
  in one place instead of being written out per rule.

### Added

- **A window whose content is a form can sit it on a tint rather than on
  white.** A form is mostly white fields, and on a white canvas they have
  nothing to stand on — the eye reads one sheet with lines drawn on it instead
  of a set of fields. The fields themselves take a fill one tone above the
  canvas and drop their resting outline, so a field is a filled box rather than
  a drawn rectangle and the focus stroke is the only line it ever grows. Opt-in,
  so a window showing a document, an image or a canvas keeps its white. Text
  fields, multiline fields, rich text, combo boxes, date fields and dropdowns
  all follow, and a window's title field is deliberately untouched: it belongs
  to the band, not to the form.

- **A form region can be raised onto a card** (`kb-form-card`). A tab strip and
  the content it governs are one object; putting them on their own white surface
  says so, and gives filled fields a plain background to be read against.

- **A form can name its subject at the top of itself** (`kb-form-title-field`):
  a heading line rather than a boxed field — one stroke under the text, three
  pixels when it has focus, and nothing else, so the heading of a form never
  reads as one more thing to fill in.

- **A building's position can be picked on a map, when a module provides one.**
  The console still ships two coordinate fields, because they work on an
  instance with nothing else installed; it now also declares the place where a
  module that renders maps can replace them with something better. The console
  names no module: it asks whether anyone active has claimed the job, and falls
  back to its own fields when nobody has.
- **A room statistics dashboard, in Directory → Buildings and resources.** A new
  tab reports, over the last 7, 30 or 90 days: bookings and hours booked, the
  share of the working day the rooms were used for, the share of requests the
  rooms accepted, the hours booked per day and per hour of the day, a ranking of
  the most-booked rooms, and the hours handed back automatically. The day and
  hour columns are cut on your own clock, not on UTC. When the module holding
  the bookings is not installed, the tab says so instead of showing zeros — a
  zero there would read as "no room was booked".

### Changed

- **A dropdown can be dressed by the container it sits in.** Its trigger painted
  its border and its fill inline, which no stylesheet could reach — it was the
  one control in a form that could not follow the others. It now reads the
  shared field tokens, with its previous look as the fallback, so nothing
  changes anywhere that does not ask for it.

- **The focus stroke under a heading field is three pixels, like every other
  field's.** The stripped-down text field — one stroke under the text and no box
  — drew a one-pixel line when it took focus, thin enough to miss on a
  high-density screen. It now carries the thickness the focus mark has
  everywhere else, and the stroke is reserved at rest as well, so nothing moves
  when the field is clicked.

- **A text field can now be asked to drop its frame** (`bare`), for a title line
  — of a document, of an event — which is not a form field and must not look
  like one. Written as a variant of the shared field rather than as bare markup
  copied into each screen, which is the only way it stays the same everywhere.

- **A required field is marked with an asterisk.** The mark lives in the field
  components themselves, so it is the same glyph, colour and spacing everywhere,
  and it is announced to screen readers — without summoning the browser's own
  validation bubble, which this product replaces with its own messages. In place
  on the building, resource and equipment sheets; the rest of the console
  follows as each form is touched.
- **The building sheet is laid out in two columns.** It was a single tall ribbon
  of half-empty rows; the short fields now pair off, and what needs the width —
  the address, the position, the note — keeps it. It folds back to one column on
  a narrow screen.

### Fixed

- **Clicking outside a window with a backdrop closes it again, instead of
  burying it.** The press on the veil travelled up the React tree and raised
  the window that had opened this one; that window's own veil then slid over
  the pointer between the press and the release, so no click was ever formed
  and nothing closed. The inner window was left underneath, unreachable. A
  press on a veil now belongs to the window it veils — one cause, both
  symptoms.

- **Escape closes the top window, not every open one.** Each window listened
  for itself, so one press closed a settings window and the window that opened
  it together. And an open dropdown list keeps Escape for itself: it closes the
  list, never the window around it — asked of the page rather than left to the
  order the listeners happened to be registered in.

- **A window opened by another window no longer sinks behind it when clicked.**
  A window rendered by another one is its child in React, and a portal carries
  events up the React tree rather than the DOM one — so a press inside the
  inner window reached the outer window's own handler a moment later and
  raised the outer one on top of what had just been clicked. A press now stays
  in the window it landed in. Clicking the window underneath still raises it,
  as it should.

- **Dropdown lists work from the keyboard like a native select.** They did not
  answer the keyboard at all: no arrow, no Enter, no Escape, no typing. With the
  list focused, ↓ ↑ Enter or Space open it on the current value, Home and End
  open it on the first or last row, and typing a letter opens it on the first
  row that starts with it. Open, ↓ ↑ walk the rows without wrapping, Home End
  Page↑ Page↓ jump, typing walks the matches ("b", "b", "b"…), Enter or Space
  chooses, Tab chooses and moves on, and Escape closes the list — only the
  list: it used to close the whole window under it. The row the keyboard is on
  is the row the mouse would highlight, and a screen reader is told which one
  it is. The list never takes the focus itself, so Tab still leaves from where
  the reader expects.

- **Clicking a dropdown list in a form now moves the focus to it, like a
  native select.** It used to refuse the focus — the right thing for a toolbar
  list over a document, whose selection must survive, but wrong everywhere
  else: the field the reader had just left stayed lit beside the open list,
  and any sequence of controls could bring its stroke flashing back. The list
  now decides at the click: it leaves the focus alone only when a document
  editor holds it; on a form it takes it, keeps it after closing, and the
  keyboard follows the pointer. A rich text field counts as a field, not as a
  document. Verified frame by frame across mixed sequences of fields, lists,
  buttons, the date picker and the rich text box: never two controls lit at
  once, never a stroke returning to a field the reader has left.

- **A rich text box now shows that it has the focus.** It drew a frame and
  nothing else, and the editable area inside it suppressed the browser's own
  mark — so clicking into a description left no sign of where the keyboard was
  pointing. It now carries the same single stroke as every other field.

- **A refused save now says what the server refused.** Every screen printed its
  own generic sentence — "Enregistrement impossible." — while the server had
  answered, for instance, "Un bâtiment doit avoir au moins un étage : c'est ce
  qui permet de dire où se trouve une ressource." The console was reading the
  answer in the wrong place and silently finding nothing there. Twenty-five
  screens were affected, from the building sheet to the marketplace, the theme
  import, the LDAP directories and the mail settings.
- **A form's alert stays under the title, in sight.** It used to sit at the end
  of the form, so on a sheet taller than its window you had to scroll to the
  bottom to learn why nothing had been saved — after pressing Save. It is now
  pinned between the title bar and the scrolling content, for every window.
- **A focused field no longer shows a double border.** The focus stroke used to
  be two paintings side by side — a one-pixel border and a two-pixel ring that
  began exactly where the border ended. On a screen with fractional scaling
  (Windows at 175 %, say) the two do not round to the same physical pixels, and
  a sliver of the background shows through between them: what you read is two
  borders with a white gap. Fields now draw that stroke as a **single** painting
  of the same thickness, overlapping the border instead of abutting it, so
  nothing can slip in between. Applies to every control that draws that kind of
  frame: text fields, text areas, number fields, drop-down lists (closed, focused
  or open), searchable lists, date fields, editable text and mention fields. Two lesser causes were removed along the way: the
  browser's own focus ring, which some engines painted on top of ours, and an
  inherited ring offset that could insert a white band of its own.
- **A popover opened from inside a window is no longer painted behind it.** The
  anchored popover primitive sat below the window layer, so the address results
  of a location field, for instance, were positioned correctly and invisible.
- **A selected tab that sits off-screen now scrolls itself into view.** On a
  section with more tabs than fit, arriving from a link or the back button left
  the strip showing the first tabs while the panel below showed the last one,
  with nothing to say where you were.
- **A bar chart can now label its horizontal axis**, thinning the labels out as
  far as it must so none touches another. Without it, "booked hours by hour of
  the day" was a row of bars nobody could put an hour to.
- **The leader of a ranking is no longer painted red.** The bar list turns a
  nearly-full bar into a warning, which is right when the bar measures a quota
  being used up and wrong when it measures the largest value in a list: the
  most-booked room is good news, not an alert.



- **Room usage figures, asked of the module that holds the bookings.** The
  console can now report how the rooms were used over a period. The bookings
  belong to the calendar, not to the directory, so the console asks it rather
  than reading its data — and says plainly that the figures need the calendar
  when that module is not installed, instead of failing the page over it.
- **Two ways to keep a room from being handed back.** A meeting whose guests have
  all declined gives its room back to the pool. That is right for an ordinary
  booking and wrong for a few, so the exception can now be declared where it
  belongs: on the room, for a place whose availability must not depend on who
  answered; and on a group, for a population whose meetings keep their room
  wherever they are held. Both are off by default — the rule applies unless
  somebody says otherwise.
- **Install and list modules from the command line.**
  `kubuno modules:install <file.kbpkg>` installs a module from a local package
  — Kubuno's cross-platform `.kbpkg` (a ZIP holding the module directory at its
  root), or a `.zip`/`.deb`/`.tar.gz` — with no network and no catalogue: the
  archive is extracted, its embedded `SHA256SUMS` are verified (a tampered
  package is refused), the module id is read from `module.toml`, and the module
  is placed in the core's writable store. It starts on the core's next launch
  (`systemctl restart kubuno` to activate it at once). `kubuno modules:list`
  shows the modules currently in the store with their version. Offline and
  scripted module installation now works the same way on every platform,
  alongside the one-click marketplace.

- **The CAPTCHA type selector shows a live example.** Under "Type de test
  humain" in the security settings, a preview draws the actual challenge the
  chosen type produces — the distorted image, the sliding puzzle, or the sum —
  from the same server that the sign-in form uses, with a button to draw another.
  An administrator can finally see whether their tuning (distortion, length,
  noise, tolerance, range) still leaves a test a person can pass, instead of
  guessing from the numbers or failing a real sign-in five times to reach it.
  The preview refreshes when the type is switched and after the tuning is saved.

- **A sign-in CAPTCHA after repeated failures, self-hosted.** Once an account
  has failed to sign in a configurable number of times
  (`security.login_captcha_after_failures`, 0 disables it), the form must carry
  a solved human test before the password is checked again, until the next
  success. An administrator chooses which test from the security settings
  (`security.captcha_type`): distorted characters to retype, a jigsaw piece to
  slide into place, or a small sum to solve. Each challenge is drawn and
  verified by the server itself — the CAPTCHA is entirely self-hosted, with no
  third-party verification service and no outbound request — and its complexity
  is tunable (code length, distortion, noise, slider tolerance, arithmetic
  range). The distorted-text image is rasterised so the answer is never present
  as text or vector geometry in what the browser receives. The gate counts
  failures per submitted identifier, not per account, so a form that keeps
  failing is asked for a CAPTCHA whether or not the identifier names a real
  account — telling the two apart is exactly what the rest of sign-in avoids,
  and the gate does not reintroduce it. A successful sign-in clears the count.
  The security settings show only the tuning
  knobs that apply to the chosen test — the distorted-text options for text, the
  tolerance for the slider, the range for the sum — so an operator setting up one
  never reads three fields that belong to another.

### Changed

- **An account's storage card now says where the space went.** It spans the
  sheet and opens with the total the quota actually counts, followed by what
  each module charges to that account — the question anyone asks the moment the
  total surprises them — with the ceiling and its bar underneath, still editable
  in place. The figures come from the same endpoint the storage page reads, so
  the two screens cannot disagree.

- **Every detail screen in the console now leaves through the same trail.** Six
  more sheets — an alert, a device, a detector, a rule, a target audience, a
  holiday calendar — used to stack a back button of their own directly under a
  breadcrumb that already said where you were. They now add themselves to that
  trail instead ("Sécurité › Centre d'alertes › <alert>"), which is what turns
  the section above them into the way back. Two exceptions stay on purpose: a
  screen that failed to load still offers a way out of its own, and creating a
  detector — which has no address of its own to return from — keeps its button.

- **Leaving through the breadcrumb now asks about unsaved edits.** A sheet that
  edits in place has no dialog to close, and the trail was the one way out that
  never asked: a half-typed field vanished without a word. It now puts the same
  question the sheets' own controls did, for every detail screen at once.

- **An account's sheet joins the console's breadcrumb instead of carrying its own
  back button.** The trail now reads "Annuaire › Utilisateurs › <name>", and the
  Utilisateurs segment is the way back to the list. The sheet used to stack a
  hand-made "Retour aux utilisateurs" link directly under a breadcrumb that
  already said the same thing — two navigations, one of which no other detail
  page had.

- **An account's sheet now keeps its identity in view.** Opening someone's
  account puts a card down the left — their photo, name, address, whether the
  account is active, when they last signed in, when it was created and which
  organisational unit governs it — and that card stays put while the tabs
  beside it scroll. The actions that act on the account itself (reset the
  password, change its unit, enable or disable it) live on that card, so the
  name of who is being changed is never off screen while you change them. An
  action you are not allowed to take now says why when you hover it, instead of
  being greyed out with no explanation: you cannot disable your own account, and
  the card tells you so.

- **The accounts page is now framed by the organisational units.** A panel down
  the left of Directory → Users holds the unit tree permanently: you choose
  whether the list covers every unit or only the ones you pick, search the tree
  by name, take one unit or several at once, and say explicitly whether
  sub-units are included. The panel does not navigate away — it *frames* the
  list, so the count, the selection bar and anything you do next all describe
  the same set of accounts. It folds away when the table needs the width, and a
  link at the bottom leads to the page where units are actually created, renamed
  and moved.

- **The app menu's favourites card breathes.** The white card that holds your
  favourites now keeps a margin of its own — 10px each side instead of sitting
  almost flush against the panel, and more room below it before the rest of the
  apps begin. The apps listed underneath were re-inset to match, so their tiles
  keep exactly the width and the columns of the ones on the card — the two grids
  read as one.

- **The sign-in fields now carry their own label.** On the sign-in page the
  identifier and password boxes — and the e-mail box on the "forgot password"
  step — are the platform's standard outlined field instead of bare inputs: the
  label sits inside the box at rest and rises onto the border, into a notch cut
  out of the line, as soon as you start typing or the browser fills the field in
  for you. The label therefore stays readable while you type, which a
  placeholder never was. The eye that reveals the password is unchanged, and the
  sign-in button now stays greyed out until both boxes hold something, rather
  than letting an empty form reach the server.

- **A module installs from its Kubuno package (`.kbpkg`) only.** The server no
  longer opens a `.deb`, `.rpm`, `.tar.gz` or any system installer for a module:
  the marketplace, and `kubuno modules:install <file>`, accept the `.kbpkg`
  format alone (a ZIP the server unpacks itself, with no external tool, the same
  way on Linux, Windows and macOS) and refuse anything else with a clear message.
  A module that publishes only a system package for the running platform is
  declined by name instead of being downloaded and half-installed. This drops the
  server's reliance on `dpkg-deb` and `tar` for module installation. (The core
  itself still ships as a native system package — it is a real system service.)

- **The top-left brand now names the app you are in.** Inside Mail the corner
  shows the Mail logo and "Mail", inside Drive the Drive logo and "Drive",
  inside Office's Documents the Documents logo and "Documents", and clicking it
  opens that app's entry point instead of the platform home page. Outside every
  module (home) it stays the instance logo and "Kubuno". Same behaviour in the
  sidebar corner used when a module hides the top bar.

- **The administration console behaves like a module.** It has its own brand
  in the top-left corner (its logo and "Administration", linking to the
  console's landing), its own favicon and its own tab title, exactly as a
  module does. The duplicate logo and name that headed the console's sidebar
  are gone.

### Fixed

- **Field labels no longer have their descenders sliced off.** In every box that
  carries its label inside — the sign-in fields, and the same field wherever the
  platform uses it — the tails of `p`, `g`, `q`, `j` and `y` were cut flat along
  the bottom, so "Mot de passe" read as if it had been trimmed with a ruler. The
  label is now given room for the full height of the type, and it sits exactly on
  the text it stands in for.

- **Modules built before the date-formatting change load again.** Removing
  `getDateLocale()` from the SDK broke every installed module that still
  imported it: Drive, Office, Calendar and Notes failed at import time with
  "does not provide an export named 'getDateLocale'" and were silently dropped
  from the shell. The SDK exports it again, as a deprecated bridge that builds a
  date-fns compatible locale from the browser's `Intl` data (no date-fns in the
  host), so older module bundles load and keep printing dates in the reader's
  language.

- **A module that fails to load no longer vanishes without a trace.** When a
  module's interface bundle cannot be loaded — most often because it was built
  against a newer SDK surface than the server serves, so an ES import fails with
  "does not provide an export named 'X'" — the shell still isolates it so the
  rest of the workspace stays up, but it now announces the failure in the
  notification bell for anyone who may read modules, with the module name and the
  reason (SDK mismatch, load error, or missing entry point) and a link to the
  Modules admin page. Previously such a module simply disappeared from the
  sidebar and the app grid with no visible cause, leaving the only trace in the
  browser console. A later successful load clears the alert.

## [0.1.10] - 2026-09-10


### Added

- **`/api/v1/modules` now gives each module's brand logo, and each sub-app's.**
  Alongside the lucide `icon` name, every module in the listing carries a
  `logo_url` pointing to its real brand image served by the host (e.g.
  `/drive-logo.png`), and every launchable sidebar item carries its own
  `logo_url` too (Documents, Spreadsheets, Vertex, Apex…), keyed by the item id.
  Each is `null` when nothing ships for it. The desktop app gallery and the
  launcher can now show a module's — and a sub-app's — actual logo instead of a
  generic glyph, falling back to the icon when there is no logo.

- **A module can call another module again when per-module secrets are
  derived.** With `server.derive_module_secrets` on, each module holds only its
  own secret and checks an incoming one by equality, so a direct call from one
  module to another's `/ipc` route was rejected with 401 — only the core, which
  holds the master secret, can verify or present a given module's secret. The
  core now relays these calls: a new internal route `ANY /internal/ipc/<target>/…`
  authenticates the calling module, re-injects the target's own secret, and
  forwards to the target's `/ipc/<…>` surface, streaming the reply. The relay is
  bounded to that `/ipc` surface, so it cannot reach a module's user routes or
  its `/internal`; it returns 401 when the caller is not a valid internal caller
  and 503 when the target has no running instance. This also stops a silent
  data-integrity leak: a module deleting its Drive-backed file went through the
  same broken path, so under derived secrets every deletion left an orphaned
  Drive file behind.

### Fixed

- **Browser geolocation now works inside the apps.** The security headers sent
  `geolocation=()`, which blocked the Geolocation API for the host and every
  module; it is now `geolocation=(self)`, so features like "Your location" and
  live navigation in Maps can prompt for and use the device position (same
  origin only, so third-party frames stay blocked).


### Changed


- **The README now opens with the Kubuno logo.** The public README on
  GitHub now shows the Kubuno crest at the top of the page. The image ships
  in-repo, under `.github/logo.svg`, so it renders even when the repo is
  browsed offline.

- **Dates and times are now formatted by the platform, not by a library.**
  `date-fns` is gone from the server's interface, along with the file that
  imported thirteen of its locale bundles so that month names came out in the
  reader's language — the browser already knows all of that. `Intl` is used
  instead, through a small in-house module exposed to every module by the SDK.
  Callers now say what a date is FOR (`formatDate(d, 'date')`) rather than how to
  write it (`format(d, 'dd/MM/yyyy')`), which is what a product shipped in
  thirteen languages actually needs: a hard-coded pattern prints 03/09/2026 to a
  reader who expects 2026年9月3日. Four call sites were forcing French regardless
  of the chosen language; they are fixed by the move. Machine formats — keys,
  sort values, `<input type="date">` — are kept separate and deliberately built
  from local calendar fields, since `toISOString()` shifts the day near midnight.
### Added

- **Modules now receive the client's real IP address.** The proxy forwards the
  hardened, trusted-proxy-resolved client IP to modules as an `X-Kubuno-Client-IP`
  header (stripped from any incoming request first, so it can never be forged),
  letting a module implement IP-based abuse control such as IP bans. A
  module-to-module call keeps the address the calling module forwards.
- **The header notification bell now shows real-time notifications from any
  module.** Until now the shared bell only carried admin alerts; a module can
  emit a standard `<module>.notification` real-time event and it appears in the
  same bell for the addressed user — so every module shares one notification
  centre instead of growing its own.

### Changed

- **Application icons are seven times lighter.** Every module tile was a
  512×512 image for artwork never drawn larger than 52 pixels, so the app
  launcher pulled about a megabyte of icons. They are now 192×192 — still
  twice the size the largest screen needs — which takes the whole set from
  1001 kB to 145 kB with no visible difference, even on high-density displays.
  Opening the launcher for the first time costs 113 kB instead of 658 kB.

- **Instance settings are fetched once per page instead of four times.** The
  public settings endpoint is read by unrelated parts of the shell — the
  startup language and theme, the idle-session timeout, the instance logo, the
  sign-in page, home widgets, several admin panels — and each one issued its
  own request. They now share a single one, and a settings change made from the
  administration console still takes effect immediately: writing any setting
  drops the shared copy, so the next read comes from the server.

- **Logos, icons and fonts are no longer re-downloaded on every screen.**
  These files have stable names and were served with `no-store`, which forbids
  the browser from keeping them at all: every module switch fetched them again,
  and opening the app launcher — one tile per installed module — cost roughly
  650 kB each time. They are now served with `no-cache`, so the browser keeps a
  copy and revalidates it, receiving an empty *304 Not Modified* while the file
  is unchanged and the new file as soon as it changes. A module switch drops
  from ~95 kB to ~10 kB of traffic, a page reload from ~69 kB to ~21 kB, and a
  changed logo still reaches everyone immediately. Application data (`/api/*`,
  `/internal/*`) and `index.html` keep `no-store` and are never cached.

### Fixed

- **The notification bell stays readable whatever the count.** The counter sat
  on top of the bell and hid it as soon as it reached two characters; it now sits
  just above the button's corner. It also shows the real number up to 999 (then
  "999+") instead of collapsing to "9+" past nine.

- **Restarting the server no longer makes every open tab reload the module list
  a dozen times.** Installed modules all re-register within a few seconds of a
  restart, and each announcement triggered its own request — about fifteen per
  tab to learn one and the same thing. Those announcements are now grouped, so a
  single request is made once the burst settles.

- **The top bar can no longer be scrolled off-screen.** Whenever an element
  extended past the bottom of the viewport (a menu opened near the edge, a
  toast, any floating layer), the page itself became scrollable: a wheel
  gesture reaching the end of a pane's content — or a keyboard focus /
  find-in-page jump — then slid the whole application, top bar included, out
  of view with no way to scroll back. The shell now pins the document while
  the application is mounted, so the top bar stays visible on every screen;
  public pages (shared forms, login) keep normal page scrolling, and printing
  is unaffected.

### Changed

- **New Contacts logo** — a blue hexagon with a white person silhouette —
  served as the browser-tab icon of `/contacts` (`contacts-logo.png`,
  raster PNG replacing the former SVG).
- **New Chat logo** — a sky-blue hexagon with a white speech bubble — served
  as the browser-tab icon of `/chat` (`chat-logo.png`, raster PNG replacing
  the former SVG).
- **New Drive logo** — a blue isometric platter stack with gold tabs — served
  as the browser-tab icon of `/drive` (`drive-logo.png`, raster PNG replacing
  the former SVG).
- **New Calendar logo** — a violet hexagon with a white calendar grid —
  served as the browser-tab icon of `/calendar` (`calendar-logo.png`, raster
  PNG replacing the former SVG).
- **New Listen logo** (Media) — a green hexagon with a white loudspeaker —
  served as the browser-tab icon of `/media/listen` (`media-listen-logo.png`),
  which previously had no tab icon of its own.
- **New App logo** — a blue hexagon with a stack of isometric cubes — served as
  the browser-tab icon of `/app` (`app-logo.png`); the App favicon now
  resolves, where the former `/app-logo.svg` path pointed at a missing file.
- **New Assistant logo** — a purple hexagon with a smiling headset face —
  served as the browser-tab icon of `/assistant` (`assistant-logo.png`), which
  previously had no tab icon of its own.
- **New Code logo** — a dark hexagon with a white ribbon mark — served as the
  browser-tab icon of `/code` (`code-logo.png`, raster PNG replacing the SVG).
- **New Books logo** — a brown hexagon with an open book — served as the
  browser-tab icon of `/books` (`books-logo.png`); the Books favicon now
  resolves, where the former `/books-logo.svg` path pointed at a missing file.
- **New Flow logo** — a gold hexagon with an "F" and a small flowchart —
  served as the browser-tab icon of `/flow` (`flow-logo.png`, raster PNG
  replacing the SVG).
- **New Maps logo** — a hexagon with a red pin over a green landscape —
  served as the browser-tab icon of `/maps` (`maps-logo.png`, raster PNG
  replacing the SVG).
- **New Forms logo** — a green hexagon with a light form/checklist — served
  as the browser-tab icon of `/forms` (`forms-logo.png`), which previously had
  no tab icon of its own.
- **New Notes logo** — an orange hexagon with a clipboard holding a note page —
  served as the browser-tab icon of `/notes` (`notes-logo.png`, raster PNG
  replacing the SVG).
- **New logos for every PaintSharp sub-module** — Apex, Layer, Motion,
  Vertex, Keyframe, PdfWriter and FontEditor — coloured hexagons carrying
  their two-letter initials — served as the browser-tab icons of
  `/paintsharp/<sub-module>`, which previously had no tab icon of their own.
- **New Tasks logo** — a green hexagon with a white checkmark inside a
  circle — served as the browser-tab icon of `/tasks` (`tasks-logo.png`),
  which previously had no tab icon of its own.
- **New Photos logo** — a hexagon with a rainbow aperture inside a blue ring
  — served as the browser-tab icon of `/photos` (`photos-logo.png`), which
  previously had no tab icon of its own.
- **New Keestore logo** — a violet hexagon with a white key — served as the
  browser-tab icon of `/keestore` (`keestore-logo.png`, raster PNG replacing
  the SVG).
- **New Wiki logo** — a violet hexagon with a white book and a "W" — served
  as the browser-tab icon of `/wiki` (`wiki-logo.png`); the Wiki favicon now
  resolves, where the former `/wiki-logo.svg` path pointed at a missing file.
- **New Forum logo** — a blue hexagon with three people and speech bubbles
  — served as the browser-tab icon of `/forum` (`forum-logo.png`), which
  previously had no tab icon of its own.

- **New Mail module logo** served at `/mail-logo.png` (replacing the old
  `mail-logo.svg`) — used as the Mail favicon and app icon.

- **New Documents logo** among the module icons the host serves
  (`office-documents-logo.png`, replacing the previous SVG).
### Added

- **The administration console now has its own logo, and its own tile in the
  app launcher.** A blue hexagonal badge holding a gear heads the console's
  sidebar (beside "Administration") and its collapsed icon rail, giving the
  surface an identity of its own and signalling at a glance that the sidebar has
  switched from a module's navigation to the console. The same badge appears as
  an **Administration** tile in the app launcher (waffle), opening the console
  in one click. That tile is shown **only to administrators** — anyone who may
  actually enter the console — so no one is offered a door that would only
  refuse them.

### Fixed

- **The README no longer links to a non-public file.** The Configuration line
  previously pointed to `CLAUDE.md`, an internal file that is gitignored and
  never shipped to GitHub, producing a dead link on the public repository page.
  It now links to `config.toml.example`, whose inline comments already document
  every option.

- **Floating windows now have square corners.** Rounded corners left 1px light
  vertical seams along the title band on some GPUs (an antialiased clip/paint
  edge that no workaround reliably removed), so every floating window — dialogs,
  the mail composer, chat popups, media players, the macro editor — is now
  square, matching classic OS windows. Windows also snap to whole pixels at
  mount.


### Changed

- **Uniform caption buttons on floating-window bands.** Every title-bar action
  now shares the close button's exact geometry and hover (30x30, 5px radius,
  white veil) and the same spacing, whatever the module drew — enforced by one
  core rule, pop-out button included.
- **Classic window-caption glyphs on dock groups.** Maximize is now a plain
  square and restore two overlapping squares, instead of diagonal double
  arrows.

- **New logos for every Office sub-module** — Documents, Spreadsheets,
  Presentations, Projects, Diagrams, Data, Script, Maths and Whiteboard —
  served as the
  browser-tab icons under `/office/<sub-module>`. Every Office
  sub-module icon is a raster PNG (`office-<id>-logo.png`) instead of SVG.

- **New PaintSharp browser-tab icon** — the monogram now sits inside a purple
  hexagonal badge, matching the tile the app launcher shows for the module.

- **Tinted cards on the administration landing.** The shortcut cards (Users,
  Applications, Storage, Security, Alerts, Groups, Instance identity, Reports)
  now sit on a soft blue-grey (`#F0F4F9`) instead of plain white, setting them
  apart from the page and from the "Getting started" card above them.

- **Wider, consistent spacing between admin blocks.** Page-level cards and
  panels are now separated by 40px — on the landing (the shortcut cards, and the
  gap under "Getting started") and on the dashboard (its chart panels) — so the
  console breathes and keeps one rhythm between blocks. Compact metric tiles stay
  grouped tightly, as a cluster distinct from the blocks around them.

- **Even card heights on the administration landing.** Cards on the same row
  now share the height of the tallest, so a shorter card (e.g. Storage) no
  longer leaves a ragged gap beneath it next to its taller neighbours.

## [0.1.9] - 2026-08-26


### Fixed

- **The server would not compile for Windows at all.** The disk-space probe
  called `statvfs` unconditionally — a POSIX function absent there — so the
  Windows installer had stopped being produced, silently, while the release kept
  shipping the three other packages. The probe now has one implementation per
  system, `GetDiskFreeSpaceExW` answering the same two figures on Windows, and
  `libc` is declared as the POSIX-only dependency it is.
## [0.1.8] - 2026-08-26


### Fixed

- **A built package could be thrown away instead of published.** The job that
  attaches a package to the release waited ten minutes for another workflow to
  create that release, then gave up with "release never appeared — build.yml
  likely failed". The diagnosis was wrong: on a repository whose `.deb` takes
  longer than ten minutes to build, the release simply did not exist yet, and a
  package that had built perfectly was discarded. Four modules reached v0.1.6
  with packages missing for some systems because of it. The job now creates the
  release itself when it is missing, so it no longer depends on another workflow
  finishing first.
### Added

- **`@kubuno/drive` 0.1.6 declares `FileItem.is_protected`.** Drive's own
  interface reads that flag on files the platform ships, and the published type
  surface did not declare it — so a module typechecking against the package
  failed on a field its own API returns. Publishing this package is what unblocks
  Drive's quality gate.
- **A module's executable is found whatever the system names it.** A module
  declares one `entrypoint` for every system — `kubuno-drive` — while the
  Windows package installs `kubuno-drive.exe`. The server joined the declared
  name and nothing else, so on Windows it looked for a file that does not exist
  and failed as if the binary were missing. It now falls back to the `.exe`
  variant, on every system, so a package built for Windows behaves the same
  wherever it is inspected.
- **The server installs the single `.kbpkg` package format.** No change was
  needed to read it: a `.kbpkg` is a ZIP whose root is the module directory as
  the server already expects to find it, so what it unpacks needs no
  translation. It is also the only format the server opens **without an external
  tool** — `.deb` and `.tar.gz` are handed to `dpkg-deb` and `tar`, which is
  precisely why installing a module ever worked only on Debian-like systems. The
  catalogue offers it ahead of a system package when a module publishes one.
- **An artefact is only ever downloaded over HTTPS.** The catalogue is
  authenticated by its signature, but the artefact is fetched elsewhere: in the
  clear, anyone on the path can swap it. The digest would catch that, and no
  security should rest on a single wall. The loopback address stays allowed —
  it has no network path to divert, and without it the mechanism could not be
  exercised.

### Security

- **The catalogue's list of checksums is now signed, and the server checks the
  signature.** A checksum authenticates a file against a list; nothing
  authenticated the list. Whoever took control of the catalogue could rewrite a
  checksum and point it at their own file, and every instance would have verified
  it happily — the attacker having computed both halves. The catalogue now
  publishes one Ed25519 signature covering every module, every platform and every
  digest, and the server refuses to believe a manifest whose signature does not
  hold. The private key lives with the administration panel, which is never
  deployed; the public server only ever holds the signature, so a compromise
  there can alter what is served but cannot make the alteration verify.
- **A checksum, or a signature, can no longer quietly disappear.** A missing
  digest used to be a warning, and the install went ahead unverified — so
  deleting one line from the catalogue disabled the whole check. A module that
  has once been installed with a verified digest is now refused without one, and
  the same rule applies to signatures: what has been signed once may not come
  back unsigned. Unsigned modules are still accepted, loudly, which is the point
  of the rule — a warning nobody can strip.

### Added

- **The catalogue answers according to the system asking.** A server now tells
  the catalogue which system and architecture it runs on, and the catalogue
  replies with the artefacts for that system and names the one to install. The
  choice therefore belongs to the catalogue, which can improve its rule — prefer
  the single package format over a system package, say — without every deployed
  instance having to be upgraded first. A server asking from Windows is now told
  plainly that a module publishing only a system installer cannot be installed
  there, instead of discovering it halfway through.
- **The catalogue now says where each module's binaries are**, per platform, with
  their size and digest, and the server uses that instead of guessing. It used to
  work the artefact out by itself, by looking for a file name ending in a
  per-platform suffix — a guess that only ever matched on Linux, which is why
  one-click installation silently failed on Windows and macOS. When a module
  publishes nothing the server can unpack for the running platform, it now says
  so plainly, naming what the module does publish, instead of failing further
  down the line. This is the first step of the packaging decision below.
- **A decision document on how modules are packaged**
  (`DECISION-empaquetage-des-modules.md`). It records what was found while fixing
  the marketplace: the server already opens module packages itself and never calls
  the system package manager, one-click installation only ever worked on Linux
  because the expected file names were never produced for Windows or macOS, and
  the catalogue carries no artefact information at all. It proposes a single
  `.kbpkg` format installed by the server, keeps native packages for the server
  itself, and lays out a three-step migration. Proposed, not yet decided.

### Fixed

- **Installing a module from the marketplace left it dead on arrival.** The module
  was downloaded, verified and unpacked correctly, then started with a working
  directory — its own configuration directory — that did not exist, because the
  service was not allowed to create it. A missing working directory and a missing
  executable produce the exact same error, so the log blamed the binary, which
  had been there all along. The server now starts a module only from a directory
  that exists, falling back to the module's own directory and saying so, and the
  failure message names both the executable and the working directory instead of
  neither.
- **Packages carried the ownership of whoever built them.** The `.deb` recorded
  the build account's numeric user id, and dpkg restored it on the target
  machine, so `/usr/lib/kubuno/modules` and `/etc/kubuno` ended up owned by
  whatever unrelated account happens to hold that id there — leaving the service
  unable to write where it must. Packages are now sealed as `root`, and the
  directories the service owns are granted to it explicitly at install time.

### Security

- **Dependencies carrying published advisories upgraded.** The HTTP/2 layer
  (unbounded empty DATA frames, RUSTSEC-2026-0258), the DNS resolver used to
  prove domain ownership (CPU exhaustion on message encoding and an unbounded
  loop on NSEC3 validation, RUSTSEC-2026-0119 and -0118) and the validation
  crate, which was pulling a punycode flaw (RUSTSEC-2024-0421). The one
  remaining advisory is written down in `.cargo/audit.toml` with the reason it
  cannot apply here: it belongs to a MySQL driver this build never compiles.

### Fixed

- **The continuous-integration gate is green again.** Two lints in test code
  broke the run that guards every push, which meant nothing else it checks was
  being reported either.


### Fixed

- **A Debian/Ubuntu install could not use a database on another machine.** The
  systemd unit declared `Requires=postgresql.service`, so the server refused to
  start on any host without a local PostgreSQL service — which is precisely the
  supported setup where the database lives elsewhere, and it failed with a
  dependency error that said nothing about the cause. The unit now declares
  `Wants=`, as the RPM always has: a local database is still started first when
  there is one, and its absence is no longer fatal.

## [0.1.7] - 2026-08-25

### Security

- **Rotating the token-signing secret no longer destroys what is stored.**
  `auth.jwt_secret` was doing two jobs at once: signing sessions, and deriving
  the keys that encrypt the SMTP password, the directory bind password, OIDC
  client secrets, migration credentials and every user's second-factor secret.
  The two have opposite lifetimes — a signing key should be rotatable, a
  data key must not be — so changing it silently made all of those unreadable
  and locked every user out of their own two-factor enrolment. The data keys now
  come from their own file (`/var/lib/kubuno/data.key`, 0600), and rotating the
  signing secret costs nothing beyond signing everyone out.
  Upgrading is free and needs no action: the file is seeded, on first start,
  with the signing secret then in force, so everything already stored keeps
  decrypting with exactly the same derivation. Nothing is re-encrypted.
- **New command `kubuno security:rekey`** — draws a fresh data key and
  re-encrypts everything it protects. An instance whose signing secret was weak,
  shared, or left at the value shipped in the example file inherited a data key
  just as weak; this is how it is replaced. Everything is rewritten in one
  transaction and the new key file is only written once that transaction has
  committed, so an interruption leaves the instance exactly as it was. The
  previous key is kept beside it as `data.key.old`. `--check` answers the
  narrower question — can this instance still read everything it has stored? —
  by decrypting every value and writing nothing, which is what you want after an
  upgrade or a rotation.

### Fixed

- **A fresh installation gave its administrator an empty console.** What the
  administration console shows, and what its routes accept, comes from a role
  *assignment*; `users.role = 'admin'` is only a cache of it. Both paths that
  create the very first administrator — the installation wizard and the headless
  seed — wrote the cache and never the assignment, and the migration that grants
  it had already run, back when the instance had no accounts at all. The
  operator was therefore admitted to the console holding nothing: three pages
  that require no privilege, and a refusal on everything else — users, settings,
  applications, security. Both paths now grant it. Instances already installed
  this way repair themselves at the next start, so no manual step is needed.
- **The service could refuse to start on a fresh machine** (`226/NAMESPACE`). The
  systemd unit lists the directories it may write to, and two of them —
  `/usr/lib/kubuno/modules`, `/var/backups/kubuno` — do not exist on a machine
  where no module has been installed yet. systemd then refuses to build the
  process's namespace and the service never runs, with an error that says
  nothing about the cause. The package now ships both directories, the
  post-install step creates them, and the unit tolerates a missing path instead
  of failing.
- **An installed instance can no longer be offered the installation wizard.** The
  wizard used to be decided on the configuration file alone, so an instance whose
  configuration lost a value — or still carried the example secret — would come
  back up as if it were new, taking a working service off the air. The database is
  now consulted, in one direction only: an administrator already recorded there
  means the instance is installed, the wizard stays away, and the missing values
  are reported as the misconfiguration they are. An unreachable database changes
  nothing, so an outage can never open the wizard.

### Security

- **There is no default administrator password any more.** An instance that came
  up without one used to create `admin` / `kubuno` — a password printed in the
  source, the README and the installer's output, and therefore known to everyone
  who can reach the port before its owner's first sign-in. Now: a fresh
  installation has the operator choose it in the setup wizard; a headless
  deployment either takes `KUBUNO_ADMIN_PASSWORD`, or the instance **generates
  one at random** (20 characters) and writes it to
  `/var/lib/kubuno/initial-admin-password`, readable by the service account only.
  The password is never written to the log — only the path to it — and the
  account still has to change it at first sign-in. `kubuno reset-admin` and
  `kubuno db seed` follow the same rule.

### Added

- **A fresh install now sets itself up from the browser, like WordPress or
  Nextcloud.** Until now a new instance had to be configured by hand — edit
  `/etc/kubuno/config.toml`, invent two secrets, create the database and its
  schema — before it would start at all. It now notices it is not installed yet
  and serves an **installation wizard** on its usual port: it checks the database
  connection you give it (and offers to create the database when the account may),
  creates the schema, creates the first administrator with the password you choose,
  names the instance, and writes the configuration for you — **secrets generated,
  comments of the shipped example preserved, previous file kept as `.bak`**. The
  instance then starts on the same port with no restart, and the wizard is gone.
  Configuring everything by hand still works and simply skips the wizard, which is
  what a Docker or CI deployment does.
- **The installation asks for a one-time token**, written to
  `/var/lib/kubuno/setup-token` and printed in the service log. Between the first
  boot and the end of the installation an instance has no accounts, and this is the
  one moment when whoever reaches the port could claim it: the token means claiming
  it requires access to the machine. It is deleted once the installation succeeds.
- Pointing the wizard at a database that already carries a Kubuno schema is
  supported and says so: the schema is reused rather than destroyed, and an
  administrator already recorded there is kept — which makes the wizard a way to
  rebuild a lost configuration file, not only to install.

### Fixed

- **`--config` / `KV_CONFIG_FILE` now does what the help says.** The option was
  parsed and then ignored, so an instance could not be run against a configuration
  file of its own — the system one was read regardless. It now replaces the default
  lookup, as a daemon's `-c` does.


- **Security policy and CI quality gate.** A `SECURITY.md` documents how to
  report vulnerabilities, and a CI workflow enforces `clippy -D warnings`, a
  dependency-vulnerability audit (`cargo audit`) and the frontend typecheck/tests.

- **HTTP/HTTPS can now be configured from the administration console** (System →
  Network). An administrator with no shell access can enable the core's native
  TLS termination, choose the HTTPS port, turn on an HTTP→HTTPS redirect, set the
  minimum TLS version (1.2 or 1.3) and tune HSTS (max-age, sub-domains, preload) —
  all as ordinary instance settings. TLS is still terminated by rustls; nothing
  about the TLS engine was reimplemented. rustls does not offer SSLv3 / TLS 1.0 /
  TLS 1.1 at all, so the instance can never negotiate a legacy protocol.
- **HTTP and HTTPS are served at the same time**, the way an ordinary web server
  does (`Listen 80` + `Listen 443`). Enabling HTTPS never takes the HTTP port
  away, so a reverse proxy, a health probe or anything else reaching the core in
  plain HTTP keeps working. An extra HTTP port (typically 80) can be opened
  alongside; if it cannot be bound — port 80 without `CAP_NET_BIND_SERVICE`, or a
  port another service holds — the instance still starts and says so in the log
  instead of failing.
- **Certificates can be deleted from the console**, with the history of retired
  ones listed next to the active certificate. Deleting the certificate HTTPS is
  currently serving is refused while HTTPS is enabled, rather than leaving the
  instance configured for TLS with nothing to serve.
- **Certificate management from the console.** Upload a PEM certificate chain and
  its private key from the Network page; the pair is validated (a mismatched or
  unusable key is refused with a clear message), its expiry and domains are shown,
  and the private key is stored encrypted at rest and never returned by the API.
  Replacing a certificate **destroys the previous private key** (its metadata is
  kept for the history): key material nobody can use any more is only a
  liability, and the history itself is bounded so renewals cannot grow the table
  without end.
  Replacing the certificate is applied **live, without dropping connections or
  restarting**, when HTTPS is already running (the path automatic ACME renewals
  will reuse). Enabling/disabling HTTPS or changing the port still requires a
  restart, and the panel says so.
- **Automatic certificates over ACME / Let's Encrypt.** Set the certificate mode
  to *automatic* on the Network page, enter a contact address and the domains,
  accept the authority's terms, and the core obtains a certificate on its own and
  installs it hot — then **renews it automatically** 30 days before expiry. Domain
  control is proved over HTTP-01 (the core answers `/.well-known/acme-challenge/…`
  on its HTTP listener), so each domain must resolve to the instance and be
  reachable on port 80. The directory URL is configurable (default Let's Encrypt
  production; point it at the staging directory to try it out). The ACME account
  key is stored encrypted at rest, every attempt (successful or not) is written
  to the administrative audit trail, and only one issuance runs at a time so a
  double click cannot burn the authority's rate limits. The directory URL must be
  `https` and may not name a loopback, link-local or private address, so the
  setting cannot turn the server into a request forwarder aimed at the
  infrastructure behind it. The protocol is handled by the audited `instant-acme`
  crate over rustls — no ACME or cryptography is reimplemented.

### Changed

- **Pill-shaped buttons are gone from the interface.** Filter chips, view
  segments, tab selectors and action buttons that were drawn as pills now use the
  same 4 px corner radius as every other button — the shape set them apart for no
  reason other than habit. Round buttons that hold a lone icon, avatars, status
  dots and non-clickable badges keep their shape: a circle around a single glyph
  is not a pill.

- **Secondary buttons get a firmer outline.** The `secondary` variant of `@ui`'s
  Button now draws its border from `--color-border-strong` (#bdc1c6) instead of
  the plain border token: a button is an actionable target and needs more
  definition than the hairlines that merely separate cards, rows and fields. No
  new grey was introduced — this reuses a step already in the scale, and cards,
  inputs, tables and separators are untouched.


- **Default typography retuned**: text renders at **weight 500** and in
  **#444** rather than 400/#202124, and the scale moves to half-pixel steps —
  micro 10.5, metadata 11.5, body 13.5, heading 15.5, title 21.5, page 22.5
  (27.5 in the administration console). Buttons follow the body weight: the rule
  that keeps a button from being BOLDER than running text should not make it
  lighter either.
- The text colour is changed **at the token**, in each `theme.css` and in the
  reference theme — not as a hard-coded `body { color }`. A theme is applied as
  inline custom properties on `<html>`, so a hard-coded colour (or an
  `!important` one) would have overridden every theme, starting with the dark
  one, whose text is deliberately light. Themes with their own identity (macOS,
  OneDrive, forest, dark) keep their own text colour.

- **Plus Jakarta Sans becomes the platform's typeface**, with Outfit kept
  available behind it. Both are variable fonts under the SIL Open Font License
  and both ship with the product; Plus Jakarta Sans additionally has a **drawn
  italic**, so emphasis is a real cut rather than a slant the browser fakes. The
  core serves both faces itself, so the sign-in page and the installation wizard
  never depend on a module being installed.
- **The type scale is retuned** to micro 11 px, metadata 12 px, body 14 px,
  heading 16 px, title 22 px and page 23 px (28 px in the administration
  console), with the `text-xs`/`text-sm` utility steps kept in step at 12 and
  14 px.

- **The `--kb-text-*` type scale is retuned**: micro 11→12 px, heading 16→17 px,
  title 22→23 px, page 22→24 px (29 px in the administration console). The body
  (15 px) and metadata (13 px) steps are unchanged. Only the core declares these
  tokens — modules read them from the host — so no module rebuild is needed.

- **The secondary text step goes from 12 px to 13 px**, alongside the body step
  above. Same two levers: the `--text-xs` Tailwind variable (the `text-xs` class
  carries metadata lines, table headers, hints and pills) and the
  `--kb-text-meta` token, plus the two hard-coded sizes in `FontPicker`'s search
  field and empty state. `--kb-text-micro` (11 px, counters and badges) is
  deliberately unchanged, and the font specimens in the picker keep their own
  size.

- **The body text step goes from 14 px to 15 px.** Four levers move together, and
  all four are needed: the `body` size (everything that inherits — dropdowns,
  menus, tooltips, most module markup), the `--text-sm` Tailwind variable (the
  `text-sm` class is the project's body class, used in ~570 files), the
  `--kb-text-body` token (sizes driven by token rather than by class), and the
  `fontSize` prop defaults of `Dropdown`, `FontPicker` and `FontSizeField`.
  `--text-sm` is overridden at `:root` with `!important` for the same reason the
  weight and family overrides are: every module bundle re-declares it and loads
  after the host, so nothing else reaches all 18 of them without a rebuild.
  Line height follows on its own (Tailwind derives it from the step), and the
  `fontSize: 14` values left in `MenuDropdown` and `Dropdown` are glyphs — a
  tick and an icon in a fixed-width span — not text.

- **The platform's typeface is now Outfit, shipped with the product.** The
  interface used Google's own product faces (Google Sans / Google Sans Text).
  Those are replaced everywhere by **Outfit**, under the SIL Open Font License —
  a licence that actually permits redistribution inside a product that is
  packaged and published. Outfit is a variable font: one 45 KB file covers the
  whole 100–900 weight range, where the previous stack needed five files, so the
  shell also loads less. The licence text ships beside it
  (`/fonts/Outfit-OFL.txt`), as the OFL requires.
- **The Content-Security-Policy no longer allows Google's font CDN.**
  `fonts.googleapis.com` and `fonts.gstatic.com` are out of `style-src` and
  `font-src`: the browser now refuses any such request instead of merely not
  making one. Loading fonts from that CDN hands every reader's IP address to a
  third party just by opening a page — the practice a German court found
  unlawful under the GDPR in 2022 — and a self-hosted instance has no business
  doing it.

- **HSTS is now emitted only on requests that actually arrived over TLS**, and
  its value (max-age, sub-domains, preload) follows the Network settings instead
  of being a fixed header on every response — including plain-HTTP ones, where a
  browser ignores it. Both ways of being reached over TLS count: this process
  terminating it, and a **reverse proxy** terminating it and saying so with
  `X-Forwarded-Proto`. As everywhere else in the core, that header is believed
  only when the socket peer is inside `server.trusted_proxy_cidrs`, so it cannot
  be forged into the header by a direct client.
- **HSTS is no longer announced for `localhost` or a loopback address.** A
  browser remembers HSTS per host, and `localhost` is shared by every project on
  a machine: one instance sending it there pinned `http://localhost:<any port>`
  to HTTPS for every other local server, with a certificate error and a manual
  purge as the only way back. Real domains are unaffected.
- **The HTTP→HTTPS redirect no longer redirects what must not be redirected.**
  A request a trusted reverse proxy reports as already encrypted
  (`X-Forwarded-Proto: https`) is served normally instead of being sent to HTTPS
  again — previously that turned an instance behind nginx into a redirect the
  visitor could not escape. The ACME challenge path is likewise always served in
  the clear, without which automatic renewal would break the moment redirection
  was switched on. The redirect target is also no longer taken from the request's
  `Host` header when the instance knows its own names (the certificate's SANs,
  the configured ACME domains): a forged `Host` gets the canonical name rather
  than turning the instance into an open redirector.
- An explicit `[server.tls]` section in `config.toml` keeps working and now takes
  precedence over the console; the Network page reports when file configuration is
  in effect.

### Security

- **The TLS private key and the ACME account key are no longer stored in the
  database.** They now live in files owned by the service and readable by nobody
  else (`0600` in a `0700` directory, under `/var/lib/kubuno/tls/` by default,
  overridable with `[server.tls] cert_path` / `key_path`) — the way Apache,
  nginx and certbot have always held this material. Encrypted-at-rest in a table
  was still the instance's identity sitting somewhere an administrative API
  reads, a `pg_dump` copies wholesale and a replica ships elsewhere; a TLS key
  lets whoever holds it *be* the instance and decrypt traffic recorded earlier,
  and the ACME key lets them mint new certificates for its domains. The columns
  are dropped, so nothing can write a secret back into them, and the database
  keeps only what the console displays (subject, SAN, validity, source). Doing
  this also removes a real failure mode: material sealed with the JWT secret
  became permanently unreadable the day that secret was rotated. **An instance
  that already held a certificate must re-import it** (or let ACME re-issue) —
  an SQL migration cannot move key material into a file. Each entry is linked
  to the previous one by an HMAC hash chain, keyed by a secret derived from the
  instance's internal secret and never stored in the database, so a row that is
  edited, reordered or removed from the middle of the trail no longer goes
  unnoticed. The table is also made append-only (only the undo back-links may be
  written after the fact). A new admin endpoint, `GET /api/v1/admin/audit/verify`,
  recomputes the chain and reports the first tampered entry, if any. (Detecting a
  wholesale truncation of the oldest rows requires anchoring the chain head
  outside the database — noted as follow-up.)
- **Sign-in is now throttled per account, persistently.** After 5 consecutive
  failures an account enters an exponential backoff (starting above one minute
  and doubling, capped at 15 minutes), with a daily attempt ceiling — state kept
  in the database so it survives a restart and is shared across instances, unlike
  the previous in-memory per-IP limit alone. A successful sign-in clears it, and a
  password reset always reopens the account, so this never becomes a lock-out an
  attacker can trigger against someone by guessing their address. Locked accounts
  get the same generic answer and the same response timing as a wrong password,
  so the throttle cannot be used to tell whether an account exists. Follows OWASP,
  NIST SP 800-63B and the ANSSI/CNIL recommendations.
- **The identity the core forwards to a module is now cryptographically signed.**
  Every proxied request (HTTP and WebSocket) carries a short-lived, module-scoped
  `X-Kubuno-Auth` token — HMAC-SHA256 over the caller's id, role and email, keyed
  by the target module's own internal secret and bound to that module as audience
  (new shared crate `kubuno-modauth`). A process reaching a module's loopback port
  directly can no longer forge `X-Kubuno-User-*` headers to impersonate a user
  (an administrator included), and a token minted for one module does not validate
  at another. The plain identity headers are still sent so modules can migrate to
  verification one at a time. The proxy also now strips any client-supplied
  identity headers on non-internal requests, closing a path where a forged header
  could reach a public module route unresolved.
- **Remote-mount credentials are now sealed with an HKDF-derived key.** The
  AES-256-GCM key for stored mount configurations is derived with HKDF-SHA256
  (RFC 5869) and a domain-separating label, replacing an ad-hoc
  `SHA-256(secret ‖ label)`. Configurations sealed before this change stay
  readable (the previous key is still accepted for decryption), so no reconnection
  is required.
- **A failed encryption of a remote-mount configuration is now reported instead
  of silently stored.** Sealing errors previously produced an empty, permanently
  undecryptable blob that only surfaced on the next browse; the save now fails
  cleanly and nothing is persisted.

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
  reveals "advanced" sub-fields (the "Name" / "Organisation" pattern of a
  contact form).
- **`PhoneField`** (`@ui`): a contact-book phone input — leading icon, a
  country dial-code selector (flag + searchable dropdown, 188 countries, flag
  derived from the ISO code, no external asset), the Material number field, and an
  optional editable "Libellé" combobox (free text + presets: Domicile, Professionnel,
  Mobile…).
- **`DateField`** (`@ui`): a split date field (Day / Month dropdown / optional Year)
  with a configurable icon (cake for a birthday, calendar for a date) and the same
  optional editable "Libellé" combobox. Plus a shared **`LabelCombobox`** primitive
  (the free-text-with-suggestions label used by the phone and date fields).
- **`AddressField`** (`@ui`): a contact-book postal-address block —
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

[Unreleased]: https://github.com/kubuno/core/compare/v0.1.12...HEAD
[0.1.12]: https://github.com/kubuno/core/releases/tag/v0.1.12
[0.1.11]: https://github.com/kubuno/core/releases/tag/v0.1.11
[0.1.10]: https://github.com/kubuno/core/releases/tag/v0.1.10
[0.1.9]: https://github.com/kubuno/core/releases/tag/v0.1.9
[0.1.8]: https://github.com/kubuno/core/releases/tag/v0.1.8
[0.1.7]: https://github.com/kubuno/core/releases/tag/v0.1.7
[0.1.6]: https://github.com/kubuno/core/releases/tag/v0.1.6
