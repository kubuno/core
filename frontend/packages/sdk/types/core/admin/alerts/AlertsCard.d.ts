/**
 * The "Alerts" card of the administration landing page.
 *
 * It replaces a hard-coded, permanently empty card: it had no data source at
 * all, so it told every operator that everything was fine on every instance,
 * for ever. This one reads the queue, shows the three most urgent open alerts,
 * and — when there are none — says so *with the date of the last check*, which
 * is the difference between "nothing to report" and "nothing has looked".
 *
 * Rendered only for callers holding `core.alerts.read`: the card is a shortcut
 * into a section, and a card whose section is hidden must not reappear here.
 */
export default function AlertsCard(): import("react").JSX.Element;
