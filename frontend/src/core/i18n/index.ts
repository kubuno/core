import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from './locales/en/core.json'
import fr from './locales/fr/core.json'
import it from './locales/it/core.json'
import de from './locales/de/core.json'
import ru from './locales/ru/core.json'
import zh from './locales/zh/core.json'
import ja from './locales/ja/core.json'
import ar from './locales/ar/core.json'
import he from './locales/he/core.json'
import es from './locales/es/core.json'
import pt from './locales/pt/core.json'
import el from './locales/el/core.json'
import hi from './locales/hi/core.json'

export interface LanguageDef { code: string; label: string; flag: string }

/** Langues supportées (ordre d'affichage dans le sélecteur). */
export const LANGUAGES: LanguageDef[] = [
  { code: 'en', label: 'English',  flag: '🇬🇧' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'es', label: 'Español',  flag: '🇪🇸' },
  { code: 'pt', label: 'Português', flag: '🇵🇹' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'de', label: 'Deutsch',  flag: '🇩🇪' },
  { code: 'el', label: 'Ελληνικά', flag: '🇬🇷' },
  { code: 'ru', label: 'Русский',  flag: '🇷🇺' },
  { code: 'ar', label: 'العربية',  flag: '🇸🇦' },
  { code: 'he', label: 'עברית',    flag: '🇮🇱' },
  { code: 'hi', label: 'हिन्दी',     flag: '🇮🇳' },
  { code: 'zh', label: '中文',      flag: '🇨🇳' },
  { code: 'ja', label: '日本語',    flag: '🇯🇵' },
]

export const SUPPORTED = LANGUAGES.map(l => l.code)
/** Langues écrites de droite à gauche. */
export const RTL_LANGS = ['ar', 'he']
export const LANG_COOKIE = 'kubuno_lang'

/**
 * Miroir local de `instance.locale` (réglage public servi par `/api/v1/config`).
 *
 * Le réglage arrive par le réseau, la première peinture est synchrone : sans ce
 * miroir, chaque chargement afficherait la langue du navigateur le temps d'un
 * aller-retour. Même schéma à trois couches que le thème (`themeStore`) — valeur
 * serveur, miroir local, application immédiate au démarrage suivant.
 */
export const INSTANCE_LANG_KEY = 'kubuno_instance_lang'

/** Applique la direction du document (rtl/ltr) selon la langue. */
export function applyDir(lng: string) {
  document.documentElement.dir = RTL_LANGS.includes(lng) ? 'rtl' : 'ltr'
  document.documentElement.lang = lng
}

function readCookie(name: string): string | null {
  const m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'))
  return m ? decodeURIComponent(m[1]) : null
}

function readInstanceLang(): string | null {
  try {
    const v = localStorage.getItem(INSTANCE_LANG_KEY)
    return v && SUPPORTED.includes(v) ? v : null
  } catch {
    // Navigation privée, stockage plein : l'absence de miroir n'est pas une
    // panne, on retombe simplement sur le navigateur le temps du fetch.
    return null
  }
}

/**
 * Détection initiale : cookie → langue d'instance → langue du navigateur →
 * anglais.
 *
 * ── L'ordre, et pourquoi ─────────────────────────────────────────────────────
 *
 * L'ordre complet demandé est « préférence du compte → cookie → instance →
 * navigateur → anglais ». Le premier maillon n'est pas ici et ne peut pas l'être :
 * cette fonction s'exécute au chargement du module, avant toute requête, donc
 * avant qu'on sache s'il y a une session. La préférence du compte est appliquée
 * plus tard par `applyUserLanguage` (cf. `main.tsx`), qui écrase ce qui précède
 * ET réécrit le cookie — c'est ainsi qu'elle l'emporte, et c'est aussi pourquoi
 * le cookie seul ne suffit pas : un compte dont la préférence change sur un
 * autre appareil doit se retrouver appliqué ici.
 *
 * Le cookie passe AVANT l'instance parce qu'il n'est écrit que par une décision
 * — `setLanguage` (l'utilisateur choisit) ou `applyUserLanguage` (son compte
 * l'a choisi). Il n'est jamais posé par la détection automatique. Un cookie
 * signifie donc « quelqu'un a décidé », et la langue d'instance est un défaut :
 * un défaut ne remplace pas une décision. Corollaire assumé : changer la langue
 * de l'instance ne rattrape pas un visiteur qui a déjà choisi la sienne. C'est
 * le comportement voulu.
 *
 * La langue d'instance passe AVANT le navigateur parce qu'elle est le choix de
 * l'organisation qui héberge, le navigateur une supposition sur le visiteur.
 */
export function detectInitialLang(): string {
  const c = readCookie(LANG_COOKIE)
  if (c && SUPPORTED.includes(c)) return c
  const instance = readInstanceLang()
  if (instance) return instance
  const nav = (navigator.language || 'en').slice(0, 2).toLowerCase()
  return SUPPORTED.includes(nav) ? nav : 'en'
}

void i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { core: en },
      fr: { core: fr },
      it: { core: it },
      de: { core: de },
      ru: { core: ru },
      zh: { core: zh },
      ja: { core: ja },
      ar: { core: ar },
      he: { core: he },
      es: { core: es },
      pt: { core: pt },
      el: { core: el },
      hi: { core: hi },
    },
    lng: detectInitialLang(),
    fallbackLng: 'en',
    defaultNS: 'core',
    ns: ['core'],
    interpolation: { escapeValue: false },
    returnNull: false,
    // Un module chargé à l'EXÉCUTION enregistre son namespace via addResourceBundle
    // APRÈS le premier rendu. addResourceBundle émet 'added' sur le RESOURCE STORE,
    // capté par `bindI18nStore` (PAS `bindI18n`). Sans ça, les composants déjà
    // montés affichent les clés brutes (tree.my_drive…). (Défaut bindI18nStore = ''.)
    react: { bindI18n: 'languageChanged loaded', bindI18nStore: 'added removed' },
  })

// Direction initiale du document selon la langue détectée (RTL pour ar/he)
applyDir(detectInitialLang())

// ── Persistance des bundles de modules face au reset d'init ───────────────────
// i18next.init() est ASYNCHRONE (react-i18next) : l'événement `initialized` se
// déclenche APRÈS l'évaluation synchrone des modules. À ce moment, init
// (re)construit le ResourceStore À PARTIR de `resources` ({core} seul) et ÉCRASE
// tous les bundles déjà ajoutés via addResourceBundle pendant le boot (nav, photos,
// office, drive…). Seul `core` survivait. Solution : on mémorise chaque bundle de
// module et on les RÉ-APPLIQUE sur `initialized`. Les modules enregistrés avant
// init sont restaurés à ce moment ; ceux enregistrés après init persistent
// directement (init ne se déclenche qu'une fois).
const _moduleBundles: Array<[string, Record<string, Record<string, unknown>>]> = []
function _applyBundle(ns: string, bundles: Record<string, Record<string, unknown>>) {
  for (const [lng, res] of Object.entries(bundles)) {
    i18n.addResourceBundle(lng, ns, res, true, true)
  }
}
i18n.on('initialized', () => {
  for (const [ns, bundles] of _moduleBundles) _applyBundle(ns, bundles)
})

/** Persiste la langue en cookie (lisible avant authentification sur /login). */
export function writeLangCookie(lng: string) {
  document.cookie = `${LANG_COOKIE}=${lng}; path=/; max-age=31536000; SameSite=Lax`
}

/**
 * Change la langue de l'application : applique, persiste en cookie, et — si
 * `persistUser` est fourni — sauvegarde dans les préférences de l'utilisateur.
 */
export function setLanguage(lng: string, persistUser?: (lng: string) => void) {
  if (!SUPPORTED.includes(lng)) return
  void i18n.changeLanguage(lng)
  applyDir(lng)
  writeLangCookie(lng)
  persistUser?.(lng)
}

/**
 * Applique la langue de l'utilisateur (préférence serveur) sans réécrire le
 * cookie si identique.
 *
 * C'est le maillon de tête de l'ordre de résolution : appelé à la restauration
 * de session (`main.tsx`), il écrase la langue d'instance et la détection du
 * navigateur, et pose le cookie — ce qui empêche `syncInstanceLanguage`, s'il
 * répond après lui, de repasser derrière.
 */
export function applyUserLanguage(lng: unknown) {
  if (typeof lng === 'string' && SUPPORTED.includes(lng) && lng !== i18n.language) {
    void i18n.changeLanguage(lng)
    applyDir(lng)
    writeLangCookie(lng)
  }
}

/**
 * Lit `instance.locale` sur `/api/v1/config` et l'applique quand personne n'a
 * décidé.
 *
 * `/api/v1/config` est la seule surface joignable SANS session : c'est pour ça
 * que le réglage y est déclaré public. Sans ça, la page de connexion — celle qui
 * en a le plus besoin, puisqu'aucune préférence de compte n'existe encore — ne
 * pourrait pas s'y conformer.
 *
 * Deux effets, distincts :
 *
 *  1. le miroir local est rafraîchi (le prochain démarrage peindra directement
 *     dans la bonne langue, sans clignotement) ;
 *  2. la langue est appliquée **seulement s'il n'y a pas de cookie**, c'est-à-dire
 *     seulement si ni l'utilisateur ni son compte n'ont décidé.
 *
 * Aucun cookie n'est écrit ici : un défaut d'instance ne doit pas se figer en
 * décision, sinon changer la langue de l'instance ne rattraperait plus personne.
 */
export async function syncInstanceLanguage(): Promise<void> {
  let lng: string | null = null
  try {
    const res = await fetch('/api/v1/config', { credentials: 'same-origin' })
    if (!res.ok) return
    const body = (await res.json()) as { config?: Record<string, unknown> }
    const raw = body.config?.['instance.locale']
    if (typeof raw !== 'string') return
    // Formes régionales acceptées (fr-CA → fr), comme côté serveur.
    const base = raw.split(/[-_]/)[0]?.toLowerCase() ?? ''
    if (!SUPPORTED.includes(base)) return
    lng = base
  } catch {
    // Hors ligne, ou serveur muet : on garde ce qui est déjà peint.
    return
  }

  try {
    localStorage.setItem(INSTANCE_LANG_KEY, lng)
  } catch { /* stockage indisponible : le miroir est un confort, pas une dépendance */ }

  const decided = readCookie(LANG_COOKIE)
  if (decided && SUPPORTED.includes(decided)) return
  if (lng === i18n.language) return
  void i18n.changeLanguage(lng)
  applyDir(lng)
}

/**
 * Enregistre les traductions d'un module sous son propre namespace.
 * Chaque module appelle ceci dans son `register.ts` :
 *   registerModuleTranslations('files', { en: {...}, fr: {...}, ... })
 * Les composants utilisent alors `useTranslation('files')`.
 */
export function registerModuleTranslations(
  ns: string,
  bundles: Record<string, Record<string, unknown>>,
) {
  // Mémoriser pour ré-application après le reset d'init (cf. handler `initialized`).
  _moduleBundles.push([ns, bundles])
  _applyBundle(ns, bundles)
}

export default i18n
