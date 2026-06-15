import axios, { type AxiosError } from 'axios'

export const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true, // pour le cookie refresh_token
})

// Injecte le Bearer token depuis le store
api.interceptors.request.use((config) => {
  // Import dynamique pour éviter la dépendance circulaire
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Refresh token automatique sur 401
let isRefreshing = false
let refreshQueue: Array<(token: string) => void> = []

api.interceptors.response.use(
  (response) => {
    // If the server returned HTML instead of JSON, the module isn't running.
    const ct = String(response.headers['content-type'] ?? '')
    if (ct.includes('text/html') && response.config.url && !response.config.url.includes('/auth/')) {
      return Promise.reject({ message: 'Module non disponible (service inactif)', code: 'MODULE_UNAVAILABLE' })
    }
    return response
  },
  async (error: AxiosError) => {
    const original = error.config!

    // Ne pas retenter sur l'endpoint de refresh lui-même (évite la boucle infinie)
    const isRefreshEndpoint = original.url?.includes('/auth/refresh')
    if (error.response?.status !== 401 || (original as { _retry?: boolean })._retry || isRefreshEndpoint) {
      return Promise.reject(normalizeError(error))
    }

    ;(original as { _retry?: boolean })._retry = true

    if (isRefreshing) {
      return new Promise((resolve) => {
        refreshQueue.push((token: string) => {
          original.headers.Authorization = `Bearer ${token}`
          resolve(api(original))
        })
      })
    }

    isRefreshing = true
    try {
      const { data } = await axios.post('/api/v1/auth/refresh', {}, { withCredentials: true })
      const newToken: string = data.access_token
      setAccessToken(newToken)
      refreshQueue.forEach((cb) => cb(newToken))
      refreshQueue = []
      original.headers.Authorization = `Bearer ${newToken}`
      return api(original)
    } catch {
      refreshQueue = []
      clearAccessToken()
      // Pas de window.location.href ici : React Router gère la redirection
      // via ProtectedRoute → <Navigate to="/login" /> quand user === null
      return Promise.reject(error)
    } finally {
      isRefreshing = false
    }
  }
)

function normalizeError(error: AxiosError): { message: string; code: string } {
  const data = error.response?.data as { message?: string; error?: string } | undefined
  return {
    message: data?.message ?? error.message ?? 'Erreur inconnue',
    code: data?.error ?? 'UNKNOWN',
  }
}

// Callbacks pour lire/écrire le token sans créer de cycle d'import
let _getToken: (() => string | null) = () => null
let _setToken: ((t: string) => void) = () => {}
let _clearToken: (() => void) = () => {}

export function registerTokenHandlers(
  get: () => string | null,
  set: (t: string) => void,
  clear: () => void
) {
  _getToken = get
  _setToken = set
  _clearToken = clear
}

export function writeTokenCookie(t: string | null) {
  if (t) {
    const secure = window.location.protocol === 'https:' ? '; Secure' : ''
    document.cookie = `access_token=${t}; path=/; SameSite=Strict; max-age=900${secure}`
  } else {
    document.cookie = 'access_token=; path=/; SameSite=Strict; max-age=0'
  }
}

function getAccessToken() { return _getToken() }
function setAccessToken(t: string) { _setToken(t); writeTokenCookie(t) }
function clearAccessToken() { _clearToken(); writeTokenCookie(null) }
