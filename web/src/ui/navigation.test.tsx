import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

import { applyMask, maskPlaceholder, parseMask } from './MaskedField'
import { clampDistance, Splitter } from './Splitter'
import { placePopover } from './AnchoredPopover'
import { preparePaint } from './PaintBox'
import { nextEnabled, Toolbar } from './Toolbar'
import { sidebarKey, sidebarRowsFrom } from './Sidebar'

describe('MaskedField mask', () => {
  it('parses input positions and literals (escaped too)', () => {
    const slots = parseMask('00/\\0L')
    expect(slots.map((s) => s.kind)).toEqual(['input', 'input', 'literal', 'literal', 'input'])
    expect(slots[3]).toEqual({ kind: 'literal', char: '0' })
  })

  it('formats raw digits and writes the literals', () => {
    expect(applyMask('00/00/0000', '05102026')).toEqual({ text: '05/10/2026', complete: true })
    expect(applyMask('00/00/0000', '0510')).toEqual({ text: '05/10', complete: false })
  })

  it('keeps already formatted text and drops refused characters', () => {
    expect(applyMask('00/00/0000', '05/1x0/2026').text).toBe('05/10/2026')
    expect(applyMask('LL-000-LL', 'ab123cd').text).toBe('ab-123-cd')
    expect(applyMask('+33 0 00', '+33 6 12').text).toBe('+33 6 12')
  })

  it('treats optional positions as not required', () => {
    expect(applyMask('0009', '123').complete).toBe(true)
  })

  it('shows a placeholder made of the mask', () => {
    expect(maskPlaceholder('00/00')).toBe('__/__')
  })
})

describe('Splitter', () => {
  it('clamps the first pane between the minimum and the room left', () => {
    expect(clampDistance(10, 500, 48)).toBe(48)
    expect(clampDistance(480, 500, 48)).toBe(452)
    expect(clampDistance(200, 500, 48)).toBe(200)
    expect(clampDistance(200, 60, 48)).toBe(12)
  })

  it('is a separator whose arrow keys move the bar and report it', () => {
    const changed = vi.fn()
    render(<Splitter distance={200} onDistanceChange={changed} aria-label="panes"><div>a</div><div>b</div></Splitter>)
    const bar = screen.getByRole('separator')
    expect(bar.getAttribute('aria-valuenow')).toBe('200')
    fireEvent.keyDown(bar, { key: 'ArrowRight' })
    expect(changed).toHaveBeenLastCalledWith(210)
    fireEvent.keyDown(bar, { key: 'ArrowLeft', shiftKey: true })
    expect(changed).toHaveBeenLastCalledWith(160)
  })
})

describe('Popover placement', () => {
  const space = { width: 1000, height: 800 }
  const anchor = { left: 100, top: 100, right: 200, bottom: 130 }
  const panel = { width: 240, height: 120 }

  it('opens below, aligned on the start edge, centred or on the end', () => {
    expect(placePopover(anchor, panel, space, 'bottom', 'left', 4)).toEqual({ left: 100, top: 134 })
    expect(placePopover(anchor, panel, space, 'bottom', 'center', 4)).toEqual({ left: 30, top: 134 })
    expect(placePopover(anchor, panel, space, 'bottom', 'right', 4)).toEqual({ left: 8, top: 134 })
  })

  it('opens on the sides and flips when there is no room', () => {
    expect(placePopover(anchor, panel, space, 'right', 'left', 4)).toEqual({ left: 204, top: 100 })
    expect(placePopover({ left: 900, top: 100, right: 990, bottom: 130 }, panel, space, 'right', 'left', 4).left).toBe(656)
    expect(placePopover({ left: 100, top: 700, right: 200, bottom: 730 }, panel, space, 'bottom', 'left', 4).top).toBe(576)
  })
})

describe('PaintBox', () => {
  it('sizes the backing store for the pixel ratio and scales the context', () => {
    const ctx = { setTransform: vi.fn(), clearRect: vi.fn() }
    const canvas = { clientWidth: 200, clientHeight: 100, width: 0, height: 0, getContext: () => ctx } as unknown as HTMLCanvasElement
    const args = preparePaint(canvas, 2, [1, 2])
    expect(canvas.width).toBe(400)
    expect(canvas.height).toBe(200)
    expect(ctx.setTransform).toHaveBeenCalledWith(2, 0, 0, 2, 0, 0)
    expect(args).toMatchObject({ width: 200, height: 100, dpr: 2, data: [1, 2] })
  })

  it('does not paint an empty box', () => {
    const canvas = { clientWidth: 0, clientHeight: 0, getContext: () => ({}) } as unknown as HTMLCanvasElement
    expect(preparePaint(canvas, 1)).toBeNull()
  })
})

describe('Toolbar', () => {
  it('skips disabled commands and wraps', () => {
    const items = [{}, { disabled: true }, {}]
    expect(nextEnabled(items, 0, 1)).toBe(2)
    expect(nextEnabled(items, 2, 1)).toBe(0)
    expect(nextEnabled(items, 0, -1)).toBe(2)
  })

  it('has one tab stop and moves it with the arrow keys', () => {
    render(<Toolbar aria-label="t" items={[{ text: 'A' }, { text: 'B' }, { text: 'C', disabled: true }]} />)
    const [a, b] = screen.getAllByRole('button')
    expect(a.tabIndex).toBe(0)
    expect(b.tabIndex).toBe(-1)
    a.focus()
    fireEvent.keyDown(a, { key: 'ArrowRight' })
    expect(document.activeElement).toBe(b)
    expect(b.tabIndex).toBe(0)
  })
})

describe('Sidebar', () => {
  it('keys a row by Key, else x:Name, else its text', () => {
    expect(sidebarKey({ key: 'k', id: 'name', text: 't' })).toBe('k')
    expect(sidebarKey({ id: 'name', text: 't' })).toBe('name')
    expect(sidebarKey({ id: '0.1', text: 't' })).toBe('t')
  })

  it('reads rows from a list in either case', () => {
    expect(sidebarRowsFrom([{ Text: 'A', Kind: 'Section' }, { text: 'B', key: 'b', level: 1 }])).toMatchObject([
      { kind: 'section', text: 'A' },
      { kind: 'item', text: 'B', key: 'b', level: 1 },
    ])
  })
})
