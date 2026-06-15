import { create } from 'zustand'
import type { BatchRenameItem } from './BatchRenameModal'

// Pont d'ouverture du renommage en lot : permet de le déclencher depuis le menu
// contextuel d'un élément (sélection) OU depuis le menu de la zone vide (tout le
// dossier courant), même si ces menus sont des composants découplés.
interface BatchRenameState {
  open:  boolean
  items: BatchRenameItem[]
  start: (items: BatchRenameItem[]) => void
  close: () => void
}

export const useBatchRenameStore = create<BatchRenameState>((set) => ({
  open:  false,
  items: [],
  start: (items) => set({ open: items.length > 0, items }),
  close: () => set({ open: false, items: [] }),
}))
