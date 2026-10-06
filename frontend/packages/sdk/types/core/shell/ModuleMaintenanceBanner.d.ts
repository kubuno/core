import { ViewBase } from './ModuleMaintenanceBanner.kbview';
export type ModuleMaintenanceBannerProps = {
    moduleId: string;
};
export declare class ModuleMaintenanceBanner extends ViewBase {
    tr: ModuleMaintenanceBannerStores['t'];
    notice: ModuleMaintenanceBannerHooks['notice'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        notice: import("./maintenanceStore").MaintenanceNotice | undefined;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get show_case_1(): boolean;
    get show_main(): boolean;
    get callout_text(): string;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type ModuleMaintenanceBannerStores = ReturnType<ModuleMaintenanceBanner['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type ModuleMaintenanceBannerHooks = ReturnType<ModuleMaintenanceBanner['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<ModuleMaintenanceBannerProps>>;
export default _default;
