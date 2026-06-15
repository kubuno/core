import { create } from 'zustand'

interface UiState {
  sidebarOpen:      boolean
  sidebarCollapsed: boolean
  // Masque l'AppHeader global : les sous-modules à barre de titre l'activent et
  // hébergent eux-mêmes la recherche + les actions (gain de hauteur verticale).
  headerHidden:     boolean
  openSidebar:      () => void
  closeSidebar:     () => void
  toggleSidebar:    () => void
  toggleSidebarCollapsed: () => void
  setSidebarCollapsed: (v: boolean) => void
  setHeaderHidden:  (v: boolean) => void
}

export const useUiStore = create<UiState>(set => ({
  sidebarOpen:      false,
  sidebarCollapsed: false,
  headerHidden:     false,
  openSidebar:      () => set({ sidebarOpen: true }),
  closeSidebar:     () => set({ sidebarOpen: false }),
  toggleSidebar:    () => set(s => ({ sidebarOpen: !s.sidebarOpen })),
  toggleSidebarCollapsed: () => set(s => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
  setHeaderHidden:  (v) => set({ headerHidden: v }),
}))
