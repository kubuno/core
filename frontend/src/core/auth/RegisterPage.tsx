import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { authApi } from '../api/auth'
import { Button, Input, KubunoLogo } from '@ui'

function passwordStrength(password: string): { score: number; key: string; color: string } {
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  if (score <= 1) return { score, key: 'register.s_very_weak', color: '#d93025' }
  if (score === 2) return { score, key: 'register.s_weak', color: '#f9ab00' }
  if (score === 3) return { score, key: 'register.s_medium', color: '#f9ab00' }
  if (score === 4) return { score, key: 'register.s_strong', color: '#1e8e3e' }
  return { score, key: 'register.s_very_strong', color: '#1e8e3e' }
}

export default function RegisterPage() {
  const { t } = useTranslation()
  const [form, setForm] = useState({
    email: '', username: '', password: '', confirm: '', display_name: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const strength = passwordStrength(form.password)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirm) {
      setError(t('register.err_mismatch'))
      return
    }
    if (form.password.length < 8) {
      setError(t('register.err_min'))
      return
    }

    setIsLoading(true)
    try {
      await authApi.register({
        email: form.email,
        username: form.username,
        password: form.password,
        display_name: form.display_name || undefined,
      })
      navigate('/login?registered=1')
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message
      setError(msg ?? t('register.err_generic'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-surface-1">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-border p-8">
        <div className="flex items-center gap-2 mb-6">
          <KubunoLogo size={26} className="text-primary" />
          <span className="text-xl font-semibold text-text-primary">Kubuno</span>
        </div>

        <h1 className="text-xl font-medium text-text-primary mb-1">{t('register.title')}</h1>
        <p className="text-sm text-text-secondary mb-6">{t('register.subtitle')}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={t('register.name_label')}
              type="text"
              name="display_name"
              value={form.display_name}
              onChange={handleChange}
              autoComplete="name"
              placeholder="Jean Dupont"
            />
            <Input
              label={<>{t('register.username_label')} <span className="text-danger">*</span></>}
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              required
              minLength={3}
              autoComplete="username"
              placeholder="jean_dupont"
            />
          </div>

          <Input
            label={<>{t('register.email_label')} <span className="text-danger">*</span></>}
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            autoComplete="email"
            placeholder="vous@exemple.com"
          />

          <div className="relative">
            <Input
              label={<>{t('register.password_label')} <span className="text-danger">*</span></>}
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              autoComplete="new-password"
              className="pr-10"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 bottom-0 h-9 flex items-center text-text-tertiary hover:text-text-secondary"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
            {form.password && (
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
            label={<>{t('register.confirm_label')} <span className="text-danger">*</span></>}
            type="password"
            name="confirm"
            value={form.confirm}
            onChange={handleChange}
            required
            autoComplete="new-password"
            placeholder="••••••••"
          />

          {error && (
            <div className="text-sm text-danger bg-danger-light px-3 py-2 rounded-md">
              {error}
            </div>
          )}

          <Button type="submit" loading={isLoading} className="w-full">
            {t('register.submit')}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-text-secondary">
          {t('register.have_account')}{' '}
          <Link to="/login" className="text-primary hover:underline font-medium">{t('login.submit')}</Link>
        </p>
      </div>
    </div>
  )
}
