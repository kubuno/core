import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import { ChevronRight, Plus } from 'lucide-react'
import { Input } from '@ui'
import { FloatingWindow } from '@ui/FloatingWindow'
import type { OrgUnit } from '../types'

const ouChildren = (units: OrgUnit[], parentId: string | null) => units.filter(u => u.parent_id === parentId)

// Floating tree picker to select an organizational unit, with inline "add
// sub-unit". Shared by the role assignment flow and the OU manager.
export default function OrgUnitPicker({
  title, currentId, excludeId, onSelect, onClose,
}: {
  title: string
  currentId: string | null
  excludeId?: string          // hide this subtree (e.g. when moving a unit into a parent)
  onSelect: (id: string) => void
  onClose: () => void
}) {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { data } = useQuery({
    queryKey: ['admin-org-units'],
    queryFn: () => api.get<{ org_units: OrgUnit[] }>('/admin/org-units').then(r => r.data.org_units),
    staleTime: 30_000,
  })
  const units = data ?? []
  const root  = units.find(u => u.parent_id === null)
  const [sel, setSel]           = useState<string | null>(currentId ?? null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [addUnder, setAddUnder] = useState<string | null>(null)
  const [name, setName]         = useState('')

  useEffect(() => { if (root) { setExpanded(s => new Set(s).add(root.id)); setSel(p => p ?? root.id) } }, [root])

  const create = useMutation({
    mutationFn: (p: { name: string; parent_id: string }) => api.post<{ org_unit: OrgUnit }>('/admin/org-units', p).then(r => r.data.org_unit),
    onSuccess: (u) => { setAddUnder(null); setName(''); if (u.parent_id) setExpanded(s => new Set(s).add(u.parent_id!)); setSel(u.id); qc.invalidateQueries({ queryKey: ['admin-org-units'] }) },
  })
  const toggle = (id: string) => setExpanded(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })

  const renderNode = (u: OrgUnit, depth: number) => {
    if (u.id === excludeId) return null
    const kids = ouChildren(units, u.id)
    const open = expanded.has(u.id)
    return (
      <div key={u.id}>
        <div className="flex items-center gap-1" style={{ paddingLeft: depth * 18 }}>
          <button type="button" onClick={() => toggle(u.id)} className="w-5 h-5 flex items-center justify-center text-text-tertiary shrink-0">
            {kids.length > 0 && <ChevronRight size={14} className={`transition-transform ${open ? 'rotate-90' : ''}`} />}
          </button>
          <button type="button" onClick={() => setSel(u.id)} className={`flex-1 text-left text-sm px-2 py-1.5 rounded ${sel === u.id ? 'bg-primary-light text-primary' : 'hover:bg-surface-2 text-text-primary'}`}>{u.name}</button>
          <button type="button" onClick={() => { setAddUnder(u.id); setName(''); setExpanded(s => new Set(s).add(u.id)) }} title={t('admin.ou_add')} className="p-1 text-text-tertiary hover:text-primary"><Plus size={14} /></button>
        </div>
        {addUnder === u.id && (
          <div className="flex items-center gap-2 py-1.5" style={{ paddingLeft: depth * 18 + 28 }}>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder={t('admin.ou_name_ph')} />
            <button type="button" onClick={() => name.trim() && create.mutate({ name: name.trim(), parent_id: u.id })} className="text-sm text-primary font-medium">{t('admin.ou_create')}</button>
          </div>
        )}
        {open && kids.map(c => renderNode(c, depth + 1))}
      </div>
    )
  }

  return (
    <FloatingWindow title={title} onClose={onClose} defaultWidth={420} backdrop>
      <div className="p-4 max-h-[55vh] overflow-y-auto">
        {root ? renderNode(root, 0) : <p className="text-xs text-text-tertiary">…</p>}
      </div>
      <div className="flex justify-end gap-4 px-4 py-3 border-t border-border">
        <button type="button" onClick={onClose} className="text-xs text-text-secondary hover:text-text-primary">{t('admin.ou_cancel')}</button>
        <button type="button" disabled={!sel} onClick={() => { if (sel) { onSelect(sel); onClose() } }} className="text-xs font-medium text-primary disabled:opacity-40">{t('admin.ou_done')}</button>
      </div>
    </FloatingWindow>
  )
}
