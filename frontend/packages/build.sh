#!/usr/bin/env bash
# Regenerate the publishable @kubuno/* npm packages from the host frontend source.
#
#   @kubuno/ui    — real ESM library (dist/index.js) + types
#   @kubuno/sdk   — type surface (sdk/ + core/ .d.ts) + runtime stub
#   @kubuno/drive — type surface (drive/ .d.ts) + runtime stub
#
# At runtime these specifiers are provided by the host via its import map; module
# bundles mark them `external`. The packages exist so modules can build & typecheck
# standalone (npm), without a kubuno/core checkout next to them.
set -euo pipefail
cd "$(dirname "$0")/.."                     # → frontend/
FE="$(pwd)"
PKG="$FE/packages"

echo "==> 1/3  Emitting declarations (tsc -p tsconfig.emit.json)"
rm -rf "$FE/dist-types"
node_modules/.bin/tsc -p tsconfig.emit.json

echo "==> 2/3  Assembling type trees"
# @ui : autonomous, ships ui/ only
rm -rf "$PKG/ui/types";    mkdir -p "$PKG/ui/types";        cp -r "$FE"/dist-types/ui/*    "$PKG/ui/types/"
# @kubuno/sdk : sdk/ + core/ (sdk imports ../core)
rm -rf "$PKG/sdk/types";   mkdir -p "$PKG/sdk/types/sdk" "$PKG/sdk/types/core"
cp -r "$FE"/dist-types/sdk/*  "$PKG/sdk/types/sdk/"
cp -r "$FE"/dist-types/core/* "$PKG/sdk/types/core/"
# @kubuno/drive : drive/ only
rm -rf "$PKG/drive/types"; mkdir -p "$PKG/drive/types/drive"; cp -r "$FE"/dist-types/drive/* "$PKG/drive/types/drive/"

echo "==> 3/3  Building @kubuno/ui ESM bundle"
# ⚠️ The `cd` is load-bearing, not stylistic. Vite resolves `outDir` against the
# CURRENT WORKING DIRECTORY, not against the config file. Run from frontend/ as
#     npx vite build --config packages/ui/vite.config.ts
# and the library lands in `frontend/dist/` — where `emptyOutDir` first WIPES the
# host application build. Always build a package from inside the package.
( cd "$PKG/ui" && "$FE/node_modules/.bin/vite" build )

rm -rf "$FE/dist-types"
echo "==> done. Never publish by hand: use  bash _tools/publish_all.sh  (regenerates,"
echo "    runs the blocking consistency check, then publishes)."
