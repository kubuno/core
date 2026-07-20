import type React from 'react';
/** Onglet de la barre de navigation basse (mobile). Un module en déclare
 *  jusqu'à 5 ; ils REMPLACENT les onglets génériques du shell tant qu'une route
 *  du module est active. Sans `mobileTabs`, le shell garde ses onglets par
 *  défaut (Accueil / Modules / Réglages). */
export interface MobileNavTab {
    id: string;
    /** Libellé littéral. Ignoré si `labelKey` est fourni. */
    label?: string;
    /** Clé i18n avec namespace (ex. 'drive:nav.starred'), résolue réactivement. */
    labelKey?: string;
    Icon: React.ComponentType<{
        size?: number;
    }>;
    path: string;
    /** true → actif sur correspondance EXACTE (défaut : le préfixe suffit). */
    end?: boolean;
}
export interface SidebarConfig {
    moduleId: string;
    routePrefix: string;
    newButtonLabel?: string;
    newButtonLabelKey?: string;
    NewActions?: React.ComponentType;
    SidebarBody?: React.ComponentType<{
        collapsed?: boolean;
    }>;
    collapsedBody?: boolean;
    hideSidebar?: boolean;
    mobileTabs?: MobileNavTab[];
}
interface SidebarState {
    configs: SidebarConfig[];
    register: (config: SidebarConfig) => void;
    unregister: (moduleId: string) => void;
}
export declare const useSidebarStore: import("zustand").UseBoundStore<import("zustand").StoreApi<SidebarState>>;
export declare function resolveActiveSidebarConfig(configs: SidebarConfig[], pathname: string): SidebarConfig | null;
export {};
