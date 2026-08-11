/** Per-field visibility of a profile entry. */
export type Vis = 'public' | 'private';
export declare function VisToggle({ value, onChange }: {
    value: Vis;
    onChange: (v: Vis) => void;
}): import("react").JSX.Element;
export declare function Field({ label, vis, onVis, hint, action, className, children }: {
    label: string;
    vis?: Vis;
    onVis?: (v: Vis) => void;
    hint?: React.ReactNode;
    action?: React.ReactNode;
    className?: string;
    children: React.ReactNode;
}): import("react").JSX.Element;
export declare function Section({ title, children }: {
    title: string;
    children: React.ReactNode;
}): import("react").JSX.Element;
