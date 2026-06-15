import type { WidgetDef } from './WidgetRegistry';
interface Props {
    allWidgets: WidgetDef[];
    activeIds: Set<string>;
    editMode: boolean;
}
export default function GridDashboard({ allWidgets, activeIds, editMode }: Props): import("react").JSX.Element;
export {};
