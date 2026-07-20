import type { ComponentType } from 'react'

// Theme override registry — the indirection that lets a theme replace a
// component's markup/behaviour (globally or per module), exposed to modules too.
export { ComponentRegistry, ThemeScopeContext, ThemePreviewContext, themed, useThemeVersion } from './themeRegistry'
// Optional portal host: confine overlay primitives (FloatingWindow / AnchoredPopover)
// to a bounded element instead of <body>. Used by the theme preview.
export { PortalHostContext, usePortalHost } from './portalHost'

import { themed as t } from './themeRegistry'

// Base implementations (raw, pre-theming). Internal `@ui` consumers keep
// importing these from their own files; the host and modules import the
// themeable versions exported below from `@ui`.
import { Button as BaseButton } from './Button'
import { Badge as BaseBadge } from './Badge'
import { Input as BaseInput } from './Input'
import { NumberInput as BaseNumberInput } from './NumberInput'
import { Textarea as BaseTextarea } from './Textarea'
import { RichText as BaseRichText } from './RichText'
import { Checkbox as BaseCheckbox } from './Checkbox'
import { Radio as BaseRadio } from './Radio'
import { Toggle as BaseToggle } from './Toggle'
import { FloatCheckbox as BaseFloatCheckbox } from './FloatCheckbox'
import { Separator as BaseSeparator } from './Separator'
import { Spinner as BaseSpinner } from './Spinner'
import { RangeSlider as BaseRangeSlider } from './RangeSlider'
import { Dropdown as BaseDropdown } from './Dropdown'
import { DatePicker as BaseDatePicker } from './DatePicker'
import { FontPicker as BaseFontPicker } from './FontPicker'
import { FontSizeField as BaseFontSizeField } from './FontSizeField'
import { MenuDropdown as BaseMenuDropdown } from './MenuDropdown'
import { Tabs as BaseTabs } from './Tabs'
import { Accordion as BaseAccordion } from './Accordion'
import { StartPage as BaseStartPage } from './StartPage'
import { KubunoLogo as BaseKubunoLogo } from './KubunoLogo'
import { LabelIcon as BaseLabelIcon } from './LabelIcon'
import { ColorPicker as BaseColorPicker } from './ColorPicker'
import { ColorField as BaseColorField } from './ColorField'
import { ColorSwatchPicker as BaseColorSwatchPicker } from './ColorSwatchPicker'
import { GradientPicker as BaseGradientPicker, GradientField as BaseGradientField } from './GradientPicker'
import { AnchoredPopover as BaseAnchoredPopover } from './AnchoredPopover'
import { FloatingWindow as BaseFloatingWindow } from './FloatingWindow'
import { ResizeHandle as BaseResizeHandle } from './ResizeHandle'
import BaseConfirmDialog from './ConfirmDialog'
import BaseConflictDialog from './ConflictDialog'

// Every visual primitive/complex component is themeable: a theme can replace its
// markup and behaviour, and otherwise it renders its default ("Base")
// implementation unchanged. Hooks, utilities and types stay raw further below.
export const Button = t('ui.Button', BaseButton)
export const Badge = t('ui.Badge', BaseBadge)
export const Input = t('ui.Input', BaseInput)
export const NumberInput = t('ui.NumberInput', BaseNumberInput)
export const Textarea = t('ui.Textarea', BaseTextarea)
export const RichText = t('ui.RichText', BaseRichText)
export const Checkbox = t('ui.Checkbox', BaseCheckbox)
export const Radio = t('ui.Radio', BaseRadio)
export const Toggle = t('ui.Toggle', BaseToggle)
export const FloatCheckbox = t('ui.FloatCheckbox', BaseFloatCheckbox)
export const Separator = t('ui.Separator', BaseSeparator)
export const Spinner = t('ui.Spinner', BaseSpinner)
export const RangeSlider = t('ui.RangeSlider', BaseRangeSlider)
export const Dropdown = t('ui.Dropdown', BaseDropdown)
export const DatePicker = t('ui.DatePicker', BaseDatePicker)
export const FontPicker = t('ui.FontPicker', BaseFontPicker)
export const FontSizeField = t('ui.FontSizeField', BaseFontSizeField)
export const MenuDropdown = t('ui.MenuDropdown', BaseMenuDropdown)
// `Tabs` is generic (<T extends string>): cast back to its original type so the
// type parameter survives the wrapper (the runtime wrapper forwards props as-is).
export const Tabs = t('ui.Tabs', BaseTabs as ComponentType<unknown>) as unknown as typeof BaseTabs
export const Accordion = t('ui.Accordion', BaseAccordion)
export const StartPage = t('ui.StartPage', BaseStartPage)
export const KubunoLogo = t('ui.KubunoLogo', BaseKubunoLogo)
export const LabelIcon = t('ui.LabelIcon', BaseLabelIcon)
export const ColorPicker = t('ui.ColorPicker', BaseColorPicker)
export const ColorField = t('ui.ColorField', BaseColorField)
export const ColorSwatchPicker = t('ui.ColorSwatchPicker', BaseColorSwatchPicker)
export const GradientPicker = t('ui.GradientPicker', BaseGradientPicker)
export const GradientField = t('ui.GradientField', BaseGradientField)
export const AnchoredPopover = t('ui.AnchoredPopover', BaseAnchoredPopover)
export const FloatingWindow = t('ui.FloatingWindow', BaseFloatingWindow)
export const ResizeHandle = t('ui.ResizeHandle', BaseResizeHandle)
export const ConfirmDialog = t('ui.ConfirmDialog', BaseConfirmDialog)
export const ConflictDialog = t('ui.ConflictDialog', BaseConflictDialog)

// ── Raw exports: hooks, utilities, types (not components) ──
export { RollingNumber } from './RangeSlider'
export type { RangeSliderProps } from './RangeSlider'
export type { DropdownOption } from './Dropdown'
export type { AccordionItemDef, AccordionProps } from './Accordion'
export type { FontPickerProps } from './FontPicker'
export type { FontSizeFieldProps } from './FontSizeField'
export { FONT_UI_THEME } from './FontPicker'
export type { UITheme } from './FontPicker'
export { parseFontMeta, dedupeFontFamilies } from './fontFamily'
export type { FontMeta } from './fontFamily'
export { useMenuDropdown } from './MenuDropdown'
export type { MenuItem, MenuDropdownPos, MenuTheme } from './MenuDropdown'
export { SpinnerOverlay } from './Spinner'
// Project-wide tooltip: modules use this instead of the native `title`.
export { Tooltip, TOOLTIP_STYLE } from './Tooltip'
export type { TooltipProps, TooltipSide } from './Tooltip'
export type { DatePickerProps, DatePickerMode } from './DatePicker'
export type { TabsProps, TabDef } from './Tabs'
export type { StartPageProps, StartPageRecentItem, StartPageTab, StartPageRecentAction } from './StartPage'
export { useResizableWidth } from './ResizeHandle'
export { harmonyColors, DEFAULT_PICKER_THEME, LIGHT_PICKER_THEME, appPickerTheme, useAppPickerTheme } from './ColorPicker'
export type { Scheme, PickerTheme, PickerTool } from './ColorPicker'
export type { ConfirmVariant, ConfirmOptions } from './ConfirmDialog'
export type { ConflictChoice } from './ConflictDialog'
export { useWindowZStore } from './windowZStore'
export {
  hexToRgb, rgbToHex, rgbToHsl, hslToRgb, rgbToHsv, hsvToRgb, rgbToCmyk, cmykToRgb,
} from './color'
export { gradientToCss, rgbaFromHex, DEFAULT_GRADIENT } from './gradient'
export type { Gradient, GradientStop } from './gradient'
export { isCoarsePointer, openable, useLongPress, useIsMobile, useIsLandscape, MOBILE_MAX_WIDTH } from './interaction'
export { MobileSheet, MobileSheetItem, MobileSheetSeparator } from './MobileSheet'
