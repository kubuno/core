import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation } from '@tanstack/react-query'
import { Database, ArrowRightLeft, Check, TriangleAlert } from 'lucide-react'
import { Button, Callout, Card, OutlinedField, Radio, useToast } from '@ui'
import ConfirmDialog from '@ui/ConfirmDialog'
import { api } from '../../api/client'
import { apiErrorMessage } from '../../api/errorMessage'
import { useConfirm } from '../../hooks/useConfirm'
import { usePrivileges } from '../../authz/usePrivileges'

/**
 * Administration ▸ Database ▸ "Migrate the main database" — copy the whole core
 * database onto another engine, keeping the data, then persist the new settings
 * (superadmin only). A core restart finalises it.
 *
 * The source is never touched: the target is created, migrated, filled and
 * verified, and only then are the new settings written. If anything fails the
 * instance keeps running on the current engine.
 */

const PRIMARY = 'var(--color-primary)'
type Engine = 'postgres' | 'mysql' | 'sqlite'
const ENGINES: Engine[] = ['postgres', 'mysql', 'sqlite']
const DEFAULT_PORT: Record<Engine, string> = { postgres: '5432', mysql: '3306', sqlite: '' }

interface Job {
  status: string
  target_engine: string
  tables_total: number
  total_rows: number
  error: string
}

export default function MainDbMigrationCard() {
  const { t } = useTranslation()
  const { isSuperuser } = usePrivileges()
  const toast = useToast()
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm()

  const [engine, setEngine] = useState<Engine>('postgres')
  const [host, setHost] = useState('')
  const [port, setPort] = useState('')
  const [user, setUser] = useState('')
  const [password, setPassword] = useState('')
  const [database, setDatabase] = useState('')
  const [path, setPath] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [job, setJob] = useState<Job | null>(null)

  const body = () => ({
    engine,
    host: host.trim(),
    port: port.trim() ? Number(port.trim()) : null,
    user: user.trim(),
    password,
    database: database.trim(),
    path: path.trim() || null,
  })

  const migrate = useMutation({
    mutationFn: () => api.post<{ job: Job }>('/admin/database/migrate', body()).then(r => r.data),
    onSuccess: (data) => { setError(null); setJob(data.job); toast.success(t('admin.dbmig_done')) },
    onError: (e: unknown) => { setJob(null); setError(apiErrorMessage(e, t('admin.dbmig_failed'))) },
  })

  if (!isSuperuser) return null

  const onMigrate = async () => {
    const ok = await confirm({
      title: t('admin.dbmig_confirm_title'),
      message: t('admin.dbmig_confirm_body', { engine }),
      confirmLabel: t('admin.dbmig_confirm_ok'),
      variant: 'danger',
    })
    if (ok) migrate.mutate()
  }

  return (
    <Card title={t('admin.dbmig_title')} icon={<ArrowRightLeft size={16} />} className="mb-4"
      subtitle={t('admin.dbmig_subtitle')}>
      <div className="flex flex-col gap-4">
        <Callout variant="warning">{t('admin.dbmig_warning')}</Callout>

        <div className="flex flex-col gap-2">
          {ENGINES.map((e) => (
            <Radio key={e} checked={engine === e} onChange={() => { setEngine(e); setError(null) }}
              label={t(`admin.mdb_engine_${e}`)} />
          ))}
        </div>

        {engine !== 'sqlite' && (
          <>
            <div className="flex gap-3">
              <div className="flex-1">
                <OutlinedField label={t('admin.mdb_host')} value={host} onChange={setHost}
                  icon={<Database size={20} strokeWidth={1.8} />} primaryColor={PRIMARY} />
              </div>
              <div style={{ width: 120 }}>
                <OutlinedField label={t('admin.mdb_port')} value={port} onChange={setPort}
                  placeholder={DEFAULT_PORT[engine]} inputMode="numeric" primaryColor={PRIMARY} />
              </div>
            </div>
            <OutlinedField label={t('admin.mdb_database')} value={database} onChange={setDatabase} primaryColor={PRIMARY} />
            <OutlinedField label={t('admin.mdb_user')} value={user} onChange={setUser} primaryColor={PRIMARY} />
            <OutlinedField label={t('admin.mdb_password')} value={password} onChange={setPassword}
              type="password" autoComplete="off" primaryColor={PRIMARY} />
          </>
        )}
        {engine === 'sqlite' && (
          <OutlinedField label={t('admin.mdb_sqlite_path')} value={path} onChange={setPath}
            placeholder="/var/lib/kubuno/db" primaryColor={PRIMARY} />
        )}

        {error && <Callout variant="danger" title={t('admin.dbmig_error')}>{error}</Callout>}
        {job && job.status === 'succeeded' && (
          <Callout variant="success">
            <span className="inline-flex items-center gap-1.5">
              <Check size={15} />
              {t('admin.dbmig_result_ok', { tables: job.tables_total, rows: job.total_rows, engine: job.target_engine })}
            </span>
            <div className="mt-1">{t('admin.dbmig_restart_hint')}</div>
          </Callout>
        )}
        {job && job.status === 'failed' && (
          <Callout variant="danger" icon={<TriangleAlert size={16} />} title={t('admin.dbmig_error')}>
            {job.error}
          </Callout>
        )}

        <div>
          <Button variant="primary" size="sm" onClick={onMigrate} loading={migrate.isPending}
            disabled={migrate.isPending}>
            {t('admin.dbmig_action')}
          </Button>
        </div>
      </div>
      {confirmState && (
        <ConfirmDialog {...confirmState} onConfirm={handleConfirm} onCancel={handleCancel} />
      )}
    </Card>
  )
}
