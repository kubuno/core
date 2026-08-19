import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowDownRight, ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight, EyeOff, Minus } from 'lucide-react'
import { Tooltip } from '@ui'
import {
  AreaChart, BarChart, DonutChart, HBarList, ProgressRing, fmtBytes, useChartSeries,
} from '../DashboardCharts'
import { bucketLabel } from './bucketLabel'
import type { DashboardPanel, PanelBucket, PanelDef } from './types'

/**
 * One panel: what it counted, how it moved, and the way to the report that
 * carries the records behind it.
 *
 * ## The percentage
 *
 * Compared against the window of identical length immediately before the
 * reading, computed server-side so the two ends can never come from different
 * instants. When the previous window counted **zero**, no percentage is shown at
 * all: "+∞ %" and "+100 %" are both false, and the honest reading of 0 → 7 is
 * "seven, where there were none", which the figure already says.
 *
 * When `previous_total` is **null**, the panel describes the present and nothing
 * recorded its past — the card says so ("état actuel") rather than drawing an
 * arrow from a number nobody measured.
 *
 * ## The colour of the arrow
 *
 * From `polarity`, never from the sign. More failed sign-ins is not growth.
 *
 * ## The wording
 *
 * The chrome keys (`admin.sec_*`) were written for the first panelled page and
 * are now the shared vocabulary of all of them. They are deliberately NOT
 * re-spelt under a second prefix: two names for one sentence is how two pages
 * start saying it differently.
 */

// The axis label is spelt in `./bucketLabel`, shared with the report page: a bar
// hovered here and the row printed there must name the same instant.

interface Props {
  def:       PanelDef
  panel:     DashboardPanel
  bucket:    PanelBucket
  /** Only rendered while the page is in edit mode. */
  editing:   boolean
  canMoveUp: boolean
  canMoveDown: boolean
  onHide:    () => void
  onMove:    (delta: -1 | 1) => void
  onReport:  () => void
  /**
   * Spells one breakdown key, when the wording is not a translation key but a
   * fact this build has to look up — a module's display name, say. Takes
   * precedence over `def.legendKey`.
   */
  labelSlice?: (key: string) => string
}

export default function PanelCard({
  def, panel, bucket, editing, canMoveUp, canMoveDown, onHide, onMove, onReport, labelSlice,
}: Props) {
  const { t, i18n } = useTranslation()
  const series = useChartSeries()
  const { Icon } = def
  const bytes = panel.unit === 'bytes'

  /** The panel's own figure, spelt in its unit. */
  const fmt = useCallback(
    (v: number) => (bytes ? fmtBytes(v) : v.toLocaleString(i18n.language)),
    [bytes, i18n.language],
  )

  const points = useMemo(
    () => panel.series.map(p => ({ label: bucketLabel(p.bucket, bucket, i18n.language), value: p.value })),
    [panel.series, bucket, i18n.language],
  )

  /**
   * The breakdown key, spelled for a human.
   *
   * The fallback is the key ITSELF, never a placeholder: an id this build has no
   * wording for — a vocabulary a newer server grew — is shown verbatim, which is
   * ugly and true, rather than folded into "other", which is tidy and false.
   */
  const sliceLabel = useCallback(
    (key: string) => {
      if (labelSlice) return labelSlice(key)
      return def.legendKey ? t(def.legendKey(key), { defaultValue: key }) : key
    },
    [def, t, labelSlice],
  )

  const donut = useMemo(
    () => panel.breakdown.map((s, i) => ({
      label: sliceLabel(s.key),
      value: s.value,
      // A meaningful state keeps its own colour; everything else is ranked by
      // the palette (see `sliceTone` in PanelDef).
      color: def.sliceTone?.(s.key) ?? series[i % series.length],
    })),
    [panel.breakdown, series, sliceLabel, def],
  )

  const ranking = useMemo(() => {
    // A slice with its OWN ceiling is drawn against it — "80 % of what that
    // account was promised" is the fact somebody acts on, and it is invisible on
    // a bar scaled to the biggest holder. Slices without one share the largest
    // value, which is what makes a top-N readable.
    const largest = Math.max(1, ...panel.breakdown.map(s => s.value))
    return panel.breakdown.map(s => ({
      label: sliceLabel(s.key),
      value: s.value,
      max:   s.capacity && s.capacity > 0 ? s.capacity : largest,
      sub:   s.capacity && s.capacity > 0 ? `${fmt(s.value)} / ${fmt(s.capacity)}` : fmt(s.value),
    }))
  }, [panel.breakdown, sliceLabel, fmt])

  // No percentage against an empty window, and none at all for a snapshot: see
  // the note at the top of the file.
  const previous = panel.previous_total
  const snapshot = previous === null || previous === undefined
  const delta = !snapshot && previous > 0
    ? Math.round(((panel.total - previous) / previous) * 100)
    : null

  const rising = delta !== null && delta > 0
  const falling = delta !== null && delta < 0
  const worse = def.polarity === 'bad-up' ? rising : false
  const better = def.polarity === 'bad-up' ? falling : false
  const DeltaIcon = rising ? ArrowUpRight : falling ? ArrowDownRight : Minus
  const deltaColor = worse ? 'text-danger' : better ? 'text-success' : 'text-text-secondary'

  /** A gauge needs a stated ceiling; without one there is no share to draw. */
  const capacity = panel.capacity ?? 0
  const pct = capacity > 0 ? (panel.total / capacity) * 100 : 0

  /**
   * "Nothing to draw", judged per shape.
   *
   * A curve of zeros over a period that also counted zero before it is a flat
   * line saying nothing, so it is replaced by a sentence. A ring or a ranking has
   * no time dimension at all: what makes it undrawable is an empty breakdown,
   * whatever the previous period did — and the delta line above still reports
   * the fall to zero. A gauge is undrawable without a ceiling.
   */
  const empty = def.shape === 'donut' || def.shape === 'ranking'
    ? panel.breakdown.length === 0
    : def.shape === 'gauge'
      ? capacity <= 0
      : panel.total === 0 && (previous ?? 0) === 0

  // A caveat this build has no wording for is not printed at all: an empty
  // separator rule under a chart reads as a rendering fault.
  const caveatKey = def.caveatKey ?? ((id: string) => `admin.sec_caveat_${id}`)
  const caveat = panel.caveat
    ? t(caveatKey(panel.caveat), { defaultValue: '' })
    : ''

  return (
    <section className="flex min-w-0 flex-col rounded-xl border border-border bg-surface-0 p-4">
      {/* ── Head: what it is, and the controls that only exist in edit mode ── */}
      <header className="mb-2 flex items-start gap-2">
        <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-surface-2">
          <Icon size={15} className="text-text-secondary" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-text-primary" style={{ fontSize: 'var(--kb-text-body)' }}>
            {t(def.titleKey)}
          </h3>
          <p className="mt-0.5 line-clamp-2 text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
            {t(def.aboutKey)}
          </p>
        </div>

        {editing && (
          <div className="flex shrink-0 items-center gap-0.5">
            <Tooltip label={t('admin.sec_move_earlier')}>
              <button
                type="button" onClick={() => onMove(-1)} disabled={!canMoveUp}
                aria-label={t('admin.sec_move_earlier')}
                className="flex size-7 items-center justify-center rounded-md text-text-secondary
                           hover:bg-surface-2 disabled:opacity-40 disabled:hover:bg-transparent"
              >
                <ChevronLeft size={15} />
              </button>
            </Tooltip>
            <Tooltip label={t('admin.sec_move_later')}>
              <button
                type="button" onClick={() => onMove(1)} disabled={!canMoveDown}
                aria-label={t('admin.sec_move_later')}
                className="flex size-7 items-center justify-center rounded-md text-text-secondary
                           hover:bg-surface-2 disabled:opacity-40 disabled:hover:bg-transparent"
              >
                <ChevronRight size={15} />
              </button>
            </Tooltip>
            <Tooltip label={t('admin.sec_hide_panel')}>
              <button
                type="button" onClick={onHide} aria-label={t('admin.sec_hide_panel')}
                className="flex size-7 items-center justify-center rounded-md text-text-secondary hover:bg-surface-2"
              >
                <EyeOff size={15} />
              </button>
            </Tooltip>
          </div>
        )}
      </header>

      {/* ── The figure, and how it moved ── */}
      <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="tabular-nums text-text-primary" style={{ fontSize: 'var(--kb-text-title)' }}>
          {fmt(panel.total)}
        </span>
        {snapshot ? (
          <span className="text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
            {t('admin.dash_snapshot')}
          </span>
        ) : delta === null ? (
          <span className="text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
            {t('admin.sec_no_comparison')}
          </span>
        ) : (
          <span className={`inline-flex items-center gap-1 tabular-nums ${deltaColor}`}
                style={{ fontSize: 'var(--kb-text-meta)' }}>
            <DeltaIcon size={13} aria-hidden />
            {delta > 0 ? '+' : ''}{delta} %
            <span className="text-text-tertiary">{t('admin.sec_vs_previous')}</span>
          </span>
        )}
      </div>

      {/* ── The chart ── */}
      <div className="min-h-[132px]">
        {empty ? (
          <p className="py-10 text-center text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
            {t('admin.sec_nothing_counted')}
          </p>
        ) : def.shape === 'gauge' ? (
          <ProgressRing
            pct={pct}
            value={`${Math.round(pct)} %`}
            label={t(def.titleKey)}
            // The theme's own danger colour past 90 %: a gauge that stays in the
            // series palette when the disc is nearly full says nothing.
            color={pct >= 90 ? 'var(--color-danger)' : series[0]}
            sub={`${fmt(panel.total)} / ${fmt(capacity)}`}
          />
        ) : def.shape === 'donut' ? (
          // No caption in the hole: it repeated the card's own heading a few
          // pixels below it, and repeating it there is what forced the words
          // onto two cramped lines against the arc. The number stands alone,
          // and hovering a slice shows its share.
          <DonutChart data={donut} size={128} centerValue={fmt(panel.total)} />
        ) : def.shape === 'ranking' ? (
          <HBarList items={ranking} color={series[0]} />
        ) : def.shape === 'area' ? (
          <AreaChart data={points} color={series[0]} height={132} />
        ) : (
          <BarChart data={points} color={series[0]} height={132} />
        )}
      </div>

      {/* ── What the number cannot mean, when it cannot mean everything ── */}
      {caveat && (
        <p className="mt-3 border-t border-border pt-2 text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
          {caveat}
        </p>
      )}

      {/* ── The way out: the report that owns these records ── */}
      <button
        type="button" onClick={onReport}
        className="mt-3 inline-flex items-center gap-1.5 self-start rounded-md px-2 py-1 -ml-2
                   text-primary hover:bg-surface-1"
        style={{ fontSize: 'var(--kb-text-body)' }}
      >
        {t('admin.sec_show_report')}
        <ArrowRight size={14} aria-hidden />
      </button>
    </section>
  )
}
