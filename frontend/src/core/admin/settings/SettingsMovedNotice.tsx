import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Callout } from '@ui'
import { usePrivileges } from '../../authz/usePrivileges'
import { NAV_INDEX, canSeeTab } from '../adminNav'
import { adminUrl } from '../adminAction'
import { SETTINGS_PAGES, FALLBACK_TAB } from './settingsMap'

/**
 * Where the rest went.
 *
 * The instance profile used to carry every setting of the instance, in one
 * scroll. It now carries what identifies the instance, and each subsystem's
 * knobs live on the page that shows their consequences. An operator who knew
 * the old page would otherwise conclude the settings were removed, so the page
 * names their destinations instead of leaving them to the menu.
 *
 * Only destinations this caller may actually open are listed: naming a page
 * somebody is refused is a worse answer than not naming it.
 */
export default function SettingsMovedNotice() {
  const { t } = useTranslation()
  const { can } = usePrivileges()

  const targets = SETTINGS_PAGES
    .map(p => p.tab)
    .filter(tab => tab !== FALLBACK_TAB && canSeeTab(tab, can))

  if (targets.length === 0) return null

  return (
    <div className="mb-6 max-w-2xl">
      <Callout variant="info" title={t('admin.moved_title')}>
        <p>{t('admin.moved_body')}</p>
        <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
          {targets.map(tab => (
            <Link
              key={tab}
              to={adminUrl({ tab })}
              className="text-primary underline decoration-dotted underline-offset-2"
            >
              {t(NAV_INDEX.get(tab)!.item.labelKey)}
            </Link>
          ))}
        </p>
      </Callout>
    </div>
  )
}
