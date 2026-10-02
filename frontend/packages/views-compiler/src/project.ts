/**
 * A web project that uses `.kbview` views, seen from Node: where its views, user controls, registries and
 * generated files are, and a compiler loaded with its registries. Shared by the Vite plugin and
 * `kbview-tsc`. Paths are handled with `node:path` and normalised to `/` in everything the compiler sees,
 * so the same project builds identically on Linux, Windows and macOS.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, isAbsolute, join, posix, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

import { CompilerWasm, ViewCompiler } from './compiler.js'
import type { CompileOutput, UserControlRef } from './types.js'

/** View file extensions (VIEWS-SPEC §1.1). */
export const VIEW_EXTENSIONS = ['.kbview', '.kbcontrol'] as const

/** Where generated declarations and check files go, under the project root (git-ignored). */
export const GENERATED_DIR = '.kubuno/views'

/** Folders never scanned for views. */
const SKIP_DIRS = new Set(['node_modules', '.kubuno', '.git', 'dist', 'obj', 'bin', 'target', 'coverage'])

export function isViewFile(file: string): boolean {
  const lower = file.toLowerCase()
  return VIEW_EXTENSIONS.some((ext) => lower.endsWith(ext))
}

/** `a\b` → `a/b`. */
export function toPosix(p: string): string {
  return p.split(sep).join('/')
}

/** The project-root-relative, `/`-separated path of `file`. */
export function projectPath(root: string, file: string): string {
  return toPosix(relative(root, file))
}

/** The same-stem code-behind of a view (`X.ts`, else `X.tsx`), if any. */
export function codeBehindOf(viewFile: string): string | null {
  const base = viewFile.replace(/\.(kbview|kbcontrol)$/i, '')
  for (const ext of ['.ts', '.tsx']) {
    if (existsSync(base + ext)) return base + ext
  }
  return null
}

/** The view a code-behind belongs to (`X.ts` → `X.kbview` / `X.kbcontrol`), if any. */
export function viewOfCodeBehind(file: string): string | null {
  const m = /^(.*)\.(ts|tsx)$/.exec(file)
  if (!m || /\.d\.ts$/.test(file)) return null
  for (const ext of VIEW_EXTENSIONS) {
    if (existsSync(m[1] + ext)) return m[1] + ext
  }
  return null
}

/** The stem of a view file (`NotesSettingsPage`). */
export function viewStem(file: string): string {
  const name = file.split(/[\\/]/).pop() ?? file
  return name.replace(/\.(kbview|kbcontrol)$/i, '')
}

/** Every view under `dirs` (relative to `root`), sorted. */
export function scanViews(root: string, dirs: readonly string[] = ['src']): string[] {
  const out: string[] = []
  const walk = (dir: string): void => {
    let entries: string[]
    try {
      entries = readdirSync(dir)
    } catch {
      return
    }
    for (const name of entries) {
      if (SKIP_DIRS.has(name)) continue
      const full = join(dir, name)
      let st
      try {
        st = statSync(full)
      } catch {
        continue
      }
      if (st.isDirectory()) walk(full)
      else if (isViewFile(name)) out.push(full)
    }
  }
  for (const d of dirs) walk(resolve(root, d))
  return out.sort()
}

/** The user controls of the project: one per `.kbcontrol`, rendered by its code-behind (else itself). */
export function userControlsOf(root: string, views: readonly string[]): UserControlRef[] {
  return views
    .filter((v) => v.toLowerCase().endsWith('.kbcontrol'))
    .map((v) => {
      const cb = codeBehindOf(v)
      const module = cb ? cb.replace(/\.(ts|tsx)$/, '') : v
      return { name: viewStem(v), module: '/' + projectPath(root, module) }
    })
}

/** The generated files of a view. */
export function generatedPaths(root: string, viewFile: string): { dts: string; check: string; map: string } {
  const base = join(root, GENERATED_DIR, relative(root, viewFile))
  return { dts: base + '.d.ts', check: base + '.check.ts', map: base + '.check.json' }
}

/** Writes `text` unless the file already holds it (keeps tsc's incremental state and watchers quiet). */
export function writeIfChanged(file: string, text: string): boolean {
  try {
    if (readFileSync(file, 'utf8') === text) return false
  } catch {
    // Missing: written below.
  }
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, text)
  return true
}

/** Writes the declarations and the check file (+ its span map) of one compiled view. */
export function writeGenerated(root: string, viewFile: string, out: CompileOutput): void {
  const paths = generatedPaths(root, viewFile)
  writeIfChanged(paths.dts, out.dts)
  writeIfChanged(paths.check, out.check)
  const map = {
    view: projectPath(root, viewFile),
    class_name: out.class_name,
    spans: out.check_map,
    handlers: out.handlers,
  }
  writeIfChanged(paths.map, JSON.stringify(map) + '\n')
}

/** `kubuno.views.json` (VIEWS-SPEC §1): target, extra registries, view folders, `Class` budget. */
export interface ProjectConfig {
  target?: 'web' | 'desktop'
  /** Project registries (custom controls), relative to the project root. */
  registries?: string[]
  /** Folders scanned for views (default `["src"]`). */
  sources?: string[]
  classBudget?: number
  /** The host registry file (default: `@kubuno/ui/kbview-registry.web.json` from node_modules). */
  hostRegistry?: string
}

export function readProjectConfig(root: string): ProjectConfig {
  const file = join(root, 'kubuno.views.json')
  if (!existsSync(file)) return {}
  return JSON.parse(readFileSync(file, 'utf8')) as ProjectConfig
}

/** The host registry: `node_modules/@kubuno/ui/kbview-registry.web.json`, searched upwards from `root`. */
export function findHostRegistry(root: string): string | null {
  let dir = resolve(root)
  for (;;) {
    const candidate = join(dir, 'node_modules', '@kubuno', 'ui', 'kbview-registry.web.json')
    if (existsSync(candidate)) return candidate
    const parent = dirname(dir)
    if (parent === dir) return null
    dir = parent
  }
}

/**
 * A project registry with its project-local modules rewritten to project-root-relative specifiers
 * (`./controls` next to `src/kbview-controls.json` → `/src/controls`), what the compiler expects.
 */
export function projectRegistryJson(root: string, file: string): string {
  const doc = JSON.parse(readFileSync(file, 'utf8')) as { components?: { web?: { module?: string | null; alternates?: { module?: string | null }[] } }[] }
  const dir = projectPath(root, dirname(file))
  const rewrite = (m: string | null | undefined): string | null | undefined => {
    if (!m || !(m.startsWith('./') || m.startsWith('../'))) return m
    return '/' + posix.normalize(posix.join(dir, m))
  }
  for (const c of doc.components ?? []) {
    if (!c.web) continue
    c.web.module = rewrite(c.web.module)
    for (const a of c.web.alternates ?? []) a.module = rewrite(a.module)
  }
  return JSON.stringify(doc)
}

/** The `.wasm` shipped in the package (`wasm/kubuno-views-web.wasm`, next to `src/` and `dist/`). */
export function wasmPath(): string {
  // `KBVIEW_WASM` overrides (environments whose import.meta.url is not a file URL, e.g. jsdom tests).
  if (process.env.KBVIEW_WASM) return process.env.KBVIEW_WASM
  return fileURLToPath(new URL('../wasm/kubuno-views-web.wasm', import.meta.url))
}

let wasmModule: Promise<WebAssembly.Module> | null = null

/** A compiler instance over the shipped `.wasm` (compiled once per process). */
export async function loadNodeCompiler(): Promise<ViewCompiler> {
  wasmModule ??= WebAssembly.compile(readFileSync(wasmPath()))
  return new ViewCompiler(await CompilerWasm.instantiate(await wasmModule))
}

export interface ProjectOptions {
  /** Host registry file; default: from `kubuno.views.json`, else `@kubuno/ui` in node_modules. */
  hostRegistry?: string
  /** Extra project registries (relative to the root). */
  registries?: string[]
  /** Folders scanned for views. */
  sources?: string[]
}

/** A project: its root, its views, and a compiler loaded with its registries and user controls. */
export class ViewProject {
  views: string[] = []
  readonly hostRegistry: string
  readonly sources: string[]

  private constructor(
    readonly root: string,
    readonly compiler: ViewCompiler,
    hostRegistry: string,
    sources: string[],
  ) {
    this.hostRegistry = hostRegistry
    this.sources = sources
  }

  static async open(root: string, options: ProjectOptions = {}): Promise<ViewProject> {
    const config = readProjectConfig(root)
    const hostOption = options.hostRegistry ?? config.hostRegistry
    const host = hostOption ? (isAbsolute(hostOption) ? hostOption : resolve(root, hostOption)) : findHostRegistry(root)
    if (!host || !existsSync(host)) {
      throw new Error(
        `@kubuno/views-compiler: no element registry found (expected node_modules/@kubuno/ui/kbview-registry.web.json, or set "hostRegistry" in kubuno.views.json / the plugin options)`,
      )
    }
    const compiler = await loadNodeCompiler()
    compiler.addRegistry(readFileSync(host, 'utf8'), projectPath(root, host) || host, true)
    for (const reg of [...(config.registries ?? []), ...(options.registries ?? [])]) {
      const file = resolve(root, reg)
      compiler.addRegistry(projectRegistryJson(root, file), projectPath(root, file), false)
    }
    const project = new ViewProject(root, compiler, host, options.sources ?? config.sources ?? ['src'])
    project.rescan()
    return project
  }

  /** Re-lists the views and the user controls. */
  rescan(): void {
    this.views = scanViews(this.root, this.sources)
    this.compiler.setUserControls(userControlsOf(this.root, this.views))
  }

  /** Compiles one view file (read from disk unless `source` is given). */
  compile(viewFile: string, source?: string, design = false): CompileOutput {
    const text = (source ?? readFileSync(viewFile, 'utf8')).replace(/^﻿/, '')
    const cb = codeBehindOf(viewFile)
    return this.compiler.compile(text, {
      file: projectPath(this.root, viewFile),
      code_behind: cb ? './' + (cb.split(/[\\/]/).pop() ?? '').replace(/\.(ts|tsx)$/, '') : null,
      design,
    })
  }

  /** Compiles every view and writes its generated files; returns the outputs by file. */
  generateAll(): Map<string, CompileOutput> {
    const out = new Map<string, CompileOutput>()
    for (const v of this.views) {
      const result = this.compile(v)
      writeGenerated(this.root, v, result)
      out.set(v, result)
    }
    return out
  }
}
