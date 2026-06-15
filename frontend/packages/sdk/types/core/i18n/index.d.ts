import i18n from 'i18next';
export interface LanguageDef {
    code: string;
    label: string;
    flag: string;
}
/** Langues supportées (ordre d'affichage dans le sélecteur). */
export declare const LANGUAGES: LanguageDef[];
export declare const SUPPORTED: string[];
/** Langues écrites de droite à gauche. */
export declare const RTL_LANGS: string[];
export declare const LANG_COOKIE = "kubuno_lang";
/** Applique la direction du document (rtl/ltr) selon la langue. */
export declare function applyDir(lng: string): void;
/** Détection initiale : cookie → langue du navigateur → anglais. */
export declare function detectInitialLang(): string;
/** Persiste la langue en cookie (lisible avant authentification sur /login). */
export declare function writeLangCookie(lng: string): void;
/**
 * Change la langue de l'application : applique, persiste en cookie, et — si
 * `persistUser` est fourni — sauvegarde dans les préférences de l'utilisateur.
 */
export declare function setLanguage(lng: string, persistUser?: (lng: string) => void): void;
/** Applique la langue de l'utilisateur (préférence serveur) sans réécrire le cookie si identique. */
export declare function applyUserLanguage(lng: unknown): void;
/**
 * Enregistre les traductions d'un module sous son propre namespace.
 * Chaque module appelle ceci dans son `register.ts` :
 *   registerModuleTranslations('files', { en: {...}, fr: {...}, ... })
 * Les composants utilisent alors `useTranslation('files')`.
 */
export declare function registerModuleTranslations(ns: string, bundles: Record<string, Record<string, unknown>>): void;
export default i18n;
