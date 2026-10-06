/**
 * The parts of `AppHeader.kbview` still written in React (the codemod could not convert them; see the
 * TODO comments in the view). Each is rendered by a `<ReactHost>` with the values it reads as props.
 */
import { ArrowLeft } from "lucide-react"
import SearchBar from "./SearchBar"
import HeaderActions from "./HeaderActions"
import type { AppHeader } from './AppHeader'

export function Part1({ overlayRef, setSearchOpen, t }: { overlayRef: NonNullable<AppHeader['overlayRef']>; setSearchOpen: NonNullable<AppHeader['setSearchOpen']>; t: NonNullable<AppHeader['tr']> }) {
  return (
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
              {/* px-1 (overlay) + pr-1 = 8px : l'avatar garde exactement la même
                  position qu'en mode normal (pr-2). */}
              <div className="hidden lg:flex items-center flex-shrink-0 ml-auto pr-1">
                <HeaderActions minimal />
              </div>
            </div>
  )
}
