import type { ComponentType } from 'react';
export interface WaffleApp {
    id: string;
    label: string;
    Icon: ComponentType<{
        size?: number;
        className?: string;
    }>;
    path: string;
    moduleId?: string;
    moduleLabel?: string;
}
interface WaffleModuleEntry {
    moduleId: string;
    label: string;
    apps: WaffleApp[];
}
export interface ResolvedApp {
    moduleId: string;
    moduleLabel: string;
    subId: string;
    subLabel: string;
}
export declare const WaffleAppRegistry: {
    register(moduleId: string, label: string, apps: WaffleApp[]): void;
    get(moduleId: string): WaffleModuleEntry | undefined;
    getAll(): WaffleModuleEntry[];
    /** Résout un chemin (ex. /paintsharp/apex/123) vers le module + sous-module via
     *  l'app au préfixe de chemin le plus long. `null` si aucun module ne correspond. */
    resolveByPath(pathname: string): ResolvedApp | null;
};
export {};
