export declare const AppTileGridMeta: {
    readonly name: "AppTileGrid";
    readonly doc: "The app launcher's tiles: the favourites card (its header written as <AppTileGrid.Header>) over every other app, three to a row, with the drag-and-drop edit of the favourites.";
    readonly docFr: "Les tuiles du lanceur d'applis : la carte des favoris (son en-tête écrit dans <AppTileGrid.Header>) au-dessus de toutes les autres applis, trois par ligne, avec la modification des favoris par glisser-déposer.";
    readonly family: "components";
    readonly baseChain: readonly ["AppTileGrid", "Control", "Component"];
    readonly children: "None";
    readonly defaultEvent: "OnTileInvoked";
    readonly properties: readonly [{
        readonly name: "Apps";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Data";
        readonly bindable: true;
        readonly editor: "list";
        readonly doc: "The apps of the launcher (a binding to a list of LauncherApp).";
        readonly docFr: "Les applis du lanceur (une liaison vers une liste de LauncherApp).";
        readonly to: {
            readonly prop: "apps";
        };
    }, {
        readonly name: "Favorites";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Data";
        readonly bindable: true;
        readonly editor: "list";
        readonly doc: "The favourites shown on the card, in order (the draft while editing).";
        readonly docFr: "Les favoris affichés sur la carte, dans l'ordre (le brouillon pendant la modification).";
        readonly to: {
            readonly prop: "favorites";
        };
    }, {
        readonly name: "Editing";
        readonly kind: "Bool";
        readonly default: "false";
        readonly category: "Behavior";
        readonly bindable: true;
        readonly doc: "The favourites are being edited: tiles are dragged, a click adds or removes.";
        readonly docFr: "Les favoris sont en cours de modification : les tuiles se glissent, un clic ajoute ou retire.";
        readonly to: {
            readonly prop: "editing";
        };
    }, {
        readonly name: "DropHereText";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Appearance";
        readonly localizable: true;
        readonly doc: "Text of the empty card while editing.";
        readonly docFr: "Texte de la carte vide pendant la modification.";
        readonly to: {
            readonly prop: "dropHereText";
        };
    }, {
        readonly name: "AllFavoritesText";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Appearance";
        readonly localizable: true;
        readonly doc: "Text shown when every app is a favourite while editing.";
        readonly docFr: "Texte affiché quand toutes les applis sont des favoris pendant la modification.";
        readonly to: {
            readonly prop: "allFavoritesText";
        };
    }, {
        readonly name: "Header";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Appearance";
        readonly serialization: "Content";
        readonly browsable: false;
        readonly doc: "The card's header band, written as a <AppTileGrid.Header> property element.";
        readonly docFr: "La bande d'en-tête de la carte, écrite dans un élément de propriété <AppTileGrid.Header>.";
        readonly to: {
            readonly prop: "header";
        };
    }];
    readonly events: readonly [{
        readonly name: "OnTileInvoked";
        readonly category: "Action";
        readonly args: "ValueChangedEventArgs";
        readonly doc: "Occurs when an app's tile is clicked outside the edit mode: e.value is its id.";
        readonly docFr: "Se produit quand on clique sur la tuile d'une appli hors modification : e.value est son identifiant.";
        readonly from: {
            readonly prop: "onTileInvoked";
            readonly args: "value";
        };
    }, {
        readonly name: "OnFavoritesEdited";
        readonly category: "Action";
        readonly args: "ValueChangedEventArgs";
        readonly doc: "Occurs when the favourites being edited change: e.value is the new list.";
        readonly docFr: "Se produit quand les favoris en cours de modification changent : e.value est la nouvelle liste.";
        readonly from: {
            readonly prop: "onFavoritesEdited";
            readonly args: "value";
        };
    }];
    readonly designDefaults: {
        readonly size: readonly [342, 400];
    };
    readonly web: {
        readonly module: "./AppTileGrid";
        readonly export: "AppTileGrid";
        readonly domRoot: "wrapper";
        readonly slots: {
            readonly Header: "header";
        };
    };
};
export declare const MenuLinkMeta: {
    readonly name: "MenuLink";
    readonly doc: "A link that is an item of the menu hosting the view (the arrow keys reach it, choosing it closes the menu); a plain link elsewhere.";
    readonly docFr: "Lien qui est un élément du menu qui accueille la vue (les flèches l'atteignent, le choisir ferme le menu) ; un lien ordinaire ailleurs.";
    readonly family: "components";
    readonly baseChain: readonly ["MenuLink", "Control", "Component"];
    readonly children: "None";
    readonly defaultEvent: "OnClick";
    readonly properties: readonly [{
        readonly name: "Text";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Appearance";
        readonly localizable: true;
        readonly doc: "Text of the link.";
        readonly docFr: "Texte du lien.";
        readonly to: {
            readonly prop: "text";
        };
    }, {
        readonly name: "Href";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Behavior";
        readonly bindable: true;
        readonly doc: "The address of the link (middle click, open in a new tab); a plain click raises OnClick.";
        readonly docFr: "L'adresse du lien (clic du milieu, ouvrir dans un nouvel onglet) ; un clic simple déclenche OnClick.";
        readonly to: {
            readonly prop: "href";
        };
    }];
    readonly events: readonly [{
        readonly name: "OnClick";
        readonly category: "Action";
        readonly args: "MouseEventArgs";
        readonly doc: "Occurs when the link is chosen.";
        readonly docFr: "Se produit quand le lien est choisi.";
        readonly from: {
            readonly prop: "onClick";
            readonly args: "mouse";
        };
    }];
    readonly designDefaults: {
        readonly attributes: {
            readonly Text: "Lien";
        };
        readonly size: readonly [200, 36];
    };
    readonly web: {
        readonly module: "./MenuLink";
        readonly export: "MenuLink";
        readonly domRoot: "ref";
    };
};
export declare const WaffleButtonMeta: {
    readonly name: "WaffleButton";
    readonly doc: "The header's app-launcher button: opens the WaffleMenu in a popover above the page, anchored to the button.";
    readonly docFr: "Le bouton du lanceur d'applis de l'en-tête : ouvre le WaffleMenu dans une fenêtre surgissante au-dessus de la page, ancrée au bouton.";
    readonly family: "components";
    readonly baseChain: readonly ["WaffleButton", "Control", "Component"];
    readonly children: "None";
    readonly defaultEvent: "OnOpenChanged";
    readonly properties: readonly [{
        readonly name: "Apps";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Data";
        readonly bindable: true;
        readonly editor: "list";
        readonly doc: "The apps of the active modules.";
        readonly docFr: "Les applis des modules actifs.";
        readonly to: {
            readonly prop: "allApps";
        };
    }, {
        readonly name: "Dark";
        readonly kind: "Bool";
        readonly default: "false";
        readonly category: "Appearance";
        readonly doc: "For a dark title bar: a light glyph and a translucent hover.";
        readonly docFr: "Pour une barre de titre sombre : un glyphe clair et un survol translucide.";
        readonly to: {
            readonly prop: "dark";
        };
    }, {
        readonly name: "Fab";
        readonly kind: "Bool";
        readonly default: "false";
        readonly category: "Appearance";
        readonly doc: "The mobile floating action button (bottom-right, opening upwards).";
        readonly docFr: "Le bouton d'action flottant mobile (en bas à droite, s'ouvrant vers le haut).";
        readonly to: {
            readonly prop: "fab";
        };
    }];
    readonly events: readonly [{
        readonly name: "OnOpenChanged";
        readonly category: "Behavior";
        readonly args: "ValueChangedEventArgs";
        readonly doc: "Occurs when the launcher opens or closes: e.value says which.";
        readonly docFr: "Se produit quand le lanceur s'ouvre ou se ferme : e.value dit lequel.";
        readonly from: {
            readonly prop: "onOpenChange";
            readonly args: "value";
        };
    }];
    readonly designDefaults: {
        readonly size: readonly [36, 36];
    };
    readonly web: {
        readonly module: "./WaffleButton";
        readonly export: "WaffleButton";
        readonly domRoot: "wrapper";
    };
};
export declare const AccountButtonMeta: {
    readonly name: "AccountButton";
    readonly doc: "The header's avatar button: opens the AccountMenu in a popover above the page, anchored to the button.";
    readonly docFr: "Le bouton d'avatar de l'en-tête : ouvre l'AccountMenu dans une fenêtre surgissante au-dessus de la page, ancrée au bouton.";
    readonly family: "components";
    readonly baseChain: readonly ["AccountButton", "Control", "Component"];
    readonly children: "None";
    readonly defaultEvent: "OnAddAccount";
    readonly properties: readonly [];
    readonly events: readonly [{
        readonly name: "OnAddAccount";
        readonly category: "Action";
        readonly args: "EventArgs";
        readonly doc: "Occurs when « Ajouter un compte » (or « Connexion » on a dead session) asks for the add-account dialog.";
        readonly docFr: "Se produit quand « Ajouter un compte » (ou « Connexion » sur une session expirée) demande la boîte d'ajout de compte.";
        readonly from: {
            readonly prop: "onAddAccount";
            readonly args: "none";
        };
    }];
    readonly designDefaults: {
        readonly size: readonly [36, 36];
    };
    readonly web: {
        readonly module: "./AccountButton";
        readonly export: "AccountButton";
        readonly domRoot: "wrapper";
    };
};
export declare const SHELL_CONTROLS: readonly [{
    readonly name: "AppTileGrid";
    readonly doc: "The app launcher's tiles: the favourites card (its header written as <AppTileGrid.Header>) over every other app, three to a row, with the drag-and-drop edit of the favourites.";
    readonly docFr: "Les tuiles du lanceur d'applis : la carte des favoris (son en-tête écrit dans <AppTileGrid.Header>) au-dessus de toutes les autres applis, trois par ligne, avec la modification des favoris par glisser-déposer.";
    readonly family: "components";
    readonly baseChain: readonly ["AppTileGrid", "Control", "Component"];
    readonly children: "None";
    readonly defaultEvent: "OnTileInvoked";
    readonly properties: readonly [{
        readonly name: "Apps";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Data";
        readonly bindable: true;
        readonly editor: "list";
        readonly doc: "The apps of the launcher (a binding to a list of LauncherApp).";
        readonly docFr: "Les applis du lanceur (une liaison vers une liste de LauncherApp).";
        readonly to: {
            readonly prop: "apps";
        };
    }, {
        readonly name: "Favorites";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Data";
        readonly bindable: true;
        readonly editor: "list";
        readonly doc: "The favourites shown on the card, in order (the draft while editing).";
        readonly docFr: "Les favoris affichés sur la carte, dans l'ordre (le brouillon pendant la modification).";
        readonly to: {
            readonly prop: "favorites";
        };
    }, {
        readonly name: "Editing";
        readonly kind: "Bool";
        readonly default: "false";
        readonly category: "Behavior";
        readonly bindable: true;
        readonly doc: "The favourites are being edited: tiles are dragged, a click adds or removes.";
        readonly docFr: "Les favoris sont en cours de modification : les tuiles se glissent, un clic ajoute ou retire.";
        readonly to: {
            readonly prop: "editing";
        };
    }, {
        readonly name: "DropHereText";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Appearance";
        readonly localizable: true;
        readonly doc: "Text of the empty card while editing.";
        readonly docFr: "Texte de la carte vide pendant la modification.";
        readonly to: {
            readonly prop: "dropHereText";
        };
    }, {
        readonly name: "AllFavoritesText";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Appearance";
        readonly localizable: true;
        readonly doc: "Text shown when every app is a favourite while editing.";
        readonly docFr: "Texte affiché quand toutes les applis sont des favoris pendant la modification.";
        readonly to: {
            readonly prop: "allFavoritesText";
        };
    }, {
        readonly name: "Header";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Appearance";
        readonly serialization: "Content";
        readonly browsable: false;
        readonly doc: "The card's header band, written as a <AppTileGrid.Header> property element.";
        readonly docFr: "La bande d'en-tête de la carte, écrite dans un élément de propriété <AppTileGrid.Header>.";
        readonly to: {
            readonly prop: "header";
        };
    }];
    readonly events: readonly [{
        readonly name: "OnTileInvoked";
        readonly category: "Action";
        readonly args: "ValueChangedEventArgs";
        readonly doc: "Occurs when an app's tile is clicked outside the edit mode: e.value is its id.";
        readonly docFr: "Se produit quand on clique sur la tuile d'une appli hors modification : e.value est son identifiant.";
        readonly from: {
            readonly prop: "onTileInvoked";
            readonly args: "value";
        };
    }, {
        readonly name: "OnFavoritesEdited";
        readonly category: "Action";
        readonly args: "ValueChangedEventArgs";
        readonly doc: "Occurs when the favourites being edited change: e.value is the new list.";
        readonly docFr: "Se produit quand les favoris en cours de modification changent : e.value est la nouvelle liste.";
        readonly from: {
            readonly prop: "onFavoritesEdited";
            readonly args: "value";
        };
    }];
    readonly designDefaults: {
        readonly size: readonly [342, 400];
    };
    readonly web: {
        readonly module: "./AppTileGrid";
        readonly export: "AppTileGrid";
        readonly domRoot: "wrapper";
        readonly slots: {
            readonly Header: "header";
        };
    };
}, {
    readonly name: "MenuLink";
    readonly doc: "A link that is an item of the menu hosting the view (the arrow keys reach it, choosing it closes the menu); a plain link elsewhere.";
    readonly docFr: "Lien qui est un élément du menu qui accueille la vue (les flèches l'atteignent, le choisir ferme le menu) ; un lien ordinaire ailleurs.";
    readonly family: "components";
    readonly baseChain: readonly ["MenuLink", "Control", "Component"];
    readonly children: "None";
    readonly defaultEvent: "OnClick";
    readonly properties: readonly [{
        readonly name: "Text";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Appearance";
        readonly localizable: true;
        readonly doc: "Text of the link.";
        readonly docFr: "Texte du lien.";
        readonly to: {
            readonly prop: "text";
        };
    }, {
        readonly name: "Href";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Behavior";
        readonly bindable: true;
        readonly doc: "The address of the link (middle click, open in a new tab); a plain click raises OnClick.";
        readonly docFr: "L'adresse du lien (clic du milieu, ouvrir dans un nouvel onglet) ; un clic simple déclenche OnClick.";
        readonly to: {
            readonly prop: "href";
        };
    }];
    readonly events: readonly [{
        readonly name: "OnClick";
        readonly category: "Action";
        readonly args: "MouseEventArgs";
        readonly doc: "Occurs when the link is chosen.";
        readonly docFr: "Se produit quand le lien est choisi.";
        readonly from: {
            readonly prop: "onClick";
            readonly args: "mouse";
        };
    }];
    readonly designDefaults: {
        readonly attributes: {
            readonly Text: "Lien";
        };
        readonly size: readonly [200, 36];
    };
    readonly web: {
        readonly module: "./MenuLink";
        readonly export: "MenuLink";
        readonly domRoot: "ref";
    };
}, {
    readonly name: "WaffleButton";
    readonly doc: "The header's app-launcher button: opens the WaffleMenu in a popover above the page, anchored to the button.";
    readonly docFr: "Le bouton du lanceur d'applis de l'en-tête : ouvre le WaffleMenu dans une fenêtre surgissante au-dessus de la page, ancrée au bouton.";
    readonly family: "components";
    readonly baseChain: readonly ["WaffleButton", "Control", "Component"];
    readonly children: "None";
    readonly defaultEvent: "OnOpenChanged";
    readonly properties: readonly [{
        readonly name: "Apps";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Data";
        readonly bindable: true;
        readonly editor: "list";
        readonly doc: "The apps of the active modules.";
        readonly docFr: "Les applis des modules actifs.";
        readonly to: {
            readonly prop: "allApps";
        };
    }, {
        readonly name: "Dark";
        readonly kind: "Bool";
        readonly default: "false";
        readonly category: "Appearance";
        readonly doc: "For a dark title bar: a light glyph and a translucent hover.";
        readonly docFr: "Pour une barre de titre sombre : un glyphe clair et un survol translucide.";
        readonly to: {
            readonly prop: "dark";
        };
    }, {
        readonly name: "Fab";
        readonly kind: "Bool";
        readonly default: "false";
        readonly category: "Appearance";
        readonly doc: "The mobile floating action button (bottom-right, opening upwards).";
        readonly docFr: "Le bouton d'action flottant mobile (en bas à droite, s'ouvrant vers le haut).";
        readonly to: {
            readonly prop: "fab";
        };
    }];
    readonly events: readonly [{
        readonly name: "OnOpenChanged";
        readonly category: "Behavior";
        readonly args: "ValueChangedEventArgs";
        readonly doc: "Occurs when the launcher opens or closes: e.value says which.";
        readonly docFr: "Se produit quand le lanceur s'ouvre ou se ferme : e.value dit lequel.";
        readonly from: {
            readonly prop: "onOpenChange";
            readonly args: "value";
        };
    }];
    readonly designDefaults: {
        readonly size: readonly [36, 36];
    };
    readonly web: {
        readonly module: "./WaffleButton";
        readonly export: "WaffleButton";
        readonly domRoot: "wrapper";
    };
}, {
    readonly name: "AccountButton";
    readonly doc: "The header's avatar button: opens the AccountMenu in a popover above the page, anchored to the button.";
    readonly docFr: "Le bouton d'avatar de l'en-tête : ouvre l'AccountMenu dans une fenêtre surgissante au-dessus de la page, ancrée au bouton.";
    readonly family: "components";
    readonly baseChain: readonly ["AccountButton", "Control", "Component"];
    readonly children: "None";
    readonly defaultEvent: "OnAddAccount";
    readonly properties: readonly [];
    readonly events: readonly [{
        readonly name: "OnAddAccount";
        readonly category: "Action";
        readonly args: "EventArgs";
        readonly doc: "Occurs when « Ajouter un compte » (or « Connexion » on a dead session) asks for the add-account dialog.";
        readonly docFr: "Se produit quand « Ajouter un compte » (ou « Connexion » sur une session expirée) demande la boîte d'ajout de compte.";
        readonly from: {
            readonly prop: "onAddAccount";
            readonly args: "none";
        };
    }];
    readonly designDefaults: {
        readonly size: readonly [36, 36];
    };
    readonly web: {
        readonly module: "./AccountButton";
        readonly export: "AccountButton";
        readonly domRoot: "wrapper";
    };
}];
