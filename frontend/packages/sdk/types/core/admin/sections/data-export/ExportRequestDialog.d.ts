import { type DataExportOverview } from './api';
export default function ExportRequestDialog({ overview, onClose, onRequested, }: {
    overview: DataExportOverview;
    onClose: () => void;
    onRequested: (exportId: string) => void;
}): import("react").JSX.Element;
