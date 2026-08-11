interface Props {
    codes: string[];
    /** Shown once acknowledged; omit to keep the panel permanent. */
    onDone?: () => void;
}
/**
 * The one moment backup codes are readable.
 *
 * The server hashes them with argon2id and has no way to show them again, so the
 * panel leans on that instead of hiding it: the user is told plainly, and given
 * the three ways people actually keep a code sheet — clipboard, a printout, a
 * file. A dialog that only offered "close" would be a trap.
 */
export declare function BackupCodesPanel({ codes, onDone }: Props): import("react").JSX.Element;
export {};
