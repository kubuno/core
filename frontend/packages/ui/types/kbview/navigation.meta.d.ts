export declare const ToolbarItemMeta: {
    readonly name: "ToolbarItem";
    readonly doc: "A command of a Toolbar.";
    readonly docFr: "Commande d'une barre d'outils.";
    readonly family: "containers";
    readonly baseChain: readonly ["ToolbarItem", "Component"];
    readonly children: "None";
    readonly defaultEvent: "OnClick";
    readonly properties: readonly [{
        readonly name: "Text";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Appearance";
        readonly doc: "Text of the command. Leave empty for an icon-only command.";
        readonly docFr: "Texte de la commande. Laisser vide pour une commande avec icône seule.";
        readonly to: {
            readonly prop: "text";
        };
    }, {
        readonly to: {
            readonly prop: "icon";
            readonly convert: "icon-node";
        };
        readonly doc: "Icon shown before the text: a name of the Kubuno icon set, or an image file (SVG, PNG…) relative to the view.";
        readonly docFr: "Icône affichée avant le texte : un nom du jeu d'icônes Kubuno, ou un fichier image (SVG, PNG…) relatif à la vue.";
        readonly name: "Icon";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Icon";
        readonly editor: "icon";
    }, ...import("./types.ts").PropertyMeta<never>[], {
        readonly name: "ToolTip";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Misc";
        readonly localizable: true;
        readonly webOnly: true;
        readonly doc: "Web only: text shown under the pointer; the accessible name of an icon-only command.";
        readonly docFr: "Web uniquement : texte affiché sous le pointeur ; le nom accessible d'une commande avec icône seule.";
        readonly to: {
            readonly prop: "tooltip";
        };
    }, {
        readonly name: "Enabled";
        readonly kind: "Bool";
        readonly default: "true";
        readonly category: "Behavior";
        readonly bindable: true;
        readonly webOnly: true;
        readonly doc: "Web only: whether the command can be chosen.";
        readonly docFr: "Web uniquement : indique si la commande peut être choisie.";
        readonly to: {
            readonly prop: "disabled";
            readonly convert: "invert";
        };
    }];
    readonly events: readonly [{
        readonly name: "OnClick";
        readonly category: "Action";
        readonly args: "ItemEventArgs";
        readonly doc: "Occurs when the command is clicked.";
        readonly docFr: "Se produit quand la commande est cliquée.";
        readonly from: {
            readonly prop: "onClick";
            readonly args: "item";
        };
    }];
    readonly web: {
        readonly module: null;
        readonly export: null;
        readonly domRoot: "none";
        readonly itemOf: readonly ["Toolbar"];
    };
};
export declare const ToolbarMeta: {
    readonly name: "Toolbar";
    readonly doc: "A toolbar. Add the commands as ToolbarItem children. One tab stop: the arrow keys move between the commands.";
    readonly docFr: "Barre d'outils. Ajoutez les commandes comme éléments ToolbarItem enfants.";
    readonly family: "containers";
    readonly baseChain: readonly ["Toolbar", "Control", "Component"];
    readonly children: "List";
    readonly allowedChildren: readonly ["ToolbarItem"];
    readonly defaultEvent: "OnClick";
    readonly properties: readonly [{
        readonly name: "Band";
        readonly kind: "Bool";
        readonly default: "false";
        readonly category: "Layout";
        readonly doc: "Paints a background band behind the commands.";
        readonly docFr: "Peint une bande de fond derrière les commandes.";
        readonly to: {
            readonly prop: "band";
        };
    }];
    readonly events: readonly [];
    readonly inheritedMap: {
        readonly AccessibleName: {
            readonly prop: "aria-label";
        };
        readonly Class: {
            readonly prop: "className";
        };
    };
    readonly designDefaults: {
        readonly size: readonly [320, 40];
    };
    readonly web: {
        readonly module: "@ui";
        readonly export: "Toolbar";
        readonly domRoot: "ref";
        readonly childrenToProp: {
            readonly prop: "items";
            readonly item: "ToolbarItem";
            readonly content: "none";
            readonly key: "id";
        };
    };
};
export declare const SidebarItemMeta: {
    readonly name: "SidebarItem";
    readonly doc: "A row of a Sidebar: an icon and a label. SidebarItem children make it a group the user can expand or collapse.";
    readonly docFr: "Ligne d'un Sidebar : une icône et un libellé. Des SidebarItem enfants en font un groupe que l'utilisateur peut développer ou réduire.";
    readonly family: "navigation";
    readonly baseChain: readonly ["SidebarItem", "Component"];
    readonly children: "List";
    readonly allowedChildren: readonly ["SidebarItem"];
    readonly defaultEvent: "OnClick";
    readonly properties: readonly [{
        readonly name: "Text";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Appearance";
        readonly bindable: true;
        readonly localizable: true;
        readonly doc: "Label of the row.";
        readonly docFr: "Libellé de la ligne.";
        readonly to: {
            readonly prop: "text";
        };
    }, {
        readonly name: "Icon";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Icon";
        readonly editor: "icon";
        readonly doc: "Icon shown before the label: a name of the Kubuno icon set, or an image file (SVG, PNG…) relative to the view.";
        readonly docFr: "Icône affichée avant le libellé : un nom du jeu d'icônes Kubuno, ou un fichier image (SVG, PNG…) relatif à la vue.";
        readonly to: {
            readonly prop: "icon";
            readonly convert: "icon-node";
        };
    }, {
        readonly name: "Key";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Data";
        readonly doc: "The value of SelectedItem when the row is active; empty for its x:Name, else its text.";
        readonly docFr: "Valeur de SelectedItem quand la ligne est active ; vide pour le x:Name, sinon le texte.";
        readonly to: {
            readonly prop: "key";
        };
    }, {
        readonly name: "Expanded";
        readonly kind: "Bool";
        readonly default: "false";
        readonly category: "Behavior";
        readonly doc: "For a row with children: whether they are shown at first.";
        readonly docFr: "Pour une ligne qui a des enfants : indique s'ils sont affichés au départ.";
        readonly to: {
            readonly prop: "expanded";
        };
    }, {
        readonly name: "Enabled";
        readonly kind: "Bool";
        readonly default: "true";
        readonly category: "Behavior";
        readonly bindable: true;
        readonly doc: "Whether the row can be chosen.";
        readonly docFr: "Indique si la ligne peut être choisie.";
        readonly to: {
            readonly prop: "disabled";
            readonly convert: "invert";
        };
    }, {
        readonly name: "Visible";
        readonly kind: "Bool";
        readonly default: "true";
        readonly category: "Behavior";
        readonly bindable: true;
        readonly doc: "Whether the row is shown.";
        readonly docFr: "Indique si la ligne est affichée.";
        readonly to: {
            readonly runtime: "visible";
        };
    }, ...import("./types.ts").PropertyMeta<never>[]];
    readonly events: readonly [{
        readonly name: "OnClick";
        readonly category: "Action";
        readonly args: "ItemEventArgs";
        readonly doc: "Occurs when the row is chosen.";
        readonly docFr: "Se produit quand la ligne est choisie.";
        readonly from: {
            readonly prop: "onClick";
            readonly args: "item";
        };
    }];
    readonly web: {
        readonly module: null;
        readonly export: null;
        readonly domRoot: "none";
        readonly itemOf: readonly ["Sidebar", "SidebarItem"];
        readonly fixed: {
            readonly kind: "item";
        };
    };
};
export declare const SidebarSectionMeta: {
    readonly name: "SidebarSection";
    readonly doc: "A section header of a Sidebar: small uppercase text above the rows that follow it.";
    readonly docFr: "En-tête de section d'un Sidebar : un petit texte en majuscules au-dessus des lignes qui le suivent.";
    readonly family: "navigation";
    readonly baseChain: readonly ["SidebarSection", "Component"];
    readonly children: "None";
    readonly defaultEvent: null;
    readonly properties: readonly [{
        readonly name: "Text";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Appearance";
        readonly bindable: true;
        readonly localizable: true;
        readonly doc: "Text of the header.";
        readonly docFr: "Texte de l'en-tête.";
        readonly to: {
            readonly prop: "text";
        };
    }, {
        readonly name: "Visible";
        readonly kind: "Bool";
        readonly default: "true";
        readonly category: "Behavior";
        readonly bindable: true;
        readonly doc: "Whether the header is shown.";
        readonly docFr: "Indique si l'en-tête est affiché.";
        readonly to: {
            readonly runtime: "visible";
        };
    }];
    readonly events: readonly [];
    readonly web: {
        readonly module: null;
        readonly export: null;
        readonly domRoot: "none";
        readonly itemOf: readonly ["Sidebar"];
        readonly fixed: {
            readonly kind: "section";
        };
    };
};
export declare const SidebarMeta: {
    readonly name: "Sidebar";
    readonly doc: "A navigation pane: rows with an icon and a label, section headers and expandable groups. The active row is SelectedItem. On the web, the rows are links of a <nav> (aria-current marks the active one).";
    readonly docFr: "Volet de navigation : lignes avec une icône et un libellé, en-têtes de section et groupes dépliables. La ligne active est SelectedItem.";
    readonly family: "navigation";
    readonly baseChain: readonly ["Sidebar", "Control", "Component"];
    readonly children: "List";
    readonly allowedChildren: readonly ["SidebarItem", "SidebarSection"];
    readonly defaultEvent: "OnItemInvoked";
    readonly properties: readonly [{
        readonly name: "SelectedItem";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Behavior";
        readonly bindable: true;
        readonly doc: "Key of the active row (its x:Name, or its text when it has no Key).";
        readonly docFr: "Clé (Key) de la ligne active (son x:Name, ou son texte si elle n'a pas de Key).";
        readonly to: {
            readonly prop: "value";
            readonly change: "OnSelectionChanged";
        };
    }, {
        readonly name: "DisplayMode";
        readonly kind: {
            readonly Enum: readonly ["Expanded", "Compact"];
        };
        readonly default: "Expanded";
        readonly category: "Appearance";
        readonly bindable: true;
        readonly doc: "Expanded shows the labels; Compact shows a rail of icons.";
        readonly docFr: "Expanded affiche les libellés ; Compact affiche un rail d'icônes.";
        readonly to: {
            readonly prop: "collapsed";
            readonly values: {
                readonly Expanded: false;
                readonly Compact: true;
            };
        };
    }, {
        readonly name: "ItemsSource";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Data";
        readonly bindable: true;
        readonly editor: "list";
        readonly doc: "Rows from a list (fields Text, Icon, Key, Level, and Kind=\"Section\" for a header), instead of the rows written inside.";
        readonly docFr: "Lignes issues d'une liste (champs Text, Icon, Key, Level, et Kind=\"Section\" pour un en-tête), à la place des lignes écrites dedans.";
        readonly to: {
            readonly prop: "source";
            readonly convert: "items-source-icons";
        };
    }];
    readonly events: readonly [{
        readonly name: "OnItemInvoked";
        readonly category: "Action";
        readonly args: "ValueChangedEventArgs";
        readonly doc: "Occurs when a row is chosen (click, Enter or Space): its key is the new text.";
        readonly docFr: "Se produit quand une ligne est choisie (clic ou Entrée) : sa clé est le nouveau texte.";
        readonly from: {
            readonly prop: "onItemInvoked";
            readonly args: "value";
        };
    }, {
        readonly name: "OnSelectionChanged";
        readonly category: "Property Changed";
        readonly args: "ValueChangedEventArgs";
        readonly doc: "Occurs when the active row changes.";
        readonly docFr: "Se produit quand la ligne active change.";
        readonly from: {
            readonly prop: "onChange";
            readonly args: "value";
        };
    }];
    readonly inheritedMap: {
        readonly AccessibleName: {
            readonly prop: "aria-label";
        };
        readonly Class: {
            readonly prop: "className";
        };
    };
    readonly designDefaults: {
        readonly size: readonly [256, 360];
    };
    readonly web: {
        readonly module: "@ui";
        readonly export: "Sidebar";
        readonly domRoot: "ref";
        readonly childrenToProp: {
            readonly prop: "items";
            readonly item: readonly ["SidebarItem", "SidebarSection"];
            readonly content: "none";
            readonly key: "id";
            readonly nested: "items";
        };
    };
};
export declare const StatusLabelMeta: {
    readonly name: "StatusLabel";
    readonly doc: "A cell of a StatusBar: a text, an optional icon. Spring makes it share the leftover width; a Text of a single dash makes a separator; Clickable makes it a button.";
    readonly docFr: "Cellule d'une barre d'état : un texte, une icône facultative. Spring lui fait prendre la largeur restante ; un texte fait d'un seul tiret crée un séparateur ; Clickable en fait un bouton.";
    readonly family: "navigation";
    readonly baseChain: readonly ["StatusLabel", "Component"];
    readonly children: "None";
    readonly defaultEvent: "OnClick";
    readonly properties: readonly [{
        readonly name: "Text";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Appearance";
        readonly bindable: true;
        readonly localizable: true;
        readonly doc: "Text of the cell. A single dash makes a separator.";
        readonly docFr: "Texte de la cellule. Un seul tiret crée un séparateur.";
        readonly to: {
            readonly prop: "text";
        };
    }, {
        readonly name: "Icon";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Icon";
        readonly editor: "icon";
        readonly doc: "Icon shown before the text (a clickable cell): a name of the Kubuno icon set, or an image file relative to the view.";
        readonly docFr: "Icône affichée avant le texte (cellule cliquable) : un nom du jeu d'icônes Kubuno, ou un fichier image (SVG, PNG…) relatif à la vue.";
        readonly to: {
            readonly prop: "icon";
            readonly convert: "icon-node";
        };
    }, {
        readonly name: "Spring";
        readonly kind: "Bool";
        readonly default: "false";
        readonly category: "Layout";
        readonly doc: "The cell takes the width the other cells leave.";
        readonly docFr: "La cellule prend la largeur que les autres cellules laissent.";
        readonly to: {
            readonly prop: "spring";
        };
    }, {
        readonly name: "Clickable";
        readonly kind: "Bool";
        readonly default: "false";
        readonly category: "Behavior";
        readonly doc: "The cell is a button: it lights up under the pointer and raises OnClick.";
        readonly docFr: "La cellule est un bouton : elle s'éclaire sous la souris et déclenche OnClick.";
        readonly to: {
            readonly prop: "clickable";
        };
    }, {
        readonly name: "Enabled";
        readonly kind: "Bool";
        readonly default: "true";
        readonly category: "Behavior";
        readonly bindable: true;
        readonly doc: "Whether a clickable cell can be clicked.";
        readonly docFr: "Indique si une cellule cliquable peut être cliquée.";
        readonly to: {
            readonly prop: "disabled";
            readonly convert: "invert";
        };
    }, {
        readonly name: "Visible";
        readonly kind: "Bool";
        readonly default: "true";
        readonly category: "Behavior";
        readonly bindable: true;
        readonly doc: "Whether the cell is shown.";
        readonly docFr: "Indique si la cellule est affichée.";
        readonly to: {
            readonly runtime: "visible";
        };
    }, ...import("./types.ts").PropertyMeta<never>[]];
    readonly events: readonly [{
        readonly name: "OnClick";
        readonly category: "Action";
        readonly args: "ItemEventArgs";
        readonly doc: "Occurs when a clickable cell is clicked.";
        readonly docFr: "Se produit quand on clique sur une cellule cliquable.";
        readonly from: {
            readonly prop: "onClick";
            readonly args: "item";
        };
    }];
    readonly web: {
        readonly module: null;
        readonly export: null;
        readonly domRoot: "none";
        readonly itemOf: readonly ["StatusBar"];
    };
};
export declare const StatusBarMeta: {
    readonly name: "StatusBar";
    readonly doc: "A status bar: a row of StatusLabel cells along the bottom of a window. On the web, role=\"status\" (changes are announced politely).";
    readonly docFr: "Barre d'état : une rangée de cellules StatusLabel en bas d'une fenêtre.";
    readonly family: "navigation";
    readonly baseChain: readonly ["StatusBar", "Control", "Component"];
    readonly children: "List";
    readonly allowedChildren: readonly ["StatusLabel"];
    readonly defaultEvent: "OnItemClicked";
    readonly properties: readonly [];
    readonly events: readonly [{
        readonly name: "OnItemClicked";
        readonly category: "Action";
        readonly args: "ItemEventArgs";
        readonly doc: "Occurs when a clickable cell is clicked (its index is in the event).";
        readonly docFr: "Se produit quand on clique sur une cellule cliquable (son index est dans l'événement).";
        readonly from: {
            readonly prop: "onItemClick";
            readonly args: "row";
        };
    }];
    readonly inheritedMap: {
        readonly AccessibleName: {
            readonly prop: "aria-label";
        };
        readonly Class: {
            readonly prop: "className";
        };
    };
    readonly designDefaults: {
        readonly size: readonly [480, 24];
    };
    readonly web: {
        readonly module: "@ui";
        readonly export: "StatusBar";
        readonly domRoot: "ref";
        readonly childrenToProp: {
            readonly prop: "items";
            readonly item: "StatusLabel";
            readonly content: "none";
            readonly key: "id";
        };
    };
};
export declare const SplitterMeta: {
    readonly name: "Splitter";
    readonly doc: "Two panes separated by a bar that can be dragged. On the web the bar is a focusable separator: the arrow keys move it (Shift: by 50 px), Home / End.";
    readonly docFr: "Deux volets séparés par une barre que l'on peut faire glisser.";
    readonly family: "containers";
    readonly baseChain: readonly ["Splitter", "ContainerBase", "ScrollableControl", "Control", "Component"];
    readonly children: "List";
    readonly layoutKind: "Split";
    readonly defaultEvent: "OnDistanceChanged";
    readonly properties: readonly [{
        readonly name: "Orientation";
        readonly kind: {
            readonly Enum: readonly ["Vertical", "Horizontal"];
        };
        readonly default: "Vertical";
        readonly category: "Layout";
        readonly doc: "Vertical: panes side by side. Horizontal: panes one above the other.";
        readonly docFr: "Vertical : volets côte à côte. Horizontal : volets l'un au-dessus de l'autre.";
        readonly to: {
            readonly prop: "orientation";
            readonly values: {
                readonly Vertical: "vertical";
                readonly Horizontal: "horizontal";
            };
        };
    }, {
        readonly name: "Distance";
        readonly kind: "F32";
        readonly default: "200";
        readonly category: "Layout";
        readonly doc: "Size of the first pane, in pixels. Updated when the bar is moved.";
        readonly docFr: "Taille du premier volet, en pixels. Mise à jour quand la barre est déplacée.";
        readonly to: {
            readonly prop: "distance";
            readonly change: "OnDistanceChanged";
        };
    }];
    readonly events: readonly [{
        readonly name: "OnDistanceChanged";
        readonly category: "Behavior";
        readonly args: "ValueChangedEventArgs";
        readonly doc: "Occurs when the bar is moved.";
        readonly docFr: "Se produit quand la barre est déplacée.";
        readonly from: {
            readonly prop: "onDistanceChange";
            readonly args: "value";
        };
    }];
    readonly inheritedMap: {
        readonly AccessibleName: {
            readonly prop: "aria-label";
        };
        readonly Class: {
            readonly prop: "className";
        };
    };
    readonly designDefaults: {
        readonly size: readonly [480, 240];
    };
    readonly web: {
        readonly module: "@ui";
        readonly export: "Splitter";
        readonly domRoot: "ref";
        readonly content: "children";
    };
};
export declare const SearchFieldMeta: {
    readonly name: "SearchField";
    readonly doc: "A search box with a clear button. On the web, Escape clears it and Enter raises OnSearch.";
    readonly docFr: "Champ de recherche avec un bouton pour l'effacer.";
    readonly family: "text";
    readonly baseChain: readonly ["SearchField", "TextBoxBase", "Control", "Component"];
    readonly children: "None";
    readonly defaultEvent: "OnTextChanged";
    readonly properties: readonly [{
        readonly name: "Text";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Appearance";
        readonly doc: "The searched text.";
        readonly docFr: "Texte recherché.";
        readonly to: {
            readonly prop: "value";
            readonly change: "OnTextChanged";
        };
    }, {
        readonly name: "Placeholder";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Appearance";
        readonly doc: "Hint shown while the field is empty.";
        readonly docFr: "Indication affichée tant que le champ est vide.";
        readonly to: {
            readonly prop: "placeholder";
        };
    }];
    readonly events: readonly [{
        readonly name: "OnTextChanged";
        readonly category: "Property Changed";
        readonly args: "ValueChangedEventArgs";
        readonly aliases: readonly ["OnChanged"];
        readonly doc: "Occurs when the searched text changes.";
        readonly docFr: "Se produit quand le texte recherché change.";
        readonly from: {
            readonly prop: "onChange";
            readonly args: "value";
        };
    }, {
        readonly name: "OnSearch";
        readonly category: "Action";
        readonly args: "ValueChangedEventArgs";
        readonly doc: "Web only: occurs when Enter asks for the search now (the text is the value).";
        readonly docFr: "Web uniquement : se produit quand Entrée demande la recherche tout de suite (le texte est la valeur).";
        readonly from: {
            readonly prop: "onSearch";
            readonly args: "value";
        };
    }];
    readonly inheritedMap: {
        readonly Enabled: {
            readonly prop: "disabled";
            readonly convert: "invert";
        };
        readonly ReadOnly: {
            readonly prop: "readOnly";
        };
        readonly MaxLength: {
            readonly prop: "maxLength";
        };
        readonly AccessibleName: {
            readonly prop: "aria-label";
        };
        readonly Class: {
            readonly prop: "className";
        };
    };
    readonly designDefaults: {
        readonly attributes: {
            readonly Placeholder: "Rechercher";
        };
        readonly size: readonly [240, 36];
    };
    readonly web: {
        readonly module: "@ui";
        readonly export: "SearchField";
        readonly domRoot: "wrapper";
    };
};
export declare const MaskedFieldMeta: {
    readonly name: "MaskedField";
    readonly doc: "A text box that follows an input mask, for example 00/00/0000 (0 digit, 9 optional digit, L letter, ? optional letter, A / a letter or digit, & / C any character, \\ before a literal).";
    readonly docFr: "Zone de texte qui suit un masque de saisie, par exemple 00/00/0000.";
    readonly family: "text";
    readonly baseChain: readonly ["MaskedField", "TextBoxBase", "Control", "Component"];
    readonly children: "None";
    readonly defaultEvent: "OnTextChanged";
    readonly properties: readonly [{
        readonly name: "Mask";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Appearance";
        readonly doc: "Input mask, for example 00/00/0000 for a date.";
        readonly docFr: "Masque de saisie, par exemple 00/00/0000 pour une date.";
        readonly to: {
            readonly prop: "mask";
        };
    }, {
        readonly name: "Text";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Appearance";
        readonly doc: "Text in the field (with the mask's literals).";
        readonly docFr: "Texte contenu dans le champ.";
        readonly to: {
            readonly prop: "value";
            readonly change: "OnTextChanged";
        };
    }, {
        readonly name: "Invalid";
        readonly kind: "Bool";
        readonly default: "false";
        readonly category: "Behavior";
        readonly doc: "Shows the field in the error colour.";
        readonly docFr: "Affiche le champ dans la couleur d'erreur.";
        readonly to: {
            readonly prop: "invalid";
        };
    }];
    readonly events: readonly [{
        readonly name: "OnTextChanged";
        readonly category: "Property Changed";
        readonly args: "ValueChangedEventArgs";
        readonly aliases: readonly ["OnChanged"];
        readonly doc: "Occurs when the text changes.";
        readonly docFr: "Se produit quand le texte change.";
        readonly from: {
            readonly prop: "onChange";
            readonly args: "value";
        };
    }];
    readonly inheritedMap: {
        readonly Enabled: {
            readonly prop: "disabled";
            readonly convert: "invert";
        };
        readonly ReadOnly: {
            readonly prop: "readOnly";
        };
        readonly AccessibleName: {
            readonly prop: "aria-label";
        };
        readonly Class: {
            readonly prop: "className";
        };
    };
    readonly designDefaults: {
        readonly attributes: {
            readonly Mask: "00/00/0000";
        };
        readonly size: readonly [160, 36];
    };
    readonly web: {
        readonly module: "@ui";
        readonly export: "MaskedField";
        readonly domRoot: "ref";
    };
};
export declare const PaintBoxMeta: {
    readonly name: "PaintBox";
    readonly doc: "A drawing surface: your OnPaint handler draws on it. On the web a <canvas>: e.ctx is its 2D context in CSS pixels (e.width, e.height, e.dpr); it is repainted on resize, on a pixel-ratio change and when PaintData changes.";
    readonly docFr: "Surface de dessin : votre gestionnaire OnPaint y dessine.";
    readonly family: "display";
    readonly baseChain: readonly ["PaintBox", "Control", "Component"];
    readonly children: "None";
    readonly defaultEvent: "OnPaint";
    readonly properties: readonly [{
        readonly name: "PaintData";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Data";
        readonly bindable: true;
        readonly editor: "object";
        readonly webOnly: true;
        readonly doc: "Web only: what the drawing depends on (a binding); a new value repaints the surface, and it is e.data in OnPaint.";
        readonly docFr: "Web uniquement : ce dont dépend le dessin (une liaison) ; une nouvelle valeur redessine la surface, et elle est e.data dans OnPaint.";
        readonly to: {
            readonly prop: "data";
        };
    }];
    readonly events: readonly [{
        readonly name: "OnPaint";
        readonly category: "Appearance";
        readonly args: "PaintEventArgs";
        readonly doc: "Occurs when the surface is drawn: draw with e.ctx (CSS pixels) in e.width × e.height.";
        readonly docFr: "Se produit quand la surface est dessinée : dessinez avec e.graphics() dans e.clip_rectangle.";
        readonly from: {
            readonly prop: "onPaint";
            readonly args: "paint";
        };
    }];
    readonly inheritedMap: {
        readonly AccessibleName: {
            readonly prop: "aria-label";
        };
        readonly Class: {
            readonly prop: "className";
        };
    };
    readonly designDefaults: {
        readonly size: readonly [240, 150];
    };
    readonly web: {
        readonly module: "@ui";
        readonly export: "PaintBox";
        readonly domRoot: "ref";
    };
};
