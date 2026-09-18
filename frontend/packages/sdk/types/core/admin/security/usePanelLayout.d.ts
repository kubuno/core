/**
 * The security dashboard's arrangement, on the shared panel-layout contract.
 *
 * The rules — one atomic write of the whole object to the account's
 * `preferences`, a localStorage mirror for the cold start, `{ order, hidden }`
 * rather than a list of visible ids — live in `../panels/usePanelLayout` and are
 * shared with every other panelled page. Only the three names are local: the
 * preference key, the mirror key, and this page's factory order.
 */
export type { PanelLayout } from '../panels/usePanelLayout';
export { applyLayout } from '../panels/usePanelLayout';
export declare function usePanelLayout(): {
    layout: import("./usePanelLayout").PanelLayout;
    hide: (id: string, visible: string[]) => void;
    show: (id: string, visible: string[]) => void;
    move: (id: string, delta: -1 | 1, visible: string[]) => void;
    reset: () => void;
};
