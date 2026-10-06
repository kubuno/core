import { create } from 'zustand'
import type { CSSProperties } from 'react'

// Suppression « différée annulable » : au lieu de supprimer immédiatement, on
// planifie l'opération avec une fenêtre d'annulation de 5 s. Pendant ce délai,
// les éléments concernés s'affichent dans un état « en cours de suppression »
// (box colorée + non interactive) sur TOUTES les surfaces qui les rendent
// (grille files, arborescence, ModuleFileBrowser, récents StartPage), et un
// petit toast en bas à gauche propose « Annuler ».

export type DeletionKind = 'trash' | 'permanent'

export interface PendingItem {
  id:   string
  type: 'file' | 'folder'
}

export interface PendingBatch {
  id:        string
  kind:      DeletionKind
  count:     number
  label:     string   // fourni traduit par l'appelant (namespace files)
  undoLabel: string
  duration:  number   // ms
}

interface BatchInternal {
  items:  PendingItem[]
  // Retourne idéalement une Promise résolue APRÈS la disparition réelle des
  // éléments (suppression serveur + refetch) ; le style « pending » est conservé
  // jusque-là pour que les box gardent leur couleur jusqu'à disparaître.
  commit: (items: PendingItem[]) => void | Promise<unknown>
  timer:  ReturnType<typeof setTimeout>
}

// Les minuteurs / callbacks vivent hors du state Zustand (non sérialisables).
const internals = new Map<string, BatchInternal>()
let seq = 0

interface PendingDeletionState {
  batches:  PendingBatch[]
  /** id d'élément → type de suppression en cours (pour le style des box). */
  pending:  Record<string, DeletionKind>
  schedule: (opts: {
    kind:      DeletionKind
    items:     PendingItem[]
    label:     string
    undoLabel: string
    commit:    (items: PendingItem[]) => void | Promise<unknown>
    duration?: number
  }) => void
  cancel:    (batchId: string) => void
  commitNow: (batchId: string) => void
}

export const usePendingDeletionStore = create<PendingDeletionState>((set, get) => ({
  batches: [],
  pending: {},

  schedule: ({ kind, items, label, undoLabel, commit, duration = 5000 }) => {
    if (items.length === 0) return
    const id = `del_${++seq}`
    const timer = setTimeout(() => get().commitNow(id), duration)
    internals.set(id, { items, commit, timer })
    set(s => {
      const pending = { ...s.pending }
      items.forEach(it => { pending[it.id] = kind })
      return {
        batches: [...s.batches, { id, kind, count: items.length, label, undoLabel, duration }],
        pending,
      }
    })
  },

  cancel: (batchId) => {
    const internal = internals.get(batchId)
    if (internal) clearTimeout(internal.timer)
    internals.delete(batchId)
    set(s => {
      const pending = { ...s.pending }
      internal?.items.forEach(it => { delete pending[it.id] })
      return { batches: s.batches.filter(b => b.id !== batchId), pending }
    })
  },

  commitNow: (batchId) => {
    const internal = internals.get(batchId)
    internals.delete(batchId)
    if (internal) clearTimeout(internal.timer)
    // Le toast (compte à rebours) disparaît à l'expiration, MAIS on conserve les
    // entrées `pending` (donc les box restent colorées + non interactives) jusqu'à
    // ce que la suppression réelle + le refetch les retirent de l'écran.
    set(s => ({ batches: s.batches.filter(b => b.id !== batchId) }))
    if (!internal) return
    const release = () => set(s => {
      const pending = { ...s.pending }
      internal.items.forEach(it => { delete pending[it.id] })
      return { pending }
    })
    let p: void | Promise<unknown>
    try { p = internal.commit(internal.items) } catch { release(); return }
    Promise.resolve(p).then(release, release)
  },
}))

/** Type de suppression en cours pour un élément (undefined si aucun). */
export function usePendingKind(id: string): DeletionKind | undefined {
  return usePendingDeletionStore(s => s.pending[id])
}

// Couleurs (inline pour garantir l'override des classes Tailwind des cartes).
const TONE = {
  permanent: { bg: '#fee2e2', border: '#ef4444' }, // rouge (rose clair + bordure rouge)
  trash:     { bg: '#f3e8ff', border: '#a855f7' }, // violet (clair + bordure violette)
} as const

/** Classe appliquée à une box en cours de suppression (non interactive). */
export function pendingBoxClass(kind: DeletionKind | undefined): string {
  return kind ? 'pointer-events-none select-none' : ''
}

/** Style inline (fond + bordure colorés) d'une box en cours de suppression. */
export function pendingBoxStyle(kind: DeletionKind | undefined): CSSProperties | undefined {
  if (!kind) return undefined
  const c = TONE[kind]
  return { backgroundColor: c.bg, borderColor: c.border, borderWidth: 2, borderStyle: 'solid' }
}
