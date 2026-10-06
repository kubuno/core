/**
 * Code-behind of `OAuthCallback.kbview` (converted from `OAuthCallback.tsx` by @kubuno/views-migrate).
 */
import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useAuthStore } from "../store/authStore"

import { ViewBase } from './OAuthCallback.kbview'

export class OAuthCallback extends ViewBase {
  /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
  useStores() {
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
    return { t, params, navigate, isInitialized, user }
  }

  /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
  use(): void {
    this.useStores()
  }

}

/** What `useStores()` gives (the types of the fields it fills). */
export type OAuthCallbackStores = ReturnType<OAuthCallback['useStores']>

export default OAuthCallback.component()
