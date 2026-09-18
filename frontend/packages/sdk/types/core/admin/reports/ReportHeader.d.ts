import type { ReportModel } from './model';
export default function ReportHeader({ instance, title, about, periodLabel, generatedAt, generatedBy, model, }: {
    /** What the instance calls itself, or its host name as a last resort. */
    instance: string;
    title: string;
    about: string;
    /** The window's own name — "30 derniers jours", "mois dernier". */
    periodLabel: string;
    generatedAt: string;
    generatedBy: string;
    model: ReportModel;
}): import("react").JSX.Element;
