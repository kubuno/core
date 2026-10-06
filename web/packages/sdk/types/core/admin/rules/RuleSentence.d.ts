import { type SummaryContext } from "./summary";
import type { UiNode } from "./condition";
import type { RuleInput } from "./types";
import { ViewBase } from './RuleSentence.kbview';
import * as __parts from './RuleSentence.parts';
export type RuleSentenceProps = {
    input: RuleInput;
    tree: UiNode;
    ctx: SummaryContext;
};
export declare class RuleSentence extends ViewBase {
    tr: RuleSentenceStores['t'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get parts(): {
        text: string;
        strong: boolean;
    }[];
    get part1_props(): {
        parts: {
            text: string;
            strong: boolean;
        }[];
    };
    /** A part of the screen still written in React (a list whose item is not a single element). */
    get Part1(): typeof __parts.Part1;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type RuleSentenceStores = ReturnType<RuleSentence['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<RuleSentenceProps>>;
export default _default;
