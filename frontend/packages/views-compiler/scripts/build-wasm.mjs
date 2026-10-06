#!/usr/bin/env node
// Rebuilds wasm/kubuno-views-web.wasm, the WebAssembly build of the web `.kbview` compiler.
//
//   node scripts/build-wasm.mjs                       # the released compiler: git tag of wasm/Cargo.toml
//   node scripts/build-wasm.mjs --desktop <checkout>  # a local checkout instead (development): the core repository
//                                                     # (its desktop/), its desktop/ folder, or a former
//                                                     # kubuno/desktop checkout
//   node scripts/build-wasm.mjs --local               # this repository's own desktop/ (development)
//   KUBUNO_DESKTOP_DIR=<checkout> node scripts/build-wasm.mjs
//
// Needs Rust with the `wasm32-unknown-unknown` target (`rustup target add wasm32-unknown-unknown`); works the
// same on Linux, Windows and macOS. Module builds never run this: the package ships the built `.wasm`.
//
// The local override builds a copy of the crate whose `kubuno-views-web` dependency is a path instead of the
// git tag (Cargo's [patch] cannot replace a git dependency whose tag does not exist yet). The cargo target dir
// is KUBUNO_WASM_TARGET_DIR, else CARGO_TARGET_DIR, else wasm/target (git-ignored).
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const pkg = resolve(here, '..')
const crate = join(pkg, 'wasm')
const args = process.argv.slice(2)
const flag = (name) => {
  const i = args.indexOf(name)
  return i >= 0 ? args[i + 1] : undefined
}
// The core repository holding this package: web/packages/views-compiler (frontend/packages/views-compiler before the
// move) → three levels up.
const coreRoot = resolve(pkg, '..', '..', '..')
const desktopArg = args.includes('--local') ? coreRoot : (flag('--desktop') ?? process.env.KUBUNO_DESKTOP_DIR)
// Where the compiler's crates are in a checkout: the core's desktop/common (2026-10), a desktop folder's common/, or
// the former kubuno/desktop repository's windows/src/crates.
function crateDirs(checkout) {
  const candidates = [
    join(checkout, 'desktop', 'common'),
    join(checkout, 'common'),
    join(checkout, 'windows', 'src', 'crates'),
  ]
  return candidates.find((dir) => existsSync(join(dir, 'kubuno-web-views-compiler-core', 'Cargo.toml')) || existsSync(join(dir, 'kubuno-views-web', 'Cargo.toml')))
}
const desktop = desktopArg ? resolve(desktopArg) : undefined
const targetDir = resolve(process.env.KUBUNO_WASM_TARGET_DIR ?? process.env.CARGO_TARGET_DIR ?? join(crate, 'target'))
const toml = (p) => p.split('\\').join('/')

let manifestDir = crate
let source = 'git tag (wasm/Cargo.toml)'
if (desktop) {
  // The crate was renamed kubuno-web-views-compiler-core (2026-10-03); an older checkout still has kubuno-views-web.
  const crates = crateDirs(desktop) ?? join(desktop, 'desktop', 'common')
  const renamed = join(crates, 'kubuno-web-views-compiler-core')
  const webCrate = existsSync(join(renamed, 'Cargo.toml')) ? renamed : join(crates, 'kubuno-views-web')
  const webPackage = webCrate === renamed ? 'kubuno-web-views-compiler-core' : 'kubuno-views-web'
  if (!existsSync(join(webCrate, 'Cargo.toml'))) {
    console.error(`build-wasm: ${webCrate} has no Cargo.toml (expected a core or former kubuno/desktop checkout)`)
    process.exit(2)
  }
  manifestDir = join(targetDir, 'override-src')
  rmSync(manifestDir, { recursive: true, force: true })
  mkdirSync(manifestDir, { recursive: true })
  cpSync(join(crate, 'src'), join(manifestDir, 'src'), { recursive: true })
  const manifest = readFileSync(join(crate, 'Cargo.toml'), 'utf8').replace(
    /^kubuno-views-web\s*=.*$/m,
    `kubuno-views-web = { package = "${webPackage}", path = "${toml(webCrate)}" }`,
  ).replace(
    // The `.kbres` model (WV-6) comes from the same checkout.
    /^kubuno-resources-model\s*=.*$/m,
    `kubuno-resources-model = { package = "kubuno-desktop-resources-model", path = "${toml(join(crates, 'kubuno-desktop-resources-model'))}" }`,
  )
  writeFileSync(join(manifestDir, 'Cargo.toml'), manifest)
  source = `local checkout ${toml(webCrate)}`
}

const run = (cmd, argv, opts = {}) => execFileSync(cmd, argv, { stdio: 'inherit', ...opts })
console.log(`build-wasm: compiling kubuno-views-web from ${source}`)
run('cargo', [
  'build', '--release', '--target', 'wasm32-unknown-unknown',
  '--manifest-path', join(manifestDir, 'Cargo.toml'),
  '--target-dir', targetDir,
])
const built = join(targetDir, 'wasm32-unknown-unknown', 'release', 'kubuno_views_compiler_wasm.wasm')
const out = join(crate, 'kubuno-views-web.wasm')
cpSync(built, out)

// Optional size pass when Binaryen's wasm-opt is installed (not required).
try {
  execFileSync('wasm-opt', ['--version'], { stdio: 'ignore' })
  run('wasm-opt', ['-Os', '--enable-bulk-memory', '--enable-nontrapping-float-to-int', '--enable-sign-ext', out, '-o', out])
} catch {
  console.log('build-wasm: wasm-opt not found, skipping the optional size pass')
}

const bytes = readFileSync(out)
const rustc = execFileSync('rustc', ['--version'], { encoding: 'utf8' }).trim()
const cargoToml = readFileSync(join(crate, 'Cargo.toml'), 'utf8')
const tag = /tag\s*=\s*"([^"]+)"/.exec(cargoToml)?.[1] ?? null
const info = {
  compiler: 'kubuno-views-web',
  tag,
  built_from: desktop ? 'local checkout' : 'git tag',
  rustc,
  bytes: bytes.length,
  sha256: createHash('sha256').update(bytes).digest('hex'),
}
writeFileSync(join(crate, 'BUILD-INFO.json'), JSON.stringify(info, null, 2) + '\n')
console.log(`build-wasm: wrote ${out} (${bytes.length} bytes)`)
