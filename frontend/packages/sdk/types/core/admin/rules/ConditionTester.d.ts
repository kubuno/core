/**
 * Code-behind of `ConditionTester.kbview` (converted from `ConditionTester.tsx` by @kubuno/views-migrate).
 */
import { type MouseEventArgs } from '@kubuno/views';
import { type UiGroup, type Verdict } from "./condition";
import { type LeafContext } from "./leafKinds";
import type { TriggerRow } from "./types";
import { ViewBase } from './ConditionTester.kbview';
import * as __parts from './ConditionTester.parts';
interface Props {
    root: UiGroup;
    ctx: LeafContext;
    trigger: TriggerRow | undefined;
    /** Publishes the verdicts so the tree can paint itself. `null` clears them. */
    onVerdicts: (v: Record<string, Verdict> | null) => void;
}
export type { Props };
export declare class ConditionTester extends ViewBase {
    accessor text: string;
    accessor error: string | null;
    accessor ran: boolean;
    accessor rootVerdict: Verdict | undefined;
    tr: ConditionTesterStores['t'];
    suggestion: string;
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        suggestion: string;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get part1_props(): {
        text: string;
        setText: (value: ConditionTester["text"] | ((prev: ConditionTester["text"]) => ConditionTester["text"])) => void;
        suggestion: string;
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<TextArea> rows, spellCheck: no .kbview property). */
    get Part1(): typeof __parts.Part1;
    get show_error(): boolean;
    get show_ran_error(): boolean;
    get variant(): "warning" | "info";
    get callout_text(): string;
    run(): void;
    clear(): void;
    button_click(_sender: unknown, _args: MouseEventArgs): void;
    /** `setText` of the TSX: a value, or an update of the previous one. */
    setText(value: ConditionTester['text'] | ((prev: ConditionTester['text']) => ConditionTester['text'])): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type ConditionTesterStores = ReturnType<ConditionTester['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type ConditionTesterHooks = ReturnType<ConditionTester['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<Props>>;
export default _default;
