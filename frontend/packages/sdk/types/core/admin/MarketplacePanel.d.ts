/** Panneau Marketplace : parcourir le catalogue distant et installer des modules.
 *  `related` (id du module courant) → filtre par défaut sur les modules similaires
 *  ou complémentaires (même catégorie ou tags partagés), avec repli « tout voir ». */
export default function MarketplacePanel({ onBack, related }: {
    onBack: () => void;
    related?: string | null;
}): import("react").JSX.Element;
