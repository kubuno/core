import type { User } from "../../../../types";
import { ViewBase } from './LifecycleCard.kbview';
import * as __parts from './LifecycleCard.parts';
export type LifecycleCardProps = {
    user: User;
};
export declare class LifecycleCard extends ViewBase {
    tr: LifecycleCardStores['t'];
    i18n: LifecycleCardStores['i18n'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        i18n: import("i18next").i18n;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get part1_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        user: User;
        i18n: import("i18next").i18n;
        user_last_login_at: string | null;
    };
    /** A part of the screen still written in React (<dl> has no .kbview element yet). */
    get Part1(): typeof __parts.Part1;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type LifecycleCardStores = ReturnType<LifecycleCard['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<LifecycleCardProps>>;
export default _default;
