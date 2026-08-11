import { useTranslation } from 'react-i18next'
import { KeyRound, ShieldCheck } from 'lucide-react'
import { Callout, Card } from '@ui'
import type { User } from '../../../types'
import { Field } from './atoms'
import PasswordResetCard from './PasswordResetCard'
import SessionsCard from './SessionsCard'

/**
 * Security tab — the posture of the account and the levers over it.
 *
 * Order is deliberate, strongest signal first: what protects the account (2FA),
 * what is pending on its credentials (forced password change, and the reset
 * slot below), then what is currently open in its name (sessions).
 */
export default function SecurityTab({ user }: { user: User }) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-4">
      <Card title={t('admin.ud_card_2fa')} icon={<ShieldCheck size={16} />}>
        <Callout
          t={t}
          variant={user.totp_enabled ? 'success' : 'warning'}
          title={user.totp_enabled ? t('admin.ud_2fa_on') : t('admin.ud_2fa_off')}
        >
          {user.totp_enabled ? t('admin.ud_2fa_on_desc') : t('admin.ud_2fa_off_desc')}
        </Callout>
      </Card>

      <Card title={t('admin.ud_card_credentials')} icon={<KeyRound size={16} />}>
        <dl className="divide-y divide-border">
          <Field label={t('admin.ud_must_change_pw')}>
            {user.must_change_password ? t('admin.ud_flag_yes') : t('admin.ud_flag_no')}
          </Field>
          <Field label={t('admin.ud_auth_method')}>
            {user.oauth_provider
              ? t('admin.ud_auth_oauth', { provider: user.oauth_provider })
              : t('admin.ud_auth_password')}
          </Field>
        </dl>
        {user.must_change_password && (
          <Callout t={t} variant="warning" className="mt-3">
            {t('admin.ud_must_change_pw_desc')}
          </Callout>
        )}
      </Card>

      {/* Reserved slot for the administrator-driven password reset — see the
          component's own documentation. Renders nothing until it lands. */}
      <PasswordResetCard user={user} />

      <SessionsCard user={user} />
    </div>
  )
}
