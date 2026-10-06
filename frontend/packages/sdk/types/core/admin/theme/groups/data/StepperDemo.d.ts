/**
 * Code-behind of `StepperDemo.kbview` (converted from `StepperDemo.tsx` by @kubuno/views-migrate).
 */
import { type MouseEventArgs } from '@kubuno/views';
import { type StepDef } from "@ui";
import { ViewBase } from './StepperDemo.kbview';
import * as __parts from './StepperDemo.parts';
export declare class StepperDemo extends ViewBase {
    accessor failing: boolean;
    tr: StepperDemoStores['t'];
    wizard: StepperDemoHooks['wizard'];
    /** The screen's hooks that read nothing of the view (stores, translations…), as the TSX called them. React's rules apply: `use()` runs them on every render. */
    useStores(): {
        t: import("i18next").TFunction<"translation", undefined>;
    };
    /** The screen's hooks that read its members (run after the fields of `useStores()` are set). React's rules apply: `use()` runs them on every render. */
    useHooks(): {
        wizard: import("@ui").UseStepperResult;
    };
    /** Runs the hooks and publishes what they give as fields (the bindings, the getters and the methods read them). */
    use(): void;
    get steps(): StepDef[];
    get resolved(): StepDef[];
    get part1_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        resolved: StepDef[];
        wizard: import("@ui").UseStepperResult;
        steps: StepDef[];
    };
    /** A part of the screen still written in React (<Stepper> steps: no .kbview property). */
    get Part1(): typeof __parts.Part1;
    get enabled_unless_wizard_is_first(): boolean;
    get enabled_unless_wizard_is_last(): boolean;
    get button_text(): string;
    get part2_props(): {
        t: import("i18next").TFunction<"translation", undefined>;
        resolved: StepDef[];
        wizard: import("@ui").UseStepperResult;
    };
    /** A part of the screen still written in React (<Stepper> steps: no .kbview property). */
    get Part2(): typeof __parts.Part2;
    button_click(_sender: unknown, _args: MouseEventArgs): void;
    button_click2(_sender: unknown, _args: MouseEventArgs): void;
    button_click3(_sender: unknown, _args: MouseEventArgs): void;
}
/** What `useStores()` gives (the types of the fields it fills). */
export type StepperDemoStores = ReturnType<StepperDemo['useStores']>;
/** What `useHooks()` gives (the types of the fields it fills). */
export type StepperDemoHooks = ReturnType<StepperDemo['useHooks']>;
declare const _default: import("react").FunctionComponent<Readonly<{}>>;
export default _default;
