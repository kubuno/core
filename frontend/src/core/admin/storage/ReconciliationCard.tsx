import { useTranslation } from 'react-i18next'
import { AlertTriangle, PauseCircle, Scale } from 'lucide-react'
import { Badge, Callout, Card } from '@ui'
import { formatBytes } from '../sections/format'
import { Figure } from './charts'
import type { ModuleUsage, Reconciliation, ReconciliationBlocker } from './api'

/**
 * The counter reconciliation — the hourly job that realigns each account's quota
 * counter on what the modules declare.
 *
 * ## Why this card refuses to be reassuring
 *
 * A drifting counter is not cosmetic: it is the number enforcement reads, so an
 * account can be stopped for bytes it does not hold, or keep writing past a
 * ceiling it passed weeks ago. The card therefore reports the drift even when
 * the correction is off, and never rounds a suspension down to "everything is
 * fine": a job that is not running is a fact the operator has to be handed, not
 * an absence they have to notice.
 *
 * ## `held_back`
 *
 * The accounts the correction would push **over their quota**, and that the core
 * deliberately leaves alone rather than locking somebody out overnight from a
 * background job. They are the one thing on this page that genuinely needs a
 * person: either the quota is wrong, or the account really does hold that much
 * and somebody has to decide. Listed, with all three numbers, never summarised
 * into a count.
 */

const BLOCKER_KEY: Record<ReconciliationBlocker, string> = {
  never_fully_synced: 'admin.sto_rec_blocker_never_synced',
  stale:              'admin.sto_rec_blocker_stale',
  no_declarant:       'admin.sto_rec_blocker_no_declarant',
}

export default function ReconciliationCard({
  data, modules, staleHours,
}: {
  data:       Reconciliation
  /** Only to put a display name on a blocking module id. */
  modules:    ModuleUsage[]
  staleHours: number
}) {
  const { t } = useTranslation()

  const nameOf = (id: string) =>
    modules.find(m => m.module_id === id)?.display_name ?? id

  const blocks = data.blocked_by ?? []
  const held   = data.held_back ?? []

  return (
    <Card
      title={t('admin.sto_rec_title')}
      icon={<Scale size={16} />}
      subtitle={t('admin.sto_rec_sub')}
      actions={
        <Badge variant={data.enabled ? 'success' : 'default'} dot>
          {data.enabled ? t('admin.sto_rec_on') : t('admin.sto_rec_off')}
        </Badge>
      }
    >
      <p className="text-text-secondary" style={{ fontSize: 'var(--kb-text-body)' }}>
        {data.enabled ? t('admin.sto_rec_on_desc') : t('admin.sto_rec_off_desc')}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-4 border-t border-border pt-4 sm:grid-cols-4">
        <Figure label={t('admin.sto_rec_fig_drifting')}>{data.drifting_accounts}</Figure>
        <Figure label={t('admin.sto_rec_fig_threshold')}>{formatBytes(data.min_delta_bytes)}</Figure>
        <Figure label={t('admin.sto_rec_fig_corrected')}>{data.corrected_accounts}</Figure>
        <Figure label={t('admin.sto_rec_fig_moved')}>{formatBytes(data.bytes_moved)}</Figure>
      </div>

      {/* The last two are structurally zero here — the overview measures, the
          hourly job corrects — and saying so is cheaper than letting somebody
          conclude the job is broken. */}
      <p className="mt-2 text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
        {t('admin.sto_rec_job_note')}
      </p>

      {/* ── What is holding it off ──────────────────────────────────────── */}
      {/* The reason, not just the name: "reconciliation is suspended" is not
          something anybody can act on; "photos has never sent a full state" is. */}
      {blocks.length > 0 && (
        <div className="mt-4 border-t border-border pt-4">
          <div className="flex items-center gap-2">
            <PauseCircle size={15} className="shrink-0 text-warning" aria-hidden />
            <p className="min-w-0 text-text-primary" style={{ fontSize: 'var(--kb-text-body)' }}>
              {t('admin.sto_rec_blocked_title', { count: blocks.length })}
            </p>
          </div>
          <ul className="mt-2 flex flex-col gap-2">
            {blocks.map((b, i) => (
              <li key={`${b.blocker}:${b.module_id}:${i}`} className="min-w-0">
                <span className="text-text-primary" style={{ fontSize: 'var(--kb-text-body)' }}>
                  {b.module_id
                    ? nameOf(b.module_id)
                    : t('admin.sto_rec_blocker_scope_instance')}
                </span>
                <p className="text-text-secondary" style={{ fontSize: 'var(--kb-text-meta)' }}>
                  {t(BLOCKER_KEY[b.blocker] ?? 'admin.sto_rec_blocker_unknown', {
                    hours: staleHours,
                    blocker: b.blocker,
                  })}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── The accounts a machine must not touch ───────────────────────── */}
      {held.length > 0 && (
        <Callout
          variant="warning"
          className="mt-4"
          title={t('admin.sto_rec_held_title', { count: held.length })}
          t={t}
        >
          <p style={{ fontSize: 'var(--kb-text-body)' }}>{t('admin.sto_rec_held_desc')}</p>

          <ul className="mt-3 flex flex-col gap-2">
            {held.map(a => (
              <li key={a.user_id} className="min-w-0">
                <div className="truncate text-text-primary" style={{ fontSize: 'var(--kb-text-body)' }}>
                  {a.email}
                </div>
                <div className="tabular-nums text-text-secondary" style={{ fontSize: 'var(--kb-text-meta)' }}>
                  {t('admin.sto_rec_held_line', {
                    counter:  formatBytes(a.counter_bytes),
                    declared: formatBytes(a.declared_bytes),
                    quota:    formatBytes(a.quota_bytes),
                  })}
                </div>
              </li>
            ))}
          </ul>
        </Callout>
      )}

      {blocks.length === 0 && held.length === 0 && data.drifting_accounts > 0 && (
        <div className="mt-4 flex items-start gap-2">
          <AlertTriangle size={15} className="mt-0.5 shrink-0 text-warning" aria-hidden />
          <p className="min-w-0 text-text-secondary" style={{ fontSize: 'var(--kb-text-body)' }}>
            {t('admin.sto_rec_drift_note', { count: data.drifting_accounts })}
          </p>
        </div>
      )}
    </Card>
  )
}
