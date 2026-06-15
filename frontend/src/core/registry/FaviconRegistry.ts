// Registre des favicons de modules / sous-modules.
// Clé = id de module ou de sous-module (ex. 'paintsharp', 'paintsharp-apex').
// Valeur = href (URL publique ou data URI) d'une image carrée.
// La règle d'affichage (cf. DocumentTitle) : favicon du sous-module, sinon du
// module, sinon celui de Kubuno (`/favicon.svg`).

const favicons = new Map<string, string>()

export const FaviconRegistry = {
  register(id: string, href: string): void {
    favicons.set(id, href)
  },
  get(id: string): string | undefined {
    return favicons.get(id)
  },
}

/** Favicon par défaut de Kubuno (déclaré dans index.html). */
export const KUBUNO_FAVICON = '/favicon.svg'
