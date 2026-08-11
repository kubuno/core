export default function DomainDetail({ domainId, canManage, onGone, }: {
    domainId: string;
    canManage: boolean;
    /** Called after a removal, so the page can return to the list. */
    onGone: () => void;
}): import("react").JSX.Element;
