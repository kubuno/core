/**
 * Code-behind of `CalloutsAndProgress.kbview` (converted from `CalloutsAndProgress.tsx` by @kubuno/views-migrate).
 */
import { type EventArgs } from '@kubuno/views';
import { ViewBase } from './CalloutsAndProgress.kbview';
export declare class CalloutsAndProgress extends ViewBase {
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    callout_action(_sender: unknown, _args: EventArgs): void;
    callout_action2(_sender: unknown, _args: EventArgs): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type CalloutsAndProgressStores = ReturnType<CalloutsAndProgress['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<{}>>;
export default _default;
