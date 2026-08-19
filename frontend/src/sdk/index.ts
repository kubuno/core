/**
 * `@kubuno/sdk` — surface stable exposée par le core aux modules.
 *
 * Un module (en arbre OU tiers, chargé à l'exécution) importe UNIQUEMENT depuis
 * `@kubuno/sdk` (+ `@ui`, `react`, `lucide-react`…). Au build d'un module ces
 * specifiers sont marqués `external` ; au runtime l'import map du host les résout
 * vers les instances UNIQUES du core (mêmes registries, même zustand, même i18next).
 * Ne JAMAIS importer un module d'ici, et ne jamais exposer de logique métier.
 */
export * from '../core/registry/RouteRegistry'
export * from '../core/registry/WaffleAppRegistry'
export * from '../core/registry/FileTypeRegistry'
export * from '../core/registry/ModuleServiceRegistry'
export * from '../core/registry/FaviconRegistry'
export * from '../core/registry/ExtensionRegistry'
export * from '../core/registry/MentionRegistry'
export * from '../core/registry/DataTransferRegistry'
export { DataCardView } from '../core/registry/DataCardView'
// Cross-module labels: imperative picker + typed API (labels live in the core).
export { openLabelPicker, resourceKeyOf } from '../core/store/labelPickerStore'
export { labelsApi } from '../core/api/labels'
export type { CoreLabel, LabelBrowseItem } from '../core/api/labels'
export * from '../core/registry/CollapseSidebarRegistry'
export * from '../core/registry/ModuleMenuRegistry'
export * from '../core/registry/calendarOverlay'
export * from '../core/registry/datepickerDayPanel'
export * from '../core/registry/domainDiagnostics'
export * from '../core/slots/SlotRegistry'
export * from '../core/widgets/WidgetRegistry'
export * from '../core/store/sidebarStore'
export * from '../core/store/toolbarStore'
export * from '../core/store/searchStore'
export * from '../core/store/rightPanelStore'
export * from '../core/i18n'
export { default as i18n } from '../core/i18n'

// ── Accès core étendu : singletons/contextes/composants partagés requis par les
//    bundles de modules (sinon une copie bundlée = instance désynchronisée). ──
export { api } from '../core/api/client'
// SPA navigation from OUTSIDE React (menu items built as data, stores, workers):
// routes through the router when the shell is mounted, History API otherwise.
export { navigate } from '../core/navigation'
export { useAuthStore } from '../core/store/authStore'
export { useModulesStore } from '../core/store/modulesStore'
export { useNotificationStore } from '../core/store/notificationStore'
export { useImageCacheStore, bumpImageCache, bumpAllImageCache } from '../core/store/imageCacheStore'
export {
  usePendingDeletionStore, usePendingKind, pendingBoxClass, pendingBoxStyle,
} from '../core/store/pendingDeletionStore'
export type { DeletionKind, PendingItem, PendingBatch } from '../core/store/pendingDeletionStore'
export { useConfirm } from '../core/hooks/useConfirm'
export { useContextMenu, ContextMenuItem, ContextMenuSeparator, ContextMenuProvider } from '../core/shell/ContextMenuProvider'
export { SidebarNavItem } from '../core/shell/SidebarNavItem'
export { useUiStore } from '../core/store/uiStore'
export { default as HeaderActions } from '../core/shell/HeaderActions'
export { useChromelessHeader } from '../core/shell/useChromelessHeader'
// Chrome standard des apps avancées (topbar unifiée) — partagé par les modules
// WorkspaceShell (keestore, office, paintsharp…). `MenuItem` est ré-exposé sous
// `WorkspaceMenuItem` car `@ui` exporte déjà un `MenuItem` dans le chunk partagé.
export { WorkspaceShell, MenuBar, WORKSPACE_DARK, WORKSPACE_LIGHT, WORKSPACE_OFFICE, DockArea } from '../core/shell/workspace'
export type { WorkspaceTheme, DockPanel, DockController, DockTheme } from '../core/shell/workspace'
export type { MenuItem as WorkspaceMenuItem } from '../core/shell/workspace'
// Hook d'autosave debouncé partagé (paintsharp, office, flow, notes…).
export { useDebouncedAutosave } from '../core/hooks/useAutosave'
// Autres utilitaires core partagés par les modules.
export { formatSize } from '../core/utils/format'
export { useDraggable } from '../core/hooks/useDraggable'
export { prompt } from '../core/store/promptStore'
// Image picker — THE way to insert or upload an image anywhere in the app.
export { openImagePicker, openImagePickerMany, pickImageFile, pickImageFiles } from '../core/store/imagePickerStore'
export type { ImagePickResult, ImagePickerOptions } from '../core/store/imagePickerStore'
// Modules add their own source tab (e.g. photos) here.
export { ImageSourceRegistry } from '../core/registry/ImageSourceRegistry'
// Sharing — THE way to share anything; modules add sections via ShareRegistry.
export { openShare, useShareStore } from '../core/store/shareStore'
export type { ShareApi, ShareOptions, ShareRecipient, ShareCollaborator } from '../core/store/shareStore'
export { ShareRegistry, ShareRecipientKinds } from '../core/registry/ShareRegistry'
export type { ShareRecipientKind } from '../core/registry/ShareRegistry'
export type { ShareSection, ShareSectionProps, ShareTarget } from '../core/registry/ShareRegistry'
export type { ImageSource, ImageSourceProps } from '../core/registry/ImageSourceRegistry'
export { default as DashboardWidget } from '../core/widgets/DashboardWidget'
export { default as PdfViewerModal } from '../core/components/PdfViewerModal'
export { useWidgetSize, WidgetSizeContext } from '../core/widgets/WidgetSizeContext'
export { useWsStore } from '../core/store/wsStore'
export { getDateLocale } from '../core/i18n/dateLocale'
export { getIcon, ICON_MAP } from '../core/utils/iconMap'
// Registre d'override de composants (thèmes "skins") — un module peut enregistrer
// ses propres clés thématisables et/ou des overrides ; les scripts de thème
// reçoivent ce registre via l'API de thème au chargement.
export { ComponentRegistry, ThemeScopeContext, ThemePreviewContext, themed } from '../ui/themeRegistry'
export type { User } from '../core/types'
// Shared voice dictation (core search bar + assistant-style modules):
// hook + toast éditable centré, branché sur le backend STT auto-hébergé.
export { useVoiceDictation } from '../core/shell/useVoiceDictation'
export type { VoiceDictation, UseVoiceDictationOptions } from '../core/shell/useVoiceDictation'
// Session STT bas niveau (streaming micro → backend auto-hébergé) : pour les
// modules qui veulent piloter leur PROPRE UI de dictée (ex. panneau façon Word
// d'Office insérant en direct dans le document).
export { startVoiceSession } from '../core/shell/voiceStt'
export type { VoiceSession, VoiceCallbacks, VoiceErrorCode } from '../core/shell/voiceStt'

/**
 * Version de contrat du SDK. À incrémenter UNIQUEMENT sur un changement cassant
 * (export retiré/renommé, signature de registry modifiée). Le loader rejette
 * proprement un module dont la `sdk_version` déclarée diffère.
 */
export const SDK_VERSION = 1 as const
