import { ViewBase } from './AdminForbidden.kbview';
export type AdminForbiddenProps = {
    titleKey?: string;
};
export declare class AdminForbidden extends ViewBase {
    tr: AdminForbiddenStores['t'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get description(): string;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type AdminForbiddenStores = ReturnType<AdminForbidden['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<AdminForbiddenProps>>;
export default _default;
