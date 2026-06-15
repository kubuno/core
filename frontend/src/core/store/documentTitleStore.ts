import { create } from 'zustand'

// Nom du fichier/document actuellement ouvert (ex. dans un éditeur). Renseigné par
// WorkspaceShell quand un titre éditable est présent, consommé par <DocumentTitle>
// pour composer le titre de l'onglet. `null` hors d'un éditeur de fichier.
interface DocumentTitleState {
  fileName: string | null
  setFileName: (name: string | null) => void
}

export const useDocumentTitleStore = create<DocumentTitleState>((set) => ({
  fileName: null,
  setFileName: (name) => set({ fileName: name && name.trim() ? name.trim() : null }),
}))
