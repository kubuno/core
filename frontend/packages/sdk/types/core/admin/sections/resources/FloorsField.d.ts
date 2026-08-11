export default function FloorsField({ floors, onChange, maxLength, maxFloors, disabled, }: {
    floors: string[];
    onChange: (next: string[]) => void;
    /** Column width of a floor name, served by the API alongside the list. */
    maxLength: number;
    /** How many floors a building may hold at all, served by the API. */
    maxFloors: number;
    disabled?: boolean;
}): import("react").JSX.Element;
