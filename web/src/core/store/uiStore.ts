import { create } from 'zustand'

import { SIDEBAR_WIDTH } from './panelPrefs'

interface UiState {
  sidebarOpen:      boolean
  sidebarCollapsed: boolean
  // Largeur de la sidebar gauche dépliée (desktop). Persistée par module via
  // panelPrefs (usePanelStatePersistence).
  sidebarWidth:     number
  // Masque l'AppHeader global : les sous-modules à barre de titre l'activent et
  // hébergent eux-mêmes la recherche + les actions (gain de hauteur verticale).
  headerHidden:     boolean
  openSidebar:      () => void
  closeSidebar:     () => void
  toggleSidebar:    () => void
  toggleSidebarCollapsed: () => void
  setSidebarCollapsed: (v: boolean) => void
  setSidebarWidth:  (v: number) => void
  setHeaderHidden:  (v: boolean) => void
}

export const useUiStore = create<UiState>(set => ({
  sidebarOpen:      false,
  sidebarCollapsed: false,
  sidebarWidth:     SIDEBAR_WIDTH.DEFAULT,
  headerHidden:     false,
  openSidebar:      () => set({ sidebarOpen: true }),
  closeSidebar:     () => set({ sidebarOpen: false }),
  toggleSidebar:    () => set(s => ({ sidebarOpen: !s.sidebarOpen })),
  toggleSidebarCollapsed: () => set(s => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
  // Clamp to bounds so a stale/hand-edited stored value can never escape them.
  setSidebarWidth: (v) => set({ sidebarWidth: Math.max(SIDEBAR_WIDTH.MIN, Math.min(SIDEBAR_WIDTH.MAX, Math.round(v))) }),
  setHeaderHidden:  (v) => set({ headerHidden: v }),
}))
