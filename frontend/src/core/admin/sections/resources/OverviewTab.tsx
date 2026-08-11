// The landing screen of the section.
//
// It answers two questions, in that order: what does the instance hold, and is
// the inventory finished. The second one is the reason the screen exists — a
// bare total says the feature was used once, while "three buildings hold nothing
// and eleven resources carry no visible description" says what is left to do,
// which is what an administrator actually arrives with.

import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Building2, CalendarRange, DoorOpen, Sparkles, Users } from 'lucide-react'
import { Button, Callout, Card, Spinner } from '@ui'
import { useResourceOverview } from './api'
import type { ResourcePane } from './panes'

function Stat({ icon, value, label }: { icon: ReactNode; value: number; label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-surface-0 px-4 py-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full
                       bg-primary-light text-primary">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-text-primary" style={{ fontSize: 'var(--kb-text-title)' }}>
          {value}
        </span>
        <span className="block truncate text-text-secondary"
              style={{ fontSize: 'var(--kb-text-meta)' }}>
          {label}
        </span>
      </span>
    </div>
  )
}

export default function OverviewTab({ onGo }: { onGo: (pane: ResourcePane) => void }) {
  const { t } = useTranslation()
  const { data, isLoading, isError, refetch } = useResourceOverview()

  if (isLoading) {
    return <div className="flex justify-center py-10"><Spinner /></div>
  }

  if (isError || !data) {
    return (
      <Callout
        variant="danger"
        title={t('admin.res_load_failed')}
        action={{ label: t('admin.res_retry'), onClick: () => void refetch() }}
        t={t}
      />
    )
  }

  const allGaps: { key: string; count: number; text: string; pane: ResourcePane }[] = [
    {
      key: 'empty_buildings',
      count: data.empty_buildings,
      text: t('admin.res_gap_empty_buildings', { count: data.empty_buildings }),
      pane: 'buildings',
    },
    {
      key: 'undescribed',
      count: data.undescribed,
      text: t('admin.res_gap_undescribed', { count: data.undescribed }),
      pane: 'resources',
    },
    {
      key: 'unused_features',
      count: data.unused_features,
      text: t('admin.res_gap_unused_features', { count: data.unused_features }),
      pane: 'features',
    },
  ]
  const gaps = allGaps.filter(g => g.count > 0)
  const isEmpty = data.buildings === 0 && data.resources === 0 && data.features === 0

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={<Building2 size={17} />}    value={data.buildings}  label={t('admin.res_stat_buildings')} />
        <Stat icon={<CalendarRange size={17} />} value={data.resources} label={t('admin.res_stat_resources')} />
        <Stat icon={<DoorOpen size={17} />}     value={data.rooms}      label={t('admin.res_stat_rooms')} />
        <Stat icon={<Users size={17} />}        value={data.room_seats} label={t('admin.res_stat_seats')} />
      </div>

      {/* Hidden while the inventory is empty. "Every building holds resources,
          every resource is described" is vacuously true of nothing, and on a
          fresh instance it reads as a claim that the work is done — the exact
          opposite of what the first screen has to say. With no rows at all, the
          card below is the whole answer. */}
      {!isEmpty && (
      <Card title={t('admin.res_todo_title')} subtitle={t('admin.res_todo_subtitle')}>
        {gaps.length === 0 ? (
          <p className="text-text-secondary" style={{ fontSize: 'var(--kb-text-body)' }}>
            {t('admin.res_todo_clear')}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {gaps.map(g => (
              <li key={g.key} className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-text-secondary" style={{ fontSize: 'var(--kb-text-body)' }}>
                  {g.text}
                </span>
                <Button variant="ghost" size="sm" onClick={() => onGo(g.pane)}>
                  {t('admin.res_todo_open')}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
      )}

      <Card
        title={t('admin.res_order_title')}
        icon={<Sparkles size={16} />}
        subtitle={t('admin.res_order_subtitle')}
      >
        {/* The order is not decoration: a resource cannot be created without a
            building, and cannot carry a feature that does not exist yet. Saying
            it here is cheaper than three refusals in a row. */}
        <ol className="ml-4 flex list-decimal flex-col gap-1 text-text-secondary"
            style={{ fontSize: 'var(--kb-text-body)' }}>
          <li>{t('admin.res_order_step_buildings')}</li>
          <li>{t('admin.res_order_step_features')}</li>
          <li>{t('admin.res_order_step_resources')}</li>
        </ol>
      </Card>
    </div>
  )
}
