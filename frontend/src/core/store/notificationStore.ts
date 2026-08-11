import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface AppNotification {
  id: string
  title: string
  body: string
  moduleId: string
  icon?: string
  read: boolean
  createdAt: string
  link?: string
  /**
   * Stable identity of the THING being announced (an alert id, a job id…), as
   * opposed to `id` which identifies this notification row.
   *
   * It exists because a producer that polls — the alert centre does — would
   * otherwise re-announce the same open alert on every refresh, and a bell that
   * cries the same news every minute is a bell people silence. See `pushKeyed`.
   */
  key?: string
}

interface NotificationState {
  notifications: AppNotification[]
  unreadCount: number

  push: (n: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) => void
  /**
   * Announces something at most once. Returns silently when a notification
   * already carries `key`, whether it has been read or not: "already told you"
   * includes "told you and you dismissed it".
   */
  pushKeyed: (key: string, n: Omit<AppNotification, 'id' | 'read' | 'createdAt' | 'key'>) => void
  markRead: (id: string) => void
  markAllRead: () => void
  clear: () => void
}

function computeUnread(notifications: AppNotification[]): number {
  return notifications.filter(n => !n.read).length
}

/**
 * Identifier for one notification row.
 *
 * `crypto.randomUUID` is undefined outside a secure context (a LAN instance
 * reached over plain HTTP), and reading it there throws — which would take the
 * whole header down with it. The fallback is not cryptographic and does not need
 * to be: this is a list key.
 */
function uid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `n-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

/** Newest first, capped — the cap is what keeps sessionStorage bounded. */
const MAX_NOTIFICATIONS = 50

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      notifications: [],
      unreadCount: 0,

      push: (n) => {
        const notification: AppNotification = {
          ...n,
          id: uid(),
          read: false,
          createdAt: new Date().toISOString(),
        }
        set((state) => {
          const updated = [notification, ...state.notifications].slice(0, MAX_NOTIFICATIONS)
          return { notifications: updated, unreadCount: computeUnread(updated) }
        })
      },

      pushKeyed: (key, n) =>
        set((state) => {
          if (state.notifications.some(existing => existing.key === key)) return state
          const notification: AppNotification = {
            ...n,
            key,
            id: uid(),
            read: false,
            createdAt: new Date().toISOString(),
          }
          const updated = [notification, ...state.notifications].slice(0, MAX_NOTIFICATIONS)
          return { notifications: updated, unreadCount: computeUnread(updated) }
        }),

      markRead: (id) =>
        set((state) => {
          const updated = state.notifications.map(n =>
            n.id === id ? { ...n, read: true } : n
          )
          return { notifications: updated, unreadCount: computeUnread(updated) }
        }),

      markAllRead: () =>
        set((state) => {
          const updated = state.notifications.map(n => ({ ...n, read: true }))
          return { notifications: updated, unreadCount: 0 }
        }),

      clear: () => set({ notifications: [], unreadCount: 0 }),
    }),
    {
      name: 'kubuno-notifications',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ notifications: state.notifications }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.unreadCount = computeUnread(state.notifications)
        }
      },
    }
  )
)
