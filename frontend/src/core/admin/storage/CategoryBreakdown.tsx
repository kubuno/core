import { useTranslation } from 'react-i18next'
import { Share2, Trash2 } from 'lucide-react'
import { Badge, Callout } from '@ui'
import { formatBytes } from '../sections/format'
import { CompositionBar, NEUTRAL_SERIES, type Segment } from './charts'
import { categoryLabel, type CategoryReading, type CategoryRules } from './categories'
import type { CategoryUsage } from './api'

/**
 * The category reading, shared by the instance card and the account sheet.
 *
 * ## What it is allowed to say
 *
 * Volumes, object counts, and the technical category the bytes fall in. Never a
 * file name, a folder, a path, a MIME type, an extension or a title — see the
 * banner on `AccountUsageDialog`.
 *
 * ## The two totals it keeps apart
 *
 * **Held** is what the disk carries. **Billed** is the part of it charged to a
 * quota — the files somebody can delete, their bin, the versions they can purge.
 * Thumbnails, indexes and caches are held and not billed, deliberately: nobody
 * asked for them and nobody can remove them, so charging for them would invoice
 * a user for the software's own housekeeping.
 *
 * ## `delegated`
 *
 * Never added to either total, in any view. It is bytes a module *caused* while
 * another module stores them — office writing its documents into drive — and the
 * module that holds them already counts them. It is rendered as its own note,
 * outside the bar and outside every sum, because the point of showing it at all
 * is to make the anti-double-count rule visible rather than to move a figure.
 */

/** Grouped digits: object counts routinely run into the millions. */
function formatCount(n: number): string {
  return n.toLocaleString()
}

/** One line of a category list: identity, rule, objects, volume. */
function CategoryRow({
  label, color, billable, row, showSwatch,
}: {
  label:      string
  color:      string | null
  billable:   boolean
  row:        CategoryUsage
  showSwatch: boolean
}) {
  const { t } = useTranslation()
  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
      {showSwatch && (
        <span
          className="size-2.5 shrink-0 rounded-full"
          style={{
            backgroundColor: color ?? NEUTRAL_SERIES,
            boxShadow: color ? undefined : 'inset 0 0 0 1px var(--color-border-strong)',
          }}
          aria-hidden
        />
      )}
      <span className="min-w-0 flex-1 truncate text-text-primary" style={{ fontSize: 'var(--kb-text-body)' }}>
        {label}
      </span>

      {/* The rule, spelled out on every row. "Billable" is the whole reason the
          vocabulary exists, and a legend the reader has to remember is a legend
          they will get wrong. */}
      <Badge size="sm" variant={billable ? 'primary' : 'default'}>
        {billable ? t('admin.sto_cat_billable') : t('admin.sto_cat_not_billable')}
      </Badge>

      {row.object_count != null && (
        <span className="shrink-0 tabular-nums text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
          {t('admin.sto_cat_objects', { n: formatCount(row.object_count), count: row.object_count })}
        </span>
      )}

      <span className="shrink-0 tabular-nums text-text-primary" style={{ fontSize: 'var(--kb-text-body)' }}>
        {formatBytes(row.used_bytes)}
      </span>
    </li>
  )
}

/**
 * Bytes a module caused but does not hold. Outside the bar, outside every sum,
 * and labelled as such — this note IS the anti-double-count rule made visible.
 */
export function DelegatedNote({
  bytes, objects, scope = 'instance', className,
}: {
  bytes:    number
  objects:  number
  /** Changes only the wording; the arithmetic is the same everywhere: none. */
  scope?:   'instance' | 'module'
  className?: string
}) {
  const { t } = useTranslation()
  if (objects <= 0 && bytes <= 0) return null

  return (
    <div className={`rounded-lg border border-dashed border-border px-3 py-2.5 ${className ?? ''}`}>
      <div className="flex items-center gap-2">
        <Share2 size={14} className="shrink-0 text-text-tertiary" aria-hidden />
        <span className="min-w-0 flex-1 truncate text-text-primary" style={{ fontSize: 'var(--kb-text-body)' }}>
          {t('admin.sto_deleg_label')}
        </span>
        <span className="shrink-0 tabular-nums text-text-secondary" style={{ fontSize: 'var(--kb-text-body)' }}>
          {t('admin.sto_deleg_objects', { n: formatCount(objects), count: objects })}
        </span>
      </div>
      <p className="mt-1 text-text-secondary" style={{ fontSize: 'var(--kb-text-meta)' }}>
        {scope === 'module' ? t('admin.sto_deleg_desc_module') : t('admin.sto_deleg_desc')}
      </p>
    </div>
  )
}

/**
 * The full reading: one bar over what is physically held, the categories that
 * fill it, and the bin called out on its own.
 */
export function CategoryComposition({
  reading, heldBytes, ariaLabel, delegatedBytes, delegatedObjects,
}: {
  reading:   CategoryReading
  /** The server's own held total — the bar's denominator, not a re-derived sum. */
  heldBytes: number
  ariaLabel: string
  delegatedBytes:   number
  delegatedObjects: number
}) {
  const { t } = useTranslation()

  const segments: Segment[] = [
    ...reading.slices.map(s => ({
      id:    s.row.category,
      label: s.label,
      value: s.row.used_bytes,
      color: s.color,
    })),
    ...(reading.folded ? [{
      id:    '__cat_other',
      label: t('admin.sto_cat_other', { count: reading.folded.count }),
      value: reading.folded.bytes,
      color: NEUTRAL_SERIES,
    }] : []),
  ]

  const notBilled = Math.max(reading.heldBytes - reading.billedBytes, 0)

  return (
    <div>
      {segments.length > 0 ? (
        <CompositionBar
          segments={segments}
          total={Math.max(heldBytes, reading.heldBytes, 1)}
          ariaLabel={ariaLabel}
        />
      ) : (
        <p className="text-text-tertiary" style={{ fontSize: 'var(--kb-text-body)' }}>
          {t('admin.sto_cat_empty')}
        </p>
      )}

      {segments.length > 0 && (
        <>
          {/* The two-way split restated in words, because it is the split the
              whole vocabulary is built on and the bar does not encode it. */}
          <p className="mt-3 text-text-secondary" style={{ fontSize: 'var(--kb-text-meta)' }}>
            {t('admin.sto_cat_split', {
              billed:    formatBytes(reading.billedBytes),
              notBilled: formatBytes(notBilled),
            })}
          </p>

          <ul className="mt-2 flex flex-col divide-y divide-border border-t border-border">
            {reading.slices.map(s => (
              <CategoryRow
                key={s.row.category}
                label={s.label}
                color={s.color}
                billable={s.billable}
                row={s.row}
                showSwatch
              />
            ))}
          </ul>
        </>
      )}

      {/* The bin, on its own, when it holds anything: it is billed, and emptying
          it is the move to try before handing out more quota. */}
      {reading.trash && (
        <Callout
          variant="info"
          className="mt-4"
          icon={<Trash2 size={16} />}
          title={t('admin.sto_trash_title', { bytes: formatBytes(reading.trash.used_bytes) })}
          t={t}
        >
          {t('admin.sto_trash_desc')}
        </Callout>
      )}

      <DelegatedNote
        bytes={delegatedBytes}
        objects={delegatedObjects}
        className="mt-4"
      />
    </div>
  )
}

/** A module's categories, without a bar — a detail panel, not a reading. */
export function CategoryRows({
  rows, rules,
}: {
  rows:  CategoryUsage[]
  rules: CategoryRules
}) {
  const { t } = useTranslation()
  const held = rows
    .filter(r => rules.held(r) && r.used_bytes > 0)
    .sort((a, b) => rules.order(a.category) - rules.order(b.category))

  if (held.length === 0) {
    return (
      <p className="py-2 text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
        {t('admin.sto_cat_empty')}
      </p>
    )
  }

  return (
    <ul className="flex flex-col divide-y divide-border">
      {held.map(row => (
        <CategoryRow
          key={row.category}
          label={categoryLabel(t, row.category)}
          color={null}
          billable={rules.billable(row)}
          row={row}
          showSwatch={false}
        />
      ))}
    </ul>
  )
}
