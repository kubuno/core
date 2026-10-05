export declare const ButtonMeta: {
    readonly name: "Button";
    readonly doc: "A push button.";
    readonly docFr: "Bouton poussoir.";
    readonly family: "core";
    readonly baseChain: readonly ["Button", "ButtonBase", "Control", "Component"];
    readonly children: "None";
    readonly defaultEvent: "OnClick";
    readonly properties: readonly [{
        readonly name: "Text";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Appearance";
        readonly doc: "Text displayed on the button.";
        readonly docFr: "Texte affiché sur le bouton.";
        readonly to: {
            readonly prop: "children";
        };
    }, {
        readonly name: "Variant";
        readonly kind: {
            readonly Enum: readonly ["Primary", "Secondary", "Ghost", "Text", "Danger", "TextDanger"];
        };
        readonly default: "Primary";
        readonly category: "Appearance";
        readonly doc: "Visual style: filled, outlined, ghost, text only or danger.";
        readonly docFr: "Style visuel : plein, contour, fantôme, texte seul ou danger.";
        readonly to: {
            readonly prop: "variant";
            readonly values: {
                readonly Primary: "primary";
                readonly Secondary: "secondary";
                readonly Ghost: "ghost";
                readonly Text: "text";
                readonly Danger: "danger";
                readonly TextDanger: "textDanger";
            };
        };
    }, {
        readonly name: "Size";
        readonly kind: {
            readonly Enum: readonly ["Sm", "Md", "Lg"];
        };
        readonly default: "Md";
        readonly category: "Appearance";
        readonly doc: "Height and horizontal padding of the button.";
        readonly docFr: "Hauteur et marges horizontales du bouton.";
        readonly to: {
            readonly prop: "size";
            readonly values: {
                readonly Sm: "sm";
                readonly Md: "md";
                readonly Lg: "lg";
            };
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
        readonly name: "Loading";
        readonly kind: "Bool";
        readonly default: "false";
        readonly category: "Behavior";
        readonly doc: "Shows a spinner instead of the content and disables the button.";
        readonly docFr: "Affiche un indicateur de chargement à la place du contenu et désactive le bouton.";
        readonly to: {
            readonly prop: "loading";
        };
    }, {
        readonly name: "DropDownMenu";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Behavior";
        readonly editor: "reference:ContextMenu";
        readonly doc: "A ContextMenu of the view that a click opens below the button (a drop-down button).";
        readonly docFr: "ContextMenu de la vue qu'un clic ouvre sous le bouton (bouton déroulant).";
        readonly to: {
            readonly runtime: "drop-down-menu";
        };
    }, ...import("./types.ts").PropertyMeta<never>[]];
    readonly events: readonly [{
        readonly name: "OnClick";
        readonly category: "Action";
        readonly args: "MouseEventArgs";
        readonly doc: "Occurs when the button is clicked or activated with Space or Enter.";
        readonly docFr: "Se produit quand le bouton est cliqué ou activé avec Espace ou Entrée.";
        readonly from: {
            readonly prop: "onClick";
            readonly args: "mouse";
        };
    }];
    readonly inheritedMap: {
        readonly Enabled: {
            readonly prop: "disabled";
            readonly convert: "invert";
        };
        readonly AccessibleName: {
            readonly prop: "aria-label";
        };
        readonly TabIndex: {
            readonly prop: "tabIndex";
        };
    };
    readonly designDefaults: {
        readonly attributes: {
            readonly Text: "Bouton";
        };
        readonly size: readonly [100, 36];
    };
    readonly web: {
        readonly module: "@ui";
        readonly export: "Button";
        readonly domRoot: "ref";
    };
};
export declare const IconButtonMeta: {
    readonly name: "IconButton";
    readonly doc: "A round button showing only an icon.";
    readonly docFr: "Bouton rond qui n'affiche qu'une icône.";
    readonly family: "choice";
    readonly baseChain: readonly ["IconButton", "ButtonBase", "Control", "Component"];
    readonly children: "None";
    readonly defaultEvent: "OnClick";
    readonly properties: readonly [{
        readonly name: "Icon";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Icon";
        readonly editor: "icon";
        readonly doc: "The icon: a name of the Kubuno icon set (Check, X, Trash2, Search, Plus, MoreVertical…), or an image file relative to the view.";
        readonly docFr: "L'icône : un nom du jeu d'icônes Kubuno (Check, X, Trash2, Search, Plus, MoreVertical…), ou un fichier image relatif à la vue.";
        readonly to: {
            readonly prop: "icon";
            readonly convert: "icon-node";
        };
    }, {
        readonly name: "DropDownMenu";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Behavior";
        readonly editor: "reference:ContextMenu";
        readonly doc: "A ContextMenu of the view that a click opens below the button (a menu button).";
        readonly docFr: "ContextMenu de la vue qu'un clic ouvre sous le bouton (bouton de menu).";
        readonly to: {
            readonly runtime: "drop-down-menu";
        };
    }, {
        readonly name: "Diameter";
        readonly kind: "F32";
        readonly default: "36";
        readonly category: "Layout";
        readonly doc: "Diameter of the button, in pixels.";
        readonly docFr: "Diamètre du bouton, en pixels.";
        readonly to: {
            readonly prop: "diameter";
        };
    }, {
        readonly name: "Glyph";
        readonly kind: "F32";
        readonly default: "18";
        readonly category: "Appearance";
        readonly doc: "Size of the icon in the button, in pixels.";
        readonly docFr: "Taille de l'icône dans le bouton, en pixels.";
        readonly to: {
            readonly prop: "glyph";
        };
    }, {
        readonly name: "Filled";
        readonly kind: "Bool";
        readonly default: "false";
        readonly category: "Appearance";
        readonly doc: "Gives the button a tinted background.";
        readonly docFr: "Donne au bouton un fond teinté.";
        readonly to: {
            readonly prop: "filled";
        };
    }, ...import("./types.ts").PropertyMeta<never>[]];
    readonly events: readonly [{
        readonly name: "OnClick";
        readonly category: "Action";
        readonly args: "MouseEventArgs";
        readonly doc: "Occurs when the button is clicked or activated with Space or Enter.";
        readonly docFr: "Se produit quand le bouton est cliqué ou activé avec Espace ou Entrée.";
        readonly from: {
            readonly prop: "onClick";
            readonly args: "mouse";
        };
    }];
    readonly inheritedMap: {
        readonly Enabled: {
            readonly prop: "disabled";
            readonly convert: "invert";
        };
        readonly AccessibleName: {
            readonly prop: "aria-label";
        };
        readonly TabIndex: {
            readonly prop: "tabIndex";
        };
        readonly Class: {
            readonly prop: "className";
        };
    };
    readonly designDefaults: {
        readonly attributes: {
            readonly Icon: "Plus";
            readonly AccessibleName: "Ajouter";
        };
        readonly size: readonly [36, 36];
    };
    readonly web: {
        readonly module: "@ui";
        readonly export: "IconButton";
        readonly domRoot: "ref";
    };
};
