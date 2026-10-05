export declare const LabelMeta: {
    readonly name: "Label";
    readonly doc: "A line or paragraph of text, in one of the shared typographic roles.";
    readonly docFr: "Ligne ou paragraphe de texte, dans un des rôles typographiques partagés.";
    readonly family: "display";
    readonly baseChain: readonly ["Label", "LabelBase", "Control", "Component"];
    readonly children: "None";
    readonly defaultEvent: "OnClick";
    readonly properties: readonly [{
        readonly name: "Text";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Appearance";
        readonly doc: "Text shown.";
        readonly docFr: "Texte affiché.";
        readonly to: {
            readonly prop: "text";
        };
    }, {
        readonly name: "Role";
        readonly kind: {
            readonly Enum: readonly ["Micro", "Meta", "Body", "Heading", "Title"];
        };
        readonly default: "Body";
        readonly category: "Appearance";
        readonly doc: "Text style: small, caption, body, heading or title (the same sizes on the web and the desktop).";
        readonly docFr: "Style du texte : petit, légende, corps, intertitre ou titre.";
        readonly to: {
            readonly prop: "role";
            readonly values: {
                readonly Micro: "Micro";
                readonly Meta: "Meta";
                readonly Body: "Body";
                readonly Heading: "Heading";
                readonly Title: "Title";
            };
        };
    }, {
        readonly name: "TextAlign";
        readonly kind: {
            readonly Enum: readonly ["TopLeft", "TopCenter", "TopRight", "MiddleLeft", "MiddleCenter", "MiddleRight", "BottomLeft", "BottomCenter", "BottomRight"];
        };
        readonly default: "TopLeft";
        readonly category: "Misc";
        readonly aliases: readonly ["Align"];
        readonly doc: "Position of the text in the label. On the web the horizontal part applies (Left = start, Right = end of the reading direction).";
        readonly docFr: "Position du texte dans l'étiquette.";
        readonly to: {
            readonly prop: "textAlign";
        };
    }, {
        readonly name: "Overflow";
        readonly kind: {
            readonly Enum: readonly ["Ellipsis", "Clip", "Wrap"];
        };
        readonly default: "Ellipsis";
        readonly category: "Layout";
        readonly doc: "What a text too long for the label does: ellipsis, clipped, or wrapped onto the next lines.";
        readonly docFr: "Traitement du texte trop long : points de suspension, coupé, ou renvoyé à la ligne.";
        readonly to: {
            readonly prop: "overflow";
            readonly values: {
                readonly Ellipsis: "Ellipsis";
                readonly Clip: "Clip";
                readonly Wrap: "Wrap";
            };
        };
    }];
    readonly events: readonly [];
    readonly inheritedMap: {
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
            readonly Text: "Étiquette";
        };
        readonly size: readonly [120, 20];
    };
    readonly web: {
        readonly module: "@ui";
        readonly export: "Label";
        readonly domRoot: "ref";
    };
};
export declare const LinkLabelMeta: {
    readonly name: "LinkLabel";
    readonly doc: "A link. Its OnClick decides where to go; on the web, Href also gives it an address (middle click, open in a new tab).";
    readonly docFr: "Lien. Son OnClick décide où aller ; sur le web, Href lui donne aussi une adresse (clic du milieu, ouvrir dans un nouvel onglet).";
    readonly family: "display";
    readonly baseChain: readonly ["LinkLabel", "LabelBase", "Control", "Component"];
    readonly children: "None";
    readonly defaultEvent: "OnClick";
    readonly properties: readonly [{
        readonly name: "Text";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Appearance";
        readonly doc: "Text of the link.";
        readonly docFr: "Texte du lien.";
        readonly to: {
            readonly prop: "text";
        };
    }, {
        readonly name: "Role";
        readonly kind: {
            readonly Enum: readonly ["Micro", "Meta", "Body", "Heading", "Title"];
        };
        readonly default: "Body";
        readonly category: "Appearance";
        readonly doc: "Text style: small, caption, body, heading or title.";
        readonly docFr: "Style du texte : petit, légende, corps, intertitre ou titre.";
        readonly to: {
            readonly prop: "role";
            readonly values: {
                readonly Micro: "Micro";
                readonly Meta: "Meta";
                readonly Body: "Body";
                readonly Heading: "Heading";
                readonly Title: "Title";
            };
        };
    }, {
        readonly name: "Href";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Behavior";
        readonly bindable: true;
        readonly webOnly: true;
        readonly doc: "Web only: the address of the link. A plain click stays in the app (OnClick decides); a middle or modified click opens the address.";
        readonly docFr: "Web uniquement : l'adresse du lien. Un clic simple reste dans l'application (OnClick décide) ; un clic du milieu ou avec une touche de modification ouvre l'adresse.";
        readonly to: {
            readonly prop: "href";
        };
    }];
    readonly events: readonly [{
        readonly name: "OnClick";
        readonly category: "Action";
        readonly args: "MouseEventArgs";
        readonly doc: "Occurs when the link is clicked.";
        readonly docFr: "Se produit quand le lien est cliqué.";
        readonly from: {
            readonly prop: "onClick";
            readonly args: "mouse";
        };
    }];
    readonly inheritedMap: {
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
            readonly Text: "Lien";
        };
        readonly size: readonly [120, 20];
    };
    readonly web: {
        readonly module: "@ui";
        readonly export: "LinkLabel";
        readonly domRoot: "ref";
    };
};
export declare const AvatarMeta: {
    readonly name: "Avatar";
    readonly doc: "A person's photo, or their initials on a disc while there is none.";
    readonly docFr: "Photo d'une personne, ou ses initiales sur un disque tant qu'il n'y en a pas.";
    readonly family: "display";
    readonly baseChain: readonly ["Avatar", "Control", "Component"];
    readonly children: "None";
    readonly defaultEvent: "OnClick";
    readonly properties: readonly [{
        readonly name: "DisplayName";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Appearance";
        readonly bindable: true;
        readonly localizable: true;
        readonly doc: "The person's name: its initials show when there is no photo; it is also the photo's alternative text.";
        readonly docFr: "Nom de la personne : ses initiales sont affichées quand il n'y a pas de photo, et il choisit la couleur.";
        readonly to: {
            readonly prop: "displayName";
        };
    }, {
        readonly name: "Initials";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Appearance";
        readonly bindable: true;
        readonly doc: "Letters shown instead of the name's initials.";
        readonly docFr: "Lettres affichées à la place des initiales du nom.";
        readonly to: {
            readonly prop: "initials";
        };
    }, {
        readonly name: "Image";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Appearance";
        readonly bindable: true;
        readonly editor: "image";
        readonly doc: "The photo: an image address (web) or a file relative to the view.";
        readonly docFr: "Photo : le chemin d'un fichier image, relatif à la vue.";
        readonly to: {
            readonly prop: "image";
        };
    }, {
        readonly name: "Tint";
        readonly kind: {
            readonly Enum: readonly ["Auto", "Accent"];
        };
        readonly default: "Auto";
        readonly category: "Appearance";
        readonly doc: "Auto: a neutral disc, the initials in the secondary text colour (web). Accent: the accent colour, white initials.";
        readonly docFr: "Auto : une couleur choisie d'après le nom, initiales en blanc. Accent : la couleur d'accent pâle, initiales dans la couleur d'accent.";
        readonly to: {
            readonly prop: "tint";
            readonly values: {
                readonly Auto: "auto";
                readonly Accent: "accent";
            };
        };
    }, {
        readonly name: "Shape";
        readonly kind: {
            readonly Enum: readonly ["Circle", "Rounded"];
        };
        readonly default: "Circle";
        readonly category: "Appearance";
        readonly doc: "A circle, or a square with rounded corners.";
        readonly docFr: "Un cercle, ou un carré aux coins arrondis.";
        readonly to: {
            readonly prop: "shape";
            readonly values: {
                readonly Circle: "circle";
                readonly Rounded: "rounded";
            };
        };
    }, {
        readonly name: "AvatarSize";
        readonly kind: "F32";
        readonly default: "36";
        readonly category: "Layout";
        readonly doc: "Diameter of the avatar, in pixels.";
        readonly docFr: "Diamètre de l'avatar, en DIP (la boîte de l'élément est remplie si elle est plus petite).";
        readonly to: {
            readonly prop: "size";
        };
    }];
    readonly events: readonly [];
    readonly inheritedMap: {
        readonly Class: {
            readonly prop: "className";
        };
    };
    readonly designDefaults: {
        readonly attributes: {
            readonly DisplayName: "Camille Martin";
        };
        readonly size: readonly [36, 36];
    };
    readonly web: {
        readonly module: "@ui";
        readonly export: "Avatar";
        readonly domRoot: "ref";
    };
};
export declare const IconMeta: {
    readonly name: "Icon";
    readonly doc: "An icon of the Kubuno icon set, alone or on a coloured disc.";
    readonly docFr: "Icône du jeu d'icônes Kubuno, seule ou sur un disque coloré.";
    readonly family: "display";
    readonly baseChain: readonly ["Icon", "Control", "Component"];
    readonly children: "None";
    readonly defaultEvent: "OnClick";
    readonly properties: readonly [{
        readonly name: "Name";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Icon";
        readonly editor: "icon";
        readonly doc: "The icon: a name of the Kubuno icon set.";
        readonly docFr: "L'icône : un nom du jeu d'icônes Kubuno, ou un fichier image (SVG, PNG…) relatif à la vue.";
        readonly to: {
            readonly prop: "icon";
            readonly convert: "icon-component";
        };
    }, {
        readonly name: "Size";
        readonly kind: "F32";
        readonly default: "20";
        readonly category: "Appearance";
        readonly doc: "Size of the icon, in pixels.";
        readonly docFr: "Taille de l'icône, en pixels.";
        readonly to: {
            readonly prop: "size";
        };
    }, {
        readonly name: "Disc";
        readonly kind: {
            readonly Enum: readonly ["None", "Neutral", "Info", "Warning", "Danger", "Success"];
        };
        readonly default: "None";
        readonly category: "Misc";
        readonly doc: "Draws the icon on a coloured disc twice its size, like the icons of Kubuno message boxes.";
        readonly docFr: "Dessine l'icône sur un disque coloré, comme les icônes des boîtes de message et des confirmations de Kubuno.";
        readonly to: {
            readonly prop: "disc";
            readonly values: {
                readonly None: "None";
                readonly Neutral: "Neutral";
                readonly Info: "Info";
                readonly Warning: "Warning";
                readonly Danger: "Danger";
                readonly Success: "Success";
            };
        };
    }];
    readonly events: readonly [];
    readonly inheritedMap: {
        readonly Class: {
            readonly prop: "className";
        };
    };
    readonly designDefaults: {
        readonly attributes: {
            readonly Name: "Star";
        };
        readonly size: readonly [20, 20];
    };
    readonly web: {
        readonly module: "@ui";
        readonly export: "IconGlyph";
        readonly domRoot: "ref";
    };
};
