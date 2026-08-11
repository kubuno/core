import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import { UserPlus, Pencil, MonitorSmartphone, Building2, X } from 'lucide-react'
import type { OrgUnit, User } from '../types'
import { FloatingWindow } from '@ui/FloatingWindow'
import {
  Toggle, Dropdown, Button, Callout, Input, Checkbox, ConfirmDialog, useToast,
} from '@ui'
import { PRIV } from '../authz/types'
import { usePrivileges } from '../authz/usePrivileges'
import { useConfirm } from '../hooks/useConfirm'
import OrgUnitPicker from './OrgUnitPicker'
import { adminUrl, useAdminAction } from './adminAction'
import { formatBytes, formatAgo } from './sections/format'

/** Depth-first order with indentation, so the unit filter reads like the tree.
 *  Bounded like every other walk over this tree: a cycle in the data must not
 *  hang the console (see `orgUnitPath` in settings/scopeTypes.ts). */
function orgUnitOptions(
  units: OrgUnit[], parentId: string | null, depth: number,
): { value: string; label: string }[] {
  if (depth > 32) return []
  return units
    .filter(u => u.parent_id === parentId)
    .sort((a, b) => a.name.localeCompare(b.name))
    .flatMap(u => [
      // Non-breaking spaces: HTML collapses ordinary ones, and the indentation
      // is the only thing that says which unit sits under which.
      { value: u.id, label: `${'  '.repeat(depth)}${depth > 0 ? '└ ' : ''}${u.name}` },
      ...orgUnitOptions(units, u.id, depth + 1),
    ])
}

/** Message carried by a rejected admin call — the server explains *why* a move
 *  is refused (out of scope, unit gone), and swallowing it leaves the operator
 *  with a button that silently does nothing.
 *
 *  Both shapes on purpose: the API client rejects with a FLAT `{ message, code }`
 *  (`normalizeError`, api/client.ts), so reading `response.data.message` alone —
 *  as this panel used to — never finds anything and always falls back to the
 *  generic wording. */
function errMessage(err: unknown): string | undefined {
  const e = err as { message?: string; response?: { data?: { message?: string } } }
  return e?.response?.data?.message ?? e?.message
}

interface CreateUserForm {
  email: string
  username: string
  display_name: string
  password: string
  role: 'user' | 'admin' | 'guest'
}

function CreateUserModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { can, orgUnitId } = usePrivileges()
  const [form, setForm] = useState<CreateUserForm>({
    email: '', username: '', display_name: '', password: '', role: 'user',
  })
  const [error, setError] = useState('')

  // Organisational unit. Without it the account lands outside the tree, where
  // NO org-unit-scoped privilege reaches it — a delegated administrator would
  // create someone they can no longer see. Defaults to the caller's own unit,
  // falling back to the root.
  const { data: units } = useQuery({
    queryKey: ['admin-org-units'],
    queryFn:  () => api.get<{ org_units: OrgUnit[] }>('/admin/org-units').then(r => r.data.org_units),
    enabled:  can(PRIV.ORG_UNITS_READ),
    staleTime: 30_000,
  })
  const root = (units ?? []).find(u => u.parent_id === null)
  const [ouId, setOuId] = useState<string | null>(null)
  const [ouPicker, setOuPicker] = useState(false)
  const effectiveOu = ouId ?? orgUnitId ?? root?.id ?? null
  const ouName = (units ?? []).find(u => u.id === effectiveOu)?.name ?? '—'

  const create = useMutation({
    mutationFn: (data: CreateUserForm) =>
      api.post('/admin/users', {
        ...data,
        display_name: data.display_name || undefined,
        org_unit_id:  effectiveOu,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      onClose()
    },
    onError: (err: unknown) => setError(errMessage(err) ?? t('admin.create_error')),
  })

  const field = (label: string, key: keyof CreateUserForm, type = 'text', required = true) => (
    <div>
      <label className="block text-sm font-medium text-text-secondary mb-1">
        {label}{required && <span className="text-danger ml-0.5">*</span>}
      </label>
      <Input
        type={type}
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        required={required}
      />
    </div>
  )

  return (
    <FloatingWindow title={t('admin.new_user')} onClose={onClose} defaultWidth={440} backdrop>
      <form
        onSubmit={(e) => { e.preventDefault(); create.mutate(form) }}
        className="p-6 space-y-4"
      >
        {field(t('admin.u_email'), 'email', 'email')}
        {field(t('admin.u_username'), 'username')}
        {field(t('admin.u_display_name'), 'display_name', 'text', false)}
        {field(t('admin.u_password'), 'password', 'password')}

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-text-primary">{t('admin.u_role')} *</label>
          <Dropdown
            className="w-full"
            value={form.role}
            onChange={v => setForm(f => ({ ...f, role: v as CreateUserForm['role'] }))}
            options={[
              { value: 'user',  label: t('admin.role_user') },
              { value: 'admin', label: t('admin.role_admin') },
              { value: 'guest', label: t('admin.role_guest') },
            ]}
          />
        </div>

        {can(PRIV.ORG_UNITS_READ) && (
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-text-primary">{t('admin.ou_col')}</label>
            <button
              type="button"
              onClick={() => setOuPicker(true)}
              className="h-9 px-3 flex items-center gap-2 rounded-md border border-border bg-white
                         text-sm text-text-primary hover:bg-surface-1 transition-colors text-left"
            >
              <Building2 size={15} className="text-text-tertiary shrink-0" />
              <span className="flex-1 truncate">{ouName}</span>
              <span className="text-primary">{t('admin.u_ou_change')}</span>
            </button>
            <p className="text-sm text-text-tertiary">{t('admin.u_ou_hint')}</p>
          </div>
        )}

        {error && (
          <p className="text-sm text-danger bg-danger-light px-3 py-2 rounded-md">{error}</p>
        )}

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" className="flex-1" loading={create.isPending}>
            {t('settings.create')}
          </Button>
        </div>
      </form>

      {ouPicker && (
        <OrgUnitPicker
          title={t('admin.ou_col')}
          currentId={effectiveOu}
          onSelect={setOuId}
          onClose={() => setOuPicker(false)}
        />
      )}
    </FloatingWindow>
  )
}

// The account editor used to live here, as a floating window the sheet opened
// over itself. It is gone: it knew five fields — name, role, quota, activation,
// unit — while the sheet displays twenty, so an operator could read a value on
// the sheet and change it nowhere. Editing now happens in the card that shows
// the value (`sections/user-detail/cards/`), and the row's pencil below simply
// opens that sheet.

// Public-registration switch. An INSTANCE-wide setting living on the accounts
// page: a delegated administrator confined to one unit has no business flipping
// it, and would only earn a 403 reading it — so it is not rendered at all.
function RegistrationToggle() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const { data: settings } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () =>
      api.get<{ settings: Array<{ key: string; value: unknown }> }>('/admin/settings')
        .then((r) => r.data.settings),
  })

  const registrationOpen: boolean = Boolean(
    settings?.find((s) => s.key === 'auth.registration_open')?.value ?? true
  )

  const toggle = useMutation({
    mutationFn: (open: boolean) => api.patch('/admin/settings', { 'auth.registration_open': open }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-settings'] }),
  })

  return (
    <div className="flex items-center justify-between bg-white border border-border rounded-xl px-4 py-3 mb-6">
      <div>
        <p className="text-sm font-medium text-text-primary">{t('admin.reg_public')}</p>
        <p className="text-sm text-text-secondary mt-0.5">
          {registrationOpen ? t('admin.reg_open_desc') : t('admin.reg_closed_desc')}
        </p>
      </div>
      <Toggle
        checked={registrationOpen}
        disabled={toggle.isPending}
        onChange={() => toggle.mutate(!registrationOpen)}
      />
    </div>
  )
}

export default function UsersPanel() {
  const { t } = useTranslation()
  const { can } = usePrivileges()
  // Seed the list search from the URL (?q=), so the admin search bar can
  // deep-link to a filtered user list.
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [search, setSearch] = useState(params.get('q') ?? '')
  const [page, setPage] = useState(0)
  const [showCreate, setShowCreate] = useState(false)
  const limit = 20
  const queryClient = useQueryClient()
  const toast = useToast()
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm()

  // ── Unit filter ────────────────────────────────────────────────────────────
  // "Who is in this unit?" had no answer at all: the listing took no unit
  // parameter. `descendants` matters as much as the filter itself — a unit whose
  // accounts all sit in its sub-units otherwise reports zero, which reads as a bug.
  const [unitFilter, setUnitFilter]   = useState<string>('')
  const [descendants, setDescendants] = useState(true)

  // ── Bulk selection ─────────────────────────────────────────────────────────
  // Keyed by id and NOT reset on paging: an operator who selects five accounts
  // on page 1 and five on page 2 means ten, not five.
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkPicker, setBulkPicker] = useState(false)

  const { data: units } = useQuery({
    queryKey: ['admin-org-units'],
    queryFn:  () => api.get<{ org_units: OrgUnit[] }>('/admin/org-units').then(r => r.data.org_units),
    enabled:  can(PRIV.ORG_UNITS_READ),
    staleTime: 30_000,
  })
  const unitName = (id: string | null) =>
    (units ?? []).find(u => u.id === id)?.name ?? null

  // ── Deep actions (see adminAction.ts) ──────────────────────────────────────
  // `create` opens the form straight away. `reset-password` cannot: it needs an
  // account, and the list is where one is picked — so the panel enters a
  // "choose a target" mode and forwards the verb to the sheet on the next click.
  const [pendingReset, setPendingReset] = useState(false)
  useAdminAction('create', () => setShowCreate(true))
  useAdminAction('reset-password', () => setPendingReset(true))

  /** Drill-down into the account sheet, optionally on a given tab. */
  const openUser = (u: User, pane?: string) => {
    if (pendingReset) {
      setPendingReset(false)
      navigate(adminUrl({
        tab: 'users', action: 'reset-password', id: u.id,
        params: { user: u.id, pane: 'security' },
      }))
      return
    }
    navigate(adminUrl({ tab: 'users', params: { user: u.id, pane } }))
  }

  const { data } = useQuery({
    queryKey: ['admin-users', search, page, unitFilter, descendants],
    queryFn: () =>
      api.get<{ users: User[]; total: number }>('/admin/users', {
        params: {
          search: search || undefined,
          org_unit_id: unitFilter || undefined,
          include_descendants: unitFilter ? descendants : undefined,
          limit, offset: page * limit,
        },
      }).then((r) => r.data),
  })

  const toggleActive = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      api.patch(`/admin/users/${id}`, { is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
    onError: (err) => toast.error(errMessage(err) ?? t('admin.update_error')),
  })

  // One call, one transaction, one audit entry — see `bulk_set_org_unit`.
  const bulkMove = useMutation({
    mutationFn: (orgUnitId: string) =>
      api.post<{ moved: number }>('/admin/users/bulk/org-unit', {
        user_ids: [...selected], org_unit_id: orgUnitId,
      }).then(r => r.data),
    onSuccess: (res, orgUnitId) => {
      setSelected(new Set())
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      // The unit manager counts accounts from this same endpoint.
      queryClient.invalidateQueries({ queryKey: ['admin-org-unit-counts'] })
      toast.success(t('admin.bulk_ou_done', {
        count: res.moved, unit: unitName(orgUnitId) ?? '',
      }))
    },
    onError: (err) => toast.error(errMessage(err) ?? t('admin.update_error')),
  })

  /** Confirm before writing: a bulk move is the one action here that touches
   *  accounts the operator can no longer see afterwards. */
  const askBulkMove = async (orgUnitId: string) => {
    const ok = await confirm({
      title:   t('admin.bulk_ou_confirm_title'),
      message: t('admin.bulk_ou_confirm_msg', {
        count: selected.size, unit: unitName(orgUnitId) ?? '',
      }),
      confirmLabel: t('admin.bulk_ou_action'),
    })
    if (ok) bulkMove.mutate(orgUnitId)
  }

  const pageIds     = (data?.users ?? []).map(u => u.id)
  const allOnPage   = pageIds.length > 0 && pageIds.every(id => selected.has(id))
  const toggleOne   = (id: string) => setSelected(s => {
    const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n
  })
  const togglePage  = () => setSelected(s => {
    const n = new Set(s)
    if (allOnPage) pageIds.forEach(id => n.delete(id))
    else           pageIds.forEach(id => n.add(id))
    return n
  })
  const canBulk = can(PRIV.USERS_UPDATE) && can(PRIV.ORG_UNITS_READ)

  const ROLE_COLORS: Record<string, string> = {
    admin: 'bg-danger-light text-danger',
    user: 'bg-primary-light text-primary',
    guest: 'bg-surface-2 text-text-secondary',
  }

  return (
    <div>
      {showCreate && <CreateUserModal onClose={() => setShowCreate(false)} />}

      {can(PRIV.SETTINGS_MANAGE) && <RegistrationToggle />}

      {pendingReset && (
        <Callout
          variant="info"
          className="mb-4"
          title={t('admin.pick_user_reset_title')}
          action={{ label: t('common.cancel'), onClick: () => setPendingReset(false) }}
        >
          {t('admin.pick_user_reset_desc')}
        </Callout>
      )}

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex-1 min-w-[180px] max-w-sm">
          <Input
            type="search"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0) }}
            placeholder={t('admin.search_user')}
          />
        </div>

        {can(PRIV.ORG_UNITS_READ) && (
          <div className="flex items-center gap-3">
            <Dropdown
              className="min-w-[200px]"
              value={unitFilter}
              onChange={v => { setUnitFilter(v); setPage(0) }}
              options={[
                { value: '', label: t('admin.filter_ou_all') },
                ...orgUnitOptions(units ?? [], null, 0),
              ]}
            />
            {/* Only meaningful once a unit is picked — an "include sub-units"
                switch with no unit selected has nothing to include into. */}
            {unitFilter && (
              <Checkbox
                checked={descendants}
                onChange={v => { setDescendants(v); setPage(0) }}
                label={t('admin.filter_ou_descendants')}
                labelClassName="text-sm text-text-secondary whitespace-nowrap"
              />
            )}
          </div>
        )}

        <span className="text-sm text-text-secondary mr-auto">{data?.total ?? 0} {t('admin.users_count')}</span>
        {can(PRIV.USERS_CREATE) && (
          <Button icon={<UserPlus size={16} />} onClick={() => setShowCreate(true)}>
            {t('admin.new_user')}
          </Button>
        )}
      </div>

      {/* Selection bar — replaces nothing, sits above the table, and disappears
          with the selection. */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 mb-3 px-4 py-2.5 rounded-xl border border-border bg-primary-light">
          <span className="text-sm text-text-primary">
            {t('admin.bulk_selected', { count: selected.size })}
          </span>
          {canBulk && (
            <Button
              size="sm"
              variant="secondary"
              icon={<Building2 size={15} />}
              onClick={() => setBulkPicker(true)}
              loading={bulkMove.isPending}
            >
              {t('admin.bulk_ou_action')}
            </Button>
          )}
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="ml-auto flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary"
          >
            <X size={14} /> {t('admin.bulk_clear')}
          </button>
        </div>
      )}

      {/* overflow-x-auto: the table scrolls sideways on mobile instead of being
          truncated. min-w keeps the columns readable. */}
      <div className="bg-white rounded-xl border border-border overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-1">
              {canBulk && (
                <th className="pl-4 pr-1 py-3 w-9">
                  <Checkbox
                    checked={allOnPage}
                    onChange={togglePage}
                    className="align-middle"
                  />
                </th>
              )}
              {[
                t('admin.th_user'),
                ...(can(PRIV.ORG_UNITS_READ) ? [t('admin.ou_col')] : []),
                t('admin.th_role'), t('admin.th_quota'), t('admin.th_last_login'), t('admin.th_status'), '',
              ].map((h, hi) => (
                <th key={hi} className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data?.users.map((u) => (
              // The whole row opens the account sheet — the list is an index,
              // the sheet is where an account is actually looked at.
              <tr
                key={u.id}
                onClick={() => openUser(u)}
                className="hover:bg-surface-1 transition-colors cursor-pointer"
              >
                {canBulk && (
                  // Ticking a row must not also open its sheet.
                  <td className="pl-4 pr-1 py-3 w-9" onClick={e => e.stopPropagation()}>
                    <Checkbox
                      checked={selected.has(u.id)}
                      onChange={() => toggleOne(u.id)}
                      className="align-middle"
                    />
                  </td>
                )}
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-text-primary">{u.display_name ?? u.username}</p>
                    <p className="text-sm text-text-tertiary">{u.email}</p>
                  </div>
                </td>
                {can(PRIV.ORG_UNITS_READ) && (
                  <td className="px-4 py-3 text-text-secondary text-sm whitespace-nowrap">
                    {unitName(u.org_unit_id) ?? (
                      // Not "—": an account outside the tree is a problem, and
                      // reads as one only if the list says so.
                      <span className="text-warning">{t('admin.ou_none')}</span>
                    )}
                  </td>
                )}
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[u.role] ?? ''}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-text-secondary text-sm">
                  {formatBytes(u.used_bytes)} / {formatBytes(u.quota_bytes)}
                </td>
                <td className="px-4 py-3 text-text-secondary text-sm">
                  {u.last_login_at
                    ? formatAgo(u.last_login_at)
                    : t('admin.never')
                  }
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${u.is_active ? 'bg-success-light text-success' : 'bg-surface-2 text-text-tertiary'}`}>
                    {u.is_active ? t('admin.active') : t('admin.inactive')}
                  </span>
                </td>
                {/* Row actions must not also trigger the row's own navigation. */}
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-2">
                    {/* Opens the sheet, which is where an account is edited —
                        the pencil no longer has a form of its own. */}
                    <button
                      onClick={() => openUser(u)}
                      className="p-1.5 rounded hover:bg-surface-2 text-text-secondary hover:text-primary"
                      title={t('admin.edit')}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => openUser(u, 'security')}
                      className="p-1.5 rounded hover:bg-surface-2 text-text-secondary hover:text-primary"
                      title={t('admin.sessions_title')}
                    >
                      <MonitorSmartphone size={14} />
                    </button>
                    <button
                      onClick={() => toggleActive.mutate({ id: u.id, is_active: !u.is_active })}
                      className="text-sm text-text-secondary hover:text-text-primary whitespace-nowrap"
                    >
                      {u.is_active ? t('admin.disable') : t('admin.enable')}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.total > limit && (
        <div className="flex items-center justify-between mt-4 text-sm text-text-secondary">
          <Button variant="secondary" size="sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
            {t('admin.prev')}
          </Button>
          <span>{t('admin.page')} {page + 1} / {Math.ceil(data.total / limit)}</span>
          <Button variant="secondary" size="sm" onClick={() => setPage((p) => p + 1)} disabled={(page + 1) * limit >= data.total}>
            {t('admin.next')}
          </Button>
        </div>
      )}

      {bulkPicker && (
        <OrgUnitPicker
          title={t('admin.bulk_ou_title', { count: selected.size })}
          currentId={null}
          onSelect={askBulkMove}
          onClose={() => setBulkPicker(false)}
        />
      )}

      {confirmState && (
        <ConfirmDialog {...confirmState} onConfirm={handleConfirm} onCancel={handleCancel} />
      )}
    </div>
  )
}
