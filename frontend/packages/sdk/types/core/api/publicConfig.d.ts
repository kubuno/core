/**
 * `/api/v1/config` — les réglages d'instance publics, lus par une demi-douzaine
 * de consommateurs sans lien entre eux : la langue et le thème au démarrage, le
 * délai d'inactivité, le logo de l'instance, la page de connexion, des widgets
 * d'accueil, des panneaux d'administration…
 *
 * Chacun faisait sa propre requête, si bien que la même réponse était
 * téléchargée quatre fois par chargement de page. Ce module est la SOURCE
 * UNIQUE : il partage la requête en cours entre tous les appelants simultanés,
 * puis garde brièvement le résultat.
 *
 * `axios` brut, sans le client authentifié : c'est la seule surface joignable
 * SANS session, et la page de connexion en dépend avant tout jeton.
 */
export type PublicConfig = Record<string, unknown>;
/**
 * La configuration publique, depuis le cache si elle est fraîche, sinon depuis
 * le réseau. Les appels concurrents partagent une seule requête.
 *
 * Rejette comme la requête sous-jacente : chaque appelant garde sa propre
 * conduite en cas d'échec (valeur de repli, écran dégradé…). Un échec n'est
 * jamais mémorisé, donc l'appel suivant retente.
 */
export declare function getPublicConfig(): Promise<PublicConfig>;
/**
 * Oublie la copie mémorisée — à appeler quand un réglage public vient d'être
 * modifié depuis l'administration, pour que la prochaine lecture reparte du
 * serveur sans attendre la fin du délai de fraîcheur.
 */
export declare function invalidatePublicConfig(): void;
