import type { OrgUnit } from "../../types";
import { type ActiveScope } from "./scopeTypes";
import { ViewBase } from './ScopeHeadline.kbview';
export type ScopeHeadlineProps = {
    scope: ActiveScope;
};
export declare class ScopeHeadline extends ViewBase {
    tr: ScopeHeadlineStores['t'];
    data: ScopeHeadlineHooks['data'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        data: NoInfer<OrgUnit[]> | undefined;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get units(): NoInfer<OrgUnit[]>;
    get path(): OrgUnit[];
    get self(): OrgUnit;
    get parent(): OrgUnit | null;
    get isInstance(): boolean;
    get span_text(): string;
    get show_is_instance(): boolean;
    get m_scope_inherits_from_parent(): string;
    get span_text2(): string;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type ScopeHeadlineStores = ReturnType<ScopeHeadline['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type ScopeHeadlineHooks = ReturnType<ScopeHeadline['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<ScopeHeadlineProps>>;
export default _default;
