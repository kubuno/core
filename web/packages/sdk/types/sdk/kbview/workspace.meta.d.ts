export declare const DockAreaMeta: {
    readonly name: "DockArea";
    readonly doc: "A work area surrounded by panels the user can dock left or right, group as tabs, split, float, resize, close and reopen. Add the panels as DockPanel children; one other child is the content of the central area.";
    readonly docFr: "Zone de travail entourée de panneaux que l'utilisateur peut ancrer à gauche ou à droite, regrouper en onglets, empiler, détacher en fenêtres flottantes, redimensionner, fermer et rouvrir. Ajoutez les panneaux comme éléments DockPanel enfants ; un autre élément enfant est le contenu de la zone centrale.";
    readonly family: "docking";
    readonly baseChain: readonly ["DockArea", "ContainerBase", "ScrollableControl", "Control", "Component"];
    readonly children: "List";
    readonly allowedChildren: readonly ["DockPanel"];
    readonly defaultEvent: null;
    readonly properties: readonly [{
        readonly name: "StorageKey";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Misc";
        readonly doc: "Key under which the user's layout is saved and restored; empty to keep no layout between runs.";
        readonly docFr: "Clé sous laquelle la disposition choisie par l'utilisateur est enregistrée et restaurée ; vide pour ne rien conserver d'une exécution à l'autre.";
        readonly to: {
            readonly prop: "storageKey";
        };
    }, {
        readonly name: "ViewportColor";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Misc";
        readonly doc: "Background colour of the central area (#RRGGBB); empty for the application's background.";
        readonly docFr: "Couleur de fond de la zone centrale (#RRVVBB) ; vide pour le fond de l'application.";
        readonly to: {
            readonly prop: "viewportBg";
        };
    }, {
        readonly name: "PanelsHidden";
        readonly kind: "Bool";
        readonly default: "false";
        readonly category: "Behavior";
        readonly doc: "Hides the panels and shows the central area alone, full size.";
        readonly docFr: "Masque les panneaux et affiche la zone centrale seule, en pleine taille.";
        readonly to: {
            readonly prop: "hidden";
        };
    }];
    readonly events: readonly [];
    readonly designDefaults: {
        readonly size: readonly [800, 480];
    };
    readonly web: {
        readonly module: "@kubuno/sdk";
        readonly export: "DockArea";
        readonly domRoot: "wrapper";
        readonly content: "children";
        readonly childrenToProp: {
            readonly prop: "panels";
            readonly shape: "record";
            readonly item: "DockPanel";
            readonly content: {
                readonly field: "render";
            };
            readonly key: "id";
        };
    };
};
export declare const DockPanelMeta: {
    readonly name: "DockPanel";
    readonly doc: "A panel of a DockArea: a tab the user can move, dock, float or close, and one child element as its content.";
    readonly docFr: "Panneau d'une DockArea : un onglet que l'utilisateur peut déplacer, ancrer, détacher ou fermer, et un élément enfant comme contenu.";
    readonly family: "docking";
    readonly baseChain: readonly ["DockPanel", "Component"];
    readonly children: "SingleWidget";
    readonly defaultEvent: null;
    readonly properties: readonly [{
        readonly name: "Title";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Appearance";
        readonly doc: "Text of the panel's tab.";
        readonly docFr: "Texte de l'onglet du panneau.";
        readonly to: {
            readonly prop: "label";
        };
    }, {
        readonly name: "Icon";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Icon";
        readonly editor: "icon";
        readonly doc: "Icon shown before the title: a name of the Kubuno icon set, or an image file (SVG, PNG…) relative to the view.";
        readonly docFr: "Icône affichée avant le titre : un nom du jeu d'icônes Kubuno, ou un fichier image (SVG, PNG…) relatif à la vue.";
        readonly to: {
            readonly runtime: "item-state";
        };
    }, {
        readonly name: "Side";
        readonly kind: {
            readonly Enum: readonly ["Right", "Left", "Float"];
        };
        readonly default: "Right";
        readonly category: "Misc";
        readonly doc: "Where the panel is docked by default.";
        readonly docFr: "Côté où le panneau est ancré par défaut.";
        readonly to: {
            readonly runtime: "item-state";
        };
    }, {
        readonly name: "Group";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Misc";
        readonly doc: "Panels of the same side with the same group share one tab group; empty for a group of its own.";
        readonly docFr: "Les panneaux d'un même côté ayant le même groupe partagent un groupe d'onglets ; vide pour un groupe à lui seul.";
        readonly to: {
            readonly runtime: "item-state";
        };
    }, {
        readonly name: "Active";
        readonly kind: "Bool";
        readonly default: "false";
        readonly category: "Behavior";
        readonly doc: "Shows this panel first in its tab group.";
        readonly docFr: "Affiche ce panneau en premier dans son groupe d'onglets.";
        readonly to: {
            readonly runtime: "item-state";
        };
    }, ...import("../../ui/kbview/types.ts").PropertyMeta<never>[]];
    readonly events: readonly [];
    readonly web: {
        readonly module: null;
        readonly export: null;
        readonly domRoot: "none";
        readonly itemOf: readonly ["DockArea"];
    };
};
export declare const WorkspaceShellMeta: {
    readonly name: "WorkspaceShell";
    readonly doc: "The frame of an editor: a top bar with the title, the editor's name and the document's details, an optional status bar, and one child element as its body (typically a DockArea).";
    readonly docFr: "Cadre d'un éditeur : une barre supérieure avec le titre, le nom de l'éditeur et les détails du document, une barre d'état facultative, et un élément enfant comme corps (en général une DockArea).";
    readonly family: "docking";
    readonly baseChain: readonly ["WorkspaceShell", "ContainerBase", "ScrollableControl", "Control", "Component"];
    readonly children: "SingleWidget";
    readonly defaultEvent: "OnBack";
    readonly properties: readonly [{
        readonly name: "Title";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Appearance";
        readonly doc: "Title shown in the top bar (the document's name).";
        readonly docFr: "Titre affiché dans la barre supérieure (le nom du document).";
        readonly to: {
            readonly prop: "title";
        };
    }, {
        readonly name: "Icon";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Icon";
        readonly editor: "icon";
        readonly doc: "Icon shown before the title: a name of the Kubuno icon set, or an image file (SVG, PNG…) relative to the view.";
        readonly docFr: "Icône affichée avant le titre : un nom du jeu d'icônes Kubuno, ou un fichier image (SVG, PNG…) relatif à la vue.";
        readonly to: {
            readonly prop: "titleIcon";
            readonly convert: "icon-node";
        };
    }, {
        readonly name: "Subtitle";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Appearance";
        readonly doc: "Name of the editor, shown after the title in the accent colour.";
        readonly docFr: "Nom de l'éditeur, affiché après le titre dans la couleur d'accent.";
        readonly to: {
            readonly prop: "subtitle";
        };
    }, {
        readonly name: "DocInfo";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Misc";
        readonly doc: "Details of the document shown after the subtitle (dimensions, page count…).";
        readonly docFr: "Détails du document affichés après le sous-titre (dimensions, nombre de pages…).";
        readonly to: {
            readonly prop: "docInfo";
        };
    }, {
        readonly name: "StatusText";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Misc";
        readonly doc: "Texts of the status bar, separated by a vertical bar (|); empty for no status bar.";
        readonly docFr: "Textes de la barre d'état, séparés par « | » ; vide pour ne pas afficher de barre d'état.";
        readonly to: {
            readonly prop: "statusBar";
            readonly convert: "status-text";
        };
    }, {
        readonly name: "Theme";
        readonly kind: {
            readonly Enum: readonly ["Default", "Dark", "Light", "Office"];
        };
        readonly default: "Default";
        readonly category: "Misc";
        readonly doc: "Colours of the frame: the application's (light or dark), or a fixed palette.";
        readonly docFr: "Couleurs du cadre.";
        readonly to: {
            readonly prop: "theme";
            readonly convert: "workspace-theme";
        };
    }, {
        readonly name: "ShowBack";
        readonly kind: "Bool";
        readonly default: "false";
        readonly category: "Behavior";
        readonly doc: "Shows the back arrow.";
        readonly docFr: "Affiche la flèche de retour.";
        readonly to: {
            readonly runtime: "item-state";
        };
    }, {
        readonly name: "ShowSearch";
        readonly kind: "Bool";
        readonly default: "false";
        readonly category: "Behavior";
        readonly doc: "Shows the search button.";
        readonly docFr: "Affiche le bouton de recherche.";
        readonly to: {
            readonly prop: "showSearch";
        };
    }, {
        readonly name: "ShowDelete";
        readonly kind: "Bool";
        readonly default: "false";
        readonly category: "Behavior";
        readonly doc: "Shows the delete button.";
        readonly docFr: "Affiche le bouton de suppression.";
        readonly to: {
            readonly runtime: "item-state";
        };
    }, ...import("../../ui/kbview/types.ts").PropertyMeta<never>[], {
        readonly name: "Chromeless";
        readonly kind: "Bool";
        readonly default: "false";
        readonly category: "Behavior";
        readonly webOnly: true;
        readonly doc: "Web only: hides the host's global header while the editor is shown and hosts its actions in the top bar.";
        readonly docFr: "Web uniquement : masque l'en-tête global de l'hôte pendant l'affichage de l'éditeur et accueille ses actions dans la barre supérieure.";
        readonly to: {
            readonly prop: "chromeless";
        };
    }];
    readonly events: readonly [{
        readonly name: "OnBack";
        readonly category: "Action";
        readonly args: "EventArgs";
        readonly doc: "Occurs when the back arrow is clicked.";
        readonly docFr: "Se produit quand on clique sur la flèche de retour.";
        readonly from: {
            readonly prop: "onBack";
            readonly args: "none";
        };
    }, {
        readonly name: "OnDelete";
        readonly category: "Action";
        readonly args: "EventArgs";
        readonly doc: "Occurs when the delete button is clicked.";
        readonly docFr: "Se produit quand on clique sur le bouton de suppression.";
        readonly from: {
            readonly prop: "onDelete";
            readonly args: "none";
        };
    }];
    readonly designDefaults: {
        readonly size: readonly [960, 600];
    };
    readonly web: {
        readonly module: "@kubuno/sdk";
        readonly export: "WorkspaceShell";
        readonly domRoot: "wrapper";
        readonly content: "children";
    };
};
