import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Network, Plus, Power, Pencil, Trash2, PlugZap, LogIn, RefreshCw, ShieldAlert,
} from 'lucide-react'
import { Button, Callout, Card, EmptyState, Input, Spinner, useToast } from '@ui'
import { api } from '../../api/client'
import { useConfirm } from '../../hooks/useConfirm'
import ConfirmDialog from '@ui/ConfirmDialog'
import { useAdminAction } from '../adminAction'
import LdapDirectoryForm from './LdapDirectoryForm'
import {
  emptyForm, toForm,
  type AuthProbe, type ConnectionProbe, type DirectoryForm,
  type LdapDirectory, type SyncReport,
} from './types'

/**
 * Administration → Security → Directory (LDAP / Active Directory).
 *
 * Three things this page owes its operator, all of them on screen:
 *
 *  1. **Which method applies.** An account can exist here and in the directory,
 *     so the rule is stated at the top rather than discovered — and the rule is
 *     an administrator's per-unit decision (`crate::auth::methods`), edited on
 *     the Authentication & SSO page and merely APPLIED here. The wording below
 *     is the same sentence the server enforces
 *     (`directory::auth::route_for`).
 *  2. **A diagnosable failure.** The two probes show the directory's own answer,
 *     truncated and verbatim. A generic "connection failed" costs an afternoon.
 *  3. **The promise that nothing is deleted.** Written next to the control that
 *     could be mistaken for deletion.
 */

function relative(t: (k: string, o?: Record<string, unknown>) => string, iso: string | null) {
  if (!iso) return t('ldap.never_synced')
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return t('ldap.never_synced')
  return d.toLocaleString()
}

/** The peer's own words, in their own box. One long line must scroll inside the
 *  card rather than make the page scroll sideways. */
function RawDetail({ text }: { text: string }) {
  return (
    <pre
      className="mt-1 max-w-full overflow-x-auto rounded-md border border-border bg-surface-1 px-2.5 py-2 font-mono text-text-primary"
      style={{ fontSize: 'var(--kb-text-meta)' }}
    >
      {text}
    </pre>
  )
}

function MappingSummary({
  mapping,
  t,
}: {
  mapping: NonNullable<ConnectionProbe['sample_mapping']>
  t: (k: string, o?: Record<string, unknown>) => string
}) {
  const rows: [string, string][] = [
    [t('ldap.attr_username'), mapping.username ?? '—'],
    [t('ldap.attr_email'), mapping.email ?? '—'],
    [t('ldap.attr_display_name'), mapping.display_name ?? '—'],
    [t('ldap.attr_unique_id'), mapping.has_unique_id ? t('ldap.present') : '—'],
    [t('ldap.groups_found'), String(mapping.groups)],
  ]
  return (
    <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2">
      {rows.map(([k, v]) => (
        <div key={k} className="flex min-w-0 items-baseline gap-2">
          <dt className="text-text-secondary" style={{ fontSize: 'var(--kb-text-meta)' }}>
            {k}
          </dt>
          <dd className="min-w-0 flex-1 truncate font-mono text-text-primary" style={{ fontSize: 'var(--kb-text-meta)' }}>
            {v}
          </dd>
        </div>
      ))}
    </dl>
  )
}

export default function LdapSection() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const toast = useToast()
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm()

  const [editing, setEditing] = useState<string | null>(null) // directory id, or 'new'
  const [form, setForm] = useState<DirectoryForm>(emptyForm())
  const [probing, setProbing] = useState<string | null>(null)
  const [probe, setProbe] = useState<Record<string, ConnectionProbe>>({})
  const [authProbe, setAuthProbe] = useState<Record<string, AuthProbe>>({})
  const [report, setReport] = useState<Record<string, SyncReport>>({})
  const [trial, setTrial] = useState<{ login: string; password: string }>({ login: '', password: '' })

  // `/admin/ldap?action=add` opens the blank form.
  useAdminAction('add', () => { setForm(emptyForm()); setEditing('new') })

  const { data: directories, isLoading } = useQuery({
    queryKey: ['admin', 'ldap-directories'],
    queryFn: () =>
      api.get<{ directories: LdapDirectory[] }>('/admin/ldap/directories').then(r => r.data.directories),
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin', 'ldap-directories'] })

  const errorOf = (e: unknown) =>
    (e as { response?: { data?: { message?: string } } })?.response?.data?.message

  const createM = useMutation({
    mutationFn: (payload: Record<string, unknown>) => api.post('/admin/ldap/directories', payload),
    onSuccess: () => { invalidate(); setEditing(null); toast.success(t('ldap.saved')) },
    onError: (e: unknown) => toast.error(errorOf(e) || t('ldap.save_failed')),
  })

  const updateM = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      api.patch(`/admin/ldap/directories/${id}`, payload),
    onSuccess: () => { invalidate(); toast.success(t('ldap.saved')) },
    onError: (e: unknown) => toast.error(errorOf(e) || t('ldap.save_failed')),
  })

  const deleteM = useMutation({
    mutationFn: (id: string) => api.delete<{ deactivated_accounts: number }>(`/admin/ldap/directories/${id}`),
    onSuccess: r => {
      invalidate()
      toast.success(t('ldap.deleted', { count: r.data?.deactivated_accounts ?? 0 }))
    },
    onError: (e: unknown) => toast.error(errorOf(e) || t('ldap.save_failed')),
  })

  const testM = useMutation({
    mutationFn: (id: string) => api.post<ConnectionProbe>(`/admin/ldap/directories/${id}/test`).then(r => r.data),
    onMutate: (id: string) => setProbing(id),
    onSettled: () => setProbing(null),
    onSuccess: (data, id) => setProbe(p => ({ ...p, [id]: data })),
    onError: (e: unknown) => toast.error(errorOf(e) || t('ldap.test_failed')),
  })

  const testAuthM = useMutation({
    mutationFn: ({ id, login, password }: { id: string; login: string; password: string }) =>
      api.post<AuthProbe>(`/admin/ldap/directories/${id}/test-auth`, { login, password }).then(r => r.data),
    onSuccess: (data, vars) => {
      setAuthProbe(p => ({ ...p, [vars.id]: data }))
      // The password is used once and dropped here too: nothing keeps it in the
      // page after the round trip.
      setTrial(s => ({ ...s, password: '' }))
    },
    onError: (e: unknown) => toast.error(errorOf(e) || t('ldap.test_failed')),
  })

  const syncM = useMutation({
    mutationFn: (id: string) =>
      api.post<{ report: SyncReport }>(`/admin/ldap/directories/${id}/sync`).then(r => r.data.report),
    onSuccess: (data, id) => { setReport(p => ({ ...p, [id]: data })); invalidate() },
    onError: (e: unknown) => toast.error(errorOf(e) || t('ldap.sync_failed')),
  })

  const submit = () => {
    const payload: Record<string, unknown> = {
      ...form,
      port: Number(form.port) || 389,
      connect_timeout_s: Number(form.connect_timeout_s) || 10,
      sync_interval_min: Number(form.sync_interval_min) || 60,
      // Absent and null are the same JSON, so "no unit" needs a word of its own
      // on an update — otherwise a unit could be chosen and never un-chosen.
      clear_default_org_unit: form.default_org_unit_id === null,
    }
    // Absent = unchanged. Sending an empty string would CLEAR the stored one,
    // which is what the explicit control is for.
    if (!form.bind_password) delete payload.bind_password
    if (editing === 'new') {
      createM.mutate(payload)
    } else if (editing) {
      delete payload.slug
      updateM.mutate({ id: editing, payload }, { onSuccess: () => setEditing(null) })
    }
  }

  const onDelete = async (d: LdapDirectory) => {
    const ok = await confirm({
      title: t('ldap.delete_title'),
      message: t('ldap.delete_message', { name: d.display_name, count: d.governed_accounts }),
      confirmLabel: t('common.delete'),
      variant: 'danger',
    })
    if (ok) deleteM.mutate(d.id)
  }

  if (isLoading) {
    return <div className="flex justify-center py-16"><Spinner /></div>
  }

  const list = directories ?? []

  return (
    <div className="max-w-3xl space-y-4">
      <p className="text-text-secondary" style={{ fontSize: 'var(--kb-text-body)' }}>
        {t('ldap.subtitle')}
      </p>

      {/* The rule, stated where an operator configures the thing it governs. */}
      <Callout variant="info" title={t('ldap.order_title')}>
        <p>{t('ldap.order_rule')}</p>
        <ul className="ml-4 mt-2 list-disc space-y-1">
          <li>{t('ldap.order_local')}</li>
          <li>{t('ldap.order_directory')}</li>
          <li>{t('ldap.order_unknown')}</li>
        </ul>
        <p className="mt-2">{t('ldap.order_lockout')}</p>
      </Callout>

      {editing === 'new' && (
        <LdapDirectoryForm
          form={form}
          setForm={setForm}
          isEdit={false}
          hasStoredPassword={false}
          onSave={submit}
          onCancel={() => setEditing(null)}
          saving={createM.isPending}
        />
      )}

      {list.length === 0 && editing !== 'new' ? (
        <EmptyState
          icon={<Network size={28} />}
          title={t('ldap.empty_title')}
          description={t('ldap.empty_desc')}
          variant="first-use"
          action={{ label: t('ldap.add'), onClick: () => { setForm(emptyForm()); setEditing('new') } }}
          t={t}
        />
      ) : (
        <div className="space-y-3">
          {list.map(d => {
            const p = probe[d.id]
            const a = authProbe[d.id]
            const r = report[d.id]
            return editing === d.id ? (
              <LdapDirectoryForm
                key={d.id}
                form={form}
                setForm={setForm}
                isEdit
                hasStoredPassword={d.has_bind_password}
                onSave={submit}
                onCancel={() => setEditing(null)}
                saving={updateM.isPending}
                onClearPassword={() => updateM.mutate({ id: d.id, payload: { bind_password: '' } })}
              />
            ) : (
              <Card
                key={d.id}
                title={d.display_name}
                icon={<Network size={17} />}
                subtitle={
                  <span className="font-mono" style={{ fontSize: 'var(--kb-text-meta)' }}>
                    {d.security === 'ldaps' ? 'ldaps' : 'ldap'}://{d.host}:{d.port} · {d.base_dn}
                  </span>
                }
                actions={
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Power size={15} />}
                      aria-label={d.enabled ? t('ldap.disable') : t('ldap.enable')}
                      onClick={() => updateM.mutate({ id: d.id, payload: { enabled: !d.enabled } })}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Pencil size={15} />}
                      aria-label={t('common.edit')}
                      onClick={() => { setForm(toForm(d)); setEditing(d.id) }}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Trash2 size={15} />}
                      aria-label={t('common.delete')}
                      onClick={() => onDelete(d)}
                    />
                  </div>
                }
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-text-secondary" style={{ fontSize: 'var(--kb-text-meta)' }}>
                    <span>{d.enabled ? t('ldap.state_enabled') : t('ldap.state_disabled')}</span>
                    <span>{t('ldap.governed', { count: d.governed_accounts })}</span>
                    <span>{t('ldap.last_sync', { when: relative(t, d.last_sync_at) })}</span>
                  </div>

                  {!d.usable && d.enabled && (
                    <Callout variant="warning">{t('ldap.incomplete')}</Callout>
                  )}

                  {d.last_sync_detail && (
                    <p className="text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
                      {d.last_sync_detail}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<PlugZap size={15} />}
                      loading={probing === d.id}
                      onClick={() => { setProbe(x => { const c = { ...x }; delete c[d.id]; return c }); testM.mutate(d.id) }}
                    >
                      {t('ldap.test')}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<RefreshCw size={15} />}
                      loading={syncM.isPending && syncM.variables === d.id}
                      onClick={() => syncM.mutate(d.id)}
                    >
                      {t('ldap.sync_now')}
                    </Button>
                  </div>

                  {/* ── Connection probe ─────────────────────────────── */}
                  {p && (
                    <Callout
                      variant={p.ok ? (p.entries === 0 ? 'warning' : 'success') : 'danger'}
                      title={p.message}
                    >
                      <p>
                        {p.host}:{p.port} · {p.security} · {t('ldap.elapsed', { ms: p.elapsed_ms })}
                        {p.entries != null && ` · ${t('ldap.entries', { count: p.entries })}`}
                      </p>
                      {p.unverified_tls && <p className="mt-1">{t('ldap.warn_no_verify_short')}</p>}
                      {p.sample_dn && (
                        <p className="mt-2 break-all font-mono" style={{ fontSize: 'var(--kb-text-meta)' }}>
                          {p.sample_dn}
                        </p>
                      )}
                      {p.sample_mapping && <MappingSummary mapping={p.sample_mapping} t={t} />}
                      {p.detail && (
                        <>
                          <p className="mt-2 text-text-secondary" style={{ fontSize: 'var(--kb-text-meta)' }}>
                            {t('ldap.raw_answer')}
                          </p>
                          <RawDetail text={p.detail} />
                        </>
                      )}
                      {p.hint && (
                        <p className="mt-2">
                          <span className="text-text-secondary">{t('ldap.advice')} — </span>
                          {p.hint}
                        </p>
                      )}
                    </Callout>
                  )}

                  {/* ── Authentication trial ─────────────────────────── */}
                  <div className="rounded-lg border border-border p-3">
                    <p className="font-medium text-text-primary" style={{ fontSize: 'var(--kb-text-body)' }}>
                      {t('ldap.trial_title')}
                    </p>
                    <p className="mt-0.5 text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
                      {t('ldap.trial_hint')}
                    </p>
                    <div className="mt-2 flex flex-wrap items-end gap-2">
                      <div className="min-w-[160px] flex-1">
                        <Input
                          value={trial.login}
                          onChange={e => setTrial(s => ({ ...s, login: e.target.value }))}
                          placeholder={t('ldap.trial_login')}
                          aria-label={t('ldap.trial_login')}
                          autoComplete="off"
                        />
                      </div>
                      <div className="min-w-[160px] flex-1">
                        <Input
                          type="password"
                          value={trial.password}
                          onChange={e => setTrial(s => ({ ...s, password: e.target.value }))}
                          placeholder={t('ldap.trial_password')}
                          aria-label={t('ldap.trial_password')}
                          autoComplete="new-password"
                        />
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<LogIn size={15} />}
                        loading={testAuthM.isPending}
                        disabled={!trial.login.trim() || !trial.password}
                        onClick={() =>
                          testAuthM.mutate({ id: d.id, login: trial.login.trim(), password: trial.password })
                        }
                      >
                        {t('ldap.trial_run')}
                      </Button>
                    </div>

                    {a && (
                      <div className="mt-3">
                        <Callout variant={a.ok ? 'success' : 'danger'} title={a.message}>
                          <p>
                            {a.login} · {t('ldap.elapsed', { ms: a.elapsed_ms })}
                          </p>
                          {a.dn && (
                            <p className="mt-1 break-all font-mono" style={{ fontSize: 'var(--kb-text-meta)' }}>
                              {a.dn}
                            </p>
                          )}
                          {a.sample_mapping && <MappingSummary mapping={a.sample_mapping} t={t} />}
                          {a.would_provision && <p className="mt-2">{a.would_provision}</p>}
                          {a.detail && (
                            <>
                              <p className="mt-2 text-text-secondary" style={{ fontSize: 'var(--kb-text-meta)' }}>
                                {t('ldap.raw_answer')}
                              </p>
                              <RawDetail text={a.detail} />
                            </>
                          )}
                          {a.hint && (
                            <p className="mt-2">
                              <span className="text-text-secondary">{t('ldap.advice')} — </span>
                              {a.hint}
                            </p>
                          )}
                        </Callout>
                      </div>
                    )}
                  </div>

                  {/* ── Last manual run ──────────────────────────────── */}
                  {r && (
                    <Callout
                      variant={r.status === 'ok' ? 'success' : r.status === 'partial' ? 'warning' : 'danger'}
                      title={t(`ldap.sync_status_${r.status}`)}
                    >
                      <p>
                        {t('ldap.sync_counts', {
                          count: r.users_seen,
                          created: r.users_created,
                          linked: r.users_linked,
                          skipped: r.users_skipped,
                        })}
                      </p>
                      {r.groups_seen > 0 && (
                        <p className="mt-1">
                          {t('ldap.sync_groups_counts', {
                            count: r.groups_seen,
                            added: r.memberships_added,
                            removed: r.memberships_removed,
                          })}
                        </p>
                      )}
                      {r.disabled > 0 && <p className="mt-1">{t('ldap.sync_disabled', { count: r.disabled })}</p>}
                      {r.disable_refused && (
                        <div className="mt-2 flex items-start gap-2">
                          <ShieldAlert size={15} className="mt-0.5 shrink-0" />
                          <span>{t('ldap.disable_refused', { reason: r.disable_refused })}</span>
                        </div>
                      )}
                      {r.warnings.length > 0 && <RawDetail text={r.warnings.join('\n')} />}
                    </Callout>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {editing === null && list.length > 0 && (
        <Button icon={<Plus size={16} />} onClick={() => { setForm(emptyForm()); setEditing('new') }}>
          {t('ldap.add')}
        </Button>
      )}

      {confirmState && (
        <ConfirmDialog {...confirmState} onConfirm={handleConfirm} onCancel={handleCancel} />
      )}
    </div>
  )
}
