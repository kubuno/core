import { describe, expect, it } from 'vitest'

import type { PlanNode, ViewPlan } from '../plan'
import { computeDropTarget, dockBand, flowSlot, isNoOpMove, type DropContext } from './drop'
import { makeLayoutMap, parentIdOf, rect, type LayoutEntry, type Rect } from './geometry'
import { Catalog, indexPlan } from './model'

// The registry as the surface reads it (only what drops use), never a list in the code under test.
const catalog = new Catalog([
  {
    components: [
      { name: 'UserControl', children: 'List', layout_kind: 'DockAnchor' },
      { name: 'Panel', children: 'List', layout_kind: 'DockAnchor' },
      { name: 'Stack', children: 'List', layout_kind: 'Flow' },
      { name: 'ScrollArea', children: 'SingleWidget', layout_kind: null },
      { name: 'Button', children: 'None', design_defaults: { size: [100, 36] } },
      { name: 'Label', children: 'None' },
      { name: 'ContextMenu', children: 'List', allowed_children: ['MenuItem'] },
      { name: 'MenuItem', children: 'None' },
    ],
  },
])

const node = (id: string, el: string, props: Record<string, unknown> = {}, children: PlanNode[] = []): PlanNode => ({
  id, el, at: [1, 1],
  props: Object.entries(props).map(([n, v]) => ({ n, v, to: {}, kind: 'String', at: [1, 1] })),
  children,
})

const plan = (root: PlanNode): ViewPlan => ({ abi: 1, file: 'x/T.kbview', kind: 'view', root, names: {}, handlers: [] })

function context(root: PlanNode, boxes: Record<string, Rect>, opts: { rtl?: boolean; zoom?: number; frame?: Rect } = {}): DropContext {
  const nodes = indexPlan(plan(root))
  const ids = [...nodes.keys()].filter((id) => boxes[id])
  const entries: LayoutEntry[] = ids.map((id, order) => ({ id, parentId: parentIdOf(id), bounds: boxes[id], clip: null, order, rtl: !!opts.rtl, bare: false }))
  return { map: makeLayoutMap(entries), nodes, catalog, zoom: opts.zoom ?? 1, frame: opts.frame ?? null }
}

// A column: three buttons 30 px tall, 10 px apart.
const column = (direction = 'TopDown'): DropContext =>
  context(
    node('', 'Stack', { Direction: direction }, [node('0', 'Button'), node('1', 'Button'), node('2', 'Button')]),
    direction === 'TopDown'
      ? { '': rect(0, 0, 200, 120), '0': rect(0, 0, 200, 30), '1': rect(0, 40, 200, 70), '2': rect(0, 80, 200, 110) }
      : { '': rect(0, 0, 330, 40), '0': rect(0, 0, 100, 30), '1': rect(110, 0, 210, 30), '2': rect(220, 0, 320, 30) },
  )

describe('drops into a Stack', () => {
  it('TopDown: a horizontal line between the children, index by the pointer', () => {
    const t = computeDropTarget(column(), { kind: 'new', component: 'Button' }, 100, 75)!
    expect(t).toMatchObject({ valid: true, parentId: '', index: 2, markerKind: 'line' })
    expect(t.marker).toEqual(rect(0, 73.5, 200, 76.5)) // between 70 and 80, 3 px thick
    expect(computeDropTarget(column(), { kind: 'new', component: 'Button' }, 100, 5)!.index).toBe(0)
    expect(computeDropTarget(column(), { kind: 'new', component: 'Button' }, 100, 115)!.index).toBe(3)
  })

  it('LeftToRight: a vertical line, mirrored in right-to-left', () => {
    const t = computeDropTarget(column('LeftToRight'), { kind: 'new', component: 'Label' }, 214, 20)!
    expect(t).toMatchObject({ valid: true, index: 2 })
    expect(t.marker).toEqual(rect(213.5, 0, 216.5, 40))
    // RightToLeft reverses the order: the first child is at the right.
    const rtl = context(
      node('', 'Stack', { Direction: 'LeftToRight' }, [node('0', 'Button'), node('1', 'Button')]),
      { '': rect(0, 0, 220, 40), '0': rect(110, 0, 210, 30), '1': rect(0, 0, 100, 30) },
      { rtl: true },
    )
    expect(computeDropTarget(rtl, { kind: 'new', component: 'Button' }, 205, 10)!.index).toBe(0)
    expect(computeDropTarget(rtl, { kind: 'new', component: 'Button' }, 105, 10)!.index).toBe(1)
    expect(computeDropTarget(rtl, { kind: 'new', component: 'Button' }, 5, 10)!.index).toBe(2)
  })

  it('a leaf targets its parent: before or after it by the pointer half', () => {
    expect(computeDropTarget(column(), { kind: 'new', component: 'Button' }, 100, 44)!).toMatchObject({ parentId: '', index: 1 })
    expect(computeDropTarget(column(), { kind: 'new', component: 'Button' }, 100, 66)!).toMatchObject({ parentId: '', index: 2 })
  })

  it('reorders with Vec semantics (the moved element taken out first) and spots a no-op', () => {
    const c = column()
    const after = computeDropTarget(c, { kind: 'move', id: '0' }, 100, 108)!
    expect(after).toMatchObject({ valid: true, parentId: '', index: 2 })
    expect(isNoOpMove('0', after)).toBe(false)
    const same = computeDropTarget(c, { kind: 'move', id: '1' }, 100, 50)!
    expect(isNoOpMove('1', same)).toBe(true)
  })
})

describe('drops into an absolute Panel', () => {
  const abs = (rtl = false, zoom = 1): DropContext =>
    context(node('', 'Panel', { Layout: 'Absolute' }, [node('0', 'Button', { X: 10, Y: 10 })]), { '': rect(100, 50, 700, 450), '0': rect(110, 60, 210, 96) }, { rtl, zoom })

  it('places the new element at the pointer (X / Y from the panel, whole px of the view)', () => {
    const t = computeDropTarget(abs(), { kind: 'new', component: 'Button' }, 400, 250)!
    expect(t).toMatchObject({ valid: true, parentId: '', index: 1, markerKind: 'ghost', xy: [300, 200] })
    expect(t.marker).toEqual(rect(400, 250, 500, 286))
    expect(computeDropTarget(abs(), { kind: 'new', component: 'Button' }, 400.4, 250.6)!.xy).toEqual([300, 201])
  })

  it('measures X from the inline start (the right edge) in right-to-left, and divides by the zoom', () => {
    expect(computeDropTarget(abs(true), { kind: 'new', component: 'Button' }, 600, 250)!.xy).toEqual([100, 200])
    expect(computeDropTarget(abs(false, 2), { kind: 'new', component: 'Button' }, 400, 250)!.xy).toEqual([150, 100])
  })
})

describe('SingleWidget containers, gated children, the dragged element itself', () => {
  const scroll = (child: PlanNode | null): DropContext =>
    context(
      node('', 'UserControl', {}, [node('0', 'ScrollArea', {}, child ? [child] : [])]),
      { '': rect(0, 0, 300, 300), '0': rect(0, 0, 300, 300), ...(child ? { '0.0': rect(0, 0, 300, 120), '0.0.0': rect(0, 0, 300, 40), '0.0.1': rect(0, 50, 300, 90) } : {}) },
    )

  it('a ScrollArea delegates to its child container', () => {
    const t = computeDropTarget(scroll(node('0.0', 'Stack', {}, [node('0.0.0', 'Button'), node('0.0.1', 'Button')])), { kind: 'new', component: 'Button' }, 100, 200)!
    expect(t).toMatchObject({ valid: true, parentId: '0.0', index: 2 })
  })

  it('an empty ScrollArea takes one child; one holding a leaf takes none', () => {
    expect(computeDropTarget(scroll(null), { kind: 'new', component: 'Button' }, 100, 100)!).toMatchObject({ valid: true, parentId: '0', index: 0, markerKind: 'box' })
    const full = context(node('', 'UserControl', {}, [node('0', 'ScrollArea', {}, [node('0.0', 'Label')])]), { '': rect(0, 0, 300, 300), '0': rect(0, 0, 300, 300), '0.0': rect(0, 0, 300, 20) })
    expect(computeDropTarget(full, { kind: 'new', component: 'Button' }, 100, 200)!).toMatchObject({ valid: false, parentId: '0' })
  })

  it('refuses a gated child anywhere but in its container, and unknown elements', () => {
    expect(computeDropTarget(column(), { kind: 'new', component: 'MenuItem' }, 100, 75)!.valid).toBe(false)
    expect(computeDropTarget(column(), { kind: 'new', component: 'Frobnicator' }, 100, 75)!.valid).toBe(false)
    const menu = context(node('', 'ContextMenu', {}, [node('0', 'MenuItem')]), { '': rect(0, 0, 200, 100), '0': rect(0, 0, 200, 30) })
    expect(computeDropTarget(menu, { kind: 'new', component: 'MenuItem' }, 50, 60)!.valid).toBe(true)
    expect(computeDropTarget(menu, { kind: 'new', component: 'Button' }, 50, 60)!.valid).toBe(false)
  })

  it('refuses to drop an element inside itself', () => {
    const c = context(
      node('', 'Stack', {}, [node('0', 'Stack', {}, [node('0.0', 'Button')]), node('1', 'Button')]),
      { '': rect(0, 0, 200, 200), '0': rect(0, 0, 200, 100), '0.0': rect(0, 0, 200, 30), '1': rect(0, 110, 200, 140) },
    )
    expect(computeDropTarget(c, { kind: 'move', id: '0' }, 50, 10)!).toMatchObject({ valid: false, parentId: '0' })
    // Over itself (not a descendant): next to it, in its parent.
    expect(computeDropTarget(c, { kind: 'move', id: '0' }, 50, 80)!).toMatchObject({ valid: true, parentId: '' })
  })

  it('targets the view root over the empty frame, nothing outside it', () => {
    const c = context(node('', 'Panel', { Layout: 'Absolute' }, []), {}, { frame: rect(0, 0, 400, 300) })
    expect(computeDropTarget(c, { kind: 'new', component: 'Button' }, 40, 30)!).toMatchObject({ valid: true, parentId: '', xy: [40, 30] })
    expect(computeDropTarget(c, { kind: 'new', component: 'Button' }, 500, 30)).toBeNull()
  })
})

describe('dock containers', () => {
  it('insert in document order and report the band of a docked element', () => {
    const c = context(
      node('', 'UserControl', {}, [node('0', 'Stack', { Dock: 'Top' }), node('1', 'Button', { Dock: 'Fill' })]),
      { '': rect(0, 0, 300, 400), '0': rect(0, 0, 300, 50), '1': rect(0, 50, 300, 400) },
    )
    const t = computeDropTarget(c, { kind: 'move', id: '0' }, 150, 390)!
    expect(t).toMatchObject({ valid: true, parentId: '', index: 1, markerKind: 'line' })
    expect(t.band).toEqual(rect(0, 0, 300, 50))
    expect(dockBand(rect(0, 0, 300, 400), 'Left', rect(0, 0, 80, 10), true)).toEqual(rect(220, 0, 300, 400))
  })

  it('flowSlot draws the line at the container edge when it is empty', () => {
    expect(flowSlot([], rect(10, 20, 110, 220), 'vertical', false, 50, 50).marker).toEqual(rect(10, 18.5, 110, 21.5))
  })
})
