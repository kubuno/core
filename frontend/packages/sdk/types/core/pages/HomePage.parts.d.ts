/**
 * The parts of `HomePage.kbview` still written in React (the codemod could not convert them; see the
 * TODO comments in the view). Each is rendered by a `<ReactHost>` with the values it reads as props.
 */
import type { HomePage } from './HomePage';
export declare function Part1({ app }: {
    app: NonNullable<HomePage['rows_fav_apps']>[number]['app'];
}): import("react").JSX.Element;
