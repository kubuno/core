export declare function StorageBreadcrumbBase({ rootName, crumbs, onNavigate, onOpenMenu, ariaLabel }: {
    rootName: string;
    crumbs: Array<{
        id: string;
        name: string;
    }>;
    onNavigate: (idx: number) => void;
    /** Opens the current folder's own action menu, hung off the last segment. */
    onOpenMenu?: (e: React.MouseEvent) => void;
    ariaLabel?: string;
}): import("react").JSX.Element;
