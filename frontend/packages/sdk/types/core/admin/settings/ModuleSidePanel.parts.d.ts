/**
 * The parts of `ModuleSidePanel.kbview` still written in React (the codemod could not convert them; see the
 * TODO comments in the view). Each is rendered by a `<ReactHost>` with the values it reads as props.
 */
import { type ReactNode } from "react";
import type { ModuleSidePanel } from './ModuleSidePanel';
declare function Section({ title, open, onToggle, children }: {
    title: string;
    open: boolean;
    onToggle: () => void;
    children: ReactNode;
}): import("react").JSX.Element;
export { Section };
export declare function Part1({ Glyph }: {
    Glyph: NonNullable<ModuleSidePanel['Glyph']>;
}): import("react").JSX.Element;
export declare function Part2({ t, openPages, setOpenPages, groups, activeGroup, module }: {
    t: NonNullable<ModuleSidePanel['tr']>;
    openPages: NonNullable<ModuleSidePanel['openPages']>;
    setOpenPages: NonNullable<ModuleSidePanel['setOpenPages']>;
    groups: NonNullable<ModuleSidePanel['props']['groups']>;
    activeGroup: ModuleSidePanel['props']['activeGroup'];
    module: NonNullable<ModuleSidePanel['props']['module']>;
}): import("react").JSX.Element;
export declare function Part3({ t, openScope, setOpenScope, scope, onScopeChange, overridingUnits }: {
    t: NonNullable<ModuleSidePanel['tr']>;
    openScope: NonNullable<ModuleSidePanel['openScope']>;
    setOpenScope: NonNullable<ModuleSidePanel['setOpenScope']>;
    scope: NonNullable<ModuleSidePanel['props']['scope']>;
    onScopeChange: NonNullable<ModuleSidePanel['props']['onScopeChange']>;
    overridingUnits: NonNullable<ModuleSidePanel['overridingUnits']>;
}): import("react").JSX.Element;
