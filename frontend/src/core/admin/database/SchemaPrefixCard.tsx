import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Database, TriangleAlert } from 'lucide-react'
import { Button, Callout, Card, OutlinedField, Spinner, useToast } from '@ui'
import ConfirmDialog from '@ui/ConfirmDialog'
import { api } from '../../api/client'
import { apiErrorMessage } from '../../api/errorMessage'
import { useConfirm } from '../../hooks/useConfirm'
import { usePrivileges } from '../../authz/usePrivileges'

/**
 * Administration ▸ Database ▸ "Schema prefix" — change the WordPress-style
 * schema prefix on a running instance (superadmin only).
 *
 * The prefix namespaces every schema so several instances can share one server.
 * Changing it renames the live namespaces (PostgreSQL schemas / MySQL databases)
 * and asks for a core restart to finalise. It does not apply to SQLite, where
 * each schema is a file rather than a server namespace — the card says so and
 * disables the field there.
 */

const PRIMARY = 'var(--color-primary)'

interface PrefixResponse {
  prefix: string
  engine: string
  applicable: boolean
}

export default function SchemaPrefixCard() {
  const { t } = useTranslation()
  const { isSuperuser } = usePrivileges()
  const toast = useToast()
  const qc = useQueryClient()
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm()

  const cfg = useQuery({
    queryKey: ['schema-prefix'],
    queryFn: () => api.get<PrefixResponse>('/admin/database/schema-prefix').then(r => r.data),
    enabled: isSuperuser,
    staleTime: 30_000,
  })

  const [prefix, setPrefix] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string[] | null>(null)

  useEffect(() => {
    if (cfg.data) setPrefix(cfg.data.prefix)
  }, [cfg.data])

  const applicable = cfg.data?.applicable ?? true

  const saveMut = useMutation({
    mutationFn: () => api.put('/admin/database/schema-prefix', { prefix: prefix.trim() }).then(r => r.data),
    onSuccess: (data: { changed: boolean; renamed?: string[] }) => {
      setError(null)
      if (!data.changed) {
        toast.success(t('admin.dbprefix_unchanged'))
        return
      }
      setDone(data.renamed ?? [])
      toast.success(t('admin.dbprefix_saved'))
      void qc.invalidateQueries({ queryKey: ['schema-prefix'] })
    },
    onError: (e: unknown) => setError(apiErrorMessage(e, t('admin.dbprefix_failed'))),
  })

  if (!isSuperuser) return null

  const onSave = async () => {
    const ok = await confirm({
      title: t('admin.dbprefix_confirm_title'),
      message: t('admin.dbprefix_confirm_body', { prefix: prefix.trim() || t('admin.dbprefix_none') }),
      confirmLabel: t('admin.dbprefix_confirm_ok'),
      variant: 'danger',
    })
    if (ok) saveMut.mutate()
  }

  return (
    <Card title={t('admin.dbprefix_title')} icon={<Database size={16} />} className="mb-4"
      subtitle={t('admin.dbprefix_subtitle')}>
      {cfg.isLoading ? (
        <div className="py-6 flex justify-center"><Spinner /></div>
      ) : cfg.isError ? (
        <Callout variant="danger" icon={<TriangleAlert size={16} />}>{t('admin.dbprefix_load_error')}</Callout>
      ) : (
        <div className="flex flex-col gap-4">
          {!applicable && (
            <Callout variant="info">{t('admin.dbprefix_sqlite_na')}</Callout>
          )}
          {error && <Callout variant="danger" title={t('admin.dbprefix_error')}>{error}</Callout>}
          {done && (
            <Callout variant="success">
              {t('admin.dbprefix_done', { schemas: done.length ? done.join(', ') : '—' })}
              <div className="mt-1">{t('admin.dbprefix_restart_hint')}</div>
            </Callout>
          )}
          <div>
            <OutlinedField
              label={t('admin.dbprefix_field')}
              value={prefix}
              onChange={(v) => { setPrefix(v); setError(null) }}
              readOnly={!applicable}
              placeholder="kub_"
              primaryColor={PRIMARY}
            />
            <p className="mt-1 text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
              {t('admin.dbprefix_hint')}
            </p>
          </div>
          <div>
            <Button variant="primary" size="sm" onClick={onSave}
              loading={saveMut.isPending}
              disabled={!applicable || saveMut.isPending || prefix.trim() === (cfg.data?.prefix ?? '')}>
              {t('admin.dbprefix_apply')}
            </Button>
          </div>
        </div>
      )}
      {confirmState && (
        <ConfirmDialog {...confirmState} onConfirm={handleConfirm} onCancel={handleCancel} />
      )}
    </Card>
  )
}
