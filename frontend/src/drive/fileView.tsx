import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import {
  ChevronDown, Check, Square, LayoutGrid, Grid2x2, Grid3x3,
  List, AlignJustify, LayoutList, Rows3, Menu as MenuIcon,
} from 'lucide-react'

// Menu « Afficher » façon explorateur Windows 11 : modes d'affichage (tailles
// d'icônes / liste / détails / mosaïques / contenu) + options (compact, éléments
// masqués). Composant partagé par FilesApp et ModuleFileBrowser.

export type ViewMode =
  | 'xl' | 'lg' | 'md' | 'sm'      // icônes (très grandes → petites)
  | 'list' | 'details'             // liste / détails
  | 'tiles' | 'content'            // mosaïques / contenu

export interface ViewSpec {
  kind:      'icons' | 'tiles' | 'rows'
  min?:      number   // largeur min des cellules (grille)
  thumbH?:   number   // hauteur de la vignette (icônes)
  iconScale?: number  // échelle de l'icône de fichier
  dense?:    boolean  // texte compact
  multicol?: boolean  // liste en colonnes (mode « Liste »)
  density?:  'compact' | 'normal' | 'large'
}

export const VIEW_SPECS: Record<ViewMode, ViewSpec> = {
  xl:      { kind: 'icons', min: 240, thumbH: 200, iconScale: 1.9 },
  lg:      { kind: 'icons', min: 190, thumbH: 150, iconScale: 1.45 },
  md:      { kind: 'icons', min: 150, thumbH: 128, iconScale: 1.1 },
  sm:      { kind: 'icons', min: 112, thumbH: 76,  iconScale: 0.8, dense: true },
  list:    { kind: 'rows',  multicol: true, density: 'compact' },
  details: { kind: 'rows',  density: 'normal' },
  tiles:   { kind: 'tiles', min: 260 },
  content: { kind: 'rows',  density: 'large' },
}

interface ModeDef { value: ViewMode; labelKey: string; fallback: string; icon: ReactNode }
const MODES: ModeDef[] = [
  { value: 'xl',      labelKey: 'view.icons_xl', fallback: 'Très grandes icônes', icon: <Square size={16} /> },
  { value: 'lg',      labelKey: 'view.icons_lg', fallback: 'Grandes icônes',      icon: <LayoutGrid size={16} /> },
  { value: 'md',      labelKey: 'view.icons_md', fallback: 'Icônes moyennes',     icon: <Grid2x2 size={16} /> },
  { value: 'sm',      labelKey: 'view.icons_sm', fallback: 'Petites icônes',      icon: <Grid3x3 size={16} /> },
  { value: 'list',    labelKey: 'view.list',     fallback: 'Liste',               icon: <List size={16} /> },
  { value: 'details', labelKey: 'view.details',  fallback: 'Détails',             icon: <AlignJustify size={16} /> },
  { value: 'tiles',   labelKey: 'view.tiles',    fallback: 'Mosaïques',           icon: <LayoutList size={16} /> },
  { value: 'content', labelKey: 'view.content',  fallback: 'Contenu',             icon: <Rows3 size={16} /> },
]

interface ViewMenuProps {
  value:        ViewMode
  onChange:     (v: ViewMode) => void
  compact:      boolean
  onCompact:    (v: boolean) => void
  showHidden:   boolean
  onShowHidden: (v: boolean) => void
  /** Traducteur (namespace 'files') — `t(key, { defaultValue })`. */
  t:            (key: string, opts?: Record<string, unknown>) => string
}

export function ViewMenu({ value, onChange, compact, onCompact, showHidden, onShowHidden, t }: ViewMenuProps) {
  const [open, setOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)

  useLayoutEffect(() => {
    if (!open || !btnRef.current) return
    const r = btnRef.current.getBoundingClientRect()
    const W = 280
    setPos({ top: r.bottom + 4, left: Math.max(8, Math.min(r.right - W, window.innerWidth - W - 8)) })
  }, [open])

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => { if (!btnRef.current?.contains(e.target as Node)) setOpen(false) }
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onEsc)
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onEsc) }
  }, [open])

  const lbl = (m: ModeDef) => t(m.labelKey, { defaultValue: m.fallback })

  return (
    <>
      <button
        ref={btnRef}
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 h-8 px-2.5 rounded-md border border-border text-sm text-text-secondary hover:bg-surface-1 transition-colors select-none"
        title={t('view.menu', { defaultValue: 'Afficher' })}
      >
        <MenuIcon size={15} />
        <span>{t('view.menu', { defaultValue: 'Afficher' })}</span>
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && pos && createPortal(
        <div
          className="fixed z-[9999] w-[280px] bg-white border border-border rounded-lg shadow-xl py-1.5 text-sm"
          style={{ top: pos.top, left: pos.left }}
          onMouseDown={e => e.stopPropagation()}
        >
          {MODES.map(m => {
            const active = value === m.value
            return (
              <button
                key={m.value}
                onClick={() => { onChange(m.value); setOpen(false) }}
                className="w-full flex items-center gap-2 pl-3 pr-3 py-1.5 text-left text-text-primary hover:bg-surface-1 transition-colors"
              >
                <span className="w-4 flex justify-center text-primary">{active ? <span className="w-1.5 h-1.5 rounded-full bg-primary" /> : null}</span>
                <span className="w-5 flex justify-center text-text-secondary">{m.icon}</span>
                <span className="flex-1">{lbl(m)}</span>
              </button>
            )
          })}

          <div className="my-1 h-px bg-border" />

          <button
            onClick={() => onCompact(!compact)}
            className="w-full flex items-center gap-2 pl-3 pr-3 py-1.5 text-left text-text-primary hover:bg-surface-1 transition-colors"
          >
            <span className="w-4 flex justify-center text-primary">{compact ? <Check size={14} /> : null}</span>
            <span className="w-5 flex justify-center text-text-secondary"><AlignJustify size={16} /></span>
            <span className="flex-1">{t('view.compact', { defaultValue: 'Affichage compact' })}</span>
          </button>
          <button
            onClick={() => onShowHidden(!showHidden)}
            className="w-full flex items-center gap-2 pl-3 pr-3 py-1.5 text-left text-text-primary hover:bg-surface-1 transition-colors"
          >
            <span className="w-4 flex justify-center text-primary">{showHidden ? <Check size={14} /> : null}</span>
            <span className="w-5 flex justify-center text-text-secondary"><Square size={16} /></span>
            <span className="flex-1">{t('view.hidden', { defaultValue: 'Éléments masqués' })}</span>
          </button>
        </div>,
        document.body,
      )}
    </>
  )
}
