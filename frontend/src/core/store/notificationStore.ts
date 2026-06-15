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
}

interface NotificationState {
  notifications: AppNotification[]
  unreadCount: number

  push: (n: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) => void
  markRead: (id: string) => void
  markAllRead: () => void
  clear: () => void
}

function computeUnread(notifications: AppNotification[]): number {
  return notifications.filter(n => !n.read).length
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      notifications: [],
      unreadCount: 0,

      push: (n) => {
        const notification: AppNotification = {
          ...n,
          id: crypto.randomUUID(),
          read: false,
          createdAt: new Date().toISOString(),
        }
        set((state) => {
          const updated = [notification, ...state.notifications].slice(0, 50)
          return { notifications: updated, unreadCount: computeUnread(updated) }
        })
      },

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
