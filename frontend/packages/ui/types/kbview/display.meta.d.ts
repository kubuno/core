export declare const BadgeMeta: {
    readonly name: "Badge";
    readonly doc: "A small pill showing a count or a status.";
    readonly docFr: "Petite pastille affichant un nombre ou un état.";
    readonly family: "display";
    readonly baseChain: readonly ["Badge", "LabelBase", "Control", "Component"];
    readonly children: "None";
    readonly defaultEvent: "OnClick";
    readonly properties: readonly [{
        readonly name: "Text";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Appearance";
        readonly doc: "Text of the badge.";
        readonly docFr: "Texte de la pastille.";
        readonly to: {
            readonly prop: "children";
        };
    }, {
        readonly name: "Variant";
        readonly kind: {
            readonly Enum: readonly ["Default", "Primary", "Success", "Warning", "Danger", "Neutral"];
        };
        readonly default: "Default";
        readonly category: "Appearance";
        readonly doc: "Colour of the badge.";
        readonly docFr: "Couleur de la pastille.";
        readonly to: {
            readonly prop: "variant";
            readonly values: {
                readonly Default: "default";
                readonly Primary: "primary";
                readonly Success: "success";
                readonly Warning: "warning";
                readonly Danger: "danger";
                readonly Neutral: "neutral";
            };
        };
    }, {
        readonly name: "Size";
        readonly kind: {
            readonly Enum: readonly ["Sm", "Md"];
        };
        readonly default: "Md";
        readonly category: "Appearance";
        readonly doc: "Size of the badge.";
        readonly docFr: "Taille de la pastille.";
        readonly to: {
            readonly prop: "size";
            readonly values: {
                readonly Sm: "sm";
                readonly Md: "md";
            };
        };
    }, {
        readonly name: "Dot";
        readonly kind: "Bool";
        readonly default: "false";
        readonly category: "Appearance";
        readonly doc: "Shows a coloured status dot before the text.";
        readonly docFr: "Affiche une pastille d'état colorée avant le texte.";
        readonly to: {
            readonly prop: "dot";
        };
    }];
    readonly events: readonly [];
    readonly designDefaults: {
        readonly attributes: {
            readonly Text: "Badge";
        };
        readonly size: readonly [100, 24];
    };
    readonly web: {
        readonly module: "@ui";
        readonly export: "Badge";
        readonly domRoot: "wrapper";
    };
};
export declare const SpinnerMeta: {
    readonly name: "Spinner";
    readonly doc: "An animated loading indicator.";
    readonly docFr: "Indicateur de chargement animé.";
    readonly family: "display";
    readonly baseChain: readonly ["Spinner", "Control", "Component"];
    readonly children: "None";
    readonly defaultEvent: "OnClick";
    readonly properties: readonly [{
        readonly name: "Size";
        readonly kind: {
            readonly Enum: readonly ["Xs", "Sm", "Md", "Lg"];
        };
        readonly default: "Md";
        readonly category: "Appearance";
        readonly doc: "Size of the indicator.";
        readonly docFr: "Taille de l'indicateur.";
        readonly to: {
            readonly prop: "size";
            readonly values: {
                readonly Xs: "xs";
                readonly Sm: "sm";
                readonly Md: "md";
                readonly Lg: "lg";
            };
        };
    }];
    readonly events: readonly [];
    readonly inheritedMap: {
        readonly AccessibleName: {
            readonly prop: "label";
        };
    };
    readonly designDefaults: {
        readonly size: readonly [24, 24];
    };
    readonly web: {
        readonly module: "@ui";
        readonly export: "Spinner";
        readonly domRoot: "wrapper";
    };
};
export declare const ProgressBarMeta: {
    readonly name: "ProgressBar";
    readonly doc: "A progress bar.";
    readonly docFr: "Barre de progression.";
    readonly family: "display";
    readonly baseChain: readonly ["ProgressBar", "RangeBase", "Control", "Component"];
    readonly children: "None";
    readonly defaultEvent: "OnClick";
    readonly properties: readonly [{
        readonly name: "Maximum";
        readonly kind: "F32";
        readonly default: "100";
        readonly category: "Data";
        readonly aliases: readonly ["Max"];
        readonly doc: "Value at which the bar is full.";
        readonly docFr: "Valeur pour laquelle la barre est pleine.";
        readonly to: {
            readonly prop: "max";
        };
    }, {
        readonly name: "Value";
        readonly kind: "F32";
        readonly default: "0";
        readonly category: "Data";
        readonly doc: "Current progress, between Minimum and Maximum.";
        readonly docFr: "Progression actuelle, entre Min et Max.";
        readonly to: {
            readonly prop: "value";
        };
    }, {
        readonly name: "Indeterminate";
        readonly kind: "Bool";
        readonly default: "false";
        readonly category: "Behavior";
        readonly doc: "Shows an animation instead of a value, when the progress is unknown.";
        readonly docFr: "Affiche une animation au lieu d'une valeur, quand la progression est inconnue.";
        readonly to: {
            readonly prop: "indeterminate";
        };
    }, {
        readonly name: "Label";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Appearance";
        readonly doc: "Text shown above the bar. Leave empty for none.";
        readonly docFr: "Texte affiché au-dessus de la barre. Laisser vide pour aucun texte.";
        readonly to: {
            readonly prop: "label";
        };
    }, {
        readonly name: "ShowValue";
        readonly kind: "Bool";
        readonly default: "false";
        readonly category: "Appearance";
        readonly doc: "Shows the percentage above the bar.";
        readonly docFr: "Affiche le pourcentage au-dessus de la barre.";
        readonly to: {
            readonly prop: "showValue";
        };
    }, {
        readonly name: "Variant";
        readonly kind: {
            readonly Enum: readonly ["Auto", "Primary", "Success", "Warning", "Danger"];
        };
        readonly default: "Auto";
        readonly category: "Appearance";
        readonly doc: "Colour of the bar. Auto turns amber, then red, as it fills up.";
        readonly docFr: "Couleur de la barre. Auto passe à l'orange puis au rouge à mesure qu'elle se remplit.";
        readonly to: {
            readonly prop: "variant";
            readonly values: {
                readonly Auto: "auto";
                readonly Primary: "primary";
                readonly Success: "success";
                readonly Warning: "warning";
                readonly Danger: "danger";
            };
        };
    }, {
        readonly name: "Size";
        readonly kind: {
            readonly Enum: readonly ["Sm", "Md"];
        };
        readonly default: "Md";
        readonly category: "Appearance";
        readonly doc: "Thickness of the bar.";
        readonly docFr: "Épaisseur de la barre.";
        readonly to: {
            readonly prop: "size";
            readonly values: {
                readonly Sm: "sm";
                readonly Md: "md";
            };
        };
    }];
    readonly events: readonly [];
    readonly designDefaults: {
        readonly size: readonly [200, 24];
    };
    readonly web: {
        readonly module: "@ui";
        readonly export: "ProgressBar";
        readonly domRoot: "wrapper";
    };
};
export declare const SeparatorMeta: {
    readonly name: "Separator";
    readonly doc: "A thin separating line.";
    readonly docFr: "Fine ligne de séparation.";
    readonly family: "display";
    readonly baseChain: readonly ["Separator", "Control", "Component"];
    readonly children: "None";
    readonly defaultEvent: "OnClick";
    readonly properties: readonly [{
        readonly name: "Orientation";
        readonly kind: {
            readonly Enum: readonly ["Horizontal", "Vertical"];
        };
        readonly default: "Horizontal";
        readonly category: "Layout";
        readonly doc: "Whether the line is horizontal or vertical.";
        readonly docFr: "Indique si la ligne est horizontale ou verticale.";
        readonly to: {
            readonly prop: "orientation";
            readonly values: {
                readonly Horizontal: "horizontal";
                readonly Vertical: "vertical";
            };
        };
    }];
    readonly events: readonly [];
    readonly designDefaults: {
        readonly size: readonly [200, 8];
    };
    readonly web: {
        readonly module: "@ui";
        readonly export: "Separator";
        readonly domRoot: "wrapper";
    };
};
export declare const CalloutMeta: {
    readonly name: "Callout";
    readonly doc: "A message banner: information, success, warning or error.";
    readonly docFr: "Bandeau de message : information, succès, avertissement ou erreur.";
    readonly family: "display";
    readonly baseChain: readonly ["Callout", "Control", "Component"];
    readonly children: "None";
    readonly defaultEvent: "OnClick";
    readonly properties: readonly [{
        readonly name: "Body";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Appearance";
        readonly doc: "Message text.";
        readonly docFr: "Texte du message.";
        readonly to: {
            readonly prop: "children";
        };
    }, {
        readonly name: "Title";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Appearance";
        readonly doc: "Bold title shown above the message. Leave empty for none.";
        readonly docFr: "Titre en gras affiché au-dessus du message. Laisser vide pour aucun titre.";
        readonly to: {
            readonly prop: "title";
        };
    }, {
        readonly name: "Variant";
        readonly kind: {
            readonly Enum: readonly ["Info", "Success", "Warning", "Danger"];
        };
        readonly default: "Info";
        readonly category: "Appearance";
        readonly doc: "Kind of message, which sets the colour and the icon.";
        readonly docFr: "Type de message, qui détermine la couleur et l'icône.";
        readonly to: {
            readonly prop: "variant";
            readonly values: {
                readonly Info: "info";
                readonly Success: "success";
                readonly Warning: "warning";
                readonly Danger: "danger";
            };
        };
    }, {
        readonly name: "Dismissible";
        readonly kind: "Bool";
        readonly default: "false";
        readonly category: "Behavior";
        readonly doc: "Shows a button to close the banner.";
        readonly docFr: "Affiche un bouton pour fermer le bandeau.";
        readonly to: {
            readonly prop: "dismissible";
        };
    }, {
        readonly name: "ShowIcon";
        readonly kind: "Bool";
        readonly default: "true";
        readonly category: "Appearance";
        readonly doc: "Shows the icon of the message kind.";
        readonly docFr: "Affiche l'icône du type de message.";
        readonly to: {
            readonly prop: "icon";
            readonly convert: "null-when-false";
        };
    }, {
        readonly name: "ActionLabel";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Appearance";
        readonly doc: "Text of an action button in the banner. Leave empty for none.";
        readonly docFr: "Texte d'un bouton d'action dans le bandeau. Laisser vide pour aucun bouton.";
        readonly to: {
            readonly prop: "action";
            readonly field: "label";
        };
    }];
    readonly events: readonly [{
        readonly name: "OnAction";
        readonly category: "Action";
        readonly args: "EventArgs";
        readonly doc: "Occurs when the action button is clicked.";
        readonly docFr: "Se produit quand le bouton d'action est cliqué.";
        readonly from: {
            readonly prop: "action";
            readonly field: "onClick";
            readonly args: "none";
        };
    }, {
        readonly name: "OnDismiss";
        readonly category: "Action";
        readonly args: "EventArgs";
        readonly doc: "Occurs when the banner is closed.";
        readonly docFr: "Se produit quand le bandeau est fermé.";
        readonly from: {
            readonly prop: "onDismiss";
            readonly args: "none";
        };
    }];
    readonly designDefaults: {
        readonly attributes: {
            readonly Body: "Message";
        };
        readonly size: readonly [320, 56];
    };
    readonly web: {
        readonly module: "@ui";
        readonly export: "Callout";
        readonly domRoot: "wrapper";
    };
};
export declare const EmptyStateMeta: {
    readonly name: "EmptyState";
    readonly doc: "A placeholder shown when an area has nothing to display.";
    readonly docFr: "Écran affiché quand une zone n'a rien à montrer.";
    readonly family: "display";
    readonly baseChain: readonly ["EmptyState", "Control", "Component"];
    readonly children: "None";
    readonly defaultEvent: "OnClick";
    readonly properties: readonly [{
        readonly name: "Icon";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Icon";
        readonly editor: "icon";
        readonly doc: "Icon shown at the top: a name of the Kubuno icon set, or an image file relative to the view.";
        readonly docFr: "Icône affichée en haut : un nom du jeu d'icônes Kubuno, ou un fichier image relatif à la vue.";
        readonly to: {
            readonly prop: "icon";
            readonly convert: "icon-node";
        };
    }, {
        readonly name: "Title";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Appearance";
        readonly doc: "Title of the message.";
        readonly docFr: "Titre du message.";
        readonly to: {
            readonly prop: "title";
        };
    }, {
        readonly name: "Description";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Appearance";
        readonly doc: "Secondary text shown under the title.";
        readonly docFr: "Texte secondaire affiché sous le titre.";
        readonly to: {
            readonly prop: "description";
        };
    }, {
        readonly name: "Variant";
        readonly kind: {
            readonly Enum: readonly ["FirstUse", "NoResults", "Error", "Unavailable"];
        };
        readonly default: "FirstUse";
        readonly category: "Appearance";
        readonly doc: "Why the area is empty: first use, no results, error or unavailable.";
        readonly docFr: "Raison pour laquelle la zone est vide : première utilisation, aucun résultat, erreur ou indisponible.";
        readonly to: {
            readonly prop: "variant";
            readonly values: {
                readonly FirstUse: "first-use";
                readonly NoResults: "no-results";
                readonly Error: "error";
                readonly Unavailable: "unavailable";
            };
        };
    }, {
        readonly name: "Compact";
        readonly kind: "Bool";
        readonly default: "false";
        readonly category: "Layout";
        readonly doc: "Uses less vertical space, for a small area.";
        readonly docFr: "Occupe moins de hauteur, pour une petite zone.";
        readonly to: {
            readonly prop: "compact";
        };
    }, {
        readonly name: "ActionLabel";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Appearance";
        readonly doc: "Text of the main action button. Leave empty for none.";
        readonly docFr: "Texte du bouton d'action principal. Laisser vide pour aucun bouton.";
        readonly to: {
            readonly prop: "action";
            readonly field: "label";
        };
    }, {
        readonly name: "SecondaryActionLabel";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Appearance";
        readonly doc: "Text of the secondary action button. Leave empty for none.";
        readonly docFr: "Texte du bouton d'action secondaire. Laisser vide pour aucun bouton.";
        readonly to: {
            readonly prop: "secondaryAction";
            readonly field: "label";
        };
    }, ...import("./types.ts").PropertyMeta<never>[]];
    readonly events: readonly [{
        readonly name: "OnAction";
        readonly category: "Action";
        readonly args: "EventArgs";
        readonly doc: "Occurs when the main action button is clicked.";
        readonly docFr: "Se produit quand le bouton d'action principal est cliqué.";
        readonly from: {
            readonly prop: "action";
            readonly field: "onClick";
            readonly args: "none";
        };
    }, {
        readonly name: "OnSecondaryAction";
        readonly category: "Action";
        readonly args: "EventArgs";
        readonly doc: "Occurs when the secondary action button is clicked.";
        readonly docFr: "Se produit quand le bouton d'action secondaire est cliqué.";
        readonly from: {
            readonly prop: "secondaryAction";
            readonly field: "onClick";
            readonly args: "none";
        };
    }];
    readonly designDefaults: {
        readonly attributes: {
            readonly Icon: "Inbox";
            readonly Title: "Rien à afficher";
        };
        readonly size: readonly [320, 200];
    };
    readonly web: {
        readonly module: "@ui";
        readonly export: "EmptyState";
        readonly domRoot: "wrapper";
    };
};
