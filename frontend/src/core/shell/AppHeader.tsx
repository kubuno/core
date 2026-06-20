import { useState, useEffect } from 'react'
import { KubunoLogo } from '@ui'
import { Link, useLocation } from 'react-router-dom'
import { Menu, Search, ArrowLeft } from 'lucide-react'
import { useUiStore } from '../store/uiStore'
import SearchBar from './SearchBar'
import HeaderActions from './HeaderActions'

export default function AppHeader() {
  const { toggleSidebar, sidebarCollapsed } = useUiStore()
  const { pathname } = useLocation()

  // Mobile: the inline search bar competes with the logo + action cluster and
  // would push the avatar off-screen. Instead, a search icon opens a full-width
  // search overlay (Gmail-style). Desktop keeps the inline bar.
  const [searchOpen, setSearchOpen] = useState(false)
  useEffect(() => { setSearchOpen(false) }, [pathname])

  return (
    <header
      data-app-chrome
      className="relative flex-shrink-0 h-16 z-50 flex items-center px-1 gap-0"
      style={{ background: 'var(--body-bg)' }}
    >
      {/* Zone logo — même largeur que la sidebar sur desktop pour aligner la recherche */}
      <div
        className={`
          flex items-center flex-shrink-0
          lg:transition-all lg:duration-200 lg:ease-in-out
          ${sidebarCollapsed ? 'lg:w-16 lg:justify-center' : 'lg:w-64'}
        `}
      >
        {/* Hamburger — mobile / tablette uniquement */}
        <button
          onClick={toggleSidebar}
          className="lg:hidden w-12 h-12 flex items-center justify-center text-text-secondary
                     hover:bg-surface-2 rounded-full transition-colors"
          aria-label="Menu"
        >
          <Menu size={20} />
        </button>

        {/* Logo */}
        <Link
          to="/"
          className={`
            flex items-center gap-1.5 hover:opacity-90 transition-opacity
            ${sidebarCollapsed ? 'lg:px-0' : 'pl-2 pr-3'}
          `}
        >
          <KubunoLogo size={22} className="text-primary" />
          <span
            className={`text-[22px] font-normal hidden sm:block ${sidebarCollapsed ? 'lg:hidden' : ''}`}
            style={{ color: '#5f6368', letterSpacing: '-0.01em' }}
          >
            Kubuno
          </span>
        </Link>
      </div>

      {/* Barre de recherche inline — DESKTOP uniquement. `min-w-0` indispensable
          (sinon l'élément flex ne rétrécit pas et pousse les actions hors écran). */}
      <div className="hidden lg:block flex-1 min-w-0 max-w-2xl px-2">
        <SearchBar />
      </div>

      {/* Cluster droit, collé au bord (ml-auto) : icône de recherche (mobile) +
          actions. `ml-auto` reproduit le comportement desktop d'origine où la
          recherche est `flex-1 max-w-2xl` et les actions sont alignées à droite. */}
      <div className="ml-auto flex items-center flex-shrink-0">
        {/* Icône de recherche — mobile uniquement, ouvre la superposition. */}
        <button
          onClick={() => setSearchOpen(true)}
          className="lg:hidden w-12 h-12 flex items-center justify-center text-text-secondary
                     hover:bg-surface-2 rounded-full transition-colors flex-shrink-0"
          aria-label="Rechercher"
        >
          <Search size={20} />
        </button>

        {/* Actions (cluster réutilisable, partagé avec les barres de titre de sous-module) */}
        <HeaderActions />
      </div>

      {/* Superposition de recherche plein-écran (mobile) */}
      {searchOpen && (
        <div
          data-app-chrome
          className="lg:hidden absolute inset-0 z-[60] flex items-center gap-1 px-1"
          style={{ background: 'var(--body-bg)' }}
        >
          <button
            onClick={() => setSearchOpen(false)}
            className="w-12 h-12 flex items-center justify-center text-text-secondary
                       hover:bg-surface-2 rounded-full transition-colors flex-shrink-0"
            aria-label="Retour"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1 min-w-0 pr-1">
            <SearchBar />
          </div>
        </div>
      )}
    </header>
  )
}
