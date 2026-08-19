// Composing an export: the perimeter, the services, and an honest summary of
// what is about to happen.
//
// ## Why a dialog, when this console edits in place everywhere else
//
// Because this is a creation, not an edit. Editing in place is right for a
// record that already exists and whose fields have meaning on their own; here
// nothing exists until the operator confirms, and the four choices below are
// only meaningful together — a perimeter without services produces an archive
// nobody asked for.
//
// ## The summary is not decoration
//
// The last block restates, in words, how many accounts are covered, when the
// archive becomes downloadable and when it disappears. An export is the one act
// in this console that cannot be undone by an equal and opposite act: once the
// file has been fetched, it is out. The summary is the last moment where "I
// meant the marketing team, not everybody" is still cheap.

import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Search, X } from 'lucide-react'
import { Badge, Callout, Checkbox, FloatingWindow, Input, Spinner } from '@ui'
import { api } from '../../../api/client'
import { formatWhen } from '../format'
import {
  errorMessage, useRequestExport,
  type DataExportOverview, type ExportScope,
} from './api'

/** One row of `GET /admin/users`, reduced to what a picker needs. */
interface PickableUser {
  id:           string
  email:        string
  username:     string
  display_name: string | null
  is_active:    boolean
}

/** Accounts loaded into the picker. Bounded: past this, "toute l'instance" is
 *  the answer, and a select-all over ten thousand rows is not a picker. */
const PICKER_LIMIT = 500

export default function ExportRequestDialog({
  overview, onClose, onRequested,
}: {
  overview:    DataExportOverview
  onClose:     () => void
  onRequested: (exportId: string) => void
}) {
  const { t, i18n } = useTranslation()
  const request = useRequestExport()

  const [scope, setScope]     = useState<ExportScope>('instance')
  const [picked, setPicked]   = useState<string[]>([])
  const [query, setQuery]     = useState('')
  const [withInstance, setWithInstance] = useState(true)
  const [services, setServices] = useState<string[]>(
    // Everything the instance can produce, ticked. An export whose default is
    // "nothing" would be a form an operator fills in twice.
    () => overview.services.map(s => s.id),
  )
  const [error, setError] = useState<string | null>(null)

  const { data: users, isLoading: loadingUsers } = useQuery({
    queryKey: ['admin-data-export-users'],
    enabled:  scope === 'accounts',
    queryFn:  async () =>
      (await api.get<{ users: PickableUser[] }>('/admin/users', { params: { limit: PICKER_LIMIT } }))
        .data.users,
    staleTime: 60_000,
  })

  const shown = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const all = users ?? []
    if (!needle) return all.slice(0, 200)
    return all
      .filter(u =>
        u.email.toLowerCase().includes(needle)
        || u.username.toLowerCase().includes(needle)
        || (u.display_name ?? '').toLowerCase().includes(needle))
      .slice(0, 200)
  }, [users, query])

  const pickedLabels = useMemo(() => {
    const index = new Map((users ?? []).map(u => [u.id, u.display_name?.trim() || u.email]))
    return picked.map(id => ({ id, label: index.get(id) ?? id }))
  }, [users, picked])

  const accounts = scope === 'instance' ? overview.active_accounts : picked.length
  const canSubmit = accounts > 0 && !request.isPending

  const toggleService = (id: string, on: boolean) =>
    setServices(list => (on ? [...new Set([...list, id])] : list.filter(s => s !== id)))

  const submit = () => {
    setError(null)
    request.mutate(
      {
        scope,
        user_ids: scope === 'accounts' ? picked : undefined,
        services,
        with_instance: withInstance,
      },
      {
        onSuccess: response => {
          const id = (response as { data?: { export_id?: string } })?.data?.export_id
          onRequested(id ?? '')
        },
        onError: e => setError(errorMessage(e, t('admin.dx_request_failed'))),
      },
    )
  }

  return (
    <div>
      <FloatingWindow
        title={t('admin.dx_new_title')}
        onClose={onClose}
        defaultWidth={720}
        backdrop
        padding={20}
        t={t}
        actions={{
          confirm: {
            label:    t('admin.dx_request'),
            onClick:  submit,
            disabled: !canSubmit,
            loading:  request.isPending,
          },
          cancel: { label: t('common.cancel') },
        }}
      >
        <div className="flex min-w-0 flex-col gap-5">
          {/* ── Perimeter ───────────────────────────────────────────────── */}
          <section className="flex min-w-0 flex-col gap-2">
            <Legend>{t('admin.dx_scope_legend')}</Legend>
            <ScopeChoice
              checked={scope === 'instance'}
              onSelect={() => setScope('instance')}
              title={t('admin.dx_scope_instance')}
              description={t('admin.dx_scope_instance_desc', { count: overview.active_accounts })}
            />
            <ScopeChoice
              checked={scope === 'accounts'}
              onSelect={() => setScope('accounts')}
              title={t('admin.dx_scope_accounts')}
              description={t('admin.dx_scope_accounts_desc')}
            />
          </section>

          {/* ── The picker ──────────────────────────────────────────────── */}
          {scope === 'accounts' && (
            <section className="flex min-w-0 flex-col gap-2">
              <Input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={t('admin.dx_pick_search')}
                leftIcon={<Search size={15} />}
                aria-label={t('admin.dx_pick_search')}
              />

              {pickedLabels.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {pickedLabels.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      className="flex items-center gap-1 rounded border border-border bg-surface-1 px-2 py-0.5 text-text-primary hover:bg-surface-2"
                      style={{ fontSize: 'var(--kb-text-meta)' }}
                      onClick={() => setPicked(list => list.filter(id => id !== p.id))}
                    >
                      <span className="max-w-52 truncate">{p.label}</span>
                      <X size={12} />
                    </button>
                  ))}
                </div>
              )}

              <div className="max-h-64 min-w-0 overflow-y-auto rounded-lg border border-border bg-surface-0">
                {loadingUsers && (
                  <div className="flex justify-center py-6"><Spinner /></div>
                )}
                {!loadingUsers && shown.length === 0 && (
                  <p
                    className="px-3 py-4 text-text-tertiary"
                    style={{ fontSize: 'var(--kb-text-meta)' }}
                  >
                    {t('admin.dx_pick_empty')}
                  </p>
                )}
                {shown.map(u => (
                  <label
                    key={u.id}
                    className="flex min-w-0 cursor-pointer items-center gap-2.5 border-b border-border px-3 py-2 last:border-b-0 hover:bg-surface-1"
                  >
                    <Checkbox
                      checked={picked.includes(u.id)}
                      onChange={on => setPicked(list =>
                        on ? [...new Set([...list, u.id])] : list.filter(id => id !== u.id))}
                    />
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-text-primary" style={{ fontSize: 'var(--kb-text-body)' }}>
                        {u.display_name?.trim() || u.username}
                      </span>
                      <span className="truncate text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
                        {u.email}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
              <Hint>{t('admin.dx_pick_hint', { limit: PICKER_LIMIT })}</Hint>
            </section>
          )}

          {/* ── Services ────────────────────────────────────────────────── */}
          <section className="flex min-w-0 flex-col gap-2">
            <Legend>{t('admin.dx_services_legend')}</Legend>
            <div className="flex min-w-0 flex-col gap-1.5">
              {overview.services.map(s => (
                <div
                  key={s.id}
                  className="flex min-w-0 items-start gap-2.5 rounded-lg border border-border bg-surface-1 px-3 py-2"
                >
                  <span className="pt-0.5">
                    <Checkbox
                      checked={s.required || services.includes(s.id)}
                      disabled={s.required}
                      onChange={on => toggleService(s.id, on)}
                      aria-label={s.label}
                    />
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-text-primary" style={{ fontSize: 'var(--kb-text-body)' }}>
                        {s.label}
                      </span>
                      {s.required && <Badge variant="neutral" size="sm">{t('admin.dx_service_always')}</Badge>}
                      {s.format && (
                        <span className="text-text-tertiary" style={{ fontSize: 'var(--kb-text-micro)' }}>
                          {s.format}
                        </span>
                      )}
                    </span>
                    {s.description && (
                      <span className="text-text-secondary" style={{ fontSize: 'var(--kb-text-meta)' }}>
                        {s.description}
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
            <Hint>{t('admin.dx_services_hint')}</Hint>
          </section>

          {/* ── Instance referentials ───────────────────────────────────── */}
          <section className="flex min-w-0 flex-col gap-2">
            <Legend>{t('admin.dx_instance_legend')}</Legend>
            <div className="flex min-w-0 items-start gap-2.5 rounded-lg border border-border bg-surface-1 px-3 py-2">
              <span className="pt-0.5">
                <Checkbox
                  checked={withInstance}
                  onChange={setWithInstance}
                  aria-label={t('admin.dx_instance_label')}
                />
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="text-text-primary" style={{ fontSize: 'var(--kb-text-body)' }}>
                  {t('admin.dx_instance_label')}
                </span>
                <span className="text-text-secondary" style={{ fontSize: 'var(--kb-text-meta)' }}>
                  {t('admin.dx_instance_desc')}
                </span>
              </span>
            </div>
          </section>

          {/* ── What is about to happen ─────────────────────────────────── */}
          <Callout variant="warning" title={t('admin.dx_summary_title')} t={t}>
            <span className="block">
              {t('admin.dx_summary', {
                count:   accounts,
                hold:    overview.policy.hold_hours,
                days:    overview.policy.retention_days,
              })}
            </span>
            <span className="mt-1 block">{t('admin.dx_summary_alert')}</span>
            {accounts > 0 && (
              <span className="mt-1 block text-text-secondary" style={{ fontSize: 'var(--kb-text-meta)' }}>
                {t('admin.dx_summary_when', {
                  when: formatWhen(
                    new Date(Date.parse(overview.now) + overview.policy.hold_hours * 3_600_000)
                      .toISOString(),
                    i18n.language,
                  ),
                })}
              </span>
            )}
          </Callout>

          {error && (
            <p className="text-danger" role="alert" style={{ fontSize: 'var(--kb-text-body)' }}>
              {error}
            </p>
          )}
        </div>
      </FloatingWindow>
    </div>
  )
}

// ── Small pieces ─────────────────────────────────────────────────────────────

function Legend({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-text-primary" style={{ fontSize: 'var(--kb-text-body)', fontWeight: 600 }}>
      {children}
    </span>
  )
}

function Hint({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
      {children}
    </span>
  )
}

/** One perimeter, as a whole clickable block rather than a bare radio: the
 *  description is what actually distinguishes the two, and a description nobody
 *  can click is a description nobody reads. */
function ScopeChoice({ checked, onSelect, title, description }: {
  checked:     boolean
  onSelect:    () => void
  title:       string
  description: string
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={checked}
      className={`flex min-w-0 flex-col items-start rounded-lg border px-3 py-2 text-left transition-colors ${
        checked
          ? 'border-primary bg-primary-light'
          : 'border-border bg-surface-0 hover:bg-surface-1'
      }`}
    >
      <span className="text-text-primary" style={{ fontSize: 'var(--kb-text-body)' }}>{title}</span>
      <span className="text-text-secondary" style={{ fontSize: 'var(--kb-text-meta)' }}>
        {description}
      </span>
    </button>
  )
}
