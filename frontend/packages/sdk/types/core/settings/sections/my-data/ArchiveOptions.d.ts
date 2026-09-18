import type { MyExportPolicy } from './api';
/**
 * Step 2 — how the archive is built.
 *
 * ## Only controls that do something
 *
 * The archive format is **stated, not offered**: the server produces one format,
 * and a picker with a single entry is a control that teaches the reader a choice
 * exists where none does. The same reasoning keeps a "schedule this export"
 * switch off this page: nothing behind it would honour a schedule, and a switch
 * that silently does nothing is worse than an absent one.
 *
 * What is real is the per-file ceiling. It is applied by the producer, frozen on
 * the request, and it can only ever be *tightened*: the instance's own ceiling
 * is a protection against one object making an archive unusable, not a
 * preference, so the largest value offered here is the instance's.
 */
export interface ArchiveOptionsProps {
    policy: MyExportPolicy;
    format: string;
    maxFileMb: number;
    onMaxFileMb: (value: number) => void;
}
export default function ArchiveOptions({ policy, format, maxFileMb, onMaxFileMb, }: ArchiveOptionsProps): import("react").JSX.Element;
