import { ViewBase } from './OAuthCallback.kbview';
export declare class OAuthCallback extends ViewBase {
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
        params: URLSearchParams;
        navigate: import("react-router").NavigateFunction;
        isInitialized: boolean;
        user: import("../types").User | null;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type OAuthCallbackStores = ReturnType<OAuthCallback['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<{}>>;
export default _default;
