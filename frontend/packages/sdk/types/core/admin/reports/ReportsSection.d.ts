import type { AdminSectionProps } from '../sections/registry';
/**
 * `/admin/reports` — the printable documents behind the dashboards.
 *
 * ## Two screens, one section
 *
 * With a panel in the address (`/admin/reports/<panel>`) this renders that
 * report; without one, the catalogue of everything that can be reported on. The
 * catalogue is not padding: a report is normally reached from the card that
 * summarises it, but "produce the storage report for last month" is a task
 * somebody arrives with, and a console where the only way to a document is
 * through the picture of it is a console where the document is not really a
 * feature.
 *
 * ## Why the panel is a path segment
 *
 * `adminNav.ts` declares `entity: 'panel'` for this section, so the address is
 * `/admin/reports/storage?source=dashboard&period=last_30_days` and the reader
 * in `adminRoute.ts` republishes the segment as `params.get('panel')`. The
 * window and the catalogue the id came from identify no place, so they stay in
 * the query string — the rule that file states.
 */
export default function ReportsSection({ params, navigate }: AdminSectionProps): import("react").JSX.Element;
