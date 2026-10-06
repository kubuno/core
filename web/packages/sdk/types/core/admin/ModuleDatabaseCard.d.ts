/**
 * Code-behind of `ModuleDatabaseCard.kbview` (converted from `ModuleDatabaseCard.tsx` by @kubuno/views-migrate).
 */
import { type ValueChangedEventArgs, type MouseEventArgs } from '@kubuno/views';
import { ViewBase } from './ModuleDatabaseCard.kbview';
import * as __parts from './ModuleDatabaseCard.parts';
type EngineName = 'postgres' | 'mysql' | 'sqlite';
interface OverrideView {
    engine: EngineName;
    host: string;
    port: number | null;
    user: string;
    has_password: boolean;
    database: string;
    path: string;
    schema_prefix: string | null;
    enabled: boolean;
}
interface MainView {
    engine: string;
    host: string;
    port: number | null;
    user: string;
    database: string;
    path: string;
    has_password: boolean;
}
interface DbConfigResponse {
    module_id: string;
    inherited_engine: string;
    engines: EngineName[];
    override: OverrideView | null;
    main: MainView | null;
}
interface DbTest {
    ok: boolean;
    error?: string;
    server_version?: string;
    database_missing: boolean;
    can_create_database: boolean;
    already_initialised: boolean;
}
type Mode = 'inherit' | EngineName;
export type ModuleDatabaseCardProps = {
    moduleId: string;
};
export declare class ModuleDatabaseCard extends ViewBase {
    accessor mode: Mode;
    accessor host: string;
    accessor port: string;
    accessor user: string;
    accessor password: string;
    accessor passwordTouched: boolean;
    accessor database: string;
    accessor path: string;
    accessor prefix: string;
    accessor test: DbTest | null;
    accessor migrateResult: {
        ok: boolean;
        text: string;
    } | null;
    tr: ModuleDatabaseCardStores['t'];
    isSuperuser: boolean;
    toast: ModuleDatabaseCardStores['toast'];
    qc: ModuleDatabaseCardStores['qc'];
    cfg: ModuleDatabaseCardHooks['cfg'];
    testMut: ModuleDatabaseCardHooks['testMut'];
    saveMut: ModuleDatabaseCardHooks['saveMut'];
    migrateMut: ModuleDatabaseCardHooks['migrateMut'];
    revertMut: ModuleDatabaseCardHooks['revertMut'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        isSuperuser: boolean;
        toast: import("@ui").ToastApi;
        qc: import("@tanstack/query-core").QueryClient;
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        cfg: import("@tanstack/react-query").UseQueryResult<NoInfer<DbConfigResponse>, Error>;
        body: Record<string, unknown> | null;
        testMut: import("@tanstack/react-query").UseMutationResult<DbTest, Error, void, unknown>;
        saveMut: import("@tanstack/react-query").UseMutationResult<any, unknown, void, unknown>;
        migrateMut: import("@tanstack/react-query").UseMutationResult<{
            job: {
                status: string;
                tables_total: number;
                total_rows: number;
                error: string;
            };
        }, unknown, void, unknown>;
        revertMut: import("@tanstack/react-query").UseMutationResult<any, Error, void, unknown>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get ov(): OverrideView | null;
    get engine(): EngineName | null;
    get inheritedEngine(): string;
    get engines(): EngineName[];
    get hasOverride(): boolean;
    get main(): MainView | null;
    get busy(): boolean;
    get fields(): import("react").JSX.Element | null;
    get show_case_1(): boolean;
    get show_main(): boolean;
    get show_not_cfg_is_loading(): boolean;
    get show_not_cfg_is_error(): boolean;
    get part1_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<Callout> icon: a value the property converts (null-when-false)). */
    get Part1(): typeof __parts.Part1;
    get selected_value(): boolean;
    get mdb_inherit_engine(): string;
    /** The rows of the Repeater over `engines`. */
    get rows_engines(): {
        e: EngineName;
        selected_value: boolean | undefined;
        text: string | undefined;
        key: EngineName;
    }[];
    /** `React.Fragment`: renders the elements an expression holds. */
    get Fragment(): import("react").ExoticComponent<import("react").FragmentProps>;
    get content_fields(): {
        children: import("react").JSX.Element | null;
    };
    get show_mode_inherit_has_override(): boolean;
    get enabled_unless_busy(): boolean;
    get visible(): boolean;
    get visible2(): boolean;
    get visible3(): boolean;
    get visible4(): boolean;
    /** `<KnownConnectionsCard>`, rendered by a ReactHost. */
    get KnownConnectionsCard(): import("react").FunctionComponent<Readonly<import("./database/KnownConnectionsCard").KnownConnectionsCardProps>>;
    get known_connections_card_props(): Readonly<import("./database/KnownConnectionsCard").KnownConnectionsCardProps>;
    onEdit<T>(setter: (v: T) => void): (v: T) => void;
    pickEngine(e: EngineName): undefined;
    radio_button_checked_changed(_sender: unknown, _args: ValueChangedEventArgs): undefined;
    radio_button_checked_changed2(_sender: unknown, args: ValueChangedEventArgs): undefined;
    button_click(_sender: unknown, _args: MouseEventArgs): undefined;
    /** `setHost` of the TSX: a value, or an update of the previous one. */
    setHost(value: ModuleDatabaseCard['host'] | ((prev: ModuleDatabaseCard['host']) => ModuleDatabaseCard['host'])): void;
    /** `setPort` of the TSX: a value, or an update of the previous one. */
    setPort(value: ModuleDatabaseCard['port'] | ((prev: ModuleDatabaseCard['port']) => ModuleDatabaseCard['port'])): void;
    /** `setDatabase` of the TSX: a value, or an update of the previous one. */
    setDatabase(value: ModuleDatabaseCard['database'] | ((prev: ModuleDatabaseCard['database']) => ModuleDatabaseCard['database'])): void;
    /** `setUser` of the TSX: a value, or an update of the previous one. */
    setUser(value: ModuleDatabaseCard['user'] | ((prev: ModuleDatabaseCard['user']) => ModuleDatabaseCard['user'])): void;
    /** `setPath` of the TSX: a value, or an update of the previous one. */
    setPath(value: ModuleDatabaseCard['path'] | ((prev: ModuleDatabaseCard['path']) => ModuleDatabaseCard['path'])): void;
    /** `setPrefix` of the TSX: a value, or an update of the previous one. */
    setPrefix(value: ModuleDatabaseCard['prefix'] | ((prev: ModuleDatabaseCard['prefix']) => ModuleDatabaseCard['prefix'])): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type ModuleDatabaseCardStores = ReturnType<ModuleDatabaseCard['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type ModuleDatabaseCardHooks = ReturnType<ModuleDatabaseCard['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<ModuleDatabaseCardProps>>;
export default _default;
