export declare const CollapseSidebarRegistry: {
    /** Declare a route prefix (e.g. '/paintsharp') whose pages collapse the sidebar. */
    add(prefix: string): void;
    /** True if the given pathname falls under any registered prefix. */
    matches(pathname: string): boolean;
};
