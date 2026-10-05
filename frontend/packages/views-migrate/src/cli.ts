/**
 * `kbview-migrate` — converts TSX screens of a web project to `.kbview` views (WEB-VIEWS.md §6.2, WV-11).
 *
 *   kbview-migrate [--project <dir>] [--write] [--report <file.json>] [--component <Name>] <file.tsx>…
 *
 * Without `--write` nothing is written: the report says what each file would become (converted, partial with the
 * reasons, or skipped). With `--write` the view, code-behind and parts are written next to the `.tsx`, the `.tsx` is
 * deleted, importers are switched to the default export, and the `defaultValue`s of strings missing from the
 * fallback bundle are collected into `<project>/src/views-defaults.json` (to review, then move into the bundles).
 */
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'

import { openProject } from './project.js'
import { migrateFile, rewriteImporters, targetComponent, type MigrationResult } from './migrate.js'
import { splitFile } from './split.js'

export async function main(argv: readonly string[] = process.argv.slice(2)): Promise<number> {
  const flag = (n: string): string | undefined => {
    const i = argv.indexOf(n)
    return i >= 0 ? argv[i + 1] : undefined
  }
  const write = argv.includes('--write')
  const root = resolve(flag('--project') ?? process.cwd())
  const reportFile = flag('--report')
  const component_ = flag('--component')
  const outDir = flag('--out')
  const skipNext = new Set(['--project', '--report', '--component', '--out'])
  const split = argv.includes('--split')
  let files = argv.filter((a, i) => !a.startsWith('--') && !skipNext.has(argv[i - 1] ?? '')).map((f) => resolve(f))
  if (!files.length) {
    console.error('usage: kbview-migrate [--project <dir>] [--write] [--split] [--report <file.json>] [--component <Name>] <file.tsx>…')
    return 2
  }
  const ctx = openProject(root, files)
  const results: MigrationResult[] = []
  // --split: the files exporting several components are cut into one file per component first (in memory, then on
  // disk with --write); the new files join the batch.
  const splitWrites: Record<string, string> = {}
  const splitDeletes: string[] = []
  if (split) {
    const next: string[] = []
    for (const f of files) {
      const sf = ctx.project.getSourceFile(f)
      const s = sf && splitFile(ctx.config, sf)
      if (!s) {
        next.push(f)
        continue
      }
      for (const [p, text] of Object.entries(s.created)) {
        ctx.project.createSourceFile(p, text, { overwrite: true })
        splitWrites[p] = text
        next.push(p)
      }
      Object.assign(splitWrites, s.edits)
      splitDeletes.push(...s.deleted)
      if (s.deleted.some((d) => resolve(d) === resolve(f))) ctx.project.getSourceFile(f)?.delete()
      else next.push(f)
      console.log(`SPLIT     ${relative(root, f)} → ${s.moved.map((x) => relative(root, x.file)).join(', ')}`)
    }
    files = next
  }
  const same = (a: string, b: string): boolean => resolve(a) === resolve(b)
  // The importers of every component of the batch switch to its default export first (see rewriteImporters).
  const targets = files.flatMap((f) => {
    const sf = ctx.project.getSourceFile(f)
    const component = sf && targetComponent(sf, component_)
    return sf && component ? [{ sf, component }] : []
  })
  const importerEdits = rewriteImporters(ctx.config, targets)
  for (const f of files) {
    const sf = ctx.project.getSourceFile(f)
    if (!sf) {
      results.push({ file: f, status: 'skipped', reasons: ['not found in the project'], stats: { elements: 0, mapped: 0, classAttributes: 0, parts: 0, getters: 0, handlers: 0, bindings: 0, resources: 0 }, outputs: {}, deletes: [], edits: {}, defaults: [] })
      continue
    }
    const r = migrateFile(ctx.config, sf, component_)
    results.push(r)
    const rel = relative(root, f)
    console.log(`${r.status.toUpperCase().padEnd(9)} ${rel}${r.component ? ` (${r.component})` : ''}: ${r.stats.mapped}/${r.stats.elements} elements, ${r.stats.parts} part(s), ${r.stats.classAttributes} Class, ${r.stats.getters} getter(s), ${r.stats.handlers} handler(s)`)
    for (const reason of r.reasons) console.log(`          - ${reason}`)
    if (outDir && r.status !== 'skipped') {
      // A dry run that keeps the result: everything mirrored under --out (the project untouched).
      for (const [p, text] of Object.entries({ ...r.outputs, ...r.edits })) {
        const target = join(outDir, relative(root, p))
        mkdirSync(dirname(target), { recursive: true })
        writeFileSync(target, text)
      }
    }
    if (write && r.status !== 'skipped') {
      for (const [p, text] of Object.entries(r.outputs)) {
        mkdirSync(dirname(p), { recursive: true })
        writeFileSync(p, text)
      }
      for (const [p, text] of Object.entries(r.edits)) writeFileSync(p, text)
      for (const p of r.deletes) rmSync(p, { force: true })
    }
  }
  // The split files and their importers (before the importers' own conversion edits, which win).
  for (const [p, text] of Object.entries(splitWrites)) {
    if (Object.keys(importerEdits).some((q) => same(q, p)) || results.some((r) => r.deletes.some((q) => same(q, p)) || Object.keys(r.outputs).some((q) => same(q, p)))) continue
    if (write) {
      mkdirSync(dirname(p), { recursive: true })
      writeFileSync(p, text)
    }
    if (outDir) {
      const target = join(outDir, relative(root, p))
      mkdirSync(dirname(target), { recursive: true })
      writeFileSync(target, text)
    }
  }
  if (write) for (const p of splitDeletes) rmSync(p, { force: true })
  // The importers of the converted components (outside the batch).
  for (const [p, text] of Object.entries(importerEdits)) {
    if (write) writeFileSync(p, text)
    if (outDir) {
      const target = join(outDir, relative(root, p))
      mkdirSync(dirname(target), { recursive: true })
      writeFileSync(target, text)
    }
  }
  if (write) {
    const defaults = results.flatMap((r) => r.defaults)
    if (defaults.length) {
      const file = join(root, 'src', 'views-defaults.json')
      const prev = existsSync(file) ? (JSON.parse(readFileSync(file, 'utf8')) as Record<string, Record<string, string>>) : {}
      for (const d of defaults) (prev[d.ns] ??= {})[d.key] = d.value
      writeFileSync(file, JSON.stringify(prev, null, 2) + '\n')
    }
  }
  if (reportFile) writeFileSync(reportFile, JSON.stringify(summary(root, results), null, 2) + '\n')
  const s = summary(root, results)
  console.log(`\n${s.converted} converted, ${s.partial} partial, ${s.skipped} skipped (of ${results.length}); elements mapped ${s.elementsMapped}/${s.elements} (${s.elements ? Math.round((100 * s.elementsMapped) / s.elements) : 0} %), ${s.parts} part(s), ${s.classAttributes} Class attribute(s)`)
  return 0
}

export function summary(root: string, results: MigrationResult[]) {
  const sum = (k: keyof MigrationResult['stats']) => results.reduce((n, r) => n + r.stats[k], 0)
  return {
    converted: results.filter((r) => r.status === 'converted').length,
    partial: results.filter((r) => r.status === 'partial').length,
    skipped: results.filter((r) => r.status === 'skipped').length,
    elements: sum('elements'),
    elementsMapped: sum('mapped'),
    parts: sum('parts'),
    classAttributes: sum('classAttributes'),
    files: results.map((r) => ({
      file: relative(root, r.file).split('\\').join('/'),
      component: r.component,
      status: r.status,
      reasons: r.reasons,
      stats: r.stats,
      outputs: Object.keys(r.outputs).map((p) => relative(root, p).split('\\').join('/')),
      defaults: r.defaults.length,
    })),
  }
}
