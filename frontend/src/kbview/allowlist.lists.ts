/**
 * Conformance allowlist of the WV-5b list elements (`ListBox`, `CheckedListBox`, `ListView`, `TreeView`, `Item`):
 * every accepted difference with the desktop registry, with its reason (see `allowlist.ts`).
 */
import type { AllowEntry } from './conformance.ts'

const PROPOSED = (what: string) => `Web only: ${what} Proposed for the desktop element.`

export const LISTS_ALLOWLIST: readonly AllowEntry[] = [
  // Bound rows: the field shown and the field used as value, like the Dropdown's (the desktop reads a row's Text).
  ...(['ListBox', 'CheckedListBox'] as const).flatMap((element): AllowEntry[] => [
    { kind: 'property-web-only', element, member: 'DisplayMember', reason: PROPOSED('the field of a bound row shown as its text (the desktop reads the row\'s Text field).') },
    { kind: 'property-web-only', element, member: 'ValueMember', reason: PROPOSED('the field of a bound row used as its value (SelectedValue).') },
  ]),
  { kind: 'property-web-only', element: 'ListBox', member: 'SelectedValue', reason: PROPOSED('the selected item\'s value, two-way, like the Dropdown\'s (WinForms ListControl.SelectedValue).') },
  { kind: 'event-web-only', element: 'ListBox', member: 'OnSelectedValueChanged', reason: PROPOSED('raised with SelectedValue (its two-way binding).') },
  { kind: 'event-web-only', element: 'ListBox', member: 'OnItemActivate', reason: PROPOSED('Enter or a double click on an item, as the desktop ListView and TreeView raise it.') },
  { kind: 'property-web-only', element: 'CheckedListBox', member: 'ItemHeight', reason: PROPOSED('row height, as the desktop ListBox has it.') },
  { kind: 'property-web-only', element: 'ListView', member: 'ItemHeight', reason: PROPOSED('row height, as the desktop ListBox has it.') },
  { kind: 'property-web-only', element: 'ListView', member: 'View', reason: PROPOSED('Details, List or LargeIcon (WinForms ListView.View); the desktop ListView shows Details only.') },
  { kind: 'property-web-only', element: 'Item', member: 'Value', reason: PROPOSED('the item\'s value for SelectedValue (the desktop items have a text only).') },
  { kind: 'property-web-only', element: 'Item', member: 'Icon', reason: PROPOSED('an icon before the text (and on the LargeIcon tiles).') },
  { kind: 'property-web-only', element: 'Item', member: 'Checked', reason: PROPOSED('the check mark of a CheckedListBox item, two-way (the desktop does not model it on Item).') },
  { kind: 'property-web-only', element: 'Item', member: 'Expanded', reason: PROPOSED('a TreeView item open at first.') },
  { kind: 'event-web-only', element: 'Item', member: 'OnCheckedChanged', reason: PROPOSED('raised on the item its CheckedListBox checked or unchecked (the change event of a two-way Checked).') },
]
