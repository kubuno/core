import { create } from 'zustand'
import type { FileItem } from './api'

interface FilesPaintState {
  open:   boolean
  file:   FileItem | null
  openEditor: (file: FileItem) => void
  closeEditor: () => void
}

export const useFilesPaintStore = create<FilesPaintState>((set) => ({
  open:  false,
  file:  null,
  openEditor:  (file) => set({ open: true, file }),
  closeEditor: ()     => set({ open: false, file: null }),
}))
