export default function KnownConnectionsCard({ basePath, queryKey, onChanged, embedded, heading, }: {
    basePath: string;
    queryKey: (string | undefined)[];
    onChanged?: () => void;
    /** Render the list as a section (no Card chrome), to sit inside a parent card. */
    embedded?: boolean;
    /** Section heading, used in embedded mode. */
    heading?: string;
}): import("react").JSX.Element | null;
