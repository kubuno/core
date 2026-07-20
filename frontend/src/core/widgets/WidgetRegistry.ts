import type React from 'react'

export type WidgetSize =
  | 'small'   // 1 colonne
  | 'medium'  // 2 colonnes sur ≥ lg
  | 'large'   // pleine largeur

/**
 * Declarative settings schema for a widget. Rendered as controls in the
 * per-widget settings popover (gear icon, edit mode). `label` and option
 * labels are i18n keys, translated at render time.
 */
export type WidgetSettingField =
  | { key: string; type: 'select'; label: string; default: string; options: { value: string; label: string }[] }
  | { key: string; type: 'toggle'; label: string; default: boolean }

export interface WidgetDef {
  id:         string
  moduleId:   string
  Component:  React.ComponentType
  size?:      WidgetSize
  order?:     number
  /** Optional per-widget settings, surfaced via the gear icon in edit mode. */
  settings?:  WidgetSettingField[]
  /** i18n key for a human-friendly name shown in the widget catalog. When a
   *  module widget omits it, the catalog falls back to the module's own name. */
  title?:       string
  /** i18n key for a one-line description shown in the catalog. */
  description?: string
  /** Lucide icon name for the catalog card (falls back to the module icon). */
  icon?:        string
  /** Accent colour (hex) for the catalog card. */
  accent?:      string
}

const widgets: WidgetDef[] = []

export const WidgetRegistry = {
  register(def: WidgetDef) {
    widgets.push(def)
  },

  getAll(): WidgetDef[] {
    return [...widgets].sort((a, b) => (a.order ?? 99) - (b.order ?? 99))
  },
}
