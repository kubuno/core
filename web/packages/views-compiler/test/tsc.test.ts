import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { mapCheckPosition, runKbviewTsc } from '../src/tsc.js'
import { FIXTURES } from './paths.js'

const PROJECT = join(FIXTURES, 'tsc')

describe('kbview-tsc', () => {
  it('maps a check-file column inside a binding path one to one', () => {
    const spans = [
      { line: 3, start: 1, end: 11, src: [7, 10] as [number, number], src_end: [7, 40] as [number, number], exact: false, what: 'binding' },
      { line: 3, start: 11, end: 16, src: [7, 25] as [number, number], src_end: [7, 30] as [number, number], exact: true, what: 'binding' },
    ]
    expect(mapCheckPosition(spans, 3, 13)).toEqual([7, 27])
    expect(mapCheckPosition(spans, 3, 2)).toEqual([7, 10])
    expect(mapCheckPosition(spans, 9, 1)).toBeNull()
  })

  it('type-checks bindings and handlers against the code-behind, errors at the .kbview attribute', async () => {
    const { exitCode, output } = await runKbviewTsc(['-p', '.', '--noEmit'], PROJECT)
    const lines = output.split('\n')
    const find = (re: RegExp): string | undefined => lines.find((l) => re.test(l))
    // A path that does not exist on the code-behind: at the path, character for character.
    expect(find(/^src\/Bad\.kbview\(2,26\): error TS2339: Property 'titel' does not exist/), output).toBeDefined()
    // A string bound to a Bool property: at the attribute.
    expect(find(/^src\/Bad\.kbview\(3,20\): error TS2345: .*'string'.*'boolean/), output).toBeDefined()
    // A two-way binding of a read-only getter.
    expect(find(/^src\/Bad\.kbview\(4,31\): error TS2540: Cannot assign to 'total'/), output).toBeDefined()
    // A nested path.
    expect(find(/^src\/Bad\.kbview\(5,31\): error TS2339: Property 'missing' does not exist/), output).toBeDefined()
    // A handler the view names and the code-behind lacks: at the event attribute.
    expect(find(/^src\/Bad\.kbview\(2,34\): error TS2515: handler 'save_click' of Button\.OnClick is missing/), output).toBeDefined()
    // No error leaks from generated files, none on the valid view.
    expect(lines.filter((l) => /\.kubuno[\\/]views/.test(l)), output).toEqual([])
    expect(lines.filter((l) => l.includes('Good.')), output).toEqual([])
    expect(exitCode).not.toBe(0)
  })
})
