// Tests of the runner itself, plus the core repository's own suites (they must stay valid).
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync, readdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  VectorError, checksum, defineVectorTests, jsonEqual, loadSuite, parseSuite, runSuite, verifyVendor,
} from '../index.js'

const suite = (cases) => ({ format: 1, suite: 'demo.add', version: '1.0.0', cases })

describe('jsonEqual', () => {
  it('compares numbers by value and objects by key', () => {
    assert.ok(jsonEqual({ a: 1, b: [1, 2] }, { b: [1.0, 2], a: 1 }))
    assert.ok(!jsonEqual([1, 2], [2, 1]))
    assert.ok(!jsonEqual({ a: 1 }, { a: 1, b: null }))
    assert.ok(!jsonEqual('1', 1))
    assert.ok(jsonEqual(null, null))
  })
})

describe('runSuite', () => {
  it('reports every failure and the skips', () => {
    const s = parseSuite(suite([
      { id: 'one', input: [1, 1], expected: 2 },
      { id: 'two', input: [2, 2], expected: 5 },
      { id: 'three', input: [3, 3], expected: 7 },
      { id: 'skipped', input: [0, 0], expected: 1, skip: { ts: 'documented divergence' } },
    ]))
    const out = runSuite(s, ([a, b]) => a + b)
    assert.equal(out.passed, 1)
    assert.deepEqual(out.failures.map((f) => f.id), ['two', 'three'])
    assert.equal(out.skipped.length, 1)
  })

  it('turns a throw into a failure', () => {
    const out = runSuite(parseSuite(suite([{ id: 'x', input: 0, expected: 0 }])), () => { throw new Error('boom') })
    assert.deepEqual(out.failures[0].actual, { thrown: 'boom' })
  })
})

describe('validateSuite', () => {
  it('refuses bad suites', () => {
    assert.throws(() => parseSuite(suite([{ id: 'a', input: 0, expected: 0 }, { id: 'a', input: 0, expected: 0 }])), VectorError)
    assert.throws(() => parseSuite({ ...suite([{ id: 'a', input: 0, expected: 0 }]), format: 2 }), VectorError)
    assert.throws(() => parseSuite({ ...suite([{ id: 'a', input: 0, expected: 0 }]), extra: true }), VectorError)
    assert.throws(() => parseSuite(suite([{ id: 'a', input: 0, expected: 0, skip: { cobol: 'x' } }])), VectorError)
    assert.throws(() => parseSuite({ ...suite([{ id: 'a', input: 0, expected: 0 }]), version: '1.0' }), VectorError)
    assert.throws(() => parseSuite({ ...suite([{ id: 'a', input: 0, expected: 0 }]), suite: 'demo' }), VectorError)
    assert.throws(() => parseSuite(suite([{ id: 'a', input: 0 }])), VectorError)
  })
})

describe('checksum and vendoring', () => {
  it('ignores CRLF', () => {
    assert.equal(checksum('{\r\n}\r\n'), checksum('{\n}\n'))
    assert.equal(checksum(''), 'sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')
  })

  it('verifies a vendored folder', () => {
    const dir = mkdtempSync(join(tmpdir(), 'kubuno-vectors-'))
    try {
      const body = JSON.stringify(suite([{ id: 'a', input: 0, expected: 0 }]))
      writeFileSync(join(dir, 'demo.json'), body)
      const manifest = { format: 1, source: 'https://github.com/kubuno/core', ref: 'vectors-v0.1.0', path: 'vectors/demo', files: { 'demo.json': checksum(body) } }
      writeFileSync(join(dir, 'VENDOR.json'), JSON.stringify(manifest))
      assert.equal(verifyVendor(dir).ref, 'vectors-v0.1.0')
      writeFileSync(join(dir, 'demo.json'), body.replace('1.0.0', '1.0.1'))
      assert.throws(() => verifyVendor(dir), VectorError)
      writeFileSync(join(dir, 'demo.json'), body)
      writeFileSync(join(dir, 'stray.json'), '{}')
      assert.throws(() => verifyVendor(dir), VectorError)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})

// defineVectorTests registers one test per case.
defineVectorTests(suite([{ id: 'one', input: [1, 2], expected: 3 }, { id: 'zero', input: [0, 0], expected: 0 }]), ([a, b]) => a + b, { describe, it })

describe('core repository suites', () => {
  const root = join(dirname(fileURLToPath(import.meta.url)), '../../../../common/vectors')
  for (const domain of readdirSync(root, { withFileTypes: true }).filter((d) => d.isDirectory())) {
    for (const name of readdirSync(join(root, domain.name)).filter((n) => n.endsWith('.json'))) {
      it(`${domain.name}/${name} is a valid suite`, () => { loadSuite(join(root, domain.name, name)) })
    }
  }
})
