interface LabelIconProps {
    /** Icon height in px (width follows the 596.432:363.452 ratio). */
    size?: number;
    className?: string;
    style?: React.CSSProperties;
    /** Accessible label; omit to render the icon as decorative. */
    title?: string;
}
export declare function LabelIcon({ size, className, style, title }: LabelIconProps): import("react").JSX.Element;
export {};
