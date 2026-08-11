/** Static rows/options for the "Données & administration" gallery group. */
export interface DemoMember {
    id: string;
    name: string;
    email: string;
    unit: string;
    role: 'admin' | 'user' | 'guest';
    quota: number;
    max: number;
    lastSeen: Date;
    active: boolean;
}
export declare const DEMO_MEMBERS: DemoMember[];
/** Long list for the Combobox — the case `Dropdown` cannot serve. */
export declare const DEMO_UNITS: Array<{
    value: string;
    label: string;
    group: string;
    description?: string;
}>;
export declare function formatBytes(bytes: number): string;
export declare function formatDate(d: Date): string;
