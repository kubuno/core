import type { PropertyMeta } from './types.ts';
export declare const ListBoxMeta: {
    readonly name: "ListBox";
    readonly doc: "A list of items. Add the items as Item children or bind ItemsSource. Arrow keys, Home / End, Page Up / Page Down and type-ahead move the selection; long lists are virtualised.";
    readonly docFr: "Liste d'éléments. Ajoutez les éléments comme éléments Item enfants, ou liez ItemsSource.";
    readonly family: "data";
    readonly baseChain: readonly ["ListBox", "ListControl", "Control", "Component"];
    readonly children: "List";
    readonly allowedChildren: readonly ["Item"];
    readonly defaultEvent: "OnSelectionChanged";
    readonly properties: readonly [{
        readonly name: "SelectionMode";
        readonly kind: {
            readonly Enum: readonly ["None", "One", "MultiSimple", "MultiExtended"];
        };
        readonly default: "One";
        readonly category: "Misc";
        readonly doc: "How many items can be selected, and how Ctrl and Shift combine with a click.";
        readonly docFr: "Nombre d'éléments sélectionnables, et effet de Ctrl et Maj avec un clic.";
        readonly to: {
            readonly prop: "selectionMode";
            readonly values: {
                readonly None: "None";
                readonly One: "One";
                readonly MultiSimple: "MultiSimple";
                readonly MultiExtended: "MultiExtended";
            };
        };
    }, {
        readonly name: "SelectedIndex";
        readonly kind: "F32";
        readonly default: "-1";
        readonly category: "Data";
        readonly doc: "Index of the selected item, starting at 0. -1 means none.";
        readonly docFr: "Index de l'élément sélectionné, à partir de 0. -1 signifie aucun.";
        readonly to: {
            readonly prop: "selectedIndex";
            readonly change: "OnSelectionChanged";
        };
    }, {
        readonly to: {
            readonly prop: "source";
            readonly convert: "items-source";
        };
        readonly doc: "Binding to the list of items to show, instead of Item children (each row's Text, or its DisplayMember field).";
        readonly docFr: "Liaison vers la liste des éléments à afficher, à la place des éléments Item.";
        readonly name: "ItemsSource";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Data";
    }, {
        readonly name: "ItemHeight";
        readonly kind: "F32";
        readonly default: "0";
        readonly category: "Behavior";
        readonly doc: "Height of a row, in pixels; 0 for the standard height.";
        readonly docFr: "Hauteur d'une ligne, en DIP (avec DrawMode OwnerDrawFixed : la hauteur dans laquelle dessine le gestionnaire DrawItem) ; 0 pour la hauteur standard.";
        readonly to: {
            readonly prop: "itemHeight";
        };
    }, PropertyMeta<never>, PropertyMeta<never>, {
        readonly name: "SelectedValue";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Data";
        readonly bindable: true;
        readonly webOnly: true;
        readonly doc: "Web only: value of the selected item (its Value, or ValueMember field of a bound row; else its text). Empty when none is selected.";
        readonly docFr: "Web uniquement : valeur de l'élément sélectionné (sa Value, ou le champ ValueMember d'une ligne liée ; sinon son texte). Vide quand aucun n'est sélectionné.";
        readonly to: {
            readonly prop: "selectedValue";
            readonly change: "OnSelectedValueChanged";
        };
    }];
    readonly events: readonly [{
        readonly name: "OnSelectionChanged";
        readonly category: "Behavior";
        readonly args: "ValueChangedEventArgs";
        readonly doc: "Occurs when the selection changes. The value is the selected index (-1: none).";
        readonly docFr: "Se produit quand la sélection change.";
        readonly from: {
            readonly prop: "onSelectionChange";
            readonly args: "value";
        };
    }, {
        readonly name: "OnSelectedValueChanged";
        readonly category: "Property Changed";
        readonly args: "ValueChangedEventArgs";
        readonly doc: "Web only: occurs when another item is selected; the value is its SelectedValue.";
        readonly docFr: "Web uniquement : se produit quand un autre élément est sélectionné ; la valeur est sa SelectedValue.";
        readonly from: {
            readonly prop: "onSelectedValueChange";
            readonly args: "value";
        };
    }, {
        readonly doc: "Web only: occurs when an item is double-clicked, or Enter is pressed on it.";
        readonly docFr: "Web uniquement : se produit quand un élément est double-cliqué, ou quand on appuie sur Entrée dessus.";
        readonly name: "OnItemActivate";
        readonly category: "Action";
        readonly args: "ItemActivateEventArgs";
        readonly aliases: readonly ["OnActivate"];
        readonly from: {
            readonly prop: "onItemActivate";
            readonly args: "row";
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
        readonly Height: {
            readonly prop: "height";
        };
        readonly Class: {
            readonly prop: "className";
        };
    };
    readonly designDefaults: {
        readonly size: readonly [200, 160];
    };
    readonly web: {
        readonly module: "@ui";
        readonly export: "ListBox";
        readonly domRoot: "ref";
        readonly childrenToProp: {
            readonly prop: "items";
            readonly item: "Item";
            readonly content: "none";
            readonly nested: "items";
            readonly key: "key";
        };
    };
};
export declare const CheckedListBoxMeta: {
    readonly name: "CheckedListBox";
    readonly doc: "A list of items, each with a check box. Space or a click on the box checks an item.";
    readonly docFr: "Liste d'éléments, chacun avec une case à cocher.";
    readonly family: "data";
    readonly baseChain: readonly ["CheckedListBox", "ListControl", "Control", "Component"];
    readonly children: "List";
    readonly allowedChildren: readonly ["Item"];
    readonly defaultEvent: "OnSelectionChanged";
    readonly properties: readonly [{
        readonly name: "SelectedIndex";
        readonly kind: "F32";
        readonly default: "-1";
        readonly category: "Data";
        readonly doc: "Index of the selected item, starting at 0. -1 means none.";
        readonly docFr: "Index de l'élément sélectionné, à partir de 0. -1 signifie aucun.";
        readonly to: {
            readonly prop: "selectedIndex";
            readonly change: "OnSelectionChanged";
        };
    }, {
        readonly name: "CheckOnClick";
        readonly kind: "Bool";
        readonly default: "false";
        readonly category: "Behavior";
        readonly doc: "Checks or unchecks an item with a single click anywhere on it.";
        readonly docFr: "Coche ou décoche un élément d'un simple clic n'importe où dessus.";
        readonly to: {
            readonly prop: "checkOnClick";
        };
    }, {
        readonly to: {
            readonly prop: "source";
            readonly convert: "items-source";
        };
        readonly doc: "Binding to the list of items to show, instead of Item children (each row's Text, or its DisplayMember field).";
        readonly docFr: "Liaison vers la liste des éléments à afficher, à la place des éléments Item.";
        readonly name: "ItemsSource";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Data";
    }, PropertyMeta<never>, PropertyMeta<never>, {
        readonly webOnly: true;
        readonly doc: "Web only: height of a row, in pixels; 0 for the standard height.";
        readonly docFr: "Web uniquement : hauteur d'une ligne, en pixels ; 0 pour la hauteur standard.";
        readonly name: "ItemHeight";
        readonly kind: "F32";
        readonly default: "0";
        readonly category: "Behavior";
        readonly to: {
            readonly prop: "itemHeight";
        };
    }];
    readonly events: readonly [{
        readonly doc: "Occurs when the selected item changes. The value is its index (-1: none).";
        readonly docFr: "Se produit quand l'élément sélectionné change.";
        readonly name: "OnSelectionChanged";
        readonly category: "Behavior";
        readonly args: "ValueChangedEventArgs";
        readonly from: {
            readonly prop: "onSelectionChange";
            readonly args: "value";
        };
    }, {
        readonly name: "OnCheckedChanged";
        readonly category: "Behavior";
        readonly args: "ItemCheckEventArgs";
        readonly doc: "Occurs when an item is checked or unchecked (e.index, e.checked).";
        readonly docFr: "Se produit quand un élément est coché ou décoché.";
        readonly from: {
            readonly prop: "onItemCheck";
            readonly args: "item-check";
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
        readonly Height: {
            readonly prop: "height";
        };
        readonly Class: {
            readonly prop: "className";
        };
    };
    readonly designDefaults: {
        readonly size: readonly [200, 160];
    };
    readonly web: {
        readonly module: "@ui";
        readonly export: "CheckedListBox";
        readonly domRoot: "ref";
        readonly childrenToProp: {
            readonly prop: "items";
            readonly item: "Item";
            readonly content: "none";
            readonly nested: "items";
            readonly key: "key";
        };
    };
};
export declare const ListViewMeta: {
    readonly name: "ListView";
    readonly doc: "A list of items in columns. Declare the columns as Column children; the rows are Item children (their Item children fill the next columns) or ItemsSource (each column shows the field its Binding names). On the web, View also shows the items as a list or as tiles.";
    readonly docFr: "Liste d'éléments en colonnes. Déclarez les colonnes comme éléments Column enfants.";
    readonly family: "data";
    readonly baseChain: readonly ["ListView", "Control", "Component"];
    readonly children: "List";
    readonly allowedChildren: readonly ["Item", "Column"];
    readonly defaultEvent: "OnSelectionChanged";
    readonly properties: readonly [{
        readonly doc: "Index of the selected item, starting at 0. -1 means none.";
        readonly name: "SelectedIndex";
        readonly kind: "F32";
        readonly default: "-1";
        readonly category: "Data";
        readonly docFr: "Index de l'élément sélectionné, à partir de 0. -1 signifie aucun.";
        readonly to: {
            readonly prop: "selectedIndex";
            readonly change: "OnSelectionChanged";
        };
    }, {
        readonly name: "MultiSelect";
        readonly kind: "Bool";
        readonly default: "false";
        readonly category: "Behavior";
        readonly doc: "Allows several items to be selected (Ctrl and Shift).";
        readonly docFr: "Permet de sélectionner plusieurs éléments.";
        readonly to: {
            readonly prop: "multiSelect";
        };
    }, {
        readonly name: "ItemsSource";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Data";
        readonly doc: "Binding to the list of rows to show. Each column shows the field named by its Binding.";
        readonly docFr: "Liaison vers la liste des lignes à afficher. Chaque colonne affiche le champ nommé par sa Binding.";
        readonly to: {
            readonly prop: "rows";
            readonly convert: "items-source";
        };
    }, {
        readonly name: "View";
        readonly kind: {
            readonly Enum: readonly ["Details", "List", "LargeIcon"];
        };
        readonly default: "Details";
        readonly category: "Appearance";
        readonly webOnly: true;
        readonly doc: "Web only: Details (rows in columns), List (the items' texts) or LargeIcon (tiles with the items' icons).";
        readonly docFr: "Web uniquement : Details (lignes en colonnes), List (les textes des éléments) ou LargeIcon (des tuiles avec les icônes des éléments).";
        readonly to: {
            readonly prop: "view";
            readonly values: {
                readonly Details: "Details";
                readonly List: "List";
                readonly LargeIcon: "LargeIcon";
            };
        };
    }, {
        readonly webOnly: true;
        readonly doc: "Web only: height of a row, in pixels; 0 for the standard height.";
        readonly docFr: "Web uniquement : hauteur d'une ligne, en pixels ; 0 pour la hauteur standard.";
        readonly name: "ItemHeight";
        readonly kind: "F32";
        readonly default: "0";
        readonly category: "Behavior";
        readonly to: {
            readonly prop: "itemHeight";
        };
    }];
    readonly events: readonly [{
        readonly name: "OnSelectionChanged";
        readonly category: "Behavior";
        readonly args: "ValueChangedEventArgs";
        readonly doc: "Occurs when the selection changes. The value is the selected index (-1: none).";
        readonly docFr: "Se produit quand la sélection change.";
        readonly from: {
            readonly prop: "onSelectionChange";
            readonly args: "value";
        };
    }, {
        readonly name: "OnItemActivate";
        readonly category: "Action";
        readonly args: "ItemActivateEventArgs";
        readonly aliases: readonly ["OnActivate"];
        readonly doc: "Occurs when an item is double-clicked, or Enter is pressed on it.";
        readonly docFr: "Se produit quand un élément est double-cliqué.";
        readonly from: {
            readonly prop: "onItemActivate";
            readonly args: "row";
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
        readonly Height: {
            readonly prop: "height";
        };
        readonly Class: {
            readonly prop: "className";
        };
    };
    readonly designDefaults: {
        readonly size: readonly [360, 200];
    };
    readonly web: {
        readonly module: "@ui";
        readonly export: "ListView";
        readonly domRoot: "ref";
        readonly childrenToProp: {
            readonly prop: "entries";
            readonly item: readonly ["Item", "Column"];
            readonly content: "none";
            readonly nested: "items";
            readonly key: "key";
        };
    };
};
export declare const TreeViewMeta: {
    readonly name: "TreeView";
    readonly doc: "A tree of items that can be expanded. Add the items as nested Item children, or bind ItemsSource (a row's Items field nests).";
    readonly docFr: "Arborescence d'éléments qui se développent. Ajoutez les éléments comme éléments Item imbriqués.";
    readonly family: "data";
    readonly baseChain: readonly ["TreeView", "Control", "Component"];
    readonly children: "List";
    readonly allowedChildren: readonly ["Item"];
    readonly defaultEvent: "OnSelectionChanged";
    readonly properties: readonly [{
        readonly name: "SelectedPath";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Data";
        readonly doc: "Selected item, as indexes separated by dots, for example 0.2.1. Empty means none.";
        readonly docFr: "Élément sélectionné, sous forme d'index séparés par des points, par exemple 0.2.1. Vide signifie aucun.";
        readonly to: {
            readonly prop: "selectedPath";
            readonly change: "OnSelectionChanged";
        };
    }, {
        readonly name: "MultiSelect";
        readonly kind: "Bool";
        readonly default: "false";
        readonly category: "Behavior";
        readonly doc: "Allows several items to be selected (Ctrl and Shift).";
        readonly docFr: "Permet de sélectionner plusieurs éléments.";
        readonly to: {
            readonly prop: "multiSelect";
        };
    }, {
        readonly name: "ItemsSource";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Data";
        readonly doc: "Binding to the items to show, instead of Item children (a row's Items or Children list makes its sub-tree on the web).";
        readonly docFr: "Liaison vers une liste simple d'éléments à afficher, à la place des éléments Item.";
        readonly to: {
            readonly prop: "source";
            readonly convert: "items-source";
        };
    }, {
        readonly name: "ItemHeight";
        readonly kind: "F32";
        readonly default: "0";
        readonly category: "Appearance";
        readonly doc: "Height of a row, in pixels; 0 for the standard height.";
        readonly docFr: "Hauteur d'une ligne, en DIP ; 0 pour la hauteur standard.";
        readonly to: {
            readonly prop: "itemHeight";
        };
    }];
    readonly events: readonly [{
        readonly doc: "Occurs when the selected item changes. The value is its SelectedPath.";
        readonly docFr: "Se produit quand l'élément sélectionné change.";
        readonly name: "OnSelectionChanged";
        readonly category: "Behavior";
        readonly args: "ValueChangedEventArgs";
        readonly from: {
            readonly prop: "onSelectionChange";
            readonly args: "value";
        };
    }, {
        readonly name: "OnItemActivate";
        readonly category: "Action";
        readonly args: "ItemActivateEventArgs";
        readonly aliases: readonly ["OnActivate"];
        readonly doc: "Occurs when an item is double-clicked, or Enter is pressed on it.";
        readonly docFr: "Se produit quand un élément est double-cliqué.";
        readonly from: {
            readonly prop: "onItemActivate";
            readonly args: "row";
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
        readonly Height: {
            readonly prop: "height";
        };
        readonly Class: {
            readonly prop: "className";
        };
    };
    readonly designDefaults: {
        readonly size: readonly [240, 240];
    };
    readonly web: {
        readonly module: "@ui";
        readonly export: "TreeView";
        readonly domRoot: "ref";
        readonly childrenToProp: {
            readonly prop: "items";
            readonly item: "Item";
            readonly content: "none";
            readonly nested: "items";
            readonly key: "key";
        };
    };
};
export declare const ItemMeta: {
    readonly name: "Item";
    readonly doc: "An item of a ListBox, CheckedListBox, ListView or TreeView. Item children make a sub-tree (TreeView) or the next columns' cells (ListView).";
    readonly docFr: "Élément d'une ListBox, d'une CheckedListBox, d'une ListView ou d'une TreeView.";
    readonly family: "data";
    readonly baseChain: readonly ["Item", "Component"];
    readonly children: "List";
    readonly allowedChildren: readonly ["Item"];
    readonly defaultEvent: null;
    readonly properties: readonly [{
        readonly name: "Text";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Appearance";
        readonly doc: "Text of the item.";
        readonly docFr: "Texte de l'élément.";
        readonly to: {
            readonly prop: "text";
        };
    }, {
        readonly name: "Value";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Data";
        readonly webOnly: true;
        readonly doc: "Web only: value of the item (SelectedValue); its text when empty.";
        readonly docFr: "Web uniquement : valeur de l'élément (SelectedValue) ; son texte quand elle est vide.";
        readonly to: {
            readonly prop: "value";
        };
    }, {
        readonly name: "Icon";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Icon";
        readonly editor: "icon";
        readonly webOnly: true;
        readonly doc: "Web only: icon shown before the text (a name of the Kubuno icon set).";
        readonly docFr: "Web uniquement : icône affichée avant le texte (un nom du jeu d'icônes Kubuno).";
        readonly to: {
            readonly prop: "icon";
            readonly convert: "icon-component";
        };
    }, {
        readonly name: "Checked";
        readonly kind: "Bool";
        readonly default: "false";
        readonly category: "Appearance";
        readonly bindable: true;
        readonly webOnly: true;
        readonly doc: "Web only: the item is checked (CheckedListBox). A two-way binding follows the user's clicks.";
        readonly docFr: "Web uniquement : l'élément est coché (CheckedListBox). Une liaison bidirectionnelle suit les clics de l'utilisateur.";
        readonly to: {
            readonly prop: "checked";
            readonly change: "OnCheckedChanged";
        };
    }, {
        readonly name: "Expanded";
        readonly kind: "Bool";
        readonly default: "false";
        readonly category: "Behavior";
        readonly webOnly: true;
        readonly doc: "Web only: the item shows its children at first (TreeView).";
        readonly docFr: "Web uniquement : l'élément montre ses enfants au départ (TreeView).";
        readonly to: {
            readonly prop: "expanded";
        };
    }];
    readonly events: readonly [{
        readonly name: "OnCheckedChanged";
        readonly category: "Behavior";
        readonly args: "ItemCheckEventArgs";
        readonly doc: "Web only: occurs when the user checks or unchecks this item of a CheckedListBox.";
        readonly docFr: "Web uniquement : se produit quand l'utilisateur coche ou décoche cet élément d'une CheckedListBox.";
        readonly from: {
            readonly runtime: "parent-adapter";
            readonly args: "item-check";
        };
    }];
    readonly web: {
        readonly module: null;
        readonly export: null;
        readonly domRoot: "none";
        readonly itemOf: readonly ["ListBox", "CheckedListBox", "ListView", "TreeView", "Item"];
    };
};
