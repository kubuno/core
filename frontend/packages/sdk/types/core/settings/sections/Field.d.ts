import { type Vis } from "./profileFields";
import { ViewBase } from './Field.kbview';
export type FieldProps = {
    label: string;
    vis?: Vis;
    onVis?: (v: Vis) => void;
    hint?: React.ReactNode;
    action?: React.ReactNode;
    className?: string;
    children: React.ReactNode;
};
export declare class Field extends ViewBase {
    get show_vis_on_vis(): boolean;
    /** `<VisToggle>`, rendered by a ReactHost. */
    get VisToggle(): import("react").FunctionComponent<Readonly<import("./VisToggle").VisToggleProps>>;
    get vis_toggle_props(): {
        value: Vis;
        onChange: (v: Vis) => void;
    };
    get show_action(): boolean;
    /** `React.Fragment`: renders the elements an expression holds. */
    get Fragment(): import("react").ExoticComponent<import("react").FragmentProps>;
    get content_action(): {
        children: string | number | bigint | true | import("react").ReactElement<unknown, string | import("react").JSXElementConstructor<any>> | Iterable<import("react").ReactNode> | import("react").ReactPortal | Promise<string | number | bigint | boolean | import("react").ReactPortal | import("react").ReactElement<unknown, string | import("react").JSXElementConstructor<any>> | Iterable<import("react").ReactNode> | null | undefined>;
    };
    get content_children(): {
        children: import("react").ReactNode;
    };
    get show_hint(): boolean;
    get content_hint(): {
        children: string | number | bigint | true | import("react").ReactElement<unknown, string | import("react").JSXElementConstructor<any>> | Iterable<import("react").ReactNode> | import("react").ReactPortal | Promise<string | number | bigint | boolean | import("react").ReactPortal | import("react").ReactElement<unknown, string | import("react").JSXElementConstructor<any>> | Iterable<import("react").ReactNode> | null | undefined>;
    };
}
declare const _default: import("react").FunctionComponent<Readonly<FieldProps>>;
export default _default;
