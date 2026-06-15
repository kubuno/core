import React, { useEffect, useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

export type MenuItem =
  | { type: 'action'; label: string; shortcut?: string; disabled?: boolean; checked?: boolean; danger?: boolean; icon?: React.ReactNode; onClick: () => void }
  | { type: 'separator' }
  | { type: 'label'; text: string }
  | { type: 'submenu'; label: string; icon?: React.ReactNode; disabled?: boolean; items: MenuItem[] }
  | { type: 'custom'; render: (close: () => void) => React.ReactNode }

export interface MenuDropdownPos { top: number; left: number; minWidth?: number }

export type MenuTheme = 'light' | 'dark'

interface MenuPalette {
  bg: string; text: string; sep: string; label: string
  hover: string; accent: string; shortcut: string; danger: string; shadow: string
}

const PALETTES: Record<MenuTheme, MenuPalette> = {
  light: {
    bg: '#fff', text: '#202124', sep: '#e0e0e0', label: '#5f6368',
    hover: 'rgba(0,0,0,0.06)', accent: '#1a73e8', shortcut: '#5f6368', danger: '#d93025',
    shadow: '0 2px 6px 2px rgba(0,0,0,.15),0 1px 2px rgba(0,0,0,.3)',
  },
  dark: {
    // Aligné sur le thème forge C (éditeurs WebGL paintsharp).
    bg: '#323232', text: '#d6d6d6', sep: '#212121', label: '#8e8e8e',
    hover: '#454545', accent: '#5a9bdc', shortcut: '#8e8e8e', danger: '#e84a4a',
    shadow: '0 6px 24px rgba(0,0,0,.5)',
  },
}

interface MenuDropdownProps {
  items: MenuItem[]
  pos: MenuDropdownPos
  onClose: () => void
  /** Override minWidth (pos.minWidth takes precedence if set) */
  minWidth?: number
  /** Palette : 'light' (défaut) ou 'dark' (éditeurs sombres) */
  theme?: MenuTheme
}

export function MenuDropdown({ items, pos, onClose, minWidth: minWidthProp = 200, theme = 'light' }: MenuDropdownProps) {
  const minWidth = pos.minWidth ?? minWidthProp
  const c = PALETTES[theme]
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    const M = 8
    let l = pos.left
    let t = pos.top
    if (r.right  > vw - M) l = vw - M - r.width
    if (r.bottom > vh - M) t = vh - M - r.height
    if (l < M) l = M
    if (t < M) t = M
    el.style.left = `${l}px`
    el.style.top  = `${t}px`
  }, [pos])

  return createPortal(
    <div
      ref={ref}
      onMouseDown={e => { e.preventDefault(); e.stopPropagation() }}
      style={{
        position: 'fixed',
        top: pos.top,
        left: pos.left,
        minWidth,
        zIndex: 9999,
        background: c.bg,
        borderRadius: 4,
        padding: '4px 0',
        boxShadow: c.shadow,
      }}
    >
      {items.map((item, i) => {
        if (item.type === 'separator') {
          return <div key={i} style={{ background: c.sep, height: 1, margin: '4px 0' }} />
        }
        if (item.type === 'label') {
          return (
            <div
              key={i}
              style={{ padding: '4px 16px', fontSize: 11, color: c.label, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}
            >
              {item.text}
            </div>
          )
        }
        if (item.type === 'submenu') {
          return <SubmenuItem key={i} item={item} onClose={onClose} theme={theme} />
        }
        if (item.type === 'custom') {
          return <React.Fragment key={i}>{item.render(onClose)}</React.Fragment>
        }
        const fg = item.danger ? c.danger : c.text
        return (
          <button
            key={i}
            disabled={item.disabled}
            onClick={() => { item.onClick(); onClose() }}
            className="w-full flex items-center gap-2 text-left transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ padding: '6px 24px 6px 16px', fontSize: 13, color: fg, lineHeight: '20px' }}
            onMouseEnter={e => { if (!item.disabled) (e.currentTarget as HTMLElement).style.background = c.hover }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '' }}
          >
            <span style={{ width: 20, flexShrink: 0, color: item.danger ? c.danger : c.accent, fontSize: 14, display: 'inline-flex', alignItems: 'center' }}>
              {item.checked ? '✓' : item.icon ? item.icon : ''}
            </span>
            <span className="flex-1">{item.label}</span>
            {item.shortcut && (
              <span style={{ color: c.shortcut, fontSize: 12, marginLeft: 24, flexShrink: 0, fontFamily: 'monospace' }}>
                {item.shortcut}
              </span>
            )}
          </button>
        )
      })}
    </div>,
    document.body,
  )
}

/** Élément de menu ouvrant un sous-menu en cascade vers la droite (au survol). */
function SubmenuItem({ item, onClose, theme }: { item: Extract<MenuItem, { type: 'submenu' }>; onClose: () => void; theme: MenuTheme }) {
  const [pos, setPos] = React.useState<MenuDropdownPos | null>(null)
  const c = PALETTES[theme]
  const btnRef   = useRef<HTMLButtonElement>(null)
  const closeTmr = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const openNow = () => {
    if (closeTmr.current) clearTimeout(closeTmr.current)
    const r = btnRef.current?.getBoundingClientRect()
    if (r) setPos({ top: r.top - 4, left: r.right - 2, minWidth: 220 })
  }
  const scheduleClose = () => {
    if (closeTmr.current) clearTimeout(closeTmr.current)
    closeTmr.current = setTimeout(() => setPos(null), 180)
  }

  return (
    <div onMouseEnter={openNow} onMouseLeave={scheduleClose} style={{ position: 'relative' }}>
      <button
        ref={btnRef}
        disabled={item.disabled}
        className="w-full flex items-center gap-2 text-left transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ padding: '6px 24px 6px 16px', fontSize: 13, color: c.text, lineHeight: '20px', background: pos ? c.hover : '' }}
      >
        <span style={{ width: 20, flexShrink: 0, color: c.accent, fontSize: 14, display: 'inline-flex', alignItems: 'center' }}>{item.icon ?? ''}</span>
        <span className="flex-1">{item.label}</span>
        <span style={{ color: c.label, fontSize: 12, marginLeft: 24, flexShrink: 0 }}>▸</span>
      </button>
      {pos && (
        <div onMouseEnter={openNow} onMouseLeave={scheduleClose}>
          <MenuDropdown items={item.items} pos={pos} onClose={onClose} theme={theme} />
        </div>
      )}
    </div>
  )
}

/** Hook to manage open/closed state + positioning for a MenuDropdown trigger */
export function useMenuDropdown() {
  const [pos, setPos] = React.useState<MenuDropdownPos | null>(null)

  const open = (e: React.MouseEvent | React.MouseEvent<HTMLElement>) => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setPos({ top: r.bottom + 2, left: r.left })
  }

  const close = () => setPos(null)

  return { pos, open, close, isOpen: pos !== null }
}
