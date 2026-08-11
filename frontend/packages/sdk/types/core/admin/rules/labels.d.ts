import type { TFunction } from 'i18next';
import type { ExecutionMode, Mode, Outcome, Severity } from './types';
export type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
/** What each mode actually does, verbatim from `rules::model::Mode`. */
export interface ModeFacts {
    evaluates: boolean;
    logs: boolean;
    acts: boolean;
    alerts: 'none' | 'isolated' | 'real';
}
export declare const MODE_FACTS: Record<Mode, ModeFacts>;
/** Display order in the picker: from harmless to consequential, never reordered. */
export declare const MODE_ORDER: Mode[];
export declare function modeLabel(t: TFunction, mode: string): string;
export declare function modeVariant(mode: string): BadgeVariant;
/** Does this mode run the rule's actions? Exactly one does. */
export declare function modeActs(mode: string): boolean;
export declare function outcomeLabel(t: TFunction, outcome: string): string;
export declare function outcomeVariant(outcome: Outcome | string): BadgeVariant;
export declare function severityLabel(t: TFunction, severity: string): string;
export declare function severityVariant(severity: string): BadgeVariant;
export declare const SEVERITIES: Severity[];
/** Verdict of one action inside an execution row (`dispatch::ActionVerdict`). */
export declare function actionStatusLabel(t: TFunction, status: string): string;
export declare function actionStatusVariant(status: string): BadgeVariant;
/** Human duration of a threshold window. */
export declare function windowLabel(t: TFunction, seconds: number): string;
/** A simulated run must be legible as such at a glance in a dense table. */
export declare function isSimulated(mode: ExecutionMode | string): boolean;
