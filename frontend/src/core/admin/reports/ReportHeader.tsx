import { useTranslation } from 'react-i18next'
import { InstanceLogo } from '../../shell/InstanceLogo'
import type { ReactNode } from 'react'
import type { ReportModel } from './model'

/**
 * The head of the document — the part that makes a printed sheet usable months
 * after it left the screen.
 *
 * Six facts, and each one answers a question somebody holding the paper WILL
 * ask: which instance is this, what was measured, over exactly which stretch of
 * time, in which zone those two dates are stated, when the reading was taken,
 * and by whom. A report missing any of them is a page of numbers: it cannot be
 * filed, compared with the next one, or defended to anybody.
 *
 * The zone is not decoration. Two administrators in two countries reading "du
 * 1er au 30 juin" mean different windows unless the page says which clock the
 * bounds are on; the server states it (`period.timezone`), and it is printed.
 */

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

export default function ReportHeader({
  instance, title, about, periodLabel, generatedAt, generatedBy, model,
}: {
  /** What the instance calls itself, or its host name as a last resort. */
  instance:    string
  title:       string
  about:       string
  /** The window's own name — "30 derniers jours", "mois dernier". */
  periodLabel: string
  generatedAt: string
  generatedBy: string
  model:       ReportModel
}) {
  const { t } = useTranslation()

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
