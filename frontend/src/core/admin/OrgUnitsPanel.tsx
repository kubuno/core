import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import { Plus, FolderInput, MoreVertical, Pencil, Trash2, Building2 } from 'lucide-react'
import { Input, Button, MenuDropdown, type MenuItem, type MenuDropdownPos } from '@ui'
import { FloatingWindow } from '@ui/FloatingWindow'
import OrgUnitPicker from './OrgUnitPicker'
import type { OrgUnit } from '../types'

// Depth-first flatten (root first, children under parents), for the indented table.
function flatten(units: OrgUnit[], parentId: string | null, depth: number, out: { u: OrgUnit; depth: number }[]) {
  units.filter(x => x.parent_id === parentId).sort((a, b) => a.name.localeCompare(b.name)).forEach(u => {
    out.push({ u, depth })
    flatten(units, u.id, depth + 1, out)
  })
}

export default function OrgUnitsPanel() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { data } = useQuery({
    queryKey: ['admin-org-units'],
    queryFn: () => api.get<{ org_units: OrgUnit[] }>('/admin/org-units').then(r => r.data.org_units),
    staleTime: 30_000,
  })
  const units = data ?? []

  // Optional deep-link filter from the global admin search (?q=).
  const [params] = useSearchParams()
  const search = params.get('q') ?? ''

  const [dialog, setDialog]     = useState<{ mode: 'create' | 'edit'; unit?: OrgUnit; parentId?: string } | null>(null)
  const [moveUnit, setMoveUnit] = useState<OrgUnit | null>(null)
  const [confirmDel, setConfirmDel] = useState<string | null>(null)
  const [menu, setMenu]         = useState<{ unit: OrgUnit; pos: MenuDropdownPos } | null>(null)

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin-org-units'] })
  const move   = useMutation({ mutationFn: (p: { id: string; parent_id: string }) => api.patch(`/admin/org-units/${p.id}`, { parent_id: p.parent_id }), onSuccess: invalidate })
  const remove = useMutation({ mutationFn: (id: string) => api.delete(`/admin/org-units/${id}`), onSuccess: () => { setConfirmDel(null); invalidate() } })

  const needle = search.trim().toLowerCase()
  const flat: { u: OrgUnit; depth: number }[] = []
  flatten(units, null, 0, flat)
  const rows = needle
    ? units.filter(u => u.name.toLowerCase().includes(needle) || (u.description ?? '').toLowerCase().includes(needle)).map(u => ({ u, depth: 0 }))
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
         { type: 'action' as const, label: t('admin.ou_delete'), danger: true, icon: <Trash2 size={15} />, onClick: () => setConfirmDel(u.id) }]
      : []),
  ]

  return (
    <div>
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="flex items-baseline gap-2 px-5 py-4 border-b border-border">
          <h2 className="text-base font-medium text-text-primary">{t('admin.ou_manage_title')}</h2>
          <span className="text-xs text-text-tertiary">| {t('admin.ou_count', { count: units.length })}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-text-tertiary border-b border-border">
                <th className="px-5 py-2.5 font-medium">{t('admin.ou_col_name')}</th>
                <th className="px-5 py-2.5 font-medium">{t('admin.ou_col_desc')}</th>
                <th className="w-32" />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={3} className="px-5 py-8 text-center text-xs text-text-tertiary">{t('admin.ou_no_results')}</td></tr>
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

        {confirmDel && (
          <div className="flex items-center gap-3 px-5 py-3 border-t border-border text-xs bg-danger/5">
            <span className="text-text-secondary">{t('admin.ou_delete_confirm')}</span>
            <button type="button" onClick={() => remove.mutate(confirmDel)} className="text-danger font-medium">{t('admin.ou_delete')}</button>
            <button type="button" onClick={() => setConfirmDel(null)} className="text-text-tertiary">{t('admin.ou_cancel')}</button>
          </div>
        )}
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

  const parentName = units.find(u => u.id === parent)?.name ?? '—'
  const isRootEdit = mode === 'edit' && unit?.parent_id === null

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin-org-units'] })
  const save = useMutation({
    mutationFn: () => mode === 'create'
      ? api.post('/admin/org-units', { name: name.trim(), description: desc.trim() || null, parent_id: parent })
      : api.patch(`/admin/org-units/${unit!.id}`, { name: name.trim(), description: desc.trim() || null }),
    onSuccess: () => { invalidate(); onClose() },
  })

  return (
    <FloatingWindow title={mode === 'create' ? t('admin.ou_create_title') : t('admin.ou_edit_title')} onClose={onClose} defaultWidth={480} backdrop>
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
          <label className="block text-xs text-text-secondary mb-1">{t('admin.ou_field_parent')}{mode === 'create' && ' *'}</label>
          <div className="flex items-center justify-between border-b border-border pb-1">
            <span className="text-xs text-text-primary">{parentName}</span>
            {!isRootEdit && (
              <button type="button" onClick={() => setPickerOpen(true)} className="p-1 text-text-tertiary hover:text-primary" title={t('admin.ou_change_parent')}><Pencil size={15} /></button>
            )}
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-3 px-5 py-3 border-t border-border">
        <button type="button" onClick={onClose} className="text-xs text-text-secondary hover:text-text-primary">{t('admin.ou_cancel')}</button>
        <Button onClick={() => save.mutate()} disabled={!name.trim() || (mode === 'create' && !parent) || save.isPending}>
          {save.isPending ? '…' : (mode === 'create' ? t('admin.ou_create') : t('admin.ou_save'))}
        </Button>
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
