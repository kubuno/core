import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, ChevronDown, ChevronRight, HardDrive, HelpCircle, PieChart } from 'lucide-react'
import { Callout, Card } from '@ui'
import { formatAgo, formatBytes } from '../sections/format'
import {
  CompositionBar, Figure, MAX_SERIES, NEUTRAL_SERIES, useSeriesScale, type Segment,
} from './charts'
import { CategoryComposition, CategoryRows, DelegatedNote } from './CategoryBreakdown'
import { useCategoryReading, useCategoryRules } from './categories'
import type { ModuleBreakdown, ModuleUsage } from './api'

/**
 * Where the consumed bytes came from.
 *
 * ## The one rule this card exists to obey
 *
 * **Nothing here is inferred from `used_bytes`.** Every figure is something a
 * module said about itself through `POST /internal/storage/usage`. A module that
 * never declared is drawn as *unknown*, never as zero — the two are different
 * facts and telling them apart is the entire point. Whatever the declarations
 * do not cover is its own named slice ("not attributed"), so the gap in the
 * picture is visible rather than absorbed into whichever module happens to be
 * biggest.
 *
 * ## Two readings, and why they do not add up to each other
 *
 * The **first bar is what is charged**: the share of each module's declaration
 * that counts against a quota, plus the part nobody claimed. It answers "why is
 * this account full".
 *
 * The **second reading is what is occupied**: everything the modules physically
 * hold, split by category, billed or not. It answers "how big a disk do I need".
 * It is legitimately larger than the first — thumbnails, indexes and caches take
 * room without being charged to anyone, on purpose: a user never asked for them
 * and cannot delete them.
 *
 * `delegated` sits in neither. It is bytes one module caused and another module
 * stores, and the one that stores them already counts them; it is drawn as a
 * separate note precisely so the anti-double-count rule is visible instead of
 * being an invisible subtraction.
 *
 * ## Colour
 *
 * Series identity comes from the fixed categorical scale `--kb-chart-1..8`,
 * assigned **by module id in a stable order** and never by rank: a module that
 * grows past another must not swap colours with it, or the reader learns that
 * the colours mean nothing. Past the scale's eight slots the remainder folds
 * into one "other modules" entry rather than inventing a ninth hue.
 *
 * The dark steps are a separate, separately-validated set rather than a filter
 * over the light ones, and they are chosen here in JS: Kubuno's themes are
 * applied by writing variables from the theme store, not through
 * `prefers-color-scheme`, so a CSS-only switch would stay light on a
 * hand-picked dark theme. `useUiTheme` is the same answer `MenuDropdown` uses.
 *
 * The residual slice is deliberately *not* on that scale: it is not an identity,
 * it is the absence of one, and giving it a series colour would make it read as
 * a module called "unattributed". It takes the same neutral the volume bar uses
 * for unaccounted content.
 *
 * Three of the light-mode series sit under 3:1 against a white card, which is
 * legal only because the legend names every series with its value beside it —
 * colour is never the only way to tell two slices apart here.
 */

export default function ModuleBreakdownCard({ data }: { data: ModuleBreakdown }) {
  const { t } = useTranslation()
  const series = useSeriesScale()
  const [open, setOpen] = useState<string | null>(null)

  const rules   = useCategoryRules(data.catalog)
  const reading = useCategoryReading(data.categories, rules, t)

  const declaring = useMemo(
    () => data.modules.filter((m): m is ModuleUsage & { used_bytes: number } =>
      m.declared && m.used_bytes !== null),
    [data.modules],
  )
  const silent = useMemo(() => data.modules.filter(m => !m.declared), [data.modules])

  /**
   * Colour is bound to the module **id** in a stable alphabetical order, so a
   * module keeps its colour as the numbers move and a filter that drops one
   * series does not repaint the survivors.
   *
   * Only **declaring** modules are given a slot. Reserving one for every
   * installed module would spend the eight-hue scale on the modules that have
   * no slice to paint — on this instance `drive` sorts ninth, and every colour
   * would have gone to a module that draws nothing.
   */
  const colorOf = useMemo(() => {
    const ids = [...new Set(declaring.map(m => m.module_id))].sort()
    const map = new Map<string, string>()
    ids.forEach((id, i) => { if (i < MAX_SERIES) map.set(id, series[i]) })
    return (id: string) => map.get(id) ?? NEUTRAL_SERIES
  }, [declaring, series])

  // Only modules that actually hold something get a slice; a declared zero is a
  // real measurement but has no width, and its number stays in the list below.
  const withBytes = declaring.filter(m => m.used_bytes > 0)
  const shown = withBytes.slice(0, MAX_SERIES)
  const folded = withBytes.slice(MAX_SERIES)
  const foldedBytes = folded.reduce((sum, m) => sum + m.used_bytes, 0)

  const total = data.declared_bytes + data.unattributed_bytes

  const segments: Segment[] = [
    ...shown.map(m => ({
      id:    m.module_id,
      label: m.display_name,
      value: m.used_bytes,
      color: colorOf(m.module_id),
    })),
    ...(folded.length > 0 ? [{
      id:    '__other',
      label: t('admin.sto_mod_other', { count: folded.length }),
      value: foldedBytes,
      color: NEUTRAL_SERIES,
    }] : []),
    // Always present, even at zero: "everything is accounted for" is a result
    // worth stating, and a legend entry that appears and disappears is one the
    // reader stops trusting.
    {
      id:    '__unattributed',
      label: t('admin.sto_mod_unattributed'),
      value: data.unattributed_bytes,
      color: 'var(--color-surface-2)',
      track: true,
    },
  ]

  const nothingDeclared = declaring.length === 0

  return (
    <Card
      title={t('admin.sto_mod_title')}
      icon={<PieChart size={16} />}
      subtitle={t('admin.sto_mod_sub')}
    >
      {/* ── Reading one: what is charged ────────────────────────────────── */}
      <p className="text-text-secondary" style={{ fontSize: 'var(--kb-text-meta)' }}>
        {t('admin.sto_mod_billed_lead')}
      </p>

      {nothingDeclared ? (
        <Callout variant="info" className="mt-2" t={t}>
          {t('admin.sto_mod_none_desc')}
        </Callout>
      ) : (
        <div className="mt-2">
          <CompositionBar
            segments={segments}
            total={Math.max(total, 1)}
            ariaLabel={t('admin.sto_mod_aria')}
          />
        </div>
      )}

      {/* ── What each module said, and when ─────────────────────────────── */}
      {/* The category detail is folded into the row rather than sent to another
          screen: it is the same module's own declaration, and an operator
          comparing two modules should not have to navigate between them. */}
      {declaring.length > 0 && (
        <ul className="mt-5 flex flex-col divide-y divide-border border-t border-border">
          {declaring.map(m => {
            const cats = m.categories ?? []
            const expandable = cats.some(c => rules.held(c) && c.used_bytes > 0)
            const isOpen = open === m.module_id
            const meta = [
              m.accounts != null ? t('admin.sto_mod_accounts', { count: m.accounts }) : null,
              m.held_bytes != null && m.held_bytes !== m.used_bytes
                ? t('admin.sto_mod_held', { bytes: formatBytes(m.held_bytes) })
                : null,
              m.last_declared_at ? t('admin.sto_mod_declared', { ago: formatAgo(m.last_declared_at) }) : null,
            ].filter(Boolean).join(' · ')

            const identity = (
              <>
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: colorOf(m.module_id) }}
                  aria-hidden
                />
                <span className="min-w-0 flex-1 truncate text-text-primary"
                      style={{ fontSize: 'var(--kb-text-body)' }}>
                  {m.display_name}
                </span>
              </>
            )

            return (
              <li key={m.module_id}>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5">
                  {expandable ? (
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() => setOpen(isOpen ? null : m.module_id)}
                      className="-mx-1.5 flex min-w-0 flex-1 items-center gap-2 rounded-md px-1.5 py-1 text-left transition-colors hover:bg-surface-1"
                    >
                      {isOpen
                        ? <ChevronDown size={14} className="shrink-0 text-text-tertiary" aria-hidden />
                        : <ChevronRight size={14} className="shrink-0 text-text-tertiary" aria-hidden />}
                      {identity}
                    </button>
                  ) : (
                    // The empty gutter keeps every module name on one x, so the
                    // rows that can be opened are told apart by the chevron
                    // rather than by a shift nobody can read as meaning.
                    <div className="flex min-w-0 flex-1 items-center gap-2 py-1">
                      <span className="size-3.5 shrink-0" aria-hidden />
                      {identity}
                    </div>
                  )}

                  {m.stale && (
                    <span className="inline-flex shrink-0 items-center gap-1 text-warning"
                          style={{ fontSize: 'var(--kb-text-meta)' }}>
                      <AlertTriangle size={13} aria-hidden />
                      {t('admin.sto_mod_stale')}
                    </span>
                  )}

                  <span className="shrink-0 text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
                    {meta}
                  </span>

                  <span className="shrink-0 tabular-nums text-text-primary"
                        style={{ fontSize: 'var(--kb-text-body)' }}>
                    {formatBytes(m.used_bytes)}
                  </span>
                </div>

                {isOpen && (
                  <div className="pb-3 pl-6">
                    <CategoryRows rows={cats} rules={rules} />
                    <DelegatedNote
                      bytes={m.delegated_bytes ?? 0}
                      objects={m.delegated_objects ?? 0}
                      scope="module"
                      className="mt-2"
                    />
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {/* ── Reading two: what is actually occupied ──────────────────────── */}
      <div className="mt-6 border-t border-border pt-4">
        <h4 className="flex items-center gap-2 font-medium text-text-primary"
            style={{ fontSize: 'var(--kb-text-body)' }}>
          <HardDrive size={15} className="shrink-0 text-text-secondary" aria-hidden />
          {t('admin.sto_held_title')}
        </h4>
        <p className="mt-1 text-text-secondary" style={{ fontSize: 'var(--kb-text-meta)' }}>
          {t('admin.sto_held_sub')}
        </p>

        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Figure label={t('admin.sto_held_fig_total')}>{formatBytes(data.held_bytes)}</Figure>
          <Figure label={t('admin.sto_held_fig_billed')}>{formatBytes(data.declared_bytes)}</Figure>
          <Figure label={t('admin.sto_held_fig_free_ride')}>
            {formatBytes(Math.max(data.held_bytes - data.declared_bytes, 0))}
          </Figure>
        </div>

        <div className="mt-4">
          <CategoryComposition
            reading={reading}
            heldBytes={data.held_bytes}
            ariaLabel={t('admin.sto_held_aria')}
            delegatedBytes={data.delegated_bytes}
            delegatedObjects={data.delegated_objects}
          />
        </div>
      </div>

      {/* ── The modules that said nothing ───────────────────────────────── */}
      {/* Listed by name rather than counted: "3 modules do not declare" is a
          statistic, and the operator's question is *which* ones. Their figure is
          an em dash, which is the honest rendering of "unknown" — a 0 would
          claim a measurement nobody made. */}
      {silent.length > 0 && (
        <div className="mt-4 border-t border-border pt-4">
          <p className="text-text-secondary" style={{ fontSize: 'var(--kb-text-body)' }}>
            {t('admin.sto_mod_silent_intro', { count: silent.length })}
          </p>
          <ul className="mt-2 flex flex-col gap-1.5">
            {silent.map(m => (
              <li key={m.module_id} className="flex items-center gap-2">
                <HelpCircle size={13} className="shrink-0 text-text-tertiary" aria-hidden />
                <span className="min-w-0 flex-1 truncate text-text-secondary"
                      style={{ fontSize: 'var(--kb-text-body)' }}>
                  {m.display_name}
                </span>
                <span className="shrink-0 text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
                  {t('admin.sto_mod_undeclared')}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Declarations exceeding the counter quotas are enforced against. Rare,
          and a defect on one side or the other — surfaced rather than clamped
          into a silence that would make the pie look tidy. */}
      {data.over_declared_bytes > 0 && (
        <Callout variant="warning" className="mt-4" t={t}>
          {t('admin.sto_mod_over', { bytes: formatBytes(data.over_declared_bytes) })}
        </Callout>
      )}
    </Card>
  )
}
