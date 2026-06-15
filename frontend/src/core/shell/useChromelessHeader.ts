import { useEffect } from 'react'
import { useUiStore } from '../store/uiStore'

// À appeler par un sous-module qui possède sa propre barre de titre : masque
// l'AppHeader global pendant que la page est montée (et le restaure en sortie).
// Le sous-module héberge alors <SearchBar/> + <HeaderActions/> dans sa barre de
// titre pour récupérer la recherche et les actions sans la rangée globale.
export function useChromelessHeader() {
  const setHeaderHidden = useUiStore(s => s.setHeaderHidden)
  useEffect(() => {
    setHeaderHidden(true)
    return () => setHeaderHidden(false)
  }, [setHeaderHidden])
}
