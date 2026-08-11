// What is loaded, in one line of figures.
//
// Four numbers, chosen because each one answers a question an operator arrives
// with: is the referential there at all, how much of it did we change, what did
// we add, and is anything stale. The dataset version is the fifth: when the
// binary ships a newer one than the database holds, the reload button is the
// only thing on this screen that matters, so it appears exactly then.

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RefreshCw } from 'lucide-react'
import { Button, Callout } from '@ui'
import { errorMessage, useHolidaysOverview, useReloadDataset } from './api'

function Figure({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="flex min-w-24 flex-col">
      <span className="text-text-primary" style={{ fontSize: 'var(--kb-text-section)' }}>{value}</span>
      <span className="text-text-secondary" style={{ fontSize: 'var(--kb-text-small)' }}>{label}</span>
    </div>
  )
}

export default function OverviewBar({ canManage }: { canManage: boolean }) {
  const { t } = useTranslation()
  const [error, setError] = useState<string | null>(null)

  const { data } = useHolidaysOverview()
  const reload = useReloadDataset()

  if (!data) return null

  const stale = data.dataset_loaded !== data.dataset_shipped

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-start gap-6 rounded border border-border bg-surface-1 px-4 py-3">
        <Figure value={data.countries}  label={t('admin.hol_stat_countries')} />
        <Figure value={data.holidays}   label={t('admin.hol_stat_days')} />
        <Figure value={data.overridden} label={t('admin.hol_stat_corrected')} />
        <Figure value={data.custom}     label={t('admin.hol_stat_custom')} />
        <div className="ms-auto flex items-center gap-3">
          <span className="text-text-tertiary" style={{ fontSize: 'var(--kb-text-small)' }}>
            {t('admin.hol_dataset', { version: data.dataset_loaded ?? '—' })}
          </span>
          {canManage && (
            <Button
              variant="ghost"
              disabled={reload.isPending}
              onClick={() => {
                setError(null)
                reload.mutate(undefined, { onError: e => setError(errorMessage(e, t('admin.hol_save_failed'))) })
              }}
            >
              <RefreshCw size={16} /> {t('admin.hol_reload')}
            </Button>
          )}
        </div>
      </div>

      {stale && (
        <Callout variant="warning" t={t}>
          {t('admin.hol_dataset_stale', { version: data.dataset_shipped })}
        </Callout>
      )}

      {/* An orphan is a day the newest dataset dropped but somebody here had
          edited: it is still served, and it is the one state worth surfacing on
          the landing rather than inside a territory nobody thinks to open. */}
      {data.orphans > 0 && (
        <Callout variant="info" t={t}>{t('admin.hol_orphans', { count: data.orphans })}</Callout>
      )}

      {error && (
        <p className="text-danger" role="alert" style={{ fontSize: 'var(--kb-text-body)' }}>{error}</p>
      )}
    </div>
  )
}
