import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { createElement, useState, type ReactNode } from 'react'
import { afterEach, describe, expect, it } from 'vitest'

import { KbView, Panel, Repeater, ScrollArea, Stack, UserControl, createViewBase, dockGrid, registerElements, type PlanNode, type ViewPlan } from './index'

afterEach(() => cleanup())

registerElements('@kubuno/views', { Panel, Repeater, ScrollArea, Stack, UserControl })
function Txt(props: { text?: string }): ReactNode {
  return createElement('span', null, props.text)
}
registerElements('layout-test', { Txt })

const at = [1, 1] as const
const lit = (n: string, v: unknown, prop: string, kind: 'Bool' | 'F32' | 'String' | 'Enum' = 'String') => ({ n, v, to: { prop }, kind, at })
const layout = (n: string, v: unknown) => ({ n, v, to: { runtime: 'layout' }, kind: 'Enum' as const, at })

describe('dock layout', () => {
  it('lays bands out in document order, the centre taking the rest', () => {
    const g = dockGrid(['Top', 'Fill'])
    expect(g.rows).toBe('auto minmax(0, 1fr)')
    expect(g.columns).toBe('minmax(0, 1fr)')
    expect(g.placements).toEqual([{ row: [1, 2], col: [1, 2] }, { row: [2, 3], col: [1, 2] }])

    // Top spans every column; Left then sits under it; Bottom spans what Left left; Fill is the centre.
    const h = dockGrid(['Top', 'Left', 'Bottom', 'Fill'])
    expect(h.rows).toBe('auto minmax(0, 1fr) auto')
    expect(h.columns).toBe('auto minmax(0, 1fr)')
    expect(h.placements).toEqual([
      { row: [1, 2], col: [1, 3] },
      { row: [2, 4], col: [1, 2] },
      { row: [3, 4], col: [2, 3] },
      { row: [2, 3], col: [2, 3] },
    ])
  })
})

const view = (root: PlanNode, handlers: string[] = [], names: Record<string, string> = {}): ViewPlan =>
  ({ abi: 1, file: 'test/Layout.kbcontrol', kind: 'control', names, handlers, root })

describe('layout elements', () => {
  it('a UserControl docks a header over a scrolling body', () => {
    const plan = view({
      id: '', el: 'UserControl', at, m: '@kubuno/views', x: 'UserControl', dom: 'ref', content: 'children',
      children: [
        { id: '0', el: 'Stack', at, m: '@kubuno/views', x: 'Stack', dom: 'ref', content: 'children',
          props: [layout('Dock', 'Top'), lit('Direction', 'LeftToRight', 'direction'), lit('Gap', 0, 'gap', 'F32'), lit('Justify', 'SpaceBetween', 'justify')],
          children: [{ id: '0.0', el: 'Txt', at, m: 'layout-test', x: 'Txt', props: [lit('Text', 'head', 'text')] }] },
        { id: '1', el: 'ScrollArea', at, m: '@kubuno/views', x: 'ScrollArea', dom: 'ref', content: 'children',
          props: [layout('Dock', 'Fill'), lit('ScrollbarGutter', 'StableBothEdges', 'gutter')],
          children: [{ id: '1.0', el: 'Txt', at, m: 'layout-test', x: 'Txt', props: [lit('Text', 'body', 'text')] }] },
      ],
    })
    const Base = createViewBase(plan)
    class Layout extends (Base as unknown as new () => object) {}
    const { container } = render(createElement(KbView, { view: Layout as never }))
    const root = container.firstElementChild as HTMLElement
    expect(root.style.display).toBe('grid')
    expect(root.style.gridTemplateRows).toBe('auto minmax(0, 1fr)')
    expect(root.style.minHeight).toBe('0px')
    const bands = [...root.children] as HTMLElement[]
    expect(bands.map((b) => b.dataset.kbDock)).toEqual(['Top', 'Fill'])
    const head = bands[0].firstElementChild as HTMLElement
    expect(head.style.flexDirection).toBe('row')
    expect(head.style.justifyContent).toBe('space-between')
    expect(head.style.gap).toBe('')
    const body = bands[1].firstElementChild as HTMLElement
    expect(body.style.overflowY).toBe('auto')
    expect(body.style.scrollbarGutter).toBe('stable both-edges')
    expect(body.hasAttribute('data-kb-scroll')).toBe(true)
  })

  it('a clickable container is a native button or a link; a plain click on a link stays in the app', async () => {
    const plan = view({
      id: '', el: 'Stack', at, m: '@kubuno/views', x: 'Stack', dom: 'ref', content: 'children',
      children: [
        { id: '0', el: 'Stack', at, m: '@kubuno/views', x: 'Stack', dom: 'ref', content: 'children',
          props: [{ n: 'AccessibleRole', v: 'button', to: { prop: 'role' }, kind: 'Enum', at }, { n: 'Enabled', v: true, to: { prop: 'disabled', convert: 'invert' }, kind: 'Bool', at }],
          events: [{ n: 'OnClick', h: 'add_click', from: { dom: 'click', args: 'mouse' }, args_type: 'MouseEventArgs', at }],
          children: [{ id: '0.0', el: 'Txt', at, m: 'layout-test', x: 'Txt', props: [lit('Text', 'Ajouter', 'text')] }] },
        { id: '1', el: 'Stack', at, m: '@kubuno/views', x: 'Stack', dom: 'ref', content: 'children',
          props: [lit('Href', '/labels', 'href')],
          events: [{ n: 'OnClick', h: 'labels_click', from: { dom: 'click', args: 'mouse' }, args_type: 'MouseEventArgs', at }],
          children: [{ id: '1.0', el: 'Txt', at, m: 'layout-test', x: 'Txt', props: [lit('Text', 'Étiquettes', 'text')] }] },
      ],
    }, ['add_click', 'labels_click'])
    const calls: string[] = []
    const Base = createViewBase(plan)
    class Actions extends (Base as unknown as new () => object) {
      add_click(): void { calls.push('add') }
      labels_click(): void { calls.push('labels') }
    }
    render(createElement(KbView, { view: Actions as never }))
    const button = screen.getByRole('button')
    expect(button.tagName).toBe('BUTTON')
    expect(button.getAttribute('type')).toBe('button')
    const link = screen.getByRole('link')
    expect(link.getAttribute('href')).toBe('/labels')
    await act(async () => fireEvent.click(button))
    const plain = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 })
    await act(async () => { link.dispatchEvent(plain) })
    expect(plain.defaultPrevented).toBe(true)
    const modified = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0, ctrlKey: true })
    await act(async () => { link.dispatchEvent(modified) })
    expect(modified.defaultPrevented).toBe(false)
    expect(calls).toEqual(['add', 'labels', 'labels'])
  })

  it('an event raised inside a Repeater template carries its row', async () => {
    const plan = view({
      id: '', el: 'Stack', at, m: '@kubuno/views', x: 'Stack', dom: 'ref', content: 'children',
      children: [{
        id: '0', el: 'Repeater', at, m: '@kubuno/views', x: 'Repeater', dom: 'none', template: true,
        props: [{ n: 'ItemsSource', to: { runtime: 'item-state' }, kind: 'String', at, b: { path: 'rows', mode: 'OneWay', at } }, { n: 'ItemKey', v: 'id', to: { runtime: 'item-state' }, kind: 'String', at }],
        children: [{
          id: '0.0', el: 'Stack', at, m: '@kubuno/views', x: 'Stack', dom: 'ref', content: 'children',
          props: [{ n: 'AccessibleRole', v: 'button', to: { prop: 'role' }, kind: 'Enum', at }],
          events: [{ n: 'OnClick', h: 'row_click', from: { dom: 'click', args: 'mouse' }, args_type: 'MouseEventArgs', at }],
          children: [{ id: '0.0.0', el: 'Txt', at, m: 'layout-test', x: 'Txt', props: [{ n: 'Text', to: { prop: 'text' }, kind: 'String', at, b: { path: 'name', mode: 'OneWay', at, depth: 1 } }] }],
        }],
      }],
    }, ['row_click'])
    const got: unknown[] = []
    const Base = createViewBase(plan)
    class List extends (Base as unknown as new () => object) {
      rows = [{ id: 'a', name: 'Ada' }, { id: 'b', name: 'Bob' }]
      row_click(_s: unknown, e: { row?: unknown; rowIndex?: number }): void { got.push([e.row, e.rowIndex]) }
    }
    render(createElement(KbView, { view: List as never }))
    await act(async () => fireEvent.click(screen.getByText('Bob')))
    expect(got).toEqual([[{ id: 'b', name: 'Bob' }, 1]])
  })

  it('new props from the host reach the elements reading them', async () => {
    const plan = view({
      id: '', el: 'Stack', at, m: '@kubuno/views', x: 'Stack', dom: 'ref', content: 'children',
      children: [{ id: '0', el: 'Txt', at, m: 'layout-test', x: 'Txt', props: [{ n: 'Text', to: { prop: 'text' }, kind: 'String', at, b: { path: 'title', mode: 'OneWay', at } }] }],
    })
    const Base = createViewBase(plan)
    class Titled extends (Base as unknown as new () => { props: { title?: string } }) {
      get title(): string { return this.props.title ?? '' }
    }
    const Component = (Titled as unknown as { component(): React.ComponentType<{ title: string }> }).component()
    let set: (s: string) => void = () => {}
    function Host(): ReactNode {
      const [title, setTitle] = useState('un')
      set = setTitle
      return createElement(Component, { title })
    }
    render(createElement(Host))
    expect(screen.getByText('un')).toBeTruthy()
    await act(async () => set('deux'))
    expect(screen.getByText('deux')).toBeTruthy()
  })
})

describe('a user control converted from a component', () => {
  const badge = (rootProps: PlanNode['props'] = undefined): ViewPlan => view({
    id: '', el: 'UserControl', at, m: '@kubuno/views', x: 'UserControl', dom: 'ref', content: 'children', props: rootProps,
    children: [{ id: '0', el: 'Stack', at, m: '@kubuno/views', x: 'Stack', dom: 'ref', content: 'children',
      props: [lit('Direction', 'LeftToRight', 'direction')],
      children: [{ id: '0.0', el: 'Txt', at, m: 'layout-test', x: 'Txt', props: [lit('Text', 'badge', 'text')] }] }],
  })

  it('renders its one element as its DOM root when its UserControl root has nothing of its own', () => {
    const Base = createViewBase(badge())
    class Badge extends (Base as unknown as new () => object) {}
    const { container } = render(createElement('div', { className: 'space-y-2' }, createElement(KbView, { view: Badge as never })))
    const root = container.firstElementChild!.firstElementChild as HTMLElement
    // The Stack itself, a direct child of its host: no dock box around it.
    expect(root.style.flexDirection).toBe('row')
    expect(root.textContent).toBe('badge')
  })

  it('keeps its box when it lays its element out (a docked body, as the app launcher has)', () => {
    const docked = view({
      id: '', el: 'UserControl', at, m: '@kubuno/views', x: 'UserControl', dom: 'ref', content: 'children',
      children: [{ id: '0', el: 'Stack', at, m: '@kubuno/views', x: 'Stack', dom: 'ref', content: 'children', props: [layout('Dock', 'Fill')] }],
    })
    const Base = createViewBase(docked)
    class Docked extends (Base as unknown as new () => object) {}
    const { container } = render(createElement(KbView, { view: Docked as never }))
    expect((container.firstElementChild as HTMLElement).style.minHeight).toBe('0px')
  })

  it('keeps its box when the root sets something, and in the designer', () => {
    const Padded = createViewBase(badge([lit('Padding', '4', 'padding')]))
    class P extends (Padded as unknown as new () => object) {}
    const { container } = render(createElement(KbView, { view: P as never }))
    expect((container.firstElementChild as HTMLElement).style.flexDirection).toBe('')
    cleanup()
    const Plain = createViewBase(badge())
    class D extends (Plain as unknown as new () => object) {}
    const designed = render(createElement(KbView, { view: D as never, design: true }))
    expect((designed.container.firstElementChild as HTMLElement).style.flexDirection).toBe('')
  })
})
