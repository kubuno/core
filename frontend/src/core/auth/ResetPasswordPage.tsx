import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CheckCircle2, Eye, EyeOff } from 'lucide-react'
import { Button, Callout, Input, KubunoLogo } from '@ui'
import { api } from '../api/client'
import { passwordStrength } from './passwordStrength'

/**
 * Landing page of the link sent by "forgot my password".
 *
 * This page is what was missing for the whole flow to exist: the backend has
 * had `POST /auth/reset-password` all along, the relay now delivers the link,
 * and this is where the link lands. The token travels in the query string
 * (`/reset-password?token=…`); it is single-use and short-lived, and is never
 * stored anywhere by this component — it goes straight into the one request.
 *
 * Deliberately public and unauthenticated: whoever follows the link has, by
 * definition, no session.
 */
export default function ResetPasswordPage() {
  const { t } = useTranslation()
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''

  const [form, setForm] = useState({ next: '', confirm: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [done, setDone] = useState(false)

  const strength = passwordStrength(form.next)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (form.next.length < 8) {
      setError(t('resetpw.err_min'))
      return
    }
    if (form.next !== form.confirm) {
      setError(t('resetpw.err_mismatch'))
      return
    }

    setIsLoading(true)
    try {
      await api.post('/auth/reset-password', { token, new_password: form.next })
      setDone(true)
    } catch (err: unknown) {
      // The server answers the same way for an unknown, used and expired token
      // — deliberately, so this page says the same thing for all three.
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(message || t('resetpw.err_invalid'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-surface-1">
      <div className="w-full max-w-md bg-surface-0 rounded-xl shadow-sm border border-border p-8">
        <div className="flex items-center gap-2 mb-6">
          <KubunoLogo size={26} className="text-primary" />
          <span className="text-xl font-semibold text-text-primary">Kubuno</span>
        </div>

        {done ? (
          <>
            <div className="mb-4 flex items-center gap-2 text-success">
              <CheckCircle2 size={20} />
              <h1 className="text-xl font-medium text-text-primary">{t('resetpw.done_title')}</h1>
            </div>
            <p className="text-sm text-text-secondary mb-6">{t('resetpw.done_body')}</p>
            <Link to="/login">
              <Button className="w-full">{t('resetpw.back_login')}</Button>
            </Link>
          </>
        ) : !token ? (
          <>
            <h1 className="text-xl font-medium text-text-primary mb-3">{t('resetpw.title')}</h1>
            <Callout variant="warning" className="mb-6">{t('resetpw.no_token')}</Callout>
            <Link to="/forgot-password">
              <Button variant="secondary" className="w-full">{t('resetpw.back_login')}</Button>
            </Link>
          </>
        ) : (
          <>
            <h1 className="text-xl font-medium text-text-primary mb-1">{t('resetpw.title')}</h1>
            <p className="text-sm text-text-secondary mb-6">{t('resetpw.intro')}</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Input
                  label={t('resetpw.password')}
                  type={showPassword ? 'text' : 'password'}
                  value={form.next}
                  onChange={(e) => setForm((f) => ({ ...f, next: e.target.value }))}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="pr-10"
                  placeholder="••••••••"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={t('resetpw.toggle_visibility')}
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
                          style={{ background: i < strength.score ? strength.color : 'var(--color-surface-3)' }}
                        />
                      ))}
                    </div>
                    <span className="text-xs" style={{ color: strength.color }}>{t(strength.key)}</span>
                  </div>
                )}
              </div>

              <Input
                label={t('resetpw.confirm')}
                type="password"
                value={form.confirm}
                onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
                required
                autoComplete="new-password"
                placeholder="••••••••"
              />

              {error && <Callout variant="danger">{error}</Callout>}

              <Button type="submit" className="w-full" loading={isLoading}>
                {t('resetpw.submit')}
              </Button>

              <Link
                to="/login"
                className="block text-center text-sm text-primary hover:underline underline-offset-2"
              >
                {t('resetpw.back_login')}
              </Link>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
