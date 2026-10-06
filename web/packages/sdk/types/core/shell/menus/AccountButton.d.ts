interface Placement {
    top: number;
    left: number;
    maxHeight: number;
}
/**
 * Where the panel goes: under the button, its end edge on the button's end edge, clamped to the viewport;
 * above the button when the room under it is too short and the room above larger. Its height is capped by
 * the room on its side (and, as always, by the viewport less the header).
 */
export declare function placePanel(anchor: DOMRect, height: number, vw: number, vh: number, rtl: boolean): Placement;
export interface AccountButtonProps {
    /** Opens the add-account dialog; `prefill` reconnects a « Déconnecté » row. */
    onAddAccount?: (prefill?: {
        email: string;
        slot: number;
    }) => void;
}
/** The header's account button (a designable custom control of the core's shell). */
export declare const AccountButton: import("@kubuno/views").DefinedControl<AccountButtonProps>;
export default AccountButton;
