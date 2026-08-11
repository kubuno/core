import { create } from 'zustand'
import { api, registerTokenHandlers, writeTokenCookie } from '../api/client'
import { authApi } from '../api/auth'
import type { User } from '../types'
import type { EffectivePrivileges } from '../authz/types'

/** The shape of `GET /api/v1/me`: the account row, and what it may do. */
interface MeResponse {
  user: User
  privileges?: EffectivePrivileges
}

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
  /**
   * The caller's own effective privileges, straight from `/me`. `null` means
   * "not loaded yet", never "holds nothing" — an account holding nothing comes
   * back with an empty `privileges` array.
   */
  privileges: EffectivePrivileges | null
  /**
   * Loads `/me` once. Idempotent, and deduplicated across concurrent callers.
   * `force` re-reads even when a block is already held — what a role write does,
   * since granting or revoking can change what the *operator* themselves may see.
   */
  loadPrivileges: (force?: boolean) => Promise<void>

  login: (email: string, password: string) => Promise<{ requiresTotp: boolean }>
  /** `kind` says whether the submitted value is a time-based or a backup code. */
  verifyTotp: (code: string, kind?: 'totp' | 'backup') => Promise<void>
  logout: () => Promise<void>
  refreshToken: () => Promise<void>
  updateUser: (updates: Partial<User>) => void
  initialize: () => Promise<void>
  setToken: (token: string) => void
}

// In-flight `/me` call, so the several components that mount at once and all ask
// for the privileges produce a single request.
let privilegesInFlight: Promise<void> | null = null

export const useAuthStore = create<AuthState>((set, get) => {
  // Enregistrer les callbacks pour l'API client (pas de cycle d'import)
  registerTokenHandlers(
    () => get().accessToken,
    (t) => { set({ accessToken: t }); writeTokenCookie(t) },
    () => {
      // Session expirée via l'intercepteur Axios → notifier les autres onglets
      set({ accessToken: null, user: null, privileges: null })
      writeTokenCookie(null)
      authChannel?.postMessage({ type: 'logout' })
    }
  )

  // Écouter les événements des autres onglets (même navigateur, même session)
  if (authChannel) {
    authChannel.onmessage = (event: MessageEvent<{ type: string }>) => {
      if (event.data?.type === 'logout') {
        set({ user: null, accessToken: null, privileges: null })
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
    privileges: null,

    setToken: (token) => set({ accessToken: token }),

    // `initialize()` already reads `/me` and keeps the block it returns, so a page
    // load costs nothing extra. This covers the paths that obtain a user without
    // going through it — signing in, and the OAuth callback.
    loadPrivileges: async (force = false) => {
      if (!force && get().privileges) return
      if (force || !privilegesInFlight) {
        const call: Promise<void> = api
          .get<MeResponse>('/me')
          .then(({ data }) => { set({ user: data.user, privileges: data.privileges ?? null }) })
          .catch(() => { /* a network failure is not a verdict: retried on the next mount */ })
          .finally(() => { if (privilegesInFlight === call) privilegesInFlight = null })
        privilegesInFlight = call
      }
      await privilegesInFlight
    },

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
        // A new session belongs to a new subject: whatever was resolved for the
        // previous one must not survive into it.
        set({ user: (data as { access_token: string; user: User }).user, accessToken: (data as { access_token: string; user: User }).access_token, privileges: null })
        writeTokenCookie((data as { access_token: string; user: User }).access_token)
        return { requiresTotp: false }
      } finally {
        set({ isLoading: false })
      }
    },

    verifyTotp: async (code, kind = 'totp') => {
      const { totpSession } = get()
      if (!totpSession) throw new Error('Aucune session TOTP en cours')
      set({ isLoading: true })
      try {
        const payload = kind === 'backup'
          ? { backup_code: code, totp_session: totpSession }
          : { code, totp_session: totpSession }
        const { data } = await authApi.totpVerify(payload)
        set({ user: data.user, accessToken: data.access_token, totpSession: null, privileges: null })
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
      set({ user: null, accessToken: null, privileges: null })
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
        const { data } = await api.get<MeResponse>('/me')
        set({ user: data.user, privileges: data.privileges ?? null })
      } catch {
        set({ user: null, accessToken: null, privileges: null })
        writeTokenCookie(null)
      } finally {
        set({ isLoading: false, isInitialized: true })
      }
    },
  }
})
