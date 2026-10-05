/**
 * The `.kbview` element gallery (vite.gallery.config.ts): every page under `pages/` is a view (`X.kbview` and its
 * code-behind `X.ts`) showing one element in its states, rendered by the views runtime with the host's CSS and
 * real `@ui` components. Query string: `?el=<page>&theme=light|dark&dir=ltr|rtl`; without `el`, the index.
 * Development and verification only (WEB-VIEWS.md, WV-5a/5b): not part of the product build.
 */
import '../index.css'

import { createElement, Suspense, lazy, type ComponentType } from 'react'
import { createRoot } from 'react-dom/client'

// The host's i18n: `@ui` components read their own strings from it, and it sets the document's direction.
import i18n from '../core/i18n'

import lightTheme from '../../../themes/kubuno-reference/theme.json?raw'
import darkTheme from '../../../themes/kubuno-dark/theme.json?raw'

const pages = import.meta.glob<ComponentType<object>>('./pages/*.ts', { import: 'default' })
const names = Object.keys(pages).map((p) => p.replace(/^\.\/pages\/(.*)\.ts$/, '$1')).sort()

const query = new URLSearchParams(location.search)
const theme = query.get('theme') === 'dark' ? darkTheme : lightTheme
const dir = query.get('dir') === 'rtl' ? 'rtl' : 'ltr'

// The theme's variables on the document root, as the shell applies an installed theme.
const parsed = JSON.parse(theme) as { vars?: Record<string, string>; color_scheme?: string }
const root = document.documentElement
for (const [name, value] of Object.entries(parsed.vars ?? {})) root.style.setProperty(name, value)
root.style.colorScheme = parsed.color_scheme ?? 'light'
// Arabic for RTL, French otherwise (the language sets `dir` and `lang` on the document, as in the shell).
const lang = dir === 'rtl' ? 'ar' : 'fr'
void i18n.changeLanguage(lang)
root.dir = dir
root.lang = lang
i18n.on('initialized', () => { void i18n.changeLanguage(lang) })
document.body.style.background = 'var(--body-bg, #f8fafd)'

const el = query.get('el')

function Index() {
  return createElement('main', { style: { padding: 24 } },
    createElement('h1', { className: 'text-[length:var(--kb-text-title)] mb-4' }, 'Kubuno views gallery'),
    createElement('ul', { className: 'grid gap-1' }, names.map((n) =>
      createElement('li', { key: n }, createElement('a', { className: 'text-primary', href: `?el=${n}` }, n)))))
}

const load = el ? pages[`./pages/${el}.ts`] : undefined
const View = load ? lazy(async () => ({ default: await load() })) : null

function Page({ name }: { name: string }) {
  if (!View) return createElement('p', { style: { padding: 24 } }, `No gallery page "${name}".`)
  return createElement('main', { 'data-gallery-page': name, style: { padding: 16 } },
    createElement('h1', { className: 'text-[length:var(--kb-text-heading)] text-text-secondary mb-3' }, name),
    createElement(Suspense, { fallback: null }, createElement(View)))
}

createRoot(document.getElementById('root')!).render(el ? createElement(Page, { name: el }) : createElement(Index))
