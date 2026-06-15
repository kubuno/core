import { useCallback, useEffect, useRef } from 'react'

// Sauvegarde automatique fiable pour les éditeurs PaintSharp.
//
// Sauve `delay` ms après la DERNIÈRE modification (debounce), + flush périodique
// (filet de sécurité) + flush au démontage et à la fermeture de l'onglet.
//
// Corrige le bug commun des éditeurs : un `setInterval(…, 30s)` dont l'effet
// dépendait de l'état édité se réinitialisait à chaque frappe → ne sauvegardait
// jamais pendant l'édition continue.
//
// La première valeur (état chargé) sert de référence et n'est PAS resauvegardée ;
// seules les modifications ultérieures déclenchent une sauvegarde. Renvoie un
// `flush()` à appeler manuellement (ex. avant un changement de page).
export function useDebouncedAutosave<T>(
  data: T,
  enabled: boolean,
  save: (data: T) => void,
  delay = 1500,
): () => void {
  const dataRef     = useRef(data)
  const lastSaved   = useRef<string | null>(null)
  const timer       = useRef<ReturnType<typeof setTimeout> | null>(null)
  const saveRef     = useRef(save)
  const enabledRef  = useRef(enabled)
  saveRef.current    = save
  enabledRef.current = enabled

  const flush = useCallback(() => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null }
    if (!enabledRef.current) return
    const cur = JSON.stringify(dataRef.current)
    if (lastSaved.current !== null && cur !== lastSaved.current) {
      lastSaved.current = cur
      saveRef.current(dataRef.current)
    }
  }, [])

  useEffect(() => {
    dataRef.current = data
    const cur = JSON.stringify(data)
    // Première valeur sous état activé = référence (état chargé) : pas de save.
    if (lastSaved.current === null) {
      if (enabledRef.current) lastSaved.current = cur
      return
    }
    if (cur === lastSaved.current) return
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(flush, delay)
  }, [data, flush, delay])

  useEffect(() => {
    const safety = setInterval(flush, 15_000)
    const onUnload = () => flush()
    window.addEventListener('beforeunload', onUnload)
    return () => {
      clearInterval(safety)
      window.removeEventListener('beforeunload', onUnload)
      flush()
    }
  }, [flush])

  return flush
}
