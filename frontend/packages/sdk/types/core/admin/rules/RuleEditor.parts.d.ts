import type { RuleEditor } from './RuleEditor';
export declare function Part1({ t, leafProblems }: {
    t: NonNullable<RuleEditor['tr']>;
    leafProblems: NonNullable<RuleEditor['leafProblems']>;
}): import("react").JSX.Element;
export declare function Part2({ steps, stepIndex, setPane, t, PANES, pane }: {
    steps: NonNullable<RuleEditor['steps']>;
    stepIndex: NonNullable<RuleEditor['stepIndex']>;
    setPane: NonNullable<RuleEditor['setPane']>;
    t: NonNullable<RuleEditor['tr']>;
    PANES: NonNullable<RuleEditor['PANES']>;
    pane: NonNullable<RuleEditor['pane']>;
}): import("react").JSX.Element;
export declare function Part3({ tabs, pane, setPane, t }: {
    tabs: NonNullable<RuleEditor['tabs']>;
    pane: NonNullable<RuleEditor['pane']>;
    setPane: NonNullable<RuleEditor['setPane']>;
    t: NonNullable<RuleEditor['tr']>;
}): import("react").JSX.Element;
