import { useTranslation } from 'react-i18next'
import { Callout } from '@ui'
import { usePrivileges } from '../../authz/usePrivileges'
import SchemaPrefixCard from './SchemaPrefixCard'
import MainDbMigrationCard from './MainDbMigrationCard'

/**
 * Administration ▸ System ▸ "Main database": the two superadmin operations on
 * the core's own database — changing the schema prefix at run time and switching
 * to another engine while keeping the data. Both are guarded server-side to
 * superusers; this page tells a non-superadmin why it is empty rather than
 * showing a blank.
 */
export default function DatabasePanel() {
  const { t } = useTranslation()
  const { isSuperuser } = usePrivileges()

  if (!isSuperuser) {
    return <Callout variant="info">{t('admin.db_superuser_only')}</Callout>
  }

  return (
    <div>
      <SchemaPrefixCard />
      <MainDbMigrationCard />
    </div>
  )
}
