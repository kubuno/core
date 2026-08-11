import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Building2, Globe2, Lock, Users } from 'lucide-react'
import { Callout, Combobox, DatePicker, Input, Radio, useToast } from '@ui'
import { FloatingWindow } from '@ui/FloatingWindow'
import { api } from '../../api/client'
import { PRIV, type Privilege, type Role } from '../../authz/types'
import { useAuthzLabels } from '../../authz/labels'
import { usePrivileges } from '../../authz/usePrivileges'
import type { OrgUnit, User, UserGroup } from '../../types'
import OrgUnitPicker from '../OrgUnitPicker'
import { errorMessage, useCreateAssignment } from './api'

type SubjectKind = 'user' | 'group'
type Scope = 'instance' | 'org_unit'

function Avatar({ user, size = 28 }: { user: User; size?: number }) {
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

/**
 * Grant a role to one subject over one scope.
 *
 * ── The decisive point ───────────────────────────────────────────────────────
 * `ou_delegable` is false when the role carries even one privilege that cannot
 * be confined to a subtree. The server refuses such an assignment outright, so
 * the "organisational unit" option is **disabled and explained here**, before
 * anything is composed. Letting the operator pick a unit, choose a subject and
 * submit — only to be told the combination was impossible from the start — is
 * the failure mode this screen exists to avoid.
 */
export default function AssignRoleDialog({
  role, catalogue, onClose,
}: {
  role:      Role
  catalogue: Privilege[]
  onClose:   () => void
}) {
  const { t } = useTranslation()
  const toast = useToast()
  const { can } = usePrivileges()
  const { roleName } = useAuthzLabels()

  const [kind, setKind]       = useState<SubjectKind>('user')
  const [user, setUser]       = useState<User | null>(null)
  const [groupId, setGroupId] = useState<string | null>(null)
  const [scope, setScope]     = useState<Scope>('instance')
  const [unitId, setUnitId]   = useState<string | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [expiresAt, setExpiresAt]   = useState<string | null>(null)
  const [query, setQuery]           = useState('')
  const [debounced, setDebounced]   = useState('')
  const [error, setError]           = useState('')

  useEffect(() => { const id = setTimeout(() => setDebounced(query.trim()), 200); return () => clearTimeout(id) }, [query])
  // A role that cannot be delegated to a unit stays on instance scope, whatever
  // the operator had selected before switching roles.
  useEffect(() => { if (!role.ou_delegable) { setScope('instance'); setUnitId(null) } }, [role.ou_delegable])

  const canGroups = can(PRIV.GROUPS_READ)

  const { data: found } = useQuery({
    queryKey: ['admin-user-search', debounced],
    queryFn:  () => api.get<{ users: User[] }>('/admin/users', { params: { search: debounced, limit: 6 } }).then(r => r.data.users),
    enabled:  kind === 'user' && debounced.length >= 1 && can(PRIV.USERS_READ),
    staleTime: 15_000,
  })

  const { data: groups } = useQuery({
    queryKey: ['admin-groups'],
    queryFn:  () => api.get<{ groups: UserGroup[] }>('/admin/groups').then(r => r.data.groups),
    enabled:  kind === 'group' && canGroups,
    staleTime: 60_000,
  })

  const { data: units } = useQuery({
    queryKey: ['admin-org-units'],
    queryFn:  () => api.get<{ org_units: OrgUnit[] }>('/admin/org-units').then(r => r.data.org_units),
    enabled:  can(PRIV.ORG_UNITS_READ),
    staleTime: 30_000,
  })
  const unitName = (id: string | null) => (units ?? []).find(u => u.id === id)?.name ?? '—'

  // The privileges that make this role instance-only, named so the refusal is
  // an explanation rather than a verdict.
  const blockers = useMemo(() => {
    const byKey = new Map(catalogue.map(p => [p.key, p]))
    return role.privileges
      .map(k => byKey.get(k))
      .filter((p): p is Privilege => !!p && !p.is_ou_scopable)
  }, [role.privileges, catalogue])

  const create = useCreateAssignment(() => { toast.success(t('admin.assign_done')); onClose() })

  const subjectReady = kind === 'user' ? !!user : !!groupId
  const scopeReady   = scope === 'instance' || !!unitId

  // Also reachable from the window's own footer, which is outside the form.
  const submit = (e?: React.FormEvent) => {
    e?.preventDefault()
    setError('')
    create.mutate(
      {
        role_id:     role.id,
        user_id:     kind === 'user' ? user!.id : undefined,
        group_id:    kind === 'group' ? groupId! : undefined,
        scope,
        org_unit_id: scope === 'org_unit' ? unitId : null,
        expires_at:  expiresAt ? new Date(`${expiresAt}T23:59:59`).toISOString() : null,
      },
      { onError: err => setError(errorMessage(err, t('admin.assign_error'))) },
    )
  }

  const kindButton = (value: SubjectKind, label: string, Icon: typeof Users, enabled = true) => (
    <button
      key={value}
      type="button"
      disabled={!enabled}
      onClick={() => { setKind(value); setError('') }}
      className={`flex-1 flex items-center justify-center gap-2 h-9 px-3 rounded-md border text-sm transition-colors ${
        kind === value
          ? 'border-primary bg-primary-light text-primary'
          : 'border-border text-text-secondary hover:bg-surface-1 disabled:hover:bg-transparent disabled:text-text-tertiary disabled:cursor-not-allowed'}`}
    >
      <Icon size={15} />{label}
    </button>
  )

  return (
    <FloatingWindow
      title={`${t('admin.assign_title')} · ${roleName(role)}`}
      onClose={onClose}
      defaultWidth={620}
      backdrop
      t={t}
      actions={{
        confirm: {
          label:    t('admin.assign_submit'),
          onClick:  () => submit(),
          disabled: !subjectReady || !scopeReady,
          loading:  create.isPending,
        },
        cancel: { label: t('common.cancel') },
      }}
    >
      <form onSubmit={submit} className="flex flex-col max-h-[80vh]">
        <div className="p-5 space-y-5 overflow-y-auto">
          {/* ── Subject ───────────────────────────────────────────────── */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-text-primary">{t('admin.assign_subject')}</p>
            <div className="flex gap-2">
              {kindButton('user', t('admin.assign_subject_user'), Users)}
              {kindButton('group', t('admin.assign_subject_group'), Building2, canGroups)}
            </div>

            {kind === 'user' ? (
              user ? (
                <div className="flex items-center gap-3 border border-border rounded-lg px-3 py-2">
                  <Avatar user={user} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm text-text-primary truncate">{user.display_name || user.username}</span>
                    <span className="block text-sm text-text-tertiary truncate">{user.email}</span>
                  </span>
                  <button type="button" onClick={() => setUser(null)} className="text-sm text-primary hover:underline">
                    {t('admin.assign_change')}
                  </button>
                </div>
              ) : (
                <div>
                  <Input value={query} onChange={e => setQuery(e.target.value)} placeholder={t('admin.assign_find_user')} />
                  {debounced.length >= 1 && (found ?? []).length > 0 && (
                    <div className="mt-1 border border-border rounded-lg overflow-hidden max-h-56 overflow-y-auto">
                      {found!.map(u => (
                        <button
                          key={u.id} type="button"
                          onClick={() => { setUser(u); setQuery('') }}
                          className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-surface-2 transition-colors"
                        >
                          <Avatar user={u} />
                          <span className="min-w-0">
                            <span className="block text-sm text-text-primary truncate">{u.display_name || u.username}</span>
                            <span className="block text-sm text-text-tertiary truncate">{u.email}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            ) : (
              <Combobox
                value={groupId}
                onChange={setGroupId}
                options={(groups ?? []).map(g => ({ value: g.id, label: g.name, description: g.description ?? undefined }))}
                placeholder={t('admin.assign_pick_group')}
                width="100%"
                t={t}
              />
            )}
          </div>

          {/* ── Scope ─────────────────────────────────────────────────── */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-text-primary">{t('admin.assign_scope')}</p>

            <div className="border border-border rounded-lg divide-y divide-border">
              <label className="flex items-start gap-3 p-3 cursor-pointer">
                <Radio checked={scope === 'instance'} onChange={() => setScope('instance')} />
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5 text-sm text-text-primary">
                    <Globe2 size={14} className="text-text-tertiary" />{t('admin.assign_scope_instance')}
                  </span>
                  <span className="block text-sm text-text-secondary mt-0.5">{t('admin.assign_scope_instance_desc')}</span>
                </span>
              </label>

              <label
                className={`flex items-start gap-3 p-3 ${role.ou_delegable ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                title={role.ou_delegable ? undefined : t('admin.assign_scope_ou_blocked_short')}
              >
                <Radio
                  checked={scope === 'org_unit'}
                  disabled={!role.ou_delegable}
                  onChange={() => role.ou_delegable && setScope('org_unit')}
                />
                <span className="min-w-0">
                  <span className={`flex items-center gap-1.5 text-sm ${role.ou_delegable ? 'text-text-primary' : 'text-text-tertiary'}`}>
                    {role.ou_delegable ? <Building2 size={14} className="text-text-tertiary" /> : <Lock size={14} />}
                    {t('admin.assign_scope_ou')}
                  </span>
                  <span className="block text-sm text-text-secondary mt-0.5">{t('admin.assign_scope_ou_desc')}</span>

                  {scope === 'org_unit' && role.ou_delegable && (
                    <span className="flex items-center gap-2 mt-2">
                      <span className="text-sm text-text-secondary">{unitName(unitId)}</span>
                      <button
                        type="button"
                        onClick={e => { e.preventDefault(); setPickerOpen(true) }}
                        className="text-sm text-primary hover:underline"
                      >
                        {unitId ? t('admin.assign_change') : t('admin.assign_pick_unit')}
                      </button>
                    </span>
                  )}
                </span>
              </label>
            </div>

            {/* Why the option above is closed — named, not merely greyed. */}
            {!role.ou_delegable && (
              <Callout variant="warning" title={t('admin.assign_scope_ou_blocked_title')} t={t}>
                <span className="block">
                  {role.is_superuser
                    ? t('admin.assign_scope_ou_blocked_superuser')
                    : t('admin.assign_scope_ou_blocked_desc', { count: blockers.length })}
                </span>
                {blockers.length > 0 && (
                  <span className="mt-1.5 flex flex-wrap gap-1.5">
                    {blockers.map(p => (
                      <span key={p.key} className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-surface-2 text-text-secondary">
                        {p.key}
                      </span>
                    ))}
                  </span>
                )}
              </Callout>
            )}
          </div>

          {/* ── Expiry ────────────────────────────────────────────────── */}
          <div className="space-y-1.5">
            <p className="text-sm font-medium text-text-primary">{t('admin.assign_expiry')}</p>
            <DatePicker
              value={expiresAt}
              onChange={setExpiresAt}
              clearable
              minDate={new Date(Date.now() + 86_400_000).toISOString().slice(0, 10)}
              placeholder={t('admin.assign_expiry_never')}
              hint={t('admin.assign_expiry_hint')}
            />
          </div>

          {error && <Callout variant="danger" t={t}>{error}</Callout>}
        </div>
      </form>

      {pickerOpen && (
        <OrgUnitPicker
          title={t('admin.assign_pick_unit')}
          currentId={unitId}
          onSelect={setUnitId}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </FloatingWindow>
  )
}
