// One territory's days.
//
// The table answers three questions at once, which is why it is a table and not
// a list of cards: what the day is called, *when* it falls (the rule, in words,
// and the date it produces in the chosen year), and where it comes from — this
// calendar, or the country it inherits from. An inherited row is read-only here
// on purpose: editing it would silently rewrite the country for everybody, and
// the region's real verb is "ne l'observe pas", which is the exclusion switch.

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, CalendarDays, Plus, RotateCcw } from 'lucide-react'
import {
  Badge, Button, Callout, DataTable, EmptyState, NumberInput, Toggle,
  type DataTableColumn, type DataTableRowAction,
} from '@ui'
import ConfirmDialog from '@ui/ConfirmDialog'
import { useConfirm } from '../../../hooks/useConfirm'
import HolidayDialog from './HolidayDialog'
import { formatDate, observanceText, ruleText } from './ruleText'
import {
  errorMessage, useCalendarDetail, useDeleteHoliday, useResetHoliday,
  useSetExclusions, useSetHolidayEnabled, type Holiday,
} from './api'

export default function CalendarDetail({
  calendarId, canManage, onBack, onOpenCalendar,
}: {
  calendarId: string
  canManage: boolean
  onBack: () => void
  onOpenCalendar: (id: string) => void
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language || 'fr'
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm()

  const [year, setYear]       = useState(new Date().getFullYear())
  const [editing, setEditing] = useState<Holiday | 'new' | null>(null)
  const [error, setError]     = useState<string | null>(null)

  const { data, isLoading, isError, refetch } = useCalendarDetail(calendarId, year)
  const setEnabled    = useSetHolidayEnabled()
  const remove        = useDeleteHoliday()
  const reset         = useResetHoliday()
  const setExclusions = useSetExclusions(calendarId)

  const fail = (e: unknown) => setError(errorMessage(e, t('admin.hol_save_failed')))

  /** Add or drop one key from the exclusion set, which is always written whole. */
  const toggleExclusion = (key: string, excluded: boolean) => {
    const current = data?.exclusions ?? []
    const next = excluded ? [...current, key] : current.filter(k => k !== key)
    setError(null)
    setExclusions.mutate(next, { onError: fail })
  }

  const columns: DataTableColumn<Holiday>[] = [
    {
      id: 'name',
      header: t('admin.hol_col_day'),
      primary: true,
      minWidth: 220,
      sortValue: r => r.display_name.toLowerCase(),
      cell: r => (
        <span className="flex min-w-0 flex-col">
          <span className={`truncate ${r.enabled && !r.excluded ? 'text-text-primary' : 'text-text-tertiary line-through'}`}>
            {r.display_name}
          </span>
          <span className="flex flex-wrap items-center gap-1">
            {r.inherited && (
              <Badge variant="neutral">{t('admin.hol_badge_inherited')}</Badge>
            )}
            {r.is_overridden && <Badge variant="primary">{t('admin.hol_badge_corrected')}</Badge>}
            {!r.is_builtin && <Badge variant="neutral">{t('admin.hol_badge_custom')}</Badge>}
            {/* A row the newest dataset dropped, kept because it was edited.
                Naming it is the whole point of the flag. */}
            {r.is_orphan && <Badge variant="warning">{t('admin.hol_badge_orphan')}</Badge>}
          </span>
        </span>
      ),
    },
    {
      id: 'rule',
      header: t('admin.hol_col_rule'),
      minWidth: 220,
      sortValue: r => r.kind,
      cell: r => (
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-text-secondary">{ruleText(t, locale, r.kind, r.rule)}</span>
          {r.observance !== 'none' && (
            <span className="truncate text-text-tertiary" style={{ fontSize: 'var(--kb-text-small)' }}>
              {observanceText(t, r.observance)}
            </span>
          )}
        </span>
      ),
    },
    {
      id: 'dates',
      header: t('admin.hol_col_dates', { year }),
      minWidth: 220,
      sortValue: r => r.dates[0]?.date ?? null,
      cell: r => (
        r.dates.length === 0
          // Not an error: a rule bounded by its years, or a date list that has
          // run out, legitimately produces nothing this year — and saying so is
          // more useful than an empty cell.
          ? <span className="text-text-tertiary">{t('admin.hol_no_date_this_year')}</span>
          : (
            <span className="flex flex-col">
              {r.dates.slice(0, 3).map(d => (
                <span key={d.date} className="text-text-primary">
                  {formatDate(locale, d.date)}
                  {d.observed_from && (
                    <span className="text-text-secondary" style={{ fontSize: 'var(--kb-text-small)' }}>
                      {' '}{t('admin.hol_preview_moved', { from: formatDate(locale, d.observed_from) })}
                    </span>
                  )}
                </span>
              ))}
              {r.dates.length > 3 && (
                <span className="text-text-tertiary" style={{ fontSize: 'var(--kb-text-small)' }}>
                  {t('admin.hol_more_dates', { count: r.dates.length - 3 })}
                </span>
              )}
            </span>
          )
      ),
    },
    {
      id: 'category',
      header: t('admin.hol_col_category'),
      sortValue: r => r.category,
      cell: r => <span className="text-text-secondary">{t(`admin.hol_cat_${r.category}`)}</span>,
    },
    {
      id: 'enabled',
      header: t('admin.hol_col_observed'),
      align: 'right',
      sortValue: r => (r.enabled && !r.excluded ? 1 : 0),
      cell: r => (
        <Toggle
          checked={r.inherited ? !r.excluded : r.enabled}
          disabled={!canManage || setEnabled.isPending || setExclusions.isPending}
          aria-label={t('admin.hol_col_observed')}
          onChange={e => {
            setError(null)
            // The same switch, two different writes: a day of this calendar is
            // disabled, an inherited one is excluded. One control because the
            // question the operator is answering is identical.
            if (r.inherited) toggleExclusion(r.key, !e.target.checked)
            else setEnabled.mutate({ id: r.id, enabled: e.target.checked }, { onError: fail })
          }}
        />
      ),
    },
  ]

  const rowActions: DataTableRowAction<Holiday>[] = canManage
    ? [
        {
          id: 'edit',
          label: t('admin.hol_action_edit'),
          hidden: r => r.inherited,
          onClick: r => setEditing(r),
        },
        {
          id: 'reset',
          label: t('admin.hol_action_reset'),
          icon: <RotateCcw size={14} />,
          // Only a shipped row that was edited has an original to go back to.
          hidden: r => !r.is_overridden || r.inherited,
          onClick: r => {
            setError(null)
            reset.mutate(r.id, { onError: fail })
          },
        },
        {
          id: 'delete',
          label: t('admin.hol_action_delete'),
          danger: true,
          hidden: r => r.is_builtin || r.inherited,
          onClick: async r => {
            const ok = await confirm({
              title: t('admin.hol_delete_day_title'),
              message: t('admin.hol_delete_day_message', { name: r.display_name }),
              confirmLabel: t('admin.hol_action_delete'),
              variant: 'danger',
            })
            if (!ok) return
            setError(null)
            remove.mutate(r.id, { onError: fail })
          },
        },
      ]
    : []

  const calendar = data?.calendar
  const coverage = calendar?.coverage_from && calendar?.coverage_to
    ? t('admin.hol_coverage', { from: calendar.coverage_from, to: calendar.coverage_to })
    : null

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft size={16} /> {t('admin.hol_back_to_list')}
        </Button>
        {data?.parent && (
          <Button variant="ghost" onClick={() => onOpenCalendar(data.parent!.id)}>
            {t('admin.hol_open_parent', { name: data.parent.name })}
          </Button>
        )}
      </div>

      <div className="min-w-0">
        <h2 className="min-w-0 text-text-primary" style={{ fontSize: 'var(--kb-text-section)' }}>
          {data?.display_name ?? '…'}
          <span className="ms-2 text-text-tertiary" style={{ fontSize: 'var(--kb-text-small)' }}>
            {calendar?.code}
          </span>
        </h2>
        {data?.parent && (
          <p className="mt-1 text-text-secondary" style={{ fontSize: 'var(--kb-text-body)' }}>
            {t('admin.hol_inherits_from', { name: data.parent.name })}
          </p>
        )}
      </div>

      {coverage && <Callout variant="info" t={t}>{coverage}</Callout>}

      <div className="flex flex-wrap items-end gap-3">
        <NumberInput
          label={t('admin.hol_preview_year')}
          value={year}
          min={1970}
          max={2200}
          onChange={setYear}
          className="w-32"
        />
        <div className="ms-auto">
          {canManage && (
            <Button variant="secondary" onClick={() => setEditing('new')}>
              <Plus size={16} /> {t('admin.hol_new_day')}
            </Button>
          )}
        </div>
      </div>

      {error && (
        <p className="text-danger" role="alert" style={{ fontSize: 'var(--kb-text-body)' }}>{error}</p>
      )}

      <DataTable<Holiday>
        t={t}
        rows={data?.holidays ?? []}
        columns={columns}
        rowKey={r => r.id}
        loading={isLoading}
        rowActions={rowActions}
        error={isError ? t('admin.hol_load_failed') : undefined}
        onRetry={() => void refetch()}
        pageSize={0}
        emptyState={
          <EmptyState
            icon={<CalendarDays size={26} />}
            title={t('admin.hol_no_days_title')}
            description={t('admin.hol_no_days_desc')}
            t={t}
          />
        }
      />

      {editing && (
        <HolidayDialog
          calendarId={calendarId}
          holiday={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}

      {confirmState && (
        <ConfirmDialog {...confirmState} onConfirm={handleConfirm} onCancel={handleCancel} />
      )}
    </div>
  )
}
