#!/usr/bin/env bash
# Build a Kubuno Core Windows distribution: an NSIS installer (.exe) that installs
# the server and registers it as a Windows service (via the WinSW wrapper).
#
# Cross-compiles from Linux using cargo-xwin (MSVC target). On a Windows host with
# the MSVC toolchain you can instead run: cargo build --release (native).
#
# Usage:
#   bash build_windows.sh                 # produce dist/kubuno-core-setup-<ver>-x64.exe
#   TARGET=x86_64-pc-windows-gnu bash build_windows.sh   # use the GNU toolchain instead
#
# Requirements on this (build) host: makensis (NSIS), curl, and either
# cargo-xwin (default) or the chosen Rust windows target. The frontend is built
# with npm if frontend/dist is missing.
#
# Service / data layout on the target machine:
#   C:\Program Files\Kubuno\        binaries, frontend, migrations, service wrapper
#   C:\ProgramData\Kubuno\          config.toml, files\, logs\   (writable, service CWD)
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"

VERSION=$(grep -m1 '^version' Cargo.toml | sed -E 's/.*"([^"]+)".*/\1/')
TARGET="${TARGET:-x86_64-pc-windows-msvc}"
DIST_DIR="${DIST_DIR:-dist}"
WINSW_VERSION="${WINSW_VERSION:-v2.12.0}"
WINSW_URL="https://github.com/winsw/winsw/releases/download/${WINSW_VERSION}/WinSW-x64.exe"
STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT
mkdir -p "$DIST_DIR"

command -v makensis >/dev/null || { echo "Erreur : makensis (NSIS) introuvable." >&2; exit 1; }

# ── Frontend ────────────────────────────────────────────────────────────────
if [[ ! -d frontend/dist ]]; then
  echo "==> Build frontend…"
  (cd frontend && npm ci && npm run build)
fi

# ── Compilation Rust (cross Windows depuis Linux, OU natif sur Windows) ──────
echo "==> Compilation Rust → ${TARGET}…"
rustup target add "$TARGET" >/dev/null 2>&1 || true
# Hôte Windows (runner CI, Git Bash/MSYS) → build natif. Sinon → cross via xwin.
case "$(uname -s)" in
  MINGW*|MSYS*|CYGWIN*|*NT*) HOST_IS_WINDOWS=1 ;;
  *) HOST_IS_WINDOWS=0 ;;
esac
if [[ "$TARGET" == *"-msvc" && "$HOST_IS_WINDOWS" == "0" ]]; then
  if ! command -v cargo-xwin >/dev/null && ! cargo xwin --help >/dev/null 2>&1; then
    echo "Erreur : cargo-xwin requis pour cross-compiler la cible MSVC depuis Linux." >&2
    echo "        Installez-le (cargo install cargo-xwin) ou utilisez TARGET=x86_64-pc-windows-gnu." >&2
    exit 1
  fi
  SQLX_OFFLINE=true cargo xwin build --release --target "$TARGET" \
    --bin kubuno-core --bin kubuno
else
  SQLX_OFFLINE=true cargo build --release --target "$TARGET" \
    --bin kubuno-core --bin kubuno
fi

BIN_DIR="target/${TARGET}/release"
[[ -f "$BIN_DIR/kubuno-core.exe" ]] || { echo "Erreur : kubuno-core.exe non produit." >&2; exit 1; }

# ── Récupération du wrapper de service WinSW ────────────────────────────────
echo "==> Récupération de WinSW ${WINSW_VERSION}…"
if [[ -f "_cache/WinSW-x64.exe" ]]; then
  cp _cache/WinSW-x64.exe "$STAGE/kubuno-service.exe"
else
  curl -fsSL "$WINSW_URL" -o "$STAGE/kubuno-service.exe"
  mkdir -p _cache && cp "$STAGE/kubuno-service.exe" _cache/WinSW-x64.exe
fi

# ── Staging des fichiers ────────────────────────────────────────────────────
echo "==> Staging…"
install -m 755 "$BIN_DIR/kubuno-core.exe" "$STAGE/kubuno-core.exe"
install -m 755 "$BIN_DIR/kubuno.exe"      "$STAGE/kubuno.exe"
cp -r frontend/dist   "$STAGE/frontend"
cp -r migrations      "$STAGE/migrations"
cp -r themes          "$STAGE/themes"
cp LICENSE            "$STAGE/LICENSE.txt"
cp README.md          "$STAGE/README.txt" 2>/dev/null || echo "Kubuno Core" > "$STAGE/README.txt"

# ── Script NSIS ─────────────────────────────────────────────────────────────
# Le config.toml et le XML du service sont écrits À L'INSTALLATION avec les vrais
# chemins ($INSTDIR / $APPDATA en contexte machine = C:\ProgramData), puis le
# service WinSW est installé et démarré.
cat > "$STAGE/installer.nsi" << NSI
Unicode true
!include "MUI2.nsh"
!include "LogicLib.nsh"

!define APPNAME "Kubuno Core"
!define COMPANY "Kubuno"
!define VERSION "${VERSION}"

Name "\${APPNAME} \${VERSION}"
OutFile "kubuno-core-setup-${VERSION}-x64.exe"
InstallDir "\$PROGRAMFILES64\\Kubuno"
RequestExecutionLevel admin
ShowInstDetails show
ShowUnInstDetails show

!define MUI_ABORTWARNING
!insertmacro MUI_PAGE_LICENSE "LICENSE.txt"
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!define MUI_FINISHPAGE_TEXT "Kubuno Core est installé et le service Windows « Kubuno Core » est démarré.\$\r\$\n\$\r\$\nPré-requis : un serveur PostgreSQL 16 accessible. Éditez C:\\ProgramData\\Kubuno\\config.toml (base de données, jwt_secret, internal_secret) puis redémarrez le service."
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "French"
!insertmacro MUI_LANGUAGE "English"

Section "Install"
  SetShellVarContext all          ; \$APPDATA = C:\\ProgramData
  SetOutPath "\$INSTDIR"

  ; Arrête un service existant avant d'écraser les binaires (mise à jour)
  IfFileExists "\$INSTDIR\\kubuno-service.exe" 0 +2
    nsExec::ExecToLog '"\$INSTDIR\\kubuno-service.exe" stop'

  File "kubuno-core.exe"
  File "kubuno.exe"
  File "kubuno-service.exe"
  File "LICENSE.txt"
  File "README.txt"
  File /r "frontend"
  File /r "migrations"
  File /r "themes"
  CreateDirectory "\$INSTDIR\\modules"   ; emplacement des modules ajoutés ultérieurement

  ; Répertoire de données inscriptible (config + fichiers + logs)
  CreateDirectory "\$APPDATA\\Kubuno"

  ; Sème/rafraîchit les thèmes livrés dans le répertoire de données inscriptible
  ; (themes_dir = \$APPDATA\\Kubuno\\themes). Les thèmes importés par l'admin (autres
  ; IDs) ne sont pas écrasés ; CopyFiles fusionne.
  CreateDirectory "\$APPDATA\\Kubuno\\themes"
  CopyFiles /SILENT "\$INSTDIR\\themes\\*.*" "\$APPDATA\\Kubuno\\themes"
  CreateDirectory "\$APPDATA\\Kubuno\\files"
  CreateDirectory "\$APPDATA\\Kubuno\\logs"
  CreateDirectory "\$APPDATA\\Kubuno\\modules-config"   ; configs des modules (CWD module)
  CreateDirectory "\$APPDATA\\Kubuno\\modules-data"     ; données des modules

  ; XML du service WinSW (basename = kubuno-service → kubuno-service.xml)
  FileOpen \$0 "\$INSTDIR\\kubuno-service.xml" w
  FileWrite \$0 '<service>\$\r\$\n'
  FileWrite \$0 '  <id>kubuno</id>\$\r\$\n'
  FileWrite \$0 '  <name>Kubuno Core</name>\$\r\$\n'
  FileWrite \$0 '  <description>Kubuno - plateforme cloud self-hosted</description>\$\r\$\n'
  FileWrite \$0 '  <executable>\$INSTDIR\\kubuno-core.exe</executable>\$\r\$\n'
  FileWrite \$0 '  <workingdirectory>\$APPDATA\\Kubuno</workingdirectory>\$\r\$\n'
  FileWrite \$0 '  <env name="KV__SERVER__FRONTEND_DIST" value="\$INSTDIR\\frontend" />\$\r\$\n'
  FileWrite \$0 '  <env name="KV__SERVER__MODULES_CONFIG_DIR" value="\$APPDATA\\Kubuno\\modules-config" />\$\r\$\n'
  FileWrite \$0 '  <env name="KV__SERVER__MODULES_DATA_DIR" value="\$APPDATA\\Kubuno\\modules-data" />\$\r\$\n'
  FileWrite \$0 '  <onfailure action="restart" delay="3 sec" />\$\r\$\n'
  FileWrite \$0 '  <log mode="roll-by-size"><sizeThreshold>10240</sizeThreshold><keepFiles>8</keepFiles></log>\$\r\$\n'
  FileWrite \$0 '  <logpath>\$APPDATA\\Kubuno\\logs</logpath>\$\r\$\n'
  FileWrite \$0 '</service>\$\r\$\n'
  FileClose \$0

  ; config.toml (ne pas écraser une config existante)
  IfFileExists "\$APPDATA\\Kubuno\\config.toml" config_done 0
  FileOpen \$0 "\$APPDATA\\Kubuno\\config.toml" w
  FileWrite \$0 '[server]\$\r\$\n'
  FileWrite \$0 'host = "0.0.0.0"\$\r\$\n'
  FileWrite \$0 'port = 8080\$\r\$\n'
  FileWrite \$0 'frontend_dist = "\$INSTDIR\\frontend"\$\r\$\n'
  FileWrite \$0 'modules_dir = "\$INSTDIR\\modules"\$\r\$\n'
  FileWrite \$0 'themes_dir = "\$APPDATA\\Kubuno\\themes"\$\r\$\n'
  FileWrite \$0 'internal_secret = "CHANGEZ_MOI"\$\r\$\n'
  FileWrite \$0 'secure_cookies = false\$\r\$\n'
  FileWrite \$0 '\$\r\$\n[database]\$\r\$\n'
  FileWrite \$0 'host = "localhost"\$\r\$\n'
  FileWrite \$0 'port = 5432\$\r\$\n'
  FileWrite \$0 'user = "kubuno"\$\r\$\n'
  FileWrite \$0 'password = "CHANGEZ_MOI"\$\r\$\n'
  FileWrite \$0 'database = "kubuno"\$\r\$\n'
  FileWrite \$0 'run_migrations = true\$\r\$\n'
  FileWrite \$0 '\$\r\$\n[auth]\$\r\$\n'
  FileWrite \$0 'jwt_secret = "CHANGEZ_MOI_AVEC_UNE_CLE_LONGUE_ET_ALEATOIRE"\$\r\$\n'
  FileWrite \$0 '\$\r\$\n[storage]\$\r\$\n'
  FileWrite \$0 'backend = "local"\$\r\$\n'
  FileWrite \$0 'local_path = "\$APPDATA\\Kubuno\\files"\$\r\$\n'
  FileWrite \$0 '\$\r\$\n[logging]\$\r\$\n'
  FileWrite \$0 'level = "info"\$\r\$\n'
  FileWrite \$0 'format = "json"\$\r\$\n'
  FileWrite \$0 'log_dir = "\$APPDATA\\Kubuno\\logs"\$\r\$\n'
  FileWrite \$0 'file_enabled = true\$\r\$\n'
  FileClose \$0
config_done:

  ; Enregistre + démarre le service
  nsExec::ExecToLog '"\$INSTDIR\\kubuno-service.exe" install'
  nsExec::ExecToLog '"\$INSTDIR\\kubuno-service.exe" start'

  ; Désinstalleur + entrée Programmes et fonctionnalités
  WriteUninstaller "\$INSTDIR\\uninstall.exe"
  WriteRegStr HKLM "Software\\Kubuno" "InstallLocation" "\$INSTDIR"
  WriteRegStr HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Kubuno" "DisplayName" "\${APPNAME}"
  WriteRegStr HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Kubuno" "InstallLocation" "\$INSTDIR"
  WriteRegStr HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Kubuno" "DisplayVersion" "\${VERSION}"
  WriteRegStr HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Kubuno" "Publisher" "\${COMPANY}"
  WriteRegStr HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Kubuno" "UninstallString" '"\$INSTDIR\\uninstall.exe"'
SectionEnd

Section "Uninstall"
  SetShellVarContext all
  nsExec::ExecToLog '"\$INSTDIR\\kubuno-service.exe" stop'
  nsExec::ExecToLog '"\$INSTDIR\\kubuno-service.exe" uninstall'
  Delete "\$INSTDIR\\kubuno-core.exe"
  Delete "\$INSTDIR\\kubuno.exe"
  Delete "\$INSTDIR\\kubuno-service.exe"
  Delete "\$INSTDIR\\kubuno-service.xml"
  Delete "\$INSTDIR\\kubuno-service.out.log"
  Delete "\$INSTDIR\\kubuno-service.err.log"
  Delete "\$INSTDIR\\kubuno-service.wrapper.log"
  Delete "\$INSTDIR\\LICENSE.txt"
  Delete "\$INSTDIR\\README.txt"
  Delete "\$INSTDIR\\uninstall.exe"
  RMDir /r "\$INSTDIR\\frontend"
  RMDir /r "\$INSTDIR\\migrations"
  RMDir /r "\$INSTDIR\\themes"
  RMDir "\$INSTDIR"
  DeleteRegKey HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Kubuno"
  ; Les données (\$APPDATA\\Kubuno) sont CONSERVÉES volontairement.
SectionEnd
NSI

# ── Construction de l'installeur ────────────────────────────────────────────
echo "==> makensis…"
( cd "$STAGE" && makensis -V2 installer.nsi )

OUT="$DIST_DIR/kubuno-core-setup-${VERSION}-x64.exe"
cp "$STAGE/kubuno-core-setup-${VERSION}-x64.exe" "$OUT"

echo ""
echo "══════════════════════════════════════════════"
echo "  Installeur Windows : $OUT"
echo "══════════════════════════════════════════════"
