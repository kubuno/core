import type { WaffleApp } from '../../registry/WaffleAppRegistry';
export interface WaffleButtonProps {
    /** The apps of the active modules (`useWaffleApps`). */
    allApps: WaffleApp[];
    /** Kept for the callers; no longer changes the trigger's size (36px circles everywhere). */
    compact?: boolean;
    /** The dark title bars (PaintSharp): light glyph, translucent hover. */
    dark?: boolean;
    /** The mobile floating action button variant (bottom-right, opens upwards). */
    fab?: boolean;
    onOpenChange?: (open: boolean) => void;
}
/** The header's launcher button (a designable custom control of the core's shell). */
export declare const WaffleButton: import("@kubuno/views").DefinedControl<WaffleButtonProps>;
export default WaffleButton;
