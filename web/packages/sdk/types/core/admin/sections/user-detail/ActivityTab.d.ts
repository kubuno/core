import { type DataTableColumn } from "@ui";
import type { User } from "../../../types";
import { type AuditEntry } from "../auditTypes";
import { ViewBase } from './ActivityTab.kbview';
import * as __parts from './ActivityTab.parts';
interface AuditPage {
    entries: AuditEntry[];
    next_cursor: string | null;
}
export type ActivityTabProps = {
    user: User;
};
export declare class ActivityTab extends ViewBase {
    accessor open: number | null;
    tr: ActivityTabStores['t'];
    i18n: ActivityTabStores['i18n'];
    asTarget: ActivityTabHooks['asTarget'];
    asActor: ActivityTabHooks['asActor'];
    rows: AuditEntry[];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        i18n: import("i18next").i18n;
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        asTarget: import("@tanstack/react-query").UseQueryResult<NoInfer<AuditPage>, Error>;
        asActor: import("@tanstack/react-query").UseQueryResult<NoInfer<AuditPage>, Error>;
        rows: AuditEntry[];
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get isLoading(): boolean;
    get isError(): boolean;
    get truncated(): boolean;
    get columns(): DataTableColumn<AuditEntry>[];
    get subtitle(): string;
    get part1_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        rows: AuditEntry[];
        columns: DataTableColumn<AuditEntry>[];
        isLoading: boolean;
        isError: boolean;
        asTarget: import("@tanstack/react-query").UseQueryResult<NoInfer<AuditPage>, Error>;
        asActor: import("@tanstack/react-query").UseQueryResult<NoInfer<AuditPage>, Error>;
    };
    /** A part of the screen still written in React (<DataTable> t, columns, rowKey, onRetry, defaultSort, pageSizeOptions, configurableColumns, minTableWidth, emptyState: no .kbview property). */
    get Part1(): typeof __parts.Part1;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type ActivityTabStores = ReturnType<ActivityTab['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type ActivityTabHooks = ReturnType<ActivityTab['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<ActivityTabProps>>;
export default _default;
