/** True when a module (calendar) has registered a day-panel provider. */
export declare function hasDayPanel(): boolean;
/**
 * Right-hand column of the picker (shown only when `hasDayPanel()`): the events
 * and tasks of the focused day (the hovered cell, else the selected value). The
 * items of the whole visible MONTH are fetched once and filtered per day on the
 * client, so hovering across days never re-hits the network.
 */
export declare function DayPanel({ date }: {
    date: Date;
}): import("react").JSX.Element;
