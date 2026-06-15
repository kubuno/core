export type WorkspaceTheme = {
    bg: string;
    panel: string;
    toolbar: string;
    header: string;
    active: string;
    border: string;
    accent: string;
    text: string;
    textDim: string;
    topbarBg?: string;
    topbarText?: string;
    statusBg?: string;
    dark?: boolean;
};
export declare const WORKSPACE_DARK: WorkspaceTheme;
export declare const WORKSPACE_LIGHT: WorkspaceTheme;
export declare const WORKSPACE_OFFICE: WorkspaceTheme;
