import { api } from './client'
import type { User } from '../types'

export const authApi = {
  register: (data: { email: string; username: string; password: string; display_name?: string }) =>
    api.post<{ user: User }>('/auth/register', data),

  login: (data: { login: string; password: string; device_name?: string }) =>
    api.post<
      | { access_token: string; user: User }
      | { requires_totp: true; totp_session: string }
    >('/auth/login', data),

  // `code` carries the time-based code, `backup_code` a single-use one. The
  // server accepts either; sending them in distinct fields keeps the intent
  // explicit rather than relying on the shape of the string.
  totpVerify: (data: { code?: string; backup_code?: string; totp_session: string }) =>
    api.post<{ access_token: string; user: User }>('/auth/totp', data),

  logout: () =>
    api.post('/auth/logout'),

  refresh: () =>
    api.post<{ access_token: string }>('/auth/refresh'),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),

  resetPassword: (token: string, new_password: string) =>
    api.post('/auth/reset-password', { token, new_password }),
}
