import { create } from 'zustand'

interface ImageCacheState {
  versions: Record<string, number>
  // Version GLOBALE ajoutée à toutes les vignettes : l'incrémenter force le
  // re-téléchargement de TOUTES les miniatures (ex. menu « Actualiser »).
  global: number
  bump: (id: string) => void
  bumpAll: () => void
}

export const useImageCacheStore = create<ImageCacheState>((set) => ({
  versions: {},
  global: 0,
  bump: (id) => set(s => ({
    versions: { ...s.versions, [id]: (s.versions[id] ?? 0) + 1 },
  })),
  bumpAll: () => set(s => ({ global: s.global + 1 })),
}))

// Callable outside React (e.g. in save handlers)
export const bumpImageCache = (id: string) => useImageCacheStore.getState().bump(id)
export const bumpAllImageCache = () => useImageCacheStore.getState().bumpAll()
