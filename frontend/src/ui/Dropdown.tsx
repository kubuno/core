import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { MENU_ATTR, useMenuDismiss } from './useMenuDismiss'
import { CaretDown } from './CaretDown'


export interface DropdownOption {
  value: string
  label: string
  icon?: React.ReactNode
}

type DropdownVariant = 'default' | 'dark' | 'ghost'

interface DropdownProps {
  value: string
  onChange: (v: string) => void
  options: DropdownOption[]
  /** Fixed width in px or CSS string (e.g. '100%'). Omit for natural/flex sizing. */
  width?: number | string
  /** Explicit min-width for the dropdown list. Defaults to trigger width. */
  dropdownMinWidth?: number
  placeholder?: string
  disabled?: boolean
  /** Trigger height in px (default 28 — matches toolbar style) */
  height?: number
  fontSize?: number
  className?: string
  variant?: DropdownVariant
  /** Extra styles merged into the trigger button (e.g. to square joined corners). */
  buttonStyle?: React.CSSProperties
  /** Behave as a real focusable form control: the trigger takes focus on click
   *  (so an adjacent field loses its focus ring) and shows the same border +
   *  focus ring as `<Input>`. Off by default to preserve toolbar dropdowns that
   *  deliberately keep focus on their editor (they set `onMouseDown` preventDefault). */
  focusable?: boolean
}

interface DropdownPos { top: number; left: number; minWidth: number }

const T: Record<DropdownVariant, {
  text: string; hoverBg: string; activeBg: string; chevron: string; border: string
  popBg: string; popShadow: string; popBorder: string
  itemText: string; itemHover: string
  selBg: string; selHoverBg: string; checkColor: string
}> = {
  default: {
    text: '#202124', hoverBg: 'rgba(0,0,0,0.06)', activeBg: 'rgba(0,0,0,0.08)',
    chevron: '#5f6368', border: 'var(--color-border)',
    popBg: 'var(--kb-float-surface)', popShadow: 'var(--kb-float-highlight), var(--kb-shadow-float)',
    popBorder: 'var(--kb-float-border)',
    itemText: '#202124', itemHover: 'rgba(0,0,0,0.06)',
    selBg: 'rgba(26,115,232,0.12)', selHoverBg: 'rgba(26,115,232,0.16)', checkColor: '#1a73e8',
  },
  dark: {
    text: '#cccccc', hoverBg: 'rgba(255,255,255,0.08)', activeBg: 'rgba(255,255,255,0.12)',
    chevron: '#808080', border: '#3c3c3c',
    popBg: 'rgb(37 37 38 / 72%)', popShadow: 'var(--kb-float-highlight-dark), var(--kb-shadow-float-dark)',
    popBorder: 'var(--kb-float-border-dark)',
    itemText: '#cccccc', itemHover: 'rgba(255,255,255,0.08)',
    selBg: 'rgba(0,120,212,0.2)', selHoverBg: 'rgba(0,120,212,0.3)', checkColor: '#007acc',
  },
  ghost: {
    // Variant volontairement sans bordure (sélecteurs de barres d'outils).
    text: '#5f6368', hoverBg: 'rgba(0,0,0,0.04)', activeBg: 'rgba(0,0,0,0.06)',
    chevron: '#80868b', border: 'transparent', // ghost = sans bordure (toolbars)
    popBg: 'var(--kb-float-surface)', popShadow: 'var(--kb-float-highlight), var(--kb-shadow-float)',
    popBorder: 'var(--kb-float-border)',
    itemText: '#202124', itemHover: 'rgba(0,0,0,0.06)',
    selBg: 'rgba(26,115,232,0.12)', selHoverBg: 'rgba(26,115,232,0.16)', checkColor: '#1a73e8',
  },
}

export function Dropdown({
  value, onChange, options,
  width, dropdownMinWidth,
  placeholder, disabled = false,
  height = 36, fontSize = 13.5,
  className, variant = 'default', buttonStyle,
  focusable = false,
}: DropdownProps) {
  const [open, setOpen]  = useState(false)
  const closePopup = useCallback(() => setOpen(false), [])
  useMenuDismiss(open, closePopup)
  const [focused, setFocused] = useState(false)
  // One icon gutter for the whole list: if a single option has an icon, every
  // row reserves the space, so their labels stay in one column.
  const anyIcon = options.some(o => !!o.icon)
  const [pos,  setPos]   = useState<DropdownPos | null>(null)
  const triggerRef       = useRef<HTMLButtonElement>(null)
  const popupRef         = useRef<HTMLDivElement>(null)
  const t                = T[variant]

  const selected = options.find(o => o.value === value)
  const label    = selected?.label ?? placeholder ?? value

  const openDropdown = () => {
    if (disabled) return
    if (triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect()
      setPos({ top: r.bottom + 2, left: r.left, minWidth: Math.max(dropdownMinWidth ?? 0, r.width) })
    }
    setOpen(v => !v)
  }

  // Reposition the (position:fixed) popup so it stays anchored to the trigger —
  // recomputed from the trigger's CURRENT rect, so it follows on scroll/resize
  // instead of drifting away. Flips above the trigger when there's no room below.
  // Is the trigger still visible, or has it scrolled out of the viewport / behind
  // a clipping ancestor (e.g. a sticky header)? Used to close the menu when the
  // trigger disappears, so a fixed popup never floats alone over other content.
  const isTriggerVisible = useCallback(() => {
    const trigger = triggerRef.current
    if (!trigger) return false
    const tr = trigger.getBoundingClientRect()
    if (tr.bottom <= 0 || tr.top >= window.innerHeight || tr.right <= 0 || tr.left >= window.innerWidth) return false
    // Clipped by any scrollable/overflow ancestor?
    let node = trigger.parentElement
    while (node) {
      const cs = getComputedStyle(node)
      if (/(auto|scroll|hidden)/.test(cs.overflowY + cs.overflowX)) {
        const cr = node.getBoundingClientRect()
        if (tr.bottom <= cr.top || tr.top >= cr.bottom || tr.right <= cr.left || tr.left >= cr.right) return false
      }
      node = node.parentElement
    }
    return true
  }, [])

  const reposition = useCallback(() => {
    const trigger = triggerRef.current
    const el = popupRef.current
    if (!trigger || !el) return
    const tr = trigger.getBoundingClientRect()
    const r  = el.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    const M = 8
    let l = tr.left
    let t = tr.bottom + 2
    if (l + r.width  > vw - M) l = vw - M - r.width
    if (t + r.height > vh - M) t = Math.max(M, tr.top - 2 - r.height)
    if (l < M) l = M
    if (t < M) t = M
    el.style.left = `${l}px`
    el.style.top  = `${t}px`
  }, [])

  useEffect(() => {
    if (!open) return
    const close = (e: Event) => {
      if (!triggerRef.current?.contains(e.target as Node)
        && !popupRef.current?.contains(e.target as Node)) setOpen(false)
    }
    // Keep the popup glued to the trigger while any ancestor scrolls or the
    // window resizes. Capture phase catches scrollable ancestors (scroll doesn't
    // bubble); the popup's own list scroll is ignored (it doesn't move the trigger).
    const onMove = () => {
      // Trigger scrolled out of sight → close instead of leaving the popup
      // floating over unrelated content. Otherwise keep it glued to the trigger.
      if (!isTriggerVisible()) setOpen(false)
      else reposition()
    }
    // `pointerdown`, pas `mousedown` : un déclencheur Radix appelle `preventDefault()`
    // sur pointerdown, ce qui SUPPRIME le mousedown de compatibilité — le menu ouvert
    // ne voyait alors jamais le clic et restait affiché. Capture pour passer devant
    // tout composant qui stoppe la propagation.
    document.addEventListener('pointerdown', close, true)
    window.addEventListener('scroll', onMove, true)
    window.addEventListener('resize', onMove)
    return () => {
      document.removeEventListener('pointerdown', close, true)
      window.removeEventListener('scroll', onMove, true)
      window.removeEventListener('resize', onMove)
    }
  }, [open, reposition, isTriggerVisible])

  useLayoutEffect(() => {
    if (open && pos) reposition()
  }, [open, pos, reposition])

  const containerStyle: React.CSSProperties = {}
  if (width !== undefined) containerStyle.width = width

  const PRIMARY = 'var(--color-primary, #1a73e8)'
  // The shared "active" affordance, generalised on the primary component: the
  // default-variant trigger wears the SAME border + ring as a focused <Input>
  // whenever the list is open (or the trigger is keyboard-focused). Toolbar
  // variants (ghost/dark) keep their subtle look.
  const focusBorder = variant === 'default' && (open || focused)

  return (
    <div className={`relative ${className ?? ''}`} style={containerStyle}>
      <button
        type="button"
        ref={triggerRef}
        onClick={openDropdown}
        // Toolbar dropdowns keep focus on their editor (preventDefault); focusable
        // ones let the native click move focus to the trigger.
        onMouseDown={focusable ? undefined : (e => e.preventDefault())}
        onFocus={focusable ? () => setFocused(true) : undefined}
        onBlur={focusable ? () => setFocused(false) : undefined}
        disabled={disabled}
        className={`w-full flex items-center justify-between gap-1 select-none${focusable ? ' outline-none' : ''}`}
        style={{
          height,
          padding: '0 4px 0 8px',
          fontSize,
          fontFamily: 'var(--font-family-sans)',
          color: t.text,
          background: open && !focusBorder ? t.activeBg : undefined,
          border: `1px solid ${focusBorder ? PRIMARY : t.border}`,
          borderRadius: 'var(--radius-md)',
          boxShadow: focusBorder ? `0 0 0 2px ${PRIMARY}` : undefined,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          transition: 'background 0.1s, box-shadow 0.1s, border-color 0.1s',
          ...buttonStyle,
        }}
        onMouseEnter={e => { if (!open && !disabled && !focusBorder) (e.currentTarget as HTMLElement).style.background = t.hoverBg }}
        onMouseLeave={e => { if (!open) (e.currentTarget as HTMLElement).style.background = '' }}
      >
        <span className="truncate flex-1 text-left">{label}</span>
        <CaretDown color={t.chevron} />
      </button>

      {open && pos && createPortal(
        <div
          ref={popupRef}
          onMouseDown={e => { e.preventDefault(); e.stopPropagation() }}
          style={{
            position: 'fixed',
            top: pos.top,
            left: pos.left,
            minWidth: pos.minWidth,
            zIndex: 9999,
          }}
          {...{ [MENU_ATTR]: '' }}
          className={variant === 'dark' ? 'kb-frosted kb-frosted-dark' : 'kb-frosted'}
        >
          <div className="kb-frost-layer" aria-hidden />
          <div style={{ maxHeight: 280, overflowY: 'auto', padding: 5 }}>
          {options.map(o => (
            <button
              key={o.value}
              type="button"
              onClick={() => { onChange(o.value); setOpen(false) }}
              className="w-full text-left flex items-center gap-2"
              style={{
                padding: '5px 10px',
                borderRadius: 6,
                fontSize,
                color: t.itemText,
                background: o.value === value ? t.selBg : undefined,
                fontWeight: o.value === value ? 600 : undefined,
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = o.value === value ? t.selHoverBg : t.itemHover }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = o.value === value ? t.selBg : '' }}
            >
              {/* Fixed gutters, always the same width whether the check and the
                  icon are there or not: labels of the same level must line up.
                  The check used to carry a negative margin, which shifted the
                  selected row's text out of column. */}
              <span style={{ width: 14, flexShrink: 0, textAlign: 'center', color: t.checkColor, fontSize: 14 }}>
                {o.value === value ? '✓' : ''}
              </span>
              {anyIcon && (
                <span className="flex-shrink-0 flex items-center justify-center" style={{ width: 18 }}>
                  {o.icon}
                </span>
              )}
              {o.label}
            </button>
          ))}
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}
