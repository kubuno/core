/**
 * `TextField Variant="Outlined"` renders the `@ui` OutlinedField (floating label inside the box),
 * the field of the sign-in, setup and database screens. Fewer properties than Input: no hint,
 * error text, right icon or length limit.
 */
export declare const OutlinedTextFieldWeb: {
    readonly when: {
        readonly Variant: "Outlined";
    };
    readonly module: "@ui";
    readonly export: "OutlinedField";
    readonly domRoot: "wrapper";
    readonly propMap: {
        readonly Text: {
            readonly prop: "value";
            readonly change: "OnTextChanged";
        };
        readonly Placeholder: {
            readonly prop: "placeholder";
        };
        readonly Label: {
            readonly prop: "label";
        };
        readonly Required: {
            readonly prop: "required";
        };
        readonly LeftIcon: {
            readonly prop: "icon";
            readonly convert: "icon-node";
        };
        readonly ReadOnly: {
            readonly prop: "readOnly";
        };
        readonly Variant: {
            readonly runtime: "component-variant";
        };
    };
    readonly eventMap: {
        readonly OnTextChanged: {
            readonly prop: "onChange";
            readonly args: "value";
        };
    };
    readonly fixed: {
        readonly primaryColor: "var(--color-primary)";
    };
};
export declare const TextFieldMeta: {
    readonly name: "TextField";
    readonly doc: "A single-line text box.";
    readonly docFr: "Zone de texte sur une ligne.";
    readonly family: "core";
    readonly baseChain: readonly ["TextField", "TextBoxBase", "Control", "Component"];
    readonly children: "None";
    readonly defaultEvent: "OnTextChanged";
    readonly properties: readonly [{
        readonly name: "Text";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Appearance";
        readonly doc: "Text in the field.";
        readonly docFr: "Texte contenu dans le champ.";
        readonly to: {
            readonly prop: "value";
            readonly change: "OnTextChanged";
        };
    }, {
        readonly to: {
            readonly prop: "placeholder";
        };
        readonly doc: "Hint shown while the field is empty.";
        readonly docFr: "Indication affichée tant que le champ est vide.";
        readonly name: "Placeholder";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Appearance";
    }, {
        readonly name: "Label";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Appearance";
        readonly localizable: true;
        readonly webOnly: true;
        readonly doc: "Web only: label shown above the field.";
        readonly docFr: "Web uniquement : libellé affiché au-dessus du champ.";
        readonly to: {
            readonly prop: "label";
        };
    }, {
        readonly name: "Hint";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Appearance";
        readonly localizable: true;
        readonly webOnly: true;
        readonly doc: "Web only: help text shown under the field.";
        readonly docFr: "Web uniquement : texte d'aide affiché sous le champ.";
        readonly to: {
            readonly prop: "hint";
        };
    }, {
        readonly name: "ErrorText";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Behavior";
        readonly bindable: true;
        readonly localizable: true;
        readonly webOnly: true;
        readonly doc: "Web only: when not empty, shows the field in the error colour with this message under it.";
        readonly docFr: "Web uniquement : si non vide, affiche le champ dans la couleur d'erreur avec ce message dessous.";
        readonly to: {
            readonly prop: "error";
        };
    }, {
        readonly name: "Required";
        readonly kind: "Bool";
        readonly default: "false";
        readonly category: "Behavior";
        readonly webOnly: true;
        readonly doc: "Web only: marks the label with an asterisk and announces the field as required.";
        readonly docFr: "Web uniquement : marque le libellé d'un astérisque et annonce le champ comme obligatoire.";
        readonly to: {
            readonly prop: "required";
        };
    }, {
        readonly name: "LeftIcon";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Icon";
        readonly editor: "icon";
        readonly webOnly: true;
        readonly doc: "Web only: icon shown inside the field, before the text.";
        readonly docFr: "Web uniquement : icône affichée dans le champ, avant le texte.";
        readonly to: {
            readonly prop: "leftIcon";
            readonly convert: "icon-node";
        };
    }, {
        readonly name: "RightIcon";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Icon";
        readonly editor: "icon";
        readonly webOnly: true;
        readonly doc: "Web only: icon shown inside the field, after the text.";
        readonly docFr: "Web uniquement : icône affichée dans le champ, après le texte.";
        readonly to: {
            readonly prop: "rightIcon";
            readonly convert: "icon-node";
        };
    }, {
        readonly name: "Variant";
        readonly kind: {
            readonly Enum: readonly ["Standard", "Outlined"];
        };
        readonly default: "Standard";
        readonly category: "Appearance";
        readonly webOnly: true;
        readonly doc: "Web only: Standard (label above the box) or Outlined (floating label inside the box, the OutlinedField).";
        readonly docFr: "Web uniquement : Standard (libellé au-dessus du champ) ou Outlined (libellé flottant dans le cadre, OutlinedField).";
        readonly to: {
            readonly runtime: "component-variant";
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
            readonly args: "target-value";
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
        readonly TabIndex: {
            readonly prop: "tabIndex";
        };
    };
    readonly designDefaults: {
        readonly size: readonly [200, 36];
    };
    readonly web: {
        readonly module: "@ui";
        readonly export: "Input";
        readonly domRoot: "wrapper";
        readonly alternates: readonly [{
            readonly when: {
                readonly Variant: "Outlined";
            };
            readonly module: "@ui";
            readonly export: "OutlinedField";
            readonly domRoot: "wrapper";
            readonly propMap: {
                readonly Text: {
                    readonly prop: "value";
                    readonly change: "OnTextChanged";
                };
                readonly Placeholder: {
                    readonly prop: "placeholder";
                };
                readonly Label: {
                    readonly prop: "label";
                };
                readonly Required: {
                    readonly prop: "required";
                };
                readonly LeftIcon: {
                    readonly prop: "icon";
                    readonly convert: "icon-node";
                };
                readonly ReadOnly: {
                    readonly prop: "readOnly";
                };
                readonly Variant: {
                    readonly runtime: "component-variant";
                };
            };
            readonly eventMap: {
                readonly OnTextChanged: {
                    readonly prop: "onChange";
                    readonly args: "value";
                };
            };
            readonly fixed: {
                readonly primaryColor: "var(--color-primary)";
            };
        }];
    };
};
export declare const TextAreaMeta: {
    readonly name: "TextArea";
    readonly doc: "A multi-line text box.";
    readonly docFr: "Zone de texte multiligne.";
    readonly family: "text";
    readonly baseChain: readonly ["TextArea", "TextBoxBase", "Control", "Component"];
    readonly children: "None";
    readonly defaultEvent: "OnTextChanged";
    readonly properties: readonly [{
        readonly name: "Text";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Appearance";
        readonly doc: "Text in the field.";
        readonly docFr: "Texte contenu dans le champ.";
        readonly to: {
            readonly prop: "value";
            readonly change: "OnTextChanged";
        };
    }, {
        readonly to: {
            readonly prop: "placeholder";
        };
        readonly doc: "Hint shown while the field is empty.";
        readonly docFr: "Indication affichée tant que le champ est vide.";
        readonly name: "Placeholder";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Appearance";
    }, {
        readonly name: "WordWrap";
        readonly kind: "Bool";
        readonly default: "true";
        readonly category: "Behavior";
        readonly doc: "Wraps long lines at the edge of the field.";
        readonly docFr: "Renvoie les longues lignes à la ligne au bord du champ.";
        readonly to: {
            readonly prop: "wrap";
            readonly values: {
                readonly true: "soft";
                readonly false: "off";
            };
        };
    }, {
        readonly name: "Label";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Appearance";
        readonly localizable: true;
        readonly webOnly: true;
        readonly doc: "Web only: label shown above the field.";
        readonly docFr: "Web uniquement : libellé affiché au-dessus du champ.";
        readonly to: {
            readonly prop: "label";
        };
    }, {
        readonly name: "Hint";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Appearance";
        readonly localizable: true;
        readonly webOnly: true;
        readonly doc: "Web only: help text shown under the field.";
        readonly docFr: "Web uniquement : texte d'aide affiché sous le champ.";
        readonly to: {
            readonly prop: "hint";
        };
    }, {
        readonly name: "ErrorText";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Behavior";
        readonly bindable: true;
        readonly localizable: true;
        readonly webOnly: true;
        readonly doc: "Web only: when not empty, shows the field in the error colour with this message under it.";
        readonly docFr: "Web uniquement : si non vide, affiche le champ dans la couleur d'erreur avec ce message dessous.";
        readonly to: {
            readonly prop: "error";
        };
    }, {
        readonly name: "Required";
        readonly kind: "Bool";
        readonly default: "false";
        readonly category: "Behavior";
        readonly webOnly: true;
        readonly doc: "Web only: marks the label with an asterisk and announces the field as required.";
        readonly docFr: "Web uniquement : marque le libellé d'un astérisque et annonce le champ comme obligatoire.";
        readonly to: {
            readonly prop: "required";
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
            readonly args: "target-value";
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
        readonly TabIndex: {
            readonly prop: "tabIndex";
        };
    };
    readonly designDefaults: {
        readonly size: readonly [200, 120];
    };
    readonly web: {
        readonly module: "@ui";
        readonly export: "Textarea";
        readonly domRoot: "wrapper";
    };
};
export declare const DropdownMeta: {
    readonly name: "Dropdown";
    readonly doc: "A drop-down list for choosing one option. Add the options as Option children.";
    readonly docFr: "Liste déroulante pour choisir une option. Ajoutez les options comme éléments Option enfants.";
    readonly family: "text";
    readonly baseChain: readonly ["Dropdown", "ListControl", "Control", "Component"];
    readonly children: "List";
    readonly allowedChildren: readonly ["Option"];
    readonly defaultEvent: "OnSelectedValueChanged";
    readonly properties: readonly [{
        readonly to: {
            readonly prop: "value";
            readonly change: "OnSelectedValueChanged";
        };
        readonly doc: "Value of the selected option. Empty when nothing is selected.";
        readonly docFr: "Valeur de l'option sélectionnée. Vide quand rien n'est sélectionné.";
        readonly name: "SelectedValue";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Data";
    }, {
        readonly name: "Placeholder";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Appearance";
        readonly doc: "Text shown when nothing is selected.";
        readonly docFr: "Texte affiché quand rien n'est sélectionné.";
        readonly to: {
            readonly prop: "placeholder";
        };
    }, {
        readonly name: "Variant";
        readonly kind: {
            readonly Enum: readonly ["Default", "Ghost"];
        };
        readonly default: "Default";
        readonly category: "Appearance";
        readonly doc: "Look of the list: with a border, or borderless for a toolbar.";
        readonly docFr: "Aspect de la liste : avec bordure, ou sans bordure pour une barre d'outils.";
        readonly to: {
            readonly prop: "variant";
            readonly values: {
                readonly Default: "default";
                readonly Ghost: "ghost";
            };
        };
    }, {
        readonly to: {
            readonly prop: "options";
            readonly convert: "items-source";
        };
        readonly name: "ItemsSource";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Data";
        readonly doc: "Binding to the list of items to show, instead of Option children.";
        readonly docFr: "Liaison vers la liste des éléments à afficher, à la place des éléments Option.";
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
        readonly from: {
            readonly prop: "onChange";
            readonly args: "value";
        };
        readonly name: "OnSelectedValueChanged";
        readonly category: "Property Changed";
        readonly args: "ValueChangedEventArgs";
        readonly aliases: readonly ["OnChanged"];
        readonly doc: "Occurs when the selected option changes.";
        readonly docFr: "Se produit quand l'option sélectionnée change.";
    }];
    readonly inheritedMap: {
        readonly Enabled: {
            readonly prop: "disabled";
            readonly convert: "invert";
        };
    };
    readonly designDefaults: {
        readonly size: readonly [200, 36];
    };
    readonly web: {
        readonly module: "@ui";
        readonly export: "Dropdown";
        readonly domRoot: "wrapper";
        readonly childrenToProp: {
            readonly prop: "options";
            readonly item: "Option";
            readonly content: "none";
        };
    };
};
export declare const ComboBoxMeta: {
    readonly name: "ComboBox";
    readonly doc: "A list box that drops down, for choosing one option. Add the options as Option children.";
    readonly docFr: "Liste déroulante pour choisir une option. Ajoutez les options comme éléments Option enfants.";
    readonly family: "text";
    readonly baseChain: readonly ["ComboBox", "ListControl", "Control", "Component"];
    readonly children: "List";
    readonly allowedChildren: readonly ["Option"];
    readonly defaultEvent: "OnSelectedValueChanged";
    readonly properties: readonly [{
        readonly to: {
            readonly prop: "value";
            readonly change: "OnSelectedValueChanged";
        };
        readonly doc: "Value of the selected option. Empty when nothing is selected.";
        readonly docFr: "Valeur de l'option sélectionnée. Vide quand rien n'est sélectionné.";
        readonly name: "SelectedValue";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Data";
    }, {
        readonly to: {
            readonly prop: "options";
            readonly convert: "items-source";
        };
        readonly name: "ItemsSource";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Data";
        readonly doc: "Binding to the list of items to show, instead of Option children.";
        readonly docFr: "Liaison vers la liste des éléments à afficher, à la place des éléments Option.";
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
    }, {
        readonly name: "Placeholder";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Appearance";
        readonly localizable: true;
        readonly webOnly: true;
        readonly doc: "Web only: text shown when nothing is selected.";
        readonly docFr: "Web uniquement : texte affiché quand rien n'est sélectionné.";
        readonly to: {
            readonly prop: "placeholder";
        };
    }];
    readonly events: readonly [{
        readonly from: {
            readonly prop: "onChange";
            readonly args: "value";
        };
        readonly name: "OnSelectedValueChanged";
        readonly category: "Property Changed";
        readonly args: "ValueChangedEventArgs";
        readonly aliases: readonly ["OnChanged"];
        readonly doc: "Occurs when the selected option changes.";
        readonly docFr: "Se produit quand l'option sélectionnée change.";
    }];
    readonly inheritedMap: {
        readonly Enabled: {
            readonly prop: "disabled";
            readonly convert: "invert";
        };
        readonly AccessibleName: {
            readonly prop: "aria-label";
        };
    };
    readonly designDefaults: {
        readonly size: readonly [200, 36];
    };
    readonly web: {
        readonly module: "@ui";
        readonly export: "Combobox";
        readonly domRoot: "wrapper";
        readonly childrenToProp: {
            readonly prop: "options";
            readonly item: "Option";
            readonly content: "none";
        };
    };
};
/** `Option` items feed `Dropdown.options` and `Combobox.options`: checked against both item types. */
export declare const OptionMeta: {
    readonly name: "Option";
    readonly doc: "An item of a Dropdown or ComboBox list, or a choice of a RadioGroup.";
    readonly docFr: "Élément de la liste d'un Dropdown ou d'une ComboBox.";
    readonly family: "text";
    readonly baseChain: readonly ["Option", "Component"];
    readonly children: "None";
    readonly defaultEvent: null;
    readonly properties: readonly [{
        readonly name: "Value";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Data";
        readonly doc: "Value of the item.";
        readonly docFr: "Valeur de l'élément.";
        readonly to: {
            readonly prop: "value";
        };
    }, {
        readonly name: "Label";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Appearance";
        readonly doc: "Text shown for the item. Defaults to Value.";
        readonly docFr: "Texte affiché pour l'élément. Par défaut, Value.";
        readonly to: {
            readonly prop: "label";
        };
    }];
    readonly events: readonly [];
    readonly web: {
        readonly module: null;
        readonly export: null;
        readonly domRoot: "none";
        readonly itemOf: readonly ["Dropdown", "ComboBox", "RadioGroup"];
    };
};
export declare const DatePickerMeta: {
    readonly name: "DatePicker";
    readonly doc: "A date field with a drop-down calendar.";
    readonly docFr: "Champ de date avec un calendrier déroulant.";
    readonly family: "text";
    readonly baseChain: readonly ["DatePicker", "Control", "Component"];
    readonly children: "None";
    readonly defaultEvent: "OnValueChanged";
    readonly properties: readonly [{
        readonly name: "Date";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Data";
        readonly doc: "Selected date, in the form YYYY-MM-DD.";
        readonly docFr: "Date sélectionnée, au format AAAA-MM-JJ.";
        readonly to: {
            readonly prop: "value";
            readonly change: "OnValueChanged";
        };
    }, {
        readonly name: "Format";
        readonly kind: {
            readonly Enum: readonly ["Long", "Short", "Time"];
        };
        readonly default: "Long";
        readonly category: "Appearance";
        readonly doc: "How the date is shown: long date, short date, or a time. On the web Long and Short both show the locale's date.";
        readonly docFr: "Affichage de la date : date longue, date courte ou heure. Sur le web, Long et Short affichent tous deux la date de la langue.";
        readonly to: {
            readonly prop: "mode";
            readonly values: {
                readonly Long: "date";
                readonly Short: "date";
                readonly Time: "time";
            };
        };
    }, {
        readonly name: "Placeholder";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Appearance";
        readonly localizable: true;
        readonly webOnly: true;
        readonly doc: "Web only: hint shown while no date is chosen.";
        readonly docFr: "Web uniquement : indication affichée tant qu'aucune date n'est choisie.";
        readonly to: {
            readonly prop: "placeholder";
        };
    }, {
        readonly name: "Label";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Appearance";
        readonly localizable: true;
        readonly webOnly: true;
        readonly doc: "Web only: label shown above the field.";
        readonly docFr: "Web uniquement : libellé affiché au-dessus du champ.";
        readonly to: {
            readonly prop: "label";
        };
    }, {
        readonly name: "Hint";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Appearance";
        readonly localizable: true;
        readonly webOnly: true;
        readonly doc: "Web only: help text shown under the field.";
        readonly docFr: "Web uniquement : texte d'aide affiché sous le champ.";
        readonly to: {
            readonly prop: "hint";
        };
    }, {
        readonly name: "ErrorText";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Behavior";
        readonly bindable: true;
        readonly localizable: true;
        readonly webOnly: true;
        readonly doc: "Web only: when not empty, shows the field in the error colour with this message under it.";
        readonly docFr: "Web uniquement : si non vide, affiche le champ dans la couleur d'erreur avec ce message dessous.";
        readonly to: {
            readonly prop: "error";
        };
    }, {
        readonly name: "Required";
        readonly kind: "Bool";
        readonly default: "false";
        readonly category: "Behavior";
        readonly webOnly: true;
        readonly doc: "Web only: marks the label with an asterisk and announces the field as required.";
        readonly docFr: "Web uniquement : marque le libellé d'un astérisque et annonce le champ comme obligatoire.";
        readonly to: {
            readonly prop: "required";
        };
    }];
    readonly events: readonly [{
        readonly name: "OnValueChanged";
        readonly category: "Action";
        readonly args: "ValueChangedEventArgs";
        readonly aliases: readonly ["OnChanged"];
        readonly doc: "Occurs when the date changes.";
        readonly docFr: "Se produit quand la date change.";
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
    };
    readonly designDefaults: {
        readonly size: readonly [200, 36];
    };
    readonly web: {
        readonly module: "@ui";
        readonly export: "DatePicker";
        readonly domRoot: "wrapper";
    };
};
export declare const ColorFieldMeta: {
    readonly name: "ColorField";
    readonly doc: "A colour swatch that opens a colour picker.";
    readonly docFr: "Pastille de couleur qui ouvre un sélecteur de couleur.";
    readonly family: "text";
    readonly baseChain: readonly ["ColorField", "Control", "Component"];
    readonly children: "None";
    readonly defaultEvent: "OnValueChanged";
    readonly properties: readonly [{
        readonly name: "Color";
        readonly kind: "String";
        readonly default: "#000000";
        readonly category: "Appearance";
        readonly doc: "Colour shown, as #rrggbb.";
        readonly docFr: "Couleur affichée, au format #rrggbb.";
        readonly to: {
            readonly prop: "color";
            readonly change: "OnValueChanged";
        };
    }];
    readonly events: readonly [{
        readonly name: "OnClick";
        readonly category: "Action";
        readonly args: "ValueChangedEventArgs";
        readonly doc: "Occurs when the swatch is clicked, which opens or closes its colour picker.";
        readonly docFr: "Se produit quand la pastille est cliquée, ce qui ouvre ou ferme son sélecteur de couleur.";
        readonly from: {
            readonly dom: "click";
            readonly args: "none";
        };
    }, {
        readonly name: "OnValueChanged";
        readonly category: "Action";
        readonly args: "ValueChangedEventArgs";
        readonly aliases: readonly ["OnChanged"];
        readonly doc: "Occurs when the colour is changed in the picker.";
        readonly docFr: "Se produit quand la couleur est modifiée dans le sélecteur.";
        readonly from: {
            readonly prop: "onChange";
            readonly args: "value";
        };
    }];
    readonly designDefaults: {
        readonly size: readonly [32, 24];
    };
    readonly web: {
        readonly module: "@ui";
        readonly export: "ColorField";
        readonly domRoot: "wrapper";
    };
};
export declare const GradientFieldMeta: {
    readonly name: "GradientField";
    readonly doc: "A gradient swatch that opens a gradient picker.";
    readonly docFr: "Pastille de dégradé qui ouvre un sélecteur de dégradé.";
    readonly family: "text";
    readonly baseChain: readonly ["GradientField", "Control", "Component"];
    readonly children: "None";
    readonly defaultEvent: "OnValueChanged";
    readonly properties: readonly [{
        readonly name: "Value";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Data";
        readonly doc: "Gradient shown, as a CSS linear-gradient(...) or radial-gradient(circle, ...).";
        readonly docFr: "Dégradé affiché, au format CSS linear-gradient(...) ou radial-gradient(circle, ...).";
        readonly to: {
            readonly prop: "value";
            readonly convert: "gradient-css";
            readonly change: "OnValueChanged";
        };
    }];
    readonly events: readonly [{
        readonly name: "OnValueChanged";
        readonly category: "Action";
        readonly args: "ValueChangedEventArgs";
        readonly aliases: readonly ["OnChanged"];
        readonly doc: "Occurs when the gradient is changed in the picker.";
        readonly docFr: "Se produit quand le dégradé est modifié dans le sélecteur.";
        readonly from: {
            readonly prop: "onChange";
            readonly args: "value";
        };
    }];
    readonly designDefaults: {
        readonly size: readonly [32, 24];
    };
    readonly web: {
        readonly module: "@ui";
        readonly export: "GradientField";
        readonly domRoot: "wrapper";
    };
};
