import { act, cleanup, fireEvent, render } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { designClass, setDesignDataContext, setDesignPlan } from '../designApi'
import { KbView, createViewBase, registerElements, type PlanNode, type ViewPlan } from '../index'

afterEach(() => cleanup())

function DBox(props: { children?: ReactNode; label?: string }): ReactNode {
  return createElement('div', { 'data-label': props.label }, props.children)
}
function DBtn(props: { children?: ReactNode; onClick?: () => void }): ReactNode {
  return createElement('button', { onClick: props.onClick }, props.children)
}
registerElements('design-test', { DBox, DBtn })

const label = (id: string, path: string, design?: string): PlanNode => ({
  id, el: 'Box', at: [2, 3], m: 'design-test', x: 'DBox', dom: 'wrapper',
  props: [{ n: 'Text', to: { prop: 'label' }, b: { path, mode: 'OneWay', at: [2, 10] }, kind: 'String', at: [2, 4] }],
  ...(design ? { design: [{ n: 'Text', to: { prop: 'label' }, v: design, kind: 'String', at: [2, 30] }] } : {}),
})

const plan = (children: PlanNode[]): ViewPlan => ({
  abi: 1, file: 'test/Card.kbcontrol', kind: 'control', names: { go: '9' }, handlers: ['go_click'],
  root: {
    id: '', el: 'Stack', at: [1, 1], m: 'design-test', x: 'DBox', dom: 'wrapper', content: 'children',
    children: [...children, { id: '9', el: 'Button', at: [5, 1], m: 'design-test', x: 'DBtn', dom: 'wrapper', name: 'go',
      events: [{ n: 'OnClick', h: 'go_click', from: { prop: 'onClick', args: 'none' }, args_type: 'EventArgs', at: [5, 9] }] }],
  },
})

const labels = (c: HTMLElement): (string | null)[] => [...c.querySelectorAll('[data-label]')].map((e) => e.getAttribute('data-label'))

describe('the design API', () => {
  it('renders the buffer plan through the code-behind (getters run, handlers never) and swaps plans in place', () => {
    const Base = createViewBase(plan([label('0', 'title')]))
    const clicked = vi.fn()
    class Card extends (Base as unknown as new () => { props: { who?: string } }) {
      get title(): string { return `Bonjour ${this.props.who ?? '?'}` }
      go_click(): void { clicked() }
    }
    const cls = designClass(plan([label('0', 'title')]), Card as never)
    const { container } = render(createElement(KbView, { view: cls, design: true, who: 'Camille' }))
    expect(labels(container)).toEqual(['Bonjour Camille'])
    expect(container.querySelector('[data-kb-id="0"]')).not.toBeNull()
    fireEvent.click(container.querySelector('button')!)
    expect(clicked).not.toHaveBeenCalled()

    // A new buffer: the same instance shows the new plan; `d:` values apply in design mode.
    act(() => setDesignPlan(cls, plan([label('0', 'title'), label('1', 'missing', 'Échantillon')])))
    expect(labels(container)).toEqual(['Bonjour Camille', 'Échantillon'])
    expect(container.querySelector('[data-kb-id="1"]')).not.toBeNull()
  })

  it('gives the design data context to the instances, and the live class is never touched', () => {
    const p = plan([label('0', 'name')])
    const Base = createViewBase(p)
    const cls = designClass(p, null)
    setDesignDataContext(cls, { name: 'Lucas' })
    const { container } = render(createElement(KbView, { view: cls, design: true }))
    expect(labels(container)).toEqual(['Lucas'])
    act(() => setDesignDataContext(cls, { name: 'Inès' }))
    expect(labels(container)).toEqual(['Inès'])
    expect(() => setDesignPlan(Base, p)).toThrow(/not a design class/)
  })

  it('switching design mode off and on keeps the instance and toggles the element ids; handlers run in Run mode', () => {
    const p = plan([label('0', 'n')])
    const clicked = vi.fn()
    class Card extends (createViewBase(p) as unknown as new () => object) {
      n = 'x'
      go_click(): void { clicked() }
    }
    const cls = designClass(p, Card as never)
    const ui = (design: boolean) => createElement(KbView, { view: cls, design })
    const { container, rerender } = render(ui(true))
    expect(container.querySelectorAll('[data-kb-id]').length).toBe(3)
    rerender(ui(false))
    expect(container.querySelectorAll('[data-kb-id]').length).toBe(0)
    fireEvent.click(container.querySelector('button')!)
    expect(clicked).toHaveBeenCalledTimes(1)
    rerender(ui(true))
    expect(container.querySelectorAll('[data-kb-id]').length).toBe(3)
  })

  it('shows DesignItemCount sample rows for a Repeater without data, reading their own field names', () => {
    const p: ViewPlan = {
      ...plan([]),
      root: {
        id: '', el: 'Stack', at: [1, 1], m: 'design-test', x: 'DBox', dom: 'wrapper', content: 'children',
        children: [{
          id: '0', el: 'Repeater', at: [2, 1], m: '@kubuno/views', x: 'Repeater', dom: 'none', template: true,
          props: [
            { n: 'ItemsSource', to: { runtime: 'item-state' }, b: { path: 'rows', mode: 'OneWay', at: [2, 2] }, kind: 'String', at: [2, 2] },
            { n: 'DesignItemCount', to: { runtime: 'design' }, v: 2, kind: 'F32', at: [2, 3] },
          ],
          children: [{ ...label('0.0', 'name'), props: [{ n: 'Text', to: { prop: 'label' }, b: { path: 'name', mode: 'OneWay', at: [3, 1], depth: 1 }, kind: 'String', at: [3, 1] }] }],
        }],
      },
    }
    const cls = designClass(p, null)
    const { container } = render(createElement(KbView, { view: cls, design: true }))
    expect(labels(container)).toEqual(['name 1', 'name 2'])
  })
})
