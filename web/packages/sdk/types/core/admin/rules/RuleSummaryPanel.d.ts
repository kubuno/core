import { type SummaryContext } from "./summary";
import type { UiNode } from "./condition";
import type { RuleInput } from "./types";
import type { ScopePreview } from "./useDirectory";
import { ViewBase } from './RuleSummaryPanel.kbview';
import * as __parts from './RuleSummaryPanel.parts';
interface Props {
    input: RuleInput;
    tree: UiNode;
    ctx: SummaryContext;
    preview?: ScopePreview;
    /** Rendered as a plain block instead of a sticky column (mobile, dialogs). */
    flat?: boolean;
}
export type { Props };
export declare class RuleSummaryPanel extends ViewBase {
    tr: RuleSummaryPanelStores['t'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get facts(): import("./labels").ModeFacts;
    get aside_class(): "min-w-0" | "min-w-0 lg:sticky lg:top-4";
    get variant(): import("./labels").BadgeVariant;
    get badge_text(): string;
    /** `<RuleSentence>`, rendered by a ReactHost. */
    get RuleSentence(): import("react").FunctionComponent<Readonly<import("./RuleSentence").RuleSentenceProps>>;
    get rule_sentence_props(): {
        input: RuleInput;
        tree: UiNode;
        ctx: SummaryContext;
    };
    get show_input_mode_simulate(): boolean;
    get part1_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<Callout> icon: a value the property converts (null-when-false)). */
    get Part1(): typeof __parts.Part1;
    get show_input_mode_enforce(): boolean;
    get li_text(): string;
    get li_text2(): string;
    get li_text3(): string;
    get show_preview(): boolean;
    get span_text(): string;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type RuleSummaryPanelStores = ReturnType<RuleSummaryPanel['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<Props>>;
export default _default;
