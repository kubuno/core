import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle2, HeartPulse } from 'lucide-react'
import { Button, Card, ProgressBar } from '@ui'
import { checkActionLabel, checkTitle, checkValue, checkWhy, skinOf } from './labels'
import { openTasks, useHealthChecks } from './useHealthChecks'
import { actionHref, type HealthCheck } from './types'
import { adminUrl } from '../adminAction'

/**
 * "Getting started" — the landing card that eventually goes away.
 *
 * The deliberate design decision behind it: **no blocking setup wizard**. The
 * operator arrived through a command line and the installation is already done;
 * a six-step corridor is something they will click past. So the console offers
 * a permanent health page, plus this card — which shows at most four tasks,
 * worst first, and *disappears* once there is nothing left to settle. The only
 * screen still imposed is the seeded-password change, which was already
 * shipped.
 *
 * It shows the same server-computed report as the health page. Nothing is
 * recomputed here: the card is a view of the first four rows.
 */
const MAX_TASKS = 4

function TaskRow({ check }: { check: HealthCheck }) {
  const { t, i18n } = useTranslation()
  const [showWhy, setShowWhy] = useState(false)
  const skin = skinOf(check)

  return (
    <li className="border-t border-border py-3 first:border-t-0 first:pt-0">
      {/* Mobile puts the action under the text; from `sm` it sits opposite. */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${skin.dot}`} aria-hidden />
            <div className="min-w-0">
              <p className="text-text-primary">{checkTitle(t, check)}</p>
              <p className="text-text-secondary" style={{ fontSize: 'var(--kb-text-meta)' }}>
                {checkValue(t, check, i18n.language)}
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-expanded={showWhy}
            onClick={() => setShowWhy(v => !v)}
            className="ml-4 mt-1 rounded-sm text-primary underline-offset-2 hover:underline
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            style={{ fontSize: 'var(--kb-text-meta)' }}
          >
            {t('admin.hc_why')}
          </button>
          {showWhy && (
            <p
              className="ml-4 mt-1 max-w-prose leading-relaxed text-text-secondary"
              style={{ fontSize: 'var(--kb-text-meta)' }}
            >
              {checkWhy(t, check)}
            </p>
          )}
        </div>

        {check.action && (
          <Link to={actionHref(check.action)} className="shrink-0 self-start">
            {/* `secondary`, never bold: the card is a to-do list, and four
                primary buttons in a column would each claim to be the one. */}
            <Button variant="secondary" size="sm">{checkActionLabel(t, check)}</Button>
          </Link>
        )}
      </div>
    </li>
  )
}

export default function GettingStartedCard() {
  const { t } = useTranslation()
  const { data, isLoading, isError } = useHealthChecks()

  // Silent while unknown, and silent on failure: a landing page must not open
  // with an error about a card the operator did not ask for. The health page
  // itself reports the failure properly.
  if (isLoading || isError || !data) return null

  const tasks = openTasks(data.checks)
  const settled = data.counts.ok
  const scoreable = data.counts.ok + data.counts.todo + data.counts.blocked

  // Everything handled: the card is replaced by one discreet line, which is
  // itself a link into the health page rather than a dead-end congratulation.
  if (tasks.length === 0) {
    return (
      <div className="mb-4 flex items-center gap-2 text-text-secondary" style={{ fontSize: 'var(--kb-text-body)' }}>
        <CheckCircle2 size={16} className="shrink-0 text-success" aria-hidden />
        <span>{t('admin.hc_all_clear')}</span>
        <Link
          to={adminUrl({ tab: 'security-health' })}
          className="rounded-sm text-primary underline-offset-2 hover:underline
                     focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {t('admin.hc_open_page')}
        </Link>
      </div>
    )
  }

  const shown = tasks.slice(0, MAX_TASKS)

  return (
    <Card
      className="mb-4"
      icon={<HeartPulse size={18} />}
      title={t('admin.hc_getting_started')}
      subtitle={t('admin.hc_getting_started_sub')}
      footer={
        <Link
          to={adminUrl({ tab: 'security-health' })}
          className="inline-flex items-center gap-1.5 rounded-sm text-primary underline-offset-2
                     hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          style={{ fontSize: 'var(--kb-text-body)' }}
        >
          {t('admin.hc_see_all', { n: tasks.length })}
          <ArrowRight size={14} aria-hidden />
        </Link>
      }
    >
      <ProgressBar
        className="mb-3"
        value={settled}
        max={Math.max(scoreable, 1)}
        variant="primary"
        showValue
        label={t('admin.hc_progress')}
        formatValue={() => t('admin.hc_progress_value', { done: settled, total: scoreable })}
      />
      <ul className="min-w-0">
        {shown.map(c => <TaskRow key={c.id} check={c} />)}
      </ul>
    </Card>
  )
}
