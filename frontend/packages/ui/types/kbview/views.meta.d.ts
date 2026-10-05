import type { PropertyMeta } from './types.ts';
export declare const UserControlMeta: {
    readonly name: "UserControl";
    readonly doc: "The root of a user control (.kbcontrol): a composite control designed as a view and used as an element of other views. Its children are docked like a Panel's.";
    readonly docFr: "Racine d'un contrôle utilisateur (.kbcontrol) : un contrôle composite conçu comme une vue et utilisé comme élément d'autres vues. Ses enfants sont ancrés comme ceux d'un Panel.";
    readonly family: "containers";
    readonly baseChain: readonly ["UserControl", "ContainerControl", "ScrollableControl", "Control", "Component"];
    readonly children: "List";
    readonly layoutKind: "DockAnchor";
    readonly defaultEvent: "OnClick";
    readonly properties: readonly [PropertyMeta<{
        surface?: "None" | "Layer" | "Card" | "Raised" | "Well";
    }>, PropertyMeta<{
        layout?: "Dock" | "Absolute";
    }>];
    readonly events: readonly [];
    readonly inheritedMap: {
        readonly Enabled: {
            readonly prop: "disabled";
            readonly convert: "invert";
        };
        readonly AccessibleName: {
            readonly prop: "aria-label";
        };
        readonly AccessibleRole: {
            readonly prop: "role";
            readonly values: {
                readonly Default: "";
                readonly None: "none";
                readonly TitleBar: "banner";
                readonly MenuBar: "menubar";
                readonly ScrollBar: "scrollbar";
                readonly Grip: "separator";
                readonly Sound: "none";
                readonly Cursor: "none";
                readonly Caret: "none";
                readonly Alert: "alert";
                readonly Window: "dialog";
                readonly Client: "region";
                readonly MenuPopup: "menu";
                readonly MenuItem: "menuitem";
                readonly ToolTip: "tooltip";
                readonly Application: "application";
                readonly Document: "document";
                readonly Pane: "region";
                readonly Chart: "img";
                readonly Dialog: "dialog";
                readonly Border: "none";
                readonly Grouping: "group";
                readonly Separator: "separator";
                readonly ToolBar: "toolbar";
                readonly StatusBar: "status";
                readonly Table: "table";
                readonly ColumnHeader: "columnheader";
                readonly RowHeader: "rowheader";
                readonly Column: "gridcell";
                readonly Row: "row";
                readonly Cell: "cell";
                readonly Link: "link";
                readonly HelpBalloon: "tooltip";
                readonly Character: "none";
                readonly List: "list";
                readonly ListItem: "listitem";
                readonly Outline: "tree";
                readonly OutlineItem: "treeitem";
                readonly PageTab: "tab";
                readonly PropertyPage: "tabpanel";
                readonly Indicator: "img";
                readonly Graphic: "img";
                readonly StaticText: "note";
                readonly Text: "textbox";
                readonly PushButton: "button";
                readonly CheckButton: "checkbox";
                readonly RadioButton: "radio";
                readonly ComboBox: "combobox";
                readonly DropList: "listbox";
                readonly ProgressBar: "progressbar";
                readonly Dial: "slider";
                readonly HotkeyField: "textbox";
                readonly Slider: "slider";
                readonly SpinButton: "spinbutton";
                readonly Diagram: "img";
                readonly Animation: "img";
                readonly Equation: "math";
                readonly ButtonDropDown: "button";
                readonly ButtonMenu: "button";
                readonly ButtonDropDownGrid: "button";
                readonly WhiteSpace: "none";
                readonly PageTabList: "tablist";
                readonly Clock: "timer";
                readonly SplitButton: "button";
                readonly IpAddress: "textbox";
                readonly OutlineButton: "button";
            };
        };
        readonly TabIndex: {
            readonly prop: "tabIndex";
        };
        readonly Class: {
            readonly prop: "className";
        };
        readonly CornerRadius: {
            readonly prop: "cornerRadius";
        };
    };
    readonly designDefaults: {
        readonly size: readonly [320, 240];
    };
    readonly web: {
        readonly module: "@kubuno/views";
        readonly export: "UserControl";
        readonly domRoot: "ref";
        readonly content: "children";
    };
};
export declare const PanelMeta: {
    readonly name: "Panel";
    readonly doc: "A container whose children are docked as bands (Dock: Top, Bottom, Left, Right, then Fill takes the rest), or placed by X and Y with Layout=\"Absolute\".";
    readonly docFr: "Conteneur dont les enfants sont ancrés en bandes (Dock : Top, Bottom, Left, Right, puis Fill prend le reste), ou placés par X et Y avec Layout=\"Absolute\".";
    readonly family: "containers";
    readonly baseChain: readonly ["Panel", "ContainerBase", "ScrollableControl", "Control", "Component"];
    readonly children: "List";
    readonly layoutKind: "DockAnchor";
    readonly defaultEvent: "OnClick";
    readonly properties: readonly [PropertyMeta<{
        surface?: "None" | "Layer" | "Card" | "Raised" | "Well";
    }>, PropertyMeta<{
        layout?: "Dock" | "Absolute";
    }>, PropertyMeta<{
        href?: string;
    }>, PropertyMeta<{
        dividerColor?: string;
    }>];
    readonly events: readonly [];
    readonly inheritedMap: {
        readonly Enabled: {
            readonly prop: "disabled";
            readonly convert: "invert";
        };
        readonly AccessibleName: {
            readonly prop: "aria-label";
        };
        readonly AccessibleRole: {
            readonly prop: "role";
            readonly values: {
                readonly Default: "";
                readonly None: "none";
                readonly TitleBar: "banner";
                readonly MenuBar: "menubar";
                readonly ScrollBar: "scrollbar";
                readonly Grip: "separator";
                readonly Sound: "none";
                readonly Cursor: "none";
                readonly Caret: "none";
                readonly Alert: "alert";
                readonly Window: "dialog";
                readonly Client: "region";
                readonly MenuPopup: "menu";
                readonly MenuItem: "menuitem";
                readonly ToolTip: "tooltip";
                readonly Application: "application";
                readonly Document: "document";
                readonly Pane: "region";
                readonly Chart: "img";
                readonly Dialog: "dialog";
                readonly Border: "none";
                readonly Grouping: "group";
                readonly Separator: "separator";
                readonly ToolBar: "toolbar";
                readonly StatusBar: "status";
                readonly Table: "table";
                readonly ColumnHeader: "columnheader";
                readonly RowHeader: "rowheader";
                readonly Column: "gridcell";
                readonly Row: "row";
                readonly Cell: "cell";
                readonly Link: "link";
                readonly HelpBalloon: "tooltip";
                readonly Character: "none";
                readonly List: "list";
                readonly ListItem: "listitem";
                readonly Outline: "tree";
                readonly OutlineItem: "treeitem";
                readonly PageTab: "tab";
                readonly PropertyPage: "tabpanel";
                readonly Indicator: "img";
                readonly Graphic: "img";
                readonly StaticText: "note";
                readonly Text: "textbox";
                readonly PushButton: "button";
                readonly CheckButton: "checkbox";
                readonly RadioButton: "radio";
                readonly ComboBox: "combobox";
                readonly DropList: "listbox";
                readonly ProgressBar: "progressbar";
                readonly Dial: "slider";
                readonly HotkeyField: "textbox";
                readonly Slider: "slider";
                readonly SpinButton: "spinbutton";
                readonly Diagram: "img";
                readonly Animation: "img";
                readonly Equation: "math";
                readonly ButtonDropDown: "button";
                readonly ButtonMenu: "button";
                readonly ButtonDropDownGrid: "button";
                readonly WhiteSpace: "none";
                readonly PageTabList: "tablist";
                readonly Clock: "timer";
                readonly SplitButton: "button";
                readonly IpAddress: "textbox";
                readonly OutlineButton: "button";
            };
        };
        readonly TabIndex: {
            readonly prop: "tabIndex";
        };
        readonly Class: {
            readonly prop: "className";
        };
        readonly CornerRadius: {
            readonly prop: "cornerRadius";
        };
    };
    readonly designDefaults: {
        readonly size: readonly [200, 100];
    };
    readonly web: {
        readonly module: "@kubuno/views";
        readonly export: "Panel";
        readonly domRoot: "ref";
        readonly content: "children";
    };
};
export declare const StackMeta: {
    readonly name: "Stack";
    readonly doc: "Places its children one after the other along a direction, Gap pixels apart; a child with Stack.Fill=\"true\" takes the room left.";
    readonly docFr: "Place ses enfants les uns après les autres dans une direction, espacés de Gap pixels ; un enfant avec Stack.Fill=\"true\" prend la place restante.";
    readonly family: "core";
    readonly baseChain: readonly ["Stack", "ContainerBase", "ScrollableControl", "Control", "Component"];
    readonly children: "List";
    readonly layoutKind: "Flow";
    readonly defaultEvent: "OnClick";
    readonly properties: readonly [{
        readonly name: "Direction";
        readonly kind: {
            readonly Enum: readonly ["LeftToRight", "TopDown", "RightToLeft", "BottomUp"];
        };
        readonly default: "TopDown";
        readonly category: "Layout";
        readonly doc: "Direction in which the children are placed. On the web LeftToRight follows the reading direction (it mirrors in Arabic and Hebrew).";
        readonly docFr: "Sens dans lequel les éléments enfants sont placés.";
        readonly to: {
            readonly prop: "direction";
        };
    }, {
        readonly name: "Gap";
        readonly kind: "F32";
        readonly default: "8";
        readonly category: "Layout";
        readonly doc: "Space between two children, in pixels.";
        readonly docFr: "Espace entre deux éléments enfants, en pixels.";
        readonly to: {
            readonly prop: "gap";
        };
    }, PropertyMeta<{
        surface?: "None" | "Layer" | "Card" | "Raised" | "Well";
    }>, {
        readonly name: "WrapContents";
        readonly kind: "Bool";
        readonly default: "false";
        readonly category: "Layout";
        readonly doc: "Wraps the children onto several lines (or columns) when they do not fit, like a FlowLayoutPanel.";
        readonly docFr: "Renvoie les enfants sur plusieurs lignes (ou colonnes) quand ils ne tiennent pas, comme un FlowLayoutPanel.";
        readonly to: {
            readonly prop: "wrap";
        };
    }, {
        readonly name: "CrossAlign";
        readonly kind: {
            readonly Enum: readonly ["Stretch", "Start", "Center", "End"];
        };
        readonly default: "Stretch";
        readonly category: "Layout";
        readonly doc: "Places the children across the flow: stretched over the line (or column), or at their own size at its start, centre or end.";
        readonly docFr: "Place les enfants en travers du flux : étirés sur la ligne (ou la colonne), ou à leur propre taille au début, au centre ou à la fin.";
        readonly to: {
            readonly prop: "crossAlign";
        };
    }, {
        readonly name: "Justify";
        readonly kind: {
            readonly Enum: readonly ["Start", "Center", "End", "SpaceBetween"];
        };
        readonly default: "Start";
        readonly category: "Layout";
        readonly webOnly: true;
        readonly doc: "Web only: where the children sit along the flow when they leave room: at its start, centred, at its end, or spread with the room between them.";
        readonly docFr: "Web uniquement : place des enfants le long du flux quand ils laissent de la place : au début, centrés, à la fin, ou répartis avec la place entre eux.";
        readonly to: {
            readonly prop: "justify";
        };
    }, PropertyMeta<{
        href?: string;
    }>, PropertyMeta<{
        dividerColor?: string;
    }>];
    readonly events: readonly [];
    readonly inheritedMap: {
        readonly Enabled: {
            readonly prop: "disabled";
            readonly convert: "invert";
        };
        readonly AccessibleName: {
            readonly prop: "aria-label";
        };
        readonly AccessibleRole: {
            readonly prop: "role";
            readonly values: {
                readonly Default: "";
                readonly None: "none";
                readonly TitleBar: "banner";
                readonly MenuBar: "menubar";
                readonly ScrollBar: "scrollbar";
                readonly Grip: "separator";
                readonly Sound: "none";
                readonly Cursor: "none";
                readonly Caret: "none";
                readonly Alert: "alert";
                readonly Window: "dialog";
                readonly Client: "region";
                readonly MenuPopup: "menu";
                readonly MenuItem: "menuitem";
                readonly ToolTip: "tooltip";
                readonly Application: "application";
                readonly Document: "document";
                readonly Pane: "region";
                readonly Chart: "img";
                readonly Dialog: "dialog";
                readonly Border: "none";
                readonly Grouping: "group";
                readonly Separator: "separator";
                readonly ToolBar: "toolbar";
                readonly StatusBar: "status";
                readonly Table: "table";
                readonly ColumnHeader: "columnheader";
                readonly RowHeader: "rowheader";
                readonly Column: "gridcell";
                readonly Row: "row";
                readonly Cell: "cell";
                readonly Link: "link";
                readonly HelpBalloon: "tooltip";
                readonly Character: "none";
                readonly List: "list";
                readonly ListItem: "listitem";
                readonly Outline: "tree";
                readonly OutlineItem: "treeitem";
                readonly PageTab: "tab";
                readonly PropertyPage: "tabpanel";
                readonly Indicator: "img";
                readonly Graphic: "img";
                readonly StaticText: "note";
                readonly Text: "textbox";
                readonly PushButton: "button";
                readonly CheckButton: "checkbox";
                readonly RadioButton: "radio";
                readonly ComboBox: "combobox";
                readonly DropList: "listbox";
                readonly ProgressBar: "progressbar";
                readonly Dial: "slider";
                readonly HotkeyField: "textbox";
                readonly Slider: "slider";
                readonly SpinButton: "spinbutton";
                readonly Diagram: "img";
                readonly Animation: "img";
                readonly Equation: "math";
                readonly ButtonDropDown: "button";
                readonly ButtonMenu: "button";
                readonly ButtonDropDownGrid: "button";
                readonly WhiteSpace: "none";
                readonly PageTabList: "tablist";
                readonly Clock: "timer";
                readonly SplitButton: "button";
                readonly IpAddress: "textbox";
                readonly OutlineButton: "button";
            };
        };
        readonly TabIndex: {
            readonly prop: "tabIndex";
        };
        readonly Class: {
            readonly prop: "className";
        };
        readonly CornerRadius: {
            readonly prop: "cornerRadius";
        };
    };
    readonly designDefaults: {
        readonly size: readonly [200, 100];
    };
    readonly web: {
        readonly module: "@kubuno/views";
        readonly export: "Stack";
        readonly domRoot: "ref";
        readonly content: "children";
    };
};
export declare const ScrollAreaMeta: {
    readonly name: "ScrollArea";
    readonly doc: "Shows its single child in a scrolling viewport.";
    readonly docFr: "Affiche son élément enfant dans une zone qui défile.";
    readonly family: "containers";
    readonly baseChain: readonly ["ScrollArea", "ScrollableControl", "Control", "Component"];
    readonly children: "SingleWidget";
    readonly defaultEvent: "OnClick";
    readonly properties: readonly [{
        readonly name: "Corner";
        readonly kind: "F32";
        readonly default: "0";
        readonly category: "Appearance";
        readonly doc: "Radius of the rounded corners, in pixels. 0 for square corners.";
        readonly docFr: "Rayon des coins arrondis, en pixels. 0 pour des coins carrés.";
        readonly to: {
            readonly prop: "corner";
        };
    }, {
        readonly name: "ScrollBars";
        readonly kind: {
            readonly Enum: readonly ["Vertical", "Horizontal", "Both"];
        };
        readonly default: "Vertical";
        readonly category: "Behavior";
        readonly webOnly: true;
        readonly doc: "Web only: the directions the content scrolls in.";
        readonly docFr: "Web uniquement : les directions dans lesquelles le contenu défile.";
        readonly to: {
            readonly prop: "scrollBars";
            readonly values: {
                readonly Vertical: "Vertical";
                readonly Horizontal: "Horizontal";
                readonly Both: "Both";
            };
        };
    }, {
        readonly name: "ScrollbarGutter";
        readonly kind: {
            readonly Enum: readonly ["Auto", "Stable", "StableBothEdges"];
        };
        readonly default: "Auto";
        readonly category: "Layout";
        readonly webOnly: true;
        readonly doc: "Web only: room kept for the scroll bar whether it shows or not (Stable), on both edges so the content stays centred (StableBothEdges).";
        readonly docFr: "Web uniquement : place réservée à la barre de défilement qu'elle soit affichée ou non (Stable), des deux côtés pour que le contenu reste centré (StableBothEdges).";
        readonly to: {
            readonly prop: "gutter";
            readonly values: {
                readonly Auto: "Auto";
                readonly Stable: "Stable";
                readonly StableBothEdges: "StableBothEdges";
            };
        };
    }, {
        readonly name: "ScrollBarStyle";
        readonly kind: {
            readonly Enum: readonly ["Default", "Inset"];
        };
        readonly default: "Default";
        readonly category: "Appearance";
        readonly webOnly: true;
        readonly doc: "Web only: the look of the scroll bar. Inset: a thin bar that starts and ends inside rounded corners (menus, popovers).";
        readonly docFr: "Web uniquement : aspect de la barre de défilement. Inset : une barre fine qui commence et finit à l'intérieur des coins arrondis (menus, panneaux surgissants).";
        readonly to: {
            readonly prop: "scrollBarStyle";
            readonly values: {
                readonly Default: "Default";
                readonly Inset: "Inset";
            };
        };
    }];
    readonly events: readonly [];
    readonly inheritedMap: {
        readonly AccessibleName: {
            readonly prop: "aria-label";
        };
        readonly AccessibleRole: {
            readonly prop: "role";
            readonly values: {
                readonly Default: "";
                readonly None: "none";
                readonly TitleBar: "banner";
                readonly MenuBar: "menubar";
                readonly ScrollBar: "scrollbar";
                readonly Grip: "separator";
                readonly Sound: "none";
                readonly Cursor: "none";
                readonly Caret: "none";
                readonly Alert: "alert";
                readonly Window: "dialog";
                readonly Client: "region";
                readonly MenuPopup: "menu";
                readonly MenuItem: "menuitem";
                readonly ToolTip: "tooltip";
                readonly Application: "application";
                readonly Document: "document";
                readonly Pane: "region";
                readonly Chart: "img";
                readonly Dialog: "dialog";
                readonly Border: "none";
                readonly Grouping: "group";
                readonly Separator: "separator";
                readonly ToolBar: "toolbar";
                readonly StatusBar: "status";
                readonly Table: "table";
                readonly ColumnHeader: "columnheader";
                readonly RowHeader: "rowheader";
                readonly Column: "gridcell";
                readonly Row: "row";
                readonly Cell: "cell";
                readonly Link: "link";
                readonly HelpBalloon: "tooltip";
                readonly Character: "none";
                readonly List: "list";
                readonly ListItem: "listitem";
                readonly Outline: "tree";
                readonly OutlineItem: "treeitem";
                readonly PageTab: "tab";
                readonly PropertyPage: "tabpanel";
                readonly Indicator: "img";
                readonly Graphic: "img";
                readonly StaticText: "note";
                readonly Text: "textbox";
                readonly PushButton: "button";
                readonly CheckButton: "checkbox";
                readonly RadioButton: "radio";
                readonly ComboBox: "combobox";
                readonly DropList: "listbox";
                readonly ProgressBar: "progressbar";
                readonly Dial: "slider";
                readonly HotkeyField: "textbox";
                readonly Slider: "slider";
                readonly SpinButton: "spinbutton";
                readonly Diagram: "img";
                readonly Animation: "img";
                readonly Equation: "math";
                readonly ButtonDropDown: "button";
                readonly ButtonMenu: "button";
                readonly ButtonDropDownGrid: "button";
                readonly WhiteSpace: "none";
                readonly PageTabList: "tablist";
                readonly Clock: "timer";
                readonly SplitButton: "button";
                readonly IpAddress: "textbox";
                readonly OutlineButton: "button";
            };
        };
        readonly TabIndex: {
            readonly prop: "tabIndex";
        };
        readonly Class: {
            readonly prop: "className";
        };
        readonly CornerRadius: {
            readonly prop: "corner";
        };
    };
    readonly designDefaults: {
        readonly size: readonly [240, 160];
    };
    readonly web: {
        readonly module: "@kubuno/views";
        readonly export: "ScrollArea";
        readonly domRoot: "ref";
        readonly content: "children";
    };
};
export declare const RepeaterMeta: {
    readonly name: "Repeater";
    readonly doc: "Repeats its child element once per item of ItemsSource; bindings inside it read the item first. On the web the items are laid out by the Repeater's container.";
    readonly docFr: "Répète son élément enfant une fois par élément d'ItemsSource ; les liaisons à l'intérieur lisent d'abord l'élément. Sur le web, les éléments sont disposés par le conteneur du Repeater.";
    readonly family: "data";
    readonly baseChain: readonly ["Repeater", "Control", "Component"];
    readonly children: "SingleWidget";
    readonly defaultEvent: null;
    readonly properties: readonly [{
        readonly name: "ItemsSource";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Data";
        readonly bindable: true;
        readonly editor: "list";
        readonly doc: "The items shown, one element each: a binding to a list.";
        readonly docFr: "Lignes affichées, un élément chacune : une liaison vers une liste.";
        readonly to: {
            readonly runtime: "item-state";
        };
    }, {
        readonly name: "ItemKey";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Data";
        readonly doc: "Field of an item that identifies it when the list changes (an id); empty for the position.";
        readonly docFr: "Champ de la ligne qui identifie un élément quand la liste change (un identifiant) ; vide pour la position.";
        readonly to: {
            readonly runtime: "item-state";
        };
    }, {
        readonly name: "DesignItemCount";
        readonly kind: "F32";
        readonly default: "3";
        readonly category: "Design";
        readonly designTime: true;
        readonly doc: "Number of sample items the designer shows when the list has no rows at design time.";
        readonly docFr: "Nombre d'éléments d'exemple que le concepteur affiche quand la liste n'a pas de lignes à la conception.";
        readonly to: {
            readonly runtime: "design";
        };
    }];
    readonly events: readonly [];
    readonly designDefaults: {
        readonly size: readonly [240, 160];
    };
    readonly web: {
        readonly module: "@kubuno/views";
        readonly export: "Repeater";
        readonly domRoot: "none";
        readonly content: "children";
        readonly template: true;
    };
};
export declare const TableLayoutPanelMeta: {
    readonly name: "TableLayoutPanel";
    readonly doc: "A grid: its children are placed in rows and columns sized in pixels, in shares of the room left, or to their content. On the web, a CSS grid whose columns follow the reading direction.";
    readonly docFr: "Grille : ses enfants sont placés en lignes et en colonnes dimensionnées en pixels, en parts de la place restante, ou selon leur contenu.";
    readonly family: "containers";
    readonly baseChain: readonly ["TableLayoutPanel", "ContainerBase", "ScrollableControl", "Control", "Component"];
    readonly children: "List";
    readonly layoutKind: "Flow";
    readonly defaultEvent: "OnClick";
    readonly properties: readonly [{
        readonly name: "ColumnCount";
        readonly kind: "F32";
        readonly default: "2";
        readonly category: "Layout";
        readonly doc: "The number of columns.";
        readonly docFr: "Nombre de colonnes.";
        readonly to: {
            readonly prop: "columnCount";
        };
    }, {
        readonly name: "RowCount";
        readonly kind: "F32";
        readonly default: "2";
        readonly category: "Layout";
        readonly doc: "The number of rows (more are added when the children need them, with GrowStyle AddRows).";
        readonly docFr: "Nombre de lignes (d'autres sont ajoutées quand les enfants en ont besoin, avec GrowStyle AddRows).";
        readonly to: {
            readonly prop: "rowCount";
        };
    }, {
        readonly name: "ColumnStyles";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Layout";
        readonly doc: "How each column is sized, separated by semicolons: Absolute 120, Percent 50 or AutoSize. A missing one is Percent 1 (an equal share).";
        readonly docFr: "Dimensionnement de chaque colonne, séparé par des points-virgules : Absolute 120, Percent 50 ou AutoSize. Une colonne sans style reçoit Percent 1 (une part égale).";
        readonly to: {
            readonly prop: "columnStyles";
        };
    }, {
        readonly name: "RowStyles";
        readonly kind: "String";
        readonly default: "";
        readonly category: "Layout";
        readonly doc: "How each row is sized, separated by semicolons: Absolute 40, Percent 50 or AutoSize. A missing one is AutoSize.";
        readonly docFr: "Dimensionnement de chaque ligne, séparé par des points-virgules : Absolute 40, Percent 50 ou AutoSize. Une ligne sans style est AutoSize.";
        readonly to: {
            readonly prop: "rowStyles";
        };
    }, {
        readonly name: "GrowStyle";
        readonly kind: {
            readonly Enum: readonly ["AddRows", "AddColumns", "FixedSize"];
        };
        readonly default: "AddRows";
        readonly category: "Layout";
        readonly doc: "What happens when the children do not fit the declared grid.";
        readonly docFr: "Ce qui se passe quand les enfants ne tiennent pas dans la grille déclarée.";
        readonly to: {
            readonly prop: "growStyle";
            readonly values: {
                readonly AddRows: "AddRows";
                readonly AddColumns: "AddColumns";
                readonly FixedSize: "FixedSize";
            };
        };
    }, {
        readonly name: "CellBorderStyle";
        readonly kind: {
            readonly Enum: readonly ["None", "Single"];
        };
        readonly default: "None";
        readonly category: "Appearance";
        readonly doc: "Lines drawn around and between the cells.";
        readonly docFr: "Lignes dessinées autour des cellules et entre elles.";
        readonly to: {
            readonly prop: "cellBorderStyle";
            readonly values: {
                readonly None: "None";
                readonly Single: "Single";
            };
        };
    }, {
        readonly name: "CellSpacing";
        readonly kind: "F32";
        readonly default: "0";
        readonly category: "Layout";
        readonly doc: "Space between two cells, in pixels.";
        readonly docFr: "Espace entre deux cellules, en DIP.";
        readonly to: {
            readonly prop: "cellSpacing";
        };
    }];
    readonly events: readonly [];
    readonly inheritedMap: {
        readonly Enabled: {
            readonly prop: "disabled";
            readonly convert: "invert";
        };
        readonly AccessibleName: {
            readonly prop: "aria-label";
        };
        readonly AccessibleRole: {
            readonly prop: "role";
            readonly values: {
                readonly Default: "";
                readonly None: "none";
                readonly TitleBar: "banner";
                readonly MenuBar: "menubar";
                readonly ScrollBar: "scrollbar";
                readonly Grip: "separator";
                readonly Sound: "none";
                readonly Cursor: "none";
                readonly Caret: "none";
                readonly Alert: "alert";
                readonly Window: "dialog";
                readonly Client: "region";
                readonly MenuPopup: "menu";
                readonly MenuItem: "menuitem";
                readonly ToolTip: "tooltip";
                readonly Application: "application";
                readonly Document: "document";
                readonly Pane: "region";
                readonly Chart: "img";
                readonly Dialog: "dialog";
                readonly Border: "none";
                readonly Grouping: "group";
                readonly Separator: "separator";
                readonly ToolBar: "toolbar";
                readonly StatusBar: "status";
                readonly Table: "table";
                readonly ColumnHeader: "columnheader";
                readonly RowHeader: "rowheader";
                readonly Column: "gridcell";
                readonly Row: "row";
                readonly Cell: "cell";
                readonly Link: "link";
                readonly HelpBalloon: "tooltip";
                readonly Character: "none";
                readonly List: "list";
                readonly ListItem: "listitem";
                readonly Outline: "tree";
                readonly OutlineItem: "treeitem";
                readonly PageTab: "tab";
                readonly PropertyPage: "tabpanel";
                readonly Indicator: "img";
                readonly Graphic: "img";
                readonly StaticText: "note";
                readonly Text: "textbox";
                readonly PushButton: "button";
                readonly CheckButton: "checkbox";
                readonly RadioButton: "radio";
                readonly ComboBox: "combobox";
                readonly DropList: "listbox";
                readonly ProgressBar: "progressbar";
                readonly Dial: "slider";
                readonly HotkeyField: "textbox";
                readonly Slider: "slider";
                readonly SpinButton: "spinbutton";
                readonly Diagram: "img";
                readonly Animation: "img";
                readonly Equation: "math";
                readonly ButtonDropDown: "button";
                readonly ButtonMenu: "button";
                readonly ButtonDropDownGrid: "button";
                readonly WhiteSpace: "none";
                readonly PageTabList: "tablist";
                readonly Clock: "timer";
                readonly SplitButton: "button";
                readonly IpAddress: "textbox";
                readonly OutlineButton: "button";
            };
        };
        readonly TabIndex: {
            readonly prop: "tabIndex";
        };
        readonly Class: {
            readonly prop: "className";
        };
        readonly CornerRadius: {
            readonly prop: "cornerRadius";
        };
    };
    readonly designDefaults: {
        readonly size: readonly [320, 160];
    };
    readonly web: {
        readonly module: "@kubuno/views";
        readonly export: "TableLayoutPanel";
        readonly domRoot: "ref";
        readonly content: "children";
    };
};
