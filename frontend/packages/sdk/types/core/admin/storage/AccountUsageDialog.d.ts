/**
 * Code-behind of `AccountUsageDialog.kbview` (converted from `AccountUsageDialog.tsx` by @kubuno/views-migrate).
 */
import { type MouseEventArgs } from '@kubuno/views';
import { type Consumer } from "./api";
import { ViewBase } from './AccountUsageDialog.kbview';
import * as __parts from './AccountUsageDialog.parts';
export type AccountUsageDialogProps = {
    account: Consumer;
    onClose: () => void;
    /** Offered only where the caller can actually write the quota. */
    onEditQuota?: () => void;
};
export declare class AccountUsageDialog extends ViewBase {
    tr: AccountUsageDialogStores['t'];
    data: AccountUsageDialogHooks['data'];
    isLoading: boolean;
    isError: boolean;
    refetch: AccountUsageDialogHooks['refetch'];
    rules: AccountUsageDialogHooks['rules'];
    reading: AccountUsageDialogHooks['reading'];
    modules: AccountUsageDialogHooks['modules'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        data: NoInfer<import("./api").AccountUsage> | undefined;
        isLoading: boolean;
        isError: boolean;
        refetch: (options?: import("@tanstack/query-core").RefetchOptions) => Promise<import("@tanstack/query-core").QueryObserverResult<NoInfer<import("./api").AccountUsage>, Error>>;
        rules: import("./categories").CategoryRules;
        reading: import("./categories").CategoryReading;
        modules: import("./api").AccountModuleUsage[];
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get name(): string;
    get part1_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        name: string;
        onClose: () => void;
        onEditQuota: (() => void) | undefined;
        isLoading: boolean;
        isError: boolean;
        refetch: (options?: import("@tanstack/query-core").RefetchOptions) => Promise<import("@tanstack/query-core").QueryObserverResult<NoInfer<import("./api").AccountUsage>, Error>>;
        data: NoInfer<import("./api").AccountUsage> | undefined;
        account: Consumer;
        reading: import("./categories").CategoryReading;
        modules: import("./api").AccountModuleUsage[];
        rules: import("./categories").CategoryRules;
    };
    /** A part of the screen still written in React (<FloatingWindow> actions.confirm: no .kbview property). */
    get Part1(): typeof __parts.Part1;
    panel_mouse_down(_sender: unknown, args: MouseEventArgs): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type AccountUsageDialogStores = ReturnType<AccountUsageDialog['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type AccountUsageDialogHooks = ReturnType<AccountUsageDialog['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<AccountUsageDialogProps>>;
export default _default;
