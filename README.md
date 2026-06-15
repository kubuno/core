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
- 🏠 **Your data, your rules** — fully self-hosted, no third-party service required.
- 🔐 **Secure by default** — JWT + HttpOnly refresh tokens, Argon2id, AES-256-GCM, anti-DDoS hardening, seccomp sandbox for modules.
- ⚡ **Rust + Axum + PostgreSQL** — a fast, lean backend; PostgreSQL also serves as the event bus (`LISTEN/NOTIFY`) and job queue (`SKIP LOCKED`).
- 🖥️ **Runtime-loaded frontend** — the React 19 host loads modules **at runtime** via ESM import maps and shared singletons (`@kubuno/sdk`, `@ui`), without ever naming a module statically.
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
| Chat, Contacts, Notes, Tasks, Maps, Forms, Flow, Code, Media, KeeStore, PaintSharp, Jarvis | `kubuno/<id>` | … |

## 🛠️ Build & development

**Requirements:** Rust ≥ 1.82, Node.js ≥ 20, PostgreSQL 16.

```bash
# Backend (core)
cargo build --release --bin kubuno-core

# Frontend host
cd frontend && npm ci && npm run build

# Dev (backend + frontend together)
make dev

# Debian package for the core
bash build_deb.sh        # → dist/kubuno-core_*.deb
```

Configuration: copy `config.toml.example` → `config.toml` (or use `KV_`-prefixed env vars). See [`CLAUDE.md`](CLAUDE.md) for details.

## 📦 Tech stack

Rust 2021 · Axum 0.7 · Tokio · SQLx 0.8 (PostgreSQL) · jsonwebtoken · argon2 · aes-gcm — React 19 · TypeScript · Vite · Tailwind CSS v4 · Zustand · React Query.

## 🤝 Contributing

Contributions are welcome. Please open an issue to discuss any significant change before submitting a pull request.

## 📄 License

[AGPL-3.0-or-later](LICENSE) © Kubuno contributors.
