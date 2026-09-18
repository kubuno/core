import type { AdminModule, ModuleSettingGroup } from '../adminModules';
import { type ActiveScope } from './scopeTypes';
export interface ModuleSidePanelProps {
    module: AdminModule;
    /** The pages the module declares, in manifest order. Empty is the normal case. */
    groups: ModuleSettingGroup[];
    /** The page on screen — the row that wears the "you are here" pill. */
    activeGroup: string | null;
    /** Does the module declare anything a unit may override? */
    scopable: boolean;
    scope: ActiveScope;
    onScopeChange: (next: ActiveScope) => void;
}
export default function ModuleSidePanel({ module, groups, activeGroup, scopable, scope, onScopeChange, }: ModuleSidePanelProps): import("react").JSX.Element | null;
