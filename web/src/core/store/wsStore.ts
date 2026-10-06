import { create, type StoreApi } from 'zustand'
import { useAuthStore } from './authStore'
import { signedSocketUrl } from '../api/signedUrl'

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

function scheduleReconnect(set: StoreApi<WsState>['setState']) {
  if (intentionalClose || !currentToken) return
  // Always use the freshest token on reconnect to avoid 401 loops
  const freshToken = useAuthStore.getState().accessToken ?? currentToken
  currentToken = freshToken
  const delay = Math.min(30_000, 2_000 * 2 ** (reconnectAttempt++))
  reconnectTimer = setTimeout(() => openSocket(freshToken, set), delay)
}

function openSocket(_token: string, set: StoreApi<WsState>['setState']) {
  if (ws) { ws.onclose = null; ws.close(); ws = null }
  // The handshake cannot carry the Authorization header: it presents a
  // one-minute socket ticket minted over the bearer API (never the access
  // token itself, which would end up in URLs and logs). A fresh ticket on
  // every (re)connect.
  signedSocketUrl('/ws').then(url => {
    if (intentionalClose || !currentToken) return
    const sock = new WebSocket(url)
    ws = sock
    attach(sock, set)
  }).catch(() => scheduleReconnect(set))
}

function attach(sock: WebSocket, set: StoreApi<WsState>['setState']) {
  sock.onopen = () => { reconnectAttempt = 0; set({ connected: true }) }

  sock.onclose = () => {
    set({ connected: false })
    scheduleReconnect(set)
  }

  sock.onerror = () => { /* onclose handles it */ }

  sock.onmessage = (e) => {
    try {
      const msg = JSON.parse(e.data as string) as WsMessage
      set((state) => ({ messages: [...state.messages.slice(-99), msg] }))
    } catch { /* ignore non-JSON messages */ }
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
