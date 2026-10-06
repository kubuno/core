.PHONY: dev dev-front dev-back test lint migrate migrate-down fmt check setup build build-front deb clean

# ── Setup initial ────────────────────────────────────────
setup:
	cp -n server/config.toml.example config.toml || true
	@echo "→ Édite config.toml (url, jwt_secret, internal_secret), puis lance: make migrate && make dev"

# ── Développement ────────────────────────────────────────
dev:
	@$(MAKE) -j2 dev-back dev-front

dev-back:
	cargo watch -q -c -w server -w common -x 'run --manifest-path server/Cargo.toml --bin kubuno-core'

dev-front:
	cd frontend && npm run dev

# ── Build ────────────────────────────────────────────────
build:
	cd server && cargo build --release --bin kubuno-core

build-front:
	cd frontend && npm run build

# ── Paquet Debian ────────────────────────────────────────
deb: check
	./build_deb.sh

# ── Tests ────────────────────────────────────────────────
test:
	cd server && cargo test --workspace -- --test-threads=4
	cd common && cargo test --workspace

# ── Qualité de code ──────────────────────────────────────
lint:
	cd server && cargo clippy --workspace -- -D warnings
	cd common && cargo clippy --workspace -- -D warnings
	cd frontend && npx eslint src/

fmt:
	cd server && cargo fmt --all
	cd common && cargo fmt --all
	cd frontend && npx prettier --write src/

check:
	cd server && cargo check --workspace
	cd common && cargo check --workspace
	cd frontend && npx tsc --noEmit

# ── Base de données ──────────────────────────────────────
migrate:
	sqlx migrate run --source server/migrations

migrate-down:
	sqlx migrate revert --source server/migrations

migration:
	@read -p "Nom de la migration: " name; \
	sqlx migrate add --source server/migrations $$name

# ── Nettoyage ────────────────────────────────────────────
clean:
	cd server && cargo clean
	cd common && cargo clean
	rm -rf frontend/dist frontend/node_modules data/ *.deb
