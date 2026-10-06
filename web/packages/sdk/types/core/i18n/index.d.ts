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
/**
 * Miroir local de `instance.locale` (réglage public servi par `/api/v1/config`).
 *
 * Le réglage arrive par le réseau, la première peinture est synchrone : sans ce
 * miroir, chaque chargement afficherait la langue du navigateur le temps d'un
 * aller-retour. Même schéma à trois couches que le thème (`themeStore`) — valeur
 * serveur, miroir local, application immédiate au démarrage suivant.
 */
export declare const INSTANCE_LANG_KEY = "kubuno_instance_lang";
/** Applique la direction du document (rtl/ltr) selon la langue. */
export declare function applyDir(lng: string): void;
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
export declare function detectInitialLang(): string;
/** Persiste la langue en cookie (lisible avant authentification sur /login). */
export declare function writeLangCookie(lng: string): void;
/**
 * Change la langue de l'application : applique, persiste en cookie, et — si
 * `persistUser` est fourni — sauvegarde dans les préférences de l'utilisateur.
 */
export declare function setLanguage(lng: string, persistUser?: (lng: string) => void): void;
/**
 * Applique la langue de l'utilisateur (préférence serveur) sans réécrire le
 * cookie si identique.
 *
 * C'est le maillon de tête de l'ordre de résolution : appelé à la restauration
 * de session (`main.tsx`), il écrase la langue d'instance et la détection du
 * navigateur, et pose le cookie — ce qui empêche `syncInstanceLanguage`, s'il
 * répond après lui, de repasser derrière.
 */
export declare function applyUserLanguage(lng: unknown): void;
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
export declare function syncInstanceLanguage(): Promise<void>;
/**
 * Enregistre les traductions d'un module sous son propre namespace.
 * Chaque module appelle ceci dans son `register.ts` :
 *   registerModuleTranslations('files', { en: {...}, fr: {...}, ... })
 * Les composants utilisent alors `useTranslation('files')`.
 */
export declare function registerModuleTranslations(ns: string, bundles: Record<string, Record<string, unknown>>): void;
export default i18n;
