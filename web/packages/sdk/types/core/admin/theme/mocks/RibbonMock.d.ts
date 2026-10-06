import type { ReactNode } from "react";
import { ViewBase } from './RibbonMock.kbview';
import * as __parts from './RibbonMock.parts';
export declare class RibbonMock extends ViewBase {
    get groupLabel(): {
        color: string;
    };
    get sep(): {
        width: number;
        background: string;
    };
    /** The rows of the Repeater over `['Insertion', 'Mise en page', 'Affichage']`. */
    get rows_items(): {
        l: string;
        key: string;
    }[];
    /** `React.Fragment`: renders the elements an expression holds. */
    get Fragment(): import("react").ExoticComponent<import("react").FragmentProps>;
    get content_small_btn_copy_size(): {
        children: import("react").JSX.Element;
    };
    get content_small_btn_pencil_size(): {
        children: import("react").JSX.Element;
    };
    get part1_props(): {
        groupLabel: {
            color: string;
        };
    };
    /** A part of the screen still written in React (<div> with a computed style). */
    get Part1(): typeof __parts.Part1;
    get part2_props(): {
        sep: {
            width: number;
            background: string;
        };
    };
    /** A part of the screen still written in React (<div> with a computed style). */
    get Part2(): typeof __parts.Part2;
    get content_small_btn_span_class_name(): {
        children: import("react").JSX.Element;
    };
    get content_small_btn_span_class_name2(): {
        children: import("react").JSX.Element;
    };
    get content_small_btn_span_class_name3(): {
        children: import("react").JSX.Element;
    };
    get content_small_btn_file_text_size(): {
        children: import("react").JSX.Element;
    };
    /** A part of the screen still written in React (<div> with a computed style). */
    get Part3(): typeof __parts.Part3;
    /** A part of the screen still written in React (<div> with a computed style). */
    get Part4(): typeof __parts.Part4;
    /** A part of the screen still written in React (<div> with a computed style). */
    get Part5(): typeof __parts.Part5;
    smallBtn(icon: ReactNode, label: string, active?: boolean): import("react").JSX.Element;
}
declare const _default: import("react").FunctionComponent<Readonly<{}>>;
export default _default;
