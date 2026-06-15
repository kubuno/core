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

**Le cœur de Kubuno — une plateforme de stockage cloud self-hosted, libre (AGPLv3), alternative à Nextcloud/ownCloud.**

Le *core* est le « système d'exploitation » de la plateforme : il fournit les infrastructures (auth, base de données, événements, stockage, proxy, WebSocket, gestion des modules) dont les **modules indépendants** (files/drive, calendar, mail, photos, office, chat…) ont besoin pour fonctionner.

</div>

---

## ✨ Pourquoi Kubuno ?

- 🧩 **Architecture modulaire** — chaque module (drive, calendar, mail, office, photos…) est un **processus séparé** (Rust ou Python) qui se connecte au core au démarrage. Le core proxifie leurs routes, distribue les événements et gère leur cycle de vie.
- 🏠 **Vos données chez vous** — self-hosted de bout en bout, aucune dépendance à un service tiers.
- 🔐 **Sécurité par défaut** — JWT + refresh tokens HttpOnly, Argon2id, AES-256-GCM, durcissement anti-DDoS, bac à sable seccomp pour les modules.
- ⚡ **Rust + Axum + PostgreSQL** — un backend rapide et sobre ; PostgreSQL sert aussi de bus (`LISTEN/NOTIFY`) et de file de jobs (`SKIP LOCKED`).
- 🖥️ **Frontend modulaire à l'exécution** — le host React 19 charge les modules **au runtime** via des *import maps* ESM et des singletons partagés (`@kubuno/sdk`, `@ui`), sans jamais nommer un module en dur.
- 🌍 **i18n** — 13 langues, RTL inclus.

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────┐
│  Frontend host (React 19 / Vite)                         │
│  — shell, auth, registries, import map → @kubuno/sdk,@ui │
│  — charge /modules/<id>/entry.js au runtime              │
├──────────────────────────────────────────────────────────┤
│  Core (Rust / Axum)            ← CE DÉPÔT                 │
│  auth · events · storage · proxy · websocket · modules   │
│  PostgreSQL 16 (schéma `core`, LISTEN/NOTIFY, jobs)      │
├──────────────────────────────────────────────────────────┤
│  Modules (process séparés, dépôts dédiés)                │
│  drive · calendar · mail · photos · office · chat · …    │
└──────────────────────────────────────────────────────────┘
```

Ce dépôt contient :

| Composant | Chemin | Rôle |
|---|---|---|
| **kubuno-core** | `crates/kubuno-core` | Application serveur (bin `kubuno-core` + CLI `kubuno`) |
| **kubuno-storage** | `crates/kubuno-storage` | Abstraction de stockage (local / S3) — partagée |
| **kubuno-seccomp** | `crates/kubuno-seccomp` | Bac à sable d'exécution (seccomp) — partagé |
| **kubuno-mcp** | `crates/kubuno-mcp` | Briques du serveur MCP — partagé |
| **Frontend host** | `frontend/` | Shell React + libs partagées `@kubuno/sdk`, `@ui`, `@kubuno/drive` |
| **Migrations** | `migrations/` | Schéma PostgreSQL du core |

Les crates partagées sont consommées par les **dépôts modules** via dépendances git taguées ; les libs frontend partagées sont publiées sur npm sous le scope **`@kubuno/*`**.

## 🧩 Les modules

Chaque app vit dans son **propre dépôt** (`kubuno/<module>`) et produit son propre paquet :

| Module | Repo | Description |
|---|---|---|
| Drive | `kubuno/drive` | Stockage de fichiers, partages, montages distants |
| Calendar | `kubuno/calendar` | Calendriers, événements, CalDAV |
| Mail | `kubuno/mail` | Client e-mail (IMAP/SMTP) |
| Photos | `kubuno/photos` | Galerie photo |
| Office | `kubuno/office` | Suite bureautique (docs, tableur, présentations…) |
| Chat, Contacts, Notes, Tasks, Maps, Forms, Flow, Code, Media, KeeStore, PaintSharp, Jarvis | `kubuno/<id>` | … |

## 🛠️ Build & développement

**Prérequis** : Rust ≥ 1.82, Node.js ≥ 20, PostgreSQL 16.

```bash
# Backend (core)
cargo build --release --bin kubuno-core

# Frontend host
cd frontend && npm ci && npm run build

# Dev (back + front en parallèle)
make dev

# Paquet Debian du core
bash build_deb.sh        # → dist/kubuno-core_*.deb
```

Configuration : copier `config.toml.example` → `config.toml` (ou variables d'env préfixées `KV_`). Voir le détail dans [`CLAUDE.md`](CLAUDE.md).

## 📦 Stack technique

Rust 2021 · Axum 0.7 · Tokio · SQLx 0.8 (PostgreSQL) · jsonwebtoken · argon2 · aes-gcm — React 19 · TypeScript · Vite · Tailwind CSS v4 · Zustand · React Query.

## 🤝 Contribuer

Les contributions sont bienvenues. Ouvrez une *issue* pour discuter d'un changement important avant la *pull request*.

## 📄 Licence

[AGPL-3.0-or-later](LICENSE) © Kubuno contributors.
