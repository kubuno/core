import { type FileItem } from '../api';
export declare function VersionBadge({ file, variant, }: {
    file: FileItem;
    /** `overlay` sits on the card's preview; `inline` follows the name in a row. */
    variant: 'overlay' | 'inline';
}): import("react").JSX.Element | null;
