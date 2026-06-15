// Thème du WorkspaceShell — la chrome partagée des applications avancées (éditeurs
// Office, PaintSharp, …). Même forme que l'ancien thème PaintSharp (`paintsharp/ui/theme`) plus
// `topbarBg`/`statusBg` optionnels (barres titre/statut, plus sombres que `header`
// côté PaintSharp). Repli sur '#111' si absents → comportement PaintSharp historique inchangé.
export type WorkspaceTheme = {
  bg:       string   // fond du corps / canvas
  panel:    string   // fond des panneaux (DockArea), menus déroulants
  toolbar:  string   // rail d'outils, en-têtes de panneaux
  header:   string   // barre de menus + options bar
  active:   string   // onglet/hover actif
  border:   string   // séparateurs
  accent:   string   // sélection/actif
  text:     string
  textDim:  string
  topbarBg?: string  // barre de titre (défaut '#111')
  topbarText?: string // si défini → topbar COLORÉE (texte/icônes de cette couleur, hovers
                      //   translucides) indépendamment de `dark` → look « ruban coloré » Office
                      //   (bandeau bleu + onglet actif blanc). La bande d'onglets du ruban
                      //   réutilise `topbarBg` pour se fondre dans la topbar.
  statusBg?: string  // barre de statut (défaut '#111')
  dark?:    boolean  // true → topbar/menus style PaintSharp (sombre) ; false → style Documents (clair)
}

// Sombre — reprend la palette PaintSharp (Photoshop-like), pour que les éditeurs PaintSharp
// restent visuellement identiques après la bascule sur le shell core.
export const WORKSPACE_DARK: WorkspaceTheme = {
  bg: '#1e1e1e', panel: '#323232', toolbar: '#393939', header: '#2b2b2b',
  active: '#454545', border: '#212121', accent: '#5a9bdc', text: '#d6d6d6', textDim: '#8e8e8e',
  topbarBg: '#111111', statusBg: '#111111', dark: true,
}

// Clair — pour les apps Office (Documents, Tableur, …), aligné sur le design system.
export const WORKSPACE_LIGHT: WorkspaceTheme = {
  bg: '#ffffff', panel: '#f8f9fa', toolbar: '#f1f3f4', header: '#ffffff',
  active: '#e8eaed', border: '#dadce0', accent: '#1a73e8', text: '#202124', textDim: '#5f6368',
  topbarBg: '#ffffff', statusBg: '#f8f9fa', dark: false,
}

// Office « ruban coloré » (façon Word) — base claire (corps + ruban blancs) MAIS topbar
// + bande d'onglets BLEUES (texte blanc), onglet actif blanc à coins arrondis se fondant
// dans le contenu. Utilisé par OfficeShell (tous les sous-éditeurs Office).
export const WORKSPACE_OFFICE: WorkspaceTheme = {
  bg: '#ffffff', panel: '#f8f9fa', toolbar: '#f1f3f4', header: '#ffffff',
  active: '#e8f0fe', border: '#dadce0', accent: '#1a73e8', text: '#202124', textDim: '#5f6368',
  topbarBg: '#1557b0', topbarText: '#ffffff', statusBg: '#f8f9fa', dark: false,
}
