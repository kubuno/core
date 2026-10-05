/**
 * Every `.kbview` element the web target knows today, in Toolbox order (the desktop export's
 * family order, then each family's own order). Adding an element = adding its `*.meta.ts` table
 * next to the component and listing it here.
 */
import type { AnyElementMeta } from '../ui/kbview/types.ts'
import { ButtonMeta, IconButtonMeta } from '../ui/kbview/buttons.meta.ts'
import { CheckBoxMeta, NumericFieldMeta, RadioButtonMeta, SliderMeta, SwitchMeta } from '../ui/kbview/choice.meta.ts'
import {
  ComboBoxMeta, ColorFieldMeta, DatePickerMeta, DropdownMeta, GradientFieldMeta, OptionMeta, TextAreaMeta, TextFieldMeta,
} from '../ui/kbview/text.meta.ts'
import { BadgeMeta, CalloutMeta, EmptyStateMeta, ProgressBarMeta, SeparatorMeta, SpinnerMeta } from '../ui/kbview/display.meta.ts'
import {
  AccordionMeta, AccordionSectionMeta, BreadcrumbItemMeta, BreadcrumbMeta, CardMeta, FloatingWindowMeta, PopoverMeta,
  StepMeta, StepperMeta, TabItemMeta, TabsMeta,
} from '../ui/kbview/containers.meta.ts'
import { ColumnMeta, DataTableMeta } from '../ui/kbview/data.meta.ts'
import { ContextMenuMeta, MenuItemMeta, ToolTipMeta } from '../ui/kbview/components.meta.ts'
import { DockAreaMeta, DockPanelMeta, WorkspaceShellMeta } from '../sdk/kbview/workspace.meta.ts'
import { PanelMeta, RepeaterMeta, ScrollAreaMeta, StackMeta, TableLayoutPanelMeta, UserControlMeta } from '../ui/kbview/views.meta.ts'
import { GroupBoxMeta, RadioGroupMeta, SettingsRowMeta } from '../ui/kbview/forms.meta.ts'
import { AvatarMeta, IconMeta, LabelMeta, LinkLabelMeta, PictureBoxMeta } from '../ui/kbview/primitives.meta.ts'

export const WEB_ELEMENTS: readonly AnyElementMeta[] = [
  // core
  ButtonMeta, SwitchMeta, TextFieldMeta, CardMeta, StackMeta,
  // display
  LabelMeta, LinkLabelMeta, BadgeMeta, SpinnerMeta, ProgressBarMeta, SeparatorMeta, CalloutMeta, EmptyStateMeta,
  IconMeta, AvatarMeta, PictureBoxMeta,
  // choice
  IconButtonMeta, CheckBoxMeta, RadioButtonMeta, RadioGroupMeta, SliderMeta, NumericFieldMeta,
  // text
  OptionMeta, TextAreaMeta, DropdownMeta, ComboBoxMeta, DatePickerMeta, ColorFieldMeta, GradientFieldMeta,
  // containers
  TabItemMeta, TabsMeta, BreadcrumbItemMeta, BreadcrumbMeta, AccordionSectionMeta, AccordionMeta, StepMeta, StepperMeta,
  FloatingWindowMeta, PopoverMeta, PanelMeta, UserControlMeta, ScrollAreaMeta, TableLayoutPanelMeta, GroupBoxMeta, SettingsRowMeta,
  // data
  DataTableMeta, ColumnMeta, RepeaterMeta,
  // docking (@kubuno/sdk)
  DockAreaMeta, DockPanelMeta, WorkspaceShellMeta,
  // components
  ToolTipMeta, ContextMenuMeta, MenuItemMeta,
]
