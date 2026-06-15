import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import { formatDistanceToNow } from 'date-fns'
import { getDateLocale } from '../i18n/dateLocale'
import { UserPlus, Pencil, MonitorSmartphone, X } from 'lucide-react'
import type { User, Session } from '../types'
import { FloatingWindow } from '@ui/FloatingWindow'
import { Toggle, Dropdown, Button, Input, Spinner } from '@ui'

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
  const [form, setForm] = useState<CreateUserForm>({
    email: '', username: '', display_name: '', password: '', role: 'user',
  })
  const [error, setError] = useState('')

  const create = useMutation({
    mutationFn: (data: CreateUserForm) =>
      api.post('/admin/users', {
        ...data,
        display_name: data.display_name || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      onClose()
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message
      setError(msg ?? t('admin.create_error'))
    },
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
    </FloatingWindow>
  )
}

function EditUserModal({ user, onClose }: { user: User; onClose: () => void }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    display_name: user.display_name ?? '',
    role:         user.role as 'user' | 'admin' | 'guest',
    quota_gb:     Math.round(user.quota_bytes / (1024 ** 3)),
    is_active:    user.is_active,
  })
  const [error, setError] = useState('')

  const save = useMutation({
    mutationFn: () => api.patch(`/admin/users/${user.id}`, {
      display_name: form.display_name || undefined,
      role:         form.role,
      quota_bytes:  form.quota_gb * (1024 ** 3),
      is_active:    form.is_active,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      onClose()
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg ?? t('admin.update_error'))
    },
  })

  return (
    <FloatingWindow
      title={<span>{t('admin.edit_user')} <span className="text-xs font-normal text-text-tertiary ml-1">{user.email}</span></span>}
      onClose={onClose}
      defaultWidth={440}
      backdrop
    >
      <form onSubmit={e => { e.preventDefault(); save.mutate() }} className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">{t('admin.u_display_name')}</label>
          <Input
            type="text"
            value={form.display_name}
            onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))}
            placeholder={user.username}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-text-primary">{t('admin.u_role')} *</label>
          <Dropdown
            className="w-full"
            value={form.role}
            onChange={v => setForm(f => ({ ...f, role: v as typeof form.role }))}
            options={[
              { value: 'user',  label: t('admin.role_user') },
              { value: 'admin', label: t('admin.role_admin') },
              { value: 'guest', label: t('admin.role_guest') },
            ]}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            {t('admin.u_quota_gb')}
          </label>
          <Input
            type="number"
            min={0}
            max={10000}
            value={form.quota_gb}
            onChange={e => setForm(f => ({ ...f, quota_gb: Number(e.target.value) }))}
          />
          <p className="text-xs text-text-tertiary mt-0.5">
            {t('admin.u_current_usage')} {formatBytes(user.used_bytes)}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Toggle
            checked={form.is_active}
            onChange={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
          />
          <span className="text-sm text-text-primary">{form.is_active ? t('admin.u_account_active') : t('admin.u_account_disabled')}</span>
        </div>

        {error && <p className="text-sm text-danger bg-danger-light px-3 py-2 rounded-md">{error}</p>}

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" className="flex-1" loading={save.isPending}>
            {t('settings.save')}
          </Button>
        </div>
      </form>
    </FloatingWindow>
  )
}

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
        <p className="text-xs text-text-secondary mt-0.5">
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

function UserSessionsModal({ user, onClose }: { user: User; onClose: () => void }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { data: sessions, isLoading } = useQuery({
    queryKey: ['admin-user-sessions', user.id],
    queryFn: () =>
      api.get<{ sessions: Session[] }>(`/admin/users/${user.id}/sessions`).then((r) => r.data.sessions),
  })

  const revoke = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/users/${user.id}/sessions/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-user-sessions', user.id] }),
  })
  const revokeAll = useMutation({
    mutationFn: () => api.delete(`/admin/users/${user.id}/sessions`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-sessions', user.id] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
    },
  })

  const list = sessions ?? []

  return (
    <FloatingWindow
      title={`${t('admin.sessions_title')} · ${user.display_name ?? user.username}`}
      onClose={onClose}
      defaultWidth={520}
      backdrop
    >
      <div className="p-5 space-y-4 overflow-y-auto">
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-secondary">
            {list.length} {t('admin.card_sessions_active').toLowerCase()}
          </span>
          {list.length > 0 && (
            <Button size="sm" variant="danger" loading={revokeAll.isPending} onClick={() => revokeAll.mutate()}>
              {t('settings.ses_revoke_all')}
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8"><Spinner size="sm" /></div>
        ) : list.length === 0 ? (
          <p className="text-sm text-text-tertiary text-center py-8">{t('admin.no_active_session')}</p>
        ) : (
          <ul className="space-y-2">
            {list.map((s) => (
              <li key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-surface-1 border border-border">
                <MonitorSmartphone size={18} className="text-text-tertiary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary truncate">{s.device_name ?? t('settings.ses_unknown')}</p>
                  <p className="text-xs text-text-tertiary truncate">
                    {s.ip_address ?? t('admin.unknown_ip')} · {t('settings.ses_active_label').toLowerCase()} {formatDistanceToNow(new Date(s.last_used_at), { addSuffix: true, locale: getDateLocale() })}
                  </p>
                </div>
                <button
                  onClick={() => revoke.mutate(s.id)}
                  disabled={revoke.isPending}
                  className="p-1.5 text-text-secondary hover:text-danger rounded"
                  title={t('admin.revoke_session')}
                >
                  <X size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </FloatingWindow>
  )
}

export default function UsersPanel() {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [showCreate, setShowCreate] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [sessionsUser, setSessionsUser] = useState<User | null>(null)
  const limit = 20
  const queryClient = useQueryClient()

  const { data } = useQuery({
    queryKey: ['admin-users', search, page],
    queryFn: () =>
      api.get<{ users: User[]; total: number }>('/admin/users', {
        params: { search: search || undefined, limit, offset: page * limit },
      }).then((r) => r.data),
  })

  const toggleActive = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      api.patch(`/admin/users/${id}`, { is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  })

  const ROLE_COLORS: Record<string, string> = {
    admin: 'bg-danger-light text-danger',
    user: 'bg-primary-light text-primary',
    guest: 'bg-surface-2 text-text-secondary',
  }

  return (
    <div>
      {showCreate && <CreateUserModal onClose={() => setShowCreate(false)} />}
      {editUser && <EditUserModal user={editUser} onClose={() => setEditUser(null)} />}
      {sessionsUser && <UserSessionsModal user={sessionsUser} onClose={() => setSessionsUser(null)} />}

      <RegistrationToggle />

      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 max-w-sm">
          <Input
            type="search"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0) }}
            placeholder={t('admin.search_user')}
          />
        </div>
        <span className="text-sm text-text-secondary mr-auto">{data?.total ?? 0} {t('admin.users_count')}</span>
        <Button icon={<UserPlus size={16} />} onClick={() => setShowCreate(true)}>
          {t('admin.new_user')}
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-1">
              {[t('admin.th_user'), t('admin.th_role'), t('admin.th_quota'), t('admin.th_last_login'), t('admin.th_status'), ''].map((h, hi) => (
                <th key={hi} className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data?.users.map((u) => (
              <tr key={u.id} className="hover:bg-surface-1 transition-colors">
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-text-primary">{u.display_name ?? u.username}</p>
                    <p className="text-xs text-text-tertiary">{u.email}</p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[u.role] ?? ''}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-text-secondary text-xs">
                  {formatBytes(u.used_bytes)} / {formatBytes(u.quota_bytes)}
                </td>
                <td className="px-4 py-3 text-text-secondary text-xs">
                  {u.last_login_at
                    ? formatDistanceToNow(new Date(u.last_login_at), { addSuffix: true, locale: getDateLocale() })
                    : t('admin.never')
                  }
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${u.is_active ? 'bg-success-light text-success' : 'bg-surface-2 text-text-tertiary'}`}>
                    {u.is_active ? t('admin.active') : t('admin.inactive')}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditUser(u)}
                      className="p-1.5 rounded hover:bg-surface-2 text-text-secondary hover:text-primary"
                      title={t('admin.edit')}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setSessionsUser(u)}
                      className="p-1.5 rounded hover:bg-surface-2 text-text-secondary hover:text-primary"
                      title={t('admin.sessions_title')}
                    >
                      <MonitorSmartphone size={14} />
                    </button>
                    <button
                      onClick={() => toggleActive.mutate({ id: u.id, is_active: !u.is_active })}
                      className="text-xs text-text-secondary hover:text-text-primary whitespace-nowrap"
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
    </div>
  )
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(0)} Mo`
  return `${(bytes / 1024 ** 3).toFixed(1)} Go`
}
