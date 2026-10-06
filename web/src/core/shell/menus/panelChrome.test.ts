import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { headerPanelChrome, HEADER_PANEL_GROUND } from './panelChrome'
import { tokenColor } from '../../../views/style'

const here = __dirname
const themesDir = join(here, '../../../../../themes')

function hex(value: string): [number, number, number] {
  const m = /^#([0-9a-f]{6})$/i.exec(value.trim())
  if (!m) throw new Error(`not a #rrggbb colour: ${value}`)
  const n = parseInt(m[1], 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/** WCAG 2 contrast ratio of two opaque colours. */
function contrast(a: string, b: string): number {
  const lum = (c: string) => {
    const [r, g, bl] = hex(c).map((v) => {
      const s = v / 255
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
    })
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl
  }
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

describe('header panels chrome (launcher, account panel)', () => {
  it('paints its ground with the PanelBackground theme token, not a literal', () => {
    expect(HEADER_PANEL_GROUND).toBe('PanelBackground')
    expect(tokenColor('PanelBackground')).toBe('var(--color-panel-bg)')
    expect(headerPanelChrome.background).toBe('var(--color-panel-bg)')
    for (const file of ['WaffleButton.tsx', 'AccountButton.tsx', 'WaffleMenu.kbcontrol.design.json', 'AccountMenu.kbcontrol.design.json']) {
      expect(readFileSync(join(here, file), 'utf8'), file).not.toMatch(/#E9EEF6/i)
    }
  })

  it('keeps the panel text readable in every theme that declares the ground', () => {
    // The default (light) theme: theme.css.
    const css = readFileSync(join(here, '../../../theme.css'), 'utf8')
    const cssVar = (name: string) => new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6})`).exec(css)?.[1]
    const checked: string[] = []
    const check = (theme: string, ground: string | undefined, text: string | undefined) => {
      if (!ground || !text) return
      checked.push(theme)
      expect(contrast(ground, text), `${theme}: text ${text} on ${ground}`).toBeGreaterThanOrEqual(4.5)
    }
    // theme.css: the panels default to the search field's ground.
    expect(css).toMatch(/--color-panel-bg:\s*var\(--color-search-bg\)/)
    check('theme.css', cssVar('--color-search-bg'), cssVar('--color-text-primary'))
    if (existsSync(themesDir)) {
      for (const id of readdirSync(themesDir)) {
        const file = join(themesDir, id, 'theme.json')
        if (!existsSync(file)) continue
        const vars = (JSON.parse(readFileSync(file, 'utf8')) as { vars?: Record<string, string> }).vars ?? {}
        const ground = vars['--color-panel-bg'] ?? vars['--color-search-bg'] ?? cssVar('--color-search-bg')
        check(id, ground, vars['--color-text-primary'] ?? cssVar('--color-text-primary'))
      }
      // The dark theme is the one the literal broke.
      expect(checked).toContain('kubuno-dark')
    }
    expect(checked).toContain('theme.css')
  })
})
