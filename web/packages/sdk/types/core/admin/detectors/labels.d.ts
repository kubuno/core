import type { TFunction } from 'i18next';
import type { ChecksumAlgo, DetectorKind } from './api';
export declare function kindLabel(t: TFunction, kind: DetectorKind): string;
export declare function checksumLabel(t: TFunction, algo: ChecksumAlgo | null): string;
export declare function categoryLabel(t: TFunction, category: string): string;
export declare function categoryOrder(category: string): number;
/** A confidence as a percentage, which is how everybody reads 0.85. */
export declare function asPercent(value: number): string;
