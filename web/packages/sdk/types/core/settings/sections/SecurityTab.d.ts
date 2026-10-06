/**
 * Code-behind of `SecurityTab.kbview` (converted from `SecurityTab.tsx` by @kubuno/views-migrate).
 */
import { type EventArgs } from '@kubuno/views';
import { ViewBase } from './SecurityTab.kbview';
export declare class SecurityTab extends ViewBase {
    accessor form: {
        old_password: string;
        new_password: string;
        confirm: string;
    };
    accessor error: string;
    accessor success: boolean;
    tr: SecurityTabStores['t'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    /** The rows of the Repeater over `(['old_password', 'new_password', 'confirm'] as const)`. */
    get rows_items(): {
        field: "new_password" | "confirm" | "old_password";
        label: string;
        text: string;
        auto_complete: string;
        key: "new_password" | "confirm" | "old_password";
    }[];
    get show_error(): boolean;
    /** `<TwoFactorSection>`, rendered by a ReactHost. */
    get TwoFactorSection(): import("react").FunctionComponent<Readonly<{}>>;
    handleSubmit(e: React.FormEvent): Promise<void>;
    panel_submit(_sender: unknown, args: EventArgs): Promise<void>;
    text_field_text_changed(_sender: unknown, args: EventArgs): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type SecurityTabStores = ReturnType<SecurityTab['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<{}>>;
export default _default;
