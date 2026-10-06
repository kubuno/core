import type { AccountCounts, InstanceInfo } from "./api";
import { ViewBase } from './InstanceCard.kbview';
import * as __parts from './InstanceCard.parts';
export type InstanceCardProps = {
    instance: InstanceInfo;
    accounts: AccountCounts | null;
};
export declare class InstanceCard extends ViewBase {
    accessor copied: boolean;
    tr: InstanceCardStores['t'];
    i18n: InstanceCardStores['i18n'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        i18n: import("i18next").i18n;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get canCopy(): boolean;
    get part1_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        instance: InstanceInfo;
    };
    /** A part of the screen still written in React (<Field> is no .kbview element (./Field#default)). */
    get Part1(): typeof __parts.Part1;
    /** A part of the screen still written in React (<Field> is no .kbview element (./Field#default)). */
    get Part2(): typeof __parts.Part2;
    get part3_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        instance: InstanceInfo;
        i18n: import("i18next").i18n;
    };
    /** A part of the screen still written in React (<Field> is no .kbview element (./Field#default)). */
    get Part3(): typeof __parts.Part3;
    get show_accounts(): boolean;
    get part4_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        accounts: AccountCounts;
    };
    /** A part of the screen still written in React (<Field> is no .kbview element (./Field#default)). */
    get Part4(): typeof __parts.Part4;
    get part5_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        instance: InstanceInfo;
        canCopy: boolean;
        copied: boolean;
        copy: () => void;
    };
    /** A part of the screen still written in React (<Field> is no .kbview element (./Field#default)). */
    get Part5(): typeof __parts.Part5;
    copy(): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type InstanceCardStores = ReturnType<InstanceCard['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<InstanceCardProps>>;
export default _default;
