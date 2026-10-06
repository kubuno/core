import { type ReactNode } from 'react';
export interface StartPageRecentAction {
    id: string;
    label: string;
    icon?: ReactNode;
    danger?: boolean;
    onClick: () => void;
}
export interface StartPageRecentItem {
    id: string;
    name: string;
    subtitle?: string;
    icon?: ReactNode;
    onClick: () => void;
    /** Actions du menu contextuel (clic droit). Le consommateur les fournit. */
    actions?: StartPageRecentAction[];
    /** Élément en cours de suppression : box colorée + non interactive. */
    pendingTone?: 'trash' | 'permanent';
}
export interface StartPageTab {
    id: string;
    label: string;
    content: ReactNode;
}
export interface StartPageProps {
    /** Titre de la colonne des récents (défaut : « Récents »). */
    recentTitle?: string;
    /** Icône d'en-tête de la colonne (défaut : horloge). */
    recentIcon?: ReactNode;
    recentItems: StartPageRecentItem[];
    /** Contenu affiché quand il n'y a aucun récent. */
    recentEmpty?: ReactNode;
    tabs: StartPageTab[];
    /** Onglet actif par défaut (non contrôlé). */
    defaultTab?: string;
    /** Onglet actif (mode contrôlé). */
    activeTab?: string;
    onTabChange?: (id: string) => void;
}
export declare function StartPage({ recentTitle, recentIcon, recentItems, recentEmpty, tabs, defaultTab, activeTab, onTabChange, }: StartPageProps): import("react").JSX.Element;
