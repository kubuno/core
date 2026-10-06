/**
 * Code-behind of `Topbar.kbview` (converted from `Topbar.tsx` by @kubuno/views-migrate).
 */
import { type MouseEventArgs } from '@kubuno/views';
import { Slot } from "../slots/SlotRegistry";
import { type LinkedAccount } from "../store/linkedAccountsStore";
import AddAccountModal from "../components/AddAccountModal";
import { ViewBase } from './Topbar.kbview';
import * as __parts from './Topbar.parts';
export declare class Topbar extends ViewBase {
    accessor addModalOpen: boolean;
    user: TopbarStores['user'];
    logout: () => Promise<void>;
    toggleSidebar: () => void;
    navigate: TopbarStores['navigate'];
    accounts: LinkedAccount[];
    remove: (id: string) => void;
    activeModules: TopbarStores['activeModules'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        user: import("../types").User | null;
        logout: () => Promise<void>;
        toggleSidebar: () => void;
        navigate: import("react-router").NavigateFunction;
        accounts: LinkedAccount[];
        remove: (id: string) => void;
        activeModules: import("../types").ActiveModule[];
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get activeIds(): Set<string>;
    get SettingsButtonOverride(): import("react").ComponentType<Record<never, never>> | null;
    get initials(): string;
    /** `<KubunoLogo>`, rendered by a ReactHost. */
    get KubunoLogo(): typeof import("../../ui/KubunoLogo").KubunoLogo;
    get kubuno_logo_props(): {
        size: number;
        className: string;
    };
    /** A part of the screen still written in React (<input> has no .kbview element yet). */
    get Part1(): typeof __parts.Part1;
    /** `<Slot>`, rendered by a ReactHost. */
    get Slot(): typeof Slot;
    get slot_props(): {
        name: string;
    };
    get show_settings_button_override(): boolean;
    get show_not_settings_button_override(): boolean;
    get part2_props(): {
        SettingsButtonOverride: import("react").ComponentType<Record<never, never>>;
    };
    /** A part of the screen still written in React (<SettingsButtonOverride> is no .kbview element (a local or dynamic component)). */
    get Part2(): typeof __parts.Part2;
    /** A part of the screen still written in React (<DropdownMenu.Root> is no .kbview element (a local or dynamic component)). */
    get Part3(): typeof __parts.Part3;
    get part4_props(): {
        user: import("../types").User | null;
        user_avatar_url: string | null | undefined;
        initials: string;
        accounts: LinkedAccount[];
        remove: (id: string) => void;
        setAddModalOpen: (value: Topbar["addModalOpen"] | ((prev: Topbar["addModalOpen"]) => Topbar["addModalOpen"])) => void;
        handleLogout: () => Promise<void>;
    };
    /** A part of the screen still written in React (<DropdownMenu.Root> is no .kbview element (a local or dynamic component)). */
    get Part4(): typeof __parts.Part4;
    /** `<AddAccountModal>`, rendered by a ReactHost. */
    get AddAccountModal(): typeof AddAccountModal;
    get add_account_modal_props(): import("../components/AddAccountModal").Props;
    handleLogout(): Promise<void>;
    panel_click(_sender: unknown, _args: MouseEventArgs): void;
    panel_click2(_sender: unknown, _args: MouseEventArgs): void;
    panel_click3(_sender: unknown, _args: MouseEventArgs): void;
    /** `setAddModalOpen` of the TSX: a value, or an update of the previous one. */
    setAddModalOpen(value: Topbar['addModalOpen'] | ((prev: Topbar['addModalOpen']) => Topbar['addModalOpen'])): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type TopbarStores = ReturnType<Topbar['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<{}>>;
export default _default;
