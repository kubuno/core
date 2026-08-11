// Public holidays and special days.
//
// One navigation entry, three screens: the territories, one territory's days,
// and what an organisational unit adjusts. Three leaves in the menu would
// scatter one subject across the tree, and two of them are meaningless alone —
// a day exists inside a territory, an adjustment is a difference from one.
//
// The active screen lives in the query string, so Back walks the screens the way
// anybody expects and a link to one territory can be pasted into a message.

import { useTranslation } from 'react-i18next'
import { Tabs, type TabDef } from '@ui'
import { usePrivileges } from '../../../authz/usePrivileges'
import type { AdminSectionProps } from '../registry'
import { adminUrlWith } from '../../adminAction'
import { HOLIDAYS_MANAGE } from './privileges'
import CalendarsTab from './CalendarsTab'
import CalendarDetail from './CalendarDetail'
import UnitsTab from './UnitsTab'
import OverviewBar from './OverviewBar'

type Pane = 'calendars' | 'units'

export default function HolidaysSection({ params, navigate }: AdminSectionProps) {
  const { t }   = useTranslation()
  const { can } = usePrivileges()
  const canManage = can(HOLIDAYS_MANAGE)

  const calendarId = params.get('calendar')
  const pane: Pane = params.get('pane') === 'units' ? 'units' : 'calendars'

  // The landing carries no pane segment: `/admin/holidays` and
  // `/admin/holidays/calendars` must not be two addresses for one screen.
  const go = (next: Pane, calendar?: string | null) =>
    navigate(adminUrlWith('holidays', params, {
      pane:     next === 'calendars' ? null : next,
      calendar: calendar ?? null,
    }))

  const tabs: TabDef<Pane>[] = [
    { id: 'calendars', label: t('admin.hol_tab_territories') },
    { id: 'units',     label: t('admin.hol_tab_units') },
  ]

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="min-w-0">
        <h1 className="min-w-0 text-text-primary" style={{ fontSize: 'var(--kb-text-page)' }}>
          {t('admin.nav_holidays')}
        </h1>
        <p className="mt-1 max-w-3xl text-text-secondary" style={{ fontSize: 'var(--kb-text-body)' }}>
          {t('admin.hol_intro')}
        </p>
      </div>

      {/* A territory's page keeps the counters out of the way: the operator is
          inside one country, and instance-wide totals would read as its own. */}
      {!calendarId && <OverviewBar canManage={canManage} />}

      {!calendarId && (
        <Tabs<Pane> t={t} tabs={tabs} value={pane} onChange={next => go(next)} />
      )}

      {calendarId ? (
        <CalendarDetail
          calendarId={calendarId}
          canManage={canManage}
          onBack={() => go('calendars', null)}
          onOpenCalendar={id => go('calendars', id)}
        />
      ) : pane === 'units' ? (
        <UnitsTab canManage={canManage} />
      ) : (
        <CalendarsTab canManage={canManage} onOpen={id => go('calendars', id)} />
      )}
    </div>
  )
}
