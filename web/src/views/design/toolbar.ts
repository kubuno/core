/**
 * The viewport toolbar of the design page (WEB-VIEWS §4.3, web-specific): the view's width (its design width,
 * phone / tablet / desktop presets, or fitted to the pane), the Kubuno theme (light / dark), the design-time
 * language (fr / en / ar, right-to-left for ar), Design / Run, and indicators (sample data, zoom, the runtime in
 * use). Plain DOM in Visual Studio's colours (`--vs-*`), outside the view's React tree.
 */
import type { KubunoThemeMode } from './bootstrap'

export type WidthChoice = 'design' | 'fit' | number

export interface ToolbarState {
  readonly width: WidthChoice
  readonly designWidth: number
  readonly theme: KubunoThemeMode
  readonly lang: string
  readonly design: boolean
  readonly sample: boolean
  readonly sampleTitle: string
  readonly zoom: number
  readonly note: string | null
}

export interface ToolbarHandlers {
  width(w: WidthChoice): void
  theme(t: KubunoThemeMode): void
  lang(l: string): void
  design(on: boolean): void
}

export const WIDTH_PRESETS = [390, 768, 1280, 1440] as const

interface Btn {
  el: HTMLButtonElement
  on: (s: ToolbarState) => boolean
}

export function createToolbar(doc: Document, languages: readonly string[], handlers: ToolbarHandlers): { el: HTMLElement; update(s: ToolbarState): void } {
  const bar = doc.createElement('div')
  bar.className = 'kbd-toolbar'
  bar.setAttribute('role', 'toolbar')
  bar.setAttribute('aria-label', 'Affichage du concepteur')
  const buttons: Btn[] = []
  let designBtn: HTMLButtonElement | null = null

  const group = (label: string): HTMLElement => {
    const g = doc.createElement('div')
    g.className = 'kbd-group'
    g.setAttribute('role', 'group')
    g.setAttribute('aria-label', label)
    const l = doc.createElement('span')
    l.className = 'kbd-label'
    l.textContent = label
    g.appendChild(l)
    bar.appendChild(g)
    return g
  }
  const button = (g: HTMLElement, text: string, title: string, on: Btn['on'], click: () => void): HTMLButtonElement => {
    const b = doc.createElement('button')
    b.type = 'button'
    b.className = 'kbd-btn'
    b.textContent = text
    b.title = title
    b.addEventListener('click', click)
    // The toolbar never takes the keyboard from the surface for long: a click returns the focus to it.
    b.addEventListener('mousedown', (e) => e.preventDefault())
    g.appendChild(b)
    buttons.push({ el: b, on })
    return b
  }

  const width = group('Largeur')
  designBtn = button(width, '—', 'Largeur de conception (DesignWidth)', (s) => s.width === 'design', () => handlers.width('design'))
  for (const w of WIDTH_PRESETS) button(width, String(w), `${w} px`, (s) => s.width === w, () => handlers.width(w))
  button(width, 'Ajusté', 'Ajustée au volet', (s) => s.width === 'fit', () => handlers.width('fit'))

  const theme = group('Thème')
  button(theme, 'Clair', 'Thème Kubuno clair (kubuno-reference)', (s) => s.theme === 'light', () => handlers.theme('light'))
  button(theme, 'Sombre', 'Thème Kubuno sombre (kubuno-dark)', (s) => s.theme === 'dark', () => handlers.theme('dark'))

  const lang = group('Langue')
  for (const l of languages) button(lang, l.toUpperCase(), l === 'ar' ? 'Arabe (de droite à gauche)' : l === 'fr' ? 'Français' : l === 'en' ? 'Anglais' : l, (s) => s.lang === l, () => handlers.lang(l))

  const mode = group('Mode')
  button(mode, 'Conception', 'Mode conception : sélection et édition', (s) => s.design, () => handlers.design(true))
  button(mode, 'Exécution', 'Mode exécution : la vue est interactive', (s) => !s.design, () => handlers.design(false))

  const spacer = doc.createElement('div')
  spacer.className = 'kbd-spacer'
  bar.appendChild(spacer)
  const note = doc.createElement('span')
  note.className = 'kbd-note'
  bar.appendChild(note)
  const sample = doc.createElement('span')
  sample.className = 'kbd-chip'
  sample.textContent = "Données d'exemple"
  bar.appendChild(sample)
  const zoom = doc.createElement('span')
  zoom.className = 'kbd-label'
  bar.appendChild(zoom)

  return {
    el: bar,
    update(s) {
      if (designBtn) designBtn.textContent = `${s.designWidth} (conception)`
      for (const b of buttons) b.el.setAttribute('aria-pressed', String(b.on(s)))
      sample.dataset.on = String(s.sample)
      sample.title = s.sampleTitle
      zoom.textContent = `${Math.round(s.zoom * 100)} %`
      note.textContent = s.note ?? ''
      note.title = s.note ?? ''
    },
  }
}
