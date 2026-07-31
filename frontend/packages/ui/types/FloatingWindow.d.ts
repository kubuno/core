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
     * Marge intérieure du contenu, en px (défaut : 20). Le contenu d'une fenêtre ne
     * doit jamais toucher ses bords ; les rares fenêtres « pleine largeur » (aperçu,
     * liste qui doit affleurer, contenu déjà encadré) passent `padding={0}` et gèrent
     * leur propre respiration.
     */
    padding?: number;
}
/** Marge intérieure par défaut du contenu d'une fenêtre volante, en px. */
export declare const WINDOW_PADDING = 20;
export declare function FloatingWindow({ title, icon, children, titleActions, popout, onClose, defaultWidth, defaultHeight, minWidth, minHeight, resizable, backdrop, className, padding, }: FloatingWindowProps): import("react").ReactPortal | null;
export {};
