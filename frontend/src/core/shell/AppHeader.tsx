import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { KubunoLogo } from '@ui'
import { Link, useLocation } from 'react-router-dom'
import { Menu, Search, ArrowLeft } from 'lucide-react'
import { useUiStore } from '../store/uiStore'
import { useSearchStore, resolveSearchConfig } from '../store/searchStore'
import SearchBar from './SearchBar'
import HeaderActions from './HeaderActions'
import { Slot } from '../slots/SlotRegistry'

export default function AppHeader() {
  const { t } = useTranslation()
  const { toggleSidebar, toggleSidebarCollapsed, sidebarCollapsed } = useUiStore()
  const { pathname } = useLocation()

  // The home page renders no sidebar, so its collapse toggle would be a no-op —
  // hide the desktop hamburger there (mobile keeps its own drawer button).
  const isHome = pathname === '/'

  // Opt-out : un module peut demander à garder la barre de recherche INLINE
  // permanente (ancienne méthode) au lieu de la loupe → mode recherche. Ex : mail.
  const searchConfigs = useSearchStore((s) => s.configs)
  const inlineSearch  = !!resolveSearchConfig(searchConfigs, pathname)?.inline

  // Search is a magnifying glass among the right-side icons (like Google Calendar):
  // clicking it turns the whole header into a full-width search mode (back arrow +
  // centred field), hiding everything else. Same model on desktop and mobile.
  const [searchOpen, setSearchOpen] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)
  useEffect(() => { setSearchOpen(false) }, [pathname])

  // Focus the field the moment search mode opens, and close it on Escape.
  useEffect(() => {
    if (!searchOpen) return
    overlayRef.current?.querySelector('input')?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSearchOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [searchOpen])

  return (
    <header
      data-app-chrome
      className="relative flex-shrink-0 h-16 z-50 flex items-center gap-0"
      style={{ background: 'var(--body-bg)' }}
    >
      {/* Zone logo — largeur FIXE : la bande supérieure (logo, recherche, actions)
          reste identique quel que soit l'état de la sidebar. Seule la sidebar se
          replie ; l'en-tête ne bouge pas. */}
      <div className="flex items-center flex-shrink-0 lg:w-64">
        {/* Hamburger — mobile / tablette : ouvre le tiroir de navigation. */}
        <button
          onClick={toggleSidebar}
          className="lg:hidden w-12 h-12 flex items-center justify-center text-text-secondary
                     hover:bg-surface-2 rounded-full transition-colors"
          aria-label="Menu"
        >
          <Menu size={20} />
        </button>

        {/* Hamburger — desktop, façon Gmail : placé AVANT le logo, il replie la
            barre latérale en rail d'icônes (et la rouvre). Absent sur l'accueil,
            qui n'a pas de barre latérale. */}
        {!isHome && (
          <button
            onClick={toggleSidebarCollapsed}
            className="hidden lg:flex w-10 h-10 items-center justify-center flex-shrink-0
                       text-text-secondary hover:bg-surface-2 rounded-full transition-colors"
            aria-label={sidebarCollapsed ? t('shell.expand_sidebar') : t('shell.collapse_sidebar')}
          >
            <Menu size={20} />
          </button>
        )}

        {/* Logo — toujours pleine forme (marque + « Kubuno »), indépendant du repli. */}
        <Link
          to="/"
          className="flex items-center gap-1.5 hover:opacity-90 transition-opacity pl-2 pr-3"
        >
          <KubunoLogo size={22} className="text-primary" />
          <span
            className="text-[22px] font-normal hidden sm:block"
            style={{ color: '#5f6368', letterSpacing: '-0.01em' }}
          >
            Kubuno
          </span>
        </Link>
      </div>

      {/* Zone centrale, alignée à gauche après le logo.
          - Modules « inline » (ex. mail) : barre de recherche PERMANENTE (ancienne
            méthode), aucune loupe.
          - Autres : les modules y injectent leur chrome d'en-tête (nav de date de
            l'agenda…) via le slot `header-leading`. */}
      <div className="flex items-center min-w-0 flex-1 pl-1">
        {inlineSearch
          ? <div className="min-w-0 flex-1 max-w-2xl px-1"><SearchBar /></div>
          : <Slot name="header-leading" />}
      </div>

      {/* Cluster droit, collé au bord (ml-auto). La recherche n'est plus une barre
          permanente : juste une loupe, en tête du cluster (façon Google Agenda) —
          sauf pour les modules « inline » qui gardent leur barre permanente. */}
      <div className="ml-auto flex items-center flex-shrink-0">
        {/* Loupe — ouvre le mode recherche (desktop ET mobile). Masquée en mode inline. */}
        {!inlineSearch && (
        <button
          onClick={() => setSearchOpen(true)}
          className="w-12 h-12 flex items-center justify-center text-text-secondary
                     hover:bg-surface-3 rounded-full transition-colors flex-shrink-0"
          aria-label={t('common.search')}
        >
          <Search size={20} />
        </button>
        )}

        {/* Actions (cluster réutilisable, partagé avec les barres de titre de sous-module) */}
        <HeaderActions />
      </div>

      {/* Mode recherche — prend TOUT l'en-tête : flèche retour + champ centré. Tout le
          reste (logo, actions, gaufrier) est masqué le temps de la recherche. Identique
          sur desktop et mobile. Escape ou la flèche retour ferment. */}
      {searchOpen && !inlineSearch && (
        <div
          ref={overlayRef}
          data-app-chrome
          className="absolute inset-0 z-[60] flex items-center px-1"
          style={{ background: 'var(--body-bg)' }}
        >
          {/* Retour + libellé dans une zone de MÊME largeur que la zone logo (`lg:w-64`)
              → le champ démarre exactement là où la barre de recherche se trouvait à
              l'origine dans l'AppShell (alignée sur la fin de la zone logo). */}
          <div className="flex items-center flex-shrink-0 lg:w-64">
            <button
              onClick={() => setSearchOpen(false)}
              className="w-12 h-12 flex items-center justify-center text-text-secondary
                         hover:bg-surface-3 rounded-full transition-colors flex-shrink-0"
              aria-label={t('common.back')}
            >
              <ArrowLeft size={20} />
            </button>
            <span className="hidden lg:block text-lg text-text-secondary pl-1 flex-shrink-0">{t('common.search')}</span>
          </div>
          <div className="flex-1 min-w-0 max-w-2xl px-2"><SearchBar /></div>
          <div className="hidden lg:flex items-center flex-shrink-0 ml-auto">
            <HeaderActions minimal />
          </div>
        </div>
      )}
    </header>
  )
}
