import type { ModuleUsage, Reconciliation } from './api';
export default function ReconciliationCard({ data, modules, staleHours, }: {
    data: Reconciliation;
    /** Only to put a display name on a blocking module id. */
    modules: ModuleUsage[];
    staleHours: number;
}): import("react").JSX.Element;
