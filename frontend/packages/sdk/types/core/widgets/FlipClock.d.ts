interface Props {
    hours: string;
    minutes: string;
    seconds?: string;
    showSeconds: boolean;
    ampm?: string;
    /** Taille de base en px ; les chiffres (em) suivent → responsive au cadre. */
    fontSize?: number;
}
export default function FlipClock({ hours, minutes, seconds, showSeconds, ampm, fontSize }: Props): import("react").JSX.Element;
export {};
