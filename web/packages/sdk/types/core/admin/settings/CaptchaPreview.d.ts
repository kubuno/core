/**
 * Code-behind of `CaptchaPreview.kbview` (converted from `CaptchaPreview.tsx` by @kubuno/views-migrate).
 */
import { type MouseEventArgs } from '@kubuno/views';
import { type CaptchaChallenge } from "../../api/auth";
import { ViewBase } from './CaptchaPreview.kbview';
import * as __parts from './CaptchaPreview.parts';
export declare class CaptchaPreview extends ViewBase {
    accessor nonce: number;
    tr: CaptchaPreviewStores['t'];
    data: CaptchaPreviewHooks['data'];
    isFetching: boolean;
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        data: NoInfer<CaptchaChallenge> | undefined;
        isFetching: boolean;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get c(): CaptchaChallenge | undefined;
    get enabled_unless_is_fetching(): boolean;
    get part1_props(): {
        isFetching: boolean;
    };
    /** A part of the screen still written in React (an icon with a computed className). */
    get Part1(): typeof __parts.Part1;
    get show_c(): boolean;
    get show_not_c(): boolean;
    get show_c_type_text(): boolean;
    get show_not_c_type_text(): boolean;
    get part2_props(): {
        c: CaptchaChallenge;
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** A part of the screen still written in React (<img> has no .kbview element yet). */
    get Part2(): typeof __parts.Part2;
    get show_c_type_math(): boolean;
    get show_not_c_type_math(): boolean;
    get text(): string | undefined;
    get part3_props(): {
        c: CaptchaChallenge;
    };
    /** A part of the screen still written in React (<div> with a computed style). */
    get Part3(): typeof __parts.Part3;
    get visible(): boolean;
    get visible2(): boolean;
    get visible3(): boolean;
    get visible4(): boolean;
    get visible5(): boolean;
    get div_data(): string;
    panel_click(_sender: unknown, _args: MouseEventArgs): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type CaptchaPreviewStores = ReturnType<CaptchaPreview['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type CaptchaPreviewHooks = ReturnType<CaptchaPreview['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<{}>>;
export default _default;
