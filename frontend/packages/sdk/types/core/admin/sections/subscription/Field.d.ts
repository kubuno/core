import type { ReactNode } from "react";
import { ViewBase } from './Field.kbview';
export type FieldProps = {
    label: string;
    children: ReactNode;
    /** Renders the value in the monospace face — for identifiers read aloud. */
    mono?: boolean;
};
export declare class Field extends ViewBase {
    get div_class(): string;
    /** `React.Fragment`: renders the elements an expression holds. */
    get Fragment(): import("react").ExoticComponent<import("react").FragmentProps>;
    get content_children(): {
        children: ReactNode;
    };
}
declare const _default: import("react").FunctionComponent<Readonly<FieldProps>>;
export default _default;
