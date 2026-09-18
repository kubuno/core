import { useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { CalendarCheck2, Clock, DoorOpen, Gauge, ThumbsUp } from 'lucide-react'
import { Callout, Dropdown, EmptyState, Spinner } from '@ui'
import { BarChart, HBarList, useChartSeries } from '../../DashboardCharts'
import { useRoomStats, errorMessage } from './api'

/**
 * How the meeting rooms were used, over a window.
 *
 * ## Where the figures come from
 *
 * Not from here. The bookings are rows of the calendar's own schema, which the
 * console never reads; the module counts them and answers, the core relays, this
 * screen draws. That is also why the screen can say "these figures need the
 * calendar" rather than break when an optional module is absent — a directory of
 * rooms is useful on an instance that has no agenda installed.
 *
 * ## Why these forms
 *
 * The numbers on top are numbers, not charts: a total has no shape to read, and
 * a four-bar chart of unrelated measures would invite a comparison that means
 * nothing. Hours per day and per hour of the day are magnitudes over ordered
 * buckets — bars. Rooms are a ranking, and a room's name has to stay readable,
 * so they are horizontal.
 *
 * Every chart carries a SINGLE series, so none carries a legend: the heading
 * names the measure. The one colour is the design system's first categorical
 * step — the hue that clears 3:1 against the light surface, where three of the
 * eight do not.
 */

/** Windows the period control offers, and the days each one reaches back. */
const PERIODS: Record<string, number> = {
  last_7_days:  7,
  last_30_days: 30,
  last_90_days: 90,
}

/** The working day the rate is measured against, mirrored from the module that
 *  computes it — stated on screen so the denominator is never a mystery. */
const WORKDAY_HOURS = 8

function StatCard({
  label, value, icon: Icon, accent,
}: {
  label:   string
  value:   ReactNode
  icon:    typeof Clock
  accent?: ReactNode
}) {
  return (
    <div className="flex flex-col rounded-xl border border-border bg-surface-0 p-4">
      <div className="mb-1.5 flex items-start justify-between gap-2">
        <span className="min-w-0 truncate text-text-secondary" style={{ fontSize: 'var(--kb-text-body)' }}>
          {label}
        </span>
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-2">
          {/* A theme token, never a literal: this card is painted in both themes. */}
          <Icon size={16} style={{ color: 'var(--kb-chart-1)' }} />
        </span>
      </div>
      <p className="font-semibold leading-tight text-text-primary tabular-nums"
         style={{ fontSize: 'var(--kb-text-title)' }}>
        {value}
      </p>
      {accent && (
        <div className="mt-1 text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>{accent}</div>
      )}
    </div>
  )
}

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-surface-0 p-4">
      <h3 className="mb-3 text-text-primary" style={{ fontSize: 'var(--kb-text-section)' }}>{title}</h3>
      {children}
    </section>
  )
}

export default function RoomStatsTab() {
  const { t, i18n } = useTranslation()
  const series = useChartSeries()
  const [period, setPeriod] = useState('last_30_days')

  const { from, to } = useMemo(() => {
    const end   = new Date()
    const start = new Date(end.getTime() - (PERIODS[period] ?? 30) * 86_400_000)
    return { from: start.toISOString(), to: end.toISOString() }
  }, [period])

  const { data, isLoading, isError, error } = useRoomStats(from, to, true)

  const periodOptions = useMemo(
    () => Object.keys(PERIODS).map(id => ({ value: id, label: t(`admin.sec_period_${id}`) })),
    [t],
  )

  const nf    = useMemo(() => new Intl.NumberFormat(i18n.language), [i18n.language])
  const nf1   = useMemo(
    () => new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 1 }),
    [i18n.language],
  )
  const dayFm = useMemo(
    () => new Intl.DateTimeFormat(i18n.language, { day: '2-digit', month: '2-digit' }),
    [i18n.language],
  )
  const hours = (n: number) => t('admin.rs_h', { value: nf1.format(n) })
  const pct   = (n: number | null | undefined) =>
    n === null || n === undefined
      ? '—'
      : new Intl.NumberFormat(i18n.language, { style: 'percent', maximumFractionDigits: 1 }).format(n)

  const perDay = useMemo(
    () => (data?.per_day ?? []).map(d => ({
      // Day and month only: a date axis reaching back three months cannot carry
      // a year on every tick, and the window is named right above it.
      label: dayFm.format(new Date(`${d.date}T00:00:00`)),
      value: Math.round(d.hours * 10) / 10,
    })),
    [data?.per_day, dayFm],
  )

  // Every hour of the working day, including the empty ones. A hollow at midday
  // is itself the finding; a chart built only from the hours that have data
  // would close the gap and hide the lunch hour.
  const perHour = useMemo(
    () => Array.from({ length: 13 }, (_, i) => i + 7).map(h => ({
      label: t('admin.rs_hour_tick', { hour: String(h).padStart(2, '0') }),
      value: Math.round(((data?.per_hour ?? []).find(x => x.hour === h)?.hours ?? 0) * 10) / 10,
    })),
    [data?.per_hour, t],
  )

  const rooms      = data?.per_room ?? []
  const topHours   = Math.max(...rooms.map(r => r.hours), 1)
  const answered   = (data?.bookings ?? 0) + (data?.declined ?? 0)
  // Rooms answer every invitation, so "accepted out of answered" is a real rate
  // — but only once something was asked of them.
  const acceptance = answered > 0 ? (data?.bookings ?? 0) / answered : null

  if (isLoading) {
    return <div className="flex justify-center py-16"><Spinner /></div>
  }

  // The module holding the bookings is not there. That is an installation
  // choice, not a failure, and the screen names it instead of showing zeros —
  // a zero here would read as "no room was booked".
  if (data && !data.available) {
    const absent = data.reason === 'module_absent'
    return (
      <EmptyState
        t={t}
        variant={absent ? 'unavailable' : 'error'}
        icon={<CalendarCheck2 size={26} />}
        title={t(absent ? 'admin.rs_no_module' : 'admin.rs_unreachable')}
        description={t(absent ? 'admin.rs_no_module_desc' : 'admin.rs_unreachable_desc')}
      />
    )
  }

  return (
    <div className="flex min-w-0 flex-col gap-4">
      {/* ── The window, and what it is measured against ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Dropdown value={period} onChange={setPeriod} options={periodOptions} width={200} focusable />
        {data && (
          <span className="text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
            {t('admin.rs_scope', { count: data.rooms, hours: WORKDAY_HOURS })}
          </span>
        )}
      </div>

      {isError && (
        <Callout variant="danger" t={t}>
          {errorMessage(error, t('admin.rs_load_failed'))}
        </Callout>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label={t('admin.rs_bookings')} icon={CalendarCheck2}
          value={nf.format(data?.bookings ?? 0)}
          accent={t('admin.rs_bookings_sub', { count: data?.declined ?? 0 })}
        />
        <StatCard
          label={t('admin.rs_booked_hours')} icon={Clock}
          value={hours(data?.booked_hours ?? 0)}
        />
        <StatCard
          label={t('admin.rs_rate')} icon={Gauge}
          value={pct(data?.booking_rate)}
          accent={t('admin.rs_rate_sub', { hours: nf.format(Math.round(data?.available_hours ?? 0)) })}
        />
        <StatCard
          label={t('admin.rs_acceptance')} icon={ThumbsUp}
          value={pct(acceptance)}
          accent={t('admin.rs_acceptance_sub')}
        />
      </div>

      {answered === 0 ? (
        <EmptyState
          t={t}
          variant="first-use"
          icon={<DoorOpen size={26} />}
          title={t('admin.rs_empty')}
          description={t('admin.rs_empty_desc')}
        />
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title={t('admin.rs_per_day')}>
              <BarChart data={perDay} color={series[0]} unit="h" xLabels />
            </ChartCard>
            <ChartCard title={t('admin.rs_per_hour')}>
              <BarChart data={perHour} color={series[0]} unit="h" xLabels />
            </ChartCard>
          </div>

          <ChartCard title={t('admin.rs_per_room')}>
            {rooms.length === 0 ? (
              <p className="text-text-tertiary" style={{ fontSize: 'var(--kb-text-body)' }}>
                {t('admin.rs_per_room_empty')}
              </p>
            ) : (
              <HBarList
                color={series[0]}
                // The bar is a share of the busiest room, not of a limit: a
                // full bar is the leader, not a room in trouble.
                warnFull={false}
                items={rooms.map(r => ({
                  label: r.name,
                  value: r.hours,
                  max:   topHours,
                  // The figure is written out beside the bar: a bar answers
                  // "which room is busiest", never "by how much".
                  sub:   t('admin.rs_room_sub', {
                    hours:    nf1.format(r.hours),
                    count:    r.bookings,
                  }),
                }))}
              />
            )}
          </ChartCard>

          {/* ── Rooms handed back ──
              One figure, and only one, because it is the only one the stamp on a
              released booking can prove. Hours re-booked afterwards, and hours a
              room kept because an exemption applied, would each need the reason
              recorded at the moment of the decision — they are not shown rather
              than estimated. */}
          <section className="rounded-xl border border-border bg-surface-0 p-4">
            <h3 className="text-text-primary" style={{ fontSize: 'var(--kb-text-section)' }}>
              {t('admin.rs_release')}
            </h3>
            <p className="mt-1 text-text-secondary" style={{ fontSize: 'var(--kb-text-body)' }}>
              {t('admin.rs_release_desc')}
            </p>
            <p className="mt-3 font-semibold text-text-primary tabular-nums"
               style={{ fontSize: 'var(--kb-text-title)' }}>
              {hours(data?.released_hours ?? 0)}
            </p>
            <p className="text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
              {t('admin.rs_released')}
            </p>
          </section>
        </>
      )}
    </div>
  )
}
