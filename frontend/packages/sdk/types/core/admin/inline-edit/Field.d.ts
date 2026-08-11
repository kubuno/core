import type { ReactNode } from 'react';
/**
 * One row of a record card: a caption, and either the value or the control that
 * changes it.
 *
 * The label column is fixed so the values of a card line up, and wraps under the
 * label on a narrow container rather than squeezing the value into three
 * characters. Both states use this same row — that is the whole point: a card
 * that reads and a card that edits cannot fall out of alignment if they are the
 * same markup.
 *
 * It lives here rather than in one sheet's folder because three sheets now draw
 * it, and a fourth copy is how the console ends up with four kinds of label.
 */
export declare function Field({ label, children }: {
    label: ReactNode;
    children: ReactNode;
}): import("react").JSX.Element;
/** Renders `—` for an absent value so a card never shows an empty line. */
export declare function orDash(value: ReactNode | null | undefined): ReactNode;
