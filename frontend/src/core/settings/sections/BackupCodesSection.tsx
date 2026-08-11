import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { KeyRound, RefreshCw } from 'lucide-react'
import { Button, Callout } from '@ui'
import { api } from '../../api/client'
import { BackupCodesPanel } from './BackupCodesPanel'

export interface BackupCodeStatus {
  remaining: number
  total: number
  generated_at: string | null
  low_threshold: number
  low: boolean
}

/**
 * Counter and regeneration for the account's backup codes.
 *
 * Regenerating is a **sensitive** action: the server refuses it with
 * `REAUTH_REQUIRED` and the API client's interceptor opens the dialog and
 * replays the call, so there is nothing to do here beyond issuing the request.
 */
export function BackupCodesSection() {
  const { t } = useTranslation()
  const [status, setStatus] = useState<BackupCodeStatus | null>(null)
  const [fresh, setFresh] = useState<string[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const { data } = await api.get<BackupCodeStatus>('/me/2fa/backup-codes')
      setStatus(data)
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? t('settings.error'))
    }
  }, [t])

  useEffect(() => { void load() }, [load])

  const regenerate = async () => {
    setBusy(true)
    setError('')
    try {
      const { data } = await api.post<{ codes: string[]; status: BackupCodeStatus }>(
        '/me/2fa/backup-codes',
      )
      setFresh(data.codes)
      setStatus(data.status)
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? t('settings.error'))
    } finally {
      setBusy(false)
    }
  }

  if (fresh) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-text-primary">{t('settings.bc_title')}</h3>
        <BackupCodesPanel codes={fresh} onDone={() => setFresh(null)} />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-text-primary">{t('settings.bc_title')}</h3>

      {status && status.low && (
        <Callout variant="warning" title={t('settings.bc_low_title')} t={t}>
          {t('settings.bc_low_desc', { count: status.remaining })}
        </Callout>
      )}

      <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-surface-1 border border-border">
        <KeyRound size={18} className="text-text-tertiary shrink-0" />
        <div>
          <p className="text-sm text-text-primary">
            {t('settings.bc_remaining', {
              count: status?.remaining ?? 0,
              total: status?.total ?? 0,
            })}
          </p>
          <p className="text-xs text-text-secondary mt-0.5">{t('settings.bc_desc')}</p>
        </div>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <Button
        variant="secondary"
        size="sm"
        icon={<RefreshCw size={14} />}
        loading={busy}
        onClick={regenerate}
      >
        {t('settings.bc_regenerate')}
      </Button>
    </div>
  )
}
