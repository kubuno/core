import { Suspense } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { KubunoLogo } from '@ui'
import { useAuthStore } from './core/store/authStore'
import { useModulesStore } from './core/store/modulesStore'
import { RouteRegistry } from './core/registry/RouteRegistry'
import Shell from './core/shell/Shell'
import { DocumentTitle } from './core/shell/DocumentTitle'
import LoginPage from './core/auth/LoginPage'
import RegisterPage from './core/auth/RegisterPage'
import ForgotPasswordPage from './core/auth/ForgotPasswordPage'
import OAuthCallback from './core/auth/OAuthCallback'
import SettingsPage from './core/settings/SettingsPage'
import AdminPage from './core/admin/AdminPage'
import HomePage from './core/pages/HomePage'
import ModulesPage from './core/pages/ModulesPage'
import AboutPage from './core/pages/AboutPage'
import PromptHost from './core/components/PromptHost'
import PendingDeletionHost from './core/components/PendingDeletionHost'

// ── Modules ───────────────────────────────────────────────────────────────────
// Le host ne nomme AUCUN module : ils sont chargés à l'exécution depuis le
// registre du core (cf. core/modules/loadRemoteModules.ts, déclenché par
// modulesStore.fetchModules) via leurs bundles publiés /modules/<id>/entry.js.
// (Plus d'import statique : chaque module vit dans son propre dépôt.)

// Écran de chargement initial (avant que la session soit résolue).
function LoadingSplash() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <KubunoLogo size={52} className="text-primary animate-pulse" />
      <span className="text-text-secondary text-sm">Chargement…</span>
    </div>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isInitialized } = useAuthStore()
  const modulesReady = useModulesStore((s) => s.modulesReady)
  const location = useLocation()
  if (!isInitialized) return <LoadingSplash />
  // Déconnexion (token expiré sur le même onglet) → on mémorise la page courante
  // pour y revenir après reconnexion (sauf l'accueil, inutile).
  if (!user) {
    // L'URL courante pourrait être une route PUBLIQUE de module pas encore
    // enregistrée (bundles chargés à l'exécution). Tant que le premier chargement
    // des modules n'est pas terminé, patienter au lieu de rediriger vers /login —
    // sinon un répondant anonyme d'un formulaire public serait expulsé.
    if (!modulesReady) return <LoadingSplash />
    const from = location.pathname + location.search
    return <Navigate to="/login" replace state={from !== '/' ? { from } : undefined} />
  }
  return <>{children}</>
}

// Pages publiques (login, register…) : rediriger vers l'accueil si déjà connecté —
// ou vers la page d'origine si on a été redirigé ici par une déconnexion.
function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { user, isInitialized } = useAuthStore()
  const location = useLocation()
  if (!isInitialized) return <LoadingSplash />
  if (user) {
    const from = (location.state as { from?: string } | null)?.from
    return <Navigate to={from ?? '/'} replace />
  }
  return <>{children}</>
}

function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <p className="text-6xl font-bold text-text-tertiary mb-4">404</p>
      <p className="text-lg font-medium text-text-primary mb-2">Page introuvable</p>
      <a href="/" className="text-primary hover:underline text-sm">Retour à l'accueil</a>
    </div>
  )
}

// Route non reconnue. Sur un rechargement dur d'une route de module, les bundles
// UI se chargent à l'exécution : tant que ce premier chargement n'est pas terminé,
// la route du module n'existe pas encore dans RouteRegistry → on afficherait un 404
// fugace. On patiente avec un écran de chargement jusqu'à ce que les modules soient
// prêts ; seulement alors une route toujours non résolue est un vrai 404.
function UnmatchedRoute() {
  const ready = useModulesStore((s) => s.modulesReady)
  return ready ? <NotFoundPage /> : <LoadingSplash />
}

export default function App() {
  // Se re-rend quand un bundle de module est chargé à l'exécution : les routes
  // enregistrées par le module (RouteRegistry, non réactif) sont alors prises en compte.
  useModulesStore((s) => s.loadedVersion)
  return (
    <>
    <DocumentTitle />
    <Routes>
      {/* Pages publiques core — redirigent vers l'accueil si déjà connecté */}
      <Route path="/login"           element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
      <Route path="/register"        element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />
      <Route path="/forgot-password" element={<PublicOnlyRoute><ForgotPasswordPage /></PublicOnlyRoute>} />
      <Route path="/auth/oauth/:provider/callback" element={<OAuthCallback />} />

      {/* Pages publiques des modules */}
      {RouteRegistry.getPublicRoutes().map(({ path, Component, props = {} }) => (
        <Route key={path} path={`/${path}`} element={
          <Suspense fallback={null}><Component {...props} /></Suspense>
        } />
      ))}

      {/* Shell protégé */}
      <Route path="/" element={<ProtectedRoute><Shell /></ProtectedRoute>}>
        <Route index         element={<HomePage />} />
        <Route path="modules"  element={<ModulesPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="admin"    element={<AdminPage />} />
        <Route path="about"    element={<AboutPage />} />

        {/* Routes des modules — enregistrées dynamiquement dans register.ts */}
        {RouteRegistry.getShellRoutes().map(({ path, Component, props = {} }) => (
          <Route key={path} path={path} element={
            <Suspense fallback={null}><Component {...props} /></Suspense>
          } />
        ))}

        <Route path="*" element={<UnmatchedRoute />} />
      </Route>
    </Routes>
    <PromptHost />
    <PendingDeletionHost />
    </>
  )
}
