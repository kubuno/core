/**
 * Public facade of the date picker.
 *
 * The implementation lives in `./date-picker/` (calendar views, time columns,
 * popover panel, date helpers); this file keeps the historical import path and
 * the exact same exported surface for `@kubuno/ui`.
 */
export { DatePicker } from './date-picker/DatePicker'
export type { DatePickerProps, DatePickerMode } from './date-picker/types'
