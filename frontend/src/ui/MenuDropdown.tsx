import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

/** True on touch devices (no precise pointer) → render menus as bottom sheets. */
function useCoarsePointer(): boolean {
  const [c, setC] = useState(() =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function' &&
    window.matchMedia('(pointer: coarse)').matches)
  useEffect(() => {
    const mq = window.matchMedia('(pointer: coarse)')
    const on = () => setC(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return c
}

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
  const isCoarse = useCoarsePointer()
  // Bottom-sheet submenu drill-in (touch has no hover-cascade).
  const [drill, setDrill] = useState<{ label: string; items: MenuItem[] } | null>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  // Garde le menu TOUJOURS entièrement visible : on le ramène à l'intérieur du
  // viewport s'il déborde, et on borne sa hauteur (défilement interne) s'il est
  // plus grand que l'écran. Ré-appliqué au redimensionnement de la fenêtre.
  useLayoutEffect(() => {
    const el = ref.current
    if (!el || isCoarse) return // bottom sheet uses CSS positioning, no clamp
    const M = 8 // marge minimale avec le bord du viewport
    const clamp = () => {
      const vw = window.innerWidth
      const vh = window.innerHeight
      // Borne la hauteur (et la largeur) pour un menu plus grand que l'écran :
      // il défile à l'intérieur plutôt que de déborder hors de la zone visible.
      el.style.maxHeight = `${vh - 2 * M}px`
      el.style.maxWidth  = `${vw - 2 * M}px`
      el.style.overflowY = 'auto'
      // Repart de l'ancre demandée avant de mesurer → re-clamp idempotent.
      el.style.left = `${pos.left}px`
      el.style.top  = `${pos.top}px`
      const r = el.getBoundingClientRect()
      let l = pos.left
      let t = pos.top
      if (l + r.width  > vw - M) l = vw - M - r.width
      if (t + r.height > vh - M) t = vh - M - r.height
      if (l < M) l = M
      if (t < M) t = M
      el.style.left = `${l}px`
      el.style.top  = `${t}px`
    }
    clamp()
    window.addEventListener('resize', clamp)
    return () => window.removeEventListener('resize', clamp)
  }, [pos, isCoarse])

  // ── Bottom sheet (touch) ─────────────────────────────────────────────────────
  if (isCoarse) {
    const shown = drill ? drill.items : items
    const rowBase: React.CSSProperties = {
      padding: '13px 20px', fontSize: 15, lineHeight: '22px', minHeight: 50,
      display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left',
    }
    return createPortal(
      <>
        <div className="fixed inset-0 z-[9998]" style={{ background: 'rgba(0,0,0,0.35)' }} onClick={onClose} />
        <div
          ref={ref}
          onMouseDown={e => e.stopPropagation()}
          className="fixed left-0 right-0 bottom-0 z-[9999]"
          style={{
            background: c.bg, color: c.text,
            borderTopLeftRadius: 16, borderTopRightRadius: 16,
            maxHeight: '78vh', overflowY: 'auto',
            paddingBottom: 'calc(8px + env(safe-area-inset-bottom))',
            boxShadow: '0 -8px 30px rgba(0,0,0,0.28)',
            animation: 'kbnSheetUp 0.18s ease-out',
          }}
        >
          <style>{'@keyframes kbnSheetUp{from{transform:translateY(100%)}to{transform:translateY(0)}}'}</style>
          {/* Grab handle */}
          <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 2px' }}>
            <div style={{ width: 38, height: 4, borderRadius: 2, background: c.sep }} />
          </div>

          {/* Back row when drilled into a submenu */}
          {drill && (
            <button onClick={() => setDrill(null)} style={{ ...rowBase, color: c.text, fontWeight: 600, borderBottom: `1px solid ${c.sep}` }}>
              <span style={{ width: 20, flexShrink: 0, color: c.accent, fontSize: 18, display: 'inline-flex', alignItems: 'center' }}>‹</span>
              <span style={{ flex: 1 }}>{drill.label}</span>
            </button>
          )}

          {shown.map((item, i) => {
            if (item.type === 'separator') return <div key={i} style={{ background: c.sep, height: 1, margin: '4px 0' }} />
            if (item.type === 'label') return (
              <div key={i} style={{ padding: '8px 20px 4px', fontSize: 12, color: c.label, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.text}</div>
            )
            if (item.type === 'custom') return <React.Fragment key={i}>{item.render(onClose)}</React.Fragment>
            if (item.type === 'submenu') return (
              <button key={i} disabled={item.disabled} onClick={() => setDrill({ label: item.label, items: item.items })}
                style={{ ...rowBase, color: c.text, opacity: item.disabled ? 0.4 : 1 }}>
                <span style={{ width: 20, flexShrink: 0, color: c.accent, fontSize: 16, display: 'inline-flex', alignItems: 'center' }}>{item.icon ?? ''}</span>
                <span style={{ flex: 1 }}>{item.label}</span>
                <span style={{ color: c.label, fontSize: 16, flexShrink: 0 }}>›</span>
              </button>
            )
            const fg = item.danger ? c.danger : c.text
            return (
              <button key={i} disabled={item.disabled} onClick={() => { item.onClick(); onClose() }}
                style={{ ...rowBase, color: fg, opacity: item.disabled ? 0.4 : 1 }}>
                <span style={{ width: 20, flexShrink: 0, color: item.danger ? c.danger : c.accent, fontSize: 16, display: 'inline-flex', alignItems: 'center' }}>
                  {item.checked ? '✓' : item.icon ? item.icon : ''}
                </span>
                <span style={{ flex: 1 }}>{item.label}</span>
              </button>
            )
          })}
        </div>
      </>,
      document.body,
    )
  }

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
    if (!r) return
    const SUB_W = 220
    // Ouverture en cascade vers la droite par défaut ; on bascule à GAUCHE du
    // parent si la droite déborde du viewport (et qu'il y a la place à gauche),
    // pour ne pas recouvrir le menu parent. Le clamp final affine la position.
    const openLeft = r.right + SUB_W > window.innerWidth - 8 && r.left - SUB_W > 8
    const left = openLeft ? r.left - SUB_W + 2 : r.right - 2
    setPos({ top: r.top - 4, left, minWidth: SUB_W })
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

  // Opens the menu below the triggering element (button) or, for a right-click
  // (contextmenu) event, exactly at the cursor coordinates.
  const open = (e: React.MouseEvent | React.MouseEvent<HTMLElement>) => {
    if (e.type === 'contextmenu') {
      setPos({ top: e.clientY, left: e.clientX })
      return
    }
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setPos({ top: r.bottom + 2, left: r.left })
  }

  // Opens the menu at explicit viewport coordinates (e.g. a right-click position).
  const openAt = (x: number, y: number) => setPos({ top: y, left: x })

  const close = () => setPos(null)

  return { pos, open, openAt, close, isOpen: pos !== null }
}
