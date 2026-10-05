import { describe, expect, it } from 'vitest'

import { rect } from './geometry'
import {
  deleteMessage,
  keyMessages,
  moveOps,
  resizableHandles,
  resizeOps,
  skeletonXml,
  toolboxComponentOf,
  type KeyContext,
  type KeyInput,
} from './edits'

const set = (elementId: string, name: string, value: string) => ({ kind: 'setAttribute', elementId, name, value })

describe('move and resize intents', () => {
  it('a move writes whole view px for the axes that changed, inline-start based', () => {
    expect(moveOps('0', { X: 20, Y: 20 }, 30.4, 15.6, 1, false)).toEqual([set('0', 'X', '50'), set('0', 'Y', '36')])
    expect(moveOps('0', { X: 20, Y: 20 }, 30, 0, 1, true)).toEqual([set('0', 'X', '-10')])
    expect(moveOps('0', { X: 20, Y: 20 }, 30, 15, 0.5, false)).toEqual([set('0', 'X', '80'), set('0', 'Y', '50')])
    expect(moveOps('0', {}, 0.3, 0.2, 1, false)).toEqual([])
  })

  it('a resize writes the size, and X / Y when the start / top edge moved on an absolute child', () => {
    const before = rect(100, 100, 220, 136)
    expect(resizeOps('0', { X: 20, Y: 20, Width: 120, Height: 36 }, before, rect(100, 100, 240, 146), 'se', 1, false, true))
      .toEqual([set('0', 'Width', '140'), set('0', 'Height', '46')])
    expect(resizeOps('0', { X: 20, Y: 20, Width: 120, Height: 36 }, before, rect(90, 95, 220, 136), 'nw', 1, false, true))
      .toEqual([set('0', 'X', '10'), set('0', 'Y', '15'), set('0', 'Width', '130'), set('0', 'Height', '41')])
    // Right-to-left: the right edge is the inline start.
    expect(resizeOps('0', { X: 20, Width: 120 }, before, rect(100, 100, 250, 136), 'e', 1, true, true))
      .toEqual([set('0', 'X', '-10'), set('0', 'Width', '150')])
    // A flow child: only its size, starting from the painted one when it has none.
    expect(resizeOps('0', {}, before, rect(100, 100, 220, 156), 's', 2, false, false)).toEqual([set('0', 'Height', '28')])
  })

  it('handles resize every edge of an absolute child, only the sized end edges of the others', () => {
    expect(resizableHandles(true, {}, false).size).toBe(8)
    expect([...resizableHandles(false, { Width: 100 }, false)]).toEqual(['e'])
    expect([...resizableHandles(false, { Width: 100, Height: 20 }, true)].sort()).toEqual(['s', 'sw', 'w'])
    expect(resizableHandles(false, {}, false).size).toBe(0)
  })
})

describe('deletions and Toolbox markup', () => {
  it('deletes one element alone, several as one batch, never the root', () => {
    expect(deleteMessage(['0.1'])).toEqual({ type: 'editRequest', op: { kind: 'removeElement', elementId: '0.1' } })
    expect(deleteMessage(['0.1', '0.1.0', '2'])).toEqual({
      type: 'editRequests', gesture: 'delete', ops: [{ kind: 'removeElement', elementId: '0.1' }, { kind: 'removeElement', elementId: '2' }],
    })
    expect(deleteMessage([''])).toBeNull()
  })

  it('writes the desktop skeleton and reads both Toolbox texts', () => {
    expect(skeletonXml('Button', null, [100, 36])).toBe('<Button/>')
    expect(skeletonXml('Button', [300, 200.4], [100, 36])).toBe('<Button X="300" Y="200" Width="100" Height="36" Anchor="Top, Left"/>')
    expect(skeletonXml('Timer', [1, 2], [1, 1], true)).toBe('<Timer/>')
    expect(() => skeletonXml('<script>', null, [1, 1])).toThrow()
    expect(toolboxComponentOf('kubuno-toolbox:TextField')).toBe('TextField')
    expect(toolboxComponentOf('<Button />')).toBe('Button')
    expect(toolboxComponentOf('  <Stack Direction="TopDown">\n</Stack>')).toBe('Stack')
    expect(toolboxComponentOf('hello')).toBeNull()
  })
})

describe('the keyboard', () => {
  const ctx = (selection: string[], absolute: KeyContext['absolute'] = []): KeyContext => ({
    selection,
    absolute,
    parentOf: (id) => (id === '' ? null : id.includes('.') ? id.slice(0, id.lastIndexOf('.')) : ''),
    siblingsOf: (id) => (id === '' ? ['0', '1'] : ['0.0', '0.1', '0.2']),
  })
  const k = (key: string, mods: Partial<KeyInput> = {}): KeyInput => ({ key, ctrl: false, shift: false, alt: false, ...mods })

  it('Delete removes, arrows nudge absolute children (Shift: 8), Escape selects the parent', () => {
    expect(keyMessages(k('Delete'), ctx(['0.1'])).messages).toEqual([{ type: 'editRequest', op: { kind: 'removeElement', elementId: '0.1' } }])
    const abs = [{ id: '0', at: { X: 10, Y: 10 }, rtl: false }, { id: '1', at: { X: 5 }, rtl: true }]
    expect(keyMessages(k('ArrowRight'), ctx(['0', '1'], abs)).messages).toEqual([
      { type: 'editRequests', gesture: 'move', ops: [set('0', 'X', '11'), set('1', 'X', '4')] },
    ])
    expect(keyMessages(k('ArrowDown', { shift: true }), ctx(['0'], abs.slice(0, 1))).messages).toEqual([
      { type: 'editRequests', gesture: 'move', ops: [set('0', 'Y', '18')] },
    ])
    expect(keyMessages(k('ArrowDown'), ctx(['0.1'])).messages).toEqual([]) // a flow child does not move
    expect(keyMessages(k('Escape'), ctx(['0.1'])).select).toEqual(['0'])
    expect(keyMessages(k('Escape'), ctx(['0'])).select).toEqual([''])
  })

  it('Ctrl+C / X / V / D are surface commands, Ctrl+A selects the siblings', () => {
    expect(keyMessages(k('c', { ctrl: true }), ctx(['0.1'])).messages).toEqual([{ type: 'command', name: 'copy', elementId: '0.1' }])
    expect(keyMessages(k('x', { ctrl: true }), ctx(['0.1'])).messages[0]).toMatchObject({ name: 'cut' })
    expect(keyMessages(k('V', { ctrl: true }), ctx([])).messages[0]).toMatchObject({ name: 'paste', elementId: null })
    expect(keyMessages(k('d', { ctrl: true }), ctx(['0.1'])).messages[0]).toMatchObject({ name: 'duplicate' })
    expect(keyMessages(k('a', { ctrl: true }), ctx(['0.1'])).select).toEqual(['0.1', '0.0', '0.2'])
    expect(keyMessages(k('a', { ctrl: true }), ctx([''])).select).toEqual(['0', '1'])
  })

  it('every other key goes to the host; lone modifiers do not', () => {
    const r = keyMessages(k('s', { ctrl: true }), ctx(['0']))
    expect(r).toEqual({ messages: [{ type: 'unhandledKey', key: 's', ctrl: true, shift: false, alt: false }], handled: false })
    expect(keyMessages(k('F7'), ctx([])).messages[0]).toMatchObject({ type: 'unhandledKey', key: 'F7' })
    expect(keyMessages(k('Control', { ctrl: true }), ctx([])).messages).toEqual([])
  })
})
