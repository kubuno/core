import type { PanelDef, PanelPeriod } from '../panels/types';
import type { ReportPanel } from './api';
export default function ReportDocument({ def, panel, period, periods, periodId, onPeriod, instance, author, }: {
    def: PanelDef;
    panel: ReportPanel;
    period: PanelPeriod;
    periods: string[];
    periodId: string;
    onPeriod: (id: string) => void;
    instance: string;
    author: string;
}): import("react").JSX.Element;
