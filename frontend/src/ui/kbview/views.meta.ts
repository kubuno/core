/**
 * Layout and runtime elements rendered by the views runtime itself (`@kubuno/views`, WV-5a): `UserControl`,
 * `Panel`, `Stack`, `ScrollArea` and `Repeater`. Names, kinds, defaults and documentation follow the desktop
 * registry (VIEWS-SPEC §2, §5); the web-only members are allowlisted with their reason.
 */
import type { ComponentProps } from 'react'
import type { Panel, ScrollArea, Stack, UserControl } from '../../views/layout'
import type { Repeater } from '../../views/controls'
import type { ElementMeta, PropertyMeta } from './types.ts'

const CONTAINER_CHAIN = ['ContainerBase', 'ScrollableControl', 'Control', 'Component'] as const

/** `AccessibleRole` → the ARIA role a container renders (`PushButton` → a native `<button>`). */
const ARIA_ROLES = {
  Default: '', None: 'none', TitleBar: 'banner', MenuBar: 'menubar', ScrollBar: 'scrollbar', Grip: 'separator',
  Sound: 'none', Cursor: 'none', Caret: 'none', Alert: 'alert', Window: 'dialog', Client: 'region',
  MenuPopup: 'menu', MenuItem: 'menuitem', ToolTip: 'tooltip', Application: 'application', Document: 'document',
  Pane: 'region', Chart: 'img', Dialog: 'dialog', Border: 'none', Grouping: 'group', Separator: 'separator',
  ToolBar: 'toolbar', StatusBar: 'status', Table: 'table', ColumnHeader: 'columnheader', RowHeader: 'rowheader',
  Column: 'gridcell', Row: 'row', Cell: 'cell', Link: 'link', HelpBalloon: 'tooltip', Character: 'none',
  List: 'list', ListItem: 'listitem', Outline: 'tree', OutlineItem: 'treeitem', PageTab: 'tab',
  PropertyPage: 'tabpanel', Indicator: 'img', Graphic: 'img', StaticText: 'note', Text: 'textbox',
  PushButton: 'button', CheckButton: 'checkbox', RadioButton: 'radio', ComboBox: 'combobox', DropList: 'listbox',
  ProgressBar: 'progressbar', Dial: 'slider', HotkeyField: 'textbox', Slider: 'slider', SpinButton: 'spinbutton',
  Diagram: 'img', Animation: 'img', Equation: 'math', ButtonDropDown: 'button', ButtonMenu: 'button',
  ButtonDropDownGrid: 'button', WhiteSpace: 'none', PageTabList: 'tablist', Clock: 'timer', SplitButton: 'button',
  IpAddress: 'textbox', OutlineButton: 'button',
} as const

const SURFACE: PropertyMeta<{ surface?: 'None' | 'Layer' | 'Card' | 'Raised' | 'Well' }> = {
  name: 'Surface', kind: { Enum: ['None', 'Layer', 'Card', 'Raised', 'Well'] }, default: 'None', category: 'Appearance',
  doc: 'Background painted behind the children: a theme surface.',
  docFr: 'Fond peint derrière les éléments enfants.',
  to: { prop: 'surface', values: { None: 'None', Layer: 'Layer', Card: 'Card', Raised: 'Raised', Well: 'Well' } },
}

const HREF: PropertyMeta<{ href?: string }> = {
  name: 'Href', kind: 'String', default: '', category: 'Behavior', bindable: true, webOnly: true,
  doc: 'Web only: the container is a link to this address. A plain click stays in the app (OnClick decides); a middle or modified click opens the address.',
  docFr: "Web uniquement : le conteneur est un lien vers cette adresse. Un clic simple reste dans l'application (OnClick décide) ; un clic du milieu ou avec une touche de modification ouvre l'adresse.",
  to: { prop: 'href' },
}

/** How every runtime container maps the inherited members it renders itself. */
const CONTAINER_INHERITED = {
  Enabled: { prop: 'disabled', convert: 'invert' },
  AccessibleName: { prop: 'aria-label' },
  AccessibleRole: { prop: 'role', values: ARIA_ROLES },
  TabIndex: { prop: 'tabIndex' },
  // Given to the element as its className (kept by React across renders, merged with its own classes).
  Class: { prop: 'className' },
} as const

const DOCK_LAYOUT: PropertyMeta<{ layout?: 'Dock' | 'Absolute' }> = {
  name: 'Layout', kind: { Enum: ['Dock', 'Absolute'] }, default: 'Dock', category: 'Layout', webOnly: true,
  doc: 'Web: Dock lays the children out as bands (Dock), Absolute places them by X and Y (the desktop designer\'s free positioning).',
  docFr: 'Web : Dock dispose les enfants en bandes (Dock), Absolute les place par X et Y (le placement libre du concepteur desktop).',
  to: { prop: 'layout', values: { Dock: 'Dock', Absolute: 'Absolute' } },
}

export const UserControlMeta = {
  name: 'UserControl',
  doc: 'The root of a user control (.kbcontrol): a composite control designed as a view and used as an element of other views. Its children are docked like a Panel\'s.',
  docFr: "Racine d'un contrôle utilisateur (.kbcontrol) : un contrôle composite conçu comme une vue et utilisé comme élément d'autres vues. Ses enfants sont ancrés comme ceux d'un Panel.",
  family: 'containers',
  baseChain: ['UserControl', 'ContainerControl', 'ScrollableControl', 'Control', 'Component'],
  children: 'List',
  layoutKind: 'DockAnchor',
  defaultEvent: 'OnClick',
  properties: [SURFACE, DOCK_LAYOUT],
  events: [],
  inheritedMap: CONTAINER_INHERITED,
  designDefaults: { size: [320, 240] },
  web: { module: '@kubuno/views', export: 'UserControl', domRoot: 'ref', content: 'children' },
} as const satisfies ElementMeta<ComponentProps<typeof UserControl>>

export const PanelMeta = {
  name: 'Panel',
  doc: 'A container whose children are docked as bands (Dock: Top, Bottom, Left, Right, then Fill takes the rest), or placed by X and Y with Layout="Absolute".',
  docFr: 'Conteneur dont les enfants sont ancrés en bandes (Dock : Top, Bottom, Left, Right, puis Fill prend le reste), ou placés par X et Y avec Layout="Absolute".',
  family: 'containers',
  baseChain: ['Panel', ...CONTAINER_CHAIN],
  children: 'List',
  layoutKind: 'DockAnchor',
  defaultEvent: 'OnClick',
  properties: [SURFACE, DOCK_LAYOUT, HREF],
  events: [],
  inheritedMap: CONTAINER_INHERITED,
  designDefaults: { size: [200, 100] },
  web: { module: '@kubuno/views', export: 'Panel', domRoot: 'ref', content: 'children' },
} as const satisfies ElementMeta<ComponentProps<typeof Panel>>

export const StackMeta = {
  name: 'Stack',
  doc: 'Places its children one after the other along a direction, Gap pixels apart; a child with Stack.Fill="true" takes the room left.',
  docFr: "Place ses enfants les uns après les autres dans une direction, espacés de Gap pixels ; un enfant avec Stack.Fill=\"true\" prend la place restante.",
  family: 'core',
  baseChain: ['Stack', ...CONTAINER_CHAIN],
  children: 'List',
  layoutKind: 'Flow',
  defaultEvent: 'OnClick',
  properties: [
    { name: 'Direction', kind: { Enum: ['LeftToRight', 'TopDown', 'RightToLeft', 'BottomUp'] }, default: 'TopDown', category: 'Layout',
      doc: 'Direction in which the children are placed. On the web LeftToRight follows the reading direction (it mirrors in Arabic and Hebrew).',
      docFr: 'Sens dans lequel les éléments enfants sont placés.',
      to: { prop: 'direction' } },
    { name: 'Gap', kind: 'F32', default: '8', category: 'Layout',
      doc: 'Space between two children, in pixels.', docFr: 'Espace entre deux éléments enfants, en pixels.',
      to: { prop: 'gap' } },
    SURFACE,
    { name: 'WrapContents', kind: 'Bool', default: 'false', category: 'Layout',
      doc: 'Wraps the children onto several lines (or columns) when they do not fit, like a FlowLayoutPanel.',
      docFr: 'Renvoie les enfants sur plusieurs lignes (ou colonnes) quand ils ne tiennent pas, comme un FlowLayoutPanel.',
      to: { prop: 'wrap' } },
    { name: 'CrossAlign', kind: { Enum: ['Stretch', 'Start', 'Center', 'End'] }, default: 'Stretch', category: 'Layout',
      doc: 'Places the children across the flow: stretched over the line (or column), or at their own size at its start, centre or end.',
      docFr: 'Place les enfants en travers du flux : étirés sur la ligne (ou la colonne), ou à leur propre taille au début, au centre ou à la fin.',
      to: { prop: 'crossAlign' } },
    { name: 'Justify', kind: { Enum: ['Start', 'Center', 'End', 'SpaceBetween'] }, default: 'Start', category: 'Layout', webOnly: true,
      doc: 'Web only: where the children sit along the flow when they leave room: at its start, centred, at its end, or spread with the room between them.',
      docFr: "Web uniquement : place des enfants le long du flux quand ils laissent de la place : au début, centrés, à la fin, ou répartis avec la place entre eux.",
      to: { prop: 'justify' } },
    HREF,
  ],
  events: [],
  inheritedMap: CONTAINER_INHERITED,
  designDefaults: { size: [200, 100] },
  web: { module: '@kubuno/views', export: 'Stack', domRoot: 'ref', content: 'children' },
} as const satisfies ElementMeta<ComponentProps<typeof Stack>>

export const ScrollAreaMeta = {
  name: 'ScrollArea',
  doc: 'Shows its single child in a scrolling viewport.',
  docFr: 'Affiche son élément enfant dans une zone qui défile.',
  family: 'containers',
  baseChain: ['ScrollArea', 'ScrollableControl', 'Control', 'Component'],
  children: 'SingleWidget',
  defaultEvent: 'OnClick',
  properties: [
    { name: 'Corner', kind: 'F32', default: '0', category: 'Appearance',
      doc: 'Radius of the rounded corners, in pixels. 0 for square corners.',
      docFr: 'Rayon des coins arrondis, en pixels. 0 pour des coins carrés.',
      to: { prop: 'corner' } },
    { name: 'ScrollBars', kind: { Enum: ['Vertical', 'Horizontal', 'Both'] }, default: 'Vertical', category: 'Behavior', webOnly: true,
      doc: 'Web only: the directions the content scrolls in.',
      docFr: 'Web uniquement : les directions dans lesquelles le contenu défile.',
      to: { prop: 'scrollBars', values: { Vertical: 'Vertical', Horizontal: 'Horizontal', Both: 'Both' } } },
    { name: 'ScrollbarGutter', kind: { Enum: ['Auto', 'Stable', 'StableBothEdges'] }, default: 'Auto', category: 'Layout', webOnly: true,
      doc: 'Web only: room kept for the scroll bar whether it shows or not (Stable), on both edges so the content stays centred (StableBothEdges).',
      docFr: "Web uniquement : place réservée à la barre de défilement qu'elle soit affichée ou non (Stable), des deux côtés pour que le contenu reste centré (StableBothEdges).",
      to: { prop: 'gutter', values: { Auto: 'Auto', Stable: 'Stable', StableBothEdges: 'StableBothEdges' } } },
  ],
  events: [],
  inheritedMap: { AccessibleName: { prop: 'aria-label' }, AccessibleRole: { prop: 'role', values: ARIA_ROLES }, TabIndex: { prop: 'tabIndex' }, Class: { prop: 'className' } },
  designDefaults: { size: [240, 160] },
  web: { module: '@kubuno/views', export: 'ScrollArea', domRoot: 'ref', content: 'children' },
} as const satisfies ElementMeta<ComponentProps<typeof ScrollArea>>

export const RepeaterMeta = {
  name: 'Repeater',
  doc: 'Repeats its child element once per item of ItemsSource; bindings inside it read the item first. On the web the items are laid out by the Repeater\'s container.',
  docFr: "Répète son élément enfant une fois par élément d'ItemsSource ; les liaisons à l'intérieur lisent d'abord l'élément. Sur le web, les éléments sont disposés par le conteneur du Repeater.",
  family: 'data',
  baseChain: ['Repeater', 'Control', 'Component'],
  children: 'SingleWidget',
  defaultEvent: null,
  properties: [
    { name: 'ItemsSource', kind: 'String', default: '', category: 'Data', bindable: true, editor: 'list',
      doc: 'The items shown, one element each: a binding to a list.',
      docFr: 'Lignes affichées, un élément chacune : une liaison vers une liste.',
      to: { runtime: 'item-state' } },
    { name: 'ItemKey', kind: 'String', default: '', category: 'Data',
      doc: 'Field of an item that identifies it when the list changes (an id); empty for the position.',
      docFr: "Champ de la ligne qui identifie un élément quand la liste change (un identifiant) ; vide pour la position.",
      to: { runtime: 'item-state' } },
    { name: 'DesignItemCount', kind: 'F32', default: '3', category: 'Design', designTime: true,
      doc: 'Number of sample items the designer shows when the list has no rows at design time.',
      docFr: "Nombre d'éléments d'exemple que le concepteur affiche quand la liste n'a pas de lignes à la conception.",
      to: { runtime: 'design' } },
  ],
  events: [],
  designDefaults: { size: [240, 160] },
  web: { module: '@kubuno/views', export: 'Repeater', domRoot: 'none', content: 'children', template: true },
} as const satisfies ElementMeta<ComponentProps<typeof Repeater>>
