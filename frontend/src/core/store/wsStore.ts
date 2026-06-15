import { create, type StoreApi } from 'zustand'
import { useAuthStore } from './authStore'

interface WsMessage {
  type: string
  module?: string
  payload: unknown
}

interface WsState {
  connected: boolean
  messages: WsMessage[]
  connect: (token: string) => void
  disconnect: () => void
}

let ws: WebSocket | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let currentToken: string | null = null
let intentionalClose = false

function openSocket(token: string, set: StoreApi<WsState>['setState']) {
  if (ws) { ws.onclose = null; ws.close() }
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const safeToken = encodeURIComponent(token)
  ws = new WebSocket(`${protocol}//${window.location.host}/ws?token=${safeToken}`)

  ws.onopen = () => { reconnectAttempt = 0; set({ connected: true }) }

  ws.onclose = () => {
    set({ connected: false })
    if (!intentionalClose && currentToken) {
      // Always use the freshest token on reconnect to avoid 401 loops
      const freshToken = useAuthStore.getState().accessToken ?? currentToken
      currentToken = freshToken
      const delay = Math.min(30_000, 2_000 * 2 ** (reconnectAttempt++))
      reconnectTimer = setTimeout(() => openSocket(freshToken, set), delay)
    }
  }

  ws.onerror = () => { /* onclose s'en charge */ }

  ws.onmessage = (e) => {
    try {
      const msg = JSON.parse(e.data as string) as WsMessage
      set((state) => ({ messages: [...state.messages.slice(-99), msg] }))
    } catch { /* ignorer les messages non-JSON */ }
  }
}

let reconnectAttempt = 0

export const useWsStore = create<WsState>((set) => ({
  connected: false,
  messages: [],

  connect: (token: string) => {
    intentionalClose = false
    reconnectAttempt = 0
    currentToken = token
    if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null }
    openSocket(token, set)
  },

  disconnect: () => {
    intentionalClose = true
    currentToken = null
    if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null }
    ws?.close()
    ws = null
    set({ connected: false, messages: [] })
  },
}))
