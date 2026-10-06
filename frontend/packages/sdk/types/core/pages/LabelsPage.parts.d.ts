import { useConfirm } from "../hooks/useConfirm";
import { type CoreLabel } from "../api/labels";
import type { LabelsPage } from './LabelsPage';
declare function LabelRow({ label, active, onToggle, onChanged, onShare, confirm }: {
    label: CoreLabel;
    active: boolean;
    onToggle: () => void;
    onChanged: () => void;
    onShare: () => void;
    confirm: ReturnType<typeof useConfirm>['confirm'];
}): import("react").JSX.Element;
export { LabelRow };
export declare function Part1({ query, setQuery }: {
    query: NonNullable<LabelsPage['query']>;
    setQuery: NonNullable<LabelsPage['setQuery']>;
}): import("react").JSX.Element;
export declare function Part2({ moduleFilter, setModuleFilter, moduleOptions }: {
    moduleFilter: NonNullable<LabelsPage['moduleFilter']>;
    setModuleFilter: NonNullable<LabelsPage['setModuleFilter']>;
    moduleOptions: NonNullable<LabelsPage['moduleOptions']>;
}): import("react").JSX.Element;
export declare function Part3({ selected, byId, toggle }: {
    selected: NonNullable<LabelsPage['selected']>;
    byId: NonNullable<LabelsPage['byId']>;
    toggle: LabelsPage['toggle'];
}): import("react").JSX.Element;
export declare function Part4({ item, byId, toggle }: {
    item: NonNullable<LabelsPage['rows_items']>[number]['item'];
    byId: NonNullable<LabelsPage['byId']>;
    toggle: LabelsPage['toggle'];
}): import("react").JSX.Element;
