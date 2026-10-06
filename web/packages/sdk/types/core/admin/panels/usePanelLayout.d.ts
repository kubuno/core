/**
 * Which panels an operator keeps, and in which order — for any panelled page.
 *
 * Same storage contract as the right rail and the launcher's favourites: the
 * account's server-side `preferences`, so the layout follows the person to
 * whatever machine they administer from, with a localStorage mirror so a cold
 * start or an offline reload still opens on their page rather than on the
 * factory one.
 *
 * ## Why `{ order, hidden }` and not a list of visible ids
 *
 * A single list of what to show freezes the page at the day it was saved: a
 * panel added by a later version would be absent from that list and therefore
 * invisible forever, with nothing on screen explaining why. Here an id nobody
 * has ever seen is simply *not hidden* — it appears at the end, where it can then
 * be moved or dismissed. The same reasoning applies in reverse: an id in `order`
 * that no longer exists is ignored rather than reserving a hole.
 *
 * ## One hook, several dashboards
 *
 * Each page passes its own preference key, its own mirror key and its own
 * factory order; everything else — the atomic write, the merge rules, the reset
 * — is identical, and identical is the point. Two dashboards that remembered
 * their layout by two different disciplines would eventually disagree about what
 * "reset" means.
 */
export interface PanelLayout {
    order: string[];
    hidden: string[];
}
export interface PanelLayoutKeys {
    /** Key inside the account's `preferences` object. */
    pref: string;
    /** Key of the localStorage mirror. */
    cache: string;
    /** The factory arrangement, restored by `reset`. */
    defaultOrder: string[];
}
/**
 * The saved layout applied to the ids that actually exist right now.
 *
 * `available` is what the catalogue AND the server both know about, so a panel
 * withheld for lack of a privilege never occupies a slot in the ordering an
 * operator is looking at.
 */
export declare function applyLayout(available: string[], layout: PanelLayout): string[];
export declare function usePanelLayout(keys: PanelLayoutKeys): {
    layout: PanelLayout;
    hide: (id: string, visible: string[]) => void;
    show: (id: string, visible: string[]) => void;
    move: (id: string, delta: -1 | 1, visible: string[]) => void;
    reset: () => void;
};
