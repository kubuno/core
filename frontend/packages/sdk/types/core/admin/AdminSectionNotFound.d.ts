/**
 * Code-behind of `AdminSectionNotFound.kbview` (converted from `AdminSectionNotFound.tsx` by @kubuno/views-migrate).
 */
import { type EventArgs } from '@kubuno/views';
import { ViewBase } from './AdminSectionNotFound.kbview';
export type AdminSectionNotFoundProps = {
    tab: string;
};
export declare class AdminSectionNotFound extends ViewBase {
    navigate: AdminSectionNotFoundStores['navigate'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        navigate: import("react-router").NavigateFunction;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    empty_state_action(_sender: unknown, _args: EventArgs): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type AdminSectionNotFoundStores = ReturnType<AdminSectionNotFound['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<AdminSectionNotFoundProps>>;
export default _default;
