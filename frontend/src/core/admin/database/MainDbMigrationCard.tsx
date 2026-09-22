import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Database, Check, TriangleAlert } from 'lucide-react'
import { Button, Callout, Card, OutlinedField, Radio, useToast } from '@ui'
import ConfirmDialog from '@ui/ConfirmDialog'
import { api } from '../../api/client'
import { apiErrorMessage } from '../../api/errorMessage'
import { useConfirm } from '../../hooks/useConfirm'
import { usePrivileges } from '../../authz/usePrivileges'
import KnownConnectionsCard from './KnownConnectionsCard'

/**
 * Administration ▸ System ▸ "Main database" — one coherent card to MANAGE the
 * core's own database (superadmin only): the current engine/target, the registry
 * of known connections (switch back, overwrite, refresh a standby, forget), and —
 * as one action among these — migrating to another engine.
 *
 * The migration copies the whole core database onto another engine keeping the
 * data, then persists the new settings; a core restart finalises it. The source
 * is never touched: the target is created, migrated, filled and verified, and
 * only then are the new settings written, so a failed copy loses nothing.
 */

const PRIMARY = 'var(--color-primary)'
type Engine = 'postgres' | 'mysql' | 'sqlite'
const ENGINES: Engine[] = ['postgres', 'mysql', 'sqlite']
const DEFAULT_PORT: Record<Engine, string> = { postgres: '5432', mysql: '3306', sqlite: '' }

/** The instance's current connection, as returned by GET schema-prefix. */
interface Cur {
  engine: string
  host: string
  port: number | null
  user: string
  database: string
  path: string
  has_password: boolean
}

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

  // Pre-fill the form from the connection the instance is already using, so the
  // administrator starts from the known parameters (never the password) instead
  // of blank fields. Seed once, so it never overwrites what the user is typing.
  const seeded = useRef(false)
  const { data } = useQuery<{ current?: Cur | null }>({
    queryKey: ['admin', 'database', 'schema-prefix'],
    queryFn: () => api.get('/admin/database/schema-prefix').then(r => r.data),
    enabled: isSuperuser,
  })
  useEffect(() => {
    const c = data?.current
    if (!c || seeded.current) return
    seeded.current = true
    if (ENGINES.includes(c.engine as Engine)) setEngine(c.engine as Engine)
    if (c.host) setHost(c.host)
    if (c.port != null) setPort(String(c.port))
    if (c.user) setUser(c.user)
    if (c.database) setDatabase(c.database)
    if (c.path) setPath(c.path)
  }, [data])

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

  const cur = data?.current

  return (
    <Card title={t('admin.db_manage_title')} icon={<Database size={16} />} className="mb-4"
      subtitle={t('admin.db_manage_subtitle')}>
      <div className="flex flex-col gap-6">
        {/* Current state */}
        <div>
          <h3 className="mb-1 font-medium" style={{ fontSize: 'var(--kb-text-body)' }}>
            {t('admin.db_current_heading')}
          </h3>
          <p className="text-text-secondary" style={{ fontSize: 'var(--kb-text-meta)' }}>
            {cur
              ? t('admin.db_current_state', {
                  engine: t(`admin.mdb_engine_${cur.engine}`, cur.engine),
                  target: cur.engine === 'sqlite'
                    ? (cur.path || '/var/lib/kubuno/db')
                    : [cur.port ? `${cur.host}:${cur.port}` : cur.host, cur.database].filter(Boolean).join('/'),
                })
              : t('admin.db_current_unknown')}
          </p>
        </div>

        {/* Known connections registry */}
        <KnownConnectionsCard
          basePath="/admin/database"
          queryKey={['core']}
          embedded
          heading={t('admin.dbconn_title')}
        />

        {/* Migrate to another engine — one action among the management options */}
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="mb-1 font-medium" style={{ fontSize: 'var(--kb-text-body)' }}>
              {t('admin.db_migrate_heading')}
            </h3>
            <p className="text-text-secondary" style={{ fontSize: 'var(--kb-text-meta)' }}>
              {t('admin.db_migrate_subheading')}
            </p>
          </div>
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
      </div>
      {confirmState && (
        <ConfirmDialog {...confirmState} onConfirm={handleConfirm} onCancel={handleCancel} />
      )}
    </Card>
  )
}
