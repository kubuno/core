import { ViewBase } from './GlobalMaintenanceBanner.kbview';
export declare class GlobalMaintenanceBanner extends ViewBase {
    tr: GlobalMaintenanceBannerStores['t'];
    notice: GlobalMaintenanceBannerStores['notice'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        notice: import("./maintenanceStore").MaintenanceNotice | undefined;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get show_case_1(): boolean;
    get show_main(): boolean;
    get callout_text(): string;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type GlobalMaintenanceBannerStores = ReturnType<GlobalMaintenanceBanner['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<{}>>;
export default _default;
