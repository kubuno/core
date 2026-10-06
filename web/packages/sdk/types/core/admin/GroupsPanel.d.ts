/**
 * Code-behind of `GroupsPanel.kbview` (converted from `GroupsPanel.tsx` by @kubuno/views-migrate).
 */
import { type MouseEventArgs } from '@kubuno/views';
import type { UserGroup } from "../types";
import { ViewBase } from './GroupsPanel.kbview';
import * as __parts from './GroupsPanel.parts';
export declare class GroupsPanel extends ViewBase {
    accessor showCreate: boolean;
    queryClient: GroupsPanelStores['queryClient'];
    params: URLSearchParams;
    data: GroupsPanelStores['data'];
    isLoading: boolean;
    createGroup: GroupsPanelHooks['createGroup'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        queryClient: import("@tanstack/query-core").QueryClient;
        params: URLSearchParams;
        data: NoInfer<(UserGroup & {
            member_count: number;
        })[]> | undefined;
        isLoading: boolean;
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        createGroup: import("@tanstack/react-query").UseMutationResult<import("axios").AxiosResponse<any, any, {}>, Error, object, unknown>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get filter(): string;
    get rows(): (UserGroup & {
        member_count: number;
    })[] | undefined;
    /** `<GroupForm>`, rendered by a ReactHost. */
    get GroupForm(): typeof __parts.GroupForm;
    get group_form_props(): {
        initial?: Partial<UserGroup>;
        onSave: (data: {
            name: string;
            description: string;
            permissions: string[];
            is_default: boolean;
            release_exempt: boolean;
        }) => void;
        onCancel: () => void;
    };
    get show_rows_rows(): boolean;
    /** `<GroupRow>`, rendered by a ReactHost. */
    get GroupRow(): typeof __parts.GroupRow;
    /** The rows of the Repeater over `rows`. */
    get rows_rows(): {
        g: UserGroup & {
            member_count: number;
        };
        group_row_props: React.ComponentProps<typeof __parts.GroupRow>;
        key: string;
    }[];
    button_click(_sender: unknown, _args: MouseEventArgs): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type GroupsPanelStores = ReturnType<GroupsPanel['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type GroupsPanelHooks = ReturnType<GroupsPanel['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<{}>>;
export default _default;
