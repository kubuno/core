/**
 * The parts of `ColorsGroup.kbview` still written in React (the codemod could not convert them; see the
 * TODO comments in the view). Each is rendered by a `<ReactHost>` with the values it reads as props.
 */
declare function Swatch({ varName, label }: {
    varName: string;
    label: string;
}): import("react").JSX.Element;
export { Swatch };
