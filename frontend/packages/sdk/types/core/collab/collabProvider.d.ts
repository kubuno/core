import * as Y from 'yjs';
import { Awareness } from 'y-protocols/awareness';
export type CollabStatus = 'connecting' | 'connected' | 'disconnected';
export interface CollabHandle {
    /** Diffuse un message d'awareness (curseur/présence) — texte libre, non persisté. */
    sendAwareness: (json: unknown) => void;
    /** Ferme la session. */
    destroy: () => void;
    /** État courant de la connexion (lecture seule, mis à jour en interne). */
    statusRef: {
        current: CollabStatus;
    };
}
/**
 * Connecte un `Y.Doc` au service collab du core. Renvoie un handle pour
 * l'awareness et la destruction. Le `getToken` permet de rafraîchir le jeton à
 * chaque (re)connexion.
 */
export declare function connectCollab(room: string, doc: Y.Doc, getToken: () => string | null, onStatus?: (s: CollabStatus) => void, onAwareness?: (json: unknown) => void, 
/** Appelé à la 1ʳᵉ sync : `empty` = la salle n'avait aucun état (→ seed possible). Une seule fois. */
onSync?: (empty: boolean) => void, 
/** Instance d'awareness Yjs (curseurs/présence). Si fournie, relayée via le canal texte. */
awareness?: Awareness, 
/** Construit l'URL WS. Défaut : `/collab/:room/sync`. Permet à un module (ex.
 *  whiteboard) de viser sa propre route tout en réutilisant cette glue. */
urlBuilder?: (room: string, token: string) => string): CollabHandle;
/**
 * Hook React : ouvre une session collab pour `room` liée à `doc` tant que
 * `enabled`. Gère le jeton (authStore) et le nettoyage au démontage.
 */
export declare function useCollab(room: string, doc: Y.Doc, enabled: boolean, opts?: {
    onStatus?: (s: CollabStatus) => void;
    onAwareness?: (json: unknown) => void;
    onSync?: (empty: boolean) => void;
    /** Awareness Yjs (curseurs/présence) — relayée automatiquement si fournie. */
    awareness?: Awareness;
    /** Construit l'URL WS (défaut : route collab générique du core). */
    urlBuilder?: (room: string, token: string) => string;
}): {
    sendAwareness: (json: unknown) => void;
};
