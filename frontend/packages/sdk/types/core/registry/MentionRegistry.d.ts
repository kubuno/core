import type { MentionProvider } from '@ui';
export type { MentionItem, MentionProvider } from '@ui';
/** The extension point string modules register their provider at. */
export declare const MENTIONS_PROVIDER_POINT = "mentions.provider";
/** Register (or replace) a module's mention provider. */
export declare function registerMentionProvider(moduleId: string, provider: MentionProvider): void;
/** Remove a module's mention provider. */
export declare function unregisterMentionProvider(moduleId: string): void;
/** Every registered mention provider (insertion order). */
export declare function getMentionProviders(): MentionProvider[];
/**
 * Bridge the `@ui` default-provider resolver to this registry. Called once at
 * host bootstrap (main.tsx) so that a mention-aware field given no explicit
 * `providers` discovers whatever modules registered here.
 */
export declare function installDefaultMentionSource(): void;
