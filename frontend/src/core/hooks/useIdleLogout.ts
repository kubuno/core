import { useEffect } from 'react'
import axios from 'axios'
import { useAuthStore } from '../store/authStore'

// Gestion de session liée à l'ACTIVITÉ réelle de l'utilisateur.
//
// Deux mécanismes complémentaires :
//  1. Déconnexion après inactivité (réglage admin `security.session_idle_timeout_min`,
//     0 = désactivé). Minuteur réarmé à chaque interaction → déconnexion visible.
//  2. Keepalive proactif : tant que l'utilisateur est actif, on rafraîchit le jeton
//     AVANT son expiration. C'est essentiel car le backend mesure l'inactivité via
//     `last_used_at` du refresh token, lequel n'est mis à jour qu'à un `/auth/refresh`.
//     Sans keepalive, un utilisateur actif dans un module qui ne tape pas l'API REST
//     pendant un moment (édition locale, dessin, lecture, WebSocket only) voyait son
//     token expirer côté backend et se faisait déconnecter au prochain appel.
//
// Plafond du keepalive : doit rester sous le TTL du jeton d'accès (15 min par défaut)
// pour qu'il soit renouvelé à temps, et sous la fenêtre d'inactivité.
const KEEPALIVE_CAP_MS = 8 * 60_000
const DEFAULT_IDLE_MS  = 30 * 60_000

export function useIdleLogout() {
  const user         = useAuthStore(s => s.user)
  const logout       = useAuthStore(s => s.logout)
  const refreshToken = useAuthStore(s => s.refreshToken)

  useEffect(() => {
    if (!user) return
    let idleMs = DEFAULT_IDLE_MS // repli avant lecture du réglage
    let cancelled = false
    let logoutTimer: ReturnType<typeof setTimeout> | undefined
    let keepAliveTimer: ReturnType<typeof setTimeout> | undefined
    let lastActivity = Date.now()

    // Fenêtre pendant laquelle on considère l'utilisateur « actif » pour le
    // keepalive (même si la déconnexion auto est désactivée, on garde la session
    // vivante tant qu'il interagit, dans une fenêtre raisonnable).
    const activeWindow = () => (idleMs > 0 ? idleMs : DEFAULT_IDLE_MS)
    const keepAliveDelay = () =>
      Math.min(KEEPALIVE_CAP_MS, Math.max(60_000, Math.floor(activeWindow() * 0.4)))

    const armLogout = () => {
      if (logoutTimer) clearTimeout(logoutTimer)
      if (idleMs > 0) logoutTimer = setTimeout(() => { void logout() }, idleMs)
    }

    const onActivity = () => {
      if (cancelled) return
      lastActivity = Date.now()
      armLogout()
    }

    const scheduleKeepAlive = () => {
      if (keepAliveTimer) clearTimeout(keepAliveTimer)
      keepAliveTimer = setTimeout(keepAliveTick, keepAliveDelay())
    }

    // Renouvelle proactivement le jeton tant que l'utilisateur a interagi
    // récemment, afin que `last_used_at` reste frais côté backend.
    const keepAliveTick = async () => {
      if (cancelled) return
      if (Date.now() - lastActivity < activeWindow()) {
        try {
          await refreshToken()
        } catch {
          // Échec transitoire (réseau) : on ignore. Une session réellement
          // invalide sera traitée par l'intercepteur 401 / le minuteur d'inactivité.
        }
      }
      if (!cancelled) scheduleKeepAlive()
    }

    const events: (keyof WindowEventMap)[] = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'wheel']
    events.forEach(e => window.addEventListener(e, onActivity, { passive: true }))

    // Charger la durée configurée par l'admin (réglage public, clé `config`).
    axios.get<{ config: Record<string, unknown> }>('/api/v1/config')
      .then(r => {
        if (cancelled) return
        const raw = r.data.config?.['security.session_idle_timeout_min']
        const min = typeof raw === 'number' ? raw : typeof raw === 'string' ? parseInt(raw, 10) : 30
        idleMs = Number.isFinite(min) && min > 0 ? min * 60_000 : 0
        armLogout()
        // Recalcule la cadence du keepalive selon la fenêtre réellement configurée.
        scheduleKeepAlive()
      })
      .catch(() => armLogout())

    armLogout()
    scheduleKeepAlive()

    return () => {
      cancelled = true
      if (logoutTimer) clearTimeout(logoutTimer)
      if (keepAliveTimer) clearTimeout(keepAliveTimer)
      events.forEach(e => window.removeEventListener(e, onActivity))
    }
  }, [user, logout, refreshToken])
}
