/**
 * Code-behind of `LoginAnimationPanel.kbview` (converted from `LoginAnimationPanel.tsx` by @kubuno/views-migrate).
 */
import { type MouseEventArgs } from '@kubuno/views';
import LoginAnimationGL from "../auth/LoginAnimationGL";
import { type AnimParams } from "../auth/animTuning";
import { ViewBase } from './LoginAnimationPanel.kbview';
import * as __parts from './LoginAnimationPanel.parts';
export declare class LoginAnimationPanel extends ViewBase {
    accessor dirty: boolean;
    qc: LoginAnimationPanelStores['qc'];
    params: AnimParams;
    saved: LoginAnimationPanelStores['saved'];
    saveM: LoginAnimationPanelHooks['saveM'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        qc: import("@tanstack/query-core").QueryClient;
        params: AnimParams;
        setParams: import("react").Dispatch<import("react").SetStateAction<AnimParams>>;
        saved: NoInfer<AnimParams> | undefined;
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        saveM: import("@tanstack/react-query").UseMutationResult<import("axios").AxiosResponse<any, any, {}>, Error, void, unknown>;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    /** `<LoginAnimationGL>`, rendered by a ReactHost. */
    get LoginAnimationGL(): typeof LoginAnimationGL;
    /** A part of the screen still written in React (<input> has no .kbview element yet). */
    get Part1(): typeof __parts.Part1;
    /** The rows of the Repeater over `ANIM_SLIDERS`. */
    get rows_anim_sliders(): {
        s: {
            key: keyof AnimParams;
            label: string;
            min: number;
            max: number;
            step: number;
        };
        text: string;
        show_params_s_key: boolean;
        part1_props: {
            s: {
                key: keyof AnimParams;
                label: string;
                min: number;
                max: number;
                step: number;
            };
            params: AnimParams;
            onSlide: (key: keyof AnimParams, value: number) => void;
        };
        key: keyof AnimParams;
    }[];
    get enabled_unless_dirty(): boolean;
    get show_save_m_is_success_dirty(): boolean;
    onSlide(key: keyof AnimParams, value: number): void;
    button_click(_sender: unknown, _args: MouseEventArgs): void;
    button_click2(_sender: unknown, _args: MouseEventArgs): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type LoginAnimationPanelStores = ReturnType<LoginAnimationPanel['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type LoginAnimationPanelHooks = ReturnType<LoginAnimationPanel['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<{}>>;
export default _default;
