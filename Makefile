.PHONY: dev dev-front dev-back test lint migrate migrate-down fmt check setup build build-front deb clean

# ── Setup initial ────────────────────────────────────────
setup:
	cp -n config.toml.example config.toml || true
	@echo "→ Édite config.toml (url, jwt_secret, internal_secret), puis lance: make migrate && make dev"

# ── Développement ────────────────────────────────────────
dev:
	@$(MAKE) -j2 dev-back dev-front

dev-back:
	cargo watch -q -c -x 'run --bin kubuno-core'

dev-front:
	cd frontend && npm run dev

# ── Build ────────────────────────────────────────────────
build:
	cargo build --release --bin kubuno-core

build-front:
	cd frontend && npm run build

# ── Paquet Debian ────────────────────────────────────────
deb: check
	./build_deb.sh

# ── Tests ────────────────────────────────────────────────
test:
	cargo test --workspace -- --test-threads=4

# ── Qualité de code ──────────────────────────────────────
lint:
	cargo clippy --workspace -- -D warnings
	cd frontend && npx eslint src/

fmt:
	cargo fmt --all
	cd frontend && npx prettier --write src/

check:
	cargo check --workspace
	cd frontend && npx tsc --noEmit

# ── Base de données ──────────────────────────────────────
migrate:
	sqlx migrate run --source migrations

migrate-down:
	sqlx migrate revert --source migrations

migration:
	@read -p "Nom de la migration: " name; \
	sqlx migrate add --source migrations $$name

# ── Nettoyage ────────────────────────────────────────────
clean:
	cargo clean
	rm -rf frontend/dist frontend/node_modules data/ *.deb
