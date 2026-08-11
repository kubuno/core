import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import { Plus, FolderInput, MoreVertical, Pencil, Trash2, Building2 } from 'lucide-react'
import {
  Input, MenuDropdown, ConfirmDialog, useToast, foldIncludes,
  type MenuItem, type MenuDropdownPos,
} from '@ui'
import { FloatingWindow } from '@ui/FloatingWindow'
import OrgUnitPicker from './OrgUnitPicker'
import { useConfirm } from '../hooks/useConfirm'
import { useAdminAction } from './adminAction'
import { PRIV } from '../authz/types'
import { usePrivileges } from '../authz/usePrivileges'
import type { OrgUnit } from '../types'

/** Deepest nesting this table will draw. A parent cycle is refused server-side,
 *  but the console must not hang on a tree that already holds one — the same
 *  guard `orgUnitPath` (settings/scopeTypes.ts) puts on its own walk. */
const MAX_DEPTH = 32

// Depth-first flatten (root first, children under parents), for the indented table.
function flatten(units: OrgUnit[], parentId: string | null, depth: number, out: { u: OrgUnit; depth: number }[]) {
  if (depth > MAX_DEPTH) return
  units.filter(x => x.parent_id === parentId).sort((a, b) => a.name.localeCompare(b.name)).forEach(u => {
    out.push({ u, depth })
    flatten(units, u.id, depth + 1, out)
  })
}

/** The server explains *why* a move or a deletion is refused (cycle, unit not
 *  empty, out of scope). Dropping that message turns a 422 into a button that
 *  appears to do nothing at all.
 *
 *  Both shapes on purpose: the API client rejects with a FLAT `{ message, code }`
 *  (`normalizeError`, api/client.ts), so `response.data.message` alone never
 *  matches and every refusal reads as the same generic sentence. */
function errMessage(err: unknown): string | undefined {
  const e = err as { message?: string; response?: { data?: { message?: string } } }
  return e?.response?.data?.message ?? e?.message
}

export default function OrgUnitsPanel() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { can } = usePrivileges()
  const { data } = useQuery({
    queryKey: ['admin-org-units'],
    queryFn: () => api.get<{ org_units: OrgUnit[] }>('/admin/org-units').then(r => r.data.org_units),
    staleTime: 30_000,
  })
  const units = data ?? []

  // Accounts per unit. `limit=0` because only the aggregate is wanted: the
  // response then carries the counts and not a single account row. Requires
  // reading accounts — an operator who may only see the tree gets the tree.
  const { data: counts } = useQuery({
    queryKey: ['admin-org-unit-counts'],
    queryFn: () =>
      api.get<{ org_unit_counts?: { org_unit_id: string; count: number }[] }>('/admin/users', {
        params: { limit: 0, counts: true },
      }).then(r => r.data.org_unit_counts ?? []),
    enabled: can(PRIV.USERS_READ),
    staleTime: 30_000,
  })
  const own = new Map((counts ?? []).map(c => [c.org_unit_id, c.count]))
  // Subtree total: the server answers per unit, the sum belongs to the side that
  // already holds the tree — one query instead of one recursion per unit.
  const subtreeCount = (id: string, depth = 0): number =>
    depth > MAX_DEPTH
      ? 0
      : (own.get(id) ?? 0)
        + units.filter(u => u.parent_id === id).reduce((n, u) => n + subtreeCount(u.id, depth + 1), 0)

  // Optional deep-link filter from the global admin search (?q=).
  const [params] = useSearchParams()
  const search = params.get('q') ?? ''

  const [dialog, setDialog]     = useState<{ mode: 'create' | 'edit'; unit?: OrgUnit; parentId?: string } | null>(null)
  const [moveUnit, setMoveUnit] = useState<OrgUnit | null>(null)
  const [menu, setMenu]         = useState<{ unit: OrgUnit; pos: MenuDropdownPos } | null>(null)
  const toast = useToast()
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm()

  // `/admin/org-units?action=create` opens the dialog under the root, which
  // is where a new unit goes when the operator did not pick a parent first.
  // Deferred until the tree has loaded: the dialog reads its parent once, at
  // mount, and opening it too early would leave that field empty.
  const [pendingCreate, setPendingCreate] = useState(false)
  useAdminAction('create', () => setPendingCreate(true))
  useEffect(() => {
    if (!pendingCreate || units.length === 0) return
    setPendingCreate(false)
    setDialog({ mode: 'create', parentId: units.find(u => u.parent_id === null)?.id })
  }, [pendingCreate, units])

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['admin-org-units'] })
    // Moving or deleting a unit reshuffles which accounts sit where.
    qc.invalidateQueries({ queryKey: ['admin-org-unit-counts'] })
  }
  const move = useMutation({
    mutationFn: (p: { id: string; parent_id: string }) =>
      api.patch(`/admin/org-units/${p.id}`, { parent_id: p.parent_id }),
    onSuccess: invalidate,
    onError: err => toast.error(errMessage(err) ?? t('admin.ou_move_error')),
  })
  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/org-units/${id}`),
    onSuccess: invalidate,
    onError: err => toast.error(errMessage(err) ?? t('admin.ou_delete_error')),
  })

  /** Standard confirmation, and it NAMES the unit: the previous in-card banner
   *  said "delete this unit?" with no way to tell which row it meant. */
  const askDelete = async (u: OrgUnit) => {
    const ok = await confirm({
      title:        t('admin.ou_delete_title', { name: u.name }),
      message:      t('admin.ou_delete_confirm'),
      confirmLabel: t('admin.ou_delete'),
      variant:      'danger',
    })
    if (ok) remove.mutate(u.id)
  }

  const needle = search.trim()
  const flat: { u: OrgUnit; depth: number }[] = []
  flatten(units, null, 0, flat)
  // Accent-insensitive: the deep link may carry "unites" for "Unités".
  const rows = needle
    ? units.filter(u => foldIncludes(`${u.name} ${u.description ?? ''}`, needle)).map(u => ({ u, depth: 0 }))
    : flat

  const openMenu = (u: OrgUnit, el: HTMLElement) => {
    const r = el.getBoundingClientRect()
    setMenu({ unit: u, pos: { top: r.bottom + 4, left: Math.max(8, r.right - 180) } })
  }
  const menuItems = (u: OrgUnit): MenuItem[] => [
    { type: 'action', label: t('admin.ou_add'),    icon: <Plus size={15} />,       onClick: () => setDialog({ mode: 'create', parentId: u.id }) },
    { type: 'action', label: t('admin.ou_rename'), icon: <Pencil size={15} />,     onClick: () => setDialog({ mode: 'edit', unit: u }) },
    ...(u.parent_id !== null
      ? [{ type: 'action' as const, label: t('admin.ou_move'), icon: <FolderInput size={15} />, onClick: () => setMoveUnit(u) },
         { type: 'separator' as const },
         { type: 'action' as const, label: t('admin.ou_delete'), danger: true, icon: <Trash2 size={15} />, onClick: () => { void askDelete(u) } }]
      : []),
  ]

  return (
    <div>
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="flex items-baseline gap-2 px-5 py-4 border-b border-border">
          <h2 className="text-base font-medium text-text-primary">{t('admin.ou_manage_title')}</h2>
          <span className="text-sm text-text-tertiary">| {t('admin.ou_count', { count: units.length })}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-text-tertiary border-b border-border">
                <th className="px-5 py-2.5 font-medium">{t('admin.ou_col_name')}</th>
                <th className="px-5 py-2.5 font-medium">{t('admin.ou_col_desc')}</th>
                {can(PRIV.USERS_READ) && (
                  <th className="px-5 py-2.5 font-medium whitespace-nowrap">{t('admin.ou_col_users')}</th>
                )}
                <th className="w-32" />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={4} className="px-5 py-8 text-center text-sm text-text-tertiary">{t('admin.ou_no_results')}</td></tr>
              )}
              {rows.map(({ u, depth }) => {
                const isRoot = u.parent_id === null
                return (
                  <tr key={u.id} className="group border-b border-border last:border-0 hover:bg-surface-1 transition-colors">
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-2" style={{ paddingLeft: depth * 20 }}>
                        <Building2 size={16} className="text-text-tertiary shrink-0" />
                        <span className="text-text-primary">{u.name}</span>
                        {isRoot && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-surface-2 text-text-tertiary">{t('admin.ou_root')}</span>}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-text-secondary">{u.description || '—'}</td>
                    {can(PRIV.USERS_READ) && (
                      <td className="px-5 py-3 whitespace-nowrap">
                        {/* Own count first — it is the one an operator acts on. The
                            subtree total only shows when it says something more. */}
                        <span className="text-text-primary">{own.get(u.id) ?? 0}</span>
                        {subtreeCount(u.id) !== (own.get(u.id) ?? 0) && (
                          <span className="text-text-tertiary ml-2">
                            {t('admin.ou_users_subtree', { count: subtreeCount(u.id) })}
                          </span>
                        )}
                      </td>
                    )}
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button type="button" onClick={() => setDialog({ mode: 'create', parentId: u.id })} title={t('admin.ou_add')} className="p-1.5 rounded text-text-tertiary hover:text-primary hover:bg-surface-2"><Plus size={16} /></button>
                        {!isRoot && <button type="button" onClick={() => setMoveUnit(u)} title={t('admin.ou_move')} className="p-1.5 rounded text-text-tertiary hover:text-primary hover:bg-surface-2"><FolderInput size={16} /></button>}
                        <button type="button" onClick={e => openMenu(u, e.currentTarget)} title={t('admin.ou_more')} className="p-1.5 rounded text-text-tertiary hover:text-primary hover:bg-surface-2"><MoreVertical size={16} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

      </div>

      {menu && <MenuDropdown items={menuItems(menu.unit)} pos={menu.pos} onClose={() => setMenu(null)} />}

      {dialog && <OrgUnitDialog {...dialog} units={units} onClose={() => setDialog(null)} />}

      {moveUnit && (
        <OrgUnitPicker
          title={t('admin.ou_move_title', { name: moveUnit.name })}
          currentId={moveUnit.parent_id}
          excludeId={moveUnit.id}
          onSelect={(id) => move.mutate({ id: moveUnit.id, parent_id: id })}
          onClose={() => setMoveUnit(null)}
        />
      )}

      {confirmState && (
        <ConfirmDialog {...confirmState} onConfirm={handleConfirm} onCancel={handleCancel} />
      )}
    </div>
  )
}

// Create / edit dialog: name, description, parent (via the tree picker).
function OrgUnitDialog({
  mode, unit, parentId, units, onClose,
}: {
  mode: 'create' | 'edit'; unit?: OrgUnit; parentId?: string; units: OrgUnit[]; onClose: () => void
}) {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [name, setName]         = useState(unit?.name ?? '')
  const [desc, setDesc]         = useState(unit?.description ?? '')
  const [parent, setParent]     = useState<string | null>(mode === 'edit' ? (unit?.parent_id ?? null) : (parentId ?? null))
  const [pickerOpen, setPickerOpen] = useState(false)
  const [error, setError]       = useState('')

  const parentName = units.find(u => u.id === parent)?.name ?? '—'
  const isRootEdit = mode === 'edit' && unit?.parent_id === null

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['admin-org-units'] })
    qc.invalidateQueries({ queryKey: ['admin-org-unit-counts'] })
  }
  const save = useMutation({
    mutationFn: () => mode === 'create'
      ? api.post('/admin/org-units', { name: name.trim(), description: desc.trim() || null, parent_id: parent })
      // The parent was offered by this dialog and then dropped on the way out:
      // one could pick a new one, save, and watch nothing happen. Sent only when
      // it changed, and never for the root — which has no parent to move to.
      : api.patch(`/admin/org-units/${unit!.id}`, {
          name: name.trim(),
          description: desc.trim() || null,
          ...(!isRootEdit && parent && parent !== unit?.parent_id ? { parent_id: parent } : {}),
        }),
    onSuccess: () => { invalidate(); onClose() },
    onError: err => setError(errMessage(err) ?? t('admin.update_error')),
  })

  return (
    <FloatingWindow
      title={mode === 'create' ? t('admin.ou_create_title') : t('admin.ou_edit_title')}
      onClose={onClose}
      defaultWidth={480}
      backdrop
      t={t}
      actions={{
        confirm: {
          label:    mode === 'create' ? t('admin.ou_create') : t('admin.ou_save'),
          onClick:  () => save.mutate(),
          disabled: !name.trim() || (mode === 'create' && !parent) || save.isPending,
          loading:  save.isPending,
        },
        cancel: { label: t('admin.ou_cancel') },
      }}
    >
      <div className="p-5 space-y-5">
        <div>
          <label className="block text-sm text-primary mb-1">{t('admin.ou_field_name')} *</label>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder={t('admin.ou_name_ph')} />
        </div>
        <div>
          <label className="block text-sm text-text-secondary mb-1">{t('admin.ou_col_desc')}</label>
          <Input value={desc} onChange={e => setDesc(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm text-text-secondary mb-1">{t('admin.ou_field_parent')}{mode === 'create' && ' *'}</label>
          <div className="flex items-center justify-between border-b border-border pb-1">
            <span className="text-sm text-text-primary">{parentName}</span>
            {!isRootEdit && (
              <button type="button" onClick={() => setPickerOpen(true)} className="p-1 text-text-tertiary hover:text-primary" title={t('admin.ou_change_parent')}><Pencil size={15} /></button>
            )}
          </div>
        </div>
        {error && <p className="text-sm text-danger bg-danger-light px-3 py-2 rounded-md">{error}</p>}
      </div>
      {pickerOpen && (
        <OrgUnitPicker
          title={t('admin.ou_select_parent')}
          currentId={parent}
          excludeId={unit?.id}
          onSelect={(id) => setParent(id)}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </FloatingWindow>
  )
}
