interface Props {
    date: Date;
    showSeconds: boolean;
    /** Côté du cadran en px ; l'horloge s'adapte au cadre du widget. */
    size?: number;
}
/** SVG analog clock — scales to `size` (responsive au cadre du widget). */
export default function AnalogClock({ date, showSeconds, size }: Props): import("react").JSX.Element;
export {};
