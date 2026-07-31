import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import {
  ShieldCheck, User, Eye, Plus, Pencil, Copy, ChevronDown, ChevronLeft, ChevronRight,
  ChevronsLeft, X, type LucideIcon,
} from 'lucide-react'
import { Button, Input } from '@ui'
import { FloatingWindow } from '@ui/FloatingWindow'
import OrgUnitPicker from './OrgUnitPicker'
import type { User as UserT, OrgUnit } from '../types'

interface RoleStats { users_by_role?: { key: string; count: number }[] }

interface PrivGroup { titleKey: string; items: string[] }

// Kubuno's system roles map to the single `role` column (admin | user | guest).
// Custom roles would need a backend, hence "Create/Copy role" is not yet available.
interface RoleDef {
  id:            'admin' | 'user' | 'guest'
  nameKey:       string
  descKey:       string
  Icon:          LucideIcon
  color:         string
  allPrivileges?: boolean       // true → "all privileges available" (super admin)
  privileges:    PrivGroup[]    // grouped privileges (empty when allPrivileges)
}

const ROLES: RoleDef[] = [
  {
    id: 'admin', nameKey: 'admin.role_admin_name', descKey: 'admin.role_admin_desc',
    Icon: ShieldCheck, color: '#d93025', allPrivileges: true, privileges: [],
  },
  {
    id: 'user', nameKey: 'admin.role_user_name', descKey: 'admin.role_user_desc',
    Icon: User, color: '#1a73e8',
    privileges: [
      { titleKey: 'admin.priv_group_modules', items: [
        'admin.priv_user_modules_access', 'admin.priv_user_files_read', 'admin.priv_user_files_create',
        'admin.priv_user_files_edit', 'admin.priv_user_files_share',
      ] },
      { titleKey: 'admin.priv_group_account', items: [
        'admin.priv_user_profile_edit', 'admin.priv_user_storage_own', 'admin.priv_user_sessions_own',
      ] },
    ],
  },
  {
    id: 'guest', nameKey: 'admin.role_guest_name', descKey: 'admin.role_guest_desc',
    Icon: Eye, color: '#80868b',
    privileges: [
      { titleKey: 'admin.priv_group_access', items: ['admin.priv_guest_shared_read', 'admin.priv_guest_files_download'] },
      { titleKey: 'admin.priv_group_limits', items: ['admin.priv_guest_no_storage', 'admin.priv_guest_no_admin'] },
    ],
  },
]

const privCount = (role: RoleDef) => role.privileges.reduce((n, g) => n + g.items.length, 0)

function Avatar({ user, size = 32 }: { user: UserT; size?: number }) {
  const initial = (user.display_name || user.username || user.email || '?').trim().charAt(0).toUpperCase()
  if (user.avatar_url) {
    return <img src={user.avatar_url} alt="" className="rounded-full object-cover shrink-0" style={{ width: size, height: size }} />
  }
  return (
    <span
      className="rounded-full bg-primary-light text-primary flex items-center justify-center font-medium shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.45 }}
    >
      {initial}
    </span>
  )
}

// Grouped privileges list (bold group bands + privilege-path rows), shared by
// the detail card and the floating dialog. Assumes a px-5 parent (rows bleed to
// the edges via -mx-5), matching both containers.
function PrivilegeGroups({ role }: { role: RoleDef }) {
  const { t } = useTranslation()
  if (role.allPrivileges) return <p className="text-xs text-text-primary">{t('admin.roles_all_privileges')}</p>
  return (
    <div className="-mx-5">
      {role.privileges.map(g => (
        <div key={g.titleKey}>
          <p className="px-5 py-2 bg-surface-1 text-sm font-semibold text-text-primary">{t(g.titleKey)}</p>
          {g.items.map(k => (
            <p key={k} className="px-5 py-2.5 border-b border-border last:border-0 text-xs text-text-secondary">{t(k)}</p>
          ))}
        </div>
      ))}
    </div>
  )
}

export default function AdminRolesPanel() {
  const [params] = useSearchParams()
  const role = ROLES.find(r => r.id === params.get('role'))
  return role ? <RoleDetail role={role} /> : <RolesList />
}

// ── List view ────────────────────────────────────────────────────────────────
const PAGE_SIZES = [10, 25, 50]

function RolesList() {
  const { t } = useTranslation()
  const [assignRole, setAssignRole] = useState<RoleDef | null>(null)
  const [privRole, setPrivRole]     = useState<RoleDef | null>(null)
  const [pageSize, setPageSize]     = useState(50)
  const [page, setPage]             = useState(1)

  const { data } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.get<RoleStats>('/admin/stats').then(r => r.data),
    staleTime: 30_000,
  })
  const countOf = (id: string) => data?.users_by_role?.find(r => r.key === id)?.count ?? 0

  const totalPages = Math.max(1, Math.ceil(ROLES.length / pageSize))
  const pageRoles  = ROLES.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize)

  return (
    <div>
      <h1 className="text-xl font-medium text-text-primary mb-6">{t('admin.nav_admin_roles')}</h1>

      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="flex items-center gap-4 px-5 py-4 border-b border-border">
          <h2 className="text-base font-medium text-text-primary">{t('admin.roles_title')}</h2>
          {/* Custom roles need a backend → shown but disabled for now. */}
          <span className="flex items-center gap-2" title={t('admin.roles_create_soon')}>
            <span className="flex items-center gap-1.5 text-xs text-text-tertiary cursor-not-allowed select-none">
              <Plus size={15} />{t('admin.roles_create')}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-surface-2 text-text-tertiary">{t('admin.soon_badge')}</span>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-text-tertiary border-b border-border">
                <th className="px-5 py-2.5 font-medium">{t('admin.roles_col_role')}</th>
                <th className="px-5 py-2.5 font-medium">{t('admin.roles_col_desc')}</th>
                <th className="px-5 py-2.5 font-medium">{t('admin.roles_col_type')}</th>
                <th className="px-5 py-2.5 font-medium text-right whitespace-nowrap">{t('admin.roles_col_users')}</th>
              </tr>
            </thead>
            <tbody>
              {pageRoles.map(r => (
                <tr key={r.id} className="group border-b border-border last:border-0 hover:bg-surface-1 transition-colors">
                  <td className="px-5 py-3">
                    <Link to={`/admin?tab=admin-roles&role=${r.id}`} className="flex items-center gap-2 text-primary hover:underline">
                      <r.Icon size={16} style={{ color: r.color }} className="shrink-0" />
                      {t(r.nameKey)}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-text-secondary">{t(r.descKey)}</td>
                  <td className="px-5 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-surface-2 text-text-secondary whitespace-nowrap">{t('admin.roles_system')}</span>
                  </td>
                  <td className="px-5 py-3 text-right text-text-secondary tabular-nums relative">
                    {countOf(r.id)}
                    {/* Inline actions revealed on row hover. */}
                    <div className="absolute right-0 top-0 h-full flex items-center gap-4 pl-12 pr-5 bg-surface-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      <button type="button" onClick={() => setAssignRole(r)} className="text-xs text-primary hover:underline">{t('admin.roles_assign_users')}</button>
                      <button type="button" onClick={() => setPrivRole(r)} className="text-xs text-primary hover:underline">{t('admin.roles_view_privileges')}</button>
                      <Link to={`/admin?tab=admin-roles&role=${r.id}&section=admins`} className="text-xs text-primary hover:underline">{t('admin.roles_view_admins')}</Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-end gap-6 px-5 py-3 border-t border-border text-xs text-text-secondary">
          <label className="flex items-center gap-2">
            <span>{t('admin.rows_per_page')}</span>
            <select
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }}
              className="border border-border rounded-md px-2 py-1 bg-white text-text-primary"
            >
              {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <span className="tabular-nums">{t('admin.page_of', { page, total: totalPages })}</span>
          <div className="flex items-center gap-1">
            <button type="button" disabled={page <= 1} onClick={() => setPage(1)}
              className="p-1 rounded hover:bg-surface-2 disabled:opacity-40 disabled:hover:bg-transparent"
              aria-label={t('admin.page_first', { defaultValue: 'Première page' })}><ChevronsLeft size={18} /></button>
            <button type="button" disabled={page <= 1} onClick={() => setPage(p => p - 1)}
              className="p-1 rounded hover:bg-surface-2 disabled:opacity-40 disabled:hover:bg-transparent"
              aria-label={t('admin.page_prev', { defaultValue: 'Page précédente' })}><ChevronLeft size={18} /></button>
            <button type="button" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
              className="p-1 rounded hover:bg-surface-2 disabled:opacity-40 disabled:hover:bg-transparent"
              aria-label={t('admin.page_next', { defaultValue: 'Page suivante' })}><ChevronRight size={18} /></button>
          </div>
        </div>
      </div>

      {assignRole && <AssignUsersDialog role={assignRole} onClose={() => setAssignRole(null)} />}
      {privRole && <ViewPrivilegesDialog role={privRole} onClose={() => setPrivRole(null)} />}
    </div>
  )
}

// ── Detail view ──────────────────────────────────────────────────────────────
function CollapsibleCard({
  title, defaultOpen = false, summary, children,
}: { title: string; defaultOpen?: boolean; summary?: React.ReactNode; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden">
      <button
        type="button" onClick={() => setOpen(o => !o)} aria-expanded={open}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-surface-1 transition-colors"
      >
        <span className="text-base font-medium text-text-primary">{title}</span>
        <ChevronDown size={18} className={`text-text-tertiary transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <div className="px-5 pb-5 pt-0">{open ? children : summary}</div>
    </div>
  )
}

function RoleDetail({ role }: { role: RoleDef }) {
  const { t } = useTranslation()
  const [params] = useSearchParams()
  const section = params.get('section')
  const [assignOpen, setAssignOpen] = useState(false)

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-role-users', role.id],
    queryFn: () => api.get<{ users: UserT[] }>('/admin/users', { params: { role: role.id, limit: 200 } }).then(r => r.data.users),
    staleTime: 30_000,
  })
  const list = users ?? []

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs mb-6">
        <Link to="/admin?tab=admin-roles" className="text-primary hover:underline">{t('admin.nav_admin_roles')}</Link>
        <span className="text-text-tertiary">›</span>
        <span className="text-text-primary font-medium">{t(role.nameKey)}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(240px,320px)_1fr] gap-4 items-start">
        {/* Left card */}
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="p-5">
            <span className="inline-block text-[11px] font-semibold uppercase tracking-wider text-text-secondary bg-surface-2 px-2 py-1 rounded">
              {t('admin.roles_system')}
            </span>
            <div className="flex items-center gap-2.5 mt-4">
              <role.Icon size={22} style={{ color: role.color }} className="shrink-0" />
              <h2 className="text-xl font-medium text-text-primary">{t(role.nameKey)}</h2>
            </div>
            <p className="text-xs text-text-secondary mt-2">{t(role.descKey)}</p>
          </div>
          {/* Copying a role creates a custom one → needs a backend. */}
          <div
            className="flex items-center gap-2 px-5 py-3.5 border-t border-border text-xs text-text-tertiary cursor-not-allowed select-none"
            title={t('admin.roles_create_soon')}
          >
            <Copy size={16} />
            {t('admin.roles_copy')}
            <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-surface-2 text-text-tertiary">{t('admin.soon_badge')}</span>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Admins */}
          <CollapsibleCard
            title={t('admin.roles_admins')}
            defaultOpen={section === 'admins'}
            summary={
              <div>
                <p className="text-xs font-medium text-text-primary">{t('admin.roles_admins_assigned')}</p>
                <p className="text-xs text-text-secondary mt-1">
                  {list.length > 0 ? list.map(u => u.display_name || u.username).join(', ') : (isLoading ? '…' : '—')}
                </p>
              </div>
            }
          >
            <div className="flex items-center gap-4 mb-3">
              <span className="text-xs text-text-secondary">{t('admin.roles_showing_all')}</span>
              <button type="button" onClick={() => setAssignOpen(true)} className="text-xs text-primary hover:underline">
                {t('admin.roles_assign_users')}
              </button>
            </div>

            {list.length === 0 ? (
              <p className="text-xs text-text-tertiary py-6 text-center">{isLoading ? '…' : t('admin.roles_no_admins')}</p>
            ) : (
              <div className="overflow-x-auto -mx-5">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-text-tertiary border-y border-border">
                      <th className="px-5 py-2 font-medium">{t('admin.roles_col_admin')}</th>
                      <th className="px-5 py-2 font-medium">{t('admin.roles_col_status')}</th>
                      <th className="px-5 py-2 font-medium">{t('admin.roles_col_type')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map(u => (
                      <tr key={u.id} className="border-b border-border last:border-0 hover:bg-surface-1 transition-colors">
                        <td className="px-5 py-2.5">
                          <Link to={`/admin?tab=users&q=${encodeURIComponent(u.email)}`} className="flex items-center gap-3 group">
                            <Avatar user={u} />
                            <span className="min-w-0">
                              <span className="block text-xs font-medium text-text-primary truncate group-hover:text-primary">{u.display_name || u.username}</span>
                              <span className="block text-xs text-text-tertiary truncate">{u.email}</span>
                            </span>
                          </Link>
                        </td>
                        <td className="px-5 py-2.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${u.is_active ? 'bg-success-light text-success' : 'bg-surface-2 text-text-secondary'}`}>
                            {u.is_active ? t('admin.roles_active') : t('admin.roles_inactive')}
                          </span>
                        </td>
                        <td className="px-5 py-2.5 text-text-secondary">{t('admin.role_user_name')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CollapsibleCard>

          {/* Privileges */}
          <CollapsibleCard
            title={t('admin.roles_privileges')}
            defaultOpen={section === 'privileges'}
            summary={
              <p className="text-xs text-text-secondary">
                {role.allPrivileges ? t('admin.roles_all_privileges') : t('admin.priv_count', { count: privCount(role) })}
              </p>
            }
          >
            <PrivilegeGroups role={role} />
          </CollapsibleCard>
        </div>
      </div>

      {assignOpen && <AssignUsersDialog role={role} onClose={() => setAssignOpen(false)} />}
    </div>
  )
}

// ── Floating: view privileges ────────────────────────────────────────────────
function ViewPrivilegesDialog({ role, onClose }: { role: RoleDef; onClose: () => void }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  return (
    <FloatingWindow title={t(role.nameKey)} onClose={onClose} defaultWidth={560} backdrop>
      <div className="flex flex-col max-h-[70vh]">
        <div className="px-5 py-2.5 border-b border-border text-xs text-text-tertiary text-right">
          {role.allPrivileges ? t('admin.roles_all_privileges') : t('admin.priv_count', { count: privCount(role) })}
        </div>
        <div className="p-5 overflow-y-auto flex-1">
          <PrivilegeGroups role={role} />
        </div>
        <div className="px-5 py-3 border-t border-border flex justify-center">
          <button
            type="button"
            onClick={() => { onClose(); navigate(`/admin?tab=admin-roles&role=${role.id}&section=privileges`) }}
            className="text-xs font-medium text-primary hover:underline uppercase tracking-wide"
          >
            {t('admin.priv_open')}
          </button>
        </div>
      </div>
    </FloatingWindow>
  )
}

// ── Floating: assign users ───────────────────────────────────────────────────
// A user has a single role in Kubuno, so assigning = PATCH /admin/users/:id
// { role, org_unit_id }. Each selected user can be placed in an org unit.
function AssignUsersDialog({ role, onClose }: { role: RoleDef; onClose: () => void }) {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [query, setQuery]         = useState('')
  const [debounced, setDebounced] = useState('')
  const [selected, setSelected]   = useState<{ user: UserT; ouId: string | null }[]>([])
  const [pickerIdx, setPickerIdx] = useState<number | null>(null)

  useEffect(() => { const id = setTimeout(() => setDebounced(query.trim()), 200); return () => clearTimeout(id) }, [query])

  const { data: ouData } = useQuery({
    queryKey: ['admin-org-units'],
    queryFn: () => api.get<{ org_units: OrgUnit[] }>('/admin/org-units').then(r => r.data.org_units),
    staleTime: 30_000,
  })
  const ous  = ouData ?? []
  const root = ous.find(u => u.parent_id === null)
  const ouName = (id: string | null) => ous.find(u => u.id === id)?.name ?? '—'

  const { data: found } = useQuery({
    queryKey: ['admin-user-search', debounced],
    queryFn: () => api.get<{ users: UserT[] }>('/admin/users', { params: { search: debounced, limit: 6 } }).then(r => r.data.users),
    enabled: debounced.length >= 1,
    staleTime: 15_000,
  })
  const selectedIds = new Set(selected.map(s => s.user.id))
  const suggestions = (found ?? []).filter(u => !selectedIds.has(u.id) && u.role !== role.id)

  const assign = useMutation({
    mutationFn: async () => {
      for (const s of selected) await api.patch(`/admin/users/${s.user.id}`, { role: role.id, org_unit_id: s.ouId })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-role-users'] })
      qc.invalidateQueries({ queryKey: ['admin-stats'] })
      qc.invalidateQueries({ queryKey: ['admin-users'] })
      onClose()
    },
  })

  const addUser = (u: UserT) => { setSelected(s => [...s, { user: u, ouId: u.org_unit_id ?? root?.id ?? null }]); setQuery('') }

  return (
    <FloatingWindow
      title={`${t('admin.roles_assign_users')} · ${t(role.nameKey)}`}
      onClose={onClose} defaultWidth={720} backdrop
    >
      <div className="p-5 space-y-4 overflow-y-auto">
        <p className="text-sm font-medium text-text-primary">{t('admin.assign_add_users')}</p>

        <div>
          <Input value={query} onChange={e => setQuery(e.target.value)} placeholder={t('admin.assign_find_user')} />
          {debounced.length >= 1 && suggestions.length > 0 && (
            <div className="mt-1 border border-border rounded-lg overflow-hidden max-h-56 overflow-y-auto">
              {suggestions.map(u => (
                <button
                  key={u.id} type="button" onClick={() => addUser(u)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-surface-2 transition-colors"
                >
                  <Avatar user={u} size={28} />
                  <span className="min-w-0">
                    <span className="block text-xs text-text-primary truncate">{u.display_name || u.username}</span>
                    <span className="block text-xs text-text-tertiary truncate">{u.email}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <p className="text-xs text-text-tertiary">{t('admin.assign_note', { role: t(role.nameKey) })}</p>

        {selected.length > 0 && (
          <div className="border border-border rounded-lg overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-text-tertiary bg-surface-1">
                  <th className="px-4 py-2 font-medium">{t('admin.assign_selected')}</th>
                  <th className="px-4 py-2 font-medium">{t('admin.ou_col')}</th>
                  <th className="px-4 py-2 font-medium">{t('admin.assign_status')}</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {selected.map((s, i) => (
                  <tr key={s.user.id} className="border-t border-border">
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-3">
                        <Avatar user={s.user} size={28} />
                        <span className="min-w-0">
                          <span className="block text-xs font-medium text-text-primary truncate">{s.user.display_name || s.user.username}</span>
                          <span className="block text-xs text-text-tertiary truncate">{s.user.email}</span>
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <button type="button" onClick={() => setPickerIdx(i)} className="flex items-center gap-1.5 text-primary hover:underline">
                        {ouName(s.ouId)}<Pencil size={13} />
                      </button>
                    </td>
                    <td className="px-4 py-2 text-text-tertiary whitespace-nowrap">{t('admin.assign_pending')}</td>
                    <td className="px-2 py-2 text-right">
                      <button
                        type="button" onClick={() => setSelected(list => list.filter(x => x.user.id !== s.user.id))}
                        aria-label={t('common.close')} className="text-text-tertiary hover:text-text-primary"
                      >
                        <X size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-end pt-1">
          <Button onClick={() => assign.mutate()} disabled={selected.length === 0 || assign.isPending}>
            {assign.isPending ? '…' : t('admin.roles_assign_users')}
          </Button>
        </div>
      </div>

      {pickerIdx !== null && selected[pickerIdx] && (
        <OrgUnitPicker
          title={t('admin.ou_picker_title', { name: selected[pickerIdx].user.display_name || selected[pickerIdx].user.username })}
          currentId={selected[pickerIdx].ouId}
          onSelect={(id) => setSelected(list => list.map((x, i) => (i === pickerIdx ? { ...x, ouId: id } : x)))}
          onClose={() => setPickerIdx(null)}
        />
      )}
    </FloatingWindow>
  )
}
