/**
 * The parts of `ServicePicker.kbcontrol` still written in React (the codemod could not convert them; see the
 * TODO comments in the view). Each is rendered by a `<ReactHost>` with the values it reads as props.
 */
import { ChevronDown, ChevronRight } from "lucide-react"
import { Checkbox } from "@ui"
import type { ServicePicker } from './ServicePicker'

export function Part1({ toggleFold, group, open, t }: { toggleFold: ServicePicker['toggleFold']; group: NonNullable<ServicePicker['rows_groups']>[number]['group']; open: NonNullable<ServicePicker['rows_groups']>[number]['open']; t: NonNullable<ServicePicker['tr']> }) {
  return (
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
  )
}

export function Part2({ group, selected, toggle }: { group: NonNullable<ServicePicker['rows_groups']>[number]['group']; selected: NonNullable<ServicePicker['props']['selected']>; toggle: ServicePicker['toggle'] }) {
  return (
    <>{group.items.map(service => (
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
                      ))}</>
  )
}
