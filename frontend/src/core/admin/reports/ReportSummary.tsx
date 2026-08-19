import { useTranslation } from 'react-i18next'
import { ArrowDownRight, ArrowRight, ArrowUpRight } from 'lucide-react'
import type { ReportModel } from './model'

/**
 * "En bref" — what the figures below actually say.
 *
 * ## Why a report needs it
 *
 * A page of correct tables can still leave its reader with nothing: the peak is
 * a row among ninety, the concentration is a column of percentages nobody adds
 * up, and "+129 %" means little without the two numbers it compares. This block
 * states the three or four things a reader would have worked out, in the order
 * they would have worked them out.
 *
 * ## Every sentence is COMPUTED
 *
 * Not one of them is written in advance and filled in. Each is derived from the
 * model — the peak from the series, the concentration from the breakdown, the
 * variation from the comparison window — and each carries the figure it is
 * derived from, so a reader can check it against the table below rather than
 * believe it. A sentence that could not be computed is simply absent; there is
 * no filler, and nothing is rounded into a claim the data does not support.
 *
 * That is also why there is no interpretation: the block says "le 4 août
 * concentre 27 % du total", never "activité anormale". The first is arithmetic,
 * the second is a judgement the document has no business making.
 */
export default function ReportSummary({ model }: { model: ReportModel }) {
  const { t, i18n } = useTranslation()
  const pct = (v: number) => `${v.toLocaleString(i18n.language, { maximumFractionDigits: 1 })} %`

  const facts: string[] = []

  // ── The peak of the series ────────────────────────────────────────────────
  // Only when there is something to peak: a flat run of zeros has no busiest
  // day, and saying it does would be noise dressed as a finding.
  const peak = model.series.reduce<{ label: string; value: number } | null>(
    (best, r) => (best === null || r.value > best.value ? { label: r.label, value: r.value } : best),
    null,
  )
  const seriesSum = model.series.reduce((a, r) => a + r.value, 0)
  if (peak && peak.value > 0 && model.series.length > 1) {
    facts.push(
      seriesSum > 0
        ? t('admin.rep_sum_peak_share', {
            label: peak.label,
            value: model.fmt(peak.value),
            share: pct((peak.value / seriesSum) * 100),
          })
        : t('admin.rep_sum_peak', { label: peak.label, value: model.fmt(peak.value) }),
    )
    // A window whose activity sits on a single interval is a different animal
    // from one where it is spread; the reader is told which, with the figure.
    const empty = model.series.filter(r => r.value === 0).length
    if (empty > 0 && empty < model.series.length) {
      facts.push(t('admin.rep_sum_quiet', { count: empty, total: model.series.length }))
    }
  }

  // ── Concentration of the breakdown ────────────────────────────────────────
  if (model.breakdown.length >= 3 && model.breakdownTotal > 0) {
    const top3 = model.breakdown.slice(0, 3).reduce((a, r) => a + r.value, 0)
    facts.push(t('admin.rep_sum_top3', {
      count: Math.min(3, model.breakdown.length),
      entries: model.breakdown.length,
      share: pct((top3 / model.breakdownTotal) * 100),
    }))
  } else if (model.breakdown.length > 0 && model.breakdownTotal > 0) {
    const first = model.breakdown[0]
    if (first.share !== null) {
      facts.push(t('admin.rep_sum_leader', { label: first.label, share: pct(first.share) }))
    }
  }

  // ── The comparison ────────────────────────────────────────────────────────
  if (!model.snapshot && model.delta !== null && model.previous !== null) {
    facts.push(t(model.delta >= 0 ? 'admin.rep_sum_up' : 'admin.rep_sum_down', {
      delta:    pct(Math.abs(model.delta)),
      previous: model.fmt(model.previous),
    }))
  }

  if (facts.length === 0) return null

  const rising  = (model.delta ?? 0) > 0
  const falling = (model.delta ?? 0) < 0
  const tone = model.snapshot || model.delta === null ? 'var(--color-text-secondary)'
    : rising ? 'var(--color-success)' : falling ? 'var(--color-danger)' : 'var(--color-text-secondary)'
  const Arrow = model.delta === null || model.snapshot ? ArrowRight : rising ? ArrowUpRight : ArrowDownRight

  return (
    <section data-report-card data-report-summary className="mt-4 rounded-xl border border-border bg-surface-0 p-4">
      <h2 className="mb-3 text-text-primary" style={{ fontSize: 'var(--kb-text-heading)' }}>
        {t('admin.rep_summary')}
      </h2>

      <div className="flex flex-wrap items-start gap-x-6 gap-y-3">
        {/* The headline figure, once, big — a reader who reads nothing else
            leaves with the number and its direction. */}
        <div className="min-w-40">
          <p className="text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
            {t('admin.rep_total')}
          </p>
          <p className="tabular-nums" style={{ fontSize: '26pt', lineHeight: 1.1 }}>{model.totalText}</p>
          {!model.snapshot && model.delta !== null && (
            <p data-tone className="mt-0.5 flex items-center gap-1 tabular-nums" style={{ color: tone, fontSize: 'var(--kb-text-body)' }}>
              <Arrow size={14} aria-hidden />
              {`${model.delta > 0 ? '+' : ''}${model.delta.toLocaleString(i18n.language)} %`}
            </p>
          )}
        </div>

        <ul className="min-w-0 flex-1 space-y-1.5">
          {facts.map((f, i) => (
            <li
              key={i}
              className="flex gap-2 text-text-primary"
              style={{ fontSize: 'var(--kb-text-body)' }}
            >
              <span data-tone aria-hidden style={{ color: 'var(--color-primary)' }}>—</span>
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
