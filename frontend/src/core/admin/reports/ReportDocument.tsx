import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Download, Printer } from 'lucide-react'
import { Button, Dropdown, Toggle } from '@ui'
import {
  DonutChart, HBarList, ProgressRing, ReportSeriesChart, useChartSeries,
} from '../DashboardCharts'
import { useAdminModules } from '../adminModules'
import { useAdminCrumbs } from '../AdminBreadcrumb'
import type { PanelDef, PanelPeriod } from '../panels/types'
import type { ReportPanel } from './api'
import { csvFilename, downloadCsv, reportRows, toCsv } from './csv'
import { formatInstant, useReportModel } from './model'
import { useDetailItem } from './ReportDetail'
import ReportHeader from './ReportHeader'
import { CaveatBlock, MethodBlock } from './ReportMethod'
import ReportSummary from './ReportSummary'
import { ReportBlock, useBreakdownItem, useSeriesItem } from './ReportTables'
import WatermarkPanel from './paged/WatermarkPanel'
import { NO_WATERMARK } from './paged/watermark'
import type { WatermarkSpec } from './paged/watermark'
import CoverSheet from './paged/CoverSheet'
import PagedPreview from './paged/PagedPreview'
import { PAPER } from './paged/geometry'
import type { Orientation } from './paged/geometry'
import type { FlowItem } from './paged/types'

/**
 * One report: one panel, one window, printable.
 *
 * ## What it is, as opposed to what "afficher le rapport" used to be
 *
 * The action on a dashboard card used to open a LIST — the session inventory,
 * the audit trail — which is a different screen about a different scope, usually
 * over a different period, and never printable. This page is the document the
 * label always promised: the panel's own figures, in full, framed by everything
 * a reader needs who was not the person who generated it.
 *
 * ## Its parts, in the order somebody reads them
 *
 *   1. the head — instance, subject, window, zone, timestamp, author;
 *   2. the chart, at full width rather than at card size;
 *   3. the three figures: the total, the window before it, the variation;
 *   4. the series, one row per interval;
 *   5. the breakdown, every entry — never a top-N;
 *   6. the detail: the underlying records, one row each — who, when, what —
 *      or, for a panel whose source has none, the sentence saying why;
 *   7. the method: which table, which predicate, which measure;
 *   8. the caveats, which are what stop a number becoming a wrong conclusion.
 *
 * ## The two buttons
 *
 * "Imprimer" hands the page to the browser, which applies the report's print
 * stylesheet (`index.css`). "Exporter en CSV" writes the same model to a file —
 * the same rows, assembled once in `model.ts`, so the sheet on the desk and the
 * spreadsheet on the disk cannot disagree.
 *
 * Neither leaves the browser: the reading itself was already served, audited and
 * gated by `/admin/dashboard`, and re-posting it to the server to be turned into
 * a file would be a second copy of the same data for no gain.
 */
/**
 * Entries a chart draws at most.
 *
 * A bar list grows with its entries while the paper does not: past this many, a
 * ranking is taller than a landscape sheet and prints cut off. The TABLES stay
 * exhaustive — it is the drawing that is capped, and it says so.
 */
const CHART_ENTRIES = 10

export default function ReportDocument({
  def, panel, period, periods, periodId, onPeriod, instance, author,
}: {
  def:      PanelDef
  panel:    ReportPanel
  period:   PanelPeriod
  periods:  string[]
  periodId: string
  onPeriod: (id: string) => void
  instance: string
  author:   string
}) {
  const { t, i18n } = useTranslation()
  const series = useChartSeries()

  // How the sheets are cut. Local state, not a URL parameter: it is a property
  // of the printer in front of the operator, not of the document — two people
  // opening the same link should not inherit each other's paper tray.
  const [paper, setPaper]             = useState('a4')
  const [orientation, setOrientation] = useState<Orientation>('portrait')
  const [cover, setCover]             = useState(false)
  /** The stamp across every sheet — text or picture, size, opacity, angle. */
  const [watermark, setWatermark]     = useState<WatermarkSpec>(NO_WATERMARK)

  // Where the toolbar has to pin: directly under the breadcrumb, which is itself
  // pinned. Measured rather than assumed — the trail wraps to two lines on a
  // narrow panel, and a hard-coded offset would leave a gap or a cover-up.
  const [crumbH, setCrumbH] = useState(0)
  const [barH, setBarH]     = useState(0)
  const barRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const crumb = document.querySelector<HTMLElement>('[data-admin-crumbs]')
    const bar   = barRef.current
    if (!crumb || !bar) return
    const read = () => {
      setCrumbH(crumb.getBoundingClientRect().height)
      setBarH(bar.getBoundingClientRect().height)
    }
    read()
    const ro = new ResizeObserver(read)
    ro.observe(crumb)
    ro.observe(bar)
    return () => ro.disconnect()
  }, [])

  // Only to spell module ids as the names an operator reads — the same lookup
  // the dashboard card does, so the printed legend matches the screen. Absent
  // without `core.modules.read`, in which case the ids are printed: true, if
  // plain.
  const { data: modules } = useAdminModules()
  const moduleName = useCallback(
    (id: string) => modules?.find(m => m.id === id)?.display_name ?? id,
    [modules],
  )

  const model = useReportModel(
    def, panel, period,
    def.id === 'app_usage' ? moduleName : undefined,
  )

  const title = t(def.titleKey)
  const about = t(def.aboutKey)
  const periodLabel = t(`admin.sec_period_${periodId}`, { defaultValue: periodId })
  // The instant the reading was taken, in the instance's own zone — the same
  // clock the window bounds are stated on, three lines above it. Fixed for the
  // life of the page: a timestamp recomputed on every render would change
  // between the moment the operator reads it and the moment the sheet leaves
  // the printer.
  const generatedAt = useMemo(
    () => formatInstant(new Date().toISOString(), i18n.language, period.timezone),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [i18n.language, period.timezone, periodId, def.id],
  )

  useAdminCrumbs(useMemo(() => [{ label: title, title }], [title]))

  const periodOptions = useMemo(
    () => (periods.length > 0 ? periods : [periodId]).map(id => ({
      value: id, label: t(`admin.sec_period_${id}`, { defaultValue: id }),
    })),
    [periods, periodId, t],
  )

  const exportCsv = useCallback(() => {
    const rows = reportRows(
      model,
      { instance, title, about, periodLabel, generatedAt, generatedBy: author },
      {
        instance:  t('admin.rep_instance'),
        report:    t('admin.rep_document'),
        about:     t('admin.rep_about'),
        period:    t('admin.rep_period'),
        from:      t('admin.rep_from'),
        to:        t('admin.rep_to'),
        timezone:  t('admin.rep_timezone'),
        generated: t('admin.rep_generated'),
        by:        t('admin.rep_generated_by'),
        total:     t('admin.rep_total'),
        previous:  t('admin.rep_previous'),
        variation: t('admin.rep_variation'),
        series:    t('admin.rep_series'),
        bucket:    t('admin.rep_bucket'),
        value:     t('admin.rep_value'),
        breakdown: t('admin.rep_breakdown'),
        entry:     t('admin.rep_entry'),
        share:     t('admin.rep_share'),
        quota:     t('admin.rep_quota'),
        used:      t('admin.rep_used'),
        truncated: t('admin.rep_truncated', { count: model.breakdown.length }),
        none:      t('admin.rep_nothing'),
        // The records section, spelt here rather than in `csv.ts`: the file and
        // the page must carry the SAME sentences, and they can only do that if
        // one place translates them.
        detail:     t('admin.rep_detail'),
        detailNone: model.detail || !model.detailAbsent
          ? ''
          : t(`admin.rep_detail_none_${model.detailAbsent}`, {
              defaultValue: t('admin.rep_detail_none'),
            }),
        detailCount: model.detail
          ? t('admin.rep_detail_count', {
              listed: model.detail.rows.length.toLocaleString(i18n.language),
              total:  panel.total.toLocaleString(i18n.language),
            })
          : '',
        detailTruncated: model.detail?.truncated
          ? t('admin.rep_detail_truncated', {
              limit: model.detail.limit.toLocaleString(i18n.language),
            })
          : '',
      },
      i18n.language,
    )
    downloadCsv(csvFilename(def.id, periodId), toCsv(rows, i18n.language))
  }, [model, instance, title, about, periodLabel, generatedAt, author, t, i18n.language, def.id, periodId, panel.total])

  // ONE palette, read by the chart and by the table, so a slice and its row
  // carry the same colour. Panels that assign meaning to a colour (active /
  // suspended / pending) keep theirs — `sliceTone` is the panel's own word.
  const tones = useCallback(
    (key: string, i: number) => def.sliceTone?.(key) ?? series[i % series.length],
    [def, series],
  )

  /** The chart of the panel, at document width. */
  const chart = (() => {
    if (def.shape === 'gauge') {
      const capacity = panel.capacity ?? 0
      if (capacity <= 0) return null
      const pct = (panel.total / capacity) * 100
      return (
        <ProgressRing
          pct={pct}
          value={`${Math.round(pct)} %`}
          label={title}
          size={180}
          color={pct >= 90 ? 'var(--color-danger)' : series[0]}
          sub={`${model.fmt(panel.total)} / ${model.fmt(capacity)}`}
        />
      )
    }
    if (def.shape === 'donut') {
      if (model.breakdown.length === 0) return null
      return (
        <DonutChart
          size={180}
          centerValue={model.totalText}
          data={model.breakdown.map((s, i) => ({
            label: s.label,
            value: s.value,
            color: tones(s.key, i),
          }))}
        />
      )
    }
    if (def.shape === 'ranking') {
      if (model.breakdown.length === 0) return null
      const largest = Math.max(1, ...model.breakdown.map(s => s.value))
      // A ranking's height grows with its ENTRIES, not with the paper: sixteen
      // modules make a chart taller than a landscape sheet, which then prints
      // clipped. It is capped — and the cap is STATED, right under the chart,
      // with a pointer to the breakdown below, which stays exhaustive. A silent
      // truncation would read as "that is all there was".
      return (
        <HBarList
          color={series[0]}
          items={model.breakdown.slice(0, CHART_ENTRIES).map((s, i) => ({
            label: s.label,
            value: s.value,
            max:   s.capacity ?? largest,
            sub:   s.capacity ? `${s.text} / ${model.fmt(s.capacity)}` : s.text,
            color: tones(s.key, i),
          }))}
        />
      )
    }
    if (model.series.length === 0) return null
    return (
      <ReportSeriesChart
        shape={def.shape === 'area' ? 'area' : 'bars'}
        color={series[0]}
        unit={model.bytes ? model.fmt : undefined}
        data={model.series.map(r => ({ label: r.axis, value: r.value }))}
      />
    )
  })()

  // ── The document, as the list the paginator cuts ───────────────────────────
  // Order is reading order. Ids are stable strings rather than indexes: they key
  // the measurements, and an index would silently re-key everything the day a
  // block is inserted in the middle.

  /** The complementary chart: a ranking beside a curve, a curve beside a donut. */
  const secondChart = (() => {
    const timeShape = def.shape !== 'donut' && def.shape !== 'ranking' && def.shape !== 'gauge'
    if (timeShape) {
      if (model.breakdown.length < 2) return null
      const largest = Math.max(1, ...model.breakdown.map(s => s.value))
      return {
        titleKey: 'admin.rep_chart_breakdown',
        capped: model.breakdown.length > CHART_ENTRIES,
        node: (
          <HBarList
            color={series[0]}
            items={model.breakdown.slice(0, CHART_ENTRIES).map((s, i) => ({
              label: s.label,
              value: s.value,
              max:   largest,
              sub:   s.text,
              color: tones(s.key, i),
            }))}
          />
        ),
      }
    }
    if (model.series.length < 2) return null
    return {
      titleKey: 'admin.rep_chart_series',
      capped: false,
      node: (
        <ReportSeriesChart
          shape="area"
          color={series[0]}
          unit={model.bytes ? model.fmt : undefined}
          data={model.series.map(r => ({ label: r.axis, value: r.value }))}
        />
      ),
    }
  })()


  const seriesItem    = useSeriesItem(model)
  const breakdownItem = useBreakdownItem(model, tones)
  const detailItem    = useDetailItem(model, panel.total)

  const items: FlowItem[] = [
    {
      kind: 'atom',
      id:   'head',
      node: (
        <ReportHeader
          instance={instance}
          title={title}
          about={about}
          periodLabel={periodLabel}
          generatedAt={generatedAt}
          generatedBy={author}
          model={model}
        />
      ),
    },
    // Read first, because it is what the rest of the document is FOR.
    { kind: 'atom', id: 'summary', node: <ReportSummary model={model} /> },
    ...(chart ? [{
      kind: 'atom' as const,
      id:   'chart',
      node: (
        <ReportBlock
          title={t('admin.rep_chart')}
          note={model.breakdown.length > CHART_ENTRIES && (def.shape === 'ranking' || def.shape === 'donut')
            ? t('admin.rep_chart_top', { count: CHART_ENTRIES, total: model.breakdown.length })
            : undefined}
        >
          {chart}
        </ReportBlock>
      ),
    }] : []),
    // ── The OTHER view ────────────────────────────────────────────────────
    // A time series answers "when", a breakdown answers "who" — and a report
    // that only ever draws one of the two leaves the other as a wall of rows.
    // So whichever the panel's own chart is, the complementary one is drawn
    // beside it when the data for it exists. Nothing here is a new measurement:
    // both come from the same model the tables print.
    ...(secondChart ? [{
      kind: 'atom' as const,
      id:   'chart2',
      node: (
        <ReportBlock
          title={t(secondChart.titleKey)}
          note={secondChart.capped
            ? t('admin.rep_chart_top', { count: CHART_ENTRIES, total: model.breakdown.length })
            : undefined}
        >
          {secondChart.node}
        </ReportBlock>
      ),
    }] : []),

    {
      kind: 'atom',
      id:   'figures',
      node: (
        <ReportBlock title={t('admin.rep_figures')}>
          <dl className="grid grid-cols-3 gap-4">
            <div>
              <dt className="text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
                {t('admin.rep_total')}
              </dt>
              <dd className="mt-0.5 tabular-nums text-text-primary" style={{ fontSize: 'var(--kb-text-title)' }}>
                {model.totalText}
              </dd>
            </div>
            <div>
              <dt className="text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
                {t('admin.rep_previous')}
              </dt>
              <dd className="mt-0.5 tabular-nums text-text-primary" style={{ fontSize: 'var(--kb-text-body)' }}>
                {model.snapshot ? t('admin.dash_snapshot') : model.previousText}
              </dd>
              {!model.snapshot && (
                <dd className="text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
                  {t('admin.rep_window_value', { from: model.previousFrom, to: model.previousTo })}
                </dd>
              )}
            </div>
            <div>
              <dt className="text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
                {t('admin.rep_variation')}
              </dt>
              <dd className="mt-0.5 tabular-nums text-text-primary" style={{ fontSize: 'var(--kb-text-body)' }}>
                {/* No arrow and no colour here. On paper a red arrow is a grey
                    one, and "worse" is a judgement the card makes for a glance —
                    a document states the figure and lets the reader judge. */}
                {model.snapshot
                  ? t('admin.rep_no_variation_snapshot')
                  : model.delta === null
                    ? t('admin.rep_no_variation')
                    : `${model.delta > 0 ? '+' : ''}${model.delta.toLocaleString(i18n.language)} %`}
              </dd>
            </div>
          </dl>
        </ReportBlock>
      ),
    },
    seriesItem,
    breakdownItem,
    ...(detailItem ? [detailItem] : []),
    { kind: 'atom', id: 'method',  node: <MethodBlock source={panel.source} model={model} /> },
    { kind: 'atom', id: 'caveats', node: <CaveatBlock def={def} caveat={panel.caveat} /> },
  ]

  // What tells the preview its content changed. Row counts are in it because a
  // period switch is exactly what changes them; the language, because every
  // height on the sheet depends on it.
  const revision = [
    def.id, periodId, i18n.language, generatedAt,
    model.series.length, model.breakdown.length, model.detail?.rows.length ?? 0,
  ].join('|')

  const footer = (page: number, total: number) => (
    <>
      <span>{t('admin.rep_footer', { instance, date: generatedAt })}</span>
      <span>{t('admin.rep_page_of', { page, total })}</span>
    </>
  )

  return (
    <div>
      {/* ── The controls. Not part of the document: `no-print` is the helper the
          global print stylesheet already hides.

          Pinned to the top of the panel: the paper, the orientation, the cover
          and the printer are decided WHILE looking at the sheets, and a bar that
          scrolls away on page 4 means scrolling back to page 1 to reach it. The
          negative margins let the bar bleed to the panel's edges so the sheets
          pass under a full-width band rather than beside a floating card. ── */}
      <div
        ref={barRef}
        className="no-print sticky z-20 -mx-6 mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-border bg-surface-0 px-6 py-3"
        style={{ top: crumbH - 24 }}
      >
        <Dropdown value={periodId} onChange={onPeriod} options={periodOptions} width={200} focusable />
        <div className="flex flex-wrap items-center gap-2">
          {/* The three things that change where the cuts fall. They belong next
              to "Imprimer" because that is when somebody wonders about them. */}
          <Dropdown
            value={paper}
            onChange={setPaper}
            options={[
              { value: 'a4',     label: 'A4' },
              { value: 'letter', label: t('admin.rep_paper_letter') },
            ]}
            width={110}
            focusable
          />
          <Dropdown
            value={orientation}
            onChange={v => setOrientation(v as Orientation)}
            options={[
              { value: 'portrait',  label: t('admin.rep_portrait') },
              { value: 'landscape', label: t('admin.rep_landscape') },
            ]}
            width={140}
            focusable
          />
          <Toggle
            size="sm"
            label={t('admin.rep_cover')}
            checked={cover}
            onChange={e => setCover(e.currentTarget.checked)}
          />
          {/* The stamp opens its own panel rather than sitting in the toolbar:
              it is a picture OR words, with a size, an opacity and an angle —
              four controls that have no business crowding the print button. */}
          <WatermarkPanel value={watermark} onChange={setWatermark} />
          <Button
            variant="secondary"
            icon={<Download size={15} />}
            onClick={exportCsv}
          >
            {t('admin.rep_export')}
          </Button>
          <Button
            variant="primary"
            icon={<Printer size={15} />}
            onClick={() => window.print()}
          >
            {t('admin.rep_print')}
          </Button>
        </div>
      </div>

      {/* ── The sheets. Not a rendering of the document that will later be
          printed — the document itself, cut into pages here rather than by the
          engine after the operator has clicked. ── */}
      <PagedPreview
        items={items}
        format={PAPER[paper] ?? PAPER.a4}
        orientation={orientation}
        revision={`${revision}|${cover}`}
        watermark={watermark}
        // Where the frozen band ends, so the rail of thumbnails can pin under it
        // rather than slide behind it.
        bandHeight={crumbH + barH}
        onToggleCover={() => setCover(c => !c)}
        onOrientation={setOrientation}
        cover={cover ? (
          <CoverSheet
            instance={instance}
            title={title}
            about={about}
            periodLabel={periodLabel}
            generatedAt={generatedAt}
            generatedBy={author}
            model={model}
          />
        ) : undefined}
        footer={footer}
      />
    </div>
  )
}
