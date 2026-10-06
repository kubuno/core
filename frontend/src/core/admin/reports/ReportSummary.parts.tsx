/**
 * The parts of `ReportSummary.kbview` still written in React (the codemod could not convert them; see the
 * TODO comments in the view). Each is rendered by a `<ReactHost>` with the values it reads as props.
 */
import type { ReportSummary } from './ReportSummary'

export function Part1({ t, model, tone, Arrow, model_delta, i18n, facts }: { t: NonNullable<ReportSummary['tr']>; model: NonNullable<ReportSummary['props']['model']>; tone: NonNullable<ReportSummary['tone']>; Arrow: NonNullable<ReportSummary['Arrow']>; model_delta: number; i18n: NonNullable<ReportSummary['i18n']>; facts: NonNullable<ReportSummary['facts']> }) {
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
                  {`${model_delta > 0 ? '+' : ''}${model_delta.toLocaleString(i18n.language)} %`}
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
