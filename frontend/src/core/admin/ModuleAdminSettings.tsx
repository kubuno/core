// Instance-wide (admin) settings for a module, rendered INSIDE the admin console.
//
// Admins configure a module's instance settings here — they stay in the admin panel
// and are never navigated into the module's own shell. Driven by the module's
// declarative schema (`GET /modules/:id/config`); only `global` and `overridable`
// scopes are editable here (per-user settings live in the module). Saved through
// PATCH /admin/settings (keys are prefixed with the module id).
import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import { Input, Toggle, Radio } from '@ui'
import { Check, Save } from 'lucide-react'

type Scope = 'global' | 'user' | 'overridable'
type ValueType = 'bool' | 'int' | 'string' | 'enum'
type EnumOption = string | number | boolean | { value: unknown; label?: string }

interface SettingItem {
  key: string; scope: Scope; type: ValueType; values: EnumOption[] | null
  label: string | null; description: string | null; category: string
  default: unknown; global: unknown; user: unknown; effective: unknown
  editable_by_user: boolean
}

function normOptions(values: EnumOption[] | null): { value: unknown; label: string }[] {
  return (values ?? []).map(v =>
    v !== null && typeof v === 'object'
      ? { value: (v as { value: unknown }).value, label: String((v as { label?: string }).label ?? (v as { value: unknown }).value) }
      : { value: v, label: String(v) },
  )
}

function Control({ item, value, onChange }: { item: SettingItem; value: unknown; onChange: (v: unknown) => void }) {
  if (item.type === 'bool') return <Toggle checked={!!value} onChange={() => onChange(!value)} />
  if (item.type === 'enum') {
    return (
      <div className="flex flex-col items-start gap-2">
        {normOptions(item.values).map(opt => (
          <Radio key={String(opt.value)} checked={String(value) === String(opt.value)}
            onChange={() => onChange(opt.value)} label={opt.label} />
        ))}
      </div>
    )
  }
  return (
    <Input
      type={item.type === 'int' ? 'number' : 'text'}
      value={value === null || value === undefined ? '' : String(value)}
      onChange={e => onChange(item.type === 'int' ? Number(e.target.value) : e.target.value)}
      className="max-w-xs"
    />
  )
}

export default function ModuleAdminSettings({ moduleId }: { moduleId: string }) {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['module-config', moduleId],
    queryFn:  () => api.get<{ settings: SettingItem[] }>(`/modules/${moduleId}/config`).then(r => r.data),
  })

  const [edits, setEdits]   = useState<Record<string, unknown>>({})
  const [savedFlag, setSaved] = useState(false)

  // Admin edits instance-level settings only (per-user settings live in the module).
  const items = useMemo(
    () => (data?.settings ?? []).filter(s => s.scope === 'global' || s.scope === 'overridable'),
    [data],
  )

  const save = useMutation({
    mutationFn: async (changes: Record<string, unknown>) => {
      const payload: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(changes)) payload[`${moduleId}.${k}`] = v
      await api.patch('/admin/settings', payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['module-config', moduleId] })
      setEdits({}); setSaved(true); setTimeout(() => setSaved(false), 2500)
    },
  })

  if (isLoading) return <p className="text-sm text-text-tertiary py-6">Chargement…</p>
  if (items.length === 0) {
    return <p className="text-sm text-text-tertiary py-6">Ce module n'expose aucun réglage d'instance.</p>
  }

  const shown = (s: SettingItem) => (s.key in edits ? edits[s.key] : (s.global ?? s.default))
  const isDirty = Object.keys(edits).length > 0

  return (
    <div>
      <p className="text-xs text-text-tertiary mb-4">Réglages appliqués à toute l'instance (administrateurs).</p>
      <div className="bg-white rounded-xl border border-border px-5">
        {items.map(s => (
          <div key={s.key} className="flex items-start gap-8 py-4 border-b border-border last:border-0">
            <div className="w-60 flex-shrink-0">
              <p className="text-sm text-text-primary">{s.label ?? s.key}</p>
              {s.description && <p className="text-xs text-text-tertiary mt-0.5 leading-relaxed">{s.description}</p>}
              {s.scope === 'overridable' && (
                <p className="text-[11px] text-primary mt-1">Surchargeable par l'utilisateur</p>
              )}
            </div>
            <div className="flex-1">
              <Control item={s} value={shown(s)} onChange={v => setEdits(e => ({ ...e, [s.key]: v }))} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-end">
        <button
          onClick={() => save.mutate(edits)}
          disabled={!isDirty || save.isPending}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium disabled:opacity-50"
        >
          {savedFlag ? <><Check size={14} />Enregistré</> : <><Save size={15} />Enregistrer</>}
        </button>
      </div>
    </div>
  )
}
