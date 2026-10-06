/**
 * Code-behind of `MainDbMigrationCard.kbview` (converted from `MainDbMigrationCard.tsx` by @kubuno/views-migrate).
 */
import { type ValueChangedEventArgs } from '@kubuno/views';
import ConfirmDialog from "@ui/ConfirmDialog";
import { ViewBase } from './MainDbMigrationCard.kbview';
import * as __parts from './MainDbMigrationCard.parts';
type Engine = 'postgres' | 'mysql' | 'sqlite';
interface Cur {
    engine: string;
    host: string;
    port: number | null;
    user: string;
    database: string;
    path: string;
    has_password: boolean;
}
interface Job {
    status: string;
    target_engine: string;
    tables_total: number;
    total_rows: number;
    error: string;
}
export declare class MainDbMigrationCard extends ViewBase {
    accessor engine: Engine;
    accessor host: string;
    accessor port: string;
    accessor user: string;
    accessor password: string;
    accessor database: string;
    accessor path: string;
    accessor error: string | null;
    accessor job: Job | null;
    tr: MainDbMigrationCardStores['t'];
    isSuperuser: boolean;
    toast: MainDbMigrationCardStores['toast'];
    confirm: MainDbMigrationCardStores['confirm'];
    confirmState: MainDbMigrationCardStores['confirmState'];
    handleConfirm: () => void;
    handleCancel: () => void;
    seeded: MainDbMigrationCardStores['seeded'];
    data: MainDbMigrationCardStores['data'];
    migrate: MainDbMigrationCardHooks['migrate'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        isSuperuser: boolean;
        toast: import("@ui").ToastApi;
        confirm: (options: import("@ui").ConfirmOptions) => Promise<boolean>;
        confirmState: import("../../hooks/useConfirm").ConfirmState | null;
        handleConfirm: () => void;
        handleCancel: () => void;
        seeded: import("react").RefObject<boolean>;
        data: NoInfer<{
            current?: Cur | null;
        }> | undefined;
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        migrate: import("@tanstack/react-query").UseMutationResult<{
            job: Job;
        }, unknown, void, unknown>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get cur(): Cur | null | undefined;
    get show_case_1(): boolean;
    get show_main(): boolean;
    get p_text(): string;
    /** `<KnownConnectionsCard>`, rendered by a ReactHost. */
    get KnownConnectionsCard(): import("react").FunctionComponent<Readonly<import("./KnownConnectionsCard").KnownConnectionsCardProps>>;
    get known_connections_card_props(): {
        basePath: string;
        queryKey: string[];
        embedded: boolean;
        heading: string;
    };
    /** The rows of the Repeater over `ENGINES`. */
    get rows_engines(): {
        e: Engine;
        selected_value: boolean | undefined;
        text: string | undefined;
        key: Engine;
    }[];
    get show_engine_sqlite(): boolean;
    /** `<OutlinedField>`, rendered by a ReactHost. */
    get OutlinedField(): typeof import("../../../ui/OutlinedField").OutlinedField;
    get outlined_field_props(): {
        label: string;
        value: string;
        onChange: (value: MainDbMigrationCard["host"] | ((prev: MainDbMigrationCard["host"]) => MainDbMigrationCard["host"])) => void;
        icon: import("react").JSX.Element;
        primaryColor: string;
    };
    get outlined_field_props2(): {
        label: string;
        value: string;
        onChange: (value: MainDbMigrationCard["port"] | ((prev: MainDbMigrationCard["port"]) => MainDbMigrationCard["port"])) => void;
        placeholder: string;
        inputMode: string;
        primaryColor: string;
    };
    get outlined_field_props3(): {
        label: string;
        value: string;
        onChange: (value: MainDbMigrationCard["database"] | ((prev: MainDbMigrationCard["database"]) => MainDbMigrationCard["database"])) => void;
        primaryColor: string;
    };
    get outlined_field_props4(): {
        label: string;
        value: string;
        onChange: (value: MainDbMigrationCard["user"] | ((prev: MainDbMigrationCard["user"]) => MainDbMigrationCard["user"])) => void;
        primaryColor: string;
    };
    get outlined_field_props5(): {
        label: string;
        value: string;
        onChange: (value: MainDbMigrationCard["password"] | ((prev: MainDbMigrationCard["password"]) => MainDbMigrationCard["password"])) => void;
        type: string;
        autoComplete: string;
        primaryColor: string;
    };
    get show_engine_sqlite2(): boolean;
    /** `<OutlinedField>`, rendered by a ReactHost. */
    get OutlinedField2(): typeof import("../../../ui/OutlinedField").OutlinedField;
    get outlined_field_props6(): {
        label: string;
        value: string;
        onChange: (value: MainDbMigrationCard["path"] | ((prev: MainDbMigrationCard["path"]) => MainDbMigrationCard["path"])) => void;
        placeholder: string;
        primaryColor: string;
    };
    get show_error(): boolean;
    get show_job_job_status(): boolean;
    get part1_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        job: Job;
    };
    /** A part of the screen still written in React (<Callout> with element children). */
    get Part1(): typeof __parts.Part1;
    get show_job_job_status2(): boolean;
    get part2_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        job: Job;
    };
    /** A part of the screen still written in React (<Callout> icon: a value the property converts (null-when-false)). */
    get Part2(): typeof __parts.Part2;
    get enabled_unless_migrate_is_pending(): boolean;
    get show_confirm_state(): boolean;
    /** `<ConfirmDialog>`, rendered by a ReactHost. */
    get ConfirmDialog(): typeof ConfirmDialog;
    get confirm_dialog_props(): {
        onConfirm: () => void;
        onCancel: () => void;
        resolve: (ok: boolean) => void;
        title: string;
        message: string;
        confirmLabel?: string;
        cancelLabel?: string;
        variant?: import("@ui").ConfirmVariant;
        hideCancel?: boolean;
    };
    body(): {
        engine: Engine;
        host: string;
        port: number | null;
        user: string;
        password: string;
        database: string;
        path: string | null;
    };
    onMigrate(): Promise<undefined>;
    radio_button_checked_changed(_sender: unknown, args: ValueChangedEventArgs): undefined;
    /** `setHost` of the TSX: a value, or an update of the previous one. */
    setHost(value: MainDbMigrationCard['host'] | ((prev: MainDbMigrationCard['host']) => MainDbMigrationCard['host'])): void;
    /** `setPort` of the TSX: a value, or an update of the previous one. */
    setPort(value: MainDbMigrationCard['port'] | ((prev: MainDbMigrationCard['port']) => MainDbMigrationCard['port'])): void;
    /** `setDatabase` of the TSX: a value, or an update of the previous one. */
    setDatabase(value: MainDbMigrationCard['database'] | ((prev: MainDbMigrationCard['database']) => MainDbMigrationCard['database'])): void;
    /** `setUser` of the TSX: a value, or an update of the previous one. */
    setUser(value: MainDbMigrationCard['user'] | ((prev: MainDbMigrationCard['user']) => MainDbMigrationCard['user'])): void;
    /** `setPassword` of the TSX: a value, or an update of the previous one. */
    setPassword(value: MainDbMigrationCard['password'] | ((prev: MainDbMigrationCard['password']) => MainDbMigrationCard['password'])): void;
    /** `setPath` of the TSX: a value, or an update of the previous one. */
    setPath(value: MainDbMigrationCard['path'] | ((prev: MainDbMigrationCard['path']) => MainDbMigrationCard['path'])): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type MainDbMigrationCardStores = ReturnType<MainDbMigrationCard['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type MainDbMigrationCardHooks = ReturnType<MainDbMigrationCard['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<{}>>;
export default _default;
