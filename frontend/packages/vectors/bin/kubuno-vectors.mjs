#!/usr/bin/env node
// kubuno-vectors: vendor a suite folder at a pinned ref, or check a vendored folder.
//
//   kubuno-vectors vendor <from-dir> <to-dir> --source <repo-url> --ref <tag> --path <path-in-repo>
//       Copies every *.json suite of <from-dir> (a checkout of <repo-url> at <tag>) into <to-dir>, validates each
//       one and writes <to-dir>/VENDOR.json with their checksums.
//   kubuno-vectors check <dir>...
//       Verifies vendored folders (exit 1 on any mismatch). Suitable for CI.
import { copyFileSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { FORMAT, VENDOR_FILE, checksum, loadSuite, verifyVendor } from '../index.js'

function usage(code) {
  console.error('usage: kubuno-vectors vendor <from-dir> <to-dir> --source <url> --ref <tag> --path <path>\n       kubuno-vectors check <dir>...')
  process.exit(code)
}

function option(args, name) {
  const i = args.indexOf(name)
  if (i < 0 || i + 1 >= args.length) usage(2)
  return args[i + 1]
}

const [command, ...args] = process.argv.slice(2)
if (command === 'vendor') {
  const [from, to] = args
  if (!from || !to) usage(2)
  const source = option(args, '--source')
  const ref = option(args, '--ref')
  const path = option(args, '--path')
  const names = readdirSync(from).filter((n) => n.endsWith('.json') && n !== VENDOR_FILE && !n.endsWith('.schema.json')).sort()
  if (!names.length) { console.error(`${from}: no suite`); process.exit(1) }
  mkdirSync(to, { recursive: true })
  for (const n of readdirSync(to)) if (n.endsWith('.json')) rmSync(join(to, n))
  const files = {}
  for (const n of names) {
    loadSuite(join(from, n))
    copyFileSync(join(from, n), join(to, n))
    files[n] = checksum(readFileSync(join(to, n)))
  }
  const manifest = { format: FORMAT, source, ref, path, files }
  writeFileSync(join(to, VENDOR_FILE), JSON.stringify(manifest, null, 2) + '\n')
  console.log(`vendored ${names.length} suite(s) into ${to} (${ref})`)
} else if (command === 'check') {
  if (!args.length) usage(2)
  let failed = false
  for (const dir of args) {
    try {
      const m = verifyVendor(dir)
      for (const n of Object.keys(m.files)) loadSuite(join(dir, n))
      console.log(`ok ${dir} (${m.ref}, ${Object.keys(m.files).length} file(s))`)
    } catch (e) {
      failed = true
      console.error(e.message)
    }
  }
  process.exit(failed ? 1 : 0)
} else {
  usage(command ? 2 : 0)
}
