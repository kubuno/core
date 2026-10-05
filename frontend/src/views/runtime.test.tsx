import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { StrictMode, createElement, type ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { UNSET, format, readBinding, registerConverter, writeBinding, type Scope } from './binding'
import { makeArgs } from './events'
import { KbView, createViewBase, registerElements, type ViewPlan } from './index'

afterEach(() => cleanup())

const scope = (vm: Record<string, unknown>, ...rows: unknown[]): Scope => {
  let s: Scope = { vm }
  for (const row of rows) s = { vm, row, up: s }
  return s
}

describe('binding engine', () => {
  it('resolves rows first, then the view, then its dataContext', () => {
    const vm = { title: 'view', dataContext: { owner: 'dc' } }
    const s = scope(vm, { title: 'row' })
    expect(readBinding({ path: 'title', mode: 'OneWay', at: [1, 1], depth: 1 }, s)).toBe('row')
    expect(readBinding({ path: 'title', mode: 'OneWay', at: [1, 1] }, s)).toBe('view')
    expect(readBinding({ path: 'owner', mode: 'OneWay', at: [1, 1] }, s)).toBe('dc')
    expect(readBinding({ path: 'missing.x', mode: 'OneWay', at: [1, 1] }, s)).toBe(UNSET)
    expect(readBinding({ path: 'missing', mode: 'OneWay', at: [1, 1], fallback: 'fb' }, s)).toBe('fb')
  })

  it('applies converters both ways and refuses a write through a one-way converter', () => {
    const vm: Record<string, unknown> = { on: true, name: 'ada' }
    const s = scope(vm)
    expect(readBinding({ path: 'on', mode: 'TwoWay', conv: 'Not', at: [1, 1] }, s)).toBe(false)
    expect(writeBinding({ path: 'on', mode: 'TwoWay', conv: 'Not', at: [1, 1] }, s, true)).toBe(true)
    expect(vm.on).toBe(false)
    expect(readBinding({ path: 'name', mode: 'OneWay', conv: 'ToUpper', at: [1, 1] }, s)).toBe('ADA')
    expect(writeBinding({ path: 'name', mode: 'TwoWay', conv: 'ToUpper', at: [1, 1] }, s, 'x')).toBe(false)
    registerConverter('Twice', { convert: (v) => Number(v) * 2, convertBack: (v) => Number(v) / 2 })
    vm.n = 4
    expect(readBinding({ path: 'n', mode: 'TwoWay', conv: 'Twice', at: [1, 1] }, s)).toBe(8)
    writeBinding({ path: 'n', mode: 'TwoWay', conv: 'Twice', at: [1, 1] }, s, 10)
    expect(vm.n).toBe(5)
  })

  it('formats .NET style', () => {
    expect(format(3.14159, 'F2')).toBe('3.14')
    expect(format(7, 'D3')).toBe('007')
    expect(format(5, 'Total: {0}')).toBe('Total: 5')
    expect(format(new Date(2026, 9, 2, 8, 5), 'dd/MM/yyyy HH:mm')).toBe('02/10/2026 08:05')
    expect(format(1234.5, '0.00', 'en-US')).toBe('1234.50')
    expect(format(1234.5, '#,##0.00', 'en-US')).toBe('1,234.50')
  })

  it('builds event args from React callbacks', () => {
    expect(makeArgs('target-checked', [{ target: { checked: true } }]).e.value).toBe(true)
    expect(makeArgs('key-to-index', ['b'], { keys: ['a', 'b'] }).e.value).toBe(1)
    expect(makeArgs('mouse', [{ button: 2, clientX: 3, clientY: 4, detail: 2 }]).e).toMatchObject({ button: 'Right', x: 3, y: 4, clicks: 2 })
  })
})

// A plan written by hand, as the designer's interpreted path receives it (no compiled accessors).
function Box(props: { children?: ReactNode; label?: string }): ReactNode {
  return createElement('div', { 'data-label': props.label }, props.children)
}
function Btn(props: { children?: ReactNode; onClick?: () => void; disabled?: boolean }): ReactNode {
  return createElement('button', { onClick: props.onClick, disabled: props.disabled }, props.children)
}
registerElements('test-ui', { Box, Btn })

const plan = (label: string): ViewPlan => ({
  abi: 1,
  file: 'test/Counter.kbview',
  kind: 'view',
  names: { inc: '0' },
  handlers: ['inc_click', 'loaded', 'unloaded'],
  root: {
    id: '', el: 'Box', at: [1, 1], m: 'test-ui', x: 'Box', content: 'children',
    props: [{ n: 'Label', to: { prop: 'label' }, kind: 'String', at: [1, 6], v: label }],
    events: [
      { n: 'OnLoad', h: 'loaded', from: { runtime: 'view-load', args: 'none' }, args_type: 'EventArgs', at: [1, 20] },
      { n: 'OnUnload', h: 'unloaded', from: { runtime: 'view-unload', args: 'none' }, args_type: 'EventArgs', at: [1, 40] },
    ],
    children: [{
      id: '0', el: 'Btn', at: [2, 3], m: 'test-ui', x: 'Btn', name: 'inc',
      props: [
        { n: 'Text', to: { prop: 'children' }, kind: 'String', at: [2, 8], b: { path: 'count', mode: 'OneWay', at: [2, 24] } },
        { n: 'Enabled', to: { prop: 'disabled', convert: 'invert' }, kind: 'Bool', at: [2, 40], b: { path: 'enabled', mode: 'OneWay', at: [2, 58] } },
      ],
      events: [{ n: 'OnClick', h: 'inc_click', from: { prop: 'onClick', args: 'mouse' }, args_type: 'MouseEventArgs', at: [2, 70] }],
    }],
  },
})

function counterClass(base: ReturnType<typeof createViewBase>) {
  return class Counter extends (base as unknown as new () => { invalidate(): void; [k: string]: unknown }) {
    count = 0
    enabled = true
    loads = 0
    unloads = 0
    loaded(): void { this.loads++ }
    unloaded(): void { this.unloads++ }
    inc_click(): void {
      this.count = (this.count as number) + 1
      this.invalidate()
    }
  }
}

describe('views runtime', () => {
  it('renders, dispatches, and re-renders on change in React StrictMode', async () => {
    const Base = createViewBase(plan('A'))
    const C = counterClass(Base)
    const Component = (C as unknown as { component(): React.ComponentType }).component()
    const { unmount } = render(createElement(StrictMode, null, createElement(Component)))
    const button = screen.getByRole('button')
    expect(button.textContent).toBe('0')
    await act(async () => fireEvent.click(button))
    await act(async () => fireEvent.click(button))
    expect(button.textContent).toBe('2')
    unmount()
  })

  it('element handles read and write properties', async () => {
    const C = counterClass(createViewBase(plan('B')))
    let vm: Record<string, unknown> | undefined
    class Probe extends (C as unknown as new () => Record<string, unknown>) {
      loaded(): void { vm = this as unknown as Record<string, unknown> }
    }
    render(createElement(KbView, { view: Probe as never }))
    const inc = vm!.inc as { text: unknown; enabled: unknown; element: HTMLElement | null }
    expect(inc.text).toBe(0)
    expect(inc.element?.tagName).toBe('BUTTON')
    await act(async () => { inc.enabled = false })
    expect((screen.getByRole('button') as HTMLButtonElement).disabled).toBe(true)
  })

  it('swaps a new plan into a live view and keeps its state (HMR of a .kbview)', async () => {
    const Base = createViewBase(plan('first'), 'http://x/Counter.kbview?t=1')
    const C = counterClass(Base)
    const Component = (C as unknown as { component(): React.ComponentType }).component()
    const { container } = render(createElement(Component))
    await act(async () => fireEvent.click(screen.getByRole('button')))
    expect(screen.getByRole('button').textContent).toBe('1')
    let again: unknown
    await act(async () => { again = createViewBase(plan('second'), 'http://x/Counter.kbview?t=2') })
    expect(again).toBe(Base)
    expect(container.querySelector('[data-label]')?.getAttribute('data-label')).toBe('second')
    expect(screen.getByRole('button').textContent).toBe('1')
  })

  it('moves live instances onto a re-evaluated code-behind class (HMR of the code-behind)', async () => {
    const Base = createViewBase(plan('cb'), 'http://x/Cb.kbview')
    const First = counterClass(Base)
    const Component = (First as unknown as { component(): React.ComponentType }).component()
    render(createElement(Component))
    await act(async () => fireEvent.click(screen.getByRole('button')))
    const Second = class Counter extends (Base as unknown as new () => { invalidate(): void; [k: string]: unknown }) {
      count = 0
      inc_click(): void {
        this.count = (this.count as number) + 100
        this.invalidate()
      }
    }
    await act(async () => { (Second as unknown as { component(): unknown }).component() })
    await act(async () => fireEvent.click(screen.getByRole('button')))
    expect(screen.getByRole('button').textContent).toBe('101')
  })

  it('refuses a plan of another ABI', () => {
    expect(() => createViewBase({ ...plan('x'), abi: 99 })).toThrow(/ABI 99/)
  })

  it('warns, never throws, when a handler is missing', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const Base = createViewBase(plan('m'))
    class Empty extends (Base as unknown as new () => object) {}
    render(createElement(KbView, { view: Empty as never }))
    await act(async () => fireEvent.click(screen.getByRole('button')))
    expect(error.mock.calls.some((c) => String(c[0]).includes("handler 'inc_click' is not a method"))).toBe(true)
    error.mockRestore()
  })
})

describe('{Res} arguments and plurals (WV-6)', () => {
  it('fills the placeholders, picks the plural form of the language and follows changes', async () => {
    const { createInstance } = await import('i18next')
    const { interpolationOptions, invalidateResources, setResourceResolver } = await import('./index')
    const i18n = createInstance()
    await i18n.init({
      lng: 'fr', fallbackLng: 'en', interpolation: { escapeValue: false },
      resources: {
        en: { core: { files_one: '{{count}} file for {{name}}', files_other: '{{count}} files for {{name}}' } },
        fr: { core: { files_one: '{{count}} fichier pour {{name}}', files_many: '{{count}} de fichiers pour {{name}}', files_other: '{{count}} fichiers pour {{name}}' } },
        ar: { core: { files_zero: 'لا ملفات', files_one: 'ملف واحد', files_two: 'ملفان', files_few: '{{count}} ملفات', files_many: '{{count}} ملفًا', files_other: '{{count}} ملف' } },
      },
      defaultNS: 'core',
    })
    // What the host does (core/viewsHost.ts).
    setResourceResolver((key, set, args) => (args ? i18n.t(set ? `${set}:${key}` : key, interpolationOptions(args)) : i18n.t(set ? `${set}:${key}` : key)))
    const resPlan: ViewPlan = {
      abi: 1, file: 'test/Files.kbview', kind: 'view', names: {}, handlers: [],
      root: {
        id: '', el: 'Box', at: [1, 1], m: 'test-ui', x: 'Box', content: 'children',
        children: [{
          id: '0', el: 'Btn', at: [2, 3], m: 'test-ui', x: 'Btn',
          props: [{
            n: 'Text', to: { prop: 'children' }, kind: 'String', at: [2, 8],
            res: { key: 'files', args: [{ n: 'Count', b: { path: 'n', mode: 'OneWay', at: [2, 30] } }, { n: 'Name', v: 'Kim' }] },
          }],
        }],
      },
    }
    const Base = createViewBase(resPlan)
    let vm: { n: number; invalidate(): void } | undefined
    class Files extends (Base as unknown as new () => { n: number; invalidate(): void }) {
      n = 1
      constructor() { super(); vm = this }
    }
    render(createElement(KbView, { view: Files as never }))
    const text = () => screen.getByRole('button').textContent
    expect(text()).toBe('1 fichier pour Kim')
    await act(async () => { vm!.n = 1_000_000; vm!.invalidate() })
    expect(text()).toBe('1000000 de fichiers pour Kim')
    await act(async () => { vm!.n = 2; vm!.invalidate() })
    expect(text()).toBe('2 fichiers pour Kim')
    for (const [n, expected] of [[0, 'لا ملفات'], [1, 'ملف واحد'], [2, 'ملفان'], [3, '3 ملفات'], [11, '11 ملفًا'], [100, '100 ملف']] as const) {
      await act(async () => { await i18n.changeLanguage('ar'); vm!.n = n; vm!.invalidate(); invalidateResources() })
      expect(text()).toBe(expected)
    }
    await act(async () => { await i18n.changeLanguage('en'); vm!.n = 1; vm!.invalidate(); invalidateResources() })
    expect(text()).toBe('1 file for Kim')
  })
})

describe('View.publish (hook results as fields)', () => {
  it('re-renders on a changed value, not on a fresh but equal object (no render loop)', async () => {
    const pubPlan: ViewPlan = {
      abi: 1, file: 'test/Pub.kbview', kind: 'view', names: {}, handlers: [],
      root: {
        id: '', el: 'Box', at: [1, 1], m: 'test-ui', x: 'Box', content: 'children',
        children: [{ id: '0', el: 'Btn', at: [2, 3], m: 'test-ui', x: 'Btn', props: [{ n: 'Text', to: { prop: 'children' }, kind: 'String', at: [2, 8], b: { path: 'state.label', mode: 'OneWay', at: [2, 20] } }] }],
      },
    }
    let renders = 0
    let external = 'one'
    const Base = createViewBase(pubPlan)
    class Pub extends (Base as unknown as new () => { publish(v: Record<string, unknown>): void }) {
      state!: { label: string }
      use(): void {
        renders++
        // A hook returning a fresh object every render.
        this.publish({ state: { label: external } })
      }
    }
    const { rerender } = render(createElement(KbView, { view: Pub as never }))
    expect(screen.getByRole('button').textContent).toBe('one')
    const settled = renders
    expect(settled).toBeLessThan(5)
    external = 'two'
    await act(async () => { rerender(createElement(KbView, { view: Pub as never, key: 'same' } as never)) })
    expect(renders).toBeLessThan(settled + 6)
  })
})
