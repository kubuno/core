export declare const ContextMenuMeta: {
    readonly name: "ContextMenu";
    readonly doc: "A menu shown when a control that names it in its ContextMenu property is right-clicked, when a button names it in its DropDownMenu property, or from code (show). Add its commands as MenuItem elements; MenuItem children make a sub-menu.";
    readonly docFr: "Menu affiché quand on clique avec le bouton droit sur un contrôle qui le nomme dans sa propriété ContextMenu, quand on clique sur un bouton qui le nomme dans sa propriété DropDownMenu, ou depuis le code (show). Ajoutez ses commandes comme éléments MenuItem enfants ; des MenuItem enfants d'un MenuItem forment un sous-menu.";
    readonly family: "components";
    readonly baseChain: readonly ["ContextMenu", "Component"];
    readonly kind: "component";
    readonly children: "List";
    readonly allowedChildren: readonly ["MenuItem"];
    readonly defaultEvent: "OnOpening";
    readonly properties: readonly [{
        readonly to: {
            readonly prop: "items";
            readonly convert: "items-source";
        };
        readonly doc: "Commands added from a list when the menu opens (fields Text, Key, Icon, ShortcutKeys, Checked, Enabled, Danger, and Kind = Separator or Header); choosing one raises OnItemClicked with its key.";
        readonly docFr: "Commandes ajoutées depuis une liste à l'ouverture du menu (champs Text, Key, Icon, ShortcutKeys, Checked, Enabled, Danger, et Kind = Separator ou Header) ; en choisir une déclenche OnItemClicked avec sa clé.";
        readonly name: "ItemsSource";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Data";
        readonly bindable: true;
        readonly editor: "list";
    }];
    readonly events: readonly [{
        readonly name: "OnOpening";
        readonly category: "Behavior";
        readonly args: "EventArgs";
        readonly doc: "Occurs when the menu is about to open.";
        readonly docFr: "Se produit quand le menu va s'ouvrir.";
        readonly from: {
            readonly runtime: "menu-open";
            readonly args: "none";
        };
    }, {
        readonly name: "OnItemClicked";
        readonly category: "Action";
        readonly args: "ValueChangedEventArgs";
        readonly doc: "Occurs when a command made from ItemsSource is chosen: its key is the new text.";
        readonly docFr: "Se produit quand une commande issue d'ItemsSource est choisie : sa clé est le nouveau texte.";
        readonly from: {
            readonly runtime: "parent-adapter";
            readonly args: "value";
        };
    }];
    readonly web: {
        readonly module: "@ui";
        readonly export: "MenuDropdown";
        readonly domRoot: "portal";
        readonly childrenToProp: {
            readonly prop: "items";
            readonly item: "MenuItem";
            readonly content: "none";
            readonly nested: "items";
        };
    };
};
export declare const MenuItemMeta: {
    readonly name: "MenuItem";
    readonly doc: "A command of a menu. MenuItem children make it a sub-menu; a Text of a single dash (or Kind Separator) makes a separator line.";
    readonly docFr: "Commande d'un menu. Des MenuItem enfants en font un sous-menu ; un texte fait d'un seul tiret (ou Kind Separator) crée une ligne de séparation.";
    readonly family: "components";
    readonly baseChain: readonly ["MenuItem", "Component"];
    readonly children: "List";
    readonly allowedChildren: readonly ["MenuItem"];
    readonly defaultEvent: "OnClick";
    readonly properties: readonly [{
        readonly name: "Text";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Appearance";
        readonly bindable: true;
        readonly localizable: true;
        readonly doc: "Text of the command. An ampersand before a letter makes it its keyboard shortcut in the menu.";
        readonly docFr: "Texte de la commande. Une esperluette devant une lettre en fait le raccourci clavier dans le menu.";
        readonly to: {
            readonly prop: "label";
        };
    }, {
        readonly name: "Icon";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Icon";
        readonly editor: "icon";
        readonly doc: "Icon shown before the text: a name of the Kubuno icon set, or an image file (SVG, PNG…) relative to the view.";
        readonly docFr: "Icône affichée avant le texte : un nom du jeu d'icônes Kubuno, ou un fichier image (SVG, PNG…) relatif à la vue.";
        readonly to: {
            readonly prop: "icon";
            readonly convert: "icon-node";
        };
    }, {
        readonly name: "Kind";
        readonly kind: {
            readonly Enum: readonly ["Command", "Separator", "Header"];
        };
        readonly default: "Command";
        readonly category: "Appearance";
        readonly doc: "A command, a separator line, or a section title.";
        readonly docFr: "Une commande, une ligne de séparation ou un titre de section.";
        readonly to: {
            readonly prop: "type";
            readonly values: {
                readonly Command: "action";
                readonly Separator: "separator";
                readonly Header: "label";
            };
        };
    }, {
        readonly name: "Danger";
        readonly kind: "Bool";
        readonly default: "false";
        readonly category: "Appearance";
        readonly doc: "A destructive command, shown in the danger colour.";
        readonly docFr: "Commande destructrice, affichée dans la couleur de danger.";
        readonly to: {
            readonly prop: "danger";
        };
    }, {
        readonly name: "Enabled";
        readonly kind: "Bool";
        readonly default: "true";
        readonly category: "Behavior";
        readonly bindable: true;
        readonly doc: "Whether the command can be chosen.";
        readonly docFr: "Indique si la commande peut être choisie.";
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
        readonly doc: "Whether the command is shown.";
        readonly docFr: "Indique si la commande est affichée.";
        readonly to: {
            readonly runtime: "visible";
        };
    }, {
        readonly name: "Checked";
        readonly kind: "Bool";
        readonly default: "false";
        readonly category: "Appearance";
        readonly bindable: true;
        readonly doc: "Shows a check mark before the command.";
        readonly docFr: "Affiche une coche devant la commande.";
        readonly to: {
            readonly prop: "checked";
            readonly change: "OnCheckedChanged";
        };
    }, {
        readonly name: "CheckOnClick";
        readonly kind: "Bool";
        readonly default: "false";
        readonly category: "Behavior";
        readonly doc: "Choosing the command toggles its check mark.";
        readonly docFr: "Choisir la commande inverse sa coche.";
        readonly to: {
            readonly runtime: "item-state";
        };
    }, {
        readonly name: "RadioGroup";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Behavior";
        readonly doc: "Commands with the same group are exclusive: choosing one checks it and unchecks the others.";
        readonly docFr: "Les commandes d'un même groupe s'excluent : en choisir une la coche et décoche les autres.";
        readonly to: {
            readonly runtime: "item-state";
        };
    }, {
        readonly name: "ShortcutKeys";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Misc";
        readonly doc: "Keyboard shortcut shown next to the command, for example Ctrl+C.";
        readonly docFr: "Raccourci clavier affiché à côté de la commande, par exemple Ctrl+C.";
        readonly to: {
            readonly prop: "shortcut";
        };
    }, {
        readonly name: "ItemsSource";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Data";
        readonly bindable: true;
        readonly editor: "list";
        readonly doc: "Sub-menu commands added from a list when it opens (see the ContextMenu's ItemsSource).";
        readonly docFr: "Commandes du sous-menu ajoutées depuis une liste à son ouverture (voir l'ItemsSource du ContextMenu).";
        readonly to: {
            readonly prop: "items";
            readonly convert: "items-source";
        };
    }, ...import("./types.ts").PropertyMeta<never>[]];
    readonly events: readonly [{
        readonly name: "OnClick";
        readonly category: "Action";
        readonly args: "MouseEventArgs";
        readonly doc: "Occurs when the command is chosen.";
        readonly docFr: "Se produit quand la commande est choisie.";
        readonly from: {
            readonly prop: "onClick";
            readonly args: "none";
        };
    }, {
        readonly name: "OnCheckedChanged";
        readonly category: "Property Changed";
        readonly args: "ValueChangedEventArgs";
        readonly doc: "Occurs when choosing the command changed its check mark (CheckOnClick, RadioGroup).";
        readonly docFr: "Se produit quand choisir la commande a changé sa coche (CheckOnClick, RadioGroup).";
        readonly from: {
            readonly runtime: "parent-adapter";
            readonly args: "value";
        };
    }];
    readonly web: {
        readonly module: null;
        readonly export: null;
        readonly domRoot: "none";
        readonly itemOf: readonly ["ContextMenu", "MenuItem"];
    };
};
export declare const ToolTipMeta: {
    readonly name: "ToolTip";
    readonly doc: "A component that sets how the tooltips of the view appear. Each control's tooltip text is its ToolTip property.";
    readonly docFr: "Composant qui règle l'apparition des info-bulles de la vue. Le texte de l'info-bulle de chaque contrôle est sa propriété ToolTip.";
    readonly family: "components";
    readonly baseChain: readonly ["ToolTip", "Component"];
    readonly kind: "component";
    readonly children: "None";
    readonly defaultEvent: null;
    readonly properties: readonly [{
        readonly name: "InitialDelay";
        readonly kind: "F32";
        readonly default: "500";
        readonly category: "Behavior";
        readonly doc: "How long the mouse must rest on a control before its tooltip appears, in milliseconds.";
        readonly docFr: "Temps pendant lequel la souris doit rester sur un contrôle avant que son info-bulle apparaisse, en millisecondes.";
        readonly to: {
            readonly prop: "delay";
        };
    }, {
        readonly name: "Active";
        readonly kind: "Bool";
        readonly default: "true";
        readonly category: "Behavior";
        readonly doc: "Whether the tooltips are shown at all.";
        readonly docFr: "Indique si les info-bulles sont affichées.";
        readonly to: {
            readonly prop: "disabled";
            readonly convert: "invert";
        };
    }];
    readonly events: readonly [];
    readonly web: {
        readonly module: "@ui";
        readonly export: "Tooltip";
        readonly domRoot: "none";
    };
};
