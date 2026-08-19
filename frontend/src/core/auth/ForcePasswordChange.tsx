import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Eye, EyeOff, ShieldAlert } from 'lucide-react'
import { Button, Input } from '@ui'
import { api } from '../api/client'
import { useAuthStore } from '../store/authStore'
import { passwordStrength } from './passwordStrength'
import { InstanceLogo } from '../shell/InstanceLogo'

/**
 * Full-screen, non-dismissible password change.
 *
 * Rendered in place of the whole authenticated shell while the current account
 * carries `must_change_password` (an administrator seeded with the built-in
 * default password). There is no close affordance and no route behind it: the
 * only ways out are changing the password or signing out. The server enforces
 * the same rule independently — administrative writes answer
 * `PASSWORD_CHANGE_REQUIRED` until the flag is cleared.
 */
export default function ForcePasswordChange() {
  const { t } = useTranslation()
  const email = useAuthStore((s) => s.user?.email ?? '')
  const login = useAuthStore((s) => s.login)
  const updateUser = useAuthStore((s) => s.updateUser)
  const logout = useAuthStore((s) => s.logout)

  const [form, setForm] = useState({ current: '', next: '', confirm: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const strength = passwordStrength(form.next)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (form.next.length < 8) {
      setError(t('register.err_min'))
      return
    }
    if (form.next !== form.confirm) {
      setError(t('register.err_mismatch'))
      return
    }
    if (form.next === form.current) {
      setError(t('forcepw.err_same'))
      return
    }

    setIsLoading(true)
    try {
      await api.patch('/me/password', {
        old_password: form.current,
        new_password: form.next,
      })
      // Changing the password revokes every refresh token, including the one
      // backing this tab: a reload would bounce to /login. Sign in again with
      // the brand-new password so the user lands on a fully valid session. The
      // fresh `user` payload also carries the cleared flag, which lifts this
      // screen. If anything gets in the way (2FA, network), fall back to a
      // clean sign-out — the password change itself already went through.
      try {
        const { requiresTotp } = await login(email, form.next)
        if (requiresTotp) await logout()
      } catch {
        await logout()
      }
      updateUser({ must_change_password: false })
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? t('forcepw.err_generic'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-surface-1">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-border p-8">
        <div className="flex items-center gap-2 mb-6">
          <InstanceLogo size={26} className="text-primary" />
          <span className="text-xl font-semibold text-text-primary">Kubuno</span>
        </div>

        <h1 className="text-xl font-medium text-text-primary mb-1">{t('forcepw.title')}</h1>
        <p className="text-sm text-text-secondary mb-4">{t('forcepw.subtitle')}</p>

        <div className="flex gap-2 items-start text-sm text-text-primary bg-warning-light px-3 py-2 rounded-md mb-6">
          <ShieldAlert size={16} className="shrink-0 mt-0.5 text-warning" />
          <span>{t('forcepw.warning')}</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={t('forcepw.current')}
            type="password"
            value={form.current}
            onChange={(e) => setForm((f) => ({ ...f, current: e.target.value }))}
            required
            autoComplete="current-password"
            autoFocus
            placeholder="••••••••"
          />

          <div className="relative">
            <Input
              label={t('forcepw.new')}
              type={showPassword ? 'text' : 'password'}
              value={form.next}
              onChange={(e) => setForm((f) => ({ ...f, next: e.target.value }))}
              required
              minLength={8}
              autoComplete="new-password"
              className="pr-10"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={t('forcepw.toggle_visibility')}
              className="absolute right-3 bottom-0 h-9 flex items-center text-text-tertiary hover:text-text-secondary"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
            {form.next && (
              <div className="mt-1.5">
                <div className="flex gap-1 mb-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-1 flex-1 rounded-full transition-all"
                      style={{ background: i < strength.score ? strength.color : '#e8eaed' }}
                    />
                  ))}
                </div>
                <span className="text-xs" style={{ color: strength.color }}>{t(strength.key)}</span>
              </div>
            )}
          </div>

          <Input
            label={t('forcepw.confirm')}
            type="password"
            value={form.confirm}
            onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
            required
            autoComplete="new-password"
            placeholder="••••••••"
          />

          {error && (
            <div className="text-sm text-danger bg-danger-light px-3 py-2 rounded-md">
              {error}
            </div>
          )}

          {/* Equal-width actions, primary last-resort escape is signing out. */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <Button type="button" variant="secondary" onClick={() => void logout()}>
              {t('forcepw.logout')}
            </Button>
            <Button type="submit" loading={isLoading}>
              {t('forcepw.submit')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
