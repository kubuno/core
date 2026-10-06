import { type DataExportOverview, type ExportScope } from "./api";
import { ViewBase } from './ExportRequestDialog.kbview';
import * as __parts from './ExportRequestDialog.parts';
interface PickableUser {
    id: string;
    email: string;
    username: string;
    display_name: string | null;
    is_active: boolean;
}
export type ExportRequestDialogProps = {
    overview: DataExportOverview;
    onClose: () => void;
    onRequested: (exportId: string) => void;
};
export declare class ExportRequestDialog extends ViewBase {
    accessor scope: ExportScope;
    accessor picked: string[];
    accessor query: string;
    accessor withInstance: boolean;
    accessor error: string | null;
    tr: ExportRequestDialogStores['t'];
    i18n: ExportRequestDialogStores['i18n'];
    request: ExportRequestDialogStores['request'];
    services: string[];
    setServices: ExportRequestDialogHooks['setServices'];
    loadingUsers: boolean;
    shown: PickableUser[];
    pickedLabels: {
        id: string;
        label: string;
    }[];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        i18n: import("i18next").i18n;
        request: import("@tanstack/react-query").UseMutationResult<unknown, Error, import("./api").RequestExportBody, unknown>;
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        services: string[];
        setServices: import("react").Dispatch<import("react").SetStateAction<string[]>>;
        users: NoInfer<PickableUser[]> | undefined;
        loadingUsers: boolean;
        shown: PickableUser[];
        pickedLabels: {
            id: string;
            label: string;
        }[];
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get accounts(): number;
    get canSubmit(): boolean;
    get part1_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        onClose: () => void;
        submit: () => void;
        canSubmit: boolean;
        request: import("@tanstack/react-query").UseMutationResult<unknown, Error, import("./api").RequestExportBody, unknown>;
        scope: ExportScope;
        setScope: (value: ExportScope | ((prev: ExportScope) => ExportScope)) => void;
        overview: DataExportOverview;
        query: string;
        setQuery: (value: ExportRequestDialog["query"] | ((prev: ExportRequestDialog["query"]) => ExportRequestDialog["query"])) => void;
        pickedLabels: {
            id: string;
            label: string;
        }[];
        setPicked: (value: string[] | ((prev: string[]) => string[])) => void;
        loadingUsers: boolean;
        shown: PickableUser[];
        picked: string[];
        services: string[];
        toggleService: (id: string, on: boolean) => void;
        withInstance: boolean;
        setWithInstance: (value: ExportRequestDialog["withInstance"] | ((prev: ExportRequestDialog["withInstance"]) => ExportRequestDialog["withInstance"])) => void;
        accounts: number;
        i18n: import("i18next").i18n;
        error: string | null;
    };
    /** A part of the screen still written in React (<FloatingWindow> padding: no .kbview property). */
    get Part1(): typeof __parts.Part1;
    toggleService(id: string, on: boolean): void;
    submit(): void;
    /** `setScope` of the TSX: a value, or an update of the previous one. */
    setScope(value: ExportScope | ((prev: ExportScope) => ExportScope)): void;
    /** `setQuery` of the TSX: a value, or an update of the previous one. */
    setQuery(value: ExportRequestDialog['query'] | ((prev: ExportRequestDialog['query']) => ExportRequestDialog['query'])): void;
    /** `setPicked` of the TSX: a value, or an update of the previous one. */
    setPicked(value: string[] | ((prev: string[]) => string[])): void;
    /** `setWithInstance` of the TSX: a value, or an update of the previous one. */
    setWithInstance(value: ExportRequestDialog['withInstance'] | ((prev: ExportRequestDialog['withInstance']) => ExportRequestDialog['withInstance'])): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type ExportRequestDialogStores = ReturnType<ExportRequestDialog['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type ExportRequestDialogHooks = ReturnType<ExportRequestDialog['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<ExportRequestDialogProps>>;
export default _default;
