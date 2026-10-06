/**
 * Code-behind of `BrandLink.kbview` (converted from `BrandLink.tsx` by @kubuno/views-migrate).
 */
import { type MouseEventArgs } from '@kubuno/views';
import { useNavigate } from 'react-router-dom';
import { InstanceLogo } from "./InstanceLogo";
import { ViewBase } from './BrandLink.kbview';
import * as __parts from './BrandLink.parts';
export type BrandLinkProps = {
    collapsed?: boolean;
    /** Logo edge in px: 32 in the top bar, 40 in the sidebar corner. */
    iconSize?: number;
    className?: string;
};
export declare class BrandLink extends ViewBase {
    pathname: string;
    navigate: ReturnType<typeof useNavigate>;
    rerender1?: unknown;
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        pathname: string;
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {};
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get collapsed(): boolean;
    get iconSize(): number;
    get className(): string;
    /** Read again on every render, as the TSX did: modules register their apps late, and again with their names in a new language. */
    get hit(): {
        entry: import("../registry/WaffleAppRegistry").WaffleModuleEntry;
        app: import("../registry/WaffleAppRegistry").WaffleApp;
    } | null;
    get to(): string;
    get label(): string;
    get Icon(): import("react").ComponentType<{
        size?: number;
        className?: string;
    }> | undefined;
    get show_icon(): boolean;
    get show_not_icon(): boolean;
    get part1_props(): {
        Icon: import("react").ComponentType<{
            size?: number;
            className?: string;
        }>;
        iconSize: number;
    };
    /** A part of the screen still written in React (<Icon> is no .kbview element (a local or dynamic component)). */
    get Part1(): typeof __parts.Part1;
    /** `<InstanceLogo>`, rendered by a ReactHost. */
    get InstanceLogo(): typeof InstanceLogo;
    get instance_logo_props(): {
        size: number;
        className: string;
    };
    get show_collapsed(): boolean;
    panel_click(_sender: unknown, _args: MouseEventArgs): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type BrandLinkStores = ReturnType<BrandLink['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type BrandLinkHooks = ReturnType<BrandLink['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<BrandLinkProps>>;
export default _default;
