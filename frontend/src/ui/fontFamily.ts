// Résolution du VRAI nom de famille d'une police (table `name` du format sfnt).
//
// Problème résolu : un dossier de polices contient un fichier par STYLE
// (calibri.ttf, calibrib.ttf=gras, calibril.ttf=light, calibrii.ttf=italique,
// calibriz.ttf=gras italique…). Utiliser le nom de FICHIER comme famille CSS fait
// apparaître « CALIBRIB », « CALIBRIL »… comme des familles distinctes. La vraie
// famille (« Calibri ») vit dans la table `name` du fichier (nameID 16/1) ; le style
// (gras/italique/poids) dans le sous-style (nameID 17/2). On les lit pour enregistrer
// chaque fichier sous la BONNE famille + poids + style, et ne proposer qu'« Calibri ».

export interface FontMeta {
  family: string        // famille typographique (« Calibri », « Calibri Light »…)
  subfamily: string     // « Regular » | « Bold » | « Italic » | « Bold Italic »…
  weight: number        // 100..900 (déduit du sous-style / OS-2)
  style: 'normal' | 'italic'
}

const TAG = (s: string) => (s.charCodeAt(0) << 24) | (s.charCodeAt(1) << 16) | (s.charCodeAt(2) << 8) | s.charCodeAt(3)
const NAME = TAG('name'), TTCF = TAG('ttcf'), OS2 = TAG('OS/2')

// Déduit poids + italique d'une chaîne de sous-style (« Bold Italic », « Light »…).
function styleFromSubfamily(sub: string): { weight: number; style: 'normal' | 'italic' } {
  const s = sub.toLowerCase()
  const style: 'normal' | 'italic' = /italic|oblique/.test(s) ? 'italic' : 'normal'
  let weight = 400
  if (/thin|hairline/.test(s)) weight = 100
  else if (/extra\s*light|ultra\s*light/.test(s)) weight = 200
  else if (/semi\s*light|demi\s*light/.test(s)) weight = 350
  else if (/light/.test(s)) weight = 300
  else if (/medium/.test(s)) weight = 500
  else if (/semi\s*bold|demi\s*bold/.test(s)) weight = 600
  else if (/extra\s*bold|ultra\s*bold/.test(s)) weight = 800
  else if (/black|heavy/.test(s)) weight = 900
  else if (/bold/.test(s)) weight = 700
  return { weight, style }
}

/**
 * Lit la famille/sous-famille d'une police depuis ses octets (TTF/OTF/TTC non
 * compressés). Renvoie `null` si illisible (ex. WOFF/WOFF2 compressés) → l'appelant
 * retombe sur le nom de fichier.
 */
export function parseFontMeta(buf: ArrayBuffer): FontMeta | null {
  try {
    const dv = new DataView(buf)
    let numTables: number, dirOffset: number
    if (dv.getUint32(0) === TTCF) {
      const first = dv.getUint32(12)     // offset de la 1ʳᵉ police de la collection
      numTables = dv.getUint16(first + 4)
      dirOffset = first + 12
    } else {
      numTables = dv.getUint16(4)
      dirOffset = 12
    }
    let nameOff = -1, os2Off = -1
    for (let i = 0; i < numTables; i++) {
      const rec = dirOffset + i * 16
      const tag = dv.getUint32(rec)
      if (tag === NAME) nameOff = dv.getUint32(rec + 8)
      else if (tag === OS2) os2Off = dv.getUint32(rec + 8)
    }
    if (nameOff < 0) return null

    const count = dv.getUint16(nameOff + 2)
    const strOff = nameOff + dv.getUint16(nameOff + 4)
    // Meilleur enregistrement pour un nameID donné (préférence Windows/anglais).
    const pick = (id: number): string | null => {
      let best: { score: number; s: string } | null = null
      for (let i = 0; i < count; i++) {
        const r = nameOff + 6 + i * 12
        if (dv.getUint16(r + 6) !== id) continue
        const platform = dv.getUint16(r), lang = dv.getUint16(r + 4)
        const len = dv.getUint16(r + 8), off = dv.getUint16(r + 10)
        const base = strOff + off
        let s = ''
        if (platform === 3 || platform === 0) {       // UTF-16BE (Windows / Unicode)
          for (let k = 0; k + 1 < len; k += 2) s += String.fromCharCode(dv.getUint16(base + k))
        } else {                                       // ASCII/MacRoman
          for (let k = 0; k < len; k++) s += String.fromCharCode(dv.getUint8(base + k))
        }
        const score = (platform === 3 ? 2 : 0) + (lang === 0x409 ? 1 : 0)
        if (s && (!best || score > best.score)) best = { score, s }
      }
      return best ? best.s.trim() : null
    }

    const family = pick(16) || pick(1)                 // typographique (préféré) sinon famille
    if (!family) return null
    const subfamily = pick(17) || pick(2) || 'Regular'
    const ws = styleFromSubfamily(subfamily)
    // Affiner le poids via OS/2.usWeightClass si présent (plus fiable que le libellé).
    if (os2Off >= 0) {
      const w = dv.getUint16(os2Off + 4)
      if (w >= 1 && w <= 1000) ws.weight = w
    }
    return { family, subfamily, weight: ws.weight, style: ws.style }
  } catch { return null }
}

/**
 * Dédoublonne/normalise une liste de familles (filet de sécurité côté UI au cas où
 * une source fournirait encore des noms de fichiers) : suppression des doublons
 * insensible à la casse, tri alphabétique stable, libellés conservés tels quels.
 */
export function dedupeFontFamilies(list: readonly string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of list) {
    const f = (raw || '').trim()
    if (!f) continue
    const key = f.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(f)
  }
  return out
}
