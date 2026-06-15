import { KubunoLogo } from '@ui'
import { Link } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { useUiStore } from '../store/uiStore'
import SearchBar from './SearchBar'
import HeaderActions from './HeaderActions'

export default function AppHeader() {
  const { toggleSidebar, sidebarCollapsed } = useUiStore()

  return (
    <header
      className="flex-shrink-0 h-16 z-50 flex items-center px-1 gap-0"
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

      {/* Barre de recherche — alignée à gauche, bord de la zone centrale */}
      <div className="flex-1 max-w-2xl px-2">
        <SearchBar />
      </div>

      {/* Actions droite (cluster réutilisable, partagé avec les barres de titre de sous-module) */}
      <div className="ml-auto">
        <HeaderActions />
      </div>
    </header>
  )
}
