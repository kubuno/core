export declare const SNOOZE_DAYS = 7;
/** Timestamp the snooze runs until, or 0 when there is none. */
export declare function snoozedUntil(): number;
/** True while a warning is currently silenced. */
export declare function isSnoozed(): boolean;
export declare function snooze(): void;
