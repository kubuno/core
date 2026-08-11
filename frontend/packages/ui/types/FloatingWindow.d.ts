import type { TFunction } from 'i18next';
declare global {
    interface Window {
        kubunoDesktop?: {
            openWindow: (route: string, label?: string, opts?: {
                width?: number;
                height?: number;
            }) => Promise<void>;
        };
    }
}
/** One button of the window's own footer. */
export interface WindowAction {
    label: string;
    onClick: () => void;
    disabled?: boolean;
    loading?: boolean;
    /** Destructive: the label turns red. Still a text button, never a filled one. */
    danger?: boolean;
    /** Focused on open — what makes Entrée confirm without a click. */
    autoFocus?: boolean;
}
/**
 * What the window puts in its footer.
 *
 * Described, not drawn: the ORDER is decided here and nowhere else — action on
 * the LEFT, cancel on the RIGHT, both the same width. That order is a project
 * rule (the one Word uses), and the only way a rule like it survives a hundred
 * dialogs is if no dialog gets to spell it out.
 *
 * Omitting `actions` renders **no footer at all**: a tool panel — a colour
 * picker, a canvas palette — confirms nothing and must not grow a bar with a
 * lonely "Close" in it.
 */
export interface WindowActions {
    /** The thing this window is for. Absent → only the cancel button shows. */
    confirm?: WindowAction;
    /** `false` removes it; otherwise defaults to "Annuler", which calls `onClose`. */
    cancel?: Partial<WindowAction> | false;
    /** Free content pinned to the LEFT edge — a checkbox, a help link, a hint. */
    extra?: React.ReactNode;
}
interface FloatingWindowProps {
    title: string | React.ReactNode;
    icon?: React.ReactNode;
    children: React.ReactNode;
    titleActions?: React.ReactNode;
    popout?: {
        route: string;
        label?: string;
        width?: number;
        height?: number;
        auto?: boolean;
    };
    onClose: () => void;
    defaultWidth?: number;
    defaultHeight?: number;
    minWidth?: number;
    minHeight?: number;
    resizable?: boolean;
    backdrop?: boolean;
    className?: string;
    /**
     * Marge intérieure du contenu, en px. **Défaut : 0** — le contenu affleure les bords
     * de la zone opaque, à chaque fenêtre de gérer sa propre respiration. Passer
     * `padding={WINDOW_PADDING}` pour retrouver l'ancienne marge de 20 px.
     */
    padding?: number;
    /**
     * The window's own footer. See [`WindowActions`] — absent means no footer.
     */
    actions?: WindowActions;
    /** Host translator, for the default cancel label (`@ui` never imports i18n). */
    t?: TFunction;
}
/** Ancienne marge intérieure par défaut, gardée pour les fenêtres qui la veulent. */
export declare const WINDOW_PADDING = 20;
export declare function FloatingWindow({ title, icon, children, titleActions, popout, onClose, defaultWidth, defaultHeight, minWidth, minHeight, resizable, backdrop, className, padding, actions, t, }: FloatingWindowProps): import("react").ReactPortal | null;
export {};
