import type { PanelDef } from "../panels/types";
/** The measurement's own reserves, as written for this panel. */
export declare function CaveatBlock({ def, caveat }: {
    def: PanelDef;
    caveat: string | null;
}): import("react").JSX.Element | null;
