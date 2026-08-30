import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Bell, PartyPopper } from 'lucide-react'
import { formatAgo, formatWhen } from '../sections/format'
import { alertTitle, severityLabel, skinOf } from './labels'
import { useAlerts, useAlertSummary } from './useAlerts'
import { EMPTY_FILTERS } from './types'
import { adminUrl } from '../adminAction'

/**
 * The "Alerts" card of the administration landing page.
 *
 * It replaces a hard-coded, permanently empty card: it had no data source at
 * all, so it told every operator that everything was fine on every instance,
 * for ever. This one reads the queue, shows the three most urgent open alerts,
 * and — when there are none — says so *with the date of the last check*, which
 * is the difference between "nothing to report" and "nothing has looked".
 *
 * Rendered only for callers holding `core.alerts.read`: the card is a shortcut
 * into a section, and a card whose section is hidden must not reappear here.
 */
export default function AlertsCard() {
  const { t, i18n } = useTranslation()
  const { data: summary } = useAlertSummary()
  // Open alerts only, worst first — the queue's own default ordering.
  const { data, isLoading } = useAlerts({ ...EMPTY_FILTERS, severity: '' })
  const top = (data?.pages?.[0]?.alerts ?? []).slice(0, 3)

  return (
    <div className="rounded-xl border border-border bg-[#F0F4F9] p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <Bell size={20} className="shrink-0 text-text-secondary" />
          <h3 className="truncate text-text-primary" style={{ fontSize: 'var(--kb-text-body)' }}>
            {t('admin.home_alerts_title')}
          </h3>
          {summary && summary.open > 0 && (
            <span className="shrink-0 rounded-full bg-danger-light px-1.5 py-0.5 text-text-primary"
              style={{ fontSize: 'var(--kb-text-micro)' }}>
              {summary.open}
            </span>
          )}
        </div>
        <Link to={adminUrl({ tab: 'alerts' })} className="shrink-0 text-primary hover:underline"
          style={{ fontSize: 'var(--kb-text-meta)' }}>
          {t('admin.card_manage')}
        </Link>
      </div>

      {isLoading ? (
        <p className="py-4 text-center text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
          {t('common.loading')}
        </p>
      ) : top.length === 0 ? (
        /* The good empty state: celebrate it, and date it. */
        <div className="flex flex-col items-center justify-center gap-1.5 py-5 text-center">
          <PartyPopper size={24} className="text-success" />
          <p className="text-text-primary" style={{ fontSize: 'var(--kb-text-meta)' }}>
            {t('admin.al_empty_title')}
          </p>
          <p className="text-text-tertiary" style={{ fontSize: 'var(--kb-text-micro)' }}>
            {summary?.last_scan_at
              ? t('admin.al_empty_checked', { when: formatWhen(summary.last_scan_at, i18n.language) })
              : t('admin.al_empty_never_checked')}
          </p>
        </div>
      ) : (
        <ul className="min-w-0 space-y-2">
          {top.map(a => {
            const skin = skinOf(a)
            return (
              <li key={a.id} className="min-w-0">
                <Link to={adminUrl({ tab: 'alerts', params: { alert: a.id } })}
                  className="flex min-w-0 items-start gap-2 rounded-md px-1 py-1 hover:bg-surface-1
                             focus:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${skin.dot}`} aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-text-primary" style={{ fontSize: 'var(--kb-text-meta)' }}>
                      {alertTitle(t, a)}
                    </span>
                    <span className="block truncate text-text-tertiary" style={{ fontSize: 'var(--kb-text-micro)' }}>
                      {severityLabel(t, a.severity)} · {formatAgo(a.last_seen_at)}
                      {a.occurrences > 1 && ` · ×${a.occurrences}`}
                    </span>
                  </span>
                </Link>
              </li>
            )
          })}
          {summary && summary.open > top.length && (
            <li>
              <Link to={adminUrl({ tab: 'alerts' })} className="text-primary hover:underline"
                style={{ fontSize: 'var(--kb-text-meta)' }}>
                {t('admin.al_card_more', { count: summary.open - top.length })}
              </Link>
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
