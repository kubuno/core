import { StrictMode } from 'react'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { createRoot } from 'react-dom/client'
import * as ReactJsxRuntime from 'react/jsx-runtime'
import * as ReactRouterDom from 'react-router-dom'
import { BrowserRouter } from 'react-router-dom'
import * as TanstackReactQuery from '@tanstack/react-query'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as Zustand from 'zustand'
import * as ReactI18next from 'react-i18next'
import * as I18next from 'i18next'
import { useAuthStore } from './core/store/authStore'

// ── Shim `require` global pour les bundles de modules (chargés à l'exécution) ──
// Une dépendance CJS bundlée dans un module (ex. use-sync-external-store tiré par
// @react-three) fait `require("react")`. Avec react EXTERNAL, le helper require de
// rolldown lève « Calling require for react in an environment that doesn't expose
// require » → le chunk plante → vite:preloadError → boucle de rechargement.
// Le helper rolldown utilise `globalThis.require` s'il existe : on le fournit, mappé
// sur les instances UNIQUES du host (mêmes que celles résolues par l'import map).
{
  const shared: Record<string, unknown> = {
    'react': React,
    'react-dom': ReactDOM,
    'react-dom/client': ReactDOM,
    'react/jsx-runtime': ReactJsxRuntime,
    'react/jsx-dev-runtime': ReactJsxRuntime,
    'react-router-dom': ReactRouterDom,
    '@tanstack/react-query': TanstackReactQuery,
    'zustand': Zustand,
    'react-i18next': ReactI18next,
    'i18next': I18next,
  }
  const g = globalThis as unknown as { require?: (id: string) => unknown }
  if (typeof g.require === 'undefined') {
    g.require = (id: string) => {
      if (id in shared) return shared[id]
      throw new Error(`require("${id}") indisponible dans le navigateur`)
    }
  }
}
import { useModulesStore } from './core/store/modulesStore'
import { useWsStore } from './core/store/wsStore'
import { useThemeStore } from './core/store/themeStore'
import './core/i18n'
import './core/i18n/nav'
import './core/widgets/coreWidgets'
import { applyUserLanguage } from './core/i18n'
import App from './App'
import './index.css'

// Robustesse déploiement : après une mise à jour, les chunks lazy (hash changé)
// référencés par un onglet déjà ouvert renvoient 404 → tout `import()` dynamique
// (ex. ouverture d'un fichier kb*** via FileTypeRegistry → `import('./api')`)
// échoue silencieusement. On recharge UNE fois pour récupérer le nouveau manifest.
// Garde anti-boucle via sessionStorage, réinitialisée à chaque chargement réussi.
const RELOAD_AT = 'kb_chunk_reload_at'
function handleChunkError() {
  // Garde anti-boucle robuste : au plus un rechargement par 30 s. Si l'erreur
  // PERSISTE après rechargement (chunk définitivement cassé, pas juste périmé),
  // on n'entre PAS dans une boucle infinie — on laisse l'erreur visible.
  const last = Number(sessionStorage.getItem(RELOAD_AT) || 0)
  if (Date.now() - last < 30_000) return
  sessionStorage.setItem(RELOAD_AT, String(Date.now()))
  window.location.reload()
}
window.addEventListener('vite:preloadError', (e) => { e.preventDefault(); handleChunkError() })
window.addEventListener('unhandledrejection', (e) => {
  const msg = String((e.reason && (e.reason.message || e.reason)) || '')
  if (/dynamically imported module|Importing a module script failed|Loading chunk|ChunkLoadError/i.test(msg)) {
    handleChunkError()
  }
})

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
})

// Monter React immédiatement — App gère l'état isInitialized via ProtectedRoute
const root = document.getElementById('root')
if (!root) throw new Error('Root element manquant')

createRoot(root).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>
)

// Connecter/déconnecter le WebSocket et recharger les modules à chaque changement de session
useAuthStore.subscribe((state, prev) => {
  if (state.user && !prev.user) {
    // Login ou restore de session
    applyUserLanguage((state.user.preferences as { language?: string } | undefined)?.language)
    useModulesStore.getState().fetchModules()
    if (state.accessToken) {
      useWsStore.getState().connect(state.accessToken)
    }
  }
  if (!state.user && prev.user) {
    // Logout
    useWsStore.getState().disconnect()
    useModulesStore.getState().fetchModules()
  }
})

// Réagir aux events WebSocket : recharger les modules et invalider les stats admin
useWsStore.subscribe((state, prev) => {
  if (state.messages.length !== prev.messages.length) {
    const lastMsg = state.messages[state.messages.length - 1]
    if (lastMsg?.type === 'event') {
      const evtType = (lastMsg.payload as { type?: string })?.type
      if (
        evtType === 'ModuleRegistered' ||
        evtType === 'ModuleUnregistered' ||
        evtType === 'ModuleHealthChanged'
      ) {
        useModulesStore.getState().fetchModules()
        queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
      }
      if (
        evtType === 'UserCreated' ||
        evtType === 'UserDeleted' ||
        evtType === 'UserUpdated' ||
        evtType === 'QuotaUpdated' ||
        evtType === 'FileUploaded' ||
        evtType === 'FileDeleted'
      ) {
        queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
      }
    }
  }
})

// Bootstrap asynchrone après le montage initial
async function bootstrap() {
  // Charger les thèmes en premier pour éviter le flash de thème par défaut
  useThemeStore.getState().fetchThemes()
  // Charger les modules dès le démarrage, SANS attendre l'authentification : les
  // routes publiques des modules (ex. forms/public/:token pour un répondant
  // anonyme) doivent voir leurs bundles importés et leurs routes enregistrées
  // avant le rendu. Idempotent : un nouveau fetch après login ne recharge rien.
  useModulesStore.getState().fetchModules()
  const { initialize } = useAuthStore.getState()
  await initialize()
}

bootstrap()
