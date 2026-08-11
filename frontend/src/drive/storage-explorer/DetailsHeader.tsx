/**
 * Details view (table) header: sortable columns (Name / Modified / Type / Size /
 * Created) whose date/type/size widths are resizable by dragging the separators;
 * the name column takes the remaining space.
 */
import React from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronUp, GripVertical } from 'lucide-react'
import {
  DETAILS_COL_ORDER, DETAILS_COL_SORT, detailsColLabel,
  type DetailsColKey, type DetailsSettings, type DetailsSortField,
} from './detailsModel'

export function DetailsHeader({ details, onDetails, sortField, sortDir, onSortField, onSortDir, onHeaderMenu }: {
  details: DetailsSettings
  onDetails: (updater: (s: DetailsSettings) => DetailsSettings) => void
  sortField: DetailsSortField; sortDir: 'asc' | 'desc'
  onSortField: (f: DetailsSortField) => void; onSortDir: (d: 'asc' | 'desc') => void
  onHeaderMenu: (e: React.MouseEvent) => void
}) {
  const { t } = useTranslation('drive')
  const visible = DETAILS_COL_ORDER.filter(k => details.visible[k])
  const sortBy = (f: DetailsSortField) => {
    if (sortField === f) onSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    else { onSortField(f); onSortDir(f === 'date' || f === 'size' || f === 'created' ? 'desc' : 'asc') }
  }
  const arrow = (f: DetailsSortField) => sortField === f
    ? (sortDir === 'asc' ? <ChevronUp size={12} className="shrink-0" /> : <ChevronDown size={12} className="shrink-0" />)
    : null
  // Each column is resized by dragging its OWN left border (drag left → wider).
  // The « Nom » column is flexible and absorbs the difference.
  const startResize = (key: DetailsColKey) => (e: React.PointerEvent) => {
    e.preventDefault(); e.stopPropagation()
    const startX = e.clientX
    const startW = details.widths[key]
    const onMove = (ev: PointerEvent) => {
      const w = Math.max(64, Math.min(480, startW - (ev.clientX - startX)))
      onDetails(s => (s.widths[key] === w ? s : { ...s, widths: { ...s.widths, [key]: w } }))
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }
  // Left-edge grip: the visible 1px divider sits at the column's left border.
  const grip = (key: DetailsColKey) => (
    <span onPointerDown={startResize(key)} onClick={e => e.stopPropagation()}
      className="absolute -left-2 top-0 bottom-0 w-3 cursor-col-resize flex justify-center items-center group/grip z-10">
      <span className="w-px h-4 bg-border transition-colors group-hover/grip:bg-border-strong" />
      {/* Grip pill, same idiom as the panel splitters but SCALED DOWN: the header row
          is ~28px, so the shell's 36px pill would not fit. Width is EXACTLY the grip
          zone's (12px): any wider and it spills over the neighbouring column label,
          which reads as clutter in a dense header. Appears on hover and tints, like
          the others. */}
      <span className="absolute flex h-4 w-3 items-center justify-center rounded-full border border-border
                       bg-surface-0 text-text-tertiary shadow-sm opacity-0 transition
                       group-hover/grip:border-primary/40 group-hover/grip:bg-primary-light
                       group-hover/grip:text-primary group-hover/grip:opacity-100">
        <GripVertical size={10} />
      </span>
    </span>
  )
  const cell = 'shrink-0 flex items-center gap-1 text-left text-xs text-text-secondary hover:text-text-primary py-1.5'
  return (
    <div onContextMenu={onHeaderMenu}
      className="flex items-center gap-3 pl-[19px] pr-4 border-b border-border bg-white select-none">
      <span className="shrink-0 w-5" />
      <span className="shrink-0 w-8" />
      <button onClick={() => sortBy('name')} className={`flex-1 min-w-0 ${cell}`}>
        <span className="truncate">{t('common.name')}</span>{arrow('name')}
      </button>
      {visible.map(key => {
        const sortF = DETAILS_COL_SORT[key]
        // Non-sortable columns (e.g. « Étiquettes ») render as a plain header.
        if (!sortF) {
          return (
            <span key={key} style={{ width: details.widths[key] }} className={`relative ${cell} cursor-default`}>
              <span className="truncate">{detailsColLabel(key, t)}</span>
              {grip(key)}
            </span>
          )
        }
        return (
          <button key={key} onClick={() => sortBy(sortF)} style={{ width: details.widths[key] }}
            className={`relative ${key === 'size' ? 'justify-end' : ''} ${cell}`}>
            <span className="truncate">{detailsColLabel(key, t)}</span>{arrow(sortF)}
            {grip(key)}
          </button>
        )
      })}
      <span className="shrink-0 w-[26px]" />
    </div>
  )
}
