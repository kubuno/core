import { ViewBase } from './AboutPage.kbview';
import * as __parts from './AboutPage.parts';
export declare class AboutPage extends ViewBase {
    tr: AboutPageStores['t'];
    health: AboutPageStores['health'];
    modulesData: AboutPageStores['modulesData'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        health: any;
        modulesData: NoInfer<{
            modules: {
                module_id: string;
                base_url: string;
            }[];
        }> | undefined;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get version(): string;
    get modulesCount(): number;
    /** A part of the screen still written in React (<Cloud strokeWidth>: an icon attribute without a property). */
    get Part1(): typeof __parts.Part1;
    get p_text(): string;
    get part2_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        modulesCount: number;
    };
    /** A part of the screen still written in React (a list callback destructuring its item). */
    get Part2(): typeof __parts.Part2;
    /** `<GithubMark>`, rendered by a ReactHost. */
    get GithubMark(): typeof __parts.GithubMark;
    get github_mark_props(): {
        size: number;
        className: string;
    };
    /** A part of the screen still written in React (<a target rel>: attribute(s) without a .kbview property). */
    get Part3(): typeof __parts.Part3;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type AboutPageStores = ReturnType<AboutPage['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<{}>>;
export default _default;
