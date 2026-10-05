import { ViewBase } from './ComingSoon.kbview';
export type ComingSoonProps = {
    titleKey: string;
};
export declare class ComingSoon extends ViewBase {
    tr: ComingSoonStores['t'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get h2_text(): string;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type ComingSoonStores = ReturnType<ComingSoon['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<ComingSoonProps>>;
export default _default;
