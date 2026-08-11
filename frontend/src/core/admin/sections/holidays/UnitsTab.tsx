// What one organisational unit observes, and what it does not.
//
// A subsidiary in Casablanca does not take the 14th of July, and a Alsatian site
// takes two days the rest of France does not. Both are answered here, as an
// *overlay*: the unit stores its difference from what it inherits, so correcting
// the instance referential still reaches it. Nothing on this screen copies a day
// into a unit — a materialised inheritance is a link that breaks silently, which
// is the same reason `core.setting_values` has no row for an inherited value.

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Building2, Plus, X } from 'lucide-react'
import { Button, Callout, Dropdown, EmptyState, Toggle } from '@ui'
import { api } from '../../../api/client'
import OrgUnitPicker from '../../OrgUnitPicker'
import FieldLabel from '../resources/FieldLabel'
import { errorMessage, useHolidayCalendars, useSetUnitPref, useUnitOverlay } from './api'

export default function UnitsTab({ canManage }: { canManage: boolean }) {
  const { t } = useTranslation()

  const [unitId, setUnitId]   = useState<string | null>(null)
  const [picking, setPicking] = useState(false)
  const [adding, setAdding]     = useState('')
  const [error, setError]       = useState<string | null>(null)

  // The same cache entry the picker fills, so selecting a unit names it without
  // a second request.
  const { data: units } = useQuery({
    queryKey: ['admin-org-units'],
    queryFn: async () => (await api.get<{ org_units: { id: string; name: string }[] }>(
      '/admin/org-units')).data.org_units,
    staleTime: 30_000,
  })
  const unitName = units?.find(u => u.id === unitId)?.name ?? ''

  const { data: calendars } = useHolidayCalendars('', true)
  const { data: prefs, isLoading } = useUnitOverlay(unitId)
  const setPref = useSetUnitPref(unitId ?? '')

  const fail = (e: unknown) => setError(errorMessage(e, t('admin.hol_save_failed')))

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <Callout variant="info" t={t}>{t('admin.hol_units_intro')}</Callout>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <FieldLabel>{t('admin.hol_units_pick')}</FieldLabel>
          <Button variant="secondary" onClick={() => setPicking(true)}>
            <Building2 size={16} /> {unitName || t('admin.hol_units_none')}
          </Button>
        </div>

        {unitId && canManage && (
          <div className="flex flex-col gap-1">
            <FieldLabel>{t('admin.hol_units_add')}</FieldLabel>
            <div className="flex items-center gap-2">
              <Dropdown
                value={adding}
                placeholder={t('admin.hol_units_pick_calendar')}
                options={(calendars ?? []).map(c => ({ value: c.id, label: `${c.display_name} (${c.code})` }))}
                onChange={setAdding}
                width={280}
                height={36}
                focusable
              />
              <Button
                variant="secondary"
                disabled={adding === '' || setPref.isPending}
                onClick={() => {
                  setError(null)
                  // Added as "observed here": the useful default, since a unit
                  // that is being given a second territory wants to see it.
                  setPref.mutate({ calendar_id: adding, enabled: true }, {
                    onSuccess: () => setAdding(''),
                    onError: fail,
                  })
                }}
              >
                <Plus size={16} /> {t('admin.hol_units_add_action')}
              </Button>
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="text-danger" role="alert" style={{ fontSize: 'var(--kb-text-body)' }}>{error}</p>
      )}

      {!unitId ? (
        <EmptyState
          icon={<Building2 size={26} />}
          title={t('admin.hol_units_empty_title')}
          description={t('admin.hol_units_empty_desc')}
          t={t}
        />
      ) : isLoading ? (
        <p className="text-text-secondary" style={{ fontSize: 'var(--kb-text-body)' }}>{t('admin.hol_loading')}</p>
      ) : (prefs ?? []).length === 0 ? (
        <EmptyState
          icon={<Building2 size={26} />}
          title={t('admin.hol_units_no_pref_title')}
          description={t('admin.hol_units_no_pref_desc', { name: unitName })}
          t={t}
        />
      ) : (
        <ul className="flex flex-col divide-y divide-border rounded border border-border">
          {(prefs ?? []).map(pref => (
            <li key={pref.id} className="flex flex-wrap items-center gap-3 px-3 py-2">
              <span className="min-w-0 flex-1 text-text-primary" style={{ fontSize: 'var(--kb-text-body)' }}>
                {pref.calendar_id
                  ? `${pref.calendar_name} (${pref.calendar_code})`
                  : `${pref.holiday_name} — ${pref.holiday_calendar_code}`}
              </span>
              <Toggle
                checked={pref.enabled}
                disabled={!canManage || setPref.isPending}
                aria-label={t('admin.hol_col_observed')}
                onChange={e => {
                  setError(null)
                  setPref.mutate({
                    calendar_id: pref.calendar_id ?? undefined,
                    holiday_id:  pref.holiday_id ?? undefined,
                    enabled: e.target.checked,
                  }, { onError: fail })
                }}
              />
              {canManage && (
                <Button
                  variant="ghost"
                  aria-label={t('admin.hol_units_clear')}
                  title={t('admin.hol_units_clear')}
                  onClick={() => {
                    setError(null)
                    // `null` deletes the row — the unit goes back to inheriting,
                    // rather than storing what it currently inherits.
                    setPref.mutate({
                      calendar_id: pref.calendar_id ?? undefined,
                      holiday_id:  pref.holiday_id ?? undefined,
                      enabled: null,
                    }, { onError: fail })
                  }}
                >
                  <X size={16} />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      {picking && (
        <OrgUnitPicker
          title={t('admin.hol_units_pick')}
          currentId={unitId}
          onSelect={id => { setUnitId(id); setPicking(false) }}
          onClose={() => setPicking(false)}
        />
      )}
    </div>
  )
}
