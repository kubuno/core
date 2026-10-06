import { ViewBase } from './MockSidebar.kbview';
import * as __parts from './MockSidebar.parts';
export declare class MockSidebar extends ViewBase {
    get items(): {
        icon: import("react").ForwardRefExoticComponent<Omit<import("lucide-react").LucideProps, "ref"> & import("react").RefAttributes<SVGSVGElement>>;
        label: string;
        active: boolean;
    }[];
    get part1_props(): {
        items: {
            icon: import("react").ForwardRefExoticComponent<Omit<import("lucide-react").LucideProps, "ref"> & import("react").RefAttributes<SVGSVGElement>>;
            label: string;
            active: boolean;
        }[];
    };
    /** A part of the screen still written in React (a list callback destructuring its item). */
    get Part1(): typeof __parts.Part1;
}
declare const _default: import("react").FunctionComponent<Readonly<{}>>;
export default _default;
