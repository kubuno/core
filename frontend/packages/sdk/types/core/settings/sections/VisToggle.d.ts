/**
 * Code-behind of `VisToggle.kbview` (converted from `VisToggle.tsx` by @kubuno/views-migrate).
 */
import { type MouseEventArgs } from '@kubuno/views';
import { type Vis } from "./profileFields";
import { ViewBase } from './VisToggle.kbview';
export type VisToggleProps = {
    value: Vis;
    onChange: (v: Vis) => void;
};
export declare class VisToggle extends ViewBase {
    tr: VisToggleStores['t'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get isPublic(): boolean;
    get show_not_is_public(): boolean;
    get tooltip(): string;
    panel_click(_sender: unknown, _args: MouseEventArgs): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type VisToggleStores = ReturnType<VisToggle['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<VisToggleProps>>;
export default _default;
