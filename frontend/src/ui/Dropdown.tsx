import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown } from 'lucide-react'

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
}

interface DropdownPos { top: number; left: number; minWidth: number }

const T: Record<DropdownVariant, {
  text: string; hoverBg: string; activeBg: string; chevron: string; border: string
  popBg: string; popShadow: string
  itemText: string; itemHover: string
  selBg: string; selHoverBg: string; checkColor: string
}> = {
  default: {
    text: '#202124', hoverBg: 'rgba(0,0,0,0.06)', activeBg: 'rgba(0,0,0,0.08)',
    chevron: '#5f6368', border: 'var(--color-border)',
    popBg: '#fff', popShadow: '0 2px 6px 2px rgba(0,0,0,.15),0 1px 2px rgba(0,0,0,.3)',
    itemText: '#202124', itemHover: 'rgba(0,0,0,0.06)',
    selBg: 'rgba(26,115,232,0.12)', selHoverBg: 'rgba(26,115,232,0.16)', checkColor: '#1a73e8',
  },
  dark: {
    text: '#cccccc', hoverBg: 'rgba(255,255,255,0.08)', activeBg: 'rgba(255,255,255,0.12)',
    chevron: '#808080', border: '#3c3c3c',
    popBg: '#252526', popShadow: '0 4px 8px rgba(0,0,0,0.5)',
    itemText: '#cccccc', itemHover: 'rgba(255,255,255,0.08)',
    selBg: 'rgba(0,120,212,0.2)', selHoverBg: 'rgba(0,120,212,0.3)', checkColor: '#007acc',
  },
  ghost: {
    // Variant volontairement sans bordure (sélecteurs de barres d'outils).
    text: '#5f6368', hoverBg: 'rgba(0,0,0,0.04)', activeBg: 'rgba(0,0,0,0.06)',
    chevron: '#80868b', border: 'transparent', // ghost = sans bordure (toolbars)
    popBg: '#fff', popShadow: '0 2px 6px 2px rgba(0,0,0,.15),0 1px 2px rgba(0,0,0,.3)',
    itemText: '#202124', itemHover: 'rgba(0,0,0,0.06)',
    selBg: 'rgba(26,115,232,0.12)', selHoverBg: 'rgba(26,115,232,0.16)', checkColor: '#1a73e8',
  },
}

export function Dropdown({
  value, onChange, options,
  width, dropdownMinWidth,
  placeholder, disabled = false,
  height = 36, fontSize = 14,
  className, variant = 'default',
}: DropdownProps) {
  const [open, setOpen]  = useState(false)
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

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (!triggerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  useLayoutEffect(() => {
    const el = popupRef.current
    if (!el || !open || !pos) return
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
  }, [open, pos])

  const containerStyle: React.CSSProperties = {}
  if (width !== undefined) containerStyle.width = width

  return (
    <div className={`relative ${className ?? ''}`} style={containerStyle}>
      <button
        type="button"
        ref={triggerRef}
        onClick={openDropdown}
        onMouseDown={e => e.preventDefault()}
        disabled={disabled}
        className="w-full flex items-center justify-between gap-1 select-none"
        style={{
          height,
          padding: '0 4px 0 8px',
          fontSize,
          fontFamily: 'var(--font-family-sans)',
          color: t.text,
          background: open ? t.activeBg : undefined,
          border: `1px solid ${t.border}`,
          borderRadius: 'var(--radius-md)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          transition: 'background 0.1s',
        }}
        onMouseEnter={e => { if (!open && !disabled) (e.currentTarget as HTMLElement).style.background = t.hoverBg }}
        onMouseLeave={e => { if (!open) (e.currentTarget as HTMLElement).style.background = '' }}
      >
        <span className="truncate flex-1 text-left">{label}</span>
        <ChevronDown size={12} style={{ color: t.chevron, flexShrink: 0 }} />
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
            maxHeight: 280,
            zIndex: 9999,
            background: t.popBg,
            borderRadius: 4,
            padding: '4px 0',
            overflowY: 'auto',
            boxShadow: t.popShadow,
          }}
        >
          {options.map(o => (
            <button
              key={o.value}
              type="button"
              onClick={() => { onChange(o.value); setOpen(false) }}
              className="w-full text-left flex items-center gap-2"
              style={{
                padding: '5px 16px',
                fontSize,
                color: t.itemText,
                background: o.value === value ? t.selBg : undefined,
                fontWeight: o.value === value ? 600 : undefined,
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = o.value === value ? t.selHoverBg : t.itemHover }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = o.value === value ? t.selBg : '' }}
            >
              {o.value === value
                ? <span style={{ color: t.checkColor, fontSize: 14, marginLeft: -4 }}>✓</span>
                : <span style={{ width: 14 }} />
              }
              {o.icon && <span className="flex-shrink-0">{o.icon}</span>}
              {o.label}
            </button>
          ))}
        </div>,
        document.body,
      )}
    </div>
  )
}
