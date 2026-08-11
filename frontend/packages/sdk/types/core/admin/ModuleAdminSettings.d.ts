import type { ModuleSettingGroup } from './adminModules';
import type { ModuleAdminSection } from '../slots/SlotRegistry';
import { type SettingItem } from './settings/moduleSettingSchema';
export type { SettingItem } from './settings/moduleSettingSchema';
/**
 * The settings of `moduleId` an ADMINISTRATOR may set — the instance-level ones.
 * Per-user scopes are filtered out here rather than in the view: "does this
 * module expose anything to administer" is a question about this list, and the
 * page asks it before rendering anything.
 */
export declare function useModuleInstanceSettings(moduleId: string, enabled?: boolean): {
    items: SettingItem[];
    isLoading: boolean;
    isError: boolean;
    refetch: (options?: import("@tanstack/query-core").RefetchOptions) => Promise<import("@tanstack/query-core").QueryObserverResult<NoInfer<{
        settings: SettingItem[];
    }>, Error>>;
};
export interface ModuleAdminSettingsProps {
    moduleId: string;
    /** The page being shown. `null` = the module declares none (single card). */
    group?: string | null;
    /** Every page the module declares — what the filter names its hits by. */
    groups?: ModuleSettingGroup[];
    /** The module's own views that asked for a tab on THIS page. */
    extraTabs?: ModuleAdminSection[];
}
export default function ModuleAdminSettings({ moduleId, group, groups, extraTabs, }: ModuleAdminSettingsProps): import("react").JSX.Element;
