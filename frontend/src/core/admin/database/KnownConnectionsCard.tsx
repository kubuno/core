import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Database, Check, TriangleAlert, ArrowRightLeft, Copy, Trash2, RefreshCw } from 'lucide-react'
import { Button, Callout, Card, Spinner, useToast } from '@ui'
import ConfirmDialog from '@ui/ConfirmDialog'
import { api } from '../../api/client'
import { apiErrorMessage } from '../../api/errorMessage'
import { useConfirm } from '../../hooks/useConfirm'
import { usePrivileges } from '../../authz/usePrivileges'

/**
 * Administration ▸ Database ▸ "Known connections" — the registry of every
 * database a scope (the main database or one module) has pointed at, so an
 * administrator never loses access to a previous database after a switch.
 *
 * Per row (except the current one):
 *   • Switch (existing data) — re-point at it and restart, using ITS data as-is.
 *   • Switch (overwrite)     — copy the current data onto it, then re-point.
 *   • Update its data        — copy the current data onto it WITHOUT switching.
 *   • Forget                 — drop it from the registry (never the current one).
 *
 * `basePath` is the scope's admin base (`/admin/database` or
 * `/admin/modules/<id>/database`); `queryKey` scopes the cache. `onChanged` lets
 * the parent card refresh its own view after a switch. Passwords are never shown:
 * a row reports only whether one is stored.
 */

interface Conn {
  id: string
  engine: string
  host: string
  port: number | null
  user: string
  database: string
  path: string
  schema_prefix: string | null
  label: string
  has_password: boolean
  is_current: boolean
  created_at: string
  last_used_at: string
  last_synced_at: string | null
}

interface ConnectionsResponse {
  scope: string
  connections: Conn[]
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString()
}

export default function KnownConnectionsCard({
  basePath,
  queryKey,
  onChanged,
  embedded = false,
  heading,
}: {
  basePath: string
  queryKey: (string | undefined)[]
  onChanged?: () => void
  /** Render the list as a section (no Card chrome), to sit inside a parent card. */
  embedded?: boolean
  /** Section heading, used in embedded mode. */
  heading?: string
}) {
  const { t } = useTranslation()
  const { isSuperuser } = usePrivileges()
  const toast = useToast()
  const qc = useQueryClient()
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm()

  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const q = useQuery<ConnectionsResponse>({
    queryKey: ['db-connections', ...queryKey],
    queryFn: () => api.get<ConnectionsResponse>(`${basePath}/connections`).then(r => r.data),
    enabled: isSuperuser,
    staleTime: 15_000,
  })

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ['db-connections', ...queryKey] })
    onChanged?.()
  }

  const switchMut = useMutation({
    mutationFn: (v: { id: string; overwrite: boolean }) =>
      api.post(`${basePath}/connections/${v.id}/switch`, { overwrite: v.overwrite }).then(r => r.data),
    onMutate: (v) => { setBusyId(v.id); setError(null) },
    onSuccess: (data: { restart_required?: boolean }) => {
      toast.success(data?.restart_required ? t('admin.dbconn_switched_restart') : t('admin.dbconn_switched'))
      refresh()
    },
    onError: (e: unknown) => setError(apiErrorMessage(e, t('admin.dbconn_switch_failed'))),
    onSettled: () => setBusyId(null),
  })

  const syncMut = useMutation({
    mutationFn: (id: string) => api.post(`${basePath}/connections/${id}/sync`).then(r => r.data),
    onMutate: (id) => { setBusyId(id); setError(null) },
    onSuccess: () => { toast.success(t('admin.dbconn_synced')); refresh() },
    onError: (e: unknown) => setError(apiErrorMessage(e, t('admin.dbconn_sync_failed'))),
    onSettled: () => setBusyId(null),
  })

  const forgetMut = useMutation({
    mutationFn: (id: string) => api.delete(`${basePath}/connections/${id}`).then(r => r.data),
    onMutate: (id) => { setBusyId(id); setError(null) },
    onSuccess: () => { toast.success(t('admin.dbconn_forgotten')); refresh() },
    onError: (e: unknown) => setError(apiErrorMessage(e, t('admin.dbconn_forget_failed'))),
    onSettled: () => setBusyId(null),
  })

  if (!isSuperuser) return null

  const onSwitchExisting = async (c: Conn) => {
    const ok = await confirm({
      title: t('admin.dbconn_switch_existing'),
      message: t('admin.dbconn_switch_existing_confirm', { label: c.label }),
      confirmLabel: t('admin.dbconn_switch_existing'),
    })
    if (ok) switchMut.mutate({ id: c.id, overwrite: false })
  }

  const onSwitchOverwrite = async (c: Conn) => {
    const ok = await confirm({
      title: t('admin.dbconn_switch_overwrite'),
      message: t('admin.dbconn_switch_overwrite_confirm', { label: c.label }),
      confirmLabel: t('admin.dbconn_switch_overwrite'),
      variant: 'danger',
    })
    if (ok) switchMut.mutate({ id: c.id, overwrite: true })
  }

  const onSync = async (c: Conn) => {
    const ok = await confirm({
      title: t('admin.dbconn_sync'),
      message: t('admin.dbconn_sync_confirm', { label: c.label }),
      confirmLabel: t('admin.dbconn_sync'),
      variant: 'danger',
    })
    if (ok) syncMut.mutate(c.id)
  }

  const onForget = async (c: Conn) => {
    const ok = await confirm({
      title: t('admin.dbconn_forget'),
      message: t('admin.dbconn_forget_confirm', { label: c.label }),
      confirmLabel: t('admin.dbconn_forget'),
      variant: 'danger',
    })
    if (ok) forgetMut.mutate(c.id)
  }

  const meta = (c: Conn) => {
    const parts: string[] = [t(`admin.mdb_engine_${c.engine}`, c.engine)]
    if (c.engine === 'sqlite') {
      if (c.path) parts.push(c.path)
    } else {
      const hostPart = c.port ? `${c.host}:${c.port}` : c.host
      if (hostPart) parts.push(hostPart)
      if (c.database) parts.push(c.database)
    }
    return parts.join(' · ')
  }

  const conns = q.data?.connections ?? []

  const body = (
    <>
      {q.isLoading ? (
        <div className="py-6 flex justify-center"><Spinner /></div>
      ) : q.isError ? (
        <Callout variant="danger" icon={<TriangleAlert size={16} />}>{t('admin.dbconn_load_error')}</Callout>
      ) : conns.length === 0 ? (
        <p className="text-text-secondary" style={{ fontSize: 'var(--kb-text-meta)' }}>
          {t('admin.dbconn_empty')}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {error && <Callout variant="danger" title={t('admin.dbconn_error')}>{error}</Callout>}
          {conns.map((c) => {
            const rowBusy = busyId === c.id
            return (
              <div key={c.id} className="rounded-lg border border-border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{c.label}</span>
                      {c.is_current && (
                        <span className="inline-flex items-center gap-1 text-success"
                          style={{ fontSize: 'var(--kb-text-meta)' }}>
                          <Check size={13} />{t('admin.dbconn_current')}
                        </span>
                      )}
                    </div>
                    <div className="text-text-secondary truncate" style={{ fontSize: 'var(--kb-text-meta)' }}>
                      {meta(c)}
                    </div>
                    <div className="text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
                      {t('admin.dbconn_last_used', { when: fmtDate(c.last_used_at) })}
                      {c.last_synced_at && ` · ${t('admin.dbconn_last_synced', { when: fmtDate(c.last_synced_at) })}`}
                    </div>
                  </div>
                </div>

                {!c.is_current && (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Button variant="secondary" size="sm" icon={<ArrowRightLeft size={14} />}
                      onClick={() => onSwitchExisting(c)}
                      disabled={rowBusy} loading={rowBusy && switchMut.isPending}>
                      {t('admin.dbconn_switch_existing')}
                    </Button>
                    <Button variant="secondary" size="sm" icon={<Copy size={14} />}
                      onClick={() => onSwitchOverwrite(c)} disabled={rowBusy}>
                      {t('admin.dbconn_switch_overwrite')}
                    </Button>
                    <Button variant="secondary" size="sm" icon={<RefreshCw size={14} />}
                      onClick={() => onSync(c)} disabled={rowBusy}>
                      {t('admin.dbconn_sync')}
                    </Button>
                    <Button variant="ghost" size="sm" icon={<Trash2 size={14} />}
                      onClick={() => onForget(c)} disabled={rowBusy}>
                      {t('admin.dbconn_forget')}
                    </Button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
      {confirmState && (
        <ConfirmDialog {...confirmState} onConfirm={handleConfirm} onCancel={handleCancel} />
      )}
    </>
  )

  if (embedded) {
    return (
      <div>
        {heading && (
          <h3 className="mb-2 font-medium" style={{ fontSize: 'var(--kb-text-body)' }}>{heading}</h3>
        )}
        {body}
      </div>
    )
  }

  return (
    <Card title={t('admin.dbconn_title')} icon={<Database size={16} />} className="mb-4"
      subtitle={t('admin.dbconn_subtitle')}>
      {body}
    </Card>
  )
}
