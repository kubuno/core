import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Search, Check } from 'lucide-react'
import { dedupeFontFamilies } from './fontFamily'

export interface FontPickerProps {
  value: string
  onChange: (font: string) => void
  /** Familles de polices proposées (dédoublonnées et triées par le composant). */
  fonts: readonly string[]
  /** Polices récemment utilisées, épinglées en tête (optionnel). */
  recent?: readonly string[]
  width?: number | string
  height?: number
  fontSize?: number
  disabled?: boolean
  className?: string
  variant?: 'default' | 'ghost'
}

interface Pos { top: number; left: number; minWidth: number }

// Famille CSS sûre pour l'aperçu (guillemets + repli) — `Times New Roman` etc.
const cssFamily = (f: string) => `"${f.replace(/"/g, '')}", "Segoe UI", system-ui, sans-serif`

/**
 * Sélecteur de police partagé (`@ui`). Chaque entrée est rendue dans SA police pour
 * servir d'aperçu. Dédoublonne la liste reçue (cf. `dedupeFontFamilies`) — le vrai
 * regroupement des styles (Calibri Bold/Light…) sous une seule famille se fait au
 * CHARGEMENT des polices via la table `name` (cf. `parseFontMeta`).
 */
export function FontPicker({
  value, onChange, fonts, recent = [],
  width = 150, height = 36, fontSize = 14,
  disabled = false, className, variant = 'default',
}: FontPickerProps) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<Pos | null>(null)
  const [query, setQuery] = useState('')
  const [hi, setHi] = useState(0)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const all = useMemo(() => dedupeFontFamilies([...recent, ...fonts]), [recent, fonts])
  const recentSet = useMemo(() => new Set(recent.map(r => r.toLowerCase())), [recent])
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? all.filter(f => f.toLowerCase().includes(q)) : all
  }, [all, query])

  const openMenu = () => {
    if (disabled) return
    const r = triggerRef.current?.getBoundingClientRect()
    if (r) setPos({ top: r.bottom + 2, left: r.left, minWidth: Math.max(220, r.width) })
    setQuery(''); setHi(0); setOpen(o => !o)
  }

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!triggerRef.current?.contains(e.target as Node) && !popupRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    setTimeout(() => searchRef.current?.focus(), 0)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  // Maintient l'élément surligné dans la zone visible.
  useEffect(() => {
    if (!open) return
    popupRef.current?.querySelector<HTMLElement>(`[data-idx="${hi}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [hi, open])

  useLayoutEffect(() => {
    const el = popupRef.current
    if (!el || !open || !pos) return
    const r = el.getBoundingClientRect(), M = 8
    let l = pos.left, t = pos.top
    if (r.right > window.innerWidth - M) l = window.innerWidth - M - r.width
    if (r.bottom > window.innerHeight - M) t = Math.max(M, window.innerHeight - M - r.height)
    if (l < M) l = M
    el.style.left = `${l}px`; el.style.top = `${t}px`
  }, [open, pos, filtered.length])

  const choose = (f: string) => { onChange(f); setOpen(false) }
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setHi(i => Math.min(filtered.length - 1, i + 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHi(i => Math.max(0, i - 1)) }
    else if (e.key === 'Enter') { e.preventDefault(); if (filtered[hi]) choose(filtered[hi]) }
    else if (e.key === 'Escape') { e.preventDefault(); setOpen(false) }
  }

  const ghost = variant === 'ghost'
  // Index où finit le bloc « récentes » (pour insérer un séparateur).
  const lastRecent = query ? -1 : filtered.reduce((acc, f, i) => (recentSet.has(f.toLowerCase()) ? i : acc), -1)

  return (
    <div className={`relative ${className ?? ''}`} style={{ width }}>
      <button
        type="button" ref={triggerRef} onClick={openMenu} onMouseDown={e => e.preventDefault()} disabled={disabled}
        className="w-full flex items-center justify-between gap-1 select-none"
        style={{
          height, padding: '0 4px 0 8px', fontSize, color: '#202124',
          fontFamily: cssFamily(value || 'Arial'),
          background: open ? 'rgba(0,0,0,0.08)' : undefined,
          border: `1px solid ${ghost ? 'transparent' : 'var(--color-border)'}`,
          borderRadius: 'var(--radius-md)', cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1, transition: 'background 0.1s',
        }}
        onMouseEnter={e => { if (!open && !disabled) (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.06)' }}
        onMouseLeave={e => { if (!open) (e.currentTarget as HTMLElement).style.background = '' }}
        title={value}
      >
        <span className="truncate flex-1 text-left">{value || 'Arial'}</span>
        <ChevronDown size={12} style={{ color: '#5f6368', flexShrink: 0 }} />
      </button>

      {open && pos && createPortal(
        <div
          ref={popupRef}
          onMouseDown={e => e.stopPropagation()}
          style={{
            position: 'fixed', top: pos.top, left: pos.left, minWidth: pos.minWidth, width: 'max-content', maxWidth: 320,
            zIndex: 9999, background: '#fff', borderRadius: 8,
            boxShadow: '0 2px 6px 2px rgba(0,0,0,.15),0 1px 2px rgba(0,0,0,.3)', overflow: 'hidden',
          }}
        >
          {/* Recherche */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 border-b" style={{ borderColor: 'var(--color-border)' }}>
            <Search size={14} style={{ color: '#80868b', flexShrink: 0 }} />
            <input
              ref={searchRef} value={query} onChange={e => { setQuery(e.target.value); setHi(0) }} onKeyDown={onKey}
              placeholder="Rechercher une police…"
              className="flex-1 outline-none bg-transparent text-sm" style={{ color: '#202124' }}
            />
          </div>
          {/* Liste */}
          <div style={{ maxHeight: 320, overflowY: 'auto', padding: '4px 0' }}>
            {filtered.length === 0 && (
              <div className="px-4 py-3 text-sm" style={{ color: '#80868b' }}>Aucune police</div>
            )}
            {filtered.map((f, i) => (
              <React.Fragment key={f}>
                <button
                  type="button" data-idx={i}
                  onClick={() => choose(f)} onMouseEnter={() => setHi(i)}
                  className="w-full text-left flex items-center gap-2"
                  style={{
                    padding: '7px 12px', fontSize: 15, color: '#202124',
                    fontFamily: cssFamily(f),
                    background: i === hi ? 'rgba(26,115,232,0.10)' : f === value ? 'rgba(26,115,232,0.06)' : undefined,
                  }}
                >
                  <span style={{ width: 16, flexShrink: 0, color: '#1a73e8' }}>{f === value && <Check size={14} />}</span>
                  <span className="truncate">{f}</span>
                </button>
                {i === lastRecent && <div style={{ height: 1, background: 'var(--color-border)', margin: '4px 0' }} />}
              </React.Fragment>
            ))}
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}
