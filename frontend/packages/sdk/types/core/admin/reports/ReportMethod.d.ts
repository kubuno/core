import type { PanelProvenance } from './api';
import type { ReportModel } from './model';
import type { PanelDef } from '../panels/types';
export declare function MethodBlock({ source, model, }: {
    source: PanelProvenance | undefined;
    model: ReportModel;
}): import("react").JSX.Element;
/** The measurement's own reserves, as written for this panel. */
export declare function CaveatBlock({ def, caveat }: {
    def: PanelDef;
    caveat: string | null;
}): import("react").JSX.Element | null;
