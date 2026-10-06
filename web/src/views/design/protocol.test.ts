import { describe, expect, it, vi } from 'vitest'

import { moduleOfCodeBehind } from './model'
import { decodeHostMessage, languageOfCulture, openChannel, wireDiagnostic, wireRect, type DesignTestHook } from './protocol'

describe('host messages', () => {
  it('decodes every message type the page understands', () => {
    expect(decodeHostMessage({ type: 'setText', text: '<Stack/>', baseDir: 'C:\\p' })).toEqual({ type: 'setText', text: '<Stack/>', baseDir: 'C:\\p' })
    expect(decodeHostMessage({ type: 'setText', text: 'x' })).toEqual({ type: 'setText', text: 'x', baseDir: null })
    expect(decodeHostMessage({
      type: 'setDocumentInfo', file: 'src/A.kbcontrol', codeBehind: './A', className: null,
      userControls: [{ name: 'A', module: '/src/A' }, { bad: 1 }], designData: { props: { n: 1 } },
    })).toEqual({ type: 'setDocumentInfo', file: 'src/A.kbcontrol', codeBehind: './A', className: null, userControls: [{ name: 'A', module: '/src/A' }], designData: { props: { n: 1 } } })
    expect(decodeHostMessage({ type: 'select', id: null })).toEqual({ type: 'select', id: null })
    expect(decodeHostMessage({ type: 'select', id: '' })).toEqual({ type: 'select', id: '' })
    expect(decodeHostMessage({ type: 'selectMany', ids: ['0', '1'], primary: '1' })).toEqual({ type: 'selectMany', ids: ['0', '1'], primary: '1' })
    expect(decodeHostMessage({ type: 'setDesignMode', on: false })).toEqual({ type: 'setDesignMode', on: false })
    expect(decodeHostMessage({ type: 'setDesignOptions' })).toEqual({ type: 'setDesignOptions', containerOutlines: true })
    expect(decodeHostMessage({ type: 'setVsTheme', mode: 'light', colors: { canvas: '#fff', bad: 3 } })).toEqual({ type: 'setVsTheme', mode: 'light', colors: { canvas: '#fff' } })
    expect(decodeHostMessage({ type: 'setZoom', zoom: 0 })).toEqual({ type: 'setZoom', zoom: 0 })
    expect(decodeHostMessage({ type: 'setResources', culture: 'fr-FR', sets: ['x'] })).toEqual({ type: 'setResources', culture: 'fr-FR' })
    expect(decodeHostMessage({ type: 'dragEnter', component: 'Button' })).toEqual({ type: 'dragEnter', component: 'Button' })
    expect(decodeHostMessage({ type: 'dragOver', x: 1.5, y: 2 })).toEqual({ type: 'dragOver', x: 1.5, y: 2 })
    expect(decodeHostMessage({ type: 'drop', x: 1, y: 2 })).toEqual({ type: 'drop', x: 1, y: 2 })
    expect(decodeHostMessage({ type: 'dragLeave' })).toEqual({ type: 'dragLeave' })
    expect(decodeHostMessage({ type: 'projectComponents', components: [{ name: 'X' }, { nope: true }] })).toEqual({ type: 'projectComponents', components: [{ name: 'X' }] })
    expect(decodeHostMessage({ type: 'setViewport', width: 390 })).toEqual({ type: 'setViewport', width: 390 })
    expect(decodeHostMessage({ type: 'setKubunoTheme', mode: 'dark' })).toEqual({ type: 'setKubunoTheme', mode: 'dark' })
    expect(decodeHostMessage({ type: 'setLanguage', lang: 'ar' })).toEqual({ type: 'setLanguage', lang: 'ar' })
    expect(decodeHostMessage({ type: 'format', command: 'alignLefts' })).toEqual({ type: 'format', command: 'alignLefts' })
    expect(decodeHostMessage({ type: 'setCanvasBackground', color: '#1f1f1f' })).toEqual({ type: 'setCanvasBackground', color: '#1f1f1f' })
  })

  it('accepts JSON text and ignores unknown or malformed messages', () => {
    expect(decodeHostMessage('{"type":"setDesignMode","on":true}')).toEqual({ type: 'setDesignMode', on: true })
    for (const bad of [null, 3, '{nope', [], { type: 'nope' }, { type: 'setText' }, { type: 'dragOver', x: 'a', y: 1 },
      { type: 'select', id: 3 }, { type: 'setZoom', zoom: -1 }, { type: 'setDesignMode', on: 'yes' }, { type: 'setViewport', width: 0 }]) {
      expect(decodeHostMessage(bad)).toBeNull()
    }
  })
})

describe('transport', () => {
  it('without WebView2, window.__kbDesign delivers host messages and collects the page’s', () => {
    const win = {} as Window
    const ch = openChannel(win)
    const got: unknown[] = []
    ch.listen((m) => got.push(m))
    const hook = win.__kbDesign as DesignTestHook
    hook.send({ type: 'select', id: '0' })
    hook.send({ type: 'unknown' })
    ch.post({ type: 'ready' })
    expect(ch.hosted).toBe(false)
    expect(got).toEqual([{ type: 'select', id: '0' }])
    expect(hook.outbox).toEqual([{ type: 'ready' }])
  })

  it('inside WebView2, posts with chrome.webview and decodes its message events', () => {
    let listener: ((e: { data: unknown }) => void) | null = null
    const webview = { postMessage: vi.fn(), addEventListener: (_t: 'message', l: (e: { data: unknown }) => void) => { listener = l } }
    const win = { chrome: { webview } } as unknown as Window
    const ch = openChannel(win)
    const got: unknown[] = []
    ch.listen((m) => got.push(m))
    listener!({ data: { type: 'dragLeave' } })
    listener!({ data: '{"type":"drop","x":3,"y":4}' })
    ch.post({ type: 'toolboxDragDetected' })
    expect(ch.hosted).toBe(true)
    expect(got).toEqual([{ type: 'dragLeave' }, { type: 'drop', x: 3, y: 4 }])
    expect(webview.postMessage).toHaveBeenCalledWith({ type: 'toolboxDragDetected' })
  })
})

describe('encoding helpers', () => {
  it('rounds rectangles, maps cultures, shapes diagnostics, resolves code-behind modules', () => {
    expect(wireRect({ left: 1.234, top: 2, right: 3.456, bottom: 4 })).toEqual({ left: 1.23, top: 2, right: 3.46, bottom: 4 })
    expect(languageOfCulture('fr-FR', ['fr', 'en', 'ar'])).toBe('fr')
    expect(languageOfCulture('ar_SA', ['fr', 'en', 'ar'])).toBe('ar')
    expect(languageOfCulture('de-DE', ['fr', 'en', 'ar'])).toBeNull()
    expect(wireDiagnostic({ severity: 'error', code: 'unknown-element', message: 'unknown element `Frob` on the web target', line: 4, column: 4, end_line: 4, end_column: 8 }))
      .toEqual({ line: 4, column: 4, endLine: 4, endColumn: 8, message: 'unknown element `Frob` on the web target', code: 'unknownElement', element: 'Frob', syntax: false })
    expect(wireDiagnostic({ severity: 'error', code: 'syntax', message: 'x', line: 1, column: 1, end_line: 1, end_column: 2 }).syntax).toBe(true)
    expect(moduleOfCodeBehind('src/core/shell/menus/WaffleMenu.kbcontrol', './WaffleMenu')).toBe('/src/core/shell/menus/WaffleMenu')
    expect(moduleOfCodeBehind('src/a/b/V.kbview', '../c/V')).toBe('/src/a/c/V')
  })
})
