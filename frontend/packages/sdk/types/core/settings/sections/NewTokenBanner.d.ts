/**
 * Code-behind of `NewTokenBanner.kbview` (converted from `NewTokenBanner.tsx` by @kubuno/views-migrate).
 */
import { type MouseEventArgs } from '@kubuno/views';
import { ViewBase } from './NewTokenBanner.kbview';
export type NewTokenBannerProps = {
    token: string;
    onClose: () => void;
};
export declare class NewTokenBanner extends ViewBase {
    accessor copied: boolean;
    tr: NewTokenBannerStores['t'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get show_not_copied(): boolean;
    get text(): string;
    copy(): void;
    panel_click(_sender: unknown, _args: MouseEventArgs): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type NewTokenBannerStores = ReturnType<NewTokenBanner['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<NewTokenBannerProps>>;
export default _default;
