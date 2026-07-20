<!--
  SPDX-FileCopyrightText: 2026 Kubuno contributors
  SPDX-License-Identifier: AGPL-3.0-or-later
-->

<div align="center">

# Kubuno — Core

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](LICENSE)
![Rust](https://img.shields.io/badge/Rust-edition_2021-orange.svg)
![React](https://img.shields.io/badge/React-19-61dafb.svg)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791.svg)
![Status](https://img.shields.io/badge/status-alpha-yellow.svg)

**The heart of Kubuno — a self-hosted, libre (AGPLv3) cloud platform, a sovereign alternative to Google Workspace and Microsoft 365.**

The *core* is the platform's "operating system": it provides the infrastructure (auth, database, events, storage, reverse proxy, WebSocket, module lifecycle) that **independent modules** (drive, calendar, mail, photos, office, chat…) rely on to run.

</div>

---

## ✨ Why Kubuno?

- 🧩 **Modular architecture** — each module (drive, calendar, mail, office, photos…) is a **separate process** (Rust or Python) that connects to the core at startup. The core proxies its routes, distributes events and manages its lifecycle.
- 🛒 **Built-in marketplace** — browse the official catalog and install new modules **at runtime** from the admin console: the core downloads the release, unpacks it into its writable module store and starts it hot, no restart and no shell access required.
- 🏠 **Your data, your rules** — fully self-hosted, no third-party service required.
- 🔐 **Secure by default** — JWT + HttpOnly refresh tokens with rotation (including a crash-recovery grace for native clients), Argon2id, AES-256-GCM, anti-DDoS hardening with per-IP *and* per-authenticated-user rate budgets, seccomp sandbox for modules.
- ⚡ **Rust + Axum + PostgreSQL** — a fast, lean backend; PostgreSQL also serves as the event bus (`LISTEN/NOTIFY`) and job queue (`SKIP LOCKED`).
- 🖥️ **Runtime-loaded frontend** — the React 19 host loads modules **at runtime** via ESM import maps and shared singletons (`@kubuno/sdk`, `@ui`), without ever naming a module statically.
- 🎨 **Packaged themes (skins)** — themes are importable `.zip` bundles that can restyle the whole platform or targeted modules with CSS variables, stylesheets and (admin-trusted) scripts; several polished themes ship with the core. See [`THEMES.md`](THEMES.md).
- 🏷️ **Cross-module labels** — user-owned labels that attach to items of *any* module (files, tasks, events…), with rich cross-module previews and sharing to users or groups.
- 🌍 **i18n** — 13 languages, RTL included.

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────┐
│  Frontend host (React 19 / Vite)                         │
│  — shell, auth, registries, import map → @kubuno/sdk,@ui │
│  — loads /modules/<id>/entry.js at runtime               │
├──────────────────────────────────────────────────────────┤
│  Core (Rust / Axum)            ← THIS REPO               │
│  auth · events · storage · proxy · websocket · modules   │
│  PostgreSQL 16 (schema `core`, LISTEN/NOTIFY, jobs)      │
├──────────────────────────────────────────────────────────┤
│  Modules (separate processes, dedicated repos)           │
│  drive · calendar · mail · photos · office · chat · …    │
└──────────────────────────────────────────────────────────┘
```

This repository contains:

| Component | Path | Role |
|---|---|---|
| **kubuno-core** | `crates/kubuno-core` | Server application (bin `kubuno-core` + CLI `kubuno`) |
| **kubuno-storage** | `crates/kubuno-storage` | Storage abstraction (local / S3) — shared |
| **kubuno-seccomp** | `crates/kubuno-seccomp` | Execution sandbox (seccomp) — shared |
| **kubuno-mcp** | `crates/kubuno-mcp` | MCP server building blocks — shared |
| **Frontend host** | `frontend/` | React shell + shared libs `@kubuno/sdk`, `@ui`, `@kubuno/drive` |
| **Migrations** | `migrations/` | Core PostgreSQL schema |
| **Themes** | `themes/` | Skin themes shipped with the platform (see [`THEMES.md`](THEMES.md)) |

Shared crates are consumed by the **module repos** via tagged git dependencies; the shared frontend libraries are published to npm under the **`@kubuno/*`** scope.

## 🧩 Modules

Each app lives in its **own repository** (`kubuno/<module>`) and ships its own package:

| Module | Repo | Description |
|---|---|---|
| Drive | `kubuno/drive` | File storage, sharing, remote mounts |
| Calendar | `kubuno/calendar` | Calendars, events, CalDAV |
| Mail | `kubuno/mail` | Email client (IMAP/SMTP) |
| Photos | `kubuno/photos` | Photo gallery |
| Office | `kubuno/office` | Office suite (docs, sheets, slides…) |
| Forum | `kubuno/forum` | Discussion boards (categories, forums, topics, posts) |
| Chat, Contacts, Notes, Tasks, Maps, Forms, Flow, Code, Media, KeeStore, PaintSharp, Jarvis | `kubuno/<id>` | … |

## 🐳 Install with Docker

The fastest way to self-host Kubuno (core + all modules) is the all-in-one Docker image, published as `ghcr.io/kubuno/kubuno`:

```bash
git clone https://github.com/kubuno/docker && cd docker
cp .env.docker.example .env     # set POSTGRES_PASSWORD, KUBUNO_JWT_SECRET, KUBUNO_INTERNAL_SECRET
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
# → http://localhost:8080   (default admin: admin / kubuno — change it!)
```

Prefer building the image yourself? Run `docker compose up --build`. The full guide,
configuration, module selection and CI live in **[kubuno/docker](https://github.com/kubuno/docker)**.

## 📥 Native packages (Linux · Windows · macOS)

The core also ships as **native packages**, each installing the server, the frontend host, the SQL migrations, the bundled themes, and registering Kubuno as a managed system service:

| Platform | Format | Script | Service |
|---|---|---|---|
| Debian / Ubuntu | `.deb` | `build_deb.sh` | systemd |
| Fedora / RHEL / openSUSE | `.rpm` | `build_rpm.sh` | systemd |
| Windows 10/11 / Server | `.exe` (NSIS installer) | `build_windows.sh` | Windows service (WinSW) |
| macOS (Apple Silicon) | `.pkg` | `build_macos.sh` | launchd |

Tagged releases (`v*`) attach all of them to the corresponding **GitHub Release** via CI (`build.yml` for the `.deb`, `dist.yml` for RPM/Windows/macOS). The only runtime prerequisite is a reachable **PostgreSQL 16** (not embedded). Full details, layouts and per-platform notes: **[`PACKAGING.md`](PACKAGING.md)** — including the generic packaging scheme modules follow so they install into the core on every platform.

## 🛠️ Build & development

**Requirements:** Rust ≥ 1.82, Node.js ≥ 24, PostgreSQL 16.

```bash
# Backend (core)
cargo build --release --bin kubuno-core

# Frontend host
cd frontend && npm ci && npm run build

# Dev (backend + frontend together)
make dev

# Debian package for the core
bash build_deb.sh        # → dist/kubuno-core_*.deb

# Other native packages (see PACKAGING.md)
bash build_rpm.sh        # → dist/kubuno-core-*.rpm
bash build_windows.sh    # → dist/kubuno-core-setup-*.exe   (cross-build, NSIS)
bash build_macos.sh      # → dist/kubuno-core-*.pkg         (on a Mac)
```

Configuration: copy `config.toml.example` → `config.toml` (or use `KV_`-prefixed env vars). See [`CLAUDE.md`](CLAUDE.md) for details.

## 📦 Tech stack

Rust 2021 · Axum 0.7 · Tokio · SQLx 0.8 (PostgreSQL) · jsonwebtoken · argon2 · aes-gcm — React 19 · TypeScript · Vite · Tailwind CSS v4 · Zustand · React Query.

## 🤝 Contributing

Contributions are welcome. Please open an issue to discuss any significant change before submitting a pull request.

## 📄 License

[AGPL-3.0-or-later](LICENSE) © Kubuno contributors.
