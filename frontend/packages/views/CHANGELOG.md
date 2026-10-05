# Changelog — @kubuno/views

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Entries are
added under `[Unreleased]` **as the change is made**; on npm publish, the section is stamped
under the published version number.

## [Unreleased]

### Added

- **`{Res}` arguments and plurals.** A plan's `{Res}` may carry arguments (`{Res files, Count={Binding n}, Name=Kim}`):
  the host's resolver receives them (`setResourceResolver((key, set, args) => …)`, `interpolationOptions(args)` turns
  them into i18next options: each name as written and with a lower-case first letter, `Count` as a number) and a
  view re-reads its strings when a bound argument changes. `View.t(key, set, args)` takes them too.
- **`TableLayoutPanel`.** A grid of cells: column and row counts, sizes per column and row (pixels, shares of
  the room left, or the content's), children placed in reading order or at a given cell, spanning several
  cells, aligned in their cell by their anchors, more children adding rows (or columns), optional cell lines
  and spacing. Columns follow the reading direction.
- **Interaction states and outlines on every element**, in theme colours: a background under the mouse
  (`HoverBackColor`) and while pressed (`PressedBackColor`), rounded corners (`CornerRadius`; a container clips
  its children to them), an outline (`BorderBrush`, `BorderThickness`) and a shadow (`Elevation`). A theme
  colour followed by `/NN` is that colour at NN % opacity. Containers can draw a line between their children
  (`DividerColor`); a scroll area can use the thin inset scroll bar of the menus.
- **Anchored placement in a panel with `Layout="Absolute"`.** Elements keep their distance to the edges they
  are anchored to (`Anchor`) when the panel is larger or smaller than the size they were placed at, stretch
  between two anchored edges, or stay centred; docked elements keep their bands. The end edge follows the
  reading direction.
- **Item events through their parent:** an accordion section's `Open` follows the user (two-way) and raises
  `OnToggled`; menu commands with `CheckOnClick` or a `RadioGroup` keep their check mark and raise
  `OnCheckedChanged`; a context menu adds the commands of its `ItemsSource` and raises `OnItemClicked` with the
  chosen one's key. A hidden item is left out of its parent's list.

- **Lists, trees, navigation and drawing in views.** `ListBox`, `CheckedListBox`, `ListView`, `TreeView` (with their
  `Item` children or a bound list, two-way selection and check marks), `Toolbar`, `Sidebar`, `StatusBar`, `Splitter`,
  `SearchField`, `MaskedField` and `PaintBox`, whose `OnPaint` handler draws on a canvas (`PaintEventArgs`: context,
  size, pixel ratio). New event args: `ItemCheckEventArgs`, `PaintEventArgs`.

- **Sample rows in the designer.** A `Repeater` with nothing to show at design time shows `DesignItemCount`
  sample rows (3 by default) whose bound fields read their own name and row number (`name 1`, `name 2`…), as
  in the desktop designer.
- **Design mode can be switched on and off on a live view**: its elements are marked for the designer again
  (or no longer) without the view losing its state.

### Fixed

- **Theme colours with a digit in their name** (`Surface1`, `Surface2`, `Surface3`) pointed at a CSS variable
  that does not exist; theme colours now map to the host's variables (`OnPrimary`, `Divider`, `Selection`…).
- **A container shown as a push button** fills its line like the block it replaces and lays its text out from
  the start, and is drawn faded while disabled; a `Stack.Fill` child may shrink below its content's width.

## [0.1.0] - 2026-10-05

### Added

- **Layout elements: `Stack`, `Panel`, `UserControl` and `ScrollArea`.** A stack places its children along a
  direction with a gap; a panel (and a user control's root) docks its children as bands on its edges, the
  last one filling the rest, mirrored in right-to-left languages, or places them by position; a scroll area
  scrolls its child. A container marked as a push button renders a real button, one with an address a real
  link.
- **The row of a repeated element in its events.** An event raised by an element of a `Repeater`'s template
  carries that row's item and position (`e.row`, `e.rowIndex`).

### Fixed

- **A view re-reads what it shows from its props when its host passes new ones.** Elements bound to a getter
  over `this.props` kept their first value.

- **First version: the type surface of the `.kbview` views runtime.** Modules that write their screens
  as `.kbview` views build against it: the code-behind base class (`View`, `@bind`), the typed handles of
  named elements, the event args, the runtime elements (`Repeater`, `Timer`, `Query`, `Mutation`,
  `ReactHost`), `MessageBox` and `Dialog`. The implementation is served by the Kubuno host at runtime
  (keep `@kubuno/views` external in module builds).
