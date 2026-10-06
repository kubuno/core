/**
 * The parts of `ReportHeader.kbview` still written in React (the codemod could not convert them; see the
 * TODO comments in the view). Each is rendered by a `<ReactHost>` with the values it reads as props.
 */
import { InstanceLogo } from "../../shell/InstanceLogo"
import type { ReactNode } from "react"
import type { ReportHeader } from './ReportHeader'

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>{label}</dt>
      <dd className="mt-0.5 text-text-primary" style={{ fontSize: 'var(--kb-text-body)' }}>
        {children}
      </dd>
    </div>
  )
}
export { Fact }

export function Part1({ instance, title, about, t, periodLabel, model, generatedAt, generatedBy }: { instance: NonNullable<ReportHeader['props']['instance']>; title: NonNullable<ReportHeader['props']['title']>; about: NonNullable<ReportHeader['props']['about']>; t: NonNullable<ReportHeader['tr']>; periodLabel: NonNullable<ReportHeader['props']['periodLabel']>; model: NonNullable<ReportHeader['props']['model']>; generatedAt: NonNullable<ReportHeader['props']['generatedAt']>; generatedBy: NonNullable<ReportHeader['props']['generatedBy']> }) {
  return (
    <header data-report-card className="rounded-xl border border-border bg-surface-0 p-4">
          {/* Whose sheet this is: the instance's own mark when an administrator set
              one (`instance.logo_url`), the product mark otherwise. A report that
              leaves the console should carry the organisation that produced it. */}
          <div className="flex items-center gap-2">
            <InstanceLogo size={20} className="text-primary" />
            <p className="min-w-0 truncate text-text-secondary" style={{ fontSize: 'var(--kb-text-body)' }}>
              {instance}
            </p>
          </div>
          <h1 className="mt-1 text-text-primary" style={{ fontSize: 'var(--kb-text-page)' }}>
            {title}
          </h1>
          <p className="mt-1 max-w-3xl text-text-secondary" style={{ fontSize: 'var(--kb-text-body)' }}>
            {about}
          </p>
    
          <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-3 border-t border-border pt-3 sm:grid-cols-2 lg:grid-cols-3">
            <Fact label={t('admin.rep_period')}>
              {periodLabel}
            </Fact>
            {/* Spelt out rather than abbreviated: "du 1er juin 2026 à 00:00 au 1er
                juillet 2026 à 00:00" is the sentence somebody can check. */}
            <Fact label={t('admin.rep_window')}>
              {t('admin.rep_window_value', { from: model.from, to: model.to })}
            </Fact>
            <Fact label={t('admin.rep_timezone')}>{model.timezone}</Fact>
            <Fact label={t('admin.rep_generated')}>{generatedAt}</Fact>
            <Fact label={t('admin.rep_generated_by')}>{generatedBy}</Fact>
          </dl>
        </header>
  )
}
