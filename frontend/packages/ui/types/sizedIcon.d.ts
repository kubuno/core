import { type ReactNode } from 'react';
/**
 * An item's icon at the size its component draws icons at, unless the caller gave one (`IconSize` of a `.kbview`
 * item reaches the icon as its `size`). A bare string (an unresolved icon name) draws nothing.
 */
export declare function sizedIcon(icon: ReactNode, size: number): ReactNode;
