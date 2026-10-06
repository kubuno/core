import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface LinkedAccount {
  id:           string
  instance_url: string   // "https://other.kubuno.example.com"
  user_id:      string
  email:        string
  display_name: string | null
  avatar_url:   string | null
  access_token: string   // peut expirer ; rechargé à la reconnexion
  added_at:     string
}

interface LinkedAccountsState {
  accounts:     LinkedAccount[]
  add:          (account: LinkedAccount) => void
  remove:       (id: string) => void
  updateToken:  (id: string, access_token: string) => void
}

export const useLinkedAccountsStore = create<LinkedAccountsState>()(
  persist(
    (set) => ({
      accounts: [],

      add: (account) =>
        set((state) => ({
          accounts: [
            ...state.accounts.filter(
              (a) => !(a.instance_url === account.instance_url && a.email === account.email)
            ),
            account,
          ],
        })),

      remove: (id) =>
        set((state) => ({ accounts: state.accounts.filter((a) => a.id !== id) })),

      updateToken: (id, access_token) =>
        set((state) => ({
          accounts: state.accounts.map((a) => (a.id === id ? { ...a, access_token } : a)),
        })),
    }),
    { name: 'kubuno-linked-accounts' }
  )
)
