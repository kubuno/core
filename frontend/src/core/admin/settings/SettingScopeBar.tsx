import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Building2, ChevronRight, Pencil } from 'lucide-react'
import { api } from '../../api/client'
import OrgUnitPicker from '../OrgUnitPicker'
import type { OrgUnit } from '../../types'
import { orgUnitPath, type ActiveScope } from './scopeTypes'

/**
 * The scope selector that heads every settings page.
 *
 * It sits ABOVE the list rather than inside it because the scope qualifies
 * every control below: an administrator who cannot see, at a glance, whether
 * they are editing the whole instance or one branch will eventually edit the
 * wrong one. The breadcrumb spells out the path from the root so "Marketing" is
 * never ambiguous between two units of the same name.
 */
export default function SettingScopeBar({
  scope, onChange, sticky = true,
}: {
  scope:    ActiveScope
  onChange: (next: ActiveScope) => void
  /**
   * False when the bar heads a settings BLOCK inside a page that is about
   * something else: pinning it to the viewport there would park it over the
   * inventory the operator is scrolling through, far from what it qualifies.
   */
  sticky?:  boolean
}) {
  const { t } = useTranslation()
  const [picking, setPicking] = useState(false)

  const { data: units } = useQuery({
    queryKey: ['admin-org-units'],
    queryFn: () => api.get<{ org_units: OrgUnit[] }>('/admin/org-units').then(r => r.data.org_units),
    staleTime: 30_000,
  })

  const path = orgUnitPath(units ?? [], scope.type === 'org_unit' ? scope.id : null)
  const isInstance = scope.type === 'instance'

  return (
    <>
      <div className={`${sticky ? 'sticky top-0 z-10 ' : ''}-mx-1 mb-5 px-1 py-2 bg-surface-0`}>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-border bg-surface-1 px-3 py-2">
          <Building2 size={16} className="shrink-0 text-text-tertiary" />

          <button
            type="button"
            onClick={() => onChange({ type: 'instance', id: null })}
            className={`rounded px-1.5 py-0.5 text-sm ${
              isInstance ? 'bg-primary-light text-primary' : 'text-text-secondary hover:bg-surface-2'
            }`}
          >
            {t('admin.scope_instance')}
          </button>

          {path.map((u, i) => (
            <span key={u.id} className="flex min-w-0 items-center gap-1">
              <ChevronRight size={14} className="shrink-0 text-text-tertiary" />
              <button
                type="button"
                onClick={() => onChange({ type: 'org_unit', id: u.id })}
                className={`truncate rounded px-1.5 py-0.5 text-sm ${
                  i === path.length - 1
                    ? 'bg-primary-light text-primary'
                    : 'text-text-secondary hover:bg-surface-2'
                }`}
              >
                {u.name}
              </button>
            </span>
          ))}

          <button
            type="button"
            onClick={() => setPicking(true)}
            className="ml-auto flex shrink-0 items-center gap-1.5 rounded px-2 py-1 text-sm text-primary hover:bg-surface-2"
          >
            <Pencil size={14} />
            <span className="hidden sm:inline">{t('admin.scope_change')}</span>
          </button>
        </div>

        <p className="mt-1.5 px-1 text-xs text-text-tertiary">
          {isInstance ? t('admin.scope_hint_instance') : t('admin.scope_hint_unit')}
        </p>
      </div>

      {picking && (
        <OrgUnitPicker
          title={t('admin.scope_pick_title')}
          currentId={scope.type === 'org_unit' ? scope.id : null}
          onSelect={id => onChange({ type: 'org_unit', id })}
          onClose={() => setPicking(false)}
        />
      )}
    </>
  )
}
