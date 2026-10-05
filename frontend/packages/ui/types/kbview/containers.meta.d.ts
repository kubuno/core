export declare const CardMeta: {
    readonly name: "Card";
    readonly doc: "A card with an optional title that holds one child.";
    readonly docFr: "Carte avec un titre facultatif, qui contient un élément enfant.";
    readonly family: "core";
    readonly baseChain: readonly ["Card", "ContainerBase", "ScrollableControl", "Control", "Component"];
    readonly children: "SingleWidget";
    readonly defaultEvent: "OnClick";
    readonly properties: readonly [{
        readonly name: "Title";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Appearance";
        readonly doc: "Title shown in the card header. Leave empty to hide the header.";
        readonly docFr: "Titre affiché dans l'en-tête de la carte. Laisser vide pour masquer l'en-tête.";
        readonly to: {
            readonly prop: "title";
        };
    }, {
        readonly name: "Subtitle";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Appearance";
        readonly doc: "Secondary text shown under the title.";
        readonly docFr: "Texte secondaire affiché sous le titre.";
        readonly to: {
            readonly prop: "subtitle";
        };
    }, {
        readonly name: "Dense";
        readonly kind: "Bool";
        readonly default: "false";
        readonly category: "Layout";
        readonly doc: "Uses tighter spacing and a smaller title.";
        readonly docFr: "Utilise des espacements réduits et un titre plus petit.";
        readonly to: {
            readonly prop: "dense";
        };
    }, {
        readonly name: "Flush";
        readonly kind: "Bool";
        readonly default: "false";
        readonly category: "Layout";
        readonly doc: "Removes the body padding, so a table or list reaches the card edges.";
        readonly docFr: "Supprime les marges intérieures, pour qu'un tableau ou une liste touche les bords de la carte.";
        readonly to: {
            readonly prop: "flush";
        };
    }, {
        readonly name: "Icon";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Icon";
        readonly editor: "icon";
        readonly webOnly: true;
        readonly doc: "Web only: icon shown before the title.";
        readonly docFr: "Web uniquement : icône affichée avant le titre.";
        readonly to: {
            readonly prop: "icon";
            readonly convert: "icon-node";
        };
    }, {
        readonly name: "Actions";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Appearance";
        readonly serialization: "Content";
        readonly browsable: false;
        readonly webOnly: true;
        readonly doc: "Web only: controls of the header row, written as a <Card.Actions> property element.";
        readonly docFr: "Web uniquement : contrôles de la ligne d'en-tête, écrits dans un élément de propriété <Card.Actions>.";
        readonly to: {
            readonly prop: "actions";
        };
    }, {
        readonly name: "Footer";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Appearance";
        readonly serialization: "Content";
        readonly browsable: false;
        readonly webOnly: true;
        readonly doc: "Web only: bottom band of the card, written as a <Card.Footer> property element.";
        readonly docFr: "Web uniquement : bande inférieure de la carte, écrite dans un élément de propriété <Card.Footer>.";
        readonly to: {
            readonly prop: "footer";
        };
    }];
    readonly events: readonly [];
    readonly designDefaults: {
        readonly attributes: {
            readonly Title: "Carte";
        };
        readonly size: readonly [320, 200];
    };
    readonly web: {
        readonly module: "@ui";
        readonly export: "Card";
        readonly domRoot: "wrapper";
        readonly content: "children";
        readonly slots: {
            readonly Actions: "actions";
            readonly Footer: "footer";
        };
    };
};
export declare const TabsMeta: {
    readonly name: "Tabs";
    readonly doc: "A set of pages shown one at a time, with tabs. Add the pages as TabItem children.";
    readonly docFr: "Ensemble de pages affichées une à la fois, avec des onglets. Ajoutez les pages comme éléments TabItem enfants.";
    readonly family: "containers";
    readonly baseChain: readonly ["Tabs", "ContainerBase", "ScrollableControl", "Control", "Component"];
    readonly children: "List";
    readonly allowedChildren: readonly ["TabItem"];
    readonly layoutKind: "Tabs";
    readonly defaultEvent: "OnSelectionChanged";
    readonly properties: readonly [{
        readonly name: "SelectedIndex";
        readonly kind: "F32";
        readonly default: "0";
        readonly category: "Data";
        readonly doc: "Index of the selected tab, starting at 0.";
        readonly docFr: "Index de l'onglet sélectionné, à partir de 0.";
        readonly to: {
            readonly prop: "value";
            readonly convert: "index-to-key";
            readonly change: "OnSelectionChanged";
        };
    }, {
        readonly name: "Variant";
        readonly kind: {
            readonly Enum: readonly ["Underline", "Pills", "Stretched"];
        };
        readonly default: "Underline";
        readonly category: "Appearance";
        readonly webOnly: true;
        readonly doc: "Web only: look of the tab strip.";
        readonly docFr: "Web uniquement : aspect de la barre d'onglets.";
        readonly to: {
            readonly prop: "variant";
            readonly values: {
                readonly Underline: "underline";
                readonly Pills: "pills";
                readonly Stretched: "stretched";
            };
        };
    }, {
        readonly name: "Size";
        readonly kind: {
            readonly Enum: readonly ["Sm", "Md"];
        };
        readonly default: "Md";
        readonly category: "Appearance";
        readonly webOnly: true;
        readonly doc: "Web only: size of the tabs.";
        readonly docFr: "Web uniquement : taille des onglets.";
        readonly to: {
            readonly prop: "size";
            readonly values: {
                readonly Sm: "sm";
                readonly Md: "md";
            };
        };
    }];
    readonly events: readonly [{
        readonly name: "OnSelectionChanged";
        readonly category: "Behavior";
        readonly args: "ValueChangedEventArgs";
        readonly doc: "Occurs when another tab is selected.";
        readonly docFr: "Se produit quand un autre onglet est sélectionné.";
        readonly from: {
            readonly prop: "onChange";
            readonly args: "key-to-index";
        };
    }];
    readonly designDefaults: {
        readonly size: readonly [320, 200];
    };
    readonly web: {
        readonly module: "@ui";
        readonly export: "Tabs";
        readonly domRoot: "wrapper";
        readonly childrenToProp: {
            readonly prop: "tabs";
            readonly item: "TabItem";
            readonly content: "selected-after";
            readonly key: "id";
        };
    };
};
export declare const TabItemMeta: {
    readonly name: "TabItem";
    readonly doc: "A page of a Tabs control.";
    readonly docFr: "Page d'un contrôle Tabs.";
    readonly family: "containers";
    readonly baseChain: readonly ["TabItem", "Component"];
    readonly children: "SingleWidget";
    readonly defaultEvent: null;
    readonly properties: readonly [{
        readonly name: "Header";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Appearance";
        readonly doc: "Text of the tab.";
        readonly docFr: "Texte de l'onglet.";
        readonly to: {
            readonly prop: "label";
        };
    }, {
        readonly name: "Icon";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Icon";
        readonly editor: "icon";
        readonly webOnly: true;
        readonly doc: "Web only: icon shown before the text of the tab.";
        readonly docFr: "Web uniquement : icône affichée avant le texte de l'onglet.";
        readonly to: {
            readonly prop: "icon";
            readonly convert: "icon-component";
        };
    }];
    readonly events: readonly [];
    readonly web: {
        readonly module: null;
        readonly export: null;
        readonly domRoot: "none";
        readonly itemOf: readonly ["Tabs"];
    };
};
export declare const AccordionMeta: {
    readonly name: "Accordion";
    readonly doc: "A list of sections that can be expanded or collapsed. Add the sections as AccordionSection children.";
    readonly docFr: "Liste de sections qui peuvent être développées ou réduites. Ajoutez les sections comme éléments AccordionSection enfants.";
    readonly family: "containers";
    readonly baseChain: readonly ["Accordion", "ContainerBase", "ScrollableControl", "Control", "Component"];
    readonly children: "List";
    readonly allowedChildren: readonly ["AccordionSection"];
    readonly defaultEvent: "OnClick";
    readonly properties: readonly [{
        readonly name: "Size";
        readonly kind: {
            readonly Enum: readonly ["Sm", "Md"];
        };
        readonly default: "Md";
        readonly category: "Appearance";
        readonly doc: "Spacing of the section headers and contents.";
        readonly docFr: "Espacement des en-têtes et du contenu des sections.";
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
        readonly size: readonly [320, 200];
    };
    readonly web: {
        readonly module: "@ui";
        readonly export: "Accordion";
        readonly domRoot: "wrapper";
        readonly childrenToProp: {
            readonly prop: "items";
            readonly item: "AccordionSection";
            readonly content: {
                readonly field: "content";
            };
            readonly key: "id";
        };
    };
};
export declare const AccordionSectionMeta: {
    readonly name: "AccordionSection";
    readonly doc: "A section of an Accordion that can be expanded or collapsed.";
    readonly docFr: "Section d'un accordéon, qui peut être développée ou réduite.";
    readonly family: "containers";
    readonly baseChain: readonly ["AccordionSection", "Component"];
    readonly children: "SingleWidget";
    readonly defaultEvent: "OnToggled";
    readonly properties: readonly [{
        readonly name: "Header";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Appearance";
        readonly doc: "Title of the section.";
        readonly docFr: "Titre de la section.";
        readonly to: {
            readonly prop: "title";
        };
    }, {
        readonly name: "Open";
        readonly kind: "Bool";
        readonly default: "false";
        readonly category: "Behavior";
        readonly doc: "Whether the section is expanded.";
        readonly docFr: "Indique si la section est développée.";
        readonly to: {
            readonly runtime: "item-state";
            readonly change: "OnToggled";
        };
    }, {
        readonly name: "Disabled";
        readonly kind: "Bool";
        readonly default: "false";
        readonly category: "Behavior";
        readonly doc: "Shows the section greyed out and keeps it collapsed.";
        readonly docFr: "Affiche la section grisée et la garde réduite.";
        readonly to: {
            readonly prop: "disabled";
        };
    }];
    readonly events: readonly [{
        readonly name: "OnToggled";
        readonly category: "Behavior";
        readonly args: "ValueChangedEventArgs";
        readonly doc: "Occurs when the section is expanded or collapsed.";
        readonly docFr: "Se produit quand la section est développée ou réduite.";
        readonly from: {
            readonly runtime: "parent-adapter";
            readonly args: "open-keys";
        };
    }];
    readonly web: {
        readonly module: null;
        readonly export: null;
        readonly domRoot: "none";
        readonly itemOf: readonly ["Accordion"];
    };
};
export declare const BreadcrumbMeta: {
    readonly name: "Breadcrumb";
    readonly doc: "A navigation trail. Add the segments as BreadcrumbItem children.";
    readonly docFr: "Fil d'Ariane de navigation. Ajoutez les segments comme éléments BreadcrumbItem enfants.";
    readonly family: "containers";
    readonly baseChain: readonly ["Breadcrumb", "Control", "Component"];
    readonly children: "List";
    readonly allowedChildren: readonly ["BreadcrumbItem"];
    readonly defaultEvent: "OnClick";
    readonly properties: readonly [{
        readonly name: "Size";
        readonly kind: {
            readonly Enum: readonly ["Sm", "Lg"];
        };
        readonly default: "Sm";
        readonly category: "Appearance";
        readonly webOnly: true;
        readonly doc: "Web only: scale of the trail; Lg makes it the page's heading.";
        readonly docFr: "Web uniquement : taille du fil ; Lg en fait le titre de la page.";
        readonly to: {
            readonly prop: "size";
            readonly values: {
                readonly Sm: "sm";
                readonly Lg: "lg";
            };
        };
    }];
    readonly events: readonly [];
    readonly inheritedMap: {
        readonly AccessibleName: {
            readonly prop: "ariaLabel";
        };
    };
    readonly designDefaults: {
        readonly size: readonly [320, 32];
    };
    readonly web: {
        readonly module: "@ui";
        readonly export: "Breadcrumb";
        readonly domRoot: "wrapper";
        readonly childrenToProp: {
            readonly prop: "items";
            readonly item: "BreadcrumbItem";
            readonly content: "none";
        };
    };
};
export declare const BreadcrumbItemMeta: {
    readonly name: "BreadcrumbItem";
    readonly doc: "A segment of a Breadcrumb trail.";
    readonly docFr: "Segment d'un fil d'Ariane.";
    readonly family: "containers";
    readonly baseChain: readonly ["BreadcrumbItem", "Component"];
    readonly children: "None";
    readonly defaultEvent: "OnClick";
    readonly properties: readonly [{
        readonly name: "Text";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Appearance";
        readonly doc: "Text of the segment.";
        readonly docFr: "Texte du segment.";
        readonly to: {
            readonly prop: "label";
        };
    }, {
        readonly name: "Href";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Behavior";
        readonly webOnly: true;
        readonly doc: "Web only: address the segment links to (it can then be opened in a new tab).";
        readonly docFr: "Web uniquement : adresse vers laquelle pointe le segment (il peut alors s'ouvrir dans un nouvel onglet).";
        readonly to: {
            readonly prop: "href";
        };
    }, {
        readonly name: "Icon";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Icon";
        readonly editor: "icon";
        readonly webOnly: true;
        readonly doc: "Web only: icon shown before the text.";
        readonly docFr: "Web uniquement : icône affichée avant le texte.";
        readonly to: {
            readonly prop: "icon";
            readonly convert: "icon-node";
        };
    }];
    readonly events: readonly [{
        readonly name: "OnClick";
        readonly category: "Action";
        readonly args: "ItemEventArgs";
        readonly doc: "Occurs when the segment is clicked.";
        readonly docFr: "Se produit quand le segment est cliqué.";
        readonly from: {
            readonly prop: "onClick";
            readonly args: "item";
        };
    }];
    readonly web: {
        readonly module: null;
        readonly export: null;
        readonly domRoot: "none";
        readonly itemOf: readonly ["Breadcrumb"];
    };
};
export declare const StepperMeta: {
    readonly name: "Stepper";
    readonly doc: "The progress of a multi-step process. Add the steps as Step children.";
    readonly docFr: "Progression d'un processus en plusieurs étapes. Ajoutez les étapes comme éléments Step enfants.";
    readonly family: "containers";
    readonly baseChain: readonly ["Stepper", "Control", "Component"];
    readonly children: "List";
    readonly allowedChildren: readonly ["Step"];
    readonly defaultEvent: "OnStepSelected";
    readonly properties: readonly [{
        readonly name: "CurrentIndex";
        readonly kind: "F32";
        readonly default: "0";
        readonly category: "Data";
        readonly doc: "Index of the current step, starting at 0.";
        readonly docFr: "Index de l'étape en cours, à partir de 0.";
        readonly to: {
            readonly prop: "current";
        };
    }, {
        readonly name: "Orientation";
        readonly kind: {
            readonly Enum: readonly ["Horizontal", "Vertical"];
        };
        readonly default: "Horizontal";
        readonly category: "Layout";
        readonly doc: "Whether the steps are laid out horizontally or vertically.";
        readonly docFr: "Indique si les étapes sont disposées horizontalement ou verticalement.";
        readonly to: {
            readonly prop: "orientation";
            readonly values: {
                readonly Horizontal: "horizontal";
                readonly Vertical: "vertical";
            };
        };
    }, {
        readonly name: "AllowForward";
        readonly kind: "Bool";
        readonly default: "false";
        readonly category: "Behavior";
        readonly doc: "Lets the user click a step after the current one.";
        readonly docFr: "Permet de cliquer sur une étape située après l'étape en cours.";
        readonly to: {
            readonly prop: "allowForward";
        };
    }];
    readonly events: readonly [{
        readonly name: "OnStepSelected";
        readonly category: "Behavior";
        readonly args: "ValueChangedEventArgs";
        readonly doc: "Occurs when the user clicks a step.";
        readonly docFr: "Se produit quand l'utilisateur clique sur une étape.";
        readonly from: {
            readonly prop: "onStepChange";
            readonly args: "id-index";
        };
    }];
    readonly designDefaults: {
        readonly size: readonly [480, 64];
    };
    readonly web: {
        readonly module: "@ui";
        readonly export: "Stepper";
        readonly domRoot: "wrapper";
        readonly childrenToProp: {
            readonly prop: "steps";
            readonly item: "Step";
            readonly content: "none";
            readonly key: "id";
        };
    };
};
export declare const StepMeta: {
    readonly name: "Step";
    readonly doc: "A step of a Stepper.";
    readonly docFr: "Étape d'un Stepper.";
    readonly family: "containers";
    readonly baseChain: readonly ["Step", "Component"];
    readonly children: "None";
    readonly defaultEvent: null;
    readonly properties: readonly [{
        readonly name: "Label";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Appearance";
        readonly doc: "Text of the step.";
        readonly docFr: "Texte de l'étape.";
        readonly to: {
            readonly prop: "label";
        };
    }, {
        readonly name: "Description";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Appearance";
        readonly doc: "Secondary text shown under the label.";
        readonly docFr: "Texte secondaire affiché sous le libellé.";
        readonly to: {
            readonly prop: "description";
        };
    }, {
        readonly name: "Status";
        readonly kind: {
            readonly Enum: readonly ["Pending", "Current", "Complete", "Error", "Disabled"];
        };
        readonly default: "Pending";
        readonly category: "Appearance";
        readonly doc: "State of the step. Leave empty to derive it from the current step.";
        readonly docFr: "État de l'étape. Laisser vide pour le déduire de l'étape en cours.";
        readonly to: {
            readonly prop: "status";
            readonly values: {
                readonly Pending: "pending";
                readonly Current: "current";
                readonly Complete: "complete";
                readonly Error: "error";
                readonly Disabled: "disabled";
            };
        };
    }, {
        readonly name: "Optional";
        readonly kind: "Bool";
        readonly default: "false";
        readonly category: "Behavior";
        readonly doc: "Marks the step as optional.";
        readonly docFr: "Marque l'étape comme facultative.";
        readonly to: {
            readonly prop: "optional";
        };
    }];
    readonly events: readonly [];
    readonly web: {
        readonly module: null;
        readonly export: null;
        readonly domRoot: "none";
        readonly itemOf: readonly ["Stepper"];
    };
};
export declare const FloatingWindowMeta: {
    readonly name: "FloatingWindow";
    readonly doc: "A window drawn inside the view, with the Kubuno title band and a close button; modal, it veils the rest of the window.";
    readonly docFr: "Fenêtre dessinée dans la vue, avec la barre de titre Kubuno et un bouton Fermer ; modale, elle voile le reste de la fenêtre.";
    readonly family: "containers";
    readonly baseChain: readonly ["FloatingWindow", "ContainerBase", "ScrollableControl", "Control", "Component"];
    readonly children: "SingleWidget";
    readonly defaultEvent: "OnClick";
    readonly properties: readonly [{
        readonly name: "Title";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Appearance";
        readonly bindable: true;
        readonly localizable: true;
        readonly doc: "Text of the window's title band.";
        readonly docFr: "Texte de la barre de titre de la fenêtre.";
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
            readonly prop: "icon";
            readonly convert: "icon-node";
        };
    }, {
        readonly name: "IsOpen";
        readonly kind: "Bool";
        readonly default: "true";
        readonly category: "Behavior";
        readonly bindable: true;
        readonly doc: "Whether the window shows. Bind it to open and close the window from code; the close button sets it to false.";
        readonly docFr: "Indique si la fenêtre est affichée. Liez-la pour ouvrir et fermer la fenêtre depuis le code ; le bouton Fermer la passe à false.";
        readonly to: {
            readonly runtime: "visible";
            readonly change: "OnClose";
        };
    }, {
        readonly name: "Modal";
        readonly kind: "Bool";
        readonly default: "false";
        readonly category: "Behavior";
        readonly doc: "Veils the rest of the window while it is open, like a dialog.";
        readonly docFr: "Voile le reste de la fenêtre tant qu'elle est ouverte, comme un dialogue.";
        readonly to: {
            readonly prop: "backdrop";
        };
    }, ...import("./types.ts").PropertyMeta<never>[], {
        readonly name: "Resizable";
        readonly kind: "Bool";
        readonly default: "false";
        readonly category: "Behavior";
        readonly webOnly: true;
        readonly doc: "Web only: lets the user resize the window by its edges.";
        readonly docFr: "Web uniquement : permet à l'utilisateur de redimensionner la fenêtre par ses bords.";
        readonly to: {
            readonly prop: "resizable";
        };
    }];
    readonly events: readonly [{
        readonly name: "OnClose";
        readonly category: "Action";
        readonly args: "EventArgs";
        readonly doc: "Occurs when the close button of the window is clicked.";
        readonly docFr: "Se produit quand on clique sur le bouton Fermer de la fenêtre.";
        readonly from: {
            readonly prop: "onClose";
            readonly args: "none";
        };
    }];
    readonly inheritedMap: {
        readonly Width: {
            readonly prop: "defaultWidth";
        };
        readonly Height: {
            readonly prop: "defaultHeight";
        };
    };
    readonly designDefaults: {
        readonly attributes: {
            readonly Title: "Fenêtre";
        };
        readonly size: readonly [560, 360];
    };
    readonly web: {
        readonly module: "@ui";
        readonly export: "FloatingWindow";
        readonly domRoot: "portal";
        readonly content: "children";
    };
};
export declare const PopoverMeta: {
    readonly name: "Popover";
    readonly doc: "A floating panel shown next to a control (its Target) while IsOpen is true; a click outside it or Escape closes it. It is painted above the rest of the view wherever it is declared.";
    readonly docFr: "Panneau flottant affiché à côté d'un contrôle (sa cible) tant qu'IsOpen vaut true ; un clic à l'extérieur ou Échap le ferme. Il se dessine au-dessus du reste de la vue, où qu'il soit déclaré.";
    readonly family: "containers";
    readonly baseChain: readonly ["Popover", "ContainerBase", "ScrollableControl", "Control", "Component"];
    readonly children: "SingleWidget";
    readonly defaultEvent: "OnClosed";
    readonly properties: readonly [{
        readonly name: "Target";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Behavior";
        readonly editor: "reference:Control";
        readonly doc: "The x:Name of the control it opens next to.";
        readonly docFr: "x:Name du contrôle à côté duquel il s'ouvre.";
        readonly to: {
            readonly prop: "anchorRef";
            readonly convert: "element-ref";
        };
    }, {
        readonly name: "IsOpen";
        readonly kind: "Bool";
        readonly default: "false";
        readonly category: "Behavior";
        readonly bindable: true;
        readonly doc: "Whether it is shown. Bind it two-way to know when the user closes it.";
        readonly docFr: "Indique s'il est affiché. Liez-le dans les deux sens pour savoir quand l'utilisateur le ferme.";
        readonly to: {
            readonly prop: "open";
            readonly change: "OnClosed";
        };
    }, {
        readonly name: "Alignment";
        readonly kind: {
            readonly Enum: readonly ["Start", "Center", "End"];
        };
        readonly default: "Start";
        readonly category: "Layout";
        readonly doc: "Which edges of the panel and the target line up. On the web Center is not available yet (Start is used).";
        readonly docFr: "Bords du panneau et de la cible qui s'alignent. Sur le web, Center n'est pas encore disponible (Start est utilisé).";
        readonly to: {
            readonly prop: "align";
            readonly values: {
                readonly Start: "left";
                readonly Center: "left";
                readonly End: "right";
            };
        };
    }];
    readonly events: readonly [{
        readonly name: "OnClosed";
        readonly category: "Behavior";
        readonly args: "EventArgs";
        readonly doc: "Occurs when the panel closes.";
        readonly docFr: "Se produit quand le panneau se ferme.";
        readonly from: {
            readonly prop: "onClose";
            readonly args: "none";
        };
    }];
    readonly designDefaults: {
        readonly size: readonly [240, 160];
    };
    readonly web: {
        readonly module: "@ui";
        readonly export: "AnchoredPopover";
        readonly domRoot: "portal";
        readonly content: "children";
    };
};
