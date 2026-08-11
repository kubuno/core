// The inventory of territories.
//
// Two hundred and fifty countries and six hundred subdivisions is a directory,
// not a list to read: it opens on countries only, with the search box as the
// real navigation. A subdivision is reached from its country, where the number
// that matters ("+2 par rapport au pays") is finally legible.

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Globe, Plus, Search } from 'lucide-react'
import {
  Button, Checkbox, DataTable, EmptyState, Input, Toggle,
  type DataTableColumn, type DataTableRowAction,
} from '@ui'
import ConfirmDialog from '@ui/ConfirmDialog'
import { useConfirm } from '../../../hooks/useConfirm'
import CalendarDialog from './CalendarDialog'
import {
  errorMessage, useDeleteCalendar, useHolidayCalendars, useSetCalendarEnabled,
  type CalendarSummary,
} from './api'

export default function CalendarsTab({
  canManage, onOpen,
}: {
  canManage: boolean
  onOpen: (id: string) => void
}) {
  const { t } = useTranslation()
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm()

  const [search, setSearch] = useState('')
  const [countriesOnly, setCountriesOnly] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data, isLoading, isError, refetch } = useHolidayCalendars(search, countriesOnly)
  const setEnabled = useSetCalendarEnabled()
  const remove     = useDeleteCalendar()

  const columns: DataTableColumn<CalendarSummary>[] = [
    {
      id: 'name',
      header: t('admin.hol_col_territory'),
      primary: true,
      minWidth: 220,
      sortValue: r => r.display_name.toLowerCase(),
      cell: r => (
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate text-text-primary">{r.display_name}</span>
          {/* The code is what the setting is written with, so it belongs next
              to the name rather than in a column nobody would connect to it. */}
          <span className="shrink-0 text-text-tertiary" style={{ fontSize: 'var(--kb-text-small)' }}>
            {r.code}
          </span>
          {!r.is_builtin && (
            <span className="shrink-0 rounded-full bg-surface-2 px-2 text-text-secondary"
                  style={{ fontSize: 'var(--kb-text-small)' }}>
              {t('admin.hol_badge_custom')}
            </span>
          )}
        </span>
      ),
    },
    {
      id: 'holidays',
      header: t('admin.hol_col_days'),
      align: 'right',
      sortValue: r => r.holiday_count + r.inherited_count,
      cell: r => (
        <span className="text-text-secondary">
          {r.parent_id
            // A subdivision's own count means nothing on its own: "2" is two
            // days only if the reader also knows it inherits eleven.
            ? t('admin.hol_days_with_inherited', { own: r.holiday_count, inherited: r.inherited_count })
            : r.holiday_count}
        </span>
      ),
    },
    {
      id: 'subdivisions',
      header: t('admin.hol_col_regions'),
      align: 'right',
      sortValue: r => r.subdivision_count,
      cell: r => (
        <span className={r.subdivision_count === 0 ? 'text-text-tertiary' : 'text-text-secondary'}>
          {r.subdivision_count || '—'}
        </span>
      ),
    },
    {
      id: 'overridden',
      header: t('admin.hol_col_corrected'),
      align: 'right',
      sortValue: r => r.overridden_count,
      cell: r => (
        <span className={r.overridden_count === 0 ? 'text-text-tertiary' : 'text-primary'}>
          {r.overridden_count || '—'}
        </span>
      ),
    },
    {
      id: 'enabled',
      header: t('admin.hol_col_offered'),
      align: 'right',
      sortValue: r => (r.enabled ? 1 : 0),
      cell: r => (
        <Toggle
          checked={r.enabled}
          disabled={!canManage || setEnabled.isPending}
          aria-label={t('admin.hol_col_offered')}
          onChange={e => {
            setError(null)
            setEnabled.mutate({ id: r.id, enabled: e.target.checked }, {
              onError: e => setError(errorMessage(e, t('admin.hol_save_failed'))),
            })
          }}
        />
      ),
    },
  ]

  const rowActions: DataTableRowAction<CalendarSummary>[] = [
    { id: 'open', label: t('admin.hol_action_open'), onClick: r => onOpen(r.id) },
    ...(canManage
      ? [{
          id: 'delete',
          label: t('admin.hol_action_delete'),
          danger: true,
          // A shipped territory cannot be deleted — the seeder would bring it
          // back — so the action is simply absent rather than offered and refused.
          hidden: (r: CalendarSummary) => r.is_builtin,
          onClick: async (r: CalendarSummary) => {
            const ok = await confirm({
              title: t('admin.hol_delete_calendar_title'),
              message: t('admin.hol_delete_calendar_message', { name: r.display_name }),
              confirmLabel: t('admin.hol_action_delete'),
              variant: 'danger',
            })
            if (!ok) return
            setError(null)
            remove.mutate(r.id, { onError: e => setError(errorMessage(e, t('admin.hol_save_failed'))) })
          },
        } as DataTableRowAction<CalendarSummary>]
      : []),
  ]

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t('admin.hol_search_ph')}
          leftIcon={<Search size={16} />}
          className="w-full sm:w-80"
        />
        <Checkbox
          checked={countriesOnly}
          onChange={setCountriesOnly}
          label={t('admin.hol_countries_only')}
        />
        <div className="ms-auto">
          {canManage && (
            <Button variant="secondary" onClick={() => setCreating(true)}>
              <Plus size={16} /> {t('admin.hol_new_calendar')}
            </Button>
          )}
        </div>
      </div>

      {error && (
        <p className="text-danger" role="alert" style={{ fontSize: 'var(--kb-text-body)' }}>{error}</p>
      )}

      <DataTable<CalendarSummary>
        t={t}
        rows={data ?? []}
        columns={columns}
        rowKey={r => r.id}
        loading={isLoading}
        rowActions={rowActions}
        onRowClick={r => onOpen(r.id)}
        error={isError ? t('admin.hol_load_failed') : undefined}
        onRetry={() => void refetch()}
        filtered={search !== '' || countriesOnly}
        onClearFilters={() => { setSearch(''); setCountriesOnly(false) }}
        emptyState={
          <EmptyState
            icon={<Globe size={26} />}
            title={t('admin.hol_empty_title')}
            description={t('admin.hol_empty_desc')}
            t={t}
          />
        }
      />

      {creating && <CalendarDialog onClose={() => setCreating(false)} onCreated={onOpen} />}

      {confirmState && (
        <ConfirmDialog {...confirmState} onConfirm={handleConfirm} onCancel={handleCancel} />
      )}
    </div>
  )
}
