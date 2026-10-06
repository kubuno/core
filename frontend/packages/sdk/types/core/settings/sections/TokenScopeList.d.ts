import { ViewBase } from './TokenScopeList.kbview';
export type TokenScopeListProps = {
    scopes: string[];
};
export declare class TokenScopeList extends ViewBase {
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get show_case_1(): boolean;
    get show_main(): boolean;
    /** The rows of the Repeater over `scopes`. */
    get rows_scopes(): {
        key: string;
        rowKey: string;
    }[];
}
/** What `useStores()` gives (the types of the fields it fills). */
export type TokenScopeListStores = ReturnType<TokenScopeList['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<TokenScopeListProps>>;
export default _default;
