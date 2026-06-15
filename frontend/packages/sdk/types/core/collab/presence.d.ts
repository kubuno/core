import type { Awareness } from 'y-protocols/awareness';
export interface PresenceUser {
    name: string;
    color: string;
    avatar?: string | null;
    id?: string;
}
/** Couleur stable dérivée d'un identifiant (hash → palette). */
export declare function userColor(id: string): string;
export declare function initials(name: string): string;
/** Liste des utilisateurs présents (hors soi), dédupliquée par nom+couleur. */
export declare function usePresenceUsers(awareness: Awareness | null, selfClientId?: number): PresenceUser[];
/** Rendu des pastilles d'avatars à partir d'une liste (style Google Docs). */
export declare function PresenceAvatarList({ users }: {
    users: PresenceUser[];
}): import("react").JSX.Element | null;
/** Pastilles d'avatars des participants présents (lit directement l'awareness). */
export declare function PresenceAvatars({ awareness, selfClientId }: {
    awareness: Awareness | null;
    selfClientId?: number;
}): import("react").JSX.Element;
/** Renvoie une fonction qui publie la position souris locale (throttlée ~40ms).
 *  Passer `null` pour effacer le curseur (sortie de la zone). */
export declare function usePublishCursor(awareness: Awareness | null, field?: string): (cursor: {
    x: number;
    y: number;
} | null) => void;
/** Overlay des curseurs souris distants. `toScreen` mappe le `cursor` publié vers
 *  des px dans le conteneur d'overlay (même repère que les sélections de l'éditeur).
 *  Renvoie null pour ne pas afficher (ex. hors écran). À monter dans un conteneur
 *  `position: relative`. */
export declare function RemoteCursors({ awareness, selfClientId, toScreen, field }: {
    awareness: Awareness | null;
    selfClientId?: number;
    toScreen: (cursor: {
        x: number;
        y: number;
    }) => {
        left: number;
        top: number;
    } | null;
    field?: string;
}): import("react").JSX.Element | null;
