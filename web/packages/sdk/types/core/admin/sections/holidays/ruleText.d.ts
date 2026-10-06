import type { TFunction } from 'i18next';
import type { Observance, RuleKind, RuleParams } from './api';
/** Month names in the console's language, from the platform's own data. */
export declare function monthName(locale: string, month: number): string;
/** Weekday names, ISO-numbered (Monday = 1) like the rule itself. */
export declare function weekdayName(locale: string, weekday: number): string;
/** A date the server returned, written the way the reader writes dates. */
export declare function formatDate(locale: string, iso: string): string;
/**
 * The rule, in one line.
 *
 * `dates` is the honest case: there is no sentence for "the Islamic new year",
 * only the list the dataset computed, so the line says how many dates are known
 * and over which years — which is exactly the limit a reader needs to see.
 */
export declare function ruleText(t: TFunction, locale: string, kind: RuleKind, rule: RuleParams): string;
/** The weekend shift, in the same register — empty when the day never moves. */
export declare function observanceText(t: TFunction, observance: Observance): string;
