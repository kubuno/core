import { type ReactNode } from 'react';
import type { TFunction } from 'i18next';
/**
 * Validation state of one step. `error` is what makes a Stepper more than a
 * decoration: a wizard whose third step failed validation must SAY so on the
 * indicator, otherwise the user walks forward and discovers it at submit time.
 */
export type StepStatus = 'pending' | 'current' | 'complete' | 'error' | 'disabled';
export interface StepDef {
    id: string;
    label: string;
    description?: string;
    /**
     * Explicit status. When omitted it is derived from the position relative to
     * the current step (before → complete, at → current, after → pending), which
     * covers the linear happy path with no bookkeeping at the call site.
     */
    status?: StepStatus;
    optional?: boolean;
}
export interface StepperProps {
    steps: StepDef[];
    /** Current step, by id or by index. */
    current: string | number;
    /** Called when a reachable step is clicked. Omit to make the indicator inert. */
    onStepChange?: (id: string, index: number) => void;
    orientation?: 'horizontal' | 'vertical';
    /**
     * Allow jumping FORWARD past the current step. Off by default: a wizard's
     * later steps usually depend on data the user has not entered yet.
     */
    allowForward?: boolean;
    /** Content of the active step, rendered under (or beside) the indicator. */
    children?: ReactNode;
    className?: string;
    t?: TFunction;
}
/**
 * Stepper — the progress spine of a multi-step assistant.
 *
 * Semantics: an ordered list (`<ol>`), the active step carrying
 * `aria-current="step"`; each bullet is a real `<button>` when the step is
 * reachable and a plain `<span>` when it is not, so the Tab order only ever
 * offers what can actually be activated. Status is announced in words through
 * the accessible name ("Completed" / "Needs attention"), never by colour alone.
 *
 * Narrow containers do not shrink the trail — they replace it: "Step 2 of 5",
 * the current label, and a slim progress rail. That is a different hierarchy,
 * not a squeezed one, and it never wraps onto a second row.
 */
export declare function Stepper({ steps, current, onStepChange, orientation, allowForward, children, className, t, }: StepperProps): import("react").JSX.Element;
export interface UseStepperResult {
    /** Id of the active step. */
    id: string;
    index: number;
    isFirst: boolean;
    isLast: boolean;
    next: () => void;
    prev: () => void;
    goTo: (id: string) => void;
    /** Flag a step as failing (or clear it) — drives its `error` status. */
    setError: (id: string, failed: boolean) => void;
    /** Statuses to spread onto the step definitions handed to `<Stepper>`. */
    statuses: Record<string, StepStatus>;
    /** Steps with `status` already resolved — pass straight to `<Stepper steps>`. */
    resolved: StepDef[];
}
/**
 * Companion hook: holds the cursor and the per-step validation map so a wizard
 * does not re-implement "which steps are done, which one broke" every time.
 */
export declare function useStepper(steps: StepDef[], initial?: string): UseStepperResult;
