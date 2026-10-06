import { type PanelSource } from "../panels/report";
import type { PanelDef } from "../panels/types";
import type { AdminSectionProps } from "../sections/registry";
declare function OneReport({ source, panelId, def, params, navigate, }: {
    source: PanelSource;
    panelId: string;
    def: PanelDef;
} & AdminSectionProps): import("react").JSX.Element | null;
export { OneReport };
declare function ReportIndex({ navigate }: Pick<AdminSectionProps, 'navigate'>): import("react").JSX.Element;
export { ReportIndex };
