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
export * from '../core/registry/MentionRegistry';
export * from '../core/registry/DataTransferRegistry';
export { DataCardView } from '../core/registry/DataCardView';
export { openLabelPicker, resourceKeyOf } from '../core/store/labelPickerStore';
export { labelsApi } from '../core/api/labels';
export type { CoreLabel, LabelBrowseItem } from '../core/api/labels';
export * from '../core/registry/CollapseSidebarRegistry';
export * from '../core/registry/ModuleMenuRegistry';
export * from '../core/registry/calendarOverlay';
export * from '../core/registry/datepickerDayPanel';
export * from '../core/registry/domainDiagnostics';
export * from '../core/slots/SlotRegistry';
export * from '../core/widgets/WidgetRegistry';
export * from '../core/store/sidebarStore';
export * from '../core/store/toolbarStore';
export * from '../core/store/searchStore';
export * from '../core/store/rightPanelStore';
export * from '../core/i18n';
export { default as i18n } from '../core/i18n';
export { api } from '../core/api/client';
export { signedUrl, signedUrls, useSignedUrl, signedSocketUrl, downloadSignedUrl, openSignedUrl, } from '../core/api/signedUrl';
export type { TicketPurpose, SignedUrlOptions } from '../core/api/signedUrl';
export { navigate } from '../core/navigation';
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
export { WorkspaceShell, MenuBar, WORKSPACE_DARK, WORKSPACE_LIGHT, WORKSPACE_OFFICE, DockArea } from '../core/shell/workspace';
export type { WorkspaceTheme, DockPanel, DockController, DockTheme } from '../core/shell/workspace';
export type { MenuItem as WorkspaceMenuItem } from '../core/shell/workspace';
export { useDebouncedAutosave } from '../core/hooks/useAutosave';
export { formatSize } from '../core/utils/format';
export { useDraggable } from '../core/hooks/useDraggable';
export { prompt } from '../core/store/promptStore';
export { openImagePicker, openImagePickerMany, pickImageFile, pickImageFiles } from '../core/store/imagePickerStore';
export type { ImagePickResult, ImagePickerOptions } from '../core/store/imagePickerStore';
export { ImageSourceRegistry } from '../core/registry/ImageSourceRegistry';
export { openShare, useShareStore } from '../core/store/shareStore';
export type { ShareApi, ShareOptions, ShareRecipient, ShareCollaborator } from '../core/store/shareStore';
export { ShareRegistry, ShareRecipientKinds } from '../core/registry/ShareRegistry';
export type { ShareRecipientKind } from '../core/registry/ShareRegistry';
export type { ShareSection, ShareSectionProps, ShareTarget } from '../core/registry/ShareRegistry';
export type { ImageSource, ImageSourceProps } from '../core/registry/ImageSourceRegistry';
export { default as DashboardWidget } from '../core/widgets/DashboardWidget';
export { default as PdfViewerModal } from '../core/components/PdfViewerLazy';
export { useWidgetSize, WidgetSizeContext } from '../core/widgets/WidgetSizeContext';
export { useWsStore } from '../core/store/wsStore';
export { getIcon, ICON_MAP } from '../core/utils/iconMap';
export { ComponentRegistry, ThemeScopeContext, ThemePreviewContext, themed } from '../ui/themeRegistry';
export type { User } from '../core/types';
export { useVoiceDictation } from '../core/shell/useVoiceDictation';
export type { VoiceDictation, UseVoiceDictationOptions } from '../core/shell/useVoiceDictation';
export { startVoiceSession } from '../core/shell/voiceStt';
export type { VoiceSession, VoiceCallbacks, VoiceErrorCode } from '../core/shell/voiceStt';
/**
 * Version de contrat du SDK. À incrémenter sur tout changement cassant
 * (export retiré/renommé, signature de registry modifiée). Le loader rejette
 * proprement un module dont la `sdkVersion` déclarée diffère.
 *
 * ⚠️ Ce handshake ne suffit PAS à lui seul : un export retiré/renommé fait
 * échouer la LIAISON ES du bundle du module (« does not provide an export named
 * 'X' ») AVANT que ce garde-fou ne s'exécute — le module bâti contre l'ancienne
 * surface disparaissait alors en silence. Deux filets complètent donc ce
 * numéro :
 *   1. tout retrait d'export doit s'accompagner d'un bump ici ET d'un bridge de
 *      compat pour les modules déjà installés (cf. `getDateLocale` ci-dessous) ;
 *   2. si un module échoue quand même à se charger, le loader le recense
 *      (`moduleLoadStore`) et la cloche l'annonce aux opérateurs
 *      (`useModuleLoadAlerts`) au lieu de le laisser disparaître sans trace.
 */
export declare const SDK_VERSION: 1;
export * from '../core/intl/datetime';
export { getDateLocale } from '../core/intl/dateFnsLocaleShim';
export type { DateFnsLocale } from '../core/intl/dateFnsLocaleShim';
