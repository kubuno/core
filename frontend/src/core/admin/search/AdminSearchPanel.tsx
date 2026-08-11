import { useTranslation } from 'react-i18next'
import { Clock, CornerDownLeft, SearchX } from 'lucide-react'
import { Badge, EmptyState } from '@ui'
import { groupRuns, type AdminResult } from './adminSearchIndex'
import { KIND_ICON, KIND_LABEL_KEY, KIND_VIEW_ALL } from './useAdminSearchSources'
import type { RecentTarget } from './adminSearchRecents'

/**
 * The result surface of the admin search — presentation only.
 *
 * It paints from the FLAT, keyboard-ordered list and inserts a heading whenever
 * the category changes. Grouping by category and painting separately would let
 * the eye and the arrow keys disagree the moment a result is demoted; here they
 * cannot, because there is only one order.
 */

/** Breadcrumb line ("A › B › C"), last segment emphasised. */
function Breadcrumb({ segments, max }: { segments: string[]; max?: number }) {
  // Mobile keeps only the tail: a three-level path wraps and steals the row.
  const shown = max && segments.length > max ? segments.slice(-max) : segments
  return (
    <p className="truncate text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
      {shown.map((s, i) => (
        <span key={i}>
          {i > 0 && <span className="mx-1">›</span>}
          <span className={i === shown.length - 1 ? 'text-text-secondary' : ''}>{s}</span>
        </span>
      ))}
    </p>
  )
}

function Avatar({ label, url }: { label: string; url?: string | null }) {
  if (url) return <img src={url} alt="" className="h-7 w-7 shrink-0 rounded-full object-cover" />
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-light
                     font-medium text-primary" style={{ fontSize: 'var(--kb-text-meta)' }}>
      {(label.trim().charAt(0) || '?').toUpperCase()}
    </span>
  )
}

export interface RowProps {
  result:   AdminResult
  active:   boolean
  optionId: string
  mobile:   boolean
  onPick:   (r: AdminResult) => void
  /** Keeps the input focused: a row must never steal it away from the field. */
  onHover:  () => void
}

export function ResultRow({ result, active, optionId, mobile, onPick, onHover }: RowProps) {
  const { t } = useTranslation()
  const Icon = result.Icon ?? KIND_ICON[result.kind]
  return (
    <li
      id={optionId}
      role="option"
      aria-selected={active}
      onMouseMove={onHover}
      onMouseDown={e => { e.preventDefault(); onPick(result) }}
      className={`flex cursor-pointer items-center gap-3 px-4 transition-colors
                  ${mobile ? 'min-h-[52px] py-2' : 'py-2'}
                  ${active ? 'bg-surface-2' : 'hover:bg-surface-1'}`}
    >
      {result.kind === 'user'
        ? <Avatar label={result.label} url={result.avatarUrl} />
        : <Icon size={18} className="shrink-0 text-text-tertiary" />}

      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 truncate text-text-primary" style={{ fontSize: 'var(--kb-text-body)' }}>
          <span className="truncate">{result.label}</span>
          {result.soon && <Badge size="sm" variant="warning">{t('admin.soon_badge')}</Badge>}
        </p>
        {result.sublabel
          ? <p className="truncate text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>{result.sublabel}</p>
          : result.segments && result.segments.length > 1
            ? <Breadcrumb segments={result.segments} max={mobile ? 2 : undefined} />
            : null}
      </div>

      {active && !mobile && (
        <CornerDownLeft size={14} className="shrink-0 text-text-tertiary" aria-hidden />
      )}
    </li>
  )
}

/** Category heading. Clickable when the category has a "see everything" page. */
function Heading({ label, onViewAll }: { label: string; onViewAll?: () => void }) {
  const { t } = useTranslation()
  return (
    <li role="presentation" className="flex items-center justify-between px-4 pb-1 pt-2">
      {/* Panel section title: 14px bold, no forced caps and no letter-spacing. */}
      <span className="font-bold text-text-secondary"
            style={{ fontSize: 'var(--kb-text-body)' }}>
        {label}
      </span>
      {onViewAll && (
        <button
          type="button"
          onMouseDown={e => { e.preventDefault(); onViewAll() }}
          className="rounded text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          style={{ fontSize: 'var(--kb-text-meta)' }}
        >
          {t('admin.search_view_all')}
        </button>
      )}
    </li>
  )
}

export interface PanelProps {
  listId:      string
  optionId:    (index: number) => string
  /** Flat list in keyboard order — the single source of both orders. */
  results:     AdminResult[]
  activeIndex: number
  setActive:   (index: number) => void
  onPick:      (result: AdminResult) => void
  onNavigate:  (url: string) => void
  query:       string
  recents:     RecentTarget[]
  suggestions: AdminResult[]
  nearMisses:  AdminResult[]
  loading:     boolean
  mobile:      boolean
}

export default function AdminSearchPanel(props: PanelProps) {
  const { t } = useTranslation()
  const { listId, optionId, results, activeIndex, setActive, onPick, onNavigate, query, mobile } = props

  // ── Empty field: recents, then a few things worth doing ───────────────────
  if (!query.trim()) {
    const nothing = props.recents.length === 0 && props.suggestions.length === 0
    if (nothing) {
      return (
        <ul id={listId} role="listbox" aria-label={t('admin.search_results')} className="py-2">
          <li role="presentation" className="px-4 py-3 text-text-tertiary" style={{ fontSize: 'var(--kb-text-body)' }}>
            {t('admin.search_hint')}
          </li>
        </ul>
      )
    }
    return (
      <ul id={listId} role="listbox" aria-label={t('admin.search_results')} className="py-1.5">
        {props.recents.length > 0 && <Heading label={t('admin.search_cat_recent')} />}
        {props.recents.map((r, i) => (
          <ResultRow
            key={`recent:${r.url}`}
            result={{ key: `recent:${r.url}`, kind: r.kind, label: r.label, sublabel: r.sublabel, url: r.url, score: 0, Icon: Clock }}
            active={activeIndex === i}
            optionId={optionId(i)}
            mobile={mobile}
            onPick={onPick}
            onHover={() => setActive(i)}
          />
        ))}
        {props.suggestions.length > 0 && <Heading label={t('admin.search_cat_suggested')} />}
        {props.suggestions.map((r, i) => {
          const index = props.recents.length + i
          return (
            <ResultRow
              key={r.key} result={r} active={activeIndex === index} optionId={optionId(index)}
              mobile={mobile} onPick={onPick} onHover={() => setActive(index)}
            />
          )
        })}
      </ul>
    )
  }

  // ── Nothing matched ───────────────────────────────────────────────────────
  if (results.length === 0) {
    return (
      <div className="px-2 py-1">
        <EmptyState
          t={t}
          compact
          variant="no-results"
          icon={<SearchX size={22} />}
          title={t('admin.search_none_title', { q: query.trim() })}
          description={
            props.loading
              ? t('admin.search_searching')
              : props.nearMisses.length > 0
                ? t('admin.search_none_desc_near')
                : t('admin.search_none_desc')
          }
        />
        {props.nearMisses.length > 0 && (
          <ul role="listbox" aria-label={t('admin.search_cat_suggested')} className="pb-2">
            <Heading label={t('admin.search_cat_suggested')} />
            {props.nearMisses.map(r => (
              <ResultRow
                key={r.key} result={r} active={false} optionId={`${listId}-near-${r.key}`}
                mobile={mobile} onPick={onPick} onHover={() => { /* not keyboard-reachable */ }}
              />
            ))}
          </ul>
        )}
      </div>
    )
  }

  // ── Results ───────────────────────────────────────────────────────────────
  const runs = groupRuns(results)
  let index = -1
  return (
    <ul id={listId} role="listbox" aria-label={t('admin.search_results')} className="py-1.5">
      {runs.map((run, ri) => {
        const viewAll = KIND_VIEW_ALL[run.kind]
        return (
          <li key={`${run.kind}-${ri}`} role="presentation">
            <ul role="group" aria-label={t(KIND_LABEL_KEY[run.kind])}
                className={ri > 0 ? 'border-t border-border' : undefined}>
              <Heading
                label={t(KIND_LABEL_KEY[run.kind])}
                onViewAll={viewAll ? () => onNavigate(viewAll(query.trim())) : undefined}
              />
              {run.items.map(r => {
                index += 1
                const i = index
                return (
                  <ResultRow
                    key={r.key} result={r} active={activeIndex === i} optionId={optionId(i)}
                    mobile={mobile} onPick={onPick} onHover={() => setActive(i)}
                  />
                )
              })}
            </ul>
          </li>
        )
      })}
    </ul>
  )
}
