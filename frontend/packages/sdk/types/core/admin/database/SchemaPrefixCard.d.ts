import ConfirmDialog from "@ui/ConfirmDialog";
import { ViewBase } from './SchemaPrefixCard.kbview';
import * as __parts from './SchemaPrefixCard.parts';
interface PrefixResponse {
    prefix: string;
    engine: string;
    applicable: boolean;
}
export declare class SchemaPrefixCard extends ViewBase {
    accessor prefix: string;
    accessor error: string | null;
    accessor done: string[] | null;
    tr: SchemaPrefixCardStores['t'];
    isSuperuser: boolean;
    toast: SchemaPrefixCardStores['toast'];
    qc: SchemaPrefixCardStores['qc'];
    confirm: SchemaPrefixCardStores['confirm'];
    confirmState: SchemaPrefixCardStores['confirmState'];
    handleConfirm: () => void;
    handleCancel: () => void;
    cfg: SchemaPrefixCardStores['cfg'];
    saveMut: SchemaPrefixCardHooks['saveMut'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        isSuperuser: boolean;
        toast: import("@ui").ToastApi;
        qc: import("@tanstack/query-core").QueryClient;
        confirm: (options: import("@ui").ConfirmOptions) => Promise<boolean>;
        confirmState: import("../../hooks/useConfirm").ConfirmState | null;
        handleConfirm: () => void;
        handleCancel: () => void;
        cfg: import("@tanstack/react-query").UseQueryResult<NoInfer<PrefixResponse>, Error>;
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        saveMut: import("@tanstack/react-query").UseMutationResult<{
            changed: boolean;
            renamed?: string[];
        }, unknown, void, unknown>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get applicable(): boolean;
    get show_case_1(): boolean;
    get show_main(): boolean;
    get show_not_cfg_is_loading(): boolean;
    get show_not_cfg_is_error(): boolean;
    get part1_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<Callout> icon: a value the property converts (null-when-false)). */
    get Part1(): typeof __parts.Part1;
    get show_applicable(): boolean;
    get show_error(): boolean;
    get show_done(): boolean;
    get part2_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        done: string[];
    };
    /** A part of the screen still written in React (<Callout> with element children). */
    get Part2(): typeof __parts.Part2;
    /** `<OutlinedField>`, rendered by a ReactHost. */
    get OutlinedField(): typeof import("../../../ui/OutlinedField").OutlinedField;
    get outlined_field_props(): import("@ui").OutlinedFieldProps;
    get enabled_unless_applicable_save_mut_is_pending(): boolean;
    get visible(): boolean;
    get visible2(): boolean;
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
    onSave(): Promise<undefined>;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type SchemaPrefixCardStores = ReturnType<SchemaPrefixCard['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type SchemaPrefixCardHooks = ReturnType<SchemaPrefixCard['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<{}>>;
export default _default;
