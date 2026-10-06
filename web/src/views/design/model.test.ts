import { describe, expect, it } from 'vitest'
import type { ViewPlan } from '../plan'
import { designDocumentKind } from './model'

const plan = (kind: 'view' | 'control'): ViewPlan => ({ abi: 1, file: 'x', kind, names: {}, handlers: [], root: { t: 'Panel' } }) as unknown as ViewPlan

describe('designDocumentKind', () => {
  it('a .kbview is a page, a .kbcontrol a control, whatever the plan says', () => {
    expect(designDocumentKind('src/views/SettingsPage.kbview', null)).toBe('page')
    expect(designDocumentKind('src/a/Dialog.KBVIEW', plan('control'))).toBe('page')
    expect(designDocumentKind('src/core/shell/menus/WaffleMenu.kbcontrol', plan('view'))).toBe('control')
  })

  it('without a file, the plan decides; with neither, the canvas keeps its colours', () => {
    expect(designDocumentKind(null, plan('view'))).toBe('page')
    expect(designDocumentKind(undefined, plan('control'))).toBe('control')
    expect(designDocumentKind(null, null)).toBe('control')
  })
})
