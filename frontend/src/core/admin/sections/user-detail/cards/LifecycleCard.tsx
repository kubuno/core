import { useTranslation } from 'react-i18next'
import { CalendarClock } from 'lucide-react'
import { Card } from '@ui'
import type { User } from '../../../../types'
import { formatAgo, formatDay } from '../../format'
import { Field } from '../atoms'

/**
 * Three stamps the server writes and nobody edits — hence an ordinary `Card`
 * and no pencil. A card that offered one would be promising something
 * `PATCH /admin/users/:id` cannot do.
 */
export default function LifecycleCard({ user }: { user: User }) {
  const { t, i18n } = useTranslation()

  return (
    <Card title={t('admin.ud_card_lifecycle')} icon={<CalendarClock size={16} />}>
      <dl className="divide-y divide-border">
        <Field label={t('admin.ud_created')}>{formatDay(user.created_at, i18n.language)}</Field>
        <Field label={t('admin.ud_updated')}>{formatDay(user.updated_at, i18n.language)}</Field>
        <Field label={t('admin.ud_last_login')}>
          {user.last_login_at ? (
            <span className="flex flex-wrap items-baseline gap-2">
              <span>{formatDay(user.last_login_at, i18n.language)}</span>
              <span className="text-text-tertiary" style={{ fontSize: 'var(--kb-text-meta)' }}>
                {formatAgo(user.last_login_at)}
              </span>
            </span>
          ) : (
            <span className="text-text-tertiary">{t('admin.never')}</span>
          )}
        </Field>
      </dl>
    </Card>
  )
}
