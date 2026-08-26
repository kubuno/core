# Changelog

All notable changes to **kubuno-core** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this
project adheres to [Semantic Versioning](https://semver.org/). Entries are added under
`[Unreleased]` **as the change is made**; `_tools/release.sh` stamps them under the version
number at release time, and CI publishes that section as the GitHub Release notes.

## [Unreleased]

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

[Unreleased]: https://github.com/kubuno/core/compare/v0.1.9...HEAD
[0.1.9]: https://github.com/kubuno/core/releases/tag/v0.1.9
[0.1.8]: https://github.com/kubuno/core/releases/tag/v0.1.8
[0.1.7]: https://github.com/kubuno/core/releases/tag/v0.1.7
[0.1.6]: https://github.com/kubuno/core/releases/tag/v0.1.6
