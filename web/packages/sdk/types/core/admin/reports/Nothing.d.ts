import type { ReactNode } from "react";
import { ViewBase } from './Nothing.kbview';
export type NothingProps = {
    children: ReactNode;
};
export declare class Nothing extends ViewBase {
    /** `React.Fragment`: renders the elements an expression holds. */
    get Fragment(): import("react").ExoticComponent<import("react").FragmentProps>;
    get content_children(): {
        children: ReactNode;
    };
}
declare const _default: import("react").FunctionComponent<Readonly<NothingProps>>;
export default _default;
