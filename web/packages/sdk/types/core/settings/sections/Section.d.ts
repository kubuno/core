import { ViewBase } from './Section.kbview';
export type SectionProps = {
    title: string;
    children: React.ReactNode;
};
export declare class Section extends ViewBase {
    /** `React.Fragment`: renders the elements an expression holds. */
    get Fragment(): import("react").ExoticComponent<import("react").FragmentProps>;
    get content_children(): {
        children: import("react").ReactNode;
    };
}
declare const _default: import("react").FunctionComponent<Readonly<SectionProps>>;
export default _default;
