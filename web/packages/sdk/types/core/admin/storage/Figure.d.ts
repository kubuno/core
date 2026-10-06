import { type ReactNode } from "react";
import { ViewBase } from './Figure.kbview';
export type FigureProps = {
    label: string;
    children: ReactNode;
};
export declare class Figure extends ViewBase {
    /** `React.Fragment`: renders the elements an expression holds. */
    get Fragment(): import("react").ExoticComponent<import("react").FragmentProps>;
    get content_children(): {
        children: ReactNode;
    };
}
declare const _default: import("react").FunctionComponent<Readonly<FigureProps>>;
export default _default;
