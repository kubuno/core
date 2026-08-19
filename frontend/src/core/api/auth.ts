import { api } from './client'
import type { User } from '../types'

/**
 * One signed-in account of THIS browser (Google-style multi-account). The
 * server enumerates them from its own HttpOnly slot cookies — the cookie jar
 * is the roster, nothing is persisted client-side.
 */
export interface BrowserAccount {
  slot: number
  active: boolean
  /** false = the session died server-side → « Déconnecté » row. */
  connected: boolean
  user: {
    id: string
    email: string
    username: string
    display_name: string | null
    avatar_url: string | null
  }
}

export const authApi = {
  register: (data: { email: string; username: string; password: string; display_name?: string }) =>
    api.post<{ user: User }>('/auth/register', data),

  login: (data: { login: string; password: string; device_name?: string; slot?: number }) =>
    api.post<
      | { access_token: string; user: User; slot?: number }
      | { requires_totp: true; totp_session: string }
    >('/auth/login', data),

  // `code` carries the time-based code, `backup_code` a single-use one. The
  // server accepts either; sending them in distinct fields keeps the intent
  // explicit rather than relying on the shape of the string.
  totpVerify: (data: { code?: string; backup_code?: string; totp_session: string; slot?: number }) =>
    api.post<{ access_token: string; user: User }>('/auth/totp', data),

  logout: (data?: { slot?: number; all?: boolean }) =>
    api.post('/auth/logout', data),

  /** Accounts signed into this browser (active first is NOT guaranteed). */
  accounts: () =>
    api.get<{ accounts: BrowserAccount[] }>('/auth/accounts'),

  /** Make the account parked in `slot` the active session. */
  switchAccount: (slot: number) =>
    api.post<{ access_token: string; user: User; slot: number }>('/auth/switch', { slot }),

  refresh: () =>
    api.post<{ access_token: string }>('/auth/refresh'),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),

  resetPassword: (token: string, new_password: string) =>
    api.post('/auth/reset-password', { token, new_password }),
}
