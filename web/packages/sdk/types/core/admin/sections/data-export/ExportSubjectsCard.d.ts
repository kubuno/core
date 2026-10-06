/**
 * Code-behind of `ExportSubjectsCard.kbview` (converted from `ExportSubjectsCard.tsx` by @kubuno/views-migrate).
 */
import { type EventArgs, type MouseEventArgs } from '@kubuno/views';
import { type DataTableColumn } from "@ui";
import { type ExportSubject } from "./api";
import { ViewBase } from './ExportSubjectsCard.kbview';
import * as __parts from './ExportSubjectsCard.parts';
export type ExportSubjectsCardProps = {
    exportId: string;
    onClose: () => void;
};
export declare class ExportSubjectsCard extends ViewBase {
    tr: ExportSubjectsCardStores['t'];
    data: ExportSubjectsCardHooks['data'];
    isLoading: boolean;
    isError: boolean;
    refetch: ExportSubjectsCardHooks['refetch'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        data: NoInfer<ExportSubject[]> | undefined;
        isLoading: boolean;
        isError: boolean;
        refetch: (options?: import("@tanstack/query-core").RefetchOptions) => Promise<import("@tanstack/query-core").QueryObserverResult<NoInfer<ExportSubject[]>, Error>>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get columns(): DataTableColumn<ExportSubject>[];
    get show_is_loading_is_error_data(): boolean;
    get show_is_loading_data(): boolean;
    get part1_props(): {
        data: NoInfer<ExportSubject[]>;
        columns: DataTableColumn<ExportSubject>[];
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<DataTable> columns, rowKey, defaultSort, minTableWidth, configurableColumns, t, emptyState: no .kbview property). */
    get Part1(): typeof __parts.Part1;
    button_click(_sender: unknown, _args: MouseEventArgs): void;
    empty_state_action(_sender: unknown, _args: EventArgs): undefined;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type ExportSubjectsCardStores = ReturnType<ExportSubjectsCard['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type ExportSubjectsCardHooks = ReturnType<ExportSubjectsCard['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<ExportSubjectsCardProps>>;
export default _default;
