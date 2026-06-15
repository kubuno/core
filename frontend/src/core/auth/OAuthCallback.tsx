import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

function readAndClearCookie(name: string): string | null {
  const match = document.cookie.split(';').map(c => c.trim()).find(c => c.startsWith(name + '='))
  if (!match) return null
  const value = match.slice(name.length + 1)
  // Clear the cookie immediately
  document.cookie = `${name}=; Path=/auth/oauth/callback; SameSite=Strict; Max-Age=0`
  return value || null
}

export default function OAuthCallback() {
  const { t } = useTranslation()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const setToken = useAuthStore((s) => s.setToken)

  useEffect(() => {
    const error = params.get('error')
    if (error) {
      navigate('/login?error=' + encodeURIComponent(error))
      return
    }

    // Token is delivered via a short-lived cookie (not URL) to avoid history/log exposure
    const token = readAndClearCookie('oauth_token')
    if (token) {
      setToken(token)
      navigate('/')
    } else {
      navigate('/login')
    }
  }, [params, navigate, setToken])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-text-secondary text-sm">{t('oauth.connecting')}</div>
    </div>
  )
}
