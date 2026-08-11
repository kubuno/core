import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Input } from '@ui'
import { api } from '../../api/client'
import { TwoFactorSection } from './TwoFactorSection'

export function SecurityTab() {
  const { t } = useTranslation()
  const [form, setForm] = useState({ old_password: '', new_password: '', confirm: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (form.new_password !== form.confirm) {
      setError(t('register.err_mismatch'))
      return
    }
    try {
      await api.patch('/me/password', {
        old_password: form.old_password,
        new_password: form.new_password,
      })
      setSuccess(true)
      setForm({ old_password: '', new_password: '', confirm: '' })
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? t('settings.error'))
    }
  }

  return (
    <div className="max-w-md space-y-6">
      <div>
        <h3 className="text-sm font-medium text-text-primary mb-3">{t('settings.sec_change_password')}</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          {(['old_password', 'new_password', 'confirm'] as const).map((field) => (
            <Input
              key={field}
              type="password"
              label={field === 'old_password' ? t('settings.sec_old')
                : field === 'new_password' ? t('settings.sec_new')
                : t('settings.sec_confirm')}
              value={form[field]}
              onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
              autoComplete={field === 'old_password' ? 'current-password' : 'new-password'}
            />
          ))}
          {error && <p className="text-sm text-danger">{error}</p>}
          {success && <p className="text-sm text-success">{t('settings.sec_updated')}</p>}
          <Button type="submit">{t('settings.sec_update')}</Button>
        </form>
      </div>
      <div className="h-px bg-border" />
      <TwoFactorSection />
    </div>
  )
}
