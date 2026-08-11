// Buildings and resources — the part of the directory that is not people.
//
// One navigation entry, four screens behind tabs. Four leaves in the menu would
// scatter a single subject across the tree, and three of them would be
// meaningless on their own: a resource cannot exist without a building, and a
// feature is only ever read next to the resources carrying it.
//
// The active screen lives in the query string rather than in component state, so
// that the browser's Back button walks the tabs the way anybody expects, and so
// that the landing screen can send an operator straight to the list that holds
// the thing it just told them about.

import { useTranslation } from 'react-i18next'
import { Tabs, type TabDef } from '@ui'
import { usePrivileges } from '../../../authz/usePrivileges'
import type { AdminSectionProps } from '../registry'
import { RESOURCES_MANAGE } from './privileges'
import { paneFromParams, type ResourcePane } from './panes'
import { adminUrlWith } from '../../adminAction'
import OverviewTab from './OverviewTab'
import BuildingsTab from './BuildingsTab'
import ResourcesTab from './ResourcesTab'
import FeaturesTab from './FeaturesTab'

export default function ResourcesSection({ params, navigate }: AdminSectionProps) {
  const { t }   = useTranslation()
  const { can } = usePrivileges()
  const canManage = can(RESOURCES_MANAGE)

  const pane = paneFromParams(params)
  // The landing carries no pane segment: `/admin/resources` and
  // `/admin/resources/overview` must not be two addresses for one screen.
  const go = (next: ResourcePane) =>
    navigate(adminUrlWith('resources', params, { pane: next === 'overview' ? null : next }))

  const tabs: TabDef<ResourcePane>[] = [
    { id: 'overview',  label: t('admin.res_tab_overview') },
    { id: 'buildings', label: t('admin.res_tab_buildings') },
    { id: 'resources', label: t('admin.res_tab_resources') },
    { id: 'features',  label: t('admin.res_tab_features') },
  ]

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="min-w-0">
        <h1 className="min-w-0 text-text-primary" style={{ fontSize: 'var(--kb-text-page)' }}>
          {t('admin.nav_resources')}
        </h1>
        <p className="mt-1 max-w-3xl text-text-secondary" style={{ fontSize: 'var(--kb-text-body)' }}>
          {t('admin.res_intro')}
        </p>
      </div>

      <Tabs<ResourcePane> t={t} tabs={tabs} value={pane} onChange={go} />

      {pane === 'overview'  && <OverviewTab  onGo={go} />}
      {pane === 'buildings' && <BuildingsTab canManage={canManage} />}
      {pane === 'resources' && <ResourcesTab canManage={canManage} />}
      {pane === 'features'  && <FeaturesTab  canManage={canManage} />}
    </div>
  )
}
