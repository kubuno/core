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

/** Applique la direction du document (rtl/ltr) selon la langue. */
export function applyDir(lng: string) {
  document.documentElement.dir = RTL_LANGS.includes(lng) ? 'rtl' : 'ltr'
  document.documentElement.lang = lng
}

function readCookie(name: string): string | null {
  const m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'))
  return m ? decodeURIComponent(m[1]) : null
}

/** Détection initiale : cookie → langue du navigateur → anglais. */
export function detectInitialLang(): string {
  const c = readCookie(LANG_COOKIE)
  if (c && SUPPORTED.includes(c)) return c
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

/** Applique la langue de l'utilisateur (préférence serveur) sans réécrire le cookie si identique. */
export function applyUserLanguage(lng: unknown) {
  if (typeof lng === 'string' && SUPPORTED.includes(lng) && lng !== i18n.language) {
    void i18n.changeLanguage(lng)
    applyDir(lng)
    writeLangCookie(lng)
  }
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
