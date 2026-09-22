import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Database, Check, TriangleAlert } from 'lucide-react'
import { Button, Callout, Card, OutlinedField, Radio, Spinner, useToast } from '@ui'
import { api } from '../api/client'
import { usePrivileges } from '../authz/usePrivileges'

/**
 * Applications ▸ a module ▸ "Database" — point ONE module at its own engine or
 * server instead of the core's (superadmin only).
 *
 * A module inherits the core's database by default: nothing to configure, and
 * the card says so. Choosing an engine reveals the same connection fields as the
 * install wizard, with an engine-aware "Test connection" and a "Save & restart"
 * that stores the override and restarts the module so it reconnects (and
 * migrates itself) onto the new target. Going back to "Main database" clears the
 * override.
 *
 * The password is write-only: an existing override reports only that a password
 * is stored (`has_password`), never the value. Leaving the field untouched keeps
 * the stored password; typing replaces it; clearing it removes it.
 */

const PRIMARY = 'var(--color-primary)'

type EngineName = 'postgres' | 'mysql' | 'sqlite'

interface OverrideView {
  engine: EngineName
  host: string
  port: number | null
  user: string
  has_password: boolean
  database: string
  path: string
  schema_prefix: string | null
  enabled: boolean
}

interface DbConfigResponse {
  module_id: string
  inherited_engine: string
  engines: EngineName[]
  override: OverrideView | null
}

interface DbTest {
  ok: boolean
  error?: string
  server_version?: string
  database_missing: boolean
  can_create_database: boolean
  already_initialised: boolean
}

/** `null` selection means "inherit the main database". */
type Mode = 'inherit' | EngineName

const DEFAULT_PORT: Record<EngineName, string> = {
  postgres: '5432',
  mysql: '3306',
  sqlite: '',
}

function engineLabel(t: (k: string) => string, e: EngineName): string {
  return t(`admin.mdb_engine_${e}`)
}

export default function ModuleDatabaseCard({ moduleId }: { moduleId: string }) {
  const { t } = useTranslation()
  const { isSuperuser } = usePrivileges()
  const toast = useToast()
  const qc = useQueryClient()

  const cfg = useQuery({
    queryKey: ['module-database', moduleId],
    queryFn: () => api.get<DbConfigResponse>(`/admin/modules/${moduleId}/database`).then(r => r.data),
    enabled: isSuperuser,
    staleTime: 30_000,
  })

  // ── Editable form state, seeded from the stored override ───────────────────
  const [mode, setMode] = useState<Mode>('inherit')
  const [host, setHost] = useState('')
  const [port, setPort] = useState('')
  const [user, setUser] = useState('')
  const [password, setPassword] = useState('')
  const [passwordTouched, setPasswordTouched] = useState(false)
  const [database, setDatabase] = useState('')
  const [path, setPath] = useState('')
  const [prefix, setPrefix] = useState('')
  const [test, setTest] = useState<DbTest | null>(null)

  const ov = cfg.data?.override ?? null
  // Seed once the config is loaded (and whenever it is refetched after a save).
  useEffect(() => {
    if (!cfg.data) return
    if (ov && ov.enabled) {
      setMode(ov.engine)
      setHost(ov.host)
      setPort(ov.port != null ? String(ov.port) : '')
      setUser(ov.user)
      setDatabase(ov.database)
      setPath(ov.path)
      setPrefix(ov.schema_prefix ?? '')
    } else {
      setMode('inherit')
    }
    setPassword('')
    setPasswordTouched(false)
    setTest(null)
  }, [cfg.data]) // eslint-disable-line react-hooks/exhaustive-deps

  const engine = mode === 'inherit' ? null : mode
  // Invalidate the last test result whenever the connection changes.
  const onEdit = <T,>(setter: (v: T) => void) => (v: T) => { setter(v); setTest(null) }

  const body = useMemo(() => {
    if (!engine) return null
    const b: Record<string, unknown> = {
      engine,
      host: host.trim(),
      port: port.trim() ? Number(port.trim()) : null,
      user: user.trim(),
      database: database.trim(),
      path: path.trim(),
      schema_prefix: prefix.trim() || null,
      enabled: true,
    }
    // Only send a password when the operator typed one; otherwise the stored one
    // is kept server-side.
    if (passwordTouched) b.password = password
    return b
  }, [engine, host, port, user, database, path, prefix, password, passwordTouched])

  const testMut = useMutation({
    mutationFn: () => api.post<DbTest>(`/admin/modules/${moduleId}/database/test`, body).then(r => r.data),
    onSuccess: (data) => setTest(data),
    onError: () => toast.error(t('admin.mdb_test_failed')),
  })

  const saveMut = useMutation({
    mutationFn: () => api.put(`/admin/modules/${moduleId}/database`, body).then(r => r.data),
    onSuccess: () => {
      toast.success(t('admin.mdb_saved'))
      void qc.invalidateQueries({ queryKey: ['module-database', moduleId] })
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg || t('admin.mdb_save_failed'))
    },
  })

  const revertMut = useMutation({
    mutationFn: () => api.delete(`/admin/modules/${moduleId}/database`).then(r => r.data),
    onSuccess: () => {
      toast.success(t('admin.mdb_reverted'))
      void qc.invalidateQueries({ queryKey: ['module-database', moduleId] })
    },
    onError: () => toast.error(t('admin.mdb_save_failed')),
  })

  if (!isSuperuser) return null

  const inheritedEngine = cfg.data?.inherited_engine ?? 'postgres'
  const engines: EngineName[] = cfg.data?.engines ?? ['postgres', 'mysql', 'sqlite']
  const hasOverride = !!(ov && ov.enabled)

  const busy = testMut.isPending || saveMut.isPending || revertMut.isPending

  const fields = engine && (
    <div className="mt-4 flex flex-col gap-4">
      {engine !== 'sqlite' && (
        <>
          <div className="flex gap-3">
            <div className="flex-1">
              <OutlinedField label={t('admin.mdb_host')} value={host} onChange={onEdit(setHost)}
                icon={<Database size={20} strokeWidth={1.8} />} primaryColor={PRIMARY} />
            </div>
            <div style={{ width: 120 }}>
              <OutlinedField label={t('admin.mdb_port')} value={port} onChange={onEdit(setPort)}
                placeholder={DEFAULT_PORT[engine]} inputMode="numeric" primaryColor={PRIMARY} />
            </div>
          </div>
          {engine === 'postgres' && (
            <OutlinedField label={t('admin.mdb_database')} value={database} onChange={onEdit(setDatabase)}
              primaryColor={PRIMARY} />
          )}
          {engine === 'mysql' && (
            <p className="text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
              {t('admin.mdb_mysql_db_hint', { schema: moduleId })}
            </p>
          )}
          <OutlinedField label={t('admin.mdb_user')} value={user} onChange={onEdit(setUser)} primaryColor={PRIMARY} />
          <OutlinedField
            label={hasOverride && !passwordTouched ? t('admin.mdb_password_kept') : t('admin.mdb_password')}
            value={password}
            onChange={(v) => { setPassword(v); setPasswordTouched(true); setTest(null) }}
            type="password" autoComplete="off" primaryColor={PRIMARY} />
        </>
      )}
      {engine === 'sqlite' && (
        <div>
          <OutlinedField label={t('admin.mdb_sqlite_path')} value={path} onChange={onEdit(setPath)}
            placeholder="/var/lib/kubuno/db" primaryColor={PRIMARY} />
          <p className="mt-1 text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
            {t('admin.mdb_sqlite_hint', { schema: moduleId })}
          </p>
        </div>
      )}
      <div>
        <OutlinedField label={t('admin.mdb_schema_prefix')} value={prefix} onChange={onEdit(setPrefix)}
          primaryColor={PRIMARY} />
        <p className="mt-1 text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
          {t('admin.mdb_schema_prefix_hint')}
        </p>
      </div>

      {/* Test result */}
      {test?.ok && (
        <Callout variant={test.already_initialised ? 'warning' : 'success'}>
          <span className="inline-flex items-center gap-1.5">
            <Check size={15} />
            {test.server_version
              ? t('admin.mdb_connected_version', { version: test.server_version })
              : t('admin.mdb_connected')}
          </span>
          {test.already_initialised && <div className="mt-1">{t('admin.mdb_already_initialised')}</div>}
        </Callout>
      )}
      {test && !test.ok && test.database_missing && (
        <Callout variant={test.can_create_database ? 'info' : 'warning'}>
          {test.can_create_database ? t('admin.mdb_missing_creatable') : t('admin.mdb_missing_not_creatable')}
        </Callout>
      )}
      {test && !test.ok && !test.database_missing && (
        <Callout variant="danger" title={t('admin.mdb_test_error')}>
          {test.error}
        </Callout>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="secondary" size="sm" onClick={() => testMut.mutate()} loading={testMut.isPending} disabled={busy}>
          {t('admin.mdb_test')}
        </Button>
        <Button variant="primary" size="sm" onClick={() => saveMut.mutate()} loading={saveMut.isPending} disabled={busy}>
          {t('admin.mdb_save')}
        </Button>
      </div>
    </div>
  )

  return (
    <Card title={t('admin.mdb_title')} icon={<Database size={16} />} className="mb-4"
      subtitle={t('admin.mdb_subtitle')}>
      {cfg.isLoading ? (
        <div className="py-6 flex justify-center"><Spinner /></div>
      ) : cfg.isError ? (
        <Callout variant="danger" icon={<TriangleAlert size={16} />}>{t('admin.mdb_load_error')}</Callout>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            <Radio
              checked={mode === 'inherit'}
              onChange={() => { setMode('inherit'); setTest(null) }}
              label={t('admin.mdb_inherit', { engine: engineLabel(t, inheritedEngine as EngineName) })}
              description={t('admin.mdb_inherit_desc')}
            />
            {engines.map((e) => (
              <Radio
                key={e}
                checked={mode === e}
                onChange={() => { setMode(e); setTest(null) }}
                label={engineLabel(t, e)}
              />
            ))}
          </div>

          {fields}

          {mode === 'inherit' && hasOverride && (
            <div className="mt-4">
              <Callout variant="info" className="mb-3">{t('admin.mdb_will_revert')}</Callout>
              <Button variant="secondary" size="sm" onClick={() => revertMut.mutate()} loading={revertMut.isPending} disabled={busy}>
                {t('admin.mdb_revert')}
              </Button>
            </div>
          )}
        </>
      )}
    </Card>
  )
}
