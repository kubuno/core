import { create } from 'zustand'
import { api, registerTokenHandlers, writeTokenCookie } from '../api/client'
import { authApi } from '../api/auth'
import type { User } from '../types'

// Synchronise le logout entre tous les onglets/fenêtres du même navigateur
// qui partagent la même session (même cookie refresh_token).
const authChannel = typeof BroadcastChannel !== 'undefined'
  ? new BroadcastChannel('kubuno-auth')
  : null

interface AuthState {
  user: User | null
  accessToken: string | null
  isLoading: boolean
  isInitialized: boolean
  /** Présent uniquement entre la vérification du mot de passe et celle du code TOTP. */
  totpSession: string | null

  login: (email: string, password: string) => Promise<{ requiresTotp: boolean }>
  verifyTotp: (code: string) => Promise<void>
  logout: () => Promise<void>
  refreshToken: () => Promise<void>
  updateUser: (updates: Partial<User>) => void
  initialize: () => Promise<void>
  setToken: (token: string) => void
}

export const useAuthStore = create<AuthState>((set, get) => {
  // Enregistrer les callbacks pour l'API client (pas de cycle d'import)
  registerTokenHandlers(
    () => get().accessToken,
    (t) => { set({ accessToken: t }); writeTokenCookie(t) },
    () => {
      // Session expirée via l'intercepteur Axios → notifier les autres onglets
      set({ accessToken: null, user: null })
      writeTokenCookie(null)
      authChannel?.postMessage({ type: 'logout' })
    }
  )

  // Écouter les événements des autres onglets (même navigateur, même session)
  if (authChannel) {
    authChannel.onmessage = (event: MessageEvent<{ type: string }>) => {
      if (event.data?.type === 'logout') {
        set({ user: null, accessToken: null })
        writeTokenCookie(null)
      }
    }
  }

  return {
    user: null,
    accessToken: null,
    isLoading: false,
    isInitialized: false,
    totpSession: null,

    setToken: (token) => set({ accessToken: token }),

    login: async (login, password) => {
      set({ isLoading: true })
      try {
        const { data } = await authApi.login({
          login,
          password,
          device_name: navigator.userAgent.slice(0, 255),
        })
        if ('requires_totp' in data && data.requires_totp) {
          set({ totpSession: data.totp_session })
          return { requiresTotp: true }
        }
        set({ user: (data as { access_token: string; user: User }).user, accessToken: (data as { access_token: string; user: User }).access_token })
        writeTokenCookie((data as { access_token: string; user: User }).access_token)
        return { requiresTotp: false }
      } finally {
        set({ isLoading: false })
      }
    },

    verifyTotp: async (code) => {
      const { totpSession } = get()
      if (!totpSession) throw new Error('Aucune session TOTP en cours')
      set({ isLoading: true })
      try {
        const { data } = await authApi.totpVerify({ code, totp_session: totpSession })
        set({ user: data.user, accessToken: data.access_token, totpSession: null })
        writeTokenCookie(data.access_token)
      } finally {
        set({ isLoading: false })
      }
    },

    logout: async () => {
      try {
        await authApi.logout()
      } catch {
        // Ignorer les erreurs réseau au logout
      }
      set({ user: null, accessToken: null })
      writeTokenCookie(null)
      // Déconnecter tous les autres onglets du même navigateur
      authChannel?.postMessage({ type: 'logout' })
    },

    refreshToken: async () => {
      const { data } = await authApi.refresh()
      set({ accessToken: data.access_token })
      writeTokenCookie(data.access_token)
    },

    updateUser: (updates) =>
      set((state) => ({
        user: state.user ? { ...state.user, ...updates } : null,
      })),

    initialize: async () => {
      set({ isLoading: true })
      try {
        await get().refreshToken()
        const { data } = await api.get<{ user: User }>('/me')
        set({ user: data.user })
      } catch {
        set({ user: null, accessToken: null })
        writeTokenCookie(null)
      } finally {
        set({ isLoading: false, isInitialized: true })
      }
    },
  }
})
