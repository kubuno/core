import type { MyExportService } from './api';
/**
 * Step 1 — what to include.
 *
 * ## The list is what the modules said, and nothing else
 *
 * Every entry comes from `GET /internal/export/describe`, asked of the modules
 * that are actually running. A module that is not installed, or has not
 * implemented the contract, is simply absent — there is no list of module names
 * anywhere in this file, and adding a module to the instance is the only thing
 * needed for it to appear here.
 *
 * ## Sub-categories are the contract's own shape
 *
 * A module that holds genuinely separate bodies of data declares several
 * services. That IS the "refine what this service includes" control: the module
 * row carries the whole group, and unfolding it exposes the parts. Nothing is
 * invented on this side — a module declaring one service has nothing to unfold.
 */
export interface ServicePickerProps {
    services: MyExportService[];
    /** Ids currently kept. Required services are always in it. */
    selected: Set<string>;
    onChange: (next: Set<string>) => void;
}
export default function ServicePicker({ services, selected, onChange }: ServicePickerProps): import("react").JSX.Element;
