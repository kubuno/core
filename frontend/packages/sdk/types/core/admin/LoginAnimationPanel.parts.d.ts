/**
 * The parts of `LoginAnimationPanel.kbview` still written in React (the codemod could not convert them; see the
 * TODO comments in the view). Each is rendered by a `<ReactHost>` with the values it reads as props.
 */
import type { LoginAnimationPanel } from './LoginAnimationPanel';
export declare function Part1({ s, params, onSlide }: {
    s: NonNullable<LoginAnimationPanel['rows_anim_sliders']>[number]['s'];
    params: NonNullable<LoginAnimationPanel['params']>;
    onSlide: LoginAnimationPanel['onSlide'];
}): import("react").JSX.Element;
