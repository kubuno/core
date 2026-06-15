import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {  } from 'lucide-react'
import { authApi } from '../api/auth'
import { Button, Input, KubunoLogo } from '@ui'

export default function ForgotPasswordPage() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await authApi.forgotPassword(email)
    } catch {
      // Toujours afficher le message de succès (pas d'énumération email)
    } finally {
      setIsLoading(false)
      setSubmitted(true)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-1 p-8">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8">
          <KubunoLogo size={26} className="text-primary" />
          <span className="text-2xl font-semibold text-text-primary">Kubuno</span>
        </div>

        <h1 className="text-2xl font-medium text-text-primary mb-1">{t('forgot.title')}</h1>

        {submitted ? (
          <div className="mt-6">
            <div className="bg-success-light text-success text-sm px-4 py-3 rounded-md">
              {t('forgot.sent')}
            </div>
            <div className="mt-6 text-center">
              <Link to="/login" className="text-sm text-primary hover:underline">
                {t('forgot.back')}
              </Link>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-text-secondary mb-8">
              {t('forgot.intro')}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label={t('register.email_label')}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="vous@exemple.com"
              />

              <Button type="submit" loading={isLoading} className="w-full">
                {t('forgot.submit')}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link to="/login" className="text-sm text-primary hover:underline">
                {t('forgot.back')}
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
