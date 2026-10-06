/**
 * Code-behind of `NotificationsTab.kbview` (converted from `NotificationsTab.tsx` by @kubuno/views-migrate).
 */
import { type ValueChangedEventArgs } from '@kubuno/views';
import { ViewBase } from './NotificationsTab.kbview';
import * as __parts from './NotificationsTab.parts';
export declare class NotificationsTab extends ViewBase {
    accessor saved: boolean;
    accessor busy: boolean;
    tr: NotificationsTabStores['t'];
    user: NotificationsTabStores['user'];
    updateUser: NotificationsTabStores['updateUser'];
    activeModules: NotificationsTabStores['activeModules'];
    n: NotificationsTabHooks['n'];
    setN: NotificationsTabHooks['setN'];
    matrix: NotificationsTabHooks['matrix'];
    setMatrix: NotificationsTabHooks['setMatrix'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        user: import("../../types").User | null;
        updateUser: (updates: Partial<import("../../types").User>) => void;
        activeModules: import("../../types").ActiveModule[];
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        n: {
            emailReminder: string;
            soundOnNotif: boolean;
            soundOnCall: boolean;
            emailFrequency: string;
            dailyDigest: boolean;
        };
        setN: import("react").Dispatch<import("react").SetStateAction<{
            emailReminder: string;
            soundOnNotif: boolean;
            soundOnCall: boolean;
            emailFrequency: string;
            dailyDigest: boolean;
        }>>;
        matrix: Record<string, {
            email: boolean;
            push: boolean;
        }>;
        setMatrix: import("react").Dispatch<import("react").SetStateAction<Record<string, {
            email: boolean;
            push: boolean;
        }>>>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get activeIds(): Set<string>;
    get groups(): import("../../slots/SlotRegistry").NotifGroup[];
    get stored(): Record<string, unknown>;
    get sa(): Record<string, {
        email?: boolean;
        push?: boolean;
    }>;
    get items_source(): {
        value: string;
        label: string;
    }[];
    /** `<NotifCheck>`, rendered by a ReactHost. */
    get NotifCheck(): typeof __parts.NotifCheck;
    get notif_check_props(): {
        checked: boolean;
        onChange: () => void;
    };
    get notif_check_props2(): {
        checked: boolean;
        onChange: () => void;
    };
    /** A part of the screen still written in React (a list inside a list (nested Repeater)). */
    get Part1(): typeof __parts.Part1;
    /** The rows of the Repeater over `groups`. */
    get rows_groups(): {
        g: import("../../slots/SlotRegistry").NotifGroup;
        part1_props: {
            g: import("../../slots/SlotRegistry").NotifGroup;
            cell: (k: string, a: {
                emailDefault?: boolean;
                pushDefault?: boolean;
            }) => {
                email: boolean;
                push: boolean;
            };
            toggle: (k: string, a: {
                emailDefault?: boolean;
                pushDefault?: boolean;
            }, ch: "email" | "push") => void;
        };
        key: string;
    }[];
    get items_source2(): {
        value: string;
        label: string;
    }[];
    get notif_check_props3(): {
        checked: boolean;
        onChange: () => void;
    };
    get button_text(): string;
    str(v: unknown, d: string): string;
    cell(k: string, a: {
        emailDefault?: boolean;
        pushDefault?: boolean;
    }): {
        email: boolean;
        push: boolean;
    };
    toggle(k: string, a: {
        emailDefault?: boolean;
        pushDefault?: boolean;
    }, ch: 'email' | 'push'): void;
    save(): Promise<void>;
    dropdown_selected_value_changed(_sender: unknown, args: ValueChangedEventArgs): void;
    dropdown_selected_value_changed2(_sender: unknown, args: ValueChangedEventArgs): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type NotificationsTabStores = ReturnType<NotificationsTab['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type NotificationsTabHooks = ReturnType<NotificationsTab['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<{}>>;
export default _default;
