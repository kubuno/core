/**
 * Code-behind of `ThemeDevicePreview.kbview` (converted from `ThemeDevicePreview.tsx` by @kubuno/views-migrate).
 */
import { type MouseEventArgs } from '@kubuno/views';
import { Monitor } from "lucide-react";
import ThemePreviewGallery from "./ThemePreviewGallery";
import type { ThemeDef } from "../store/themeStore";
import { ViewBase } from './ThemeDevicePreview.kbview';
import * as __parts from './ThemeDevicePreview.parts';
type Device = 'mobile' | 'tablet' | 'desktop';
export type ThemeDevicePreviewProps = {
    theme: ThemeDef;
};
export declare class ThemeDevicePreview extends ViewBase {
    accessor device: Device;
    tr: ThemeDevicePreviewStores['t'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get cur(): {
        id: Device;
        Icon: typeof Monitor;
        w: number | null;
        labelKey: string;
        def: string;
    };
    /** The rows of the Repeater over `DEVICES`. */
    get rows_devices(): {
        d: {
            id: Device;
            Icon: typeof Monitor;
            w: number | null;
            labelKey: string;
            def: string;
        };
        button_class: string;
        icon: string;
        text: string;
        show_d_w: boolean;
        span_text: string | undefined;
        key: Device;
    }[];
    get show_cur_w(): boolean;
    get show_not_cur_w(): boolean;
    get part1_props(): {
        cur_w: number;
        theme: ThemeDef;
    };
    /** A part of the screen still written in React (<div> with a computed style). */
    get Part1(): typeof __parts.Part1;
    /** `<ThemePreviewGallery>`, rendered by a ReactHost. */
    get ThemePreviewGallery(): typeof ThemePreviewGallery;
    get theme_preview_gallery_props(): {
        theme: ThemeDef;
    };
    panel_click(_sender: unknown, args: MouseEventArgs): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type ThemeDevicePreviewStores = ReturnType<ThemeDevicePreview['useStores']>;
declare const _default: import("react").FunctionComponent<Readonly<ThemeDevicePreviewProps>>;
export default _default;
