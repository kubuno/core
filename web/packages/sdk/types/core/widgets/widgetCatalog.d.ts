import type { TFunction } from 'i18next';
import type { LucideIcon } from 'lucide-react';
import type { ActiveModule } from '../types';
import type { WidgetDef, WidgetSize } from './WidgetRegistry';
export interface WidgetPresentation {
    title: string;
    description: string;
    Icon: LucideIcon;
    accent?: string;
}
/**
 * Resolve how a widget is shown in the catalog / add gallery. Core widgets carry
 * explicit metadata; module widgets are described dynamically from the running
 * module (its sidebar label + icon), so the core never hard-codes module names.
 */
export declare function resolveWidgetPresentation(w: WidgetDef, modules: ActiveModule[], t: TFunction): WidgetPresentation;
/** Human-friendly size label for the catalog card chip. */
export declare function widgetSizeLabel(size: WidgetSize | undefined, t: TFunction): string;
