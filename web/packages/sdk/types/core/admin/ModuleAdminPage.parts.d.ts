import { type AdminModule, type ModuleLiveState, type ModuleSettingGroup } from "./adminModules";
declare function StateChip({ state }: {
    state: ModuleLiveState;
}): import("react").JSX.Element;
export { StateChip };
declare function ModuleStateCard({ module, state }: {
    module: AdminModule;
    state: ModuleLiveState;
}): import("react").JSX.Element;
export { ModuleStateCard };
declare function GroupHeading({ group }: {
    group: ModuleSettingGroup;
}): import("react").JSX.Element;
export { GroupHeading };
