interface FloatingWindowProps {
    title: string | React.ReactNode;
    icon?: React.ReactNode;
    children: React.ReactNode;
    titleActions?: React.ReactNode;
    onClose: () => void;
    defaultWidth?: number;
    defaultHeight?: number;
    minWidth?: number;
    minHeight?: number;
    resizable?: boolean;
    backdrop?: boolean;
    className?: string;
}
export declare function FloatingWindow({ title, icon, children, titleActions, onClose, defaultWidth, defaultHeight, minWidth, minHeight, resizable, backdrop, className, }: FloatingWindowProps): import("react").ReactPortal;
export {};
