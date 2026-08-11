import { useTranslation } from 'react-i18next'
import UsersPanel from '../UsersPanel'
import UserDetailSection from './user-detail/UserDetailSection'
import type { AdminSectionProps } from './registry'

/**
 * Directory ▸ Users — the list, or one account's sheet.
 *
 * Both live under the same tab id rather than a tab of their own: the sheet is
 * a DRILL-DOWN of the list, so the nav tree must keep "Users" highlighted while
 * it is open, and the browser's Back button must return to the list. The URL
 * carries the distinction (`/admin/users?user=<id>`), which also makes an account
 * linkable from the audit trail or an e-mail.
 *
 * The section declares `ownHeader` in the registry, so the page title is
 * rendered here: the list gets the nav label, the sheet its own header.
 */
export default function UsersSection({ params, navigate }: AdminSectionProps) {
  const { t } = useTranslation()
  const userId = params.get('user')

  if (userId) return <UserDetailSection userId={userId} params={params} navigate={navigate} />

  return (
    <>
      <h1 className="mb-6 text-xl font-medium text-text-primary">{t('admin.tab_users')}</h1>
      <UsersPanel />
    </>
  )
}
