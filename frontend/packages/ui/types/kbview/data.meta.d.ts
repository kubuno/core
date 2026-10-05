export declare const DataTableMeta: {
    readonly name: "DataTable";
    readonly doc: "A data table with sortable columns and pages. Declare the columns as Column children.";
    readonly docFr: "Tableau de données avec colonnes triables et pagination. Déclarez les colonnes comme éléments Column enfants.";
    readonly family: "data";
    readonly baseChain: readonly ["DataTable", "Control", "Component"];
    readonly children: "List";
    readonly allowedChildren: readonly ["Column"];
    readonly defaultEvent: null;
    readonly properties: readonly [{
        readonly name: "ItemsSource";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Data";
        readonly doc: "Binding to the list of rows to show. Each column shows the field named by its Binding.";
        readonly docFr: "Liaison vers la liste des lignes à afficher. Chaque colonne affiche le champ nommé par sa Binding.";
        readonly to: {
            readonly prop: "rows";
        };
    }, {
        readonly name: "PageSize";
        readonly kind: "F32";
        readonly default: "0";
        readonly category: "Paging";
        readonly bindable: true;
        readonly doc: "Number of rows per page. 0 shows every row without a pager.";
        readonly docFr: "Nombre de lignes par page. 0 affiche toutes les lignes sans pagination.";
        readonly to: {
            readonly prop: "pageSize";
        };
    }, {
        readonly name: "PageIndex";
        readonly kind: "F32";
        readonly default: "0";
        readonly category: "Paging";
        readonly bindable: true;
        readonly doc: "Page shown, starting at 0. A two-way binding follows the pager.";
        readonly docFr: "Page affichée, à partir de 0. Une liaison bidirectionnelle suit la pagination.";
        readonly to: {
            readonly prop: "page";
            readonly change: "OnPageChanged";
        };
    }, {
        readonly name: "TotalRows";
        readonly kind: "F32";
        readonly default: "-1";
        readonly category: "Paging";
        readonly bindable: true;
        readonly doc: "Total number of rows when you fetch one page at a time: ItemsSource then holds only the page shown. -1 pages the rows itself.";
        readonly docFr: "Nombre total de lignes quand vous chargez une page à la fois : ItemsSource ne contient alors que la page affichée. -1 pagine les lignes lui-même.";
        readonly to: {
            readonly prop: "totalRows";
        };
    }, {
        readonly name: "Loading";
        readonly kind: "Bool";
        readonly default: "false";
        readonly category: "Behavior";
        readonly bindable: true;
        readonly doc: "Shows placeholder rows while the data is loading.";
        readonly docFr: "Affiche des lignes d'attente pendant le chargement des données.";
        readonly to: {
            readonly prop: "loading";
        };
    }, {
        readonly name: "ErrorText";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Behavior";
        readonly bindable: true;
        readonly doc: "When not empty, the table shows an error with this description instead of its rows.";
        readonly docFr: "Si non vide, le tableau affiche une erreur avec cette description au lieu de ses lignes.";
        readonly to: {
            readonly prop: "error";
        };
    }, {
        readonly name: "SortColumn";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Behavior";
        readonly bindable: true;
        readonly doc: "Field of the column the rows are sorted by.";
        readonly docFr: "Champ de la colonne selon laquelle les lignes sont triées.";
        readonly to: {
            readonly prop: "sort";
            readonly field: "columnId";
        };
    }, {
        readonly name: "SortOrder";
        readonly kind: {
            readonly Enum: readonly ["None", "Ascending", "Descending"];
        };
        readonly default: "None";
        readonly category: "Behavior";
        readonly bindable: true;
        readonly doc: "Direction of the sort.";
        readonly docFr: "Sens du tri.";
        readonly to: {
            readonly prop: "sort";
            readonly field: "direction";
            readonly values: {
                readonly None: null;
                readonly Ascending: "asc";
                readonly Descending: "desc";
            };
        };
    }, {
        readonly name: "Title";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Appearance";
        readonly localizable: true;
        readonly webOnly: true;
        readonly doc: "Web only: title shown above the table, in its toolbar.";
        readonly docFr: "Web uniquement : titre affiché au-dessus du tableau, dans sa barre d'outils.";
        readonly to: {
            readonly prop: "title";
        };
    }, {
        readonly name: "Selectable";
        readonly kind: "Bool";
        readonly default: "false";
        readonly category: "Behavior";
        readonly webOnly: true;
        readonly doc: "Web only: adds a check box per row for selecting several rows.";
        readonly docFr: "Web uniquement : ajoute une case à cocher par ligne pour sélectionner plusieurs lignes.";
        readonly to: {
            readonly prop: "selectable";
        };
    }];
    readonly events: readonly [{
        readonly name: "OnSortChanged";
        readonly category: "Behavior";
        readonly args: "ValueChangedEventArgs";
        readonly doc: "Occurs when a column header is clicked to sort the table.";
        readonly docFr: "Se produit quand un en-tête de colonne est cliqué pour trier le tableau.";
        readonly from: {
            readonly prop: "onSortChange";
            readonly args: "sort";
        };
    }, {
        readonly name: "OnPageChanged";
        readonly category: "Behavior";
        readonly args: "ValueChangedEventArgs";
        readonly doc: "Occurs when the user moves to another page. The value is the new page, starting at 0.";
        readonly docFr: "Se produit quand l'utilisateur passe à une autre page. La valeur est la nouvelle page, à partir de 0.";
        readonly from: {
            readonly prop: "onPageChange";
            readonly args: "value";
        };
    }];
    readonly designDefaults: {
        readonly size: readonly [480, 240];
    };
    readonly web: {
        readonly module: "@ui";
        readonly export: "DataTable";
        readonly domRoot: "wrapper";
        readonly childrenToProp: {
            readonly prop: "columns";
            readonly item: "Column";
            readonly content: "none";
            readonly key: "id";
        };
    };
};
export declare const ColumnMeta: {
    readonly name: "Column";
    readonly doc: "A column of a ListView or DataTable.";
    readonly docFr: "Colonne d'une ListView ou d'une DataTable.";
    readonly family: "data";
    readonly baseChain: readonly ["Column", "Component"];
    readonly children: "None";
    readonly defaultEvent: null;
    readonly properties: readonly [{
        readonly name: "Header";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Appearance";
        readonly doc: "Text of the column header.";
        readonly docFr: "Texte de l'en-tête de colonne.";
        readonly to: {
            readonly prop: "header";
        };
    }, {
        readonly name: "Binding";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Data";
        readonly doc: "Field of each row shown in this column, for example {Binding Name}.";
        readonly docFr: "Champ de chaque ligne affiché dans cette colonne, par exemple {Binding Name}.";
        readonly to: {
            readonly prop: "cell";
            readonly convert: "binding-cell";
        };
    }, {
        readonly name: "Width";
        readonly kind: "F32";
        readonly default: "160";
        readonly category: "Layout";
        readonly doc: "Width of the column, in pixels.";
        readonly docFr: "Largeur de la colonne, en pixels.";
        readonly to: {
            readonly prop: "width";
        };
    }, {
        readonly name: "FormatString";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Appearance";
        readonly doc: "Format of the values shown in this column, for example N2 for a number with two decimals or d for a short date. Empty shows the values as they are.";
        readonly docFr: "Format des valeurs affichées dans cette colonne, par exemple N2 pour un nombre à deux décimales ou d pour une date courte. Vide affiche les valeurs telles quelles.";
        readonly to: {
            readonly runtime: "item-state";
        };
    }, {
        readonly name: "Culture";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Appearance";
        readonly doc: "Culture used to format and read the values of this column, for example fr-FR. Empty uses the table's culture.";
        readonly docFr: "Culture utilisée pour mettre en forme et relire les valeurs de cette colonne, par exemple fr-FR. Vide utilise la culture du tableau.";
        readonly to: {
            readonly runtime: "item-state";
        };
    }, {
        readonly name: "NullValue";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Appearance";
        readonly doc: "Text shown for an empty value. Typing it writes an empty value back.";
        readonly docFr: "Texte affiché pour une valeur vide. Le saisir réécrit une valeur vide.";
        readonly to: {
            readonly runtime: "item-state";
        };
    }, {
        readonly name: "Alignment";
        readonly kind: {
            readonly Enum: readonly ["Left", "Center", "Right"];
        };
        readonly default: "Left";
        readonly category: "Appearance";
        readonly doc: "Horizontal alignment of the values in this column.";
        readonly docFr: "Alignement horizontal des valeurs de cette colonne.";
        readonly to: {
            readonly prop: "align";
            readonly values: {
                readonly Left: "left";
                readonly Center: "center";
                readonly Right: "right";
            };
        };
    }];
    readonly events: readonly [];
    readonly web: {
        readonly module: null;
        readonly export: null;
        readonly domRoot: "none";
        readonly itemOf: readonly ["DataTable"];
    };
};
