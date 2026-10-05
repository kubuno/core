export declare const GroupBoxMeta: {
    readonly name: "GroupBox";
    readonly doc: "A titled group around one child. On the web: a heading, an optional help line, then the content, like the sections of the settings pages.";
    readonly docFr: "Cadre avec un titre autour d'un élément enfant.";
    readonly family: "containers";
    readonly baseChain: readonly ["GroupBox", "ContainerBase", "ScrollableControl", "Control", "Component"];
    readonly children: "SingleWidget";
    readonly defaultEvent: "OnClick";
    readonly properties: readonly [{
        readonly name: "Title";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Appearance";
        readonly doc: "Title shown at the top of the frame.";
        readonly docFr: "Titre affiché en haut du cadre.";
        readonly to: {
            readonly prop: "title";
        };
    }, {
        readonly name: "Padding";
        readonly kind: "F32";
        readonly default: "0";
        readonly category: "Layout";
        readonly doc: "Space around the child, on all four sides, in pixels.";
        readonly docFr: "Espace autour de l'élément enfant, sur les quatre côtés, en pixels.";
        readonly to: {
            readonly prop: "padding";
        };
    }, {
        readonly name: "Description";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Appearance";
        readonly localizable: true;
        readonly webOnly: true;
        readonly doc: "Web only: a help line under the title.";
        readonly docFr: "Web uniquement : une ligne d'aide sous le titre.";
        readonly to: {
            readonly prop: "description";
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
            readonly Title: "Groupe";
        };
        readonly size: readonly [320, 160];
    };
    readonly web: {
        readonly module: "@ui";
        readonly export: "GroupBox";
        readonly domRoot: "ref";
        readonly content: "children";
    };
};
export declare const SettingsRowMeta: {
    readonly name: "SettingsRow";
    readonly doc: "One line of a settings page: the setting's name and help line, then the control that changes it (its child). Beside each other on a wide screen, stacked on a phone.";
    readonly docFr: "Ligne d'une page de réglages : le nom du réglage et sa ligne d'aide, puis le contrôle qui le modifie (son enfant). Côte à côte sur un grand écran, l'un au-dessus de l'autre sur un téléphone.";
    readonly family: "containers";
    readonly baseChain: readonly ["SettingsRow", "Control", "Component"];
    readonly children: "SingleWidget";
    readonly defaultEvent: "OnClick";
    readonly properties: readonly [{
        readonly name: "Label";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Appearance";
        readonly bindable: true;
        readonly localizable: true;
        readonly doc: "Name of the setting.";
        readonly docFr: "Nom du réglage.";
        readonly to: {
            readonly prop: "label";
        };
    }, {
        readonly name: "Description";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Appearance";
        readonly bindable: true;
        readonly localizable: true;
        readonly doc: "A help line under the name.";
        readonly docFr: "Ligne d'aide sous le nom.";
        readonly to: {
            readonly prop: "description";
        };
    }, {
        readonly name: "Orientation";
        readonly kind: {
            readonly Enum: readonly ["Auto", "Horizontal", "Vertical"];
        };
        readonly default: "Auto";
        readonly category: "Layout";
        readonly doc: "Auto: the name beside the control, above it on a phone. Horizontal or Vertical forces one of the two.";
        readonly docFr: "Auto : le nom à côté du contrôle, au-dessus sur un téléphone. Horizontal ou Vertical impose l'une des deux dispositions.";
        readonly to: {
            readonly prop: "layout";
            readonly values: {
                readonly Auto: "auto";
                readonly Horizontal: "inline";
                readonly Vertical: "stacked";
            };
        };
    }, {
        readonly name: "ShowDivider";
        readonly kind: "Bool";
        readonly default: "true";
        readonly category: "Appearance";
        readonly doc: "Draws the line under the row (the last row of a list never draws one).";
        readonly docFr: "Trace la ligne sous la rangée (la dernière rangée d'une liste n'en trace jamais).";
        readonly to: {
            readonly prop: "divider";
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
            readonly Label: "Réglage";
        };
        readonly size: readonly [640, 64];
    };
    readonly web: {
        readonly module: "@ui";
        readonly export: "SettingsRow";
        readonly domRoot: "ref";
        readonly content: "children";
    };
};
export declare const RadioGroupMeta: {
    readonly name: "RadioGroup";
    readonly doc: "Exclusive options: choosing one unchecks the others. Add the options as Option children, or bind ItemsSource. The arrow keys move the choice.";
    readonly docFr: "Options exclusives : en choisir une décoche les autres. Ajoutez les options comme éléments Option enfants, ou liez ItemsSource. Les flèches déplacent le choix.";
    readonly family: "choice";
    readonly baseChain: readonly ["RadioGroup", "ListControl", "Control", "Component"];
    readonly children: "List";
    readonly allowedChildren: readonly ["Option"];
    readonly defaultEvent: "OnSelectedValueChanged";
    readonly properties: readonly [{
        readonly name: "SelectedValue";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Data";
        readonly bindable: true;
        readonly doc: "Value of the chosen option. Empty when none is chosen.";
        readonly docFr: "Valeur de l'option choisie. Vide quand aucune n'est choisie.";
        readonly to: {
            readonly prop: "value";
            readonly change: "OnSelectedValueChanged";
        };
    }, {
        readonly name: "Orientation";
        readonly kind: {
            readonly Enum: readonly ["Vertical", "Horizontal"];
        };
        readonly default: "Vertical";
        readonly category: "Layout";
        readonly doc: "One option per line, or the options side by side (wrapping).";
        readonly docFr: "Une option par ligne, ou les options côte à côte (renvoyées à la ligne).";
        readonly to: {
            readonly prop: "orientation";
            readonly values: {
                readonly Vertical: "vertical";
                readonly Horizontal: "horizontal";
            };
        };
    }, {
        readonly name: "ItemsSource";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Data";
        readonly bindable: true;
        readonly editor: "list";
        readonly doc: "A binding to the list of options to show, instead of Option children.";
        readonly docFr: "Liaison vers la liste des options à afficher, à la place des éléments Option.";
        readonly to: {
            readonly prop: "options";
            readonly convert: "items-source";
        };
    }, {
        readonly name: "DisplayMember";
        readonly kind: "String";
        readonly default: "Label";
        readonly category: "Data";
        readonly doc: "Field of each bound item shown as its text.";
        readonly docFr: "Champ de chaque élément lié affiché comme texte.";
        readonly to: {
            readonly runtime: "item-state";
        };
    }, {
        readonly name: "ValueMember";
        readonly kind: "String";
        readonly default: "Value";
        readonly category: "Data";
        readonly doc: "Field of each bound item used as its value.";
        readonly docFr: "Champ de chaque élément lié utilisé comme valeur.";
        readonly to: {
            readonly runtime: "item-state";
        };
    }];
    readonly events: readonly [{
        readonly name: "OnSelectedValueChanged";
        readonly category: "Property Changed";
        readonly args: "ValueChangedEventArgs";
        readonly doc: "Occurs when another option is chosen.";
        readonly docFr: "Se produit quand une autre option est choisie.";
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
        readonly AccessibleName: {
            readonly prop: "aria-label";
        };
        readonly Class: {
            readonly prop: "className";
        };
    };
    readonly designDefaults: {
        readonly size: readonly [200, 80];
    };
    readonly web: {
        readonly module: "@ui";
        readonly export: "RadioGroup";
        readonly domRoot: "ref";
        readonly childrenToProp: {
            readonly prop: "options";
            readonly item: "Option";
            readonly content: "none";
        };
    };
};
