import { SessionList } from "../../devices/panels";
import type { Device } from "../../devices/types";
import { ViewBase } from './SessionsTab.kbview';
import * as __parts from './SessionsTab.parts';
export declare class SessionsTab extends ViewBase {
    tr: SessionsTabStores['t'];
    toast: SessionsTabStores['toast'];
    logout: SessionsTabStores['logout'];
    confirm: SessionsTabStores['confirm'];
    confirmState: SessionsTabStores['confirmState'];
    handleConfirm: SessionsTabStores['handleConfirm'];
    handleCancel: SessionsTabStores['handleCancel'];
    data: SessionsTabStores['data'];
    isLoading: SessionsTabStores['isLoading'];
    isError: SessionsTabStores['isError'];
    refetch: SessionsTabStores['refetch'];
    disown: SessionsTabStores['disown'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        toast: import("@ui").ToastApi;
        logout: () => Promise<void>;
        confirm: (options: import("@ui").ConfirmOptions) => Promise<boolean>;
        confirmState: import("../../hooks/useConfirm").ConfirmState | null;
        handleConfirm: () => void;
        handleCancel: () => void;
        data: NoInfer<import("../../devices/types").MyDevicesResponse> | undefined;
        isLoading: boolean;
        isError: boolean;
        refetch: (options?: import("@tanstack/query-core").RefetchOptions) => Promise<import("@tanstack/query-core").QueryObserverResult<NoInfer<import("../../devices/types").MyDevicesResponse>, Error>>;
        disown: import("@tanstack/react-query").UseMutationResult<{
            revoked_sessions: number;
            password_change_required: boolean;
        }, Error, {
            id: string;
            note?: string;
        }, unknown>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get orphans(): import("../../devices/types").DeviceSession[];
    get show_case_1(): boolean;
    get show_case_2(): boolean;
    get part1_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        refetch: (options?: import("@tanstack/query-core").RefetchOptions) => Promise<import("@tanstack/query-core").QueryObserverResult<NoInfer<import("../../devices/types").MyDevicesResponse>, Error>>;
    };
    /** A part of the screen still written in React (<EmptyState> action: an object value for a text property). */
    get Part1(): typeof __parts.Part1;
    get show_main(): boolean;
    get show_data_devices(): boolean;
    get show_not_data_devices(): boolean;
    /** `<DeviceCard>`, rendered by a ReactHost. */
    get DeviceCard(): typeof __parts.DeviceCard;
    /** The rows of the Repeater over `data.devices`. */
    get rows_devices(): {
        device: Device;
        device_card_props: {
            device: Device;
            sessions: import("../../devices/types").DeviceSession[];
            current: boolean;
            onDisown: (device: Device) => Promise<void>;
        } | undefined;
        key: string;
    }[];
    get show_orphans(): boolean;
    /** `<SessionList>`, rendered by a ReactHost. */
    get SessionList(): typeof SessionList;
    get session_list_props(): {
        sessions: import("../../devices/types").DeviceSession[];
    };
    get show_confirm_state(): boolean;
    get part2_props(): {
        confirmState: import("../../hooks/useConfirm").ConfirmState;
        handleConfirm: () => void;
        handleCancel: () => void;
    };
    /** A part of the screen still written in React (<ConfirmDialog {...spread}> (spread props)). */
    get Part2(): typeof __parts.Part2;
    onDisown(device: Device): Promise<void>;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type SessionsTabStores = ReturnType<SessionsTab['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<{}>>;
export default _default;
