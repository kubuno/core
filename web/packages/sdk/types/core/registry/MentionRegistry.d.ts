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
/**
 * The instance's own people, offered wherever `@` is typed.
 *
 * A mention field asked the modules and nobody else: with contacts absent — or
 * simply holding nobody by that name — typing `@` did nothing at all, which
 * reads as a broken feature rather than an empty one. Yet the one thing every
 * instance always has is its own accounts, and they belong to the core.
 *
 * So the core registers itself as a provider, under the same point and the same
 * rules as any module. It answers the directory's own endpoint, which means the
 * administrator's sharing policy applies untouched: a closed directory answers
 * nobody, a narrowed one answers the caller's unit, and an address travels only
 * when the policy shares it.
 */
export declare function installDirectoryMentions(): void;
