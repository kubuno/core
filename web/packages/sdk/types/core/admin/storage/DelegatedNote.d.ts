import { ViewBase } from './DelegatedNote.kbview';
export type DelegatedNoteProps = {
    bytes: number;
    objects: number;
    /** Changes only the wording; the arithmetic is the same everywhere: none. */
    scope?: 'instance' | 'module';
    className?: string;
};
export declare class DelegatedNote extends ViewBase {
    tr: DelegatedNoteStores['t'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get scope(): "module" | "instance";
    get show_case_1(): boolean;
    get show_main(): boolean;
    get div_class(): string;
    get sto_deleg_objects_n(): string;
    get p_text(): string;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type DelegatedNoteStores = ReturnType<DelegatedNote['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<DelegatedNoteProps>>;
export default _default;
