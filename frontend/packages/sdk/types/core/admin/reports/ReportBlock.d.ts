import type { ReactNode } from "react";
import { ViewBase } from './ReportBlock.kbview';
export type ReportBlockProps = {
    title: string;
    children: ReactNode;
    note?: ReactNode;
    /** This block contains a table that is allowed to run over several sheets. */
    table?: boolean;
};
export declare class ReportBlock extends ViewBase {
    /** `React.Fragment`: renders the elements an expression holds. */
    get Fragment(): import("react").ExoticComponent<import("react").FragmentProps>;
    get content_children(): {
        children: ReactNode;
    };
    get show_note(): boolean;
    get content_note(): {
        children: string | number | bigint | true | import("react").ReactElement<unknown, string | import("react").JSXElementConstructor<any>> | Iterable<ReactNode> | import("react").ReactPortal | Promise<string | number | bigint | boolean | import("react").ReactPortal | import("react").ReactElement<unknown, string | import("react").JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined>;
    };
    get section_data(): string;
}
declare const _default: import("react").FunctionComponent<Readonly<ReportBlockProps>>;
export default _default;
