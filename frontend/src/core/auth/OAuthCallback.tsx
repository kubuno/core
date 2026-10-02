import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

/**
 * Landing page of an SSO sign-in. The server's callback has already opened the
 * session and set the HttpOnly refresh cookie; the app's bootstrap
 * (`initialize()`, a same-origin refresh) turns it into an access token held in
 * memory. Nothing is read from a cookie here: the access token never travels in
 * a script-readable cookie.
 */
export default function OAuthCallback() {
  const { t } = useTranslation()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const isInitialized = useAuthStore((s) => s.isInitialized)
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    const error = params.get('error')
    if (error) {
      navigate('/login?error=' + encodeURIComponent(error))
      return
    }
    if (!isInitialized) return
    navigate(user ? '/' : '/login')
  }, [params, navigate, isInitialized, user])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-text-secondary text-sm">{t('oauth.connecting')}</div>
    </div>
  )
}
