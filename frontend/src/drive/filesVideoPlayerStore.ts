import { create } from 'zustand'
import type { FileItem } from './api'

interface FilesVideoPlayerState {
  file:            FileItem | null
  restorePosition: number
  open:                  (file: FileItem) => void
  close:                 () => void
  _clearRestorePosition: () => void
}

const SESSION_KEY = 'kubuno:files:video'

type Snapshot = { file: FileItem; position: number }

function loadSnapshot(): Snapshot | null {
  try {
    const s = sessionStorage.getItem(SESSION_KEY)
    return s ? (JSON.parse(s) as Snapshot) : null
  } catch { return null }
}

const _snap = loadSnapshot()

export const useFilesVideoPlayerStore = create<FilesVideoPlayerState>((set, get) => {
  window.addEventListener('beforeunload', () => {
    const st = get()
    if (st.file) {
      try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify({
          file:     st.file,
          position: (window as Window & { __filesVideoPos?: number }).__filesVideoPos ?? 0,
        }))
      } catch {}
    } else {
      try { sessionStorage.removeItem(SESSION_KEY) } catch {}
    }
  })

  return {
    file:            _snap?.file     ?? null,
    restorePosition: _snap?.position ?? 0,

    open:  (file) => set({ file, restorePosition: 0 }),
    close: () => {
      try { sessionStorage.removeItem(SESSION_KEY) } catch {}
      set({ file: null, restorePosition: 0 })
    },
    _clearRestorePosition: () => set({ restorePosition: 0 }),
  }
})
