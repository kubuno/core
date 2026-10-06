import { type DataExportOverview, type ExportRun } from "./api";
declare function Eligibility({ data, canExecute }: {
    data: DataExportOverview;
    canExecute: boolean;
}): import("react").JSX.Element | null;
export { Eligibility };
declare function ActiveRun({ data, canExecute, onCancel, busy }: {
    data: DataExportOverview;
    canExecute: boolean;
    onCancel: (id: string) => void;
    busy: boolean;
}): import("react").JSX.Element | null;
export { ActiveRun };
declare function Coverage({ data }: {
    data: DataExportOverview;
}): import("react").JSX.Element;
export { Coverage };
declare function PolicySummary({ data }: {
    data: DataExportOverview;
}): import("react").JSX.Element;
export { PolicySummary };
declare function Fact({ label, value, mono }: {
    label: string;
    value: string;
    mono?: boolean;
}): import("react").JSX.Element;
export { Fact };
declare function History({ data, canExecute, onOpen, onCancel, onDelete }: {
    data: DataExportOverview;
    canExecute: boolean;
    onOpen: (id: string) => void;
    onCancel: (id: string) => void;
    onDelete: (run: ExportRun) => void;
}): import("react").JSX.Element;
export { History };
