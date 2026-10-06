/**
 * The parts of `IdentityCard.kbview` still written in React (the codemod could not convert them; see the
 * TODO comments in the view). Each is rendered by a `<ReactHost>` with the values it reads as props.
 */
declare function Action({ icon, label, onClick, danger, disabled, reason, }: {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    danger?: boolean;
    disabled?: boolean;
    reason?: string;
}): import("react").JSX.Element;
export { Action };
