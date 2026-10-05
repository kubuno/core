/**
 * List elements (WV-5b): `ListBox`, `CheckedListBox`, `ListView`, `TreeView` and their `Item` children. Names,
 * kinds, defaults and documentation follow the desktop registry (VIEWS-SPEC §2, §9); the web-only members are
 * allowlisted with their reason (`allowlist.lists.ts`).
 */
import type { ComponentProps } from 'react'
import type { CheckedListBox, ListBox } from '../ListBox'
import type { ListView } from '../ListView'
import type { TreeView } from '../TreeView'
import type { ListItemDef } from '../listCore'
import type { ElementMeta, PropertyMeta } from './types.ts'

const LIST_CONTROL_CHAIN = ['ListControl', 'Control', 'Component'] as const

const SELECTED_INDEX = {
  name: 'SelectedIndex', kind: 'F32', default: '-1', category: 'Data',
  doc: 'Index of the selected item, starting at 0. -1 means none.',
  docFr: "Index de l'élément sélectionné, à partir de 0. -1 signifie aucun.",
  to: { prop: 'selectedIndex', change: 'OnSelectionChanged' },
} as const

const ITEMS_SOURCE_DOC = {
  doc: 'Binding to the list of items to show, instead of Item children (each row\'s Text, or its DisplayMember field).',
  docFr: 'Liaison vers la liste des éléments à afficher, à la place des éléments Item.',
} as const

const DISPLAY_MEMBER: PropertyMeta<never> = {
  name: 'DisplayMember', kind: 'String', default: 'Text', category: 'Data', webOnly: true,
  doc: 'Web only: field of each bound item shown as its text.', docFr: 'Web uniquement : champ de chaque élément lié affiché comme texte.',
  to: { runtime: 'item-state' },
}
const VALUE_MEMBER: PropertyMeta<never> = {
  name: 'ValueMember', kind: 'String', default: 'Value', category: 'Data', webOnly: true,
  doc: 'Web only: field of each bound item used as its value.', docFr: 'Web uniquement : champ de chaque élément lié utilisé comme valeur.',
  to: { runtime: 'item-state' },
}

const ITEM_HEIGHT = {
  name: 'ItemHeight', kind: 'F32', default: '0', category: 'Behavior',
  doc: 'Height of a row, in pixels; 0 for the standard height.',
  docFr: "Hauteur d'une ligne, en DIP (avec DrawMode OwnerDrawFixed : la hauteur dans laquelle dessine le gestionnaire DrawItem) ; 0 pour la hauteur standard.",
  to: { prop: 'itemHeight' },
} as const

const SELECTION_CHANGED = {
  name: 'OnSelectionChanged', category: 'Behavior', args: 'ValueChangedEventArgs',
  doc: 'Occurs when the selection changes. The value is the selected index (-1: none).',
  docFr: 'Se produit quand la sélection change.',
  from: { prop: 'onSelectionChange', args: 'value' },
} as const

const ITEM_ACTIVATE = {
  name: 'OnItemActivate', category: 'Action', args: 'ItemActivateEventArgs', aliases: ['OnActivate'],
  doc: 'Occurs when an item is double-clicked, or Enter is pressed on it.',
  docFr: 'Se produit quand un élément est double-cliqué.',
  from: { prop: 'onItemActivate', args: 'row' },
} as const

/** How the lists map the inherited members they render themselves. */
const LIST_INHERITED = {
  Enabled: { prop: 'disabled', convert: 'invert' },
  AccessibleName: { prop: 'aria-label' },
  Height: { prop: 'height' },
  Class: { prop: 'className' },
} as const

const ITEMS_ADAPTER = { prop: 'items', item: 'Item', content: 'none', nested: 'items', key: 'key' } as const

export const ListBoxMeta = {
  name: 'ListBox',
  doc: 'A list of items. Add the items as Item children or bind ItemsSource. Arrow keys, Home / End, Page Up / Page Down and type-ahead move the selection; long lists are virtualised.',
  docFr: 'Liste d\'éléments. Ajoutez les éléments comme éléments Item enfants, ou liez ItemsSource.',
  family: 'data',
  baseChain: ['ListBox', ...LIST_CONTROL_CHAIN],
  children: 'List',
  allowedChildren: ['Item'],
  defaultEvent: 'OnSelectionChanged',
  properties: [
    { name: 'SelectionMode', kind: { Enum: ['None', 'One', 'MultiSimple', 'MultiExtended'] }, default: 'One', category: 'Misc',
      doc: 'How many items can be selected, and how Ctrl and Shift combine with a click.',
      docFr: "Nombre d'éléments sélectionnables, et effet de Ctrl et Maj avec un clic.",
      to: { prop: 'selectionMode', values: { None: 'None', One: 'One', MultiSimple: 'MultiSimple', MultiExtended: 'MultiExtended' } } },
    SELECTED_INDEX,
    { name: 'ItemsSource', kind: 'String', default: '', category: 'Data', ...ITEMS_SOURCE_DOC,
      to: { prop: 'source', convert: 'items-source' } },
    ITEM_HEIGHT,
    DISPLAY_MEMBER, VALUE_MEMBER,
    { name: 'SelectedValue', kind: 'String', default: '', category: 'Data', bindable: true, webOnly: true,
      doc: 'Web only: value of the selected item (its Value, or ValueMember field of a bound row; else its text). Empty when none is selected.',
      docFr: "Web uniquement : valeur de l'élément sélectionné (sa Value, ou le champ ValueMember d'une ligne liée ; sinon son texte). Vide quand aucun n'est sélectionné.",
      to: { prop: 'selectedValue', change: 'OnSelectedValueChanged' } },
  ],
  events: [
    SELECTION_CHANGED,
    { name: 'OnSelectedValueChanged', category: 'Property Changed', args: 'ValueChangedEventArgs',
      doc: 'Web only: occurs when another item is selected; the value is its SelectedValue.',
      docFr: 'Web uniquement : se produit quand un autre élément est sélectionné ; la valeur est sa SelectedValue.',
      from: { prop: 'onSelectedValueChange', args: 'value' } },
    { ...ITEM_ACTIVATE, doc: 'Web only: occurs when an item is double-clicked, or Enter is pressed on it.', docFr: 'Web uniquement : se produit quand un élément est double-cliqué, ou quand on appuie sur Entrée dessus.' },
  ],
  inheritedMap: LIST_INHERITED,
  designDefaults: { size: [200, 160] },
  web: { module: '@ui', export: 'ListBox', domRoot: 'ref', childrenToProp: ITEMS_ADAPTER },
} as const satisfies ElementMeta<ComponentProps<typeof ListBox>>

export const CheckedListBoxMeta = {
  name: 'CheckedListBox',
  doc: 'A list of items, each with a check box. Space or a click on the box checks an item.',
  docFr: 'Liste d\'éléments, chacun avec une case à cocher.',
  family: 'data',
  baseChain: ['CheckedListBox', ...LIST_CONTROL_CHAIN],
  children: 'List',
  allowedChildren: ['Item'],
  defaultEvent: 'OnSelectionChanged',
  properties: [
    SELECTED_INDEX,
    { name: 'CheckOnClick', kind: 'Bool', default: 'false', category: 'Behavior',
      doc: 'Checks or unchecks an item with a single click anywhere on it.',
      docFr: "Coche ou décoche un élément d'un simple clic n'importe où dessus.",
      to: { prop: 'checkOnClick' } },
    { name: 'ItemsSource', kind: 'String', default: '', category: 'Data', ...ITEMS_SOURCE_DOC,
      to: { prop: 'source', convert: 'items-source' } },
    DISPLAY_MEMBER, VALUE_MEMBER,
    { ...ITEM_HEIGHT, webOnly: true, doc: 'Web only: height of a row, in pixels; 0 for the standard height.', docFr: "Web uniquement : hauteur d'une ligne, en pixels ; 0 pour la hauteur standard." },
  ],
  events: [
    { ...SELECTION_CHANGED, doc: 'Occurs when the selected item changes. The value is its index (-1: none).', docFr: "Se produit quand l'élément sélectionné change." },
    { name: 'OnCheckedChanged', category: 'Behavior', args: 'ItemCheckEventArgs',
      doc: 'Occurs when an item is checked or unchecked (e.index, e.checked).',
      docFr: 'Se produit quand un élément est coché ou décoché.',
      from: { prop: 'onItemCheck', args: 'item-check' } },
  ],
  inheritedMap: LIST_INHERITED,
  designDefaults: { size: [200, 160] },
  web: { module: '@ui', export: 'CheckedListBox', domRoot: 'ref', childrenToProp: ITEMS_ADAPTER },
} as const satisfies ElementMeta<ComponentProps<typeof CheckedListBox>>

export const ListViewMeta = {
  name: 'ListView',
  doc: 'A list of items in columns. Declare the columns as Column children; the rows are Item children (their Item children fill the next columns) or ItemsSource (each column shows the field its Binding names). On the web, View also shows the items as a list or as tiles.',
  docFr: 'Liste d\'éléments en colonnes. Déclarez les colonnes comme éléments Column enfants.',
  family: 'data',
  baseChain: ['ListView', 'Control', 'Component'],
  children: 'List',
  allowedChildren: ['Item', 'Column'],
  defaultEvent: 'OnSelectionChanged',
  properties: [
    { ...SELECTED_INDEX, doc: 'Index of the selected item, starting at 0. -1 means none.' },
    { name: 'MultiSelect', kind: 'Bool', default: 'false', category: 'Behavior',
      doc: 'Allows several items to be selected (Ctrl and Shift).', docFr: 'Permet de sélectionner plusieurs éléments.',
      to: { prop: 'multiSelect' } },
    { name: 'ItemsSource', kind: 'String', default: '', category: 'Data',
      doc: 'Binding to the list of rows to show. Each column shows the field named by its Binding.',
      docFr: 'Liaison vers la liste des lignes à afficher. Chaque colonne affiche le champ nommé par sa Binding.',
      to: { prop: 'rows', convert: 'items-source' } },
    { name: 'View', kind: { Enum: ['Details', 'List', 'LargeIcon'] }, default: 'Details', category: 'Appearance', webOnly: true,
      doc: 'Web only: Details (rows in columns), List (the items\' texts) or LargeIcon (tiles with the items\' icons).',
      docFr: 'Web uniquement : Details (lignes en colonnes), List (les textes des éléments) ou LargeIcon (des tuiles avec les icônes des éléments).',
      to: { prop: 'view', values: { Details: 'Details', List: 'List', LargeIcon: 'LargeIcon' } } },
    { ...ITEM_HEIGHT, webOnly: true, doc: 'Web only: height of a row, in pixels; 0 for the standard height.', docFr: "Web uniquement : hauteur d'une ligne, en pixels ; 0 pour la hauteur standard." },
  ],
  events: [SELECTION_CHANGED, ITEM_ACTIVATE],
  inheritedMap: LIST_INHERITED,
  designDefaults: { size: [360, 200] },
  web: { module: '@ui', export: 'ListView', domRoot: 'ref', childrenToProp: { prop: 'entries', item: ['Item', 'Column'], content: 'none', nested: 'items', key: 'key' } },
} as const satisfies ElementMeta<ComponentProps<typeof ListView>>

export const TreeViewMeta = {
  name: 'TreeView',
  doc: 'A tree of items that can be expanded. Add the items as nested Item children, or bind ItemsSource (a row\'s Items field nests).',
  docFr: 'Arborescence d\'éléments qui se développent. Ajoutez les éléments comme éléments Item imbriqués.',
  family: 'data',
  baseChain: ['TreeView', 'Control', 'Component'],
  children: 'List',
  allowedChildren: ['Item'],
  defaultEvent: 'OnSelectionChanged',
  properties: [
    { name: 'SelectedPath', kind: 'String', default: '', category: 'Data',
      doc: 'Selected item, as indexes separated by dots, for example 0.2.1. Empty means none.',
      docFr: 'Élément sélectionné, sous forme d\'index séparés par des points, par exemple 0.2.1. Vide signifie aucun.',
      to: { prop: 'selectedPath', change: 'OnSelectionChanged' } },
    { name: 'MultiSelect', kind: 'Bool', default: 'false', category: 'Behavior',
      doc: 'Allows several items to be selected (Ctrl and Shift).', docFr: 'Permet de sélectionner plusieurs éléments.',
      to: { prop: 'multiSelect' } },
    { name: 'ItemsSource', kind: 'String', default: '', category: 'Data',
      doc: 'Binding to the items to show, instead of Item children (a row\'s Items or Children list makes its sub-tree on the web).',
      docFr: 'Liaison vers une liste simple d\'éléments à afficher, à la place des éléments Item.',
      to: { prop: 'source', convert: 'items-source' } },
    { name: 'ItemHeight', kind: 'F32', default: '0', category: 'Appearance',
      doc: 'Height of a row, in pixels; 0 for the standard height.', docFr: "Hauteur d'une ligne, en DIP ; 0 pour la hauteur standard.",
      to: { prop: 'itemHeight' } },
  ],
  events: [
    { ...SELECTION_CHANGED, doc: 'Occurs when the selected item changes. The value is its SelectedPath.', docFr: "Se produit quand l'élément sélectionné change." },
    ITEM_ACTIVATE,
  ],
  inheritedMap: LIST_INHERITED,
  designDefaults: { size: [240, 240] },
  web: { module: '@ui', export: 'TreeView', domRoot: 'ref', childrenToProp: ITEMS_ADAPTER },
} as const satisfies ElementMeta<ComponentProps<typeof TreeView>>

export const ItemMeta = {
  name: 'Item',
  doc: 'An item of a ListBox, CheckedListBox, ListView or TreeView. Item children make a sub-tree (TreeView) or the next columns\' cells (ListView).',
  docFr: "Élément d'une ListBox, d'une CheckedListBox, d'une ListView ou d'une TreeView.",
  family: 'data',
  baseChain: ['Item', 'Component'],
  children: 'List',
  allowedChildren: ['Item'],
  defaultEvent: null,
  properties: [
    { name: 'Text', kind: 'String', default: '', category: 'Appearance',
      doc: 'Text of the item.', docFr: "Texte de l'élément.", to: { prop: 'text' } },
    { name: 'Value', kind: 'String', default: '', category: 'Data', webOnly: true,
      doc: 'Web only: value of the item (SelectedValue); its text when empty.', docFr: "Web uniquement : valeur de l'élément (SelectedValue) ; son texte quand elle est vide.",
      to: { prop: 'value' } },
    { name: 'Icon', kind: 'String', default: '', category: 'Icon', editor: 'icon', webOnly: true,
      doc: 'Web only: icon shown before the text (a name of the Kubuno icon set).', docFr: "Web uniquement : icône affichée avant le texte (un nom du jeu d'icônes Kubuno).",
      to: { prop: 'icon', convert: 'icon-component' } },
    { name: 'Checked', kind: 'Bool', default: 'false', category: 'Appearance', bindable: true, webOnly: true,
      doc: 'Web only: the item is checked (CheckedListBox). A two-way binding follows the user\'s clicks.',
      docFr: "Web uniquement : l'élément est coché (CheckedListBox). Une liaison bidirectionnelle suit les clics de l'utilisateur.",
      to: { prop: 'checked', change: 'OnCheckedChanged' } },
    { name: 'Expanded', kind: 'Bool', default: 'false', category: 'Behavior', webOnly: true,
      doc: 'Web only: the item shows its children at first (TreeView).', docFr: "Web uniquement : l'élément montre ses enfants au départ (TreeView).",
      to: { prop: 'expanded' } },
  ],
  events: [
    { name: 'OnCheckedChanged', category: 'Behavior', args: 'ItemCheckEventArgs',
      doc: 'Web only: occurs when the user checks or unchecks this item of a CheckedListBox.',
      docFr: "Web uniquement : se produit quand l'utilisateur coche ou décoche cet élément d'une CheckedListBox.",
      from: { runtime: 'parent-adapter', args: 'item-check' } },
  ],
  web: { module: null, export: null, domRoot: 'none', itemOf: ['ListBox', 'CheckedListBox', 'ListView', 'TreeView', 'Item'] },
} as const satisfies ElementMeta<ListItemDef>
