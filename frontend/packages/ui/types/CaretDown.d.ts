/**
 * Solid drop-down caret, shared by every list-style selector.
 *
 * Not lucide's `ChevronDown` (a thin V, which reads as "expand" rather than
 * "choose from a list") and not the `▼` character, whose shape and baseline
 * change from one font to the next.
 */
export declare function CaretDown({ color, size, gap, className }: {
    color?: string;
    size?: number;
    /** Breathing room kept on the caret's right, inside the control. */
    gap?: number;
    className?: string;
}): import("react").JSX.Element;
