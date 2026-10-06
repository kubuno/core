export declare const CheckBoxMeta: {
    readonly name: "CheckBox";
    readonly doc: "A check box.";
    readonly docFr: "Case à cocher.";
    readonly family: "choice";
    readonly baseChain: readonly ["CheckBox", "ButtonBase", "Control", "Component"];
    readonly children: "None";
    readonly defaultEvent: "OnCheckedChanged";
    readonly properties: readonly [{
        readonly name: "Text";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Appearance";
        readonly doc: "Text displayed next to the check box.";
        readonly docFr: "Texte affiché à côté de la case.";
        readonly to: {
            readonly prop: "label";
        };
    }, {
        readonly to: {
            readonly prop: "description";
        };
        readonly doc: "Secondary text displayed under the label.";
        readonly docFr: "Texte secondaire affiché sous le libellé.";
        readonly name: "Description";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Appearance";
    }, {
        readonly name: "Checked";
        readonly kind: "Bool";
        readonly default: "false";
        readonly category: "Data";
        readonly doc: "Whether the box is checked.";
        readonly docFr: "Indique si la case est cochée.";
        readonly to: {
            readonly prop: "checked";
            readonly change: "OnCheckedChanged";
        };
    }, {
        readonly name: "CheckState";
        readonly kind: {
            readonly Enum: readonly ["Unchecked", "Checked", "Indeterminate"];
        };
        readonly default: "Unchecked";
        readonly category: "Appearance";
        readonly bindable: true;
        readonly doc: "State of the box, including the indeterminate state of a three-state box.";
        readonly docFr: "État de la case, y compris l'état indéterminé d'une case à trois états.";
        readonly to: {
            readonly prop: "indeterminate";
            readonly values: {
                readonly Unchecked: false;
                readonly Checked: false;
                readonly Indeterminate: true;
            };
        };
    }];
    readonly events: readonly [{
        readonly name: "OnCheckedChanged";
        readonly category: "Property Changed";
        readonly args: "ValueChangedEventArgs";
        readonly doc: "Occurs when the box is checked or unchecked.";
        readonly docFr: "Se produit quand la case est cochée ou décochée.";
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
        readonly attributes: {
            readonly Text: "Case à cocher";
        };
        readonly size: readonly [140, 24];
    };
    readonly web: {
        readonly module: "@ui";
        readonly export: "Checkbox";
        readonly domRoot: "wrapper";
    };
};
export declare const RadioButtonMeta: {
    readonly name: "RadioButton";
    readonly doc: "An option button: only one option of a group can be selected.";
    readonly docFr: "Bouton d'option : une seule option d'un groupe peut être sélectionnée.";
    readonly family: "choice";
    readonly baseChain: readonly ["RadioButton", "ButtonBase", "Control", "Component"];
    readonly children: "None";
    readonly defaultEvent: "OnCheckedChanged";
    readonly properties: readonly [{
        readonly name: "Text";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Appearance";
        readonly doc: "Text displayed next to the option.";
        readonly docFr: "Texte affiché à côté de l'option.";
        readonly to: {
            readonly prop: "label";
        };
    }, {
        readonly to: {
            readonly prop: "description";
        };
        readonly doc: "Secondary text displayed under the label.";
        readonly docFr: "Texte secondaire affiché sous le libellé.";
        readonly name: "Description";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Appearance";
    }, {
        readonly name: "Value";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Data";
        readonly doc: "Value this option stands for.";
        readonly docFr: "Valeur que représente cette option.";
        readonly to: {
            readonly runtime: "item-state";
        };
    }, {
        readonly name: "Group";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Misc";
        readonly doc: "Name of the group this option belongs to.";
        readonly docFr: "Nom du groupe auquel appartient cette option.";
        readonly to: {
            readonly runtime: "item-state";
        };
    }, {
        readonly name: "SelectedValue";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Data";
        readonly doc: "Value of the selected option of the group, usually bound in both directions. The option is selected when it equals Value.";
        readonly docFr: "Valeur de l'option sélectionnée du groupe, généralement liée dans les deux sens. L'option est sélectionnée quand elle est égale à Value.";
        readonly to: {
            readonly prop: "checked";
            readonly convert: "equals-value";
            readonly change: "OnCheckedChanged";
        };
    }];
    readonly events: readonly [{
        readonly name: "OnCheckedChanged";
        readonly category: "Property Changed";
        readonly args: "ValueChangedEventArgs";
        readonly doc: "Occurs when this option is selected.";
        readonly docFr: "Se produit quand cette option est sélectionnée.";
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
        readonly attributes: {
            readonly Text: "Option";
        };
        readonly size: readonly [140, 24];
    };
    readonly web: {
        readonly module: "@ui";
        readonly export: "Radio";
        readonly domRoot: "wrapper";
    };
};
export declare const SwitchMeta: {
    readonly name: "Switch";
    readonly doc: "An on/off switch.";
    readonly docFr: "Interrupteur marche/arrêt.";
    readonly family: "core";
    readonly baseChain: readonly ["Switch", "ButtonBase", "Control", "Component"];
    readonly children: "None";
    readonly defaultEvent: "OnCheckedChanged";
    readonly properties: readonly [{
        readonly name: "On";
        readonly kind: "Bool";
        readonly default: "false";
        readonly category: "Data";
        readonly doc: "Whether the switch is on.";
        readonly docFr: "Indique si l'interrupteur est activé.";
        readonly to: {
            readonly prop: "checked";
            readonly change: "OnCheckedChanged";
        };
    }, {
        readonly name: "Label";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Appearance";
        readonly doc: "Text displayed next to the switch.";
        readonly docFr: "Texte affiché à côté de l'interrupteur.";
        readonly to: {
            readonly prop: "label";
        };
    }, {
        readonly to: {
            readonly prop: "description";
        };
        readonly doc: "Secondary text displayed under the label.";
        readonly docFr: "Texte secondaire affiché sous le libellé.";
        readonly name: "Description";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Appearance";
    }, {
        readonly name: "Size";
        readonly kind: {
            readonly Enum: readonly ["Sm", "Md"];
        };
        readonly default: "Md";
        readonly category: "Appearance";
        readonly doc: "Size of the switch.";
        readonly docFr: "Taille de l'interrupteur.";
        readonly to: {
            readonly prop: "size";
            readonly values: {
                readonly Sm: "sm";
                readonly Md: "md";
            };
        };
    }];
    readonly events: readonly [{
        readonly name: "OnCheckedChanged";
        readonly category: "Property Changed";
        readonly args: "ValueChangedEventArgs";
        readonly aliases: readonly ["OnToggled"];
        readonly doc: "Occurs when the switch is turned on or off.";
        readonly docFr: "Se produit quand l'interrupteur est activé ou désactivé.";
        readonly from: {
            readonly prop: "onChange";
            readonly args: "target-checked";
        };
    }];
    readonly inheritedMap: {
        readonly Enabled: {
            readonly prop: "disabled";
            readonly convert: "invert";
        };
        readonly TabIndex: {
            readonly prop: "tabIndex";
        };
    };
    readonly designDefaults: {
        readonly attributes: {
            readonly Label: "Interrupteur";
        };
        readonly size: readonly [140, 24];
    };
    readonly web: {
        readonly module: "@ui";
        readonly export: "Toggle";
        readonly domRoot: "wrapper";
    };
};
export declare const SliderMeta: {
    readonly name: "Slider";
    readonly doc: "A slider for choosing a value in a range.";
    readonly docFr: "Curseur pour choisir une valeur dans une plage.";
    readonly family: "choice";
    readonly baseChain: readonly ["Slider", "RangeBase", "Control", "Component"];
    readonly children: "None";
    readonly defaultEvent: "OnValueChanged";
    readonly properties: readonly [{
        readonly name: "Minimum";
        readonly kind: "F32";
        readonly default: "0";
        readonly category: "Data";
        readonly aliases: readonly ["Min"];
        readonly doc: "Lowest value.";
        readonly docFr: "Valeur minimale.";
        readonly to: {
            readonly prop: "min";
        };
    }, {
        readonly name: "Maximum";
        readonly kind: "F32";
        readonly default: "10";
        readonly category: "Data";
        readonly aliases: readonly ["Max"];
        readonly doc: "Highest value.";
        readonly docFr: "Valeur maximale.";
        readonly to: {
            readonly prop: "max";
        };
    }, {
        readonly name: "Value";
        readonly kind: "F32";
        readonly default: "0";
        readonly category: "Data";
        readonly doc: "Current value, between Minimum and Maximum.";
        readonly docFr: "Valeur actuelle, entre Minimum et Maximum.";
        readonly to: {
            readonly prop: "value";
            readonly change: "OnValueChanged";
        };
    }, {
        readonly name: "SmallChange";
        readonly kind: "F32";
        readonly default: "1";
        readonly category: "Data";
        readonly aliases: readonly ["Step"];
        readonly doc: "Amount the value changes with an arrow key.";
        readonly docFr: "Pas de variation avec une touche fléchée.";
        readonly to: {
            readonly prop: "step";
        };
    }, {
        readonly name: "ShowValue";
        readonly kind: "Bool";
        readonly default: "false";
        readonly category: "Appearance";
        readonly webOnly: true;
        readonly doc: "Web only: always shows the value bubble, not only while dragging.";
        readonly docFr: "Web uniquement : affiche toujours la bulle de valeur, pas seulement pendant le glissement.";
        readonly to: {
            readonly prop: "showValue";
        };
    }];
    readonly events: readonly [{
        readonly name: "OnValueChanged";
        readonly category: "Action";
        readonly args: "ValueChangedEventArgs";
        readonly doc: "Occurs when the value changes.";
        readonly docFr: "Se produit quand la valeur change.";
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
    };
    readonly designDefaults: {
        readonly size: readonly [200, 24];
    };
    readonly web: {
        readonly module: "@ui";
        readonly export: "RangeSlider";
        readonly domRoot: "wrapper";
    };
};
export declare const NumericFieldMeta: {
    readonly name: "NumericField";
    readonly doc: "A number box with up and down buttons.";
    readonly docFr: "Champ numérique avec des boutons haut et bas.";
    readonly family: "choice";
    readonly baseChain: readonly ["NumericField", "RangeBase", "Control", "Component"];
    readonly children: "None";
    readonly defaultEvent: "OnValueChanged";
    readonly properties: readonly [{
        readonly name: "FieldClass";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Appearance";
        readonly webOnly: true;
        readonly doc: "Web only: style classes of the text box itself (Class styles the whole control, label included).";
        readonly docFr: "Web uniquement : classes de style de la zone de saisie elle-même (Class s'applique au contrôle entier, libellé compris).";
        readonly to: {
            readonly prop: "className";
        };
    }, {
        readonly name: "Minimum";
        readonly kind: "F32";
        readonly default: "0";
        readonly category: "Data";
        readonly aliases: readonly ["Min"];
        readonly doc: "Lowest value.";
        readonly docFr: "Valeur minimale.";
        readonly to: {
            readonly prop: "min";
        };
    }, {
        readonly name: "Maximum";
        readonly kind: "F32";
        readonly default: "100";
        readonly category: "Data";
        readonly aliases: readonly ["Max"];
        readonly doc: "Highest value.";
        readonly docFr: "Valeur maximale.";
        readonly to: {
            readonly prop: "max";
        };
    }, {
        readonly name: "Value";
        readonly kind: "F32";
        readonly default: "0";
        readonly category: "Data";
        readonly doc: "Current value, between Minimum and Maximum.";
        readonly docFr: "Valeur actuelle, entre Minimum et Maximum.";
        readonly to: {
            readonly prop: "value";
            readonly change: "OnValueChanged";
        };
    }, {
        readonly name: "Increment";
        readonly kind: "F32";
        readonly default: "1";
        readonly category: "Misc";
        readonly aliases: readonly ["Step"];
        readonly doc: "Amount added or removed by the up and down buttons.";
        readonly docFr: "Valeur ajoutée ou retirée par les boutons haut et bas.";
        readonly to: {
            readonly prop: "step";
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
        readonly doc: "Occurs when the value changes.";
        readonly docFr: "Se produit quand la valeur change.";
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
        readonly export: "NumberInput";
        readonly domRoot: "wrapper";
    };
};
