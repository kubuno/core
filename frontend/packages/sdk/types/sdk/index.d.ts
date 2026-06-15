/**
 * `@kubuno/sdk` — surface stable exposée par le core aux modules.
 *
 * Un module (en arbre OU tiers, chargé à l'exécution) importe UNIQUEMENT depuis
 * `@kubuno/sdk` (+ `@ui`, `react`, `lucide-react`…). Au build d'un module ces
 * specifiers sont marqués `external` ; au runtime l'import map du host les résout
 * vers les instances UNIQUES du core (mêmes registries, même zustand, même i18next).
 * Ne JAMAIS importer un module d'ici, et ne jamais exposer de logique métier.
 */
export * from '../core/registry/RouteRegistry';
export * from '../core/registry/WaffleAppRegistry';
export * from '../core/registry/FileTypeRegistry';
export * from '../core/registry/ModuleServiceRegistry';
export * from '../core/registry/FaviconRegistry';
export * from '../core/registry/ExtensionRegistry';
export * from '../core/registry/CollapseSidebarRegistry';
export * from '../core/registry/calendarOverlay';
export * from '../core/slots/SlotRegistry';
export * from '../core/widgets/WidgetRegistry';
export * from '../core/store/sidebarStore';
export * from '../core/store/toolbarStore';
export * from '../core/store/searchStore';
export * from '../core/store/rightPanelStore';
export * from '../core/i18n';
export { default as i18n } from '../core/i18n';
export { api } from '../core/api/client';
export { useAuthStore } from '../core/store/authStore';
export { useModulesStore } from '../core/store/modulesStore';
export { useNotificationStore } from '../core/store/notificationStore';
export { useImageCacheStore, bumpImageCache, bumpAllImageCache } from '../core/store/imageCacheStore';
export { usePendingDeletionStore, usePendingKind, pendingBoxClass, pendingBoxStyle, } from '../core/store/pendingDeletionStore';
export type { DeletionKind, PendingItem, PendingBatch } from '../core/store/pendingDeletionStore';
export { useConfirm } from '../core/hooks/useConfirm';
export { useContextMenu, ContextMenuItem, ContextMenuSeparator, ContextMenuProvider } from '../core/shell/ContextMenuProvider';
export { SidebarNavItem } from '../core/shell/SidebarNavItem';
export { useUiStore } from '../core/store/uiStore';
export { default as HeaderActions } from '../core/shell/HeaderActions';
export { useChromelessHeader } from '../core/shell/useChromelessHeader';
export { WorkspaceShell, MenuBar, WORKSPACE_DARK, WORKSPACE_LIGHT, WORKSPACE_OFFICE } from '../core/shell/workspace';
export type { WorkspaceTheme } from '../core/shell/workspace';
export type { MenuItem as WorkspaceMenuItem } from '../core/shell/workspace';
export { useDebouncedAutosave } from '../core/hooks/useAutosave';
export { formatSize } from '../core/utils/format';
export { useDraggable } from '../core/hooks/useDraggable';
export { prompt } from '../core/store/promptStore';
export { default as DashboardWidget } from '../core/widgets/DashboardWidget';
export { useWidgetSize, WidgetSizeContext } from '../core/widgets/WidgetSizeContext';
export { useWsStore } from '../core/store/wsStore';
export { getDateLocale } from '../core/i18n/dateLocale';
export { getIcon, ICON_MAP } from '../core/utils/iconMap';
export type { User } from '../core/types';
/**
 * Version de contrat du SDK. À incrémenter UNIQUEMENT sur un changement cassant
 * (export retiré/renommé, signature de registry modifiée). Le loader rejette
 * proprement un module dont la `sdk_version` déclarée diffère.
 */
export declare const SDK_VERSION: 1;
