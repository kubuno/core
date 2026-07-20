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
}
export declare function FloatingWindow({ title, icon, children, titleActions, popout, onClose, defaultWidth, defaultHeight, minWidth, minHeight, resizable, backdrop, className, }: FloatingWindowProps): import("react").ReactPortal | null;
export {};
