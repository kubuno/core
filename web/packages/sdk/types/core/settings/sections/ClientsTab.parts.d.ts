/**
 * The parts of `ClientsTab.kbview` still written in React (the codemod could not convert them; see the
 * TODO comments in the view). Each is rendered by a `<ReactHost>` with the values it reads as props.
 */
import { type LucideIcon } from "lucide-react";
declare function StoreBadge({ href, Icon, top, bottom, sub }: {
    href: string;
    Icon: LucideIcon;
    top: string;
    bottom: string;
    sub?: string;
}): import("react").JSX.Element;
export { StoreBadge };
