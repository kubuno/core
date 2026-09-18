/**
 * Instance health, as a single line in the top bar.
 *
 * It used to be a full-width callout stacked above every administration page:
 * three lines of chrome pushing the actual page down, repeated on every
 * navigation. The same three pieces of information — how many findings, how to
 * open them, how to silence a warning — fit on one line, so they live in the
 * band that was empty anyway.
 *
 * Nothing was dropped to make it fit and no text was shrunk: the count and the
 * link keep the body size, and the sentence about the seven-day snooze became
 * the dismiss button's tooltip, where it is read at the moment it applies.
 */
export default function HealthTopbarChip(): import("react").JSX.Element | null;
