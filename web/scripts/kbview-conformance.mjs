#!/usr/bin/env node
// Desktop ↔ web registry conformance, from the command line (the vitest spec runs the same check).
//
//   node scripts/kbview-conformance.mjs [--desktop <export.json>] [--out <report.json>]
//   node scripts/kbview-conformance.mjs --snapshot <export.json>
//
// --desktop  a full desktop export (`view_embed --export-registry`); default: the committed snapshot
// --out      where to write the JSON diff report; default: kbview-conformance-report.json in the OS temp dir
// --snapshot regenerate src/kbview/__fixtures__/desktop-registry.snapshot.json from a full export
import { readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildWebRegistry } from '../src/kbview/export.ts'
import { checkConformance, normalizeDesktopExport } from '../src/kbview/conformance.ts'
import { KBVIEW_ALLOWLIST } from '../src/kbview/allowlist.ts'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const snapshotPath = resolve(root, 'src/kbview/__fixtures__/desktop-registry.snapshot.json')
const arg = name => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : undefined }
// A desktop surface prints the export as one line, possibly after other output: keep the JSON line.
const readExport = path => {
  const text = readFileSync(path, 'utf8').replace(/^﻿/, '')
  const line = text.split(/\r?\n/).find(l => l.trimStart().startsWith('{"version"')) ?? text
  return JSON.parse(line)
}

const snapshotFrom = arg('--snapshot')
if (snapshotFrom) {
  const snapshot = normalizeDesktopExport(readExport(snapshotFrom), 'view_embed --export-registry, normalized by scripts/kbview-conformance.mjs --snapshot')
  writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 1) + '\n')
  console.log(`wrote ${snapshotPath} (${snapshot.components.length} desktop elements, registry ${snapshot.source.version})`)
  process.exit(0)
}

const desktopPath = arg('--desktop')
const desktop = desktopPath
  ? normalizeDesktopExport(readExport(desktopPath), `view_embed --export-registry (${desktopPath})`)
  : JSON.parse(readFileSync(snapshotPath, 'utf8'))
const report = checkConformance(buildWebRegistry(), desktop, KBVIEW_ALLOWLIST)
const out = arg('--out') ?? join(tmpdir(), 'kbview-conformance-report.json')
writeFileSync(out, JSON.stringify(report, null, 2) + '\n')
console.log(JSON.stringify(report.summary))
console.log(`report: ${out}`)
process.exit(report.failures.length || report.unused_allowlist.length ? 1 : 0)
