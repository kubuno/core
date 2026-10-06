import { ViewBase } from './DatabasePanel.kbview';
export declare class DatabasePanel extends ViewBase {
    isSuperuser: boolean;
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        isSuperuser: boolean;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get show_case_1(): boolean;
    get show_main(): boolean;
    /** `<SchemaPrefixCard>`, rendered by a ReactHost. */
    get SchemaPrefixCard(): import("react").FunctionComponent<Readonly<{}>>;
    /** `<MainDbMigrationCard>`, rendered by a ReactHost. */
    get MainDbMigrationCard(): import("react").FunctionComponent<Readonly<{}>>;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type DatabasePanelStores = ReturnType<DatabasePanel['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<{}>>;
export default _default;
