import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Button, Checkbox } from '@ui'
import type { MyExportService } from './api'

/**
 * Step 1 — what to include.
 *
 * ## The list is what the modules said, and nothing else
 *
 * Every entry comes from `GET /internal/export/describe`, asked of the modules
 * that are actually running. A module that is not installed, or has not
 * implemented the contract, is simply absent — there is no list of module names
 * anywhere in this file, and adding a module to the instance is the only thing
 * needed for it to appear here.
 *
 * ## Sub-categories are the contract's own shape
 *
 * A module that holds genuinely separate bodies of data declares several
 * services. That IS the "refine what this service includes" control: the module
 * row carries the whole group, and unfolding it exposes the parts. Nothing is
 * invented on this side — a module declaring one service has nothing to unfold.
 */
export interface ServicePickerProps {
  services: MyExportService[]
  /** Ids currently kept. Required services are always in it. */
  selected: Set<string>
  onChange: (next: Set<string>) => void
}

interface Group {
  moduleId: string
  /** The label shown for the group: the module's single service, or its id. */
  label:    string
  items:    MyExportService[]
}

/**
 * Display name of a module that declared several services.
 *
 * The module id, capitalised. The export contract carries no display name — a
 * module names its *services*, not itself — and inventing a mapping here would
 * be a hard-coded list of modules in the core, which is exactly what the
 * contract exists to avoid. Ids are single lowercase words in this product, so
 * the result reads as a name.
 */
function moduleName(moduleId: string): string {
  return moduleId.charAt(0).toUpperCase() + moduleId.slice(1)
}

/** One group per module, in the order the server sent them (core first). */
function groupByModule(services: MyExportService[]): Group[] {
  const out: Group[] = []
  for (const service of services) {
    const existing = out.find(g => g.moduleId === service.module_id)
    if (existing) existing.items.push(service)
    else out.push({ moduleId: service.module_id, label: service.label, items: [service] })
  }
  return out
}

export default function ServicePicker({ services, selected, onChange }: ServicePickerProps) {
  const { t } = useTranslation()
  const groups = useMemo(() => groupByModule(services), [services])
  const [unfolded, setUnfolded] = useState<Set<string>>(new Set())

  // The account sheet is offered and never unticked: every other file in the
  // archive refers to the person it describes.
  const required = useMemo(
    () => services.filter(s => s.required).map(s => s.id),
    [services],
  )

  const setAll = (keepAll: boolean) => {
    onChange(new Set(keepAll ? services.map(s => s.id) : required))
  }

  const toggle = (ids: string[], keep: boolean) => {
    const next = new Set(selected)
    for (const id of ids) {
      if (keep) next.add(id)
      else if (!required.includes(id)) next.delete(id)
    }
    onChange(next)
  }

  const toggleFold = (moduleId: string) => {
    setUnfolded(prev => {
      const next = new Set(prev)
      if (next.has(moduleId)) next.delete(moduleId)
      else next.add(moduleId)
      return next
    })
  }

  return (
    <div>
      <p className="text-text-secondary" style={{ fontSize: 'var(--kb-text-body)' }}>
        {t('settings.mde_pick_intro', {
          defaultValue:
            'Tout ce que vous utilisez est sélectionné. Décochez ce que vous ne voulez pas emporter.',
        })}
      </p>

      {/* Bulk actions, above the list: the two of them are the whole reason a
          long list of services stays usable. */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button variant="text" size="sm" onClick={() => setAll(true)}>
          {t('settings.mde_select_all', { defaultValue: 'Tout sélectionner' })}
        </Button>
        <Button variant="text" size="sm" onClick={() => setAll(false)}>
          {t('settings.mde_select_none', { defaultValue: 'Tout désélectionner' })}
        </Button>
      </div>

      <div className="mt-3 rounded-lg border border-border divide-y divide-border overflow-hidden">
        {groups.map(group => {
          const ids = group.items.map(s => s.id)
          const kept = ids.filter(id => selected.has(id))
          const all  = kept.length === ids.length
          const some = kept.length > 0 && !all
          const splittable = group.items.length > 1
          const open = unfolded.has(group.moduleId)
          const head = group.items[0]

          return (
            <div key={group.moduleId} className="bg-surface-0">
              <div className="flex items-start gap-3 px-4 py-3">
                <Checkbox
                  checked={all}
                  indeterminate={some}
                  disabled={group.items.every(s => s.required)}
                  onChange={next => toggle(ids, next)}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-text-primary font-medium"
                     style={{ fontSize: 'var(--kb-text-body)' }}>
                    {splittable ? moduleName(group.moduleId) : head.label}
                  </p>
                  {!splittable && (head.description || head.format) && (
                    <p className="mt-0.5 text-text-secondary"
                       style={{ fontSize: 'var(--kb-text-meta)' }}>
                      {head.description}
                      {head.description && head.format ? ' · ' : ''}
                      {head.format}
                    </p>
                  )}
                  {splittable && (
                    <p className="mt-0.5 text-text-secondary"
                       style={{ fontSize: 'var(--kb-text-meta)' }}>
                      {/* Always at least two here — the group only exists when
                          the module declared several services — so no plural
                          form is needed. */}
                      {t('settings.mde_parts', {
                        defaultValue: '{{n}} catégories',
                        n: group.items.length,
                      })}
                    </p>
                  )}
                </div>
                {splittable && (
                  <button
                    type="button"
                    onClick={() => toggleFold(group.moduleId)}
                    aria-expanded={open}
                    className="shrink-0 flex items-center gap-1 rounded-md px-2 py-1 text-text-secondary hover:bg-surface-2 transition-colors"
                    style={{ fontSize: 'var(--kb-text-meta)' }}
                  >
                    {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    {t('settings.mde_refine', { defaultValue: 'Affiner' })}
                  </button>
                )}
              </div>

              {splittable && open && (
                <div className="pb-3 pl-12 pr-4 space-y-2">
                  {group.items.map(service => (
                    <Checkbox
                      key={service.id}
                      checked={selected.has(service.id)}
                      disabled={service.required}
                      onChange={next => toggle([service.id], next)}
                      label={service.label}
                      description={
                        [service.description, service.format].filter(Boolean).join(' · ') || undefined
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
