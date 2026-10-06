import { BackupCodesPanel } from "./BackupCodesPanel";
import { ViewBase } from './BackupCodesSection.kbview';
export interface BackupCodeStatus {
    remaining: number;
    total: number;
    generated_at: string | null;
    low_threshold: number;
    low: boolean;
}
export declare class BackupCodesSection extends ViewBase {
    accessor status: BackupCodeStatus | null;
    accessor fresh: string[] | null;
    accessor busy: boolean;
    accessor error: string;
    tr: BackupCodesSectionStores['t'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        load: () => Promise<void>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get show_case_1(): boolean;
    /** `<BackupCodesPanel>`, rendered by a ReactHost. */
    get BackupCodesPanel(): typeof BackupCodesPanel;
    get backup_codes_panel_props(): import("./BackupCodesPanel").Props;
    get show_main(): boolean;
    get show_status_status_low(): boolean;
    get bc_low_desc_count(): number;
    get bc_remaining_count(): number;
    get bc_remaining_total(): number;
    get show_error(): boolean;
    regenerate(): Promise<void>;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type BackupCodesSectionStores = ReturnType<BackupCodesSection['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type BackupCodesSectionHooks = ReturnType<BackupCodesSection['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<{}>>;
export default _default;
