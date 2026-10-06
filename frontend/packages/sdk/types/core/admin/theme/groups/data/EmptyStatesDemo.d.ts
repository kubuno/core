/**
 * Code-behind of `EmptyStatesDemo.kbview` (converted from `EmptyStatesDemo.tsx` by @kubuno/views-migrate).
 */
import { type EventArgs } from '@kubuno/views';
import { ViewBase } from './EmptyStatesDemo.kbview';
import * as __parts from './EmptyStatesDemo.parts';
export declare class EmptyStatesDemo extends ViewBase {
    tr: EmptyStatesDemoStores['t'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get box(): "rounded-xl border border-border bg-surface-0";
    get part1_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<EmptyState> action.icon: no .kbview property). */
    get Part1(): typeof __parts.Part1;
    /** A part of the screen still written in React (<EmptyState> docHref: no .kbview property). */
    get Part2(): typeof __parts.Part2;
    empty_state_action(_sender: unknown, _args: EventArgs): void;
    empty_state_action2(_sender: unknown, _args: EventArgs): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type EmptyStatesDemoStores = ReturnType<EmptyStatesDemo['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<{}>>;
export default _default;
