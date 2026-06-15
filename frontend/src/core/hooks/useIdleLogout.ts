import { useEffect } from 'react'
import axios from 'axios'
import { useAuthStore } from '../store/authStore'

// Déconnexion automatique après une durée d'INACTIVITÉ (sans interaction).
// La durée est pilotée par le réglage admin `security.session_idle_timeout_min`
// (0 = désactivé). Le backend applique aussi cette limite au rafraîchissement de
// jeton ; ce minuteur côté client assure une déconnexion VISIBLE et immédiate.
export function useIdleLogout() {
  const user   = useAuthStore(s => s.user)
  const logout = useAuthStore(s => s.logout)

  useEffect(() => {
    if (!user) return
    let timer: ReturnType<typeof setTimeout> | undefined
    let idleMs = 30 * 60_000 // repli avant lecture du réglage
    let cancelled = false

    const arm = () => {
      if (timer) clearTimeout(timer)
      if (idleMs > 0) timer = setTimeout(() => { void logout() }, idleMs)
    }
    const onActivity = () => { if (!cancelled) arm() }

    const events: (keyof WindowEventMap)[] = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'wheel']
    events.forEach(e => window.addEventListener(e, onActivity, { passive: true }))

    // Charger la durée configurée par l'admin (réglage public, clé `config`).
    axios.get<{ config: Record<string, unknown> }>('/api/v1/config')
      .then(r => {
        if (cancelled) return
        const raw = r.data.config?.['security.session_idle_timeout_min']
        const min = typeof raw === 'number' ? raw : typeof raw === 'string' ? parseInt(raw, 10) : 30
        idleMs = Number.isFinite(min) && min > 0 ? min * 60_000 : 0
        arm()
      })
      .catch(() => arm())

    arm()
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
      events.forEach(e => window.removeEventListener(e, onActivity))
    }
  }, [user, logout])
}
